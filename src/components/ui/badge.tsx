import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'strong' | 'warning' | 'critical' | 'strategic' | 'outline' | 'tier-pro' | 'tier-prime'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[#F3F4F6] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20',
  strong: 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]/40',
  warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]/40',
  critical: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40',
  strategic: 'bg-[#EDE9FE] text-[#5B21B6] border border-[#C4B5FD]/40',
  outline: 'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  'tier-pro': 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20',
  'tier-prime': 'bg-[#EDE9FE] text-[#5B21B6] border border-[#C4B5FD]/40',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
