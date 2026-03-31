'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { IS_DEMO_ENV } from '@/lib/demo/flags'
import type { User } from '@/types'

// Demo user for when auth is in demo mode
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // In a real session, this would come from the server via createClient()
  // For Sprint Zero, we use the demo user — auth integration completes in R1
  const user = DEMO_USER
  const sidebarWidth = collapsed ? 60 : 240
  const topOffset = IS_DEMO_ENV ? 28 : 0

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar
        tier={user.tier}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />

      <Topbar user={user} sidebarWidth={sidebarWidth} />

      <main
        className="transition-[padding-left] duration-200"
        style={{
          paddingLeft: sidebarWidth,
          paddingTop: 56 + topOffset,
        }}
      >
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
