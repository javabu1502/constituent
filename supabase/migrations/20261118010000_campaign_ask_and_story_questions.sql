-- Two fields an organization asked for.
--
-- 1. `ask` — the one sentence saying what the official should DO.
--
-- It was derived entirely from stage_goal and the bill number, so a cosponsor
-- action could only ever produce "cosponsor it". An organization working a
-- bill usually has a sharper ask: sign on as an ORIGINAL cosponsor before
-- Friday, or cosponsor AND request a hearing.
--
-- stage_goal stays and stays required. It is the machine-readable intent and
-- drives committee targeting, the bill-track position, the whip framing, and
-- whether every talking point is forced. The ask supplements it; it does not
-- replace it. src/lib/campaign-ask.ts falls back to the derived sentence when
-- this is null, so every existing campaign behaves exactly as before.
--
-- 2. `story_questions` — optional questions on a storytelling campaign.
--
-- Organizations need counts and counties that free text will not reliably
-- give them, for grant reports. But the storytelling flow is trauma-informed
-- (SAMHSA / StoryCorps / Dart Center, see src/lib/interview-system-prompt.ts)
-- and its rules are explicit: "Always offer an out", "Never pressure for
-- detail", "a conversation, not a form". So these are asked AFTER the story
-- is written, every one is skippable, and answers are stored separately from
-- the story body: an answer folded into the story would inherit the story's
-- consent, attribution and withdrawal state and could never be reported on
-- cleanly.
--
-- Shape: [{"id": "uuid", "text": "Roughly how many children?"}], max 3,
-- enforced in src/lib/schemas.ts.

alter table public.campaigns
  add column if not exists ask text;

alter table public.campaigns
  drop constraint if exists campaigns_ask_len;

alter table public.campaigns
  add constraint campaigns_ask_len
  check (ask is null or char_length(ask) <= 300);

comment on column public.campaigns.ask is
  'One sentence from the organization saying what the official should do. Null falls back to the sentence stage_goal implies (src/lib/campaign-ask.ts).';

alter table public.campaigns
  add column if not exists story_questions jsonb;

alter table public.campaigns
  drop constraint if exists campaigns_story_questions_shape;

alter table public.campaigns
  add constraint campaigns_story_questions_shape
  check (
    story_questions is null
    or (jsonb_typeof(story_questions) = 'array' and jsonb_array_length(story_questions) <= 3)
  );

comment on column public.campaigns.story_questions is
  'Up to 3 optional questions asked after a story is written. Every one is skippable. Answers live in story_question_answers, never in the story body.';

-- Answers sit beside the story, not inside it.
create table if not exists public.story_question_answers (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  -- The question's id from campaigns.story_questions.
  question_id text not null,
  -- The question as it was worded when asked, kept verbatim so a later edit
  -- to the campaign cannot change what the storyteller was answering.
  question_text text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (story_id, question_id)
);

alter table public.story_question_answers enable row level security;

create index if not exists story_question_answers_story_idx
  on public.story_question_answers (story_id);

comment on table public.story_question_answers is
  'Optional answers to a storytelling campaign question. Separate from the story so the story keeps one consent record and these stay reportable.';
