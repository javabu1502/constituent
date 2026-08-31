-- Whip tracking + lawmaker/stakeholder notes: the org side of a campaign.
-- An advocacy campaign isn't just constituent messages — it's meetings,
-- commitments, and counting votes. Positions are the org's own read
-- (for/against/committed/uncommitted); notes are their meeting log. Both are
-- keyed by the ORG (creator) + campaign, with legislator ids matching our
-- data (bioguide federally, ocd-person for states) so they join to rosters,
-- sponsor sync, and constituent-message counts.

CREATE TABLE IF NOT EXISTS public.legislator_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  legislator_id text NOT NULL,
  legislator_name text NOT NULL,
  legislator_party text,
  legislator_chamber text,
  position text NOT NULL DEFAULT 'uncommitted'
    CHECK (position IN ('for', 'against', 'committed', 'uncommitted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, legislator_id)
);

CREATE TABLE IF NOT EXISTS public.campaign_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  -- NULL legislator_id = a general/stakeholder note on the campaign.
  legislator_id text,
  legislator_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legislator_positions_campaign_idx ON public.legislator_positions (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_notes_campaign_idx ON public.campaign_notes (campaign_id, legislator_id);

-- Service-role only, like the rest of the org-side tables.
ALTER TABLE public.legislator_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.legislator_positions IS
  'Org whip count per campaign: the org''s read on each legislator (for/against/committed/uncommitted).';
COMMENT ON TABLE public.campaign_notes IS
  'Org meeting/stakeholder notes per campaign, optionally attached to a legislator.';
