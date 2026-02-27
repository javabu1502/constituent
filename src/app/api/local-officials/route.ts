import { NextResponse } from 'next/server';
import { fetchLocalOfficials } from '@/lib/civic-api';

/**
 * POST /api/local-officials
 * Takes address fields, returns local officials from Google Civic Information API.
 */
export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { street, city, state, zip } = body;

  if (!street || !city || !state || !zip) {
    return NextResponse.json(
      { error: 'Missing required fields: street, city, state, zip' },
      { status: 400 }
    );
  }

  const address = `${street}, ${city}, ${state} ${zip}`;

  try {
    const officials = await fetchLocalOfficials(address);
    return NextResponse.json({ officials });
  } catch (err) {
    console.error('Local officials lookup failed:', err);
    return NextResponse.json(
      { error: 'Unable to look up local officials right now. Please try again later.' },
      { status: 502 }
    );
  }
}
