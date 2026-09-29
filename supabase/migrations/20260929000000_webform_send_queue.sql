-- Queue for messages My Democracy files in a congressional office's OWN
-- contact form (offices that do not participate in CWC and whose form has no
-- CAPTCHA). Same shape and guarantees as cwc_send_queue: content-screened at
-- enqueue, leased with FOR UPDATE SKIP LOCKED, bounded attempts, service-role
-- only. The worker runs outside Vercel (Playwright), see scripts/webform-drain.ts.
create table if not exists webform_send_queue (
  id bigint generated always as identity primary key,
  message_key text not null,
  official_id text not null,        -- bioguide
  official_name text not null,
  form_url text not null,
  constituent jsonb not null,       -- prefix, firstName, lastName, email, phone?, street, city, state, zip
  message jsonb not null,           -- subject, body, topic
  status text not null default 'queued'
    check (status in ('queued', 'held', 'leased', 'sent', 'refused', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz not null default now(),
  lease_expires_at timestamptz,
  leased_by text,
  last_error text,
  result jsonb,                     -- SubmissionResult minus screenshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_key, official_id)
);
alter table webform_send_queue enable row level security;
create index if not exists webform_send_queue_claim_idx on webform_send_queue (run_after) where status = 'queued';
create index if not exists webform_send_queue_status_idx on webform_send_queue (status, updated_at desc);

create or replace function claim_webform_send_jobs(p_worker text, p_limit integer, p_lease_seconds integer default 300)
returns setof webform_send_queue language plpgsql as $$
begin
  update webform_send_queue
     set status = 'failed', last_error = coalesce(last_error, '') || ' [attempts exhausted]', updated_at = now()
   where attempts >= max_attempts
     and (status = 'queued' or (status = 'leased' and lease_expires_at < now()));
  return query
  update webform_send_queue q
     set status = 'leased', leased_by = p_worker,
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         attempts = q.attempts + 1, updated_at = now()
   where q.id in (
     select c.id from webform_send_queue c
      where ((c.status = 'queued' and c.run_after <= now()) or (c.status = 'leased' and c.lease_expires_at < now()))
        and c.attempts < c.max_attempts
      order by c.run_after for update skip locked limit p_limit)
  returning q.*;
end; $$;
