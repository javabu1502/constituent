-- Durable send queue for CWC bulk deliveries (Lee's PR #3 review, agreed
-- approach: Vercel serverless stays the runner; a Postgres table provides the
-- job locking a caching service would normally supply — no Redis dependency).
--
-- Design:
--  * One row per (message × office × environment) — the same identity the
--    delivery log keys on. Enqueueing is idempotent (unique constraint).
--  * Workers claim bounded batches via claim_cwc_send_jobs(), which uses
--    FOR UPDATE SKIP LOCKED so concurrent workers never contend or
--    double-claim, and each invocation processes a small chunk instead of
--    holding a 60-second serverless request open for a whole campaign.
--  * ONCE-AND-EXACTLY-ONCE is the lease + the delivery log together: the
--    lease stops concurrent processing; if a worker dies AFTER its POST but
--    before completing the row, the reclaimed job re-sends with the SAME
--    DeliveryId (delivery-log mint-once), which the Senate 409s → recorded
--    as delivered. The message cannot reach an office twice.
--  * attempts increments at CLAIM time, so a worker that crashes repeatedly
--    on the same row still burns its budget; deferrals (backpressure,
--    maintenance windows, endpoint 429s) give the attempt back — waiting is
--    not failing.
--
-- Service-role only (like cwc_deliveries): RLS enabled with NO policies.

create table if not exists cwc_send_queue (
  id bigint generated always as identity primary key,
  message_key text not null,
  office_code text not null,
  environment text not null check (environment in ('test', 'production')),
  chamber text not null check (chamber in ('house', 'senate')),
  campaign_id text not null,
  -- Full CwcDelivery payload, validated by the compliance gate at enqueue
  -- AND again at send (the gate is cheap; trust nothing that sat in a table).
  delivery jsonb not null,
  -- Fail-closed at the boundary: only explicitly-sendable levels may enqueue.
  bill_level text not null check (bill_level in ('federal', 'none')),
  status text not null default 'queued'
    check (status in ('queued', 'leased', 'sent', 'routed', 'refused', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 8,
  run_after timestamptz not null default now(),
  lease_expires_at timestamptz,
  leased_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_key, office_code, environment)
);

alter table cwc_send_queue enable row level security;
-- No policies on purpose: service-role only.

-- Claim scan: due queued rows + expired leases.
create index if not exists cwc_send_queue_claim_idx
  on cwc_send_queue (run_after) where status = 'queued';
create index if not exists cwc_send_queue_lease_idx
  on cwc_send_queue (lease_expires_at) where status = 'leased';
-- Ops visibility: what's stuck / failing per campaign.
create index if not exists cwc_send_queue_status_idx
  on cwc_send_queue (status, updated_at desc);

-- Claim up to p_limit due jobs for p_worker, leasing them for
-- p_lease_seconds. SKIP LOCKED means concurrent claimants interleave without
-- blocking and can never receive the same row. Rows whose attempt budget is
-- exhausted are flipped to 'failed' here (not claimed), so a crashing job
-- can't loop forever off expired leases.
create or replace function claim_cwc_send_jobs(
  p_worker text,
  p_limit integer,
  p_lease_seconds integer default 120
)
returns setof cwc_send_queue
language plpgsql
as $$
begin
  -- Retire rows that are out of attempts (including expired leases from
  -- workers that died on their final attempt).
  update cwc_send_queue
     set status = 'failed',
         last_error = coalesce(last_error, '') || ' [attempts exhausted]',
         updated_at = now()
   where attempts >= max_attempts
     and (status = 'queued'
          or (status = 'leased' and lease_expires_at < now()));

  return query
  update cwc_send_queue q
     set status = 'leased',
         leased_by = p_worker,
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         attempts = q.attempts + 1,
         updated_at = now()
   where q.id in (
     select c.id
       from cwc_send_queue c
      where ((c.status = 'queued' and c.run_after <= now())
             or (c.status = 'leased' and c.lease_expires_at < now()))
        and c.attempts < c.max_attempts
      order by c.run_after
        for update skip locked
      limit p_limit)
  returning q.*;
end;
$$;
