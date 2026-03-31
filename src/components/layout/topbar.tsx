'use client'

import { Search, HelpCircle, Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import { IS_DEMO_ENV } from '@/lib/demo/flags'
import type { User } from '@/types'

interface TopbarProps {
  user: User
  sidebarWidth: number
}

export function Topbar({ user, sidebarWidth }: TopbarProps) {
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
        className="fixed top-0 right-0 z-20 h-14 bg-white border-b border-[var(--color-border)] flex items-center px-4 gap-3 transition-[left] duration-200"
        style={{
          left: sidebarWidth,
          top: IS_DEMO_ENV ? 28 : 0,
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

        <div className="flex items-center gap-1 ml-auto">
          <button className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)] transition-colors">
            <Bell size={17} />
          </button>
          <button className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)] transition-colors">
            <HelpCircle size={17} />
          </button>
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <UserMenu user={user} />
        </div>
      </header>
    </>
  )
}
