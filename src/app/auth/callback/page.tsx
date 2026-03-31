'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient()
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        // Hard redirect so middleware sees the new session cookies
        window.location.href = '/dashboard'
      }).catch(() => {
        window.location.href = '/login'
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        window.location.href = session ? '/dashboard' : '/login'
      })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[14px] text-[var(--color-text-secondary)]">Signing you in…</p>
      </div>
    </div>
  )
}
