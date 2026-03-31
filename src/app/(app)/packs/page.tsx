'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BriefcaseBusiness, ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Badge } from '@/components/ui/badge'

interface PackSummary {
  id: string
  title: string
  company?: string | null
  role_level?: string
  interview_type?: string
  created_at: string
}

export default function PacksPage() {
  const [packs, setPacks] = useState<PackSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      // Check localStorage first for local packs
      let localPacks: PackSummary[] = []
      try {
        const stored = localStorage.getItem('im:packs')
        if (stored) localPacks = JSON.parse(stored)
      } catch { /* ignore */ }

      // Also try to fetch from API (Supabase session)
      try {
        const res = await fetch('/api/packs')
        if (res.ok) {
          const data = await res.json()
          const apiPacks: PackSummary[] = data.packs ?? []
          // Merge: API packs + local packs not in API
          const apiIds = new Set(apiPacks.map((p) => p.id))
          const merged = [...apiPacks, ...localPacks.filter((p) => !apiIds.has(p.id))]
          setPacks(merged)
          return
        }
      } catch { /* ignore */ }

      setPacks(localPacks)
    })().finally(() => setLoading(false))
  }, [])

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

      {loading && (
        <div className="py-8 text-center text-[14px] text-[var(--color-text-muted)]">Loading…</div>
      )}

      {!loading && packs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                  {pack.title}
                </h2>
                <ArrowRight size={15} className="shrink-0 mt-0.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pack.company && <Badge variant="primary">{pack.company}</Badge>}
                {pack.role_level && <Badge variant="default">{pack.role_level}</Badge>}
                {pack.interview_type && <Badge variant="default">{pack.interview_type}</Badge>}
              </div>
              {pack.created_at && (
                <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
                  Created {new Date(pack.created_at).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && packs.length === 0 && (
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
      )}
    </div>
  )
}
