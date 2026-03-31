import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  crumbs: Crumb[]
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight size={13} className="text-[var(--color-text-muted)]" />
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-[var(--color-text-primary)] font-medium'
                    : 'text-[var(--color-text-muted)]'
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
