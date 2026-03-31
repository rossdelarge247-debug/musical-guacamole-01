'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { IS_DEMO_ENV } from '@/lib/demo/flags'
import type { User } from '@/types'

export function AppShell({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 60 : 240
  const topOffset = IS_DEMO_ENV ? 28 : 0

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar tier={user.tier} collapsed={collapsed} onCollapse={setCollapsed} />
      <Topbar user={user} sidebarWidth={sidebarWidth} />
      <main
        className="transition-[padding-left] duration-200"
        style={{ paddingLeft: sidebarWidth, paddingTop: 56 + topOffset }}
      >
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
