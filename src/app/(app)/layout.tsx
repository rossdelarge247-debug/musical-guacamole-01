import { getDemoFlags } from '@/lib/demo/flags'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from './app-shell'
import type { User } from '@/types'

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@interviewmonkey.co.uk',
  full_name: 'Demo User',
  avatar_url: null,
  tier: 'pro',
  addons: [],
  preferred_answer_style: null,
  preferred_interview_modes: [],
  live_workspace_declaration_accepted: false,
  live_workspace_declaration_accepted_at: null,
  gdpr_consented_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

async function getUser(): Promise<User> {
  const flags = getDemoFlags()
  if (flags.auth) return DEMO_USER

  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return DEMO_USER

    // Try to get the full user record from our users table
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (dbUser) return dbUser as User

    // Fall back to constructing from auth user metadata
    return {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
      tier: 'core',
      addons: [],
      preferred_answer_style: null,
      preferred_interview_modes: [],
      live_workspace_declaration_accepted: false,
      live_workspace_declaration_accepted_at: null,
      gdpr_consented_at: null,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at ?? authUser.created_at,
    }
  } catch {
    return DEMO_USER
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return <AppShell user={user}>{children}</AppShell>
}
