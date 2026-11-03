-- A stable topic column for messages, alongside the words the sender used.
--
-- Audit 2026-11-03: 21 real messages carried 7 different issue_area values,
-- three of them the same subject ('Abortion', 'Abortion and Fetal Rights',
-- 'Reproductive Rights & Life'), plus casing drift ('environment' next to
-- 'Families'). issue_area is free text straight from the classifier or the
-- person's own typing, so per-issue counts, trends and routing all split
-- across spellings of one topic.
--
-- The CWC XML layer already normalizes to the 32 Library of Congress policy
-- areas (src/lib/cwc/topics.ts). That normalization now lands on the row too.
-- issue_area is left exactly as written: it is the sender's own wording, and
-- the report an organization reads should keep it.

alter table public.messages add column if not exists issue_topic text;

comment on column public.messages.issue_topic is
  'Library of Congress policy area derived from issue_area/issue_subtopic by locTopicsForIssueArea(). Use this for counts and trends; issue_area keeps the sender''s own words.';

create index if not exists messages_issue_topic_created_at_idx
  on public.messages (issue_topic, created_at desc);
