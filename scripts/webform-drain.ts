/**
 * Webform delivery worker: files queued messages in a Senate office's OWN
 * contact form (offices not on CWC, CAPTCHA-free). Runs OUTSIDE Vercel
 * (Playwright + Chromium): GitHub Actions on a schedule, or locally.
 *
 * Every row was content-screened at enqueue. Each attempt: claim with a
 * lease, run the form engine with submit: true, record the result. A
 * validation/CAPTCHA/network failure re-queues with backoff up to
 * max_attempts (3); success or exhaustion is terminal.
 *
 * Kill switch: WEBFORM_DELIVERY_ENABLED must be 'true' or the worker exits.
 * Run: WEBFORM_DELIVERY_ENABLED=true npx tsx scripts/webform-drain.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? '.env.local' });
import { createClient } from '@supabase/supabase-js';

const LIMIT = Number(process.env.WEBFORM_DRAIN_LIMIT ?? 5);

(async () => {
  if (process.env.WEBFORM_DELIVERY_ENABLED !== 'true') {
    console.log('WEBFORM_DELIVERY_ENABLED is not true; nothing to do.');
    return;
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const workerId = `webform:${process.env.GITHUB_RUN_ID ?? 'local'}:${Date.now()}`;
  const { data, error } = await sb.rpc('claim_webform_send_jobs', { p_worker: workerId, p_limit: LIMIT, p_lease_seconds: 300 });
  if (error) throw new Error(`claim failed: ${error.message}`);
  const jobs = (data ?? []) as Array<{ id: number; official_name: string; form_url: string; attempts: number; max_attempts: number; constituent: Record<string, string>; message: { subject: string; body: string; topic: string } }>;
  console.log(`claimed ${jobs.length} job(s)`);
  if (jobs.length === 0) return;

  const { submitToRepresentative, shutdown } = await import('../src/lib/form-automation');
  for (const job of jobs) {
    const finish = async (patch: Record<string, unknown>) => {
      const { error: e } = await sb.from('webform_send_queue').update({ ...patch, leased_by: null, lease_expires_at: null, updated_at: new Date().toISOString() }).eq('id', job.id);
      if (e) console.error(`update ${job.id} failed:`, e.message);
    };
    try {
      const c = job.constituent;
      const r = await submitToRepresentative(job.form_url, {
        prefix: c.prefix, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
        street: c.street, city: c.city, state: c.state, zip: c.zip,
        topic: job.message.topic, subject: job.message.subject, message: job.message.body,
      }, {
        browser: { headless: true, timeout: 45000 },
        analyzer: { apiKey: process.env.ANTHROPIC_API_KEY || '', model: 'claude-sonnet-4-6' },
        submit: true,
      });
      const result = { status: r.status, message: r.message, confirmationNumber: r.confirmationNumber ?? null, validationErrors: r.validationErrors ?? null, pagesFilled: r.pagesFilled, timeTakenMs: r.timeTakenMs };
      if (r.success) {
        console.log(`#${job.id} ${job.official_name}: SENT ${r.confirmationNumber ?? ''}`);
        await finish({ status: 'sent', result, last_error: null });
      } else {
        const exhausted = job.attempts >= job.max_attempts;
        console.log(`#${job.id} ${job.official_name}: ${r.status} (${exhausted ? 'failed' : 'retry'}) ${r.message.slice(0, 120)}`);
        await finish({ status: exhausted ? 'failed' : 'queued', result, last_error: `${r.status}: ${r.message.slice(0, 500)}`, run_after: new Date(Date.now() + 30 * 60_000).toISOString() });
      }
    } catch (e) {
      const msg = (e as Error).message;
      const exhausted = job.attempts >= job.max_attempts;
      console.error(`#${job.id} ${job.official_name}: exception ${msg.slice(0, 200)}`);
      await finish({ status: exhausted ? 'failed' : 'queued', last_error: msg.slice(0, 500), run_after: new Date(Date.now() + 30 * 60_000).toISOString() });
    }
  }
  await shutdown();
})().catch((e) => { console.error(e); process.exit(1); });
