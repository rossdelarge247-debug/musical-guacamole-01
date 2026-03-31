import { NextResponse } from 'next/server'

// Temporary debug endpoint — remove before going live
export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      ? `set (${process.env.ANTHROPIC_API_KEY.length} chars, starts with ${process.env.ANTHROPIC_API_KEY.slice(0, 8)}...)`
      : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...)`
      : 'NOT SET',
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY ? 'set' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    ai_demo_mode: !process.env.ANTHROPIC_API_KEY,
  })
}
