import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test env() with different process.env values,
// so we re-import the module fresh each time via vi.resetModules()

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-key-123',
  ANTHROPIC_API_KEY: 'sk-ant-123',
  CONGRESS_API_KEY: 'congress-key-123',
  SUPABASE_SECRET_KEY: 'secret-key-123',
};

describe('env()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('validates and returns env vars when all required vars are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('CONGRESS_API_KEY', VALID_ENV.CONGRESS_API_KEY);
    vi.stubEnv('SUPABASE_SECRET_KEY', VALID_ENV.SUPABASE_SECRET_KEY);

    const { env } = await import('../env');
    const result = env();
    expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-123');
    expect(result.CONGRESS_API_KEY).toBe('congress-key-123');
  });

  it('throws when a required var (ANTHROPIC_API_KEY) is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    vi.stubEnv('CONGRESS_API_KEY', VALID_ENV.CONGRESS_API_KEY);
    vi.stubEnv('SUPABASE_SECRET_KEY', VALID_ENV.SUPABASE_SECRET_KEY);
    // Explicitly remove ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY;

    const { env } = await import('../env');
    expect(() => env()).toThrow('Invalid environment variables');
  });

  it('passes when optional vars (CLAUDE_MODEL) are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('CONGRESS_API_KEY', VALID_ENV.CONGRESS_API_KEY);
    vi.stubEnv('SUPABASE_SECRET_KEY', VALID_ENV.SUPABASE_SECRET_KEY);
    // CLAUDE_MODEL intentionally not set

    const { env } = await import('../env');
    const result = env();
    expect(result.CLAUDE_MODEL).toBeUndefined();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-url');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('CONGRESS_API_KEY', VALID_ENV.CONGRESS_API_KEY);
    vi.stubEnv('SUPABASE_SECRET_KEY', VALID_ENV.SUPABASE_SECRET_KEY);

    const { env } = await import('../env');
    expect(() => env()).toThrow('Invalid environment variables');
  });

  it('caches the result (singleton behavior)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('CONGRESS_API_KEY', VALID_ENV.CONGRESS_API_KEY);
    vi.stubEnv('SUPABASE_SECRET_KEY', VALID_ENV.SUPABASE_SECRET_KEY);

    const { env } = await import('../env');
    const first = env();
    const second = env();
    expect(first).toBe(second);
  });

  it('publicEnv() returns only public vars', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

    const { publicEnv } = await import('../env');
    const result = publicEnv();
    expect(result).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: VALID_ENV.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: VALID_ENV.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    });
    expect((result as Record<string, unknown>)['ANTHROPIC_API_KEY']).toBeUndefined();
  });
});
