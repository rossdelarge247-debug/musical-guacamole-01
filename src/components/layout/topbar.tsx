'use client'

import { Search, HelpCircle, Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import { IS_DEMO_ENV } from '@/lib/demo/flags'
import type { User } from '@/types'
import type { ThemeId } from '@/app/(app)/app-shell'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: '1', label: 'Classic' },
  { id: '2', label: 'Bold' },
]

interface TopbarProps {
  user: User
  sidebarWidth: number
  theme: ThemeId
  onThemeChange: (t: ThemeId) => void
}

export function Topbar({ user, sidebarWidth, theme, onThemeChange }: TopbarProps) {
  return (
    <>
      {IS_DEMO_ENV && (
        <div
          className="demo-banner fixed top-0 right-0 z-40"
          style={{ left: sidebarWidth }}
        >
          Demo mode active — add API keys to .env.local to enable full functionality
        </div>
      )}

      <header
        className="fixed top-0 right-0 z-20 h-14 border-b flex items-center px-4 gap-3 transition-[left] duration-200"
        style={{
          left: sidebarWidth,
          top: IS_DEMO_ENV ? 28 : 0,
          background: 'var(--color-topbar-bg)',
          borderColor: 'var(--color-topbar-border)',
        }}
      >
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="search"
              placeholder="Search stories, packs, questions…"
              className="w-full pl-8 pr-10 py-1.5 text-[14px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)] font-mono hidden sm:block">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <div
            className="flex items-center rounded-[var(--radius-md)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {THEMES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onThemeChange(id)}
                className="px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors"
                style={{
                  background: theme === id ? 'var(--color-primary)' : 'transparent',
                  color: theme === id ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[var(--color-border)]" />

          <button className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)] transition-colors">
            <Bell size={17} />
          </button>
          <button className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)] transition-colors">
            <HelpCircle size={17} />
          </button>
          <div className="w-px h-5 bg-[var(--color-border)]" />
          <UserMenu user={user} />
        </div>
      </header>
    </>
  )
}
