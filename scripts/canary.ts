/**
 * Daily check that the things a constituent does still work.
 *
 * Written after 2026-11-06, when one day turned up a schema that had been
 * rejecting every state and local message for eight months, a success screen
 * that said "Sent" regardless, a 500 on every campaign page, and a GitHub
 * runner change that killed the webform worker. Every one was found by a
 * person noticing something odd. None of them announced itself.
 *
 * It checks two things that cover most of that:
 *   1. The pages a visitor lands on return 200.
 *   2. track-send still accepts the payload shapes the clients actually send,
 *      federal, state and local, by validating without writing a row.
 *
 * Usage: npx tsx scripts/canary.ts
 * Needs CANARY_SECRET, and SITE_URL to point somewhere other than production.
 */

const SITE = (process.env.SITE_URL || 'https://www.mydemocracy.app').replace(/\/$/, '');
const SECRET = process.env.CANARY_SECRET;

const PAGES = ['/', '/issues', '/contact', '/representatives', '/trends', '/campaigns', '/advocacy'];

/** The id shapes the app produces. A cap that fits only the first one is the
 *  bug this exists to catch. */
const SEND_SHAPES = [
  { label: 'federal', legislator_id: 'C000127', legislator_level: 'federal', legislator_chamber: 'senate' },
  { label: 'state', legislator_id: 'ocd-person/9eddb3cd-868e-42ba-831a-b415fd7ed445', legislator_level: 'state', legislator_chamber: 'upper' },
  { label: 'local, no chamber', legislator_id: 'local:3260600:a-council-member', legislator_level: 'local' },
];

const failures: string[] = [];

async function checkPages() {
  for (const path of PAGES) {
    try {
      const res = await fetch(`${SITE}${path}`, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
      if (!res.ok) failures.push(`page ${path} returned ${res.status}`);
      else console.log(`  ok   ${res.status}  ${path}`);
    } catch (e) {
      failures.push(`page ${path} threw: ${(e as Error).message}`);
    }
  }
}

async function checkSendShapes() {
  if (!SECRET) {
    failures.push('CANARY_SECRET is not set, so the send path was not checked');
    return;
  }
  for (const shape of SEND_SHAPES) {
    const { label, ...ids } = shape;
    const body = {
      dry_run: true,
      advocate_name: 'Canary',
      advocate_city: 'Reno',
      advocate_state: 'NV',
      legislator_name: 'Canary Target',
      legislator_party: 'Nonpartisan',
      issue_area: 'Housing',
      issue_subtopic: 'Land use and zoning',
      message_body: 'Daily check that this payload shape is still accepted. Nothing is written.',
      delivery_method: 'email',
      delivery_status: 'email_opened',
      ...ids,
    };
    try {
      const res = await fetch(`${SITE}/api/track-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-canary-secret': SECRET },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        failures.push(`track-send rejected the ${label} shape: ${res.status} ${JSON.stringify(json)}`);
      } else {
        console.log(`  ok   accepted  ${label}`);
      }
    } catch (e) {
      failures.push(`track-send threw on the ${label} shape: ${(e as Error).message}`);
    }
  }
}

/**
 * Every state has two senators. Always, including on the day an appointed
 * one's term lapses.
 *
 * Upstream ends an appointed senator's term on the date of the special
 * election and publishes nothing more until the winner is sworn in. Florida
 * and Ohio sat at one senator each for nine days in November 2026 because of
 * that gap, and nothing said so. The roster is local data, so this costs one
 * file read and would have caught it the next morning.
 */
async function checkSenateCoverage() {
  const { findSenators } = await import('../src/lib/legislators');
  const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  let total = 0;
  for (const state of states) {
    const seated = findSenators(state).length;
    total += seated;
    if (seated !== 2) failures.push(`${state} has ${seated} senators on file, not 2`);
  }
  if (total === 100) console.log(`  ok   100  senate seats filled`);
}

async function main() {
  console.log(`canary against ${SITE}\n`);
  console.log('pages:');
  await checkPages();
  console.log('\nsend payload shapes:');
  await checkSendShapes();
  console.log('\nroster coverage:');
  await checkSenateCoverage();

  if (failures.length > 0) {
    console.error(`\n${failures.length} FAILED:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nall checks passed');
}

main().catch((e) => {
  console.error('canary itself failed:', e);
  process.exit(1);
});
