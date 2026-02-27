/**
 * CAPTCHA Audit Script
 *
 * Checks all congressional contact forms for CAPTCHA presence.
 * Uses a lightweight Claude Vision check (not full form analysis).
 *
 * Run with: npx tsx src/lib/form-automation/audit.ts
 *
 * Options:
 *   --limit=N      Only check first N forms (for testing)
 *   --headless     Run in headless mode (default: true)
 *   --resume       Resume from last checkpoint
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import type { CaptchaAuditResult, CaptchaAuditSummary } from './types';
import { findRepresentativesWithForms } from './index';
import {
  getBrowser,
  createContext,
  createPage,
  navigateTo,
  takeScreenshot,
  closeContext,
  shutdownBrowser,
} from './browser';

// Output paths
const RESULTS_FILE = path.join(process.cwd(), 'src', 'data', 'form-audit-results.json');
const CHECKPOINT_FILE = path.join(process.cwd(), 'src', 'data', 'form-audit-checkpoint.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'audit-screenshots');

// Claude Vision prompt for CAPTCHA-only detection (lightweight)
const CAPTCHA_CHECK_PROMPT = `Look at this screenshot of a web page. Your ONLY task is to determine if there is a CAPTCHA present.

Look for ANY of these:
- reCAPTCHA ("I'm not a robot" checkbox, Google reCAPTCHA badge)
- hCaptcha
- Image-based CAPTCHAs (select images, identify objects)
- Text-based CAPTCHAs (type the characters you see)
- Math puzzles or other human verification challenges
- Any "verify you are human" prompts
- Checkbox with "I am human" or similar

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "hasCaptcha": true|false,
  "captchaType": "recaptcha"|"hcaptcha"|"image"|"text"|"other"|null,
  "confidence": 0.0-1.0
}`;

/**
 * Check a single URL for CAPTCHA presence using Claude Vision
 */
async function checkForCaptcha(
  screenshotBase64: string,
  apiKey: string
): Promise<{ hasCaptcha: boolean; captchaType?: string; confidence: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', // Use Sonnet for cost-efficiency
      max_tokens: 256, // Small response needed
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: CAPTCHA_CHECK_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract text from response
  let responseText = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      responseText += block.text;
    }
  }

  // Parse JSON response
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      hasCaptcha: Boolean(parsed.hasCaptcha),
      captchaType: parsed.captchaType || undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    };
  } catch {
    console.warn('Failed to parse CAPTCHA check response:', responseText);
    return { hasCaptcha: false, confidence: 0 };
  }
}

/**
 * Load checkpoint if resuming
 */
function loadCheckpoint(): Set<string> {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      return new Set(data.completed || []);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

/**
 * Save checkpoint
 */
function saveCheckpoint(completed: Set<string>): void {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ completed: Array.from(completed) }, null, 2)
  );
}

/**
 * Load existing results if resuming
 */
function loadExistingResults(): CaptchaAuditResult[] {
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      return data.results || [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Save results to JSON file
 */
function saveResults(results: CaptchaAuditResult[]): void {
  const withCaptcha = results.filter((r) => r.hasCaptcha && r.loadedSuccessfully);
  const withoutCaptcha = results.filter((r) => !r.hasCaptcha && r.loadedSuccessfully);
  const failedToLoad = results.filter((r) => !r.loadedSuccessfully);

  const summary: CaptchaAuditSummary = {
    total: results.length,
    withCaptcha: withCaptcha.length,
    withoutCaptcha: withoutCaptcha.length,
    failedToLoad: failedToLoad.length,
    auditedAt: new Date().toISOString(),
    results,
  };

  // Ensure directory exists
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));
}

/**
 * Main audit function
 */
