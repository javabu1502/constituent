/**
 * Fill the demo organization's account so its dashboard looks like a campaign
 * that has been running for a season.
 *
 * The demo org is Silver State Families Alliance (jared@mydemocracy.app). Its
 * existing seeded rows were scattered across Fresno, Lubbock and Cleveland
 * Heights, which reads wrong for a Nevada org, and most carried @example.com
 * addresses that the supporter rollup correctly refuses to count. This script
 * replaces that with people who hold together geographically: a point sampled
 * inside a real Nevada metro, the Senate and Assembly districts that actually
 * contain that point, and the nearest city to it.
 *
 * What it touches, and nothing else:
 *   - org_supporters        inserts the join-form list (the only source that
 *                           carries a district, so the only one that fills the map)
 *   - campaign_actions      rewrites the existing Silver State rows in place,
 *                           keeping created_at so the campaign keeps its history
 *   - stories               sets a contact email on Silver State stories that
 *                           already recorded consent, so "shared a story" is
 *                           not stuck at zero
 *
 * Every write is guarded on the campaign's creator being the demo org. The
 * Children's Cabinet's stories are real and are asserted untouched, before
 * and after.
 *
 * Addresses use @demo.mydemocracy.app: a subdomain with no MX record, so
 * nothing can ever be delivered to a real person, while still not being an
 * RFC 2606 reserved domain that the rollup filters out.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-org.ts            dry run, prints the plan
 *   npx tsx scripts/seed-demo-org.ts --apply    writes
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { findContainingFeature, type GeoFeatureCollection } from '../src/lib/geo/point-in-polygon';
import nvSenate from '../src/data/districts/nv-senate.json';
import nvAssembly from '../src/data/districts/nv-assembly.json';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}
const admin = createClient(url, key);

const DEMO_ORG = '5b807805-8a66-4497-8f46-cf9b92bff610'; // jared@mydemocracy.app
const CHILDRENS_CABINET = '289733e4-96f8-4ce5-b7c6-fa52cc74fffe';
const CC_STORY_COUNT = 8;
const APPLY = process.argv.includes('--apply');

const JOINERS = 340;
const ACTION_ONLY = 180;
const JOINERS_WHO_ALSO_ACT = 210;
const STORIES_TO_ATTRIBUTE = 12;

// Deterministic, so re-running produces the same people rather than a new crowd.
let seed = 20261104;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

/**
 * Where Nevadans are. Weights approximate the real split: roughly
 * three-quarters of the state lives in the Las Vegas valley and a fifth
 * around Reno, which is what makes a district map of Nevada worth drawing.
 */
const METROS: { name: string; lat: number; lon: number; radius: number; weight: number }[] = [
  { name: 'Las Vegas', lat: 36.1699, lon: -115.1398, radius: 0.1, weight: 34 },
  { name: 'Henderson', lat: 36.0395, lon: -114.9817, radius: 0.1, weight: 11 },
  { name: 'North Las Vegas', lat: 36.1989, lon: -115.1175, radius: 0.09, weight: 9 },
  { name: 'Spring Valley', lat: 36.108, lon: -115.2454, radius: 0.07, weight: 6 },
  { name: 'Sunrise Manor', lat: 36.181, lon: -115.047, radius: 0.07, weight: 6 },
  { name: 'Paradise', lat: 36.0972, lon: -115.1467, radius: 0.06, weight: 5 },
  { name: 'Enterprise', lat: 36.0094, lon: -115.2403, radius: 0.06, weight: 4 },
  { name: 'Reno', lat: 39.5296, lon: -119.8138, radius: 0.1, weight: 12 },
  { name: 'Sparks', lat: 39.5349, lon: -119.7527, radius: 0.07, weight: 5 },
  { name: 'Carson City', lat: 39.1638, lon: -119.7674, radius: 0.05, weight: 3 },
  { name: 'Elko', lat: 40.8324, lon: -115.7631, radius: 0.04, weight: 1 },
  { name: 'Fernley', lat: 39.608, lon: -119.2518, radius: 0.04, weight: 1 },
  { name: 'Pahrump', lat: 36.2083, lon: -115.9839, radius: 0.05, weight: 1 },
  { name: 'Mesquite', lat: 36.8055, lon: -114.0672, radius: 0.04, weight: 1 },
  { name: 'Fallon', lat: 39.4735, lon: -118.7774, radius: 0.04, weight: 1 },
];
const WEIGHT_TOTAL = METROS.reduce((n, m) => n + m.weight, 0);

