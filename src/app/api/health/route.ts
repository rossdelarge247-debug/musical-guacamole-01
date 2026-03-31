import { NextResponse } from 'next/server'
import { env, keyStatus } from '@/lib/env'
import { getDemoFlags } from '@/lib/demo/flags'

export async function GET() {
  const flags = getDemoFlags()

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
    { status: allLive ? 'ok' : 'partial', services },
    { status: 200 },
  )
}
