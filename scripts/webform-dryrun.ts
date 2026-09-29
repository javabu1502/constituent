/**
 * DRY RUN of the contact-form engine against the CAPTCHA-free Senate offices
 * that do not participate in CWC. Analyzes each form (Claude Vision + DOM),
 * fills it with a clearly labeled test constituent, and NEVER submits
 * (submit: false). Records per-office: fields found, fill success, pages,
 * errors, and a screenshot path. Output: scratchpad/webform-dryrun.json.
 *
 * Run: CWC_ENV_FILE=~/Desktop/constituent/.env.local npx tsx scripts/webform-dryrun.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? path.resolve(process.cwd(), '.env.local') });

const OUT = process.env.WEBFORM_DRYRUN_OUT ?? '/private/tmp/claude-501/-Users-jaredbusker/7e44eae6-35a2-427a-a89c-ea91f6eea687/scratchpad/webform-dryrun.json';
const SHOTS = path.dirname(OUT) + '/webform-shots';

const FORMS: Array<[string, string]> = [
  ['Maria Cantwell', 'https://www.cantwell.senate.gov/public/index.cfm/email-maria'],
  ['Roger F. Wicker', 'https://www.wicker.senate.gov/public/index.cfm/contact'],
  ['John Cornyn', 'https://www.cornyn.senate.gov/contact'],
  ['Richard J. Durbin', 'https://www.durbin.senate.gov/contact/'],
  ['Lindsey Graham', 'https://www.lgraham.senate.gov/public/index.cfm/e-mail-senator-graham'],
  ['Mitch McConnell', 'https://www.mcconnell.senate.gov/public/index.cfm?p=contact'],
  ['James E. Risch', 'https://www.risch.senate.gov/public/index.cfm?p=Email'],
  ['Christopher A. Coons', 'https://www.coons.senate.gov/contact'],
  ['John Boozman', 'https://www.boozman.senate.gov/public/index.cfm/contact'],
  ['John Hoeven', 'https://www.hoeven.senate.gov/contact/contact-the-senator'],
  ['Ron Johnson', 'https://www.ronjohnson.senate.gov/public/index.cfm/email-the-senator'],
  ['Edward J. Markey', 'https://www.markey.senate.gov/contact'],
  ['Jerry Moran', 'https://www.moran.senate.gov/public/index.cfm/e-mail-jerry'],
  ['Lisa Murkowski', 'https://www.murkowski.senate.gov/public/index.cfm/contact'],
  ['Rand Paul', 'https://www.paul.senate.gov/connect/email-rand'],
  ['Tim Scott', 'https://www.scott.senate.gov/contact/email-me'],
  ['John Thune', 'https://www.thune.senate.gov/public/index.cfm/contact'],
  ['Ron Wyden', 'https://www.wyden.senate.gov/contact/'],
  ['Tammy Duckworth', 'https://www.duckworth.senate.gov/content/contact-senator'],
  ['Deb Fischer', 'https://www.fischer.senate.gov/public/index.cfm/contact'],
  ['Markwayne Mullin', 'https://www.mullin.senate.gov/contact/'],
  ['Cory A. Booker', 'https://www.booker.senate.gov/?p=contact'],
  ['Cindy Hyde-Smith', 'https://www.hydesmith.senate.gov/contact-senator'],
  ['Josh Hawley', 'https://www.hawley.senate.gov/contact-senator-hawley'],
];

(async () => {
  const { submitToRepresentative, shutdown } = await import('../src/lib/form-automation');
  fs.mkdirSync(SHOTS, { recursive: true });
  const results: unknown[] = [];
  for (const [name, url] of FORMS) {
    const t0 = Date.now();
    try {
      const r = await submitToRepresentative(url, {
        prefix: 'Mr.', firstName: 'Test', lastName: 'Dryrun', email: 'dryrun@mydemocracy.app', phone: '775-555-0100',
        street: '100 N Virginia St', city: 'Reno', state: 'NV', zip: '89501',
        topic: 'Other', subject: 'DRY RUN, do not submit', message: 'This is a dry run of a form filler. It is never submitted.',
      }, {
        browser: { headless: true, timeout: 45000, screenshotSteps: true, screenshotDir: SHOTS },
        analyzer: { apiKey: process.env.ANTHROPIC_API_KEY || '', model: 'claude-sonnet-4-6' },
        submit: false,
        debugDir: SHOTS,
      });
      results.push({ name, url, status: r.status, success: r.success, message: r.message, pagesFilled: r.pagesFilled, validationErrors: r.validationErrors ?? null, ms: Date.now() - t0 });
      console.log(`${r.success ? 'OK ' : 'XX '} ${name}: ${r.status} ${r.message.slice(0, 120)} (${r.pagesFilled} pages)`);
    } catch (e) {
      results.push({ name, url, status: 'exception', success: false, message: (e as Error).message, ms: Date.now() - t0 });
      console.log(`XX  ${name}: exception ${(e as Error).message.slice(0, 120)}`);
    }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }
  await shutdown();
  console.log(`\nsaved ${OUT}: ${results.filter((r) => (r as { success: boolean }).success).length}/${results.length} fillable`);
})();
