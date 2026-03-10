CREATE TABLE message_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_hash text NOT NULL,
  official_name text NOT NULL,
  official_party text,
  issue_category text,
  tone text,
  contact_method text,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_message_feedback_hash ON message_feedback(message_hash);
CREATE INDEX idx_message_feedback_category ON message_feedback(issue_category);
