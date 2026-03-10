import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  return NextResponse.json({
    preferences: data || { weekly_digest: false, follow_up_reminders: false, email: user.email || '' },
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { weekly_digest?: boolean; follow_up_reminders?: boolean; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (typeof body.weekly_digest === 'boolean') {
    updates.weekly_digest = body.weekly_digest;
  }

  if (typeof body.follow_up_reminders === 'boolean') {
    updates.follow_up_reminders = body.follow_up_reminders;
  }

  if (typeof body.email === 'string' && body.email.includes('@')) {
    updates.email = body.email;
  } else if (!body.email) {
    updates.email = user.email || '';
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(updates, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[notifications/preferences] Error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
