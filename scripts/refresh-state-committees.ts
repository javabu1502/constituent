/**
 * Bulk refresh script for state legislative committee data.
 *
 * Downloads the OpenStates people repository as a tarball (the same source
 * refresh-state-data.ts uses for legislators — no API key needed), extracts
 * each state's committees/*.yml, and saves per-state JSON caches whose member
 * ids are the SAME ocd-person ids our state legislator data uses.
 *
 * Usage: npx tsx scripts/refresh-state-committees.ts
 *
 * Data source: https://github.com/openstates/people (CC0 license)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse as parseYaml } from 'yaml';

const TARBALL_URL = 'https://github.com/openstates/people/archive/refs/heads/main.tar.gz';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data', 'state-committees');

const STATES = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl',
  'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me',
  'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh',
  'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri',
  'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi',
  'wy',
];

interface CommitteeYaml {
  id: string; // ocd-organization/<uuid>
  name: string;
  classification?: string; // committee | subcommittee
  chamber?: 'upper' | 'lower' | 'legislature';
  members?: Array<{ name: string; role?: string; person_id?: string }>;
}

interface StateCommittee {
  /** Bare uuid (ocd-organization/ prefix stripped) — URL-safe. */
  id: string;
  name: string;
  chamber: 'upper' | 'lower' | 'legislature';
  classification: string;
  /** Full ocd-person ids — match StateLegislator.id / Official.id. */
  members: string[];
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openstates-committees-'));

  try {
    const tarPath = path.join(tmpDir, 'people.tar.gz');

    console.log('Downloading OpenStates people data...');
    execSync(`curl -sL "${TARBALL_URL}" -o "${tarPath}"`);

    console.log('Extracting committee files...');
    execSync(`tar -xzf "${tarPath}" -C "${tmpDir}" --include '*/data/*/committees/*.yml'`, { stdio: 'pipe' });

    const repoDir = fs
      .readdirSync(tmpDir)
      .map((n) => path.join(tmpDir, n))
      .find((p) => fs.statSync(p).isDirectory());
    if (!repoDir) throw new Error('Extracted repo directory not found');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let totalCommittees = 0;
    let statesWithData = 0;

    for (const state of STATES) {
      const dir = path.join(repoDir, 'data', state, 'committees');
      const committees: StateCommittee[] = [];

      if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir)) {
          if (!file.endsWith('.yml')) continue;
          try {
            const raw = parseYaml(fs.readFileSync(path.join(dir, file), 'utf-8')) as CommitteeYaml;
            if (!raw?.id || !raw?.name) continue;
            const members = (raw.members ?? [])
              .map((m) => m.person_id)
              .filter((id): id is string => !!id && id.startsWith('ocd-person/'));
            committees.push({
              id: raw.id.replace(/^ocd-organization\//, ''),
              name: raw.name,
              chamber: raw.chamber ?? 'legislature',
              classification: raw.classification ?? 'committee',
              members,
            });
          } catch (err) {
            console.warn(`  Skipping unparseable ${state}/${file}:`, err);
          }
        }
      }

      committees.sort((a, b) => a.name.localeCompare(b.name));
      fs.writeFileSync(path.join(OUTPUT_DIR, `${state.toUpperCase()}.json`), JSON.stringify(committees, null, 1));
      totalCommittees += committees.length;
      if (committees.length > 0) statesWithData += 1;
      console.log(`  ${state.toUpperCase()}: ${committees.length} committees`);
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'metadata.json'),
      JSON.stringify({ lastUpdated: new Date().toISOString(), source: TARBALL_URL, totalCommittees, statesWithData }, null, 2)
    );
    console.log(`\nDone: ${totalCommittees} committees across ${statesWithData} states → ${OUTPUT_DIR}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
