import { z } from 'zod';

// Public env vars (available on client and server)
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

// Server-only env vars
const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  CLAUDE_MODEL: z.string().optional(),
  CONGRESS_API_KEY: z.string().min(1),
  FEC_API_KEY: z.string().optional(),
  LEGISCAN_API_KEY: z.string().optional(),
  OPENSTATES_API_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  CENSUS_API_KEY: z.string().optional(),
  // Communicating With Congress (CWC) delivery. All optional so the build and
  // non-delivery environments stay green; the deliver route hard-checks
  // CWC_API_KEY at call time and 503s if it is missing (fail-closed). The
  // test/prod split is purely env-driven — a different base URL + key, no
  // code branching.
  CWC_API_KEY: z.string().optional(),
  CWC_API_BASE_URL: z.string().url().optional(),
  CWC_DELIVERY_AGENT_ID: z.string().optional(),
  CWC_DELIVERY_AGENT_NAME: z.string().optional(),
  CWC_DELIVERY_AGENT_EMAIL: z.string().optional(),
  // Previously read via raw process.env; declared here for auditability. Kept
  // optional to preserve the lazy-validation contract (build has no env vars).
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  UNSUBSCRIBE_SECRET: z.string().optional(),
  IP_HASH_SALT: z.string().optional(),
  ADMIN_USER_IDS: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),
  // Platform-wide daily ceiling on AI-generation events (global spend breaker).
  GLOBAL_AI_DAILY_LIMIT: z.string().optional(),
});

// Combined schema
const envSchema = publicSchema.merge(serverSchema);

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error('Invalid environment variables:\n' + formatted);
    throw new Error('Invalid environment variables:\n' + formatted);
  }
  return result.data;
}

// Lazy singleton — validated on first access, not at module load time.
// This avoids breaking the build step (which doesn't have env vars).
let _env: Env | undefined;

export function env(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

// For use in client components (only public vars)
type PublicEnv = z.infer<typeof publicSchema>;

export function publicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  };
}
