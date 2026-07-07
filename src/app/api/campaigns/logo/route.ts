import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/campaigns/logo
 * Upload an organization logo for white-labeled campaigns. Signed-in users
 * only. Accepts multipart form data with a `file` field (png/jpeg/webp,
 * max 1 MB) and returns the public URL to save on the campaign.
 *
 * SVG is deliberately excluded — inline SVG can carry scripts.
 */

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_BYTES = 1024 * 1024; // 1 MB

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = profileLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Logo must be a PNG, JPEG, or WebP image' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Logo must be 1 MB or smaller' }, { status: 400 });
  }

  const admin = createAdminClient();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from('campaign-logos')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[campaigns/logo] upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data } = admin.storage.from('campaign-logos').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
