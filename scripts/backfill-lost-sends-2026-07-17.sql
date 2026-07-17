-- Backfill the 21 contact-flow sends lost to the send-tracking outage
-- (2026-03-04..2026-07-16, tracking 400'd; see commit fba26d9). Source of
-- truth: Vercel Web Analytics message_sent events (read 2026-07-17) —
-- issue mix and method are EXACT recorded data (21 sends / 9 visitors,
-- 100% email); per-row DATES are approximated from the event chart's
-- clusters (late-June wave + one early-July burst). Advocate/legislator
-- identity was never recorded anywhere -> left empty/null. Null
-- legislator_id keeps these out of Top Contacted Reps; they exist to make
-- issue-level aggregates ("What People Are Writing About", trends) honest.
-- Idempotent: skips if any legislator-less outage-window rows exist.
-- Run: npx supabase db query --linked --file scripts/backfill-lost-sends-2026-07-17.sql

begin;

insert into messages
  (advocate_name, advocate_city, advocate_state, legislator_name, legislator_id,
   legislator_party, legislator_level, legislator_chamber, issue_area, issue_subtopic,
   message_body, delivery_method, delivery_status, user_id, campaign_id, created_at)
select '', '', null, null, null,
   null, null, null, v.issue, v.issue,
   '', 'email', 'email_opened', null, null, v.ts::timestamptz
from (values
  ('Families',                            '2026-06-23 17:00:00+00'),
  ('Families',                            '2026-06-24 17:00:00+00'),
  ('Families',                            '2026-06-25 17:00:00+00'),
  ('Families',                            '2026-06-26 17:00:00+00'),
  ('Families',                            '2026-06-27 17:00:00+00'),
  ('Energy',                              '2026-06-24 18:00:00+00'),
  ('Energy',                              '2026-06-24 18:05:00+00'),
  ('Energy',                              '2026-06-24 18:10:00+00'),
  ('Energy',                              '2026-06-24 18:15:00+00'),
  ('Energy',                              '2026-06-24 18:20:00+00'),
  ('Taxation',                            '2026-07-05 16:00:00+00'),
  ('Taxation',                            '2026-07-05 16:05:00+00'),
  ('Taxation',                            '2026-07-05 16:10:00+00'),
  ('Taxation',                            '2026-07-05 16:15:00+00'),
  ('Taxation',                            '2026-07-05 16:20:00+00'),
  ('Immigration',                         '2026-06-26 19:00:00+00'),
  ('Immigration',                         '2026-06-26 19:05:00+00'),
  ('Child Care',                          '2026-06-25 20:00:00+00'),
  ('Economics and Public Finance',        '2026-06-27 15:00:00+00'),
  ('Science, Technology, Communications', '2026-06-28 15:00:00+00'),
  ('Social Welfare',                      '2026-06-23 21:00:00+00')
) as v(issue, ts)
where not exists (
  select 1 from messages
  where legislator_id is null
    and delivery_status = 'email_opened'
    and created_at between '2026-06-01' and '2026-07-16'
);

commit;
