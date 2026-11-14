import type { Page } from 'playwright';
import {
  chooseOption,
  substitute,
  type ContactFormDefinition,
  type FormValues,
  type Step,
} from './contact-congress';

/**
 * Carrying out a contact-form recipe in a real browser.
 *
 * Separate from the parser so the definitions can be read, counted and
 * audited anywhere, while only this file needs Playwright.
 *
 * The governing rule is that silence is not success. These recipes are
 * community-maintained and some are three years old; a stale selector fills
 * nothing and the page still answers 200. So a run reports delivered only
 * when the definition's own success matcher agrees, and a required field that
 * could not be filled fails the whole run rather than submitting a letter
 * with holes in it.
 */

export type RunOutcome =
  | { ok: true; matched: string }
  | { ok: false; reason: string; failedStep?: string; screenshotBase64?: string };

export interface RunOptions {
  /** Walk every step except the final submit. Used by the dry run. */
  dryRun?: boolean;
  /**
   * Walk past a challenge step instead of refusing at it, to learn whether
   * the form fills at all. Only meaningful with dryRun, which stops before
   * submitting, and the runner refuses to combine it with a real send.
   *
   * Worth probing because a page carrying reCAPTCHA is not necessarily a
   * page that blocks: Cortez Masto's form loads it and accepted a real
   * message anyway, which is the invisible scoring kind.
   */
  probePastChallenge?: boolean;
  /**
   * A reCAPTCHA token the constituent produced by solving the office's own
   * challenge, rendered on our page. Supplying one lets the challenge step
   * proceed; without one it still refuses.
   */
  challengeToken?: string | null;
  /** Per-step ceiling. The whole run is bounded by the caller. */
  stepTimeoutMs?: number;
  onStep?: (step: Step, index: number) => void;
}

const DEFAULT_STEP_TIMEOUT = 20_000;

/** A step's selector, with variables already substituted. */
function sel(raw: string | undefined, values: FormValues): string | null {
  if (!raw) return null;
  return substitute(raw, values);
}

/**
 * Whether this step is the one that submits.
 *
 * The dry run has to stop before it, and "the last click_on" is the shape
 * every one of these definitions uses.
 */
export function submitStepIndex(def: ContactFormDefinition): number {
  for (let i = def.steps.length - 1; i >= 0; i--) {
    if (def.steps[i].kind === 'click_on') return i;
  }
  return -1;
}

