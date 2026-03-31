import { NextResponse } from 'next/server'
import { env, keyStatus } from '@/lib/env'
import { getDemoFlags } from '@/lib/demo/flags'

export async function GET() {
  const flags = getDemoFlags()

  // Deep diagnostic: understand exactly what's visible server-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = (globalThis as any)['process']
  const diagnostic = {
    globalThis_process_defined: proc !== undefined,
    NODE_ENV_via_runtimeEnv: proc?.env?.['NODE_ENV'] ?? 'NOT VISIBLE',
    env_key_count: proc ? Object.keys(proc.env ?? {}).length : 0,
    keys_containing_ANTHROPIC: proc
      ? Object.keys(proc.env ?? {}).filter((k: string) => k.includes('ANTHROPIC'))
      : [],
    keys_containing_SUPABASE: proc
      ? Object.keys(proc.env ?? {}).filter((k: string) => k.includes('SUPABASE'))
      : [],
    ANTHROPIC_API_KEY_via_globalThis: proc?.env?.['ANTHROPIC_API_KEY']
      ? `set (${(proc.env['ANTHROPIC_API_KEY'] as string).length} chars)`
      : 'NOT SET',
  }

  const services = {
    ai: {
      configured: !flags.ai,
      key: keyStatus(env.ANTHROPIC_API_KEY),
      mode: flags.ai ? 'demo' : 'live',
    },
    auth: {
      configured: !flags.auth,
      supabase_url: keyStatus(env.SUPABASE_URL),
      mode: flags.auth ? 'demo' : 'live',
    },
    transcription: {
      configured: !flags.transcription,
      key: keyStatus(env.DEEPGRAM_API_KEY),
      mode: flags.transcription ? 'demo (Web Speech API)' : 'live',
    },
    payments: {
      configured: !flags.payments,
      key: keyStatus(env.STRIPE_SECRET_KEY),
      mode: flags.payments ? 'demo' : 'live',
    },
    email: {
      configured: !flags.email,
      key: keyStatus(env.RESEND_API_KEY),
      mode: flags.email ? 'demo (console log)' : 'live',
    },
  }

  const allLive = Object.values(services).every((s) => s.configured)

  return NextResponse.json(
    { status: allLive ? 'ok' : 'partial', diagnostic, services },
    { status: 200 },
  )
}
