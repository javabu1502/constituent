import { chromium } from 'playwright';
import { loadDefinition, isAutomatable, type FormValues } from './contact-congress';
import { runDefinition } from './contact-congress-runner';
import type { SubmissionResult } from './types';

/**
 * Filing a constituent's message by following the office's own form recipe.
 *
 * The other path analyses an unfamiliar page with a vision model and guesses
 * which field is which. This one reads a definition that names every field by
 * selector, so there is nothing to guess. It is the better path wherever a
 * definition exists and still binds.
 *
 * Success is the definition's own confirmation text and nothing else. A
 * stale recipe fills nothing and leaves a page answering 200, so "we did not
 * crash" is not evidence a congressional office received anything.
 */
export interface RecipeSubmitInput {
  prefix?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  subject: string;
  message: string;
  topic?: string;
}

export async function submitByRecipe(
  bioguide: string,
  input: RecipeSubmitInput,
  opts: { headless?: boolean; timeoutMs?: number; challengeToken?: string | null } = {},
): Promise<SubmissionResult> {
  const started = Date.now();
  const def = loadDefinition(bioguide);

  if (!def) {
    return { success: false, status: 'unknown_error', errorType: 'unknown', message: `no contact-form definition for ${bioguide}`, pagesFilled: 0, timeTakenMs: Date.now() - started };
  }
  if (!isAutomatable(def) && !opts.challengeToken) {
    // A challenge needs a person. Refusing is honest; pressing submit and
    // hoping is not delivery. With a token the constituent has already
    // answered it, so the run goes ahead.
    return { success: false, status: 'captcha_required', errorType: 'captcha', message: 'this office requires a challenge a person must solve', pagesFilled: 0, timeTakenMs: Date.now() - started };
  }

  const values: FormValues = {
    namePrefix: input.prefix,
    nameFirst: input.firstName,
    nameLast: input.lastName,
    email: input.email,
    phone: input.phone,
    addressStreet: input.street,
    addressCity: input.city,
    addressState: input.state,
    addressZip5: input.zip.slice(0, 5),
    subject: input.subject,
    message: input.message,
    topic: input.topic,
  };

  const browser = await chromium.launch({ headless: opts.headless !== false });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; MyDemocracy constituent mail; +https://www.mydemocracy.app)',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(opts.timeoutMs ?? 30_000);
    const outcome = await runDefinition(page, def, values, { stepTimeoutMs: opts.timeoutMs ?? 30_000, challengeToken: opts.challengeToken });
    const timeTakenMs = Date.now() - started;

    if (outcome.ok) {
      return { success: true, status: 'success', message: `office confirmation matched: ${outcome.matched}`, pagesFilled: 1, timeTakenMs };
    }
    return {
      success: false,
      status: 'validation_error',
      errorType: 'validation',
      message: outcome.reason,
      pagesFilled: 0,
      timeTakenMs,
    };
  } catch (e) {
    return { success: false, status: 'network_error', errorType: 'network', message: (e as Error).message.slice(0, 300), pagesFilled: 0, timeTakenMs: Date.now() - started };
  } finally {
    await browser.close().catch(() => {});
  }
}

/** `recipe:<bioguide>` is how the queue asks for this path. */
export function recipeBioguide(formUrl: string): string | null {
  return formUrl.startsWith('recipe:') ? formUrl.slice('recipe:'.length) : null;
}
