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

async function check(browser: Browser, bioguide: string): Promise<Row> {
  const def = loadDefinition(bioguide);
  const started = Date.now();
  if (!def) return { bioguide, url: null, outcome: 'skipped', detail: 'no definition', ms: 0 };
  if (!isAutomatable(def)) {
    return { bioguide, url: entryUrl(def), outcome: 'skipped', detail: 'needs a challenge solved by a person', ms: 0 };
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; MyDemocracy form check; +https://www.mydemocracy.app)',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  try {
    const result = await runDefinition(page, def, VALUES, { dryRun: true, stepTimeoutMs: 20_000 });
    return {
      bioguide,
      url: entryUrl(def),
      outcome: result.ok ? 'binds' : 'stale',
      detail: result.ok ? result.matched : `${result.reason}`,
      ms: Date.now() - started,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const ids = only.length > 0 ? only : definedMembers();
  console.log(`checking ${ids.length} contact-form definitions. nothing is submitted.\n`);

  const browser = await chromium.launch({ headless: true });
  const rows: Row[] = [];
  try {
    for (const id of ids) {
      const row = await check(browser, id);
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
