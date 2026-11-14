/**
 * Does every contact-form recipe still match the page it describes?
 *
 * Walks each vendored definition in a real browser, fills every field with
 * obviously fake values, and stops immediately before the submit. Nothing is
 * ever sent: the point is to learn which recipes have gone stale while nobody
 * was looking, before a constituent's letter is riding on one.
 *
 * Several definitions were last touched in 2023. A stale one does not throw.
 * It fills nothing, the page still answers 200, and the send reports success.
 * That is how the first production webform send came to type a letter into a
 * site search box.
 *
 * Usage:
 *   npx tsx scripts/contact-form-dryrun.ts            # every automatable one
 *   npx tsx scripts/contact-form-dryrun.ts C001113    # just these
 */
import { chromium, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import {
  definedMembers,
  loadDefinition,
  isAutomatable,
  entryUrl,
  type FormValues,
} from '../src/lib/form-automation/contact-congress';
import { runDefinition } from '../src/lib/form-automation/contact-congress-runner';

/** Unmistakably fake, so a recipe that submits by accident is obvious. */
const VALUES: FormValues = {
  namePrefix: 'Ms.',
  nameFirst: 'Dryrun',
  nameLast: 'Testaccount',
  email: 'dryrun@example.com',
  phone: '7755550100',
  addressStreet: '100 Test Street',
  addressCity: 'Reno',
  addressState: 'NV',
  addressStateFull: 'Nevada',
  addressZip5: '89501',
  subject: 'Test of an automated form check, please disregard',
  message: 'This is an automated check that a contact form still works. It was not submitted.',
  topic: 'Other',
};

interface Row {
  bioguide: string;
  url: string | null;
  outcome: 'binds' | 'stale' | 'skipped';
  detail: string;
  ms: number;
}

/**
 * Is there a challenge on the page right now that a person has to solve.
 *
 * Not the same question as whether the definition carries a `recaptcha` step.
 * Maintainers add that step and leave it, and offices change their sites:
 * four of the eight definitions marked that way serve no challenge at all
 * today, and Cortez Masto's page accepted a real message this afternoon.
 *
 * So the live page decides. A reCAPTCHA v2 widget renders a checkbox and
 * carries a sitekey; that one needs a person. Anything else is worth trying,
 * because a submission that is refused simply falls back to the email path.
 */
async function liveChallenge(page: import('playwright').Page): Promise<boolean> {
  try {
    return (await page.locator('.g-recaptcha, [data-sitekey], iframe[src*="recaptcha/api2/anchor"]').count()) > 0;
  } catch {
    return false;
  }
}

async function check(browser: Browser, bioguide: string, probe = false): Promise<Row> {
  const def = loadDefinition(bioguide);
  const started = Date.now();
  if (!def) return { bioguide, url: null, outcome: 'skipped', detail: 'no definition', ms: 0 };


  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; MyDemocracy form check; +https://www.mydemocracy.app)',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  try {
    // Definitions marked as needing a challenge are walked anyway, so the
    // live page can say whether that is still true.
    const result = await runDefinition(page, def, VALUES, {
      dryRun: true,
      probePastChallenge: probe || !isAutomatable(def),
      stepTimeoutMs: 20_000,
    });
    if (result.ok && (await liveChallenge(page))) {
      return { bioguide, url: entryUrl(def), outcome: 'skipped', detail: 'a challenge on the page needs a person to solve it', ms: Date.now() - started };
    }
    return {
      bioguide,
      url: entryUrl(def),
      outcome: result.ok ? 'binds' : 'stale',
      detail: result.ok
        ? (isAutomatable(def) ? result.matched : `${result.matched}; the definition's challenge step is no longer on the page`)
        : `${result.reason}`,
      ms: Date.now() - started,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  // --probe walks past a challenge step to learn whether the rest of the form
  // still fills. It never submits: the dry run stops before that either way.
  const probe = process.argv.includes('--probe');
  const ids = only.length > 0 ? only : definedMembers();
  console.log(`checking ${ids.length} contact-form definitions. nothing is submitted.\n`);

  const browser = await chromium.launch({ headless: true });
  const rows: Row[] = [];
  try {
    for (const id of ids) {
      const row = await check(browser, id, probe);
      rows.push(row);
      const mark = row.outcome === 'binds' ? ' ok ' : row.outcome === 'stale' ? 'STALE' : ' -- ';
      console.log(`  ${mark}  ${id}  ${row.detail.slice(0, 96)}`);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const binds = rows.filter((r) => r.outcome === 'binds');
  const stale = rows.filter((r) => r.outcome === 'stale');
  const skipped = rows.filter((r) => r.outcome === 'skipped');

  console.log(`\nbinds: ${binds.length}   stale: ${stale.length}   skipped: ${skipped.length}`);

  // A run of a few offices prints its results and stops. It must not write
  // the file, which records which offices are deliverable: a three-office
  // check would otherwise erase the other forty-four and the queue would
  // read that as "nothing is automatable".
  if (only.length > 0 || probe) {
    console.log(probe ? '\nprobe run, so the results file was left alone.' : '\npartial run, so the results file was left alone.');
    process.exit(0);
  }

  const out = path.join(process.cwd(), 'src', 'data', 'contact-form-dryrun.json');
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        note: 'Which vendored contact-form recipes still match their page. Nothing was submitted.',
        binds: binds.map((r) => r.bioguide),
        stale: stale.map((r) => ({ bioguide: r.bioguide, reason: r.detail })),
        skipped: skipped.map((r) => ({ bioguide: r.bioguide, reason: r.detail })),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`wrote ${out}`);

  // A stale recipe is not a crash. It is a finding, and the exit code says so
  // for CI without failing the whole job on one office changing its site.
  process.exit(0);
}

main().catch((e) => {
  console.error('dry run itself failed:', e);
  process.exit(1);
});
