/**
 * Cross-reference: which Senate offices are NOT on the CWC participating
 * list, and how can we still deliver to each? Joins the live participating
 * list (production /api/cwc/offices), the app's own senator records (which
 * resolve staffer emails from the LegiStorm CSV), and the CAPTCHA audit of
 * contact forms (src/data/senate-captcha-audit.json). Read-only.
 *
 * Run: npx tsx scripts/senate-nonparticipating-delivery.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { getAllFederalLegislators } from '../src/lib/legislators';
import { SENATE_SEAT_CODES } from '../src/lib/cwc/offices';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

(async () => {
  const offices = (await (await fetch('https://www.mydemocracy.app/api/cwc/offices')).json()) as { senate: string[] };
  const participating = new Set(offices.senate);
  const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'senate-captcha-audit.json'), 'utf-8')) as {
    summary: unknown;
    findings: Array<{ name: string; url: string; hasCaptcha: boolean; type: string | null; error?: string }>;
  };
  const auditByName = new Map(audit.findings.map((f) => [norm(f.name), f]));
  const senators = getAllFederalLegislators().filter((o) => o.chamber === 'senate');
  const rows: string[] = [];
  const tally = { total: 0, stafferEmail: 0, formNoCaptcha: 0, formCaptcha: 0, nothing: 0, auditMissing: 0 };
  for (const s of senators.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name))) {
    const code = s.senateClass ? `S${s.state}0${s.senateClass}` : null;
    if (!code || !SENATE_SEAT_CODES[s.state]?.includes(code)) { rows.push(`?? ${s.name}: seat ${code} not in table`); continue; }
    if (participating.has(code)) continue;
    tally.total++;
    const a = auditByName.get(norm(s.name)) ?? [...auditByName.values()].find((f) => norm(f.name).endsWith(norm(s.lastName || s.name.split(' ').pop() || '')));
    let route: string;
    if (s.email) { route = `staffer email (${s.email})`; tally.stafferEmail++; }
    else if (!a) { route = `no audit record; form: ${s.contactForm ?? 'none'}`; tally.auditMissing++; }
    else if (a.error) { route = `form audit error: ${a.error}`; tally.auditMissing++; }
    else if (!a.hasCaptcha) { route = 'webform, no CAPTCHA (automatable)'; tally.formNoCaptcha++; }
    else { route = `webform, ${a.type} (finish-on-site only)`; tally.formCaptcha++; }
    rows.push(`${code} ${s.state} ${(s.party || '').padEnd(11)} ${s.name.padEnd(30)} ${route}`);
  }
  console.log(rows.join('\n'));
  console.log('\nnon-participating:', JSON.stringify(tally));
  console.log('audit summary:', JSON.stringify(audit.summary));
})();
