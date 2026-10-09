import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { callClaude, deDash, extractJSON } from '@/lib/claude';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { sanitizeAiJurisdiction } from '@/lib/issue-jurisdiction';
import { validateCampaignAsk } from '@/lib/envelope';
import { detectLanguage, translateToEnglish, type SupportedLanguage } from '@/lib/language';
import { parseTalkingPoints, talkingPointCoverage, MAX_REQUIRED_POINTS } from '@/lib/talking-points';
import {
  askAddressesOfficial,
  askContradictsStance,
  detectAiCadence,
  looksLikeRefusal,
  sentencesWithUnsourcedStats,
  openingRepeatsBody,
  auditMessageQuality,
  detectUnsupportedIdentityClaims,
  detectUnsourcedStats,
  stripUnsourcedStats,
  sharesVerbatimRun,
} from '@/lib/message-quality';

export const runtime = 'nodejs';

/**
 * Message-first flow, pass one of one: draft the constituent's CORE message —
 * their story + the campaign's talking points — before we know who their
 * officials are. The core is reviewed and approved by the constituent and is
 * never altered afterwards; per-official tailoring is a deterministic
 * template envelope (salutation + relevance line + ask) wrapped around it
 * client-side. One AI call per participant instead of one per official.
 *
 * Because no official is known yet, the core carries no official references,
 * and no name/address (the CWC rule) — those live in the envelope.
 */

