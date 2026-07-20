/**
 * Writer — stage 4. Turns a signal into a platform-native draft in the brand
 * brain's voice. The brand brain is passed in as the system prompt verbatim
 * (loaded at runtime, never hardcoded), so editing that file re-steers the
 * writer with no code change.
 */
import { callClaude, deDash, extractJSON } from '@/lib/claude';
import type { Signal } from './scout';

export interface Draft {
  text: string;
  lane: string;
}

const WRITER_INSTRUCTIONS = `
You are the Writer stage of the My Democracy Social Desk. The system prompt
above is the brand brain — obey every rule in it.

Write ONE Bluesky post about the item below. Hard rules:
- 280 graphemes max (Bluesky's limit is 300; stay under 280 for safety).
- Put the link inline (Bluesky shows inline links).
- Nonpartisan: never say how to vote, never praise or attack a party or figure.
- No em dashes. No AI tells. Sound like the approved examples, not an assistant.
- Only claim what the item states. Invent nothing. This is strict for news.
- CLASSIFICATION handling: if 'actionable', include a clear CTA to weigh in on
  the linked campaign. If 'informational' (e.g. the daily brief), give context
  only and a soft "weigh in on what's moving" link, NO invented specific action.
- Match a posting lane from the brand brain (news drop / by-the-numbers / bill on the move / rolling brief).

Return ONLY JSON: {"text": "<the post>", "lane": "<lane name>"}
`;

export async function writePost(brandBrain: string, signal: Signal): Promise<Draft> {
  const item = [
    `TITLE: ${signal.title ?? ''}`,
    `SUMMARY: ${signal.summary ?? ''}`,
    `LINK: ${signal.url ?? ''}`,
    `ISSUE AREA: ${signal.issue_area ?? ''}`,
    `CLASSIFICATION: ${signal.classification ?? 'actionable'}`,
    `SOURCE: ${signal.source ?? ''}`,
  ].join('\n');

  const raw = await callClaude(
    `${brandBrain}\n\n---\n${WRITER_INSTRUCTIONS}`,
    item,
    400,
  );

  let text = '';
  let lane = 'rolling brief';
  const parsed = extractJSON(raw) as { text?: string; lane?: string } | null;
  if (parsed && typeof parsed.text === 'string') {
    text = parsed.text;
    if (typeof parsed.lane === 'string') lane = parsed.lane;
  } else {
    text = raw.trim();
  }

  // Backstop the brand's hardest rule regardless of what the model returned.
  text = deDash(text).trim();
  return { text, lane };
}
