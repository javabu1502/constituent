/**
 * Post-election refresh of the Nevada local roster, 2026-11-23.
 *
 * Nevada seats city officers on canvass in November and county officers on the
 * first Monday in January, so three weeks after the 2026-11-03 general the city
 * councils had already turned over while the county commissions had not. The
 * roster still carried the losing incumbents, and because its emails are
 * person-based rather than role-based (duerrn@reno.gov, cbybee@sparksnv.gov),
 * a constituent writing to "my Ward 2 council member" was addressing someone
 * who had left office.
 *
 * Every name below was read on 2026-11-23 off the body's own site, rendered in
 * Chromium because both pages build their rosters in JavaScript. Every Sparks
 * address is a mailto link on that page. Reno publishes no member addresses at
 * all -- only a scheduling form -- so the Reno seats that changed hands carry a
 * null email and the form as contactFormUrl. The README rule stands: never
 * invent an email.
 *
 * Terms: both charters run four years, so seats filled this cycle end in 2030.
 *
 * Usage:
 *   npx tsx scripts/refresh-nv-local-2026-11-23.ts           # diff only
 *   npx tsx scripts/refresh-nv-local-2026-11-23.ts --apply
 */
import * as fs from 'fs';

const FILE = 'src/data/local/nv.json';
const TODAY = '2026-11-23';
const RENO_FORM = 'https://www.reno.gov/government/city-council/scheduling-requests-for-council.php';

type Seat = Record<string, unknown>;
interface Patch { district: string; name: string; email?: string | null; phone?: string | null; contactFormUrl?: string | null; termEnd?: number | null; title?: string }

const UPDATES: Record<string, { source: string; seats: Patch[] }> = {
  'Reno City Council': {
    source: 'https://www.reno.gov/government/city-council/',
    seats: [
      { district: 'Mayor',  name: 'Kate Marshall',   email: null, phone: '775-334-2001', contactFormUrl: RENO_FORM, termEnd: 2030 },
      { district: 'Ward 1', name: 'Kathleen Taylor', contactFormUrl: RENO_FORM },
      { district: 'Ward 2', name: 'Matt Johnson',    email: null, phone: null, contactFormUrl: RENO_FORM, termEnd: 2030 },
      { district: 'Ward 3', name: 'Miguel Martinez', phone: '775-334-2012', contactFormUrl: RENO_FORM },
      { district: 'Ward 4', name: 'Eddie Gomez',     email: null, phone: null, contactFormUrl: RENO_FORM, termEnd: 2030 },
      { district: 'Ward 5', name: 'Devon Reese',     phone: '775-334-2014', contactFormUrl: RENO_FORM },
      { district: 'Ward 6', name: 'Brandi Anderson', phone: '775-334-2011', contactFormUrl: RENO_FORM },
    ],
  },
  'Sparks City Council': {
    source: 'https://www.sparksnv.gov/government/city_council_mayor/index.php',
    seats: [
      { district: 'Mayor',  name: 'Wendi Rawson',   email: 'wrawson@sparksnv.gov',   phone: '775-353-2311', termEnd: 2030 },
      { district: 'Ward 1', name: 'Donald Abbott',  email: 'dabbott@sparksnv.gov',   phone: '775-353-2311' },
      { district: 'Ward 2', name: "Jamie O'Connell", email: 'joconnell@sparksnv.gov', phone: '775-353-2311', termEnd: 2030 },
      // Was panderson@cityofsparks.us; the city's own page now publishes sparksnv.gov.
      { district: 'Ward 3', name: 'Paul Anderson',  email: 'panderson@sparksnv.gov', phone: '775-353-2311' },
      { district: 'Ward 4', name: 'Adam Mayberry',  email: 'amayberry@sparksnv.gov', phone: '775-353-2311', termEnd: 2030 },
      { district: 'Ward 5', name: 'Joe Rodriguez',  email: 'jrodriguez@sparksnv.gov', phone: '775-353-2311' },
    ],
  },
};

function main() {
  const apply = process.argv.includes('--apply');
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let changed = 0;

  for (const [bodyName, def] of Object.entries(UPDATES)) {
    const body = data.bodies.find((b: Record<string, unknown>) => b.name === bodyName);
    if (!body) throw new Error(`Body not found: ${bodyName}`);
    console.log(`\n${bodyName}`);
    for (const patch of def.seats) {
      const seat = (body.seats as Seat[]).find((s) => s.district === patch.district);
      if (!seat) throw new Error(`  seat not found: ${patch.district}`);
      const before = String(seat.name);
      if (before !== patch.name) { console.log(`  ${patch.district}: ${before} -> ${patch.name}`); changed++; }
      else console.log(`  ${patch.district}: ${before} (unchanged, re-verified)`);
      if (seat.email && patch.email !== undefined && seat.email !== patch.email) {
        console.log(`      email ${seat.email} -> ${patch.email ?? 'null'}`);
      }
      seat.name = patch.name;
      if (patch.title) seat.title = patch.title;
      if (patch.email !== undefined) { seat.email = patch.email; seat.emailIsShared = false; }
      if (patch.phone !== undefined) seat.phone = patch.phone;
      if (patch.contactFormUrl !== undefined) seat.contactFormUrl = patch.contactFormUrl;
      if (patch.termEnd !== undefined) seat.termEnd = patch.termEnd;
      seat.sourceUrl = def.source;
      seat.verifiedAt = TODAY;
      seat.unverified = false;
    }
  }

  data.updatedAt = TODAY;
  console.log(`\n${changed} seat(s) changed hands.`);
  if (!apply) { console.log('Dry run. Nothing written. Re-run with --apply.'); return; }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${FILE}`);
}
main();
