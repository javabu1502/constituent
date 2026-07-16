-- Retire the legacy SAVE Act campaign with the directional vote-no slug
-- (user decision 2026-07-16: keep proof-of-citizenship-to-register-save-sv9k4x,
-- remove this one). Verified before delete: status already 'archived',
-- zero campaign_actions, zero stories, zero stance counts — no data loss.
-- Run: npx supabase db query --linked --file scripts/delete-save-act-legacy-campaign-2026-07-16.sql

begin;

delete from campaigns
where slug = 'prevent-voter-suppression-vote-no-on-the-save-act-bqq31c'
  and not exists (select 1 from campaign_actions ca where ca.campaign_id = campaigns.id)
  and not exists (select 1 from stories s where s.campaign_id = campaigns.id);

commit;
