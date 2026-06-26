/**
 * Attribution enforcement for storytelling submissions.
 *
 * The storyteller chooses how they're credited; we enforce that choice on our
 * end BEFORE the story is ever sent to the campaign creator:
 *   - named            → story is left as-is (their name stands).
 *   - first_name_only  → any occurrence of their full name is reduced to the
 *                        first name; a trailing-surname mention is dropped.
 *   - anonymous        → an Assistant pass redacts personally-identifying
 *                        details, and anything it can't confidently resolve is
 *                        flagged back to the storyteller to review by hand.
 */

import { callClaude, extractJSON } from '@/lib/claude';
import type { AttributionLevel } from '@/lib/types';

export interface AttributionResult {
  final_body: string;
  flagged: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const REDACT_PROMPT = `You anonymize a first-person personal story so it cannot be traced back to its author, while preserving its meaning and emotional truth.

Remove or generalize any uniquely identifying detail: full names, employers/specific organizations, exact street addresses, small/specific place names, phone numbers, emails, license/case/ID numbers, and any rare combination of facts that could single the person out. Keep the story coherent and human — replace specifics with neutral generalizations (e.g. "my employer", "a town near me") rather than deleting whole sentences.

Respond with ONLY this JSON:
{
  "redacted": "the anonymized story",
  "flagged": ["short descriptions of details you could NOT confidently anonymize and the author should review"]
}`;

/**
 * Apply the chosen attribution level to a story body.
 * For 'anonymous' this calls the model; the others are pure string ops.
 */
export async function applyAttribution(
  body: string,
  attributionLevel: AttributionLevel,
  storytellerName?: string | null
): Promise<AttributionResult> {
  const trimmed = body.trim();

  if (attributionLevel === 'named') {
    return { final_body: trimmed, flagged: [] };
  }

  if (attributionLevel === 'first_name_only') {
    const name = (storytellerName || '').trim();
    if (!name || !name.includes(' ')) {
      return { final_body: trimmed, flagged: [] };
    }
    const parts = name.split(/\s+/);
    const first = parts[0];
    let out = trimmed;
    // Replace the full name with just the first name.
    out = out.replace(new RegExp(escapeRegExp(name), 'gi'), first);
    // Drop standalone surname mentions (last token), but not the first name.
    const last = parts[parts.length - 1];
    if (last && last.toLowerCase() !== first.toLowerCase()) {
      out = out.replace(new RegExp(`\\b${escapeRegExp(last)}\\b`, 'g'), '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1');
    }
    return { final_body: out.trim(), flagged: [] };
  }

  // anonymous → model-based redaction
  try {
    const text = await callClaude(REDACT_PROMPT, trimmed, 1500);
    const json = extractJSON(text) as { redacted?: string; flagged?: string[] } | null;
    if (json && typeof json.redacted === 'string' && json.redacted.trim().length >= 10) {
      return {
        final_body: json.redacted.trim(),
        flagged: Array.isArray(json.flagged) ? json.flagged.filter((s) => typeof s === 'string').slice(0, 10) : [],
      };
    }
  } catch (err) {
    console.error('[story-attribution] redaction failed:', err);
  }

  // Fail safe: if redaction is unavailable, strip the provided name and flag
  // the whole story for manual review rather than leaking identity.
  let out = trimmed;
  const name = (storytellerName || '').trim();
  if (name) out = out.replace(new RegExp(escapeRegExp(name), 'gi'), 'a community member');
  return {
    final_body: out,
    flagged: ['We could not automatically anonymize your story — please re-read it and remove any details that could identify you before sending.'],
  };
}
