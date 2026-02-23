/**
 * Bulk refresh script for state legislator data.
 *
 * Downloads the OpenStates people repository as a tarball, extracts all
 * state legislature YAML files, and saves per-state JSON caches.
 *
 * Usage: npm run refresh-states
 *
 * Data source: https://github.com/openstates/people (CC0 license)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse as parseYaml } from 'yaml';

const TARBALL_URL =
  'https://github.com/openstates/people/archive/refs/heads/main.tar.gz';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data', 'states');

// All 50 states + DC
const STATES = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl',
  'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me',
  'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh',
  'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri',
  'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi',
  'wy',
];

interface OpenStatesData {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  image?: string;
  party?: Array<{ name: string }>;
  roles?: Array<{
    type: 'upper' | 'lower';
    district: string;
    start_date?: string;
    end_date?: string;
  }>;
  offices?: Array<{
    classification: string;
    address?: string;
    voice?: string;
  }>;
  links?: Array<{
    url: string;
    note?: string;
  }>;
}

interface StateLegislator {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  chamber: 'upper' | 'lower';
  district: string;
  party: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  website?: string;
  office?: string;
}

function parseLegislator(data: OpenStatesData): StateLegislator | null {
  const now = new Date();
  const currentRole = data.roles?.find((role) => {
    if (role.end_date) {
      return new Date(role.end_date) > now;
    }
    return true;
  });

  if (!currentRole) return null;

  const capitolOffice = data.offices?.find(
    (o) => o.classification === 'capitol'
  );
  const districtOffice = data.offices?.find(
    (o) => o.classification === 'district'
  );
  const phone = capitolOffice?.voice || districtOffice?.voice;
  const office = capitolOffice?.address || districtOffice?.address;

  const homepage = data.links?.find((l) => l.note === 'homepage');
  const website = homepage?.url || data.links?.[0]?.url;

  return {
    id: data.id,
    name: data.name,
    firstName: data.given_name,
    lastName: data.family_name,
    chamber: currentRole.type,
    district: currentRole.district,
    party: data.party?.[0]?.name || 'Unknown',
    email: data.email,
    phone,
    photoUrl: data.image,
    website,
    office,
  };
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openstates-'));

  try {
    const tarPath = path.join(tmpDir, 'people.tar.gz');

    console.log('Downloading OpenStates people data...');
    execSync(`curl -sL "${TARBALL_URL}" -o "${tarPath}"`);

    console.log('Extracting...');
    execSync(`tar xzf "${tarPath}" -C "${tmpDir}"`);

    const dataDir = path.join(tmpDir, 'people-main', 'data');

    if (!fs.existsSync(dataDir)) {
      console.error(
        'Error: expected data directory not found after extraction.'
      );
      process.exit(1);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let totalLegislators = 0;
    let statesProcessed = 0;

    for (const state of STATES) {
      const legislatureDir = path.join(dataDir, state, 'legislature');

      if (!fs.existsSync(legislatureDir)) {
        console.log(`  ${state.toUpperCase()}: no data (skipped)`);
        continue;
      }

      const files = fs
        .readdirSync(legislatureDir)
        .filter((f: string) => f.endsWith('.yml'));
      const legislators: StateLegislator[] = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(
            path.join(legislatureDir, file),
            'utf-8'
          );
          const data = parseYaml(content) as OpenStatesData;
          const legislator = parseLegislator(data);
          if (legislator) legislators.push(legislator);
        } catch {
          console.warn(`  Warning: failed to parse ${state}/${file}`);
        }
      }

      const outputFile = path.join(OUTPUT_DIR, `${state.toUpperCase()}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(legislators, null, 2));
      console.log(`  ${state.toUpperCase()}: ${legislators.length} legislators`);
      totalLegislators += legislators.length;
      statesProcessed++;
    }

    console.log(
      `\nDone! ${totalLegislators} legislators across ${statesProcessed} states.`
    );
    console.log(`Cache saved to: ${OUTPUT_DIR}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
