'use client'

import { useState } from 'react'
import { LogOut, User, CreditCard, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { User as UserType } from '@/types'

const TIER_LABEL: Record<string, string> = {
  core: 'Free',
  pro: 'Pro',
  prime: 'Prime',
}

interface UserMenuProps {
  user: UserType
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const initials = (user.full_name ?? user.email)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-background)] transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
          {initials}
        </span>
        <span className="text-[13px] font-medium text-[var(--color-text-primary)] hidden sm:block max-w-[120px] truncate">
          {user.full_name ?? user.email}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full hidden sm:block">
          {TIER_LABEL[user.tier]}
        </span>
        <ChevronDown size={13} className="text-[var(--color-text-muted)] hidden sm:block" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card-hover)] z-50 py-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--color-border)]">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                {user.full_name ?? 'My account'}
              </p>
              <p className="text-[12px] text-[var(--color-text-muted)] truncate">{user.email}</p>
            </div>

            <Link
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors"
            >
              <User size={15} /> Profile
            </Link>
            <Link
              href="/settings/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors"
            >
              <CreditCard size={15} /> Billing
            </Link>

            <div className="border-t border-[var(--color-border)] mt-1 pt-1">
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--color-signal-critical)] hover:bg-[var(--color-background)] transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
