-- Revoking a story must take it out of the public count (audit 2026-09-29:
-- story_count only ever went up, so /issues and the org dashboard overstated).
create or replace function decrement_campaign_story_count(campaign_uuid uuid)
returns void language sql as $$
  update campaigns set story_count = greatest(0, coalesce(story_count, 0) - 1) where id = campaign_uuid;
$$;