async function runAudit(options: {
  limit?: number;
  headless?: boolean;
  resume?: boolean;
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set in .env.local');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Congressional Contact Form CAPTCHA Audit');
  console.log('='.repeat(60));

  // Find all representatives with contact forms
  console.log('\nLoading representatives...');
  const allReps = await findRepresentativesWithForms();
  console.log(`Found ${allReps.length} representatives with contact forms`);

  // Load checkpoint if resuming
  const completedIds = options.resume ? loadCheckpoint() : new Set<string>();
  const results = options.resume ? loadExistingResults() : [];

  if (options.resume && completedIds.size > 0) {
    console.log(`Resuming from checkpoint: ${completedIds.size} already completed`);
  }

  // Filter to only unprocessed reps
  let reps = allReps.filter((r) => !completedIds.has(r.bioguideId));

  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    reps = reps.slice(0, options.limit);
    console.log(`Limiting to first ${options.limit} forms`);
  }

  console.log(`Will audit ${reps.length} forms\n`);

  // Create screenshots directory
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Launch browser
  const browser = await getBrowser({
    headless: options.headless !== false,
    timeout: 30000,
  });

  let processed = 0;
  const startTime = Date.now();

  for (const rep of reps) {
    processed++;
    const progress = `[${processed}/${reps.length}]`;

    console.log(`${progress} Checking ${rep.name} (${rep.bioguideId})...`);

    const result: CaptchaAuditResult = {
      bioguideId: rep.bioguideId,
      name: rep.name,
      formUrl: rep.contactFormUrl,
      hasCaptcha: false,
      loadedSuccessfully: false,
      auditedAt: new Date().toISOString(),
    };

    const context = await createContext(browser);
    const page = await createPage(context, 30000);

    try {
      // Navigate to the form
      await navigateTo(page, rep.contactFormUrl);
      result.loadedSuccessfully = true;

      // Take screenshot
      const screenshotBase64 = await takeScreenshot(page, { fullPage: true });

      // Save screenshot for reference
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${rep.bioguideId}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check for CAPTCHA using Claude Vision
      const captchaCheck = await checkForCaptcha(screenshotBase64, apiKey);
      result.hasCaptcha = captchaCheck.hasCaptcha;
      result.captchaType = captchaCheck.captchaType as CaptchaAuditResult['captchaType'];

      const status = result.hasCaptcha ? `⚠️  CAPTCHA (${result.captchaType})` : '✓ No CAPTCHA';
      console.log(`  ${status}`);
    } catch (error) {
      result.error = String(error);
      console.log(`  ✗ Failed: ${error}`);
    } finally {
      await closeContext(context);
    }

    // Add to results and save checkpoint
    results.push(result);
    completedIds.add(rep.bioguideId);
    saveCheckpoint(completedIds);

    // Save intermediate results every 10 forms
    if (processed % 10 === 0) {
      saveResults(results);
      console.log(`  (Checkpoint saved: ${processed} forms processed)`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Final save
  saveResults(results);

  // Cleanup
  await shutdownBrowser();

  // Print summary
  const withCaptcha = results.filter((r) => r.hasCaptcha && r.loadedSuccessfully);
  const withoutCaptcha = results.filter((r) => !r.hasCaptcha && r.loadedSuccessfully);
  const failedToLoad = results.filter((r) => !r.loadedSuccessfully);

  const elapsedMs = Date.now() - startTime;
  const elapsedMin = Math.round(elapsedMs / 60000);

  console.log('\n' + '='.repeat(60));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal forms audited: ${results.length}`);
  console.log(`Time elapsed: ${elapsedMin} minutes`);
  console.log(`\nResults:`);
  console.log(`  ✓ CAPTCHA-free: ${withoutCaptcha.length} (${((withoutCaptcha.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`  ⚠️  With CAPTCHA: ${withCaptcha.length} (${((withCaptcha.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`  ✗ Failed to load: ${failedToLoad.length} (${((failedToLoad.length / results.length) * 100).toFixed(1)}%)`);

  if (withCaptcha.length > 0) {
    console.log(`\nRepresentatives with CAPTCHAs:`);
    for (const r of withCaptcha.slice(0, 20)) {
      console.log(`  - ${r.name} (${r.captchaType || 'unknown'})`);
    }
    if (withCaptcha.length > 20) {
      console.log(`  ... and ${withCaptcha.length - 20} more`);
    }
  }

  console.log(`\nResults saved to: ${RESULTS_FILE}`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);

  // Cleanup checkpoint file on successful completion
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }
}

// Parse command line arguments
function parseArgs(): { limit?: number; headless?: boolean; resume?: boolean } {
  const args: { limit?: number; headless?: boolean; resume?: boolean } = {
    headless: true,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--headless') {
      args.headless = true;
    } else if (arg === '--no-headless') {
      args.headless = false;
    } else if (arg === '--resume') {
      args.resume = true;
    }
  }

  return args;
}

// Run the audit
const args = parseArgs();
runAudit(args).catch((error) => {
  console.error('Audit failed:', error);
  shutdownBrowser().finally(() => process.exit(1));
});
