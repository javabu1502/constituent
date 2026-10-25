/**
 * Form Automation Module
 *
 * AI-powered congressional contact form automation using Claude Vision + Playwright.
 *
 * Usage:
 *   import { submitToRepresentative } from '@/lib/form-automation';
 *
 *   const result = await submitToRepresentative('S000033', {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     // ... other fields
 *   });
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';

import type {
  ConstituentData,
  SubmissionResult,
  RepresentativeInfo,
  BrowserOptions,
  AnalyzerConfig,
  FormAnalysis,
} from './types';

import {
  getBrowser,
  createContext,
  createPage,
  navigateTo,
  takeScreenshot,
  closeContext,
  shutdownBrowser,
} from './browser';

import { analyzeForm, enhanceAnalysisFromDOM } from './analyzer';
import { fillForm, preprocessData } from './filler';
import { submitForm, goToNextPage, resolveSubmitButton, type SubmitFormResult } from './submitter';

// Re-export types
export * from './types';

/**
 * Configuration for the automation
 */
/** No congressional contact form is deeper than this. Past it we stop. */
export const MAX_FORM_PAGES = 5;

/**
 * A cheap fingerprint of the page we are filling: where we are plus the shape
 * of the form on it. Two turns of the multi-page loop producing the same
 * signature means the "next" button did not take us anywhere.
 */
export async function pageSignature(page: import('playwright').Page): Promise<string> {
  try {
    const counts = await page.evaluate(() => {
      const n = (sel: string) => document.querySelectorAll(sel).length;
      return `${n('input')}/${n('textarea')}/${n('select')}/${n('button')}`;
    });
    return `${page.url()}|${counts}`;
  } catch {
    return page.url();
  }
}

export interface AutomationConfig {
  /** Browser options */
  browser?: BrowserOptions;
  /** Analyzer (Claude) config */
  analyzer: AnalyzerConfig;
  /** Whether to actually submit (false = dry run) */
  submit?: boolean;
  /** Directory to save debug screenshots */
  debugDir?: string;
}

// Track representatives with CAPTCHAs for logging
const captchaLog: Array<{ bioguideId: string; name: string; formUrl: string; captchaType?: string }> = [];

/**
 * Get the list of representatives with CAPTCHAs (for tracking)
 */
export function getRepresentativesWithCaptchas() {
  return [...captchaLog];
}

/**
 * Submit a message to a representative's contact form
 */
