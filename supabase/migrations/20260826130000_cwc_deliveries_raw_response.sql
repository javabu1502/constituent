-- Persist the raw CWC response body (audit 2026-08-26): parsed <Error> tags
-- alone lose the context needed to debug a failing campaign — SOAPBox's
-- monitoring requirement is only useful if we can see WHAT the endpoint said.
-- Truncated client-side to 8KB before insert.

alter table cwc_deliveries add column if not exists raw_response text;
