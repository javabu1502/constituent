import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE! });
import { createClient } from '@supabase/supabase-js';
(async () => {
  const { processCwcSendQueue } = await import('../src/lib/cwc/queue');
  const ids = process.argv.slice(2).map(Number);
  const summary = await processCwcSendQueue({ workerId: `admin:jared-cli:${Date.now()}`, environment: 'production', ids });
  console.log('summary:', JSON.stringify(summary));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: q } = await sb.from('cwc_send_queue').select('id,status,office_code,attempts,last_error').in('id', ids);
  console.log('queue:', JSON.stringify(q));
  const { data: d } = await sb.from('cwc_deliveries').select('office_code,status,http_status,errors,raw_response,delivery_id,updated_at').eq('environment', 'production').order('updated_at', { ascending: false }).limit(ids.length);
  console.log('deliveries:', JSON.stringify(d));
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
