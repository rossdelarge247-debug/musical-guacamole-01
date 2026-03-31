import type { Metadata } from 'next'
import { getDemoFlags } from '@/lib/demo/flags'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './_content'

export const metadata: Metadata = { title: 'Dashboard' }

async function getFirstName(): Promise<string | null> {
  const flags = getDemoFlags()
  if (flags.auth) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const fullName: string | undefined =
      user.user_metadata?.full_name ?? user.user_metadata?.name
    return fullName ? fullName.split(' ')[0] : null
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const firstName = await getFirstName()
  return <DashboardContent firstName={firstName} />
}
