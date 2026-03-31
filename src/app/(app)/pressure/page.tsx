'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  XCircle,
  Lightbulb,
  Dumbbell,
  Eye,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading-spinner'
import type { PressurePoint, PressurePointSeverity } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ReadinessLevel = 'not_practiced' | 'practiced_once' | 'confident'

const READINESS_OPTIONS: { value: ReadinessLevel; label: string; colour: string }[] = [
  { value: 'not_practiced', label: 'Not practiced', colour: 'var(--color-text-muted)' },
  { value: 'practiced_once', label: 'Practiced once', colour: 'var(--color-signal-warning)' },
  { value: 'confident', label: 'Confident', colour: 'var(--color-signal-strong)' },
]

function severityBadgeVariant(severity: PressurePointSeverity): 'critical' | 'warning' | 'strong' {
  if (severity === 'high') return 'critical'
  if (severity === 'medium') return 'warning'
  return 'strong'
}

function severityLabel(severity: PressurePointSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

function typeLabel(type: string) {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// ReadinessSelector
// ---------------------------------------------------------------------------

function ReadinessSelector({
  value,
  onChange,
}: {
  value: ReadinessLevel
  onChange: (v: ReadinessLevel) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-semibold text-[var(--color-text-muted)] mr-1 uppercase tracking-wide">
        Readiness:
      </span>
      {READINESS_OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border',
              active
                ? 'border-transparent text-white'
                : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30',
            )}
            style={active ? { backgroundColor: opt.colour, borderColor: opt.colour } : {}}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: active ? 'white' : opt.colour }}
            />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PressureCard
// ---------------------------------------------------------------------------

function PressureCard({
  point,
  expanded,
  onToggle,
  readiness,
  onReadinessChange,
}: {
  point: PressurePoint
  expanded: boolean
  onToggle: () => void
  readiness: ReadinessLevel
  onReadinessChange: (v: ReadinessLevel) => void
}) {
  const severityVariant = severityBadgeVariant(point.severity)

  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200',
        expanded
          ? 'border-[var(--color-primary)]/30 shadow-sm'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/20',
      )}
    >
      {/* Card header — always visible, clickable */}
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <Badge variant={severityVariant}>{severityLabel(point.severity)}</Badge>
          <Badge variant="outline">{typeLabel(point.type)}</Badge>
          <span className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
            {point.title}
          </span>
        </div>
        <span className="shrink-0 text-[var(--color-text-muted)]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-[var(--color-border)]">
          {/* What the interviewer is thinking */}
          <div className="mt-4 bg-[#FFF7ED] border border-[#FED7AA] rounded-[var(--radius-md)] px-4 py-3 flex gap-3">
            <Eye size={15} className="shrink-0 mt-0.5 text-[#C2410C]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C2410C] mb-1">
                What the interviewer is thinking
              </p>
              <p className="text-[13px] text-[#78350F] italic leading-relaxed">{point.interviewer_concern}</p>
            </div>
          </div>

          {/* Defense line */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              Your defense line
            </p>
            <p
              className="text-[15px] font-semibold leading-snug"
              style={{ color: 'var(--color-primary)' }}
            >
              &ldquo;{point.defense_line}&rdquo;
            </p>
          </div>

          {/* How to frame it */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={13} className="text-[var(--color-signal-warning)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                How to frame it
              </p>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              {point.recommended_framing}
            </p>
          </div>

          {/* Proof points */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Proof points to use
            </p>
            <ul className="space-y-2">
              {point.proof_points.map((pp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckSquare size={14} className="shrink-0 mt-0.5 text-[var(--color-signal-strong)]" />
                  <span className="text-[13px] text-[var(--color-text-primary)]">{pp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid these responses */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle size={13} className="text-[var(--color-signal-critical)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Avoid these responses
              </p>
            </div>
            <ul className="space-y-1.5">
              {point.bad_responses_to_avoid.map((bad, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Square size={14} className="shrink-0 mt-0.5 text-[#FCA5A5]" />
                  <span className="text-[13px] text-[#991B1B]">{bad}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice drills */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Dumbbell size={13} className="text-[var(--color-primary)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Practice drills
              </p>
            </div>
            <div className="space-y-3">
              {point.drills.map((drill, i) => (
                <div
                  key={i}
                  className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 bg-[var(--color-background)]"
                >
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-1.5">
                    &ldquo;{drill.question}&rdquo;
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--color-primary)]">Approach: </span>
                    {drill.recommended_approach}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interviewer lenses */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Interviewer lenses
            </p>
            <div className="flex flex-wrap gap-1.5">
              {point.interviewer_lenses.map((lens) => (
                <Badge key={lens} variant="default">{lens}</Badge>
              ))}
            </div>
          </div>

          {/* Footer: readiness + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
            <ReadinessSelector value={readiness} onChange={onReadinessChange} />
            <Link
              href="/mock"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
            >
              Practice this in mock
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PressurePage() {
  const [points, setPoints] = useState<PressurePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<Record<string, ReadinessLevel>>({})

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function setReadinessFor(id: string, value: ReadinessLevel) {
    setReadiness((prev) => ({ ...prev, [id]: value }))
  }

  // Load saved pressure points on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Check localStorage first
        try {
          const stored = localStorage.getItem('im:pressure')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (!cancelled) { setPoints(parsed); setLoading(false) }
              return
            }
          }
        } catch { /* ignore */ }

        // Fall back to API (Supabase session)
        const res = await fetch('/api/pressure')
        if (!res.ok) throw new Error(`Failed to load (${res.status})`)
        const data = await res.json()
        if (!cancelled) setPoints(data.points ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Run detection
  const handleDetect = useCallback(async () => {
    setDetecting(true)
    setError(null)
    try {
      let body: BodyInit | undefined
      try {
        const stored = localStorage.getItem('im:graph')
        if (stored) {
          const { profile, nodes } = JSON.parse(stored)
          body = JSON.stringify({ profile, nodes })
        }
      } catch { /* ignore */ }

      const res = await fetch('/api/pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Detection failed'); return }
      setPoints(data.points ?? [])
      try { localStorage.setItem('im:pressure', JSON.stringify(data.points ?? [])) } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed')
    } finally {
      setDetecting(false)
    }
  }, [])

  const readyCount = Object.values(readiness).filter((v) => v === 'confident').length
  const total = points.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">
            Pressure Point Studio
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-0.5">
            Strategic preparation for the questions you&apos;re hoping they won&apos;t ask.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Readiness summary */}
          {total > 0 && (
            <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] px-4 py-2.5">
              <ShieldAlert size={15} className="text-[var(--color-primary)]" />
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)]">{readyCount}</strong> of{' '}
                <strong className="text-[var(--color-text-primary)]">{total}</strong> confident
              </span>
            </div>
          )}

          {/* Re-analyse button */}
          {total > 0 && (
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 px-3 py-2 rounded-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={detecting ? 'animate-spin' : ''} />
              {detecting ? 'Analysing…' : 'Re-analyse'}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#FCA5A5] bg-[#FEE2E2] px-4 py-3 text-[14px] text-[#991B1B]">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <PageLoading label="Loading pressure points…" />}

      {/* Info callout — only shown when points exist */}
      {!loading && total > 0 && (
        <div className="flex items-start gap-3 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[var(--radius-md)] px-4 py-3">
          <Info size={15} className="shrink-0 mt-0.5 text-[var(--color-primary)]" />
          <p className="text-[13px] text-[var(--color-primary)]">
            Click any pressure point to expand it, review your defense strategy, and mark your readiness. Practice the drills in a mock interview to build confidence.
          </p>
        </div>
      )}

      {/* Pressure point cards */}
      {!loading && total > 0 && (
        <div className="space-y-3">
          {points.map((point) => (
            <PressureCard
              key={point.id}
              point={point}
              expanded={expandedId === point.id}
              onToggle={() => toggleExpand(point.id)}
              readiness={readiness[point.id] ?? 'not_practiced'}
              onReadinessChange={(v) => setReadinessFor(point.id, v)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && total === 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center">
          <ShieldAlert size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">No pressure points yet</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1 mb-6 max-w-sm mx-auto">
            Analyse your profile to identify the questions you&apos;ll need to prepare for most carefully.
          </p>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {detecting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Analysing your profile…
              </>
            ) : (
              <>
                Analyse My Profile
                <ArrowRight size={13} />
              </>
            )}
          </button>
          {!detecting && (
            <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
              No CV yet?{' '}
              <Link href="/profile" className="underline hover:no-underline">
                Upload your CV first
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