export async function submitToRepresentative(
  bioguideIdOrUrl: string,
  constituentData: ConstituentData,
  config: AutomationConfig
): Promise<SubmitFormResult> {
  const startTime = Date.now();
  let pagesFilled = 0;
  let representativeId: string | undefined;
  let representativeName: string | undefined;

  // Get the contact form URL
  let contactFormUrl: string;
  if (bioguideIdOrUrl.startsWith('http')) {
    contactFormUrl = bioguideIdOrUrl;
  } else {
    representativeId = bioguideIdOrUrl;
    const repInfo = await lookupRepresentative(bioguideIdOrUrl);
    if (!repInfo) {
      return {
        success: false,
        status: 'network_error',
        errorType: 'network',
        message: `Could not find representative with bioguide ID: ${bioguideIdOrUrl}`,
        timeTakenMs: Date.now() - startTime,
        pagesFilled: 0,
        representativeId,
      };
    }
    contactFormUrl = repInfo.contactFormUrl;
    representativeName = repInfo.name;
  }

  console.log(`Opening contact form: ${contactFormUrl}`);

  // Launch browser and navigate
  const browser = await getBrowser(config.browser);
  const context = await createContext(browser);
  const page = await createPage(context, config.browser?.timeout);

  try {
    await navigateTo(page, contactFormUrl);

    // Save debug screenshot if requested
    if (config.debugDir) {
      await takeScreenshot(page, {
        fullPage: true,
        path: path.join(config.debugDir, '01-initial.png'),
      });
    }

    // Preprocess the constituent data
    const processedData = preprocessData(constituentData);

    // Analyze the form
    console.log('Analyzing form with Claude Vision...');
    let analysis = await analyzeForm(page, config.analyzer);

    // Enhance with DOM parsing
    analysis = await enhanceAnalysisFromDOM(page, analysis);

    console.log(`Found ${analysis.fields.length} fields`);
    console.log(`Has CAPTCHA: ${analysis.hasCaptcha}`);
    console.log(`Is multi-page: ${analysis.isMultiPage}`);

    // If CAPTCHA detected, skip immediately and return for email fallback
    if (analysis.hasCaptcha) {
      // Log this representative's CAPTCHA for tracking
      console.log(`[CAPTCHA] ${representativeName || bioguideIdOrUrl} has CAPTCHA (${analysis.captchaType || 'unknown'}): ${contactFormUrl}`);

      if (representativeId) {
        captchaLog.push({
          bioguideId: representativeId,
          name: representativeName || representativeId,
          formUrl: contactFormUrl,
          captchaType: analysis.captchaType,
        });
      }

      return {
        success: false,
        status: 'captcha_required',
        errorType: 'captcha',
        message: 'CAPTCHA detected — falling back to email',
        timeTakenMs: Date.now() - startTime,
        pagesFilled: 0,
        representativeId,
        formUrl: contactFormUrl,
      };
    }

    // Fill the form (handle multi-page forms)
    let currentAnalysis = analysis;
    let fillResult = await fillForm(page, currentAnalysis, processedData);
    pagesFilled++;

    if (config.debugDir) {
      await takeScreenshot(page, {
        fullPage: true,
        path: path.join(config.debugDir, `02-filled-page-${pagesFilled}.png`),
      });
    }

    // Handle multi-page forms.
    //
    // Two guards, both learned the hard way (2026-10-25): neither this loop
    // nor goToNextPage checked that the page actually CHANGED. A "next"
    // button that does not navigate, or an analysis that keeps reporting one
    // more page, span forever: every turn spends a vision call and the job
    // holds its worker lease until the lease expires and it retries. A dry
    // run against one Senate form ran past twenty minutes before being
    // killed. So: stop after MAX_FORM_PAGES, and stop the moment a page
    // repeats one we have already filled.
    const seenPages = new Set<string>([await pageSignature(page)]);
    while (currentAnalysis.isMultiPage && currentAnalysis.nextButtonSelector) {
      if (pagesFilled >= MAX_FORM_PAGES) {
        console.warn(`[form] stopping at the ${MAX_FORM_PAGES}-page limit; the form kept asking for another page.`);
        break;
      }
      console.log('Navigating to next page...');
      const navigated = await goToNextPage(page, currentAnalysis);

      if (!navigated) {
        break;
      }

      const signature = await pageSignature(page);
      if (seenPages.has(signature)) {
        console.warn('[form] the next button did not move us to a new page; stopping.');
        break;
      }
      seenPages.add(signature);

      // Analyze the new page
      currentAnalysis = await analyzeForm(page, config.analyzer);
      currentAnalysis = await enhanceAnalysisFromDOM(page, currentAnalysis);

      // Check for CAPTCHA on this page too
      if (currentAnalysis.hasCaptcha) {
        console.log(`[CAPTCHA] ${representativeName || bioguideIdOrUrl} has CAPTCHA on page ${pagesFilled + 1} (${currentAnalysis.captchaType || 'unknown'}): ${contactFormUrl}`);

        if (representativeId) {
          captchaLog.push({
            bioguideId: representativeId,
            name: representativeName || representativeId,
            formUrl: contactFormUrl,
            captchaType: currentAnalysis.captchaType,
          });
        }

        return {
          success: false,
          status: 'captcha_required',
          errorType: 'captcha',
          message: `CAPTCHA detected on page ${pagesFilled + 1} — falling back to email`,
          timeTakenMs: Date.now() - startTime,
          pagesFilled,
          representativeId,
          formUrl: contactFormUrl,
        };
      }

      // Fill this page
      fillResult = await fillForm(page, currentAnalysis, processedData);
      pagesFilled++;

      if (config.debugDir) {
        await takeScreenshot(page, {
          fullPage: true,
          path: path.join(config.debugDir, `02-filled-page-${pagesFilled}.png`),
        });
      }

      if (!fillResult.success) {
        console.warn('Errors filling page:', fillResult.errors);
      }
    }

    // Submit if not a dry run
    if (config.submit !== false) {
      console.log('Submitting form...');
      const submitResult = await submitForm(page, currentAnalysis, config.analyzer);

      if (config.debugDir) {
        await takeScreenshot(page, {
          fullPage: true,
          path: path.join(config.debugDir, '03-result.png'),
        });
      }

      return {
        ...submitResult,
        pagesFilled,
        representativeId,
        formUrl: contactFormUrl,
      };
    } else {
      // Dry run: resolve the submit button exactly as a live send would, and
      // report it, but never click. A dry run that cannot resolve a submit
      // button is a failure, so the audit catches it before a real send does.
      console.log('Dry run - not submitting');
      const resolved = await resolveSubmitButton(page, currentAnalysis);
      if (!resolved) {
        return {
          success: false,
          status: 'unknown_error',
          errorType: 'unknown',
          message: 'Dry run: form was filled but no submit button could be resolved (search buttons are excluded)',
          timeTakenMs: Date.now() - startTime,
          pagesFilled,
          representativeId,
          formUrl: contactFormUrl,
        };
      }
      const where = resolved.scoped ? 'inside the message form' : 'page-wide';
      console.log(`Dry run resolved submit button: ${resolved.selector} (${where})`);
      return {
        success: true,
        status: 'success',
        message: `Dry run completed - form was filled but not submitted (submit: ${resolved.selector}, ${where})`,
        timeTakenMs: Date.now() - startTime,
        pagesFilled,
        representativeId,
        formUrl: contactFormUrl,
        submitSelector: resolved.selector,
      };
    }
  } catch (error) {
    console.error('Automation error:', error);

    // Try to capture a screenshot of the error state
    let screenshotBase64: string | undefined;
    try {
      screenshotBase64 = await takeScreenshot(page, { fullPage: true });
      if (config.debugDir) {
        await takeScreenshot(page, {
          fullPage: true,
          path: path.join(config.debugDir, 'error.png'),
        });
      }
    } catch {
      // Ignore screenshot errors
    }

    return {
      success: false,
      status: 'unknown_error',
      errorType: 'unknown',
      message: `Automation failed: ${error}`,
      screenshotBase64,
      timeTakenMs: Date.now() - startTime,
      pagesFilled,
      representativeId,
      formUrl: contactFormUrl,
    };
  } finally {
    await closeContext(context);
  }
}

