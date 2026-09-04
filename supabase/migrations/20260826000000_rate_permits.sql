-- Cross-instance rate coordination for outbound CWC sends.
--
-- The in-process pacing in sendBatch is per Node instance: two concurrent
-- serverless invocations each pacing at 5/sec produce 10/sec at the CWC
-- endpoint. This table + allocator is the shared limiter: every CWC POST
-- first claims a send slot here, and the row lock inside the UPDATE
-- serializes concurrent claimants across ALL instances.
--
-- Design (reviewed on PR #3): a transactional next_allowed_at allocator.
-- Each claim advances the scope's next_allowed_at by the minimum gap and
-- returns the claimant's slot; the caller sleeps until its slot arrives.
-- Scopes are per chamber + environment (e.g. 'cwc:senate:production'),
-- matching the separate House/Senate infrastructures and their ceilings.
--
-- Service-role only (like cwc_deliveries): RLS enabled with NO policies.

create table if not exists rate_permits (
  scope text primary key,
  next_allowed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table rate_permits enable row level security;
-- No policies on purpose: service-role only.

-- Claim the next send slot for `p_scope`, spacing slots `p_min_gap_ms` apart.
-- Returns the claimant's slot (a timestamp that may be in the future — the
-- caller must wait until then before sending). Concurrent callers serialize
-- on the row lock and each receive a distinct, correctly spaced slot.
create or replace function allocate_rate_permit(p_scope text, p_min_gap_ms integer)
returns timestamptz
language plpgsql
as $$
declare
  slot timestamptz;
begin
  insert into rate_permits (scope) values (p_scope)
  on conflict (scope) do nothing;

  update rate_permits
     set next_allowed_at = greatest(next_allowed_at, now()) + make_interval(secs => p_min_gap_ms / 1000.0),
         updated_at = now()
   where scope = p_scope
   returning next_allowed_at - make_interval(secs => p_min_gap_ms / 1000.0)
    into slot;

  return slot;
end;
$$;
