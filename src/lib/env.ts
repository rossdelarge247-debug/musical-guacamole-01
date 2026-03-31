/**
 * Runtime environment variable access.
 *
 * webpack's DefinePlugin statically replaces ALL process.env.KEY and
 * process.env['KEY'] references at build time when KEY is a string literal.
 * If a variable wasn't set during the Vercel build, it gets baked in as
 * `undefined` — and no amount of Vercel dashboard updates will fix it
 * without a full rebuild.
 *
 * This module forces true runtime lookup by using a variable key, which
 * DefinePlugin cannot analyze. Values are resolved fresh on each call so
 * new deployments with updated env vars always pick up the current value.
 */

// Indirection that breaks DefinePlugin's static analysis
const _env = process.env

function runtimeEnv(key: string): string | undefined {
  return _env[key]
}

export const env = {
  ANTHROPIC_API_KEY: () => runtimeEnv('ANTHROPIC_API_KEY'),
  DEEPGRAM_API_KEY: () => runtimeEnv('DEEPGRAM_API_KEY'),
  STRIPE_SECRET_KEY: () => runtimeEnv('STRIPE_SECRET_KEY'),
  RESEND_API_KEY: () => runtimeEnv('RESEND_API_KEY'),
  SUPABASE_URL: () => runtimeEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: () => runtimeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
} as const

/** Returns a human-readable status string for a key (safe to log/display) */
export function keyStatus(key: () => string | undefined): string {
  const val = key()
  if (!val) return 'NOT SET'
  return `set (${val.length} chars, starts ${val.slice(0, 8)}…)`
}
