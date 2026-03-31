import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, BriefcaseBusiness } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

export const metadata: Metadata = { title: 'Interview Packs' }

export default function PacksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Interview Packs' }]} />
          <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
            Interview Packs
          </h1>
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            One pack per role — tailored stories, questions, and prep plans.
          </p>
        </div>
        <Link
          href="/packs/new"
          className="shrink-0 flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-4 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={15} />
          New pack
        </Link>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-light)] flex items-center justify-center">
          <BriefcaseBusiness size={22} className="text-[var(--color-primary)]" />
        </div>
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          No packs yet
        </p>
        <p className="text-[14px] text-[var(--color-text-secondary)] max-w-xs">
          Paste a job description and we&apos;ll build your tailored prep plan — stories, questions, and pressure points.
        </p>
        <Link
          href="/packs/new"
          className="mt-2 flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={15} />
          Create your first pack
        </Link>
      </div>
    </div>
  )
}
