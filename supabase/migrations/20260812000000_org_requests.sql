-- Pilot applications from advocacy organizations. Public form on /campaigns;
-- Jared reviews and flips the account_type by hand (the concierge phase IS
-- the sales pipeline).
CREATE TABLE IF NOT EXISTS public.org_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  website text,
  contact_name text NOT NULL,
  email text NOT NULL,
  role text,
  working_on text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.org_requests IS
  'Advocacy-platform pilot applications; approval = manually setting the applicant''s profiles.account_type to organization.';