/**
 * Gazetteer for labelling, separate from the sampling weights above.
 *
 * A point is labelled with the nearest town to it, not the metro it was
 * drawn around. The jitter reaches ~18km, which is far enough to leave the
 * Las Vegas valley for a neighbouring rural district, and labelling by the
 * sampling origin put "Las Vegas" supporters in AD19, which is Mesquite.
 */
const CITIES: { name: string; lat: number; lon: number }[] = [
  ...METROS.map((m) => ({ name: m.name, lat: m.lat, lon: m.lon })),
  { name: 'Boulder City', lat: 35.9786, lon: -114.8319 },
  { name: 'Laughlin', lat: 35.1678, lon: -114.573 },
  { name: 'Moapa Valley', lat: 36.5783, lon: -114.4694 },
  { name: 'Indian Springs', lat: 36.5686, lon: -115.6711 },
  { name: 'Winnemucca', lat: 40.973, lon: -117.7357 },
  { name: 'Ely', lat: 39.2472, lon: -114.8883 },
  { name: 'Dayton', lat: 39.2377, lon: -119.5935 },
  { name: 'Gardnerville', lat: 38.9413, lon: -119.7496 },
  { name: 'Yerington', lat: 38.9857, lon: -119.1632 },
  { name: 'Lovelock', lat: 40.1796, lon: -118.4737 },
  { name: 'Tonopah', lat: 38.0672, lon: -117.2304 },
  { name: 'Caliente', lat: 37.6147, lon: -114.5119 },
  { name: 'Silver Springs', lat: 39.4138, lon: -119.2254 },
];

/** Nearest town, with longitude corrected for the latitude band. */
function nearestCity(lat: number, lon: number): string {
  const kx = Math.cos((lat * Math.PI) / 180);
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const dx = (c.lon - lon) * kx;
    const dy = c.lat - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.name;
}

const FIRST = [
  'Maria', 'Jose', 'Ashley', 'Michael', 'Jennifer', 'David', 'Jessica', 'Daniel', 'Amanda', 'Christopher',
  'Guadalupe', 'Anthony', 'Stephanie', 'Robert', 'Nicole', 'Juan', 'Elizabeth', 'Kevin', 'Melissa', 'Brandon',
  'Rosa', 'Eric', 'Danielle', 'Carlos', 'Rachel', 'Tyler', 'Monica', 'Jacob', 'Crystal', 'Luis',
  'Tiffany', 'Aaron', 'Veronica', 'Joshua', 'Kimberly', 'Andres', 'Heather', 'Nathan', 'Priya', 'Thomas',
  'Leilani', 'Marcus', 'Yolanda', 'Derek', 'Angela', 'Hector', 'Brittany', 'Samuel', 'Imani', 'Patrick',
  'Mai', 'Jonathan', 'Sandra', 'Alejandro', 'Katherine', 'Omar', 'Dana', 'Isaac', 'Teresa', 'Gregory',
];
const LAST = [
  'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
  'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Morales', 'Cruz', 'Ortiz', 'Gutierrez', 'Chavez',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis',
  'Nguyen', 'Tran', 'Pham', 'Patel', 'Singh', 'Kim', 'Park', 'Chen', 'Wong', 'Yamamoto',
  'Begay', 'Yazzie', 'Tsosie', 'Whitehorse', 'Okafor', 'Mensah', 'Abebe', 'Haddad', 'Khalil', 'Osei',
];
const STREETS = [
  'Desert Inn Rd', 'Charleston Blvd', 'Flamingo Rd', 'Sahara Ave', 'Tropicana Ave', 'Lake Mead Blvd',
  'Bonanza Rd', 'Rainbow Blvd', 'Eastern Ave', 'Pecos Rd', 'Virginia St', 'Plumb Ln', 'Kietzke Ln',
  'Mayberry Dr', 'Wedekind Rd', 'Carson St', 'Mountain City Hwy', 'Pyramid Way', 'Oddie Blvd', 'Boulder Hwy',
];

const senate = nvSenate as unknown as GeoFeatureCollection<{ district: string }>;
const assembly = nvAssembly as unknown as GeoFeatureCollection<{ district: string }>;

interface Person {
  name: string;
  email: string;
  street: string;
  city: string;
  zip: string;
  upper: string | null;
  lower: string | null;
  resolved: boolean;
}

