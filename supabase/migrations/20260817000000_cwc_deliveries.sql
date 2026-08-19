-- CWC delivery log: one row per (logical message × office × environment).
--
-- Two compliance jobs in one table:
--  1. IDEMPOTENT RETRY — DeliveryId is minted once per row and REUSED on
--     retry, so a retried send can never duplicate a message (House LoS A.12
--     forbids duplicates; the Senate answers a reused DeliveryId with 409,
--     which is exactly what we want a retry to hit instead of a double send).
--  2. MONITORING — SOAPBox requires delivery agents to monitor 400/500-class
--     responses; http_status + errors persist every outcome for review.
--
-- Service-role only (like social_desk): RLS enabled with NO policies, so
-- anon/authenticated clients get nothing and only the service role (which
-- bypasses RLS) can read/write. Idempotent so it is safe under `db push`.

create table if not exists cwc_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null unique,        -- 32-char CWC DeliveryId, minted once
  message_key text not null,               -- caller's stable key for the logical message
  office_code text not null,               -- seat code (SNY01 / HNY12)
  campaign_id text not null,
  chamber text not null check (chamber in ('senate', 'house')),
  environment text not null check (environment in ('test', 'production')),
  status text not null default 'pending' check (status in ('pending', 'delivered', 'rejected', 'error')),
  http_status int,                         -- last CWC response code (400/500-class monitored)
  errors jsonb,                            -- parsed <Error> list / transport error
  xml_sha256 text,                         -- hash of the exact payload sent
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- The idempotency key: one delivery per message per office per environment.
create unique index if not exists cwc_deliveries_message_office_env_idx
  on cwc_deliveries (message_key, office_code, environment);

-- Monitoring: find failures fast.
create index if not exists cwc_deliveries_status_idx
  on cwc_deliveries (status, created_at desc);

alter table cwc_deliveries enable row level security;
-- No policies on purpose: service-role only.
