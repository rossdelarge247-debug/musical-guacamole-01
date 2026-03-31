import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
  iconColour?: string
  iconBg?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColour = 'var(--color-primary)',
  iconBg = 'var(--color-primary-light)',
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 flex flex-col items-center text-center gap-3">
      <div
        className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon size={22} style={{ color: iconColour }} />
      </div>
      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</p>
      <p className="text-[14px] text-[var(--color-text-secondary)] max-w-xs">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
