/**
 * Writer — stage 4. Turns a signal into a platform-native draft in the brand
 * brain's voice. The brand brain is passed in as the system prompt verbatim
 * (loaded at runtime, never hardcoded), so editing that file re-steers the
 * writer with no code change.
 */
import { callClaude, deDash, extractJSON } from '@/lib/claude';
import { graphemeLength } from './bluesky';
import { LOCAL_COVERAGE } from './guardrails';
import type { Signal } from './scout';

const SOFT_LIMIT = 280;

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
- ATTRIBUTION: if the item names an outlet (e.g. "via AP", "via Politico"),
  credit it in the post. Never present a reported claim as if it were ours.
- CLASSIFICATION handling: if 'actionable', include a clear CTA to weigh in on
  the linked campaign. If 'informational' (e.g. the daily brief), give context
  only and a soft "weigh in on what's moving" link, NO invented specific action.
- NEWS VOICE — be genuinely useful, not a template. Let the CONTENT pick the shape:
  * If there is ONE clearly dominant story, go deep on it: what happened AND why
    it matters to constituents. Depth over breadth.
  * If several items matter, give a tight digest, but each item earns a short
    "why it matters" clause — never bare headlines stacked together.
  Never use canned framing like "Your government, briefly:" or bait closers like
  "Got a take?". Sound like a knowledgeable, neutral person sharing what moved.
- LOCAL CTAs: the app can only route local-official actions in ${[...LOCAL_COVERAGE].join(', ')}.
  Unless the item is explicitly about one of those states, never tell readers to
  contact a city council, mayor, school board, county board, or "local
  officials"; point the CTA at the linked campaign instead.
- Match a posting lane from the brand brain (news drop / by-the-numbers / bill on the move / rolling brief).
- If the item can't be posted under these rules (source/campaign mismatch,
  partisan-only framing, unverifiable claims), do NOT explain in prose.
  Return ONLY JSON: {"skip": true, "reason": "<short internal note>"}

Return ONLY JSON: {"text": "<the post>", "lane": "<lane name>"} or {"skip": true, "reason": "<why>"}
`;

/** A skipped signal: the writer declined instead of drafting. Never publish. */
export interface WriterSkip {
  skip: true;
  reason: string;
}

export async function writePost(brandBrain: string, signal: Signal): Promise<Draft | WriterSkip> {
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

  // Anything that isn't a clean {"text": ...} is a skip, never a post body:
  // a structured {"skip": true}, prose refusals, meta notes, and parse failures
  // all land here. Raw model output must not reach the publish path (leaked
  // "SKIP, INPUT MISMATCH: ..." notes were published verbatim in July 2026).
  const parsed = extractJSON(raw) as { text?: string; lane?: string; skip?: boolean; reason?: string } | null;
  if (!parsed || parsed.skip || typeof parsed.text !== 'string' || !parsed.text.trim()) {
    return { skip: true, reason: parsed?.reason ?? 'writer returned no usable draft' };
  }

  let text = parsed.text;
  const lane = typeof parsed.lane === 'string' ? parsed.lane : 'rolling brief';

  // Backstop the brand's hardest rule regardless of what the model returned.
  text = deDash(text).trim();

  // Shorten passes if it's over length (the brief lane tends to run long), so
  // a good draft isn't thrown away by the length gate. Second attempt aims
  // well under the target in case the first lands just over.
  for (const target of [SOFT_LIMIT, 250]) {
    if (graphemeLength(text) <= SOFT_LIMIT) break;
    try {
      const shorter = await callClaude(
        `${brandBrain}\n\n---\nShorten this Bluesky post to UNDER ${target} graphemes. Keep the link, the voice, and the facts. Drop the least essential item if needed. No em dashes. Return ONLY JSON: {"text": "<post>"}`,
        text,
        300,
      );
      const parsed = extractJSON(shorter) as { text?: string } | null;
      if (parsed?.text) {
        const trimmed = deDash(parsed.text).trim();
        if (graphemeLength(trimmed) < graphemeLength(text)) text = trimmed;
      }
    } catch {
      // keep the current text; the length guardrail will gate it if still over
    }
  }

  return { text, lane };
}
