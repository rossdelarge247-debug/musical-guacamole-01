'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { IS_DEMO_ENV } from '@/lib/demo/flags'
import type { User } from '@/types'

export type ThemeId = '1' | '2'
const LS_THEME = 'im:theme'

export function AppShell({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<ThemeId>('1')

  const sidebarWidth = collapsed ? 60 : 240
  const topOffset = IS_DEMO_ENV ? 28 : 0

  // Load persisted theme and apply to <html>
  useEffect(() => {
    const saved = (localStorage.getItem(LS_THEME) ?? '1') as ThemeId
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function handleThemeChange(next: ThemeId) {
    setTheme(next)
    localStorage.setItem(LS_THEME, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar tier={user.tier} collapsed={collapsed} onCollapse={setCollapsed} />
      <Topbar user={user} sidebarWidth={sidebarWidth} theme={theme} onThemeChange={handleThemeChange} />
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