/**
 * Look up a representative's contact form URL from local data
 */
export async function lookupRepresentative(bioguideId: string): Promise<RepresentativeInfo | null> {
  // Try to find the legislator data file
  const dataDir = path.join(process.cwd(), 'src', 'data', 'legislators', 'federal');
  const legislatorsFile = path.join(dataDir, 'legislators-current.yaml');

  if (!fs.existsSync(legislatorsFile)) {
    console.error(`Legislators file not found: ${legislatorsFile}`);
    return null;
  }

  const content = fs.readFileSync(legislatorsFile, 'utf-8');
  const legislators = parse(content) as Array<{
    id: { bioguide: string };
    name: { official_full?: string; first: string; last: string };
    terms: Array<{ contact_form?: string; url?: string }>;
  }>;

  for (const leg of legislators) {
    if (leg.id.bioguide === bioguideId) {
      // Get the most recent term with a contact form
      const terms = leg.terms || [];
      for (let i = terms.length - 1; i >= 0; i--) {
        const term = terms[i];
        if (term.contact_form) {
          return {
            bioguideId,
            name: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
            contactFormUrl: term.contact_form,
            website: term.url,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find all representatives with contact forms
 */
export async function findRepresentativesWithForms(): Promise<RepresentativeInfo[]> {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'legislators', 'federal');
  const legislatorsFile = path.join(dataDir, 'legislators-current.yaml');

  if (!fs.existsSync(legislatorsFile)) {
    return [];
  }

  const content = fs.readFileSync(legislatorsFile, 'utf-8');
  const legislators = parse(content) as Array<{
    id: { bioguide: string };
    name: { official_full?: string; first: string; last: string };
    terms: Array<{ contact_form?: string; url?: string }>;
  }>;

  const results: RepresentativeInfo[] = [];

  for (const leg of legislators) {
    const terms = leg.terms || [];
    for (let i = terms.length - 1; i >= 0; i--) {
      const term = terms[i];
      if (term.contact_form) {
        results.push({
          bioguideId: leg.id.bioguide,
          name: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
          contactFormUrl: term.contact_form,
          website: term.url,
        });
        break;
      }
    }
  }

  return results;
}

/**
 * Analyze a form without submitting (for testing/debugging)
 */
export async function analyzeFormOnly(
  url: string,
  config: AutomationConfig
): Promise<FormAnalysis> {
  const browser = await getBrowser(config.browser);
  const context = await createContext(browser);
  const page = await createPage(context, config.browser?.timeout);

  try {
    await navigateTo(page, url);

    let analysis = await analyzeForm(page, config.analyzer);
    analysis = await enhanceAnalysisFromDOM(page, analysis);

    return analysis;
  } finally {
    await closeContext(context);
  }
}

/**
 * Shutdown the browser (call when done with all automation)
 */
export async function shutdown(): Promise<void> {
  await shutdownBrowser();
}