const coreSchema = z
  .object({
    campaignSlug: z.string().min(1).max(120).optional(),
    // Freeform mode (the general contact flow): no campaign, just the
    // constituent's issue and what they want to say.
    issue: z.string().max(500).optional(),
    ask: z.string().max(1000).optional(),
    stance: z.enum(['support', 'oppose', 'undecided']).optional(),
    personalWhy: z.string().max(4000).optional(),
    // The guided chat, when the constituent used it: the guide's questions give
    // the answers their meaning ("Three times" needs "how many times?"). Only
    // the constituent's own turns count as their words for the gates below.
    interview: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
      .max(40)
      .optional(),
    turnstileToken: z.string().optional(),
  })
  .refine((d) => d.campaignSlug || d.issue, { message: 'campaignSlug or issue required' });

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = coreSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const ip = getClientIp(request);
  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(parsed.data.turnstileToken || '', { strict: !identity.userId });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }
  const { allowed } = await enforceDailyQuota(ip, 'generate_message', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily message limit reached. Try again tomorrow.' }, { status: 429 });
  }

  let campaign: {
    headline: string;
    description: string;
    direction: string | null;
    message_template: string | null;
    is_official: boolean | null;
    bill_ref: string | null;
    bill_title: string | null;
    stage_goal?: string | null;
    bill_level?: string | null;
    target_level?: string | null;
    talking_points_coverage?: string | null;
  } | null = null;
  if (parsed.data.campaignSlug) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('campaigns')
      .select('headline, description, direction, message_template, is_official, bill_ref, bill_title, issue_area, stage_goal, bill_level, target_level, talking_points_coverage')
      .eq('slug', parsed.data.campaignSlug)
      .eq('approval_status', 'approved')
      .single();
    if (!data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    campaign = data;
  }

  // Bilingual: a participant who writes in Spanish gets an English letter
  // drafted from a faithful translation of their words, plus their original
  // Spanish appended by the envelope, plus a Spanish reading copy of the
  // English core so they can review what goes out in their name. The
  // pipeline and every gate below stay English.
  const inWhy = parsed.data.personalWhy?.trim() || '';
  const inIssue = parsed.data.issue?.trim() || '';
  const inGoal = parsed.data.ask?.trim() || '';
  const inputLanguage: SupportedLanguage = detectLanguage([inWhy, inIssue, inGoal].filter(Boolean).join('\n'));
  let personalWhy = inWhy;
  let inputIssue = inIssue;
  let inputGoal = inGoal;
  let original: { language: SupportedLanguage; text: string } | null = null;
  if (inputLanguage === 'es') {
    const [whyEn, issueEn, askEn] = await Promise.all([
      inWhy ? translateToEnglish(inWhy) : Promise.resolve(null),
      inIssue && detectLanguage(inIssue) === 'es' ? translateToEnglish(inIssue) : Promise.resolve(null),
      inGoal && detectLanguage(inGoal) === 'es' ? translateToEnglish(inGoal) : Promise.resolve(null),
    ]);
    if (inWhy && !whyEn) {
      console.warn('[generate-core] translation failed; drafting from the original text');
    }
    personalWhy = whyEn || inWhy;
    inputIssue = issueEn || inIssue;
    inputGoal = askEn || inGoal;
    // Their own words, verbatim, are what the official reads in Spanish.
    if (inWhy) original = { language: 'es', text: inWhy };
  }

  // The interview transcript, when there was one, is context for reading the
  // answers. Guide lines are OUR questions and are never facts about the
  // constituent; an unanswered question is not information.
  const interview = (parsed.data.interview ?? []).filter((m) => m.content.trim());
  const interviewBlock =
    interview.length > 1
      ? `\n\nHOW THOSE WORDS CAME UP (a short guided chat; "Guide:" lines are our questions, not the constituent's words, and nothing the Guide said is a fact about them):\n${interview
          .map((m) => `${m.role === 'user' ? 'Constituent' : 'Guide'}: ${m.content.trim()}`)
          .join('\n')}`
      : '';

  // Official weigh-ins carry the PARTICIPANT's stance; org campaigns carry
  // the campaign's own direction; freeform mode carries whatever the
  // constituent asked for, in their ask.
  const hasStory = Boolean(personalWhy);
  const officialStance =
    campaign?.is_official && parsed.data.stance && parsed.data.stance !== 'undecided' ? parsed.data.stance : null;
  // Official weigh-ins are questions ("Should Congress protect Head Start
  // funding?"). "The constituent OPPOSES this" left "this" ambiguous and the
  // model argued the other side or refused (audit 2026-09-29), so the
  // position is spelled out as the answer to the question.
  const position = !campaign
    ? "THE CONSTITUENT'S GOAL is their position. Argue for it and only for it. If their story seems to cut against the goal, keep the goal, use only the parts of the story that fit, and never write an ask they did not state."
    : campaign.is_official
    ? officialStance
      ? `The constituent was asked "${campaign.headline}" and answered ${officialStance === 'support' ? 'YES' : 'NO'}. Write the case for that answer and only that answer.${
          officialStance === 'oppose'
            ? ' The campaign description and talking points lay out the YES side. Treat them as the other side: use them only to know what the constituent is arguing against, and do not borrow their conclusion.'
            : ''
        }${hasStory ? '' : ' The constituent shared no words of their own. Do not invent reasons they hold this view. State the position plainly and ask the official to weigh it.'}`
      : 'The constituent is still weighing this. Write a thoughtful message urging serious attention to the issue without taking a side for them.'
    : `This campaign asks officials to ${campaign.direction === 'oppose' ? 'OPPOSE' : 'SUPPORT'} it. Argue that side clearly.`;

  // Length follows the reader. Congressional offices skim; state legislators
  // often read the letter themselves and have smaller staffs, so a state-only
  // campaign gets a tighter core. (CMF staff surveys: personal and specific
  // beats long.)
  const stateOnly = campaign?.bill_level === 'state' || campaign?.target_level === 'state';
  const lengthRule = stateOnly
    ? 'With a personal story, 130 to 200 words. Without one, 80 to 130 words. State legislators read these themselves; keep it tight.'
    : 'With a personal story, 180 to 250 words. Without one, 90 to 150 words.';
  const longWords = stateOnly ? 260 : 300;
  const longTarget = stateOnly ? 200 : 250;
  // Talking points: an organization's campaign makes every point by default
  // (that is what the org is asking for); official weigh-ins and "fit" mode
  // use the ones that connect. Points are always paraphrased, never pasted.
  const points = campaign?.message_template ? parseTalkingPoints(campaign.message_template) : [];
  const requireAllPoints = !!campaign && !campaign.is_official && campaign.talking_points_coverage !== 'fit' && points.length > 0 && points.length <= MAX_REQUIRED_POINTS;
  const talkingPointsRule = requireAllPoints
    ? `- The campaign's talking points are listed as separate items. Make EVERY one of them (there are ${points.length}), each in your own words and the constituent's voice, in whatever order fits their story, and connect each to what they wrote where you can. A point may be one sentence. Numbers from the talking points may be used. Never paste.`
    : '- Use two or three of the campaign\'s talking points, the ones that connect to what the constituent wrote, in your own order and your own words. Numbers from the talking points may be used when they strengthen the case. Never paste.';

  const system = `You draft the CORE of a constituent's message to elected officials. The core is the constituent's own case — it will later be wrapped with a greeting, an official-specific opening, a closing ask, and a signature. Because of that:

- Do NOT address any official, reference any specific official, or assume which chamber or committee will read it.
- Do NOT include a greeting, sign-off, the constituent's name, or their address anywhere.
- Do NOT include a final "I ask you to vote..." sentence — the ask is added later.
- First person, plain human language. ${lengthRule}
- Write flat declarative sentences. Do not use these shapes: three parallel items in a row, "not X but Y", "this is not X, it is Y", "this is not abstract", a closing line that turns the meaning around, or any dash. If you want a dash, end the sentence and start a new one.
- ONE issue only — the one given. Do not drift into other topics.
${talkingPointsRule}
- If the constituent shared a personal story, it is the heart of the message. Lead with it, give it room, and keep their meaning exactly. Develop what they said: set the scene in the terms they gave, say what the moment meant for them, draw out the stakes their words carry, and name the feeling a moment plainly conveys. Then connect their experience to the larger issue and the ask. The line is between meaning and facts: you may develop meaning and stakes; you may not add anything a reader could check. Do not add ages, incomes, jobs, family members, diagnoses, insurance status, dollar amounts, dates, distances, durations, events, outcomes, or what other people said or intended. Quote their own phrases where they fit.
- If the constituent shared no personal story, argue from their goal and general reasoning with real substance: why the issue matters, who is affected, what is at stake. Speak about people in general ("homeowners in wildfire zones"), never about the constituent's own town, family, work, or experiences. Do not describe local conditions or events as fact.
- Invent nothing about the constituent, and invent no statistics, studies, or figures. If the campaign talking points supply a number you may use it; otherwise argue from the constituent's experience and plain reasoning — never "studies show".
- NEVER claim an identity, profession, or lived experience for the constituent that their own words do not state. Caring about veterans does not make them a veteran; caring about schools does not give them children. If they shared no personal stake, write as a concerned constituent about the people affected ("veterans in my community"), never in a borrowed first person ("I served", "my kids"). And never assert that specific harms or events have happened in their own community ("families here are burying their children") unless they said so — concern is theirs to feel; events are theirs to report.
- Respectful and firm. No insults, no partisan name-calling, no threats, and no "or you'll lose my vote" — offices discount those.
- No ALL-CAPS words, no stacked exclamation points.

Also write "subject": an email subject line in the constituent's own voice, specific to their actual concern, under 80 characters, no official's name. The subject may only contain facts and numbers the constituent wrote. Never generic labels like "A constituent message", "Regarding my concerns", or a bare topic word. Good: "Groceries in our house cost a third more than in 2022". Bad: "A constituent message: Inflation".

Also write "opening": one or two sentences that open the email, before the core — the constituent introducing why they are writing, in their own voice. No official's name, title, chamber, or committee (unknown at this point). Do NOT use stock phrasings like "I am writing to you as your constituent" — make it natural and specific to this person and issue. Vary sentence structure freely. The opening and the body are read back to back: the body must NOT repeat the opening's facts, credentials, or phrasing. If the opening gives the constituent's job, family role, or town, the body must not give it again in any wording. The body's first sentence must be about the issue.

Also write "ask": the closing request of the email, one sentence, or two when the constituent's goal has two parts, in the constituent's voice and matching their position exactly. The ask is addressed to the ELECTED OFFICIAL who is reading the email, so it asks THEM to act. When the constituent's goal names an agency, department, company, or other third party (for example "Urge HHS to rescind the rule"), the ask must request that the official press that party: "Please urge HHS to rescind the proposed rule and preserve the Head Start standards." Never write the ask as if the reader were the third party ("I urge HHS to..."). Cover every part of the constituent's goal; do not drop the second half. No greeting, no sign-off, no official's name.

Also classify which levels of government have real authority over this issue.
Weights: 2 = primary authority, 1 = shares authority, 0 = no meaningful
authority. Be strict about 0s: a US senator cannot fix trash pickup; a city
council cannot fix Social Security.

${officialStance ? '\nAlso write "side": the answer you argued for, exactly "YES" or "NO".\n' : ''}${original ? '\nThe constituent wrote in Spanish. Also write "body_es": a faithful Spanish rendering of "body", sentence for sentence, so they can read what is being sent in their name. Same facts, same order, nothing added. No dashes.\n' : ''}
Return ONLY JSON. Never explain, refuse, or add notes: {"body": "...", "subject": "...", "opening": "...", "ask": "..."${officialStance ? ', "side": "YES"|"NO"' : ''}${original ? ', "body_es": "..."' : ''}, "jurisdiction": {"federal": 0|1|2, "state": 0|1|2, "local": 0|1|2}}`;

  // The precise action the ask sentence must carry (validated after).
  const stanceVerb =
    campaign?.is_official && parsed.data.stance && parsed.data.stance !== 'undecided'
      ? parsed.data.stance
      : campaign && !campaign.is_official
      ? campaign.direction === 'oppose' ? 'oppose' : 'support'
      : null;
  const askInstruction = campaign?.bill_ref
    ? `THE ASK SENTENCE MUST: name ${campaign.bill_ref} and ask them to ${
        campaign.stage_goal === 'cosponsor' ? `cosponsor it` : stanceVerb === 'oppose' ? 'oppose it / vote no' : 'support it / vote yes'
      }.`
    : '';

  const user = campaign
    ? `CAMPAIGN: ${campaign.headline}
${campaign.bill_ref ? `BILL: ${campaign.bill_ref}${campaign.bill_title ? ` — ${campaign.bill_title}` : ''}` : ''}
ABOUT: ${campaign.description}
${campaign.message_template ? (requireAllPoints ? `CAMPAIGN TALKING POINTS (make every one):\n${points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}` : `CAMPAIGN TALKING POINTS: ${campaign.message_template}`) : ''}
POSITION: ${position}
${askInstruction}`
    : `ISSUE: ${inputIssue}
${inputGoal ? `THE CONSTITUENT'S GOAL: ${inputGoal}` : ''}
POSITION: ${position}`;
  const user2 = `${user}
