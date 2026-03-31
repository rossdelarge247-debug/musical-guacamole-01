'use client'

import { useState } from 'react'
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
  AlertTriangle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { PressurePoint, PressurePointSeverity } from '@/types'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_PRESSURE_POINTS: Omit<PressurePoint, 'profile_id' | 'created_at' | 'updated_at'>[] = [
  {
    id: 'pp-1',
    type: 'short_tenure',
    title: 'Short tenure at StartupCo (20 months)',
    severity: 'medium',
    interviewer_concern: 'Pattern of leaving before things get hard, or was asked to leave?',
    defense_line:
      'I joined to solve a specific problem — once delivered, I moved to where I could have more impact.',
    recommended_framing:
      'Lead with what was accomplished. Be specific about the outcome that signalled completion. Show it was a planned move, not a reactive one.',
    proof_points: [
      'Shipped analytics module — the original remit — in month 14',
      'Handed over to a senior hire I helped recruit',
      'Left with a reference from the CEO',
    ],
    bad_responses_to_avoid: [
      'Blaming the company or leadership',
      'Vague answers about "culture fit"',
      'Over-explaining or becoming defensive',
    ],
    drills: [
      {
        question: 'Why did you leave after only 20 months?',
        recommended_approach:
          'Lead with the accomplishment, explain the natural completion, show proactive transition.',
      },
      {
        question: 'Were you asked to leave?',
        recommended_approach:
          'Direct no, followed by the reference and the planned transition narrative.',
      },
    ],
    interviewer_lenses: ['Risk-averse line manager', 'Startup founder assessing commitment'],
  },
  {
    id: 'pp-2',
    type: 'limited_leadership',
    title: 'Limited direct management experience',
    severity: 'high',
    interviewer_concern: 'Can this person manage and develop a team at senior level?',
    defense_line:
      'I have led through influence and cross-functional leadership consistently — direct line management is the next step I am actively pursuing.',
    recommended_framing:
      'Reframe leadership as influence, direction-setting, and team-shaping. Cite specific examples where you led without formal authority. Show self-awareness about the gap and a clear plan.',
    proof_points: [
      'Led a team of 5 engineers on the onboarding redesign without being their line manager',
      'Mentored two junior PMs informally — one promoted within 8 months',
      'Ran quarterly planning for a cross-functional group of 12',
    ],
    bad_responses_to_avoid: [
      'Downplaying the gap',
      'Claiming management experience you do not have',
      'Being vague about what leadership means to you',
    ],
    drills: [
      {
        question: 'Have you ever managed a team directly?',
        recommended_approach:
          'Honest answer, pivot to cross-functional leadership evidence, show self-awareness and ambition.',
      },
      {
        question: 'How would you handle a direct report who is underperforming?',
        recommended_approach:
          'Use a specific coaching framework. Show you have thought about this even without direct experience.',
      },
    ],
    interviewer_lenses: [
      'Senior hiring manager expecting people management',
      'HR assessing leadership pipeline',
    ],
  },
]

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
  point: (typeof DEMO_PRESSURE_POINTS)[number]
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<Record<string, ReadinessLevel>>({})

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function setReadinessFor(id: string, value: ReadinessLevel) {
    setReadiness((prev) => ({ ...prev, [id]: value }))
  }

  const readyCount = Object.values(readiness).filter((v) => v === 'confident').length
  const total = DEMO_PRESSURE_POINTS.length

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

        {/* Readiness summary */}
        <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] px-4 py-2.5 shrink-0">
          <ShieldAlert size={15} className="text-[var(--color-primary)]" />
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)]">{readyCount}</strong> of{' '}
            <strong className="text-[var(--color-text-primary)]">{total}</strong> confident
          </span>
        </div>
      </div>

      {/* Demo mode notice */}
      <div className="flex items-start gap-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-[var(--radius-md)] px-4 py-3">
        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#D97706]" />
        <div>
          <p className="text-[13px] font-semibold text-[#92400E]">Demo mode</p>
          <p className="text-[13px] text-[#78350F]">
            These pressure points were detected from your profile.{' '}
            <Link href="/profile" className="font-semibold underline hover:no-underline">
              Add your CV
            </Link>{' '}
            to generate personalised pressure points.
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[var(--radius-md)] px-4 py-3">
        <Info size={15} className="shrink-0 mt-0.5 text-[var(--color-primary)]" />
        <p className="text-[13px] text-[var(--color-primary)]">
          Click any pressure point to expand it, review your defense strategy, and mark your readiness. Practice the drills in a mock interview to build confidence.
        </p>
      </div>

      {/* Pressure point cards */}
      <div className="space-y-3">
        {DEMO_PRESSURE_POINTS.map((point) => (
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

      {/* Empty state if no points */}
      {DEMO_PRESSURE_POINTS.length === 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center">
          <ShieldAlert size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">No pressure points detected</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Upload your CV to let us identify your background&apos;s potential weak spots.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Upload CV
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}
