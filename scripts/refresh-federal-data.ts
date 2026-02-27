/**
 * Refresh script for federal legislator committee data.
 *
 * Downloads the latest committee YAML files from the
 * unitedstates/congress-legislators repository on GitHub.
 *
 * Usage: npm run refresh-federal
 *
 * Data source: https://github.com/unitedstates/congress-legislators (public domain)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const BASE_URL =
  'https://raw.githubusercontent.com/unitedstates/congress-legislators/main';

const FILES = [
  'committees-current.yaml',
  'committee-membership-current.yaml',
];

const OUTPUT_DIR = path.join(
  process.cwd(),
  'src',
  'data',
  'legislators',
  'federal'
);

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) return download(location).then(resolve, reject);
        return reject(new Error(`Redirect without location header`));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const file of FILES) {
    const url = `${BASE_URL}/${file}`;
    console.log(`Downloading ${file}...`);
    const content = await download(url);
    const outputPath = path.join(OUTPUT_DIR, file);
    fs.writeFileSync(outputPath, content);
    console.log(`  Saved to ${outputPath} (${(content.length / 1024).toFixed(0)} KB)`);
  }

  console.log('\nDone! Federal committee data refreshed.');
}

main().catch((err) => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