${hasStory ? `THE CONSTITUENT'S OWN WORDS ABOUT WHY THIS MATTERS TO THEM${original ? ' (translated from their Spanish)' : ''}: """${personalWhy}"""` : 'The constituent did not share a personal story. Argue only from their goal and general reasoning, and say nothing about their own life or town.'}${interviewBlock}

Draft the core message.`;

  try {
    // Quality gate with one retry: a draft that trips a blocking check
    // (threats, AI leakage, placeholders) is regenerated once, then refused —
    // a bad draft must never be the thing we show a constituent.
    // Everything the constituent actually said — the ONLY licence for any
    // first-person identity claim in the draft.
    const userOwnWords = [inputIssue, inputGoal, personalWhy].filter(Boolean).join(' ');
    // The only licensed sources for any statistic in the draft: the campaign's
    // own material and the constituent's own words.
    const statSource = [
      campaign?.headline, campaign?.description, campaign?.message_template,
      campaign?.bill_ref, campaign?.bill_title, userOwnWords,
    ].filter(Boolean).join(' ');

    type CoreOut = { body?: string; subject?: unknown; opening?: unknown; ask?: unknown; side?: unknown; body_es?: unknown; jurisdiction?: unknown } | null;
    let out: CoreOut = null;
    let body = '';
    let correction = '';
    // Why each attempt was rejected, so a 502 in the logs says what happened.
    const rejects: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const rawOut = await callClaude(correction ? `${system}\n\n${correction}` : system, user2, original ? 2200 : 1400);
      out = extractJSON(rawOut) as CoreOut;
      if (!out) {
        // Prose instead of JSON is almost always the model arguing with the
        // POSITION line. Answer it once, then give up.
        correction = looksLikeRefusal(rawOut)
          ? 'Your previous reply was prose, not the JSON object. POSITION is the constituent\'s own choice and is not up for debate. Write the case for it as instructed and return the JSON object and nothing else.'
          : 'Return the JSON object and nothing else. Do not explain.';
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      const rawBody = String(out?.body ?? '').trim();
      if (attempt === 0 && /[\u2014\u2013]/.test(rawBody)) {
        correction = 'Your previous draft used dashes. Rewrite it with none. End the sentence and start a new one instead.';
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      body = deDash(rawBody);
      if (!body || body.length < 40) continue;
      if (officialStance) {
        const side = String(out?.side ?? '').trim().toUpperCase();
        const expected = officialStance === 'support' ? 'YES' : 'NO';
        if (side !== expected) {
          // Wrong side in a constituent's name is the one thing worse than
          // no draft. The second miss falls through to the 502.
          correction = `YOUR PREVIOUS DRAFT argued the ${side || 'wrong'} side. The constituent answered ${expected}. Write the case for ${expected} and set "side" to "${expected}".`;
          rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
          body = '';
          continue;
        }
      }
      const cadence = detectAiCadence(rawBody);
      if (attempt === 0 && cadence.length > 0) {
        correction = `YOUR PREVIOUS DRAFT used machine-writing shapes: ${cadence.slice(0, 3).map((c) => `"${c}"`).join(', ')}. Rewrite in flat declarative sentences with none of them.`;
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      const draftFull = [String(out?.opening ?? ''), body, String(out?.ask ?? '')].join(' ');
      if (body.split(/\s+/).length > longWords) {
        correction = `Your previous draft ran long. Rewrite it UNDER ${longTarget} words, keeping the strongest details of the story.`;
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      // Pasted talking points = identical paragraphs across every
      // participant, the form-letter fingerprint offices dedupe on.
      if (campaign?.message_template && sharesVerbatimRun(campaign.message_template, body)) {
        correction =
          "YOUR PREVIOUS DRAFT COPIED the campaign talking points word for word. Do not paste them. Make their strongest two or three points in fresh wording, in the constituent's voice.";
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      if (requireAllPoints) {
        const { missing } = talkingPointCoverage(body, points);
        if (missing.length > 0) {
          if (attempt === 0) {
            correction = `YOUR PREVIOUS DRAFT LEFT OUT ${missing.length === 1 ? 'this talking point' : 'these talking points'}: ${missing.map((m) => `"${m}"`).join(' ')}. The campaign asks that every point be made. Add ${missing.length === 1 ? 'it' : 'them'} in your own words, each as at least one sentence, keeping everything else.`;
            rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
            body = '';
            continue;
          }
          // Second miss: ship the draft and log it; a letter beats no letter.
          console.info('[generate-core] talking points still missing after retry:', missing);
        }
      }
      const fabricated = detectUnsupportedIdentityClaims(draftFull, userOwnWords);
      if (fabricated.length > 0) {
        // Retry with the specific correction — this is the one failure the
        // system can never ship (a false "I'm a veteran" in someone's name).
        correction = `YOUR PREVIOUS DRAFT FALSELY CLAIMED the constituent has this identity/experience: ${fabricated.join('; ')}. They said no such thing. Remove that claim. Keep every fact the constituent actually wrote, and speak about the people affected rather than as one of them for anything they did not say.`;
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      const unsourced = detectUnsourcedStats(body, statSource);
      if (unsourced.length > 0) {
        if (attempt === 0) {
          const offending = sentencesWithUnsourcedStats(body, statSource).slice(0, 3);
          correction = `YOUR PREVIOUS DRAFT ASSERTED figures the source material does not contain: ${unsourced.join('; ')}. Do not recall numbers from memory. Remove ${offending.length === 1 ? 'this sentence' : 'these sentences'} entirely and do not replace ${offending.length === 1 ? 'it' : 'them'} with other figures: ${offending.map((o) => `"${o}"`).join(' ')}`;
          rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
          body = '';
          continue;
        }
        // Final attempt: strip the offending sentences rather than refuse —
        // losing a sentence beats losing the draft. If that guts the body,
        // fall through to the refusal path.
        body = stripUnsourcedStats(body, statSource);
        if (detectUnsourcedStats(body, statSource).length > 0 || body.length < 40) {
          rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
          body = '';
          continue;
        }
      }
      // Frame checks (retry once with a pointed correction; the body itself
      // is fine, so a second miss just drops the frame field to the pools).
      const askText = String(out?.ask ?? '').trim();
      if (attempt === 0 && askText && campaign && !campaign.is_official && askContradictsStance(askText, stanceVerb)) {
        correction = `YOUR PREVIOUS "ask" argued against the campaign's position ("${askText.slice(0, 120)}"). This campaign asks officials to ${stanceVerb?.toUpperCase()} it. Rewrite the ask on that side.`;
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      if (attempt === 0 && askText && !askAddressesOfficial(askText)) {
        correction = `YOUR PREVIOUS "ask" was addressed past the reader ("${askText.slice(0, 120)}"). The reader is the elected official. Rewrite the ask so it asks THEM to act, e.g. "Please urge [the agency] to..." or "Please work with...". Keep every part of the constituent's goal.`;
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      const openingText = String(out?.opening ?? '').trim();
      if (attempt === 0 && openingText && openingRepeatsBody(openingText, body)) {
        correction = 'YOUR PREVIOUS DRAFT repeated the opening sentence inside the body. The opening and the body are read together: state the constituent\'s background ONCE. Rewrite the body so it starts with the case, not with the same introduction.';
        rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
        body = '';
        continue;
      }
      const blocking = auditMessageQuality(body, { source: 'ai' }).filter((i) => i.level === 'block');
      if (blocking.length === 0) break;
      rejects.push(`attempt ${attempt}: blocking ${blocking.map((i) => i.code).join(',')}`);
      rejects.push(`attempt ${attempt}: ${correction.slice(0, 120)}`);
      body = '';
    }
    if (!body) {
      console.warn('[generate-core] refused:', rejects.length ? rejects : ['empty or short body on every attempt']);
      return NextResponse.json({ error: 'Could not draft a message — please try again' }, { status: 502 });
    }
    if (rejects.length) console.info('[generate-core] retried:', rejects);
    // Frame fields are best-effort: null (deterministic seeded pools
    // client-side) beats a generic or wrong one slipping through.
    const rawSubject = deDash(String(out?.subject ?? '')).replace(/^["'\s]+|["'\s]+$/g, '');
    const subject =
      rawSubject.length >= 8 && !/constituent message/i.test(rawSubject) && detectUnsourcedStats(rawSubject, statSource).length === 0
        ? rawSubject.slice(0, 90)
        : null;
    const rawOpening = deDash(String(out?.opening ?? '').trim());
    const opening =
      rawOpening.length >= 20 && rawOpening.length <= 400 && !/^dear\b/i.test(rawOpening) && !/i am writing to you as your constituent because your vote/i.test(rawOpening) && detectUnsourcedStats(rawOpening, statSource).length === 0 && !openingRepeatsBody(rawOpening, body)
        ? rawOpening
        : null;
    const rawAsk = deDash(String(out?.ask ?? '').trim());
    // Campaign asks must name the bill and match the direction exactly —
    // anything off falls back to the deterministic closers.
    const ask =
      rawAsk.length >= 10 && rawAsk.length <= 400 && !/^dear\b/i.test(rawAsk) && detectUnsourcedStats(rawAsk, statSource).length === 0 && askAddressesOfficial(rawAsk)
        ? campaign?.bill_ref
          ? validateCampaignAsk(rawAsk, campaign.bill_ref, stanceVerb, campaign.stage_goal) ? rawAsk : null
          : campaign && !campaign.is_official && askContradictsStance(rawAsk, stanceVerb)
          ? null
          : rawAsk
        : null;
    // AI jurisdiction is advisory: the client applies it ONLY when no
    // deterministic rule matched the issue text.
    const jurisdiction = sanitizeAiJurisdiction(out?.jurisdiction)?.weights ?? null;
    // Spanish reading copy of the core: for the participant's eyes, never sent.
    const rawBodyEs = original ? deDash(String(out?.body_es ?? '').trim()) : '';
    const body_es = rawBodyEs.length >= 40 ? rawBodyEs : null;
    return NextResponse.json({ body, subject, opening, ask, jurisdiction, body_es, original });
  } catch (err) {
    console.error('[generate-core] failed:', err);
    return NextResponse.json({ error: 'Message drafting is unavailable right now' }, { status: 503 });
  }
}
