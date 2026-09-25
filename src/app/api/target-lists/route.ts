import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { z } from 'zod';
import { parseBody } from '@/lib/schemas';

const targetOfficialSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  level: z.enum(['federal', 'state']),
  state: z.string().length(2),
  chamber: z.string().max(20).nullish(),
  party: z.string().max(40).nullish(),
});

const createListSchema = z.object({
  name: z.string().trim().min(1).max(80),
  officials: z.array(targetOfficialSchema).min(1).max(100),
});

async function requireOrg(userId: string) {
  const { data } = await createAdminClient()
    .from('profiles')
    .select('account_type')
    .eq('user_id', userId)
    .single();
  return data?.account_type === 'organization';
}

/** GET /api/target-lists — the org's saved target lists. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from('org_target_lists')
    .select('id, name, officials, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load lists' }, { status: 500 });
  return NextResponse.json({ lists: data ?? [] });
}

/** POST /api/target-lists — save a named list of officials for reuse. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await requireOrg(user.id))) {
    return NextResponse.json({ error: 'Target lists are for organization accounts' }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = parseBody(createListSchema, raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from('org_target_lists')
    .insert({ user_id: user.id, name: parsed.data.name, officials: parsed.data.officials })
    .select('id, name, officials, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save list' }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE /api/target-lists?id=<uuid> — remove one of the org's lists. */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await createAdminClient()
    .from('org_target_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  return NextResponse.json({ success: true });
}
