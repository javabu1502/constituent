-- Backpressure for the CWC rate allocator (audit 2026-08-26).
--
-- The old contract always bumped next_allowed_at and returned a slot, so a
-- deep backlog produced slots minutes in the future; the client's 30s "skew
-- guard" then sent after a token gap anyway — every deep-backlog caller
-- burst PAST the ceiling, exactly when the ceiling mattered most.
--
-- New contract: pass p_max_wait_ms and the allocator REFUSES to claim when
-- the horizon is already further out than the caller is willing to wait —
-- returning the current (unbumped) horizon so the caller can defer and retry
-- later. Refusals don't bump, so deferred callers never inflate the queue.
--
-- The 2-arg form is dropped (not overloaded): keeping both would make
-- PostgREST named-arg resolution ambiguous once the 3rd arg has a default.

drop function if exists allocate_rate_permit(text, integer);

create or replace function allocate_rate_permit(
  p_scope text,
  p_min_gap_ms integer,
  p_max_wait_ms integer default null
)
returns timestamptz
language plpgsql
as $$
declare
  cur timestamptz;
begin
  insert into rate_permits (scope) values (p_scope)
  on conflict (scope) do nothing;

  select next_allowed_at into cur
    from rate_permits
   where scope = p_scope
     for update;

  -- Refuse WITHOUT bumping when the queue is deeper than the caller accepts:
  -- the returned horizon is > now() + p_max_wait_ms, which the client reads
  -- as "defer and retry later".
  if p_max_wait_ms is not null
     and cur > now() + make_interval(secs => p_max_wait_ms / 1000.0) then
    return cur;
  end if;

  update rate_permits
     set next_allowed_at = greatest(cur, now()) + make_interval(secs => p_min_gap_ms / 1000.0),
         updated_at = now()
   where scope = p_scope;

  -- The claimant's slot: the moment the previous claim's gap expires.
  return greatest(cur, now());
end;
$$;
