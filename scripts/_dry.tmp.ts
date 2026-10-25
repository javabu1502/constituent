import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? '.env.local' });
import { submitToRepresentative } from '../src/lib/form-automation';
const t0 = Date.now();
const stamp = () => String(Math.round((Date.now() - t0) / 1000)).padStart(4) + 's';
const log = console.log.bind(console);
console.log = (...a) => log(stamp(), ...a);
console.warn = (...a) => log(stamp(), 'WARN', ...a);
async function main() {
  const r = await submitToRepresentative(
    'https://www.durbin.senate.gov/contact/',
    { prefix: 'Miss', firstName: 'Test', lastName: 'Person', email: 'audit-test@example.com',
      phone: '7755551234', street: '1 E First St', city: 'Chicago', state: 'IL', zip: '60601',
      subject: 'Automated dry run, never submitted',
      message: 'This dry run fills the form and resolves the submit button without clicking it.',
      topic: 'Other' } as never,
    { browser: { headless: true, timeout: 45000 },
      analyzer: { apiKey: process.env.ANTHROPIC_API_KEY || '', model: 'claude-sonnet-4-6' },
      submit: false },
  );
  log(stamp(), `RESULT success=${r.success} status=${r.status} pages=${r.pagesFilled}`);
  log(stamp(), 'submitSelector:', (r as { submitSelector?: string }).submitSelector ?? '(none)');
}
main().catch((e) => { log(stamp(), 'THREW:', e.message.slice(0, 200)); process.exit(1); });
