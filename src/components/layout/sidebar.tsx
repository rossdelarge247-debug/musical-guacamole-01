'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  BriefcaseBusiness,
  FlaskConical,
  Network,
  ShieldAlert,
  Mic2,
  PlaySquare,
  Video,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  tier?: UserTier // minimum tier required
  badge?: string
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'PREPARE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Profile', href: '/profile', icon: User },
      { label: 'Interview Packs', href: '/packs', icon: BriefcaseBusiness },
      { label: 'Answer Lab', href: '/answer-lab', icon: FlaskConical },
      { label: 'Story Constellation', href: '/stories', icon: Network },
      { label: 'Pressure Points', href: '/pressure', icon: ShieldAlert, tier: 'pro' },
    ],
  },
  {
    group: 'PRACTISE',
    items: [
      { label: 'Mock Interview', href: '/mock', icon: Mic2 },
      { label: 'Replay Studio', href: '/replay', icon: PlaySquare },
    ],
  },
  {
    group: 'LIVE',
    items: [
      { label: 'Live Workspace', href: '/live', icon: Video, tier: 'pro' },
    ],
  },
]

interface SidebarProps {
  tier: UserTier
  collapsed?: boolean
  onCollapse?: (v: boolean) => void
}

export function Sidebar({ tier, collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  const tierRank: Record<UserTier, number> = { core: 0, pro: 1, prime: 2 }

  function hasAccess(item: NavItem): boolean {
    if (!item.tier) return true
    return tierRank[tier] >= tierRank[item.tier]
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] transition-[width] duration-200',
        collapsed ? 'w-[60px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)] shrink-0">
        {collapsed ? (
          <span className="text-[var(--color-primary)] font-bold text-base w-full text-center">
            IM
          </span>
        ) : (
          <span className="text-[var(--color-primary)] font-bold text-[15px] tracking-tight truncate">
            Interview Monkey
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {group}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const accessible = hasAccess(item)
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={accessible ? item.href : '/upgrade'}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors duration-[var(--transition-fast)]',
                        active
                          ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
                          : accessible
                            ? 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-muted)] opacity-60 cursor-not-allowed',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <Icon
                        size={17}
                        className={cn(
                          'shrink-0',
                          active
                            ? 'text-[var(--color-primary)]'
                            : 'text-[var(--color-sidebar-icon)]',
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!collapsed && !accessible && (
                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + collapse toggle */}
      <div className="shrink-0 border-t border-[var(--color-border)] p-2 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[14px] font-medium text-[var(--color-sidebar-text)] hover:bg-[var(--color-border)] transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={17} className="text-[var(--color-sidebar-icon)] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={17}
              className={cn('shrink-0 transition-transform', collapsed && 'rotate-180')}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </aside>
  )
}
