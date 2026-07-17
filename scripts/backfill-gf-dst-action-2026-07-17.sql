-- Backfill the one participation lost to the send-tracking outage that we
-- can attest to specifically (user's partner, 2026-07-17 00:56 UTC session,
-- confirmed by the ai_usage_logs generate_message entry): stance oppose,
-- messaged Sen. Jacky Rosen's office only. Name/city unknown -> empty
-- strings (analytics renders "Someone"); state NV via Rosen. Counting rule:
-- one official engaged = one action. Timestamps backdated to the session.
-- Idempotent: skips if the campaign already has any action rows.
-- Run: npx supabase db query --linked --file scripts/backfill-gf-dst-action-2026-07-17.sql

begin;

with c as (
  select id from campaigns
  where slug = 'should-daylight-saving-time-be-permanent-dst139'
    and not exists (
      select 1 from campaign_actions ca
      join campaigns cc on cc.id = ca.campaign_id
      where cc.slug = 'should-daylight-saving-time-be-permanent-dst139'
    )
),
ins_action as (
  insert into campaign_actions
    (campaign_id, participant_name, participant_city, participant_state, messages_sent, stance, created_at)
  select id, '', '', 'NV', 1, 'oppose', '2026-07-17 00:56:20+00' from c
  returning campaign_id
),
ins_message as (
  insert into messages
    (advocate_name, advocate_city, advocate_state, legislator_name, legislator_id,
     legislator_party, legislator_level, legislator_chamber, issue_area, issue_subtopic,
     message_body, delivery_method, delivery_status, user_id, campaign_id, created_at)
  select '', '', 'NV', 'Jacky Rosen', 'R000608',
     'Democrat', 'federal', 'senate', 'Science, Technology, Communications', 'Science, Technology, Communications',
     '', 'email', 'email_opened', null, id, '2026-07-17 00:56:20+00' from c
  returning id
)
update campaigns
set action_count = action_count + 1,
    oppose_count = oppose_count + 1
where id in (select id from c);

commit;
