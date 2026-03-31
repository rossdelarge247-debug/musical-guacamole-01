'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BriefcaseBusiness, FlaskConical, Mic2, ArrowRight, Upload } from 'lucide-react'

const QUICK_ACTIONS = [
  {
    label: 'Build an Interview Pack',
    description: 'Upload a JD and get your prep plan in minutes',
    href: '/packs/new',
    icon: BriefcaseBusiness,
    colour: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
  },
  {
    label: 'Open Answer Lab',
    description: 'Craft and refine your best answers',
    href: '/answer-lab',
    icon: FlaskConical,
    colour: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    label: 'Start a Mock',
    description: 'Practice with AI or a human coach',
    href: '/mock',
    icon: Mic2,
    colour: '#10B981',
    bg: '#D1FAE5',
  },
]

export function DashboardContent({ firstName }: { firstName: string | null }) {
  const [hasCv, setHasCv] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('im:graph')
      if (stored) {
        const parsed = JSON.parse(stored)
        setHasCv(Array.isArray(parsed.nodes) && parsed.nodes.length > 0)
      } else {
        setHasCv(false)
      }
    } catch {
      setHasCv(false)
    }
  }, [])

  const greeting = firstName ? `Welcome, ${firstName}` : 'Welcome back'

  // Wait for localStorage check before rendering to avoid layout flicker
  if (hasCv === null) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          {greeting}
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-1">
          Your interview performance hub
        </p>
      </div>

      {/* Getting started banner — shown until CV is uploaded */}
      {!hasCv && (
        <div className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] p-6 flex items-center justify-between gap-6 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              GET STARTED
            </p>
            <h2 className="text-[20px] font-semibold mt-1">
              Upload your CV to begin
            </h2>
            <p className="text-[14px] opacity-85 mt-1">
              We&apos;ll build your Candidate Graph and mine your best stories automatically.
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 flex items-center gap-2 bg-white text-[var(--color-primary)] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-blue-50 transition-colors"
          >
            <Upload size={15} />
            Upload CV
          </Link>
        </div>
      )}

      {/* Quick actions — shown after CV uploaded */}
      {hasCv && (
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-[var(--transition-base)]"
                >
                  <div
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
                    style={{ background: action.bg }}
                  >
                    <Icon size={18} style={{ color: action.colour }} />
                  </div>
                  <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    {action.label}
                  </p>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[13px] font-medium text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    Go <ArrowRight size={13} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Readiness heat map — shown after CV uploaded */}
      {hasCv && (
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            READINESS HEAT MAP
          </h2>
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                'Opening pitch',
                'Leadership',
                'Failure',
                'Conflict',
                'Ambiguity',
                'Evidence',
                'Executive presence',
                'Motivation',
              ].map((area) => (
                <div key={area} className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                    {area}
                  </p>
                  <div className="h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-border-strong)]"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Not started</p>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-4 text-center">
              Complete your first Interview Pack to see your readiness scores.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
