/**
 * DEMO MODE FLAGS
 *
 * Each flag is automatically `true` when the corresponding env variable is
 * absent. The app functions fully in demo mode — no spoofing, just real
 * functionality scoped to local/test data and browser-native fallbacks.
 *
 * Demo mode is disabled for a service the moment its real key is set in the
 * environment. No code changes needed — just add the key to .env.local.
 */

import type { DemoFlags } from '@/types'

export function getDemoFlags(): DemoFlags {
  return {
    // No Supabase → use in-memory store + email/password only
    auth: !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // No Anthropic key → return labelled fixture responses
    ai: !process.env.ANTHROPIC_API_KEY,

    // No Deepgram key → use browser Web Speech API
    transcription: !process.env.DEEPGRAM_API_KEY,

    // No Stripe key → use Stripe test mode stubs
    payments: !process.env.STRIPE_SECRET_KEY,

    // No Resend key → log emails to console
    email: !process.env.RESEND_API_KEY,

    // No Supabase storage → use local /tmp or in-memory
    storage: !process.env.NEXT_PUBLIC_SUPABASE_URL,
  }
}

/** Client-safe demo flags (only NEXT_PUBLIC_ vars are available client-side) */
export function getClientDemoFlags(): Pick<DemoFlags, 'auth' | 'payments'> {
  return {
    auth:
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.trim() === '',
    payments:
      !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim() === '',
  }
}

export const IS_DEMO_ENV =
  process.env.NEXT_PUBLIC_APP_ENV === 'development' ||
  process.env.NODE_ENV !== 'production'