const ZIP_BY_CITY: Record<string, string[]> = {
  'Las Vegas': ['89101', '89104', '89106', '89107', '89108', '89110', '89119', '89146'],
  Henderson: ['89002', '89011', '89014', '89015', '89052'],
  'North Las Vegas': ['89030', '89031', '89032', '89084'],
  'Spring Valley': ['89117', '89147', '89148'],
  'Sunrise Manor': ['89110', '89115', '89142'],
  Paradise: ['89109', '89119', '89169'],
  Enterprise: ['89139', '89141', '89178'],
  Reno: ['89501', '89502', '89503', '89509', '89512', '89523'],
  Sparks: ['89431', '89434', '89436'],
  'Carson City': ['89701', '89703', '89706'],
  Elko: ['89801'],
  Fernley: ['89408'],
  Pahrump: ['89048'],
  Mesquite: ['89027'],
  Fallon: ['89406'],
};

/** Sample until the point lands in a district, so city and districts agree. */
function makePerson(usedEmails: Set<string>): Person {
  for (let attempt = 0; attempt < 400; attempt++) {
    let r = rnd() * WEIGHT_TOTAL;
    const metro = METROS.find((m) => (r -= m.weight) <= 0) ?? METROS[0];
    const lat = metro.lat + (rnd() - 0.5) * 2 * metro.radius;
    const lon = metro.lon + (rnd() - 0.5) * 2 * metro.radius;
    const up = findContainingFeature(lon, lat, senate);
    const low = findContainingFeature(lon, lat, assembly);
    if (!up || !low) continue;

    const first = pick(FIRST);
    const last = pick(LAST);
    let email = `${first}.${last}${int(2, 98)}@demo.mydemocracy.app`.toLowerCase();
    while (usedEmails.has(email)) email = `${first}.${last}${int(100, 999)}@demo.mydemocracy.app`.toLowerCase();
    usedEmails.add(email);

    // About one address in twelve fails to geocode in practice. Those people
    // still count as supporters; they are just not placed on the map.
    const resolved = rnd() > 0.08;
    const city = nearestCity(lat, lon);
    return {
      name: `${first} ${last}`,
      email,
      street: `${int(100, 9800)} ${pick(STREETS)}`,
      city,
      zip: pick(ZIP_BY_CITY[city] ?? ZIP_BY_CITY[metro.name] ?? ['89101']),
      upper: resolved ? up.properties.district : null,
      lower: resolved ? low.properties.district : null,
      resolved,
    };
  }
  throw new Error('Could not place a point inside a Nevada district');
}