export async function runDefinition(
  page: Page,
  def: ContactFormDefinition,
  values: FormValues,
  opts: RunOptions = {},
): Promise<RunOutcome> {
  const timeout = opts.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT;
  const stopAt = opts.dryRun ? submitStepIndex(def) : -1;
  // Steps that failed without being fatal. Reported so a decaying recipe is
  // visible long before it stops working.
  const softFailures: string[] = [];

  for (let i = 0; i < def.steps.length; i++) {
    if (stopAt >= 0 && i >= stopAt) break;
    const step = def.steps[i];
    opts.onStep?.(step, i);
    const where = `${step.kind}[${i}]`;

    try {
      switch (step.kind) {
        case 'visit': {
          const url = typeof step.value === 'string' ? substitute(step.value, values) : null;
          if (!url) return { ok: false, reason: 'step has no url', failedStep: where };
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          break;
        }

        case 'wait': {
          const seconds = Number(step.value ?? 1);
          await page.waitForTimeout(Math.min(Math.max(seconds, 0), 30) * 1000);
          break;
        }

        case 'javascript': {
          // Decoration, almost always. These scripts strip a header, hide a
          // stylesheet, or style the challenge box for a human looking at a
          // proxied page. Lee's definition failed the whole letter because
          // ".header-top" no longer exists on his site.
          //
          // So a script that throws is noted and skipped. What a run is
          // actually judged on is the required fields below and the office's
          // own confirmation text, both of which are verifiable.
          for (const f of step.fields) {
            if (!f.value) continue;
            try {
              await page.evaluate(f.value);
            } catch (e) {
              softFailures.push(`${where}: ${(e as Error).message.split('\n')[0].slice(0, 80)}`);
            }
          }
          break;
        }

        case 'find': {
          // Waiting for something to appear. If it genuinely never does, the
          // fill_in below fails on a required field and takes the run with
          // it, so this does not need to be fatal on its own.
          for (const f of step.fields) {
            const s = sel(f.selector, values);
            if (!s) continue;
            const wait = (f.options?.wait ?? 0) * 1000 || timeout;
            try {
              await page.waitForSelector(s, { timeout: Math.min(wait, timeout), state: 'attached' });
            } catch (e) {
              softFailures.push(`${where}: ${(e as Error).message.split('\n')[0].slice(0, 80)}`);
            }
          }
          break;
        }

        case 'fill_in': {
          for (const f of step.fields) {
            const s = sel(f.selector, values);
            if (!s) continue;
            const value = substitute(f.value ?? '', values);
            try {
              await page.fill(s, value, { timeout });
            } catch (e) {
              // A required field we cannot fill means the recipe no longer
              // matches the page. Submitting anyway sends a letter with a
              // hole in it, under a constituent's name.
              if (f.required) {
                return { ok: false, reason: `required field could not be filled: ${f.name ?? s}`, failedStep: where };
              }
              void e;
            }
          }
          break;
        }

        case 'select': {
          for (const f of step.fields) {
            const s = sel(f.selector, values);
            if (!s) continue;
            const wanted = substitute(f.value ?? '', values);
            // A dropdown accepts only what it lists, and every office writes
            // its own topic taxonomy. Ours is almost never on their list, so
            // pick the nearest thing that is rather than sending a value the
            // form will reject and failing the whole letter over a category.
            const value = f.allowedOptions?.length ? (chooseOption(wanted, f.allowedOptions) ?? wanted) : wanted;
            try {
              await page.selectOption(s, { label: value }, { timeout });
            } catch {
              try {
                await page.selectOption(s, value, { timeout });
              } catch (e) {
                if (f.required) {
                  return { ok: false, reason: `required option could not be chosen: ${f.name ?? s}`, failedStep: where };
                }
                void e;
              }
            }
          }
          break;
        }

        case 'check':
        case 'uncheck':
        case 'choose': {
          for (const f of step.fields) {
            const s = sel(f.selector, values);
            if (!s) continue;
            try {
              if (step.kind === 'uncheck') await page.uncheck(s, { timeout });
              else await page.check(s, { timeout });
            } catch (e) {
              if (f.required) return { ok: false, reason: `required box could not be set: ${f.name ?? s}`, failedStep: where };
              void e;
            }
          }
          break;
        }

        case 'click_on': {
          // Tabs, accordions, a newsletter box. Tolerated for the same
          // reason: a click that mattered leaves a required field unfillable,
          // and the final submit is judged by whether the office confirms.
          for (const f of step.fields) {
            const s = sel(f.selector, values);
            if (!s) continue;
            try {
              await page.click(s, { timeout });
            } catch (e) {
              softFailures.push(`${where}: ${(e as Error).message.split('\n')[0].slice(0, 80)}`);
            }
          }
          break;
        }

        case 'recaptcha': {
          // Never solved here, and never by anything automated. Either the
          // constituent already answered the office's own challenge and gave
          // us the token, or this office is not deliverable and says so.
          if (opts.challengeToken) {
            await page.evaluate((token) => {
              const existing = document.querySelector<HTMLTextAreaElement>('#g-recaptcha-response, textarea[name="g-recaptcha-response"]');
              if (existing) { existing.value = token; return; }
              // Some forms only create the field once the widget is answered.
              const form = document.querySelector('form');
              if (!form) return;
              const field = document.createElement('textarea');
              field.name = 'g-recaptcha-response';
              field.id = 'g-recaptcha-response';
              field.style.display = 'none';
              field.value = token;
              form.appendChild(field);
            }, opts.challengeToken);
            break;
          }
          // A probe walks past it only to see whether the rest still fills,
          // and a probe never submits.
          if (opts.probePastChallenge && opts.dryRun) break;
          return { ok: false, reason: 'form requires a challenge a person must solve', failedStep: where };
        }
      }
    } catch (e) {
      return {
        ok: false,
        reason: `${where} failed: ${(e as Error).message.split('\n')[0].slice(0, 160)}`,
        failedStep: where,
      };
    }
  }

  if (opts.dryRun) {
    const note = softFailures.length ? ` (${softFailures.length} cosmetic step(s) skipped)` : '';
    return { ok: true, matched: `reached the submit step with every required field filled${note}` };
  }
  return confirmSuccess(page, def);
}

/**
 * Did the office actually take it.
 *
 * The definition says what its own confirmation page contains. Without that
 * check a run reports success whenever nothing threw, which is precisely the
 * failure these recipes are prone to.
 */
export async function confirmSuccess(page: Page, def: ContactFormDefinition): Promise<RunOutcome> {
  const { contains } = def.success;
  if (!contains) {
    return { ok: false, reason: 'definition has no success matcher, so delivery cannot be confirmed' };
  }
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  } catch {
    // Fall through: the text check below is the thing that decides.
  }
  let body = '';
  try {
    body = await page.content();
  } catch (e) {
    return { ok: false, reason: `could not read the response: ${(e as Error).message.slice(0, 120)}` };
  }
  if (body.includes(contains)) return { ok: true, matched: contains };
  return { ok: false, reason: `confirmation text not found on the response page: "${contains}"` };
}
