ALTER TABLE notification_preferences
  ADD COLUMN follow_up_reminders boolean DEFAULT false NOT NULL;

ALTER TABLE messages
  ADD COLUMN follow_up_sent_at timestamptz,
  ADD COLUMN follow_up_reminder_count integer DEFAULT 0 NOT NULL;

CREATE INDEX idx_messages_follow_up_eligible
  ON messages (user_id, created_at, follow_up_reminder_count)
  WHERE user_id IS NOT NULL AND follow_up_reminder_count = 0;