async function main() {
  // --- invariant: the real org's content, before anything happens -----------
  const { data: campaigns } = await admin.from('campaigns').select('id, creator_id');
  const all = campaigns ?? [];
  const ccCampaigns = new Set(all.filter((c) => c.creator_id === CHILDRENS_CABINET).map((c) => c.id));
  const demoCampaigns = all.filter((c) => c.creator_id === DEMO_ORG).map((c) => c.id as string);

  const { data: storiesBefore } = await admin
    .from('stories')
    .select('id, campaign_id, consent_at, storyteller_email, attribution_level');
  const ccBefore = (storiesBefore ?? []).filter((s) => ccCampaigns.has(s.campaign_id)).length;
  if (ccBefore !== CC_STORY_COUNT) {
    console.error(`ABORT: expected ${CC_STORY_COUNT} Children's Cabinet stories, found ${ccBefore}.`);
    process.exit(1);
  }
  console.log(`Children's Cabinet stories before: ${ccBefore} (untouched by this script)`);
  console.log(`Demo org campaigns: ${demoCampaigns.length}`);

  // --- build the people ----------------------------------------------------
  const used = new Set<string>();
  const joiners = Array.from({ length: JOINERS }, () => makePerson(used));
  const actionOnly = Array.from({ length: ACTION_ONLY }, () => makePerson(used));

  const placed = joiners.filter((p) => p.resolved).length;
  const upperSpread = new Set(joiners.filter((p) => p.upper).map((p) => p.upper)).size;
  const lowerSpread = new Set(joiners.filter((p) => p.lower).map((p) => p.lower)).size;
  const cityTally = joiners.reduce<Record<string, number>>((m, p) => ({ ...m, [p.city]: (m[p.city] ?? 0) + 1 }), {});

  console.log(`\nGenerated ${joiners.length} joiners and ${actionOnly.length} action-only supporters`);
  console.log(`  placed in a district: ${placed}/${joiners.length}`);
  console.log(`  senate districts covered:   ${upperSpread}/21`);
  console.log(`  assembly districts covered: ${lowerSpread}/42`);
  console.log(
    '  top cities: ' +
      Object.entries(cityTally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([c, n]) => `${c} ${n}`)
        .join(', '),
  );

  // --- the existing action rows we will rewrite in place -------------------
  const { data: existingActions } = await admin
    .from('campaign_actions')
    .select('id, campaign_id, created_at')
    .in('campaign_id', demoCampaigns);
  const actions = existingActions ?? [];
  if (actions.some((a) => !demoCampaigns.includes(a.campaign_id as string))) {
    console.error('ABORT: an action row outside the demo org slipped into the set.');
    process.exit(1);
  }

  const actors = [...joiners.slice(0, JOINERS_WHO_ALSO_ACT), ...actionOnly];
  console.log(`\nAction rows to rewrite: ${actions.length} (across ${new Set(actions.map((a) => a.campaign_id)).size} campaigns)`);
  console.log(`  drawn from ${actors.length} people, so some appear more than once`);

  // Only storytellers who put a name to it. Someone who chose anonymity is not
  // given a contact address, even in demo data, because the dashboard treats
  // that address as permission to follow up.
  const demoStories = (storiesBefore ?? []).filter(
    (s) =>
      demoCampaigns.includes(s.campaign_id as string) &&
      s.consent_at &&
      !s.storyteller_email &&
      ['named', 'first_name_only'].includes(String(s.attribution_level)),
  );
  const toAttribute = demoStories.slice(0, STORIES_TO_ATTRIBUTE);
  console.log(`\nDemo stories to give a contact address: ${toAttribute.length} (of ${demoStories.length} consented with none)`);

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.');
    return;
  }

  // --- write ---------------------------------------------------------------
  const supporterRows = joiners.map((p) => ({
    org_user_id: DEMO_ORG,
    name: p.name,
    email: p.email,
    street: p.street,
    city: p.city,
    state: 'NV',
    zip: p.zip,
    state_upper_district: p.upper,
    state_lower_district: p.lower,
    district_resolved: p.resolved,
    source: 'org_page',
    consent_text: `Yes, keep me posted on Silver State Families Alliance campaigns.`,
    consented_at: new Date(Date.now() - int(1, 240) * 86400000).toISOString(),
  }));

  let inserted = 0;
  for (let i = 0; i < supporterRows.length; i += 50) {
    const batch = supporterRows.slice(i, i + 50);
    const { error, data } = await admin
      .from('org_supporters')
      .upsert(batch, { onConflict: 'org_user_id,email' })
      .select('id');
    if (error) {
      console.error('org_supporters upsert failed:', error.message);
      process.exit(1);
    }
    inserted += data?.length ?? 0;
    process.stdout.write(`\r  org_supporters: ${inserted}/${supporterRows.length}`);
  }
  console.log();

  let rewritten = 0;
  for (const a of actions) {
    const p = actors[rewritten % actors.length];
    const { error } = await admin
      .from('campaign_actions')
      .update({
        participant_name: p.name,
        participant_email: p.email,
        participant_city: p.city,
        participant_state: 'NV',
      })
      .eq('id', a.id)
      .in('campaign_id', demoCampaigns); // belt and braces: never leave the demo org
    if (error) {
      console.error(`\ncampaign_actions update failed on ${a.id}:`, error.message);
      process.exit(1);
    }
    rewritten++;
    if (rewritten % 25 === 0 || rewritten === actions.length) {
      process.stdout.write(`\r  campaign_actions: ${rewritten}/${actions.length}`);
    }
  }
  console.log();

  let attributed = 0;
  for (const s of toAttribute) {
    const p = joiners[attributed % joiners.length];
    const { error } = await admin
      .from('stories')
      .update({ storyteller_email: p.email, city: p.city, state: 'NV' })
      .eq('id', s.id)
      .in('campaign_id', demoCampaigns);
    if (error) {
      console.error(`\nstories update failed on ${s.id}:`, error.message);
      process.exit(1);
    }
    attributed++;
  }
  console.log(`  stories given a contact address: ${attributed}`);

  // --- invariant again -----------------------------------------------------
  const { data: storiesAfter } = await admin.from('stories').select('id, campaign_id');
  const ccAfter = (storiesAfter ?? []).filter((s) => ccCampaigns.has(s.campaign_id)).length;
  console.log(`\nChildren's Cabinet stories after: ${ccAfter} ${ccAfter === CC_STORY_COUNT ? '(unchanged)' : '*** CHANGED ***'}`);
  if (ccAfter !== CC_STORY_COUNT) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
