import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { env } from '@/lib/env';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota } from '@/lib/usage-quota';
import { ORG_ASSISTANT_PROMPT } from '@/lib/org-assistant/prompt';
import { ORG_TOOLS, runOrgTool } from '@/lib/org-assistant/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * The organization assistant.
 *
 * An agentic loop: the model calls read tools against this organization's own
 * rows until it can answer. Write tools do not write. They return a proposal
 * that ends the turn and is handed to the person to approve, and the approval
 * goes to a separate route that re-validates everything. So the worst a
 * confused model can do here is read the organization's own data and suggest
 * something it cannot carry out.
 *
 * Non-streaming on purpose for a first version: the loop can take several
 * turns, and a correct answer that arrives whole is better than a stream that
 * has to be unwound when a tool fails.
 */
const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
});

const MODEL = process.env.ORG_ASSISTANT_MODEL || 'claude-opus-5';
const MAX_TOOL_TURNS = 8;

type Block =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type, org_name')
    .eq('user_id', user.id)
    .single();
  if (profile?.account_type !== 'organization') {
    return NextResponse.json({ error: 'This assistant is for organization accounts.' }, { status: 403 });
  }

  const ip = getClientIp(req);
  if (!chatLimiter.check(ip).success) {
    return NextResponse.json({ error: 'Too many messages right now. Wait a moment and try again.' }, { status: 429 });
  }
  const identity = { userId: user.id, ipHash: null };
  const { allowed } = await enforceDailyQuota(ip, 'chat', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { ANTHROPIC_API_KEY } = env();
  const ctx = { db: admin, userId: user.id };
  const messages: Array<{ role: 'user' | 'assistant'; content: string | Block[] }> = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const system = profile?.org_name
    ? `${ORG_ASSISTANT_PROMPT}\n\nYou are working with ${profile.org_name}.`
    : ORG_ASSISTANT_PROMPT;

  const toolsUsed: string[] = [];

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(90_000),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4000,
          system,
          tools: ORG_TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema })),
          messages,
        }),
      });

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 400);
        console.error('[org-assistant] model call failed:', res.status, detail);
        return NextResponse.json({ error: 'The assistant is unavailable right now. Try again shortly.' }, { status: 502 });
      }

      const data = (await res.json()) as { content: Block[]; stop_reason: string };
      const blocks = data.content ?? [];
      const text = blocks.filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text').map((b) => b.text).join('\n').trim();
      const calls = blocks.filter((b): b is Extract<Block, { type: 'tool_use' }> => b.type === 'tool_use');

      if (calls.length === 0) {
        return NextResponse.json({ reply: text || 'I do not have an answer for that.', toolsUsed });
      }

      // A write tool ends the turn with a proposal. Nothing is saved.
      const write = calls.find((c) => ORG_TOOLS.find((t) => t.name === c.name)?.proposesWrite);
      if (write) {
        toolsUsed.push(write.name);
        return NextResponse.json({
          // Always some text. When the model proposes a write with no
          // preamble the reply was empty, the client added no assistant turn,
          // and the next question re-ran every tool from scratch.
          reply: text || (write.name === 'propose_campaign'
            ? 'Here is the campaign I would create. Check it over.'
            : 'Here is the meeting I would record. Check it over.'),
          proposal: { kind: write.name, input: write.input },
          toolsUsed,
        });
      }

      messages.push({ role: 'assistant', content: blocks });
      const results: Block[] = [];
      for (const call of calls) {
        toolsUsed.push(call.name);
        let out: unknown;
        try {
          out = await runOrgTool(call.name, call.input ?? {}, ctx);
        } catch (err) {
          console.error('[org-assistant] tool failed:', call.name, err);
          out = { error: 'That lookup failed.' };
        }
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify(out).slice(0, 24_000),
          ...(out && typeof out === 'object' && 'error' in (out as object) ? { is_error: true } : {}),
        });
      }
      messages.push({ role: 'user', content: results });
    }

    return NextResponse.json({
      reply: 'I looked in several places and could not pull that together. Try asking for one thing at a time.',
      toolsUsed,
    });
  } catch (err) {
    console.error('[org-assistant] failed:', err);
    return NextResponse.json({ error: 'The assistant is unavailable right now. Try again shortly.' }, { status: 502 });
  }
}
