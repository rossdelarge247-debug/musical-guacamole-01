import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { ProfileContent } from './_content'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'

export const metadata: Metadata = { title: 'My Professional History' }

async function getFirstName(): Promise<string | null> {
  const flags = getDemoFlags()
  if (flags.auth) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name
    return fullName ? fullName.split(' ')[0] : null
  } catch { return null }
}

export default async function ProfilePage() {
  const firstName = await getFirstName()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Professional History' }]} />
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          My Professional History
        </h1>
      </div>

      <ProfileContent firstName={firstName} />
    </div>
  )
}
