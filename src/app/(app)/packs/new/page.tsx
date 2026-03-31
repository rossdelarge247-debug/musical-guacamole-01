'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

const ROLE_LEVELS = [
  { value: 'graduate', label: 'Graduate' },
  { value: 'early_career', label: 'Early career' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
] as const

const INTERVIEW_TYPES = [
  { value: 'behavioural', label: 'Behavioural' },
  { value: 'competency', label: 'Competency' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'panel', label: 'Panel' },
] as const

const GENERATION_STEPS = [
  'Analysing the role…',
  'Mapping to your experience…',
  'Mining stories…',
  'Building your pack…',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2] as const).map((s) => (
        <div
          key={s}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            s === step
              ? 'w-6 bg-[var(--color-primary)]'
              : s < step
              ? 'w-3 bg-[var(--color-primary)]/40'
              : 'w-3 bg-[var(--color-border-strong)]',
          )}
        />
      ))}
    </div>
  )
}

function GeneratingOverlay({ activeIndex, doneIndexes }: { activeIndex: number; doneIndexes: number[] }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)] flex items-center justify-center">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg p-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            Interview Monkey
          </p>
          <h2 className="text-[22px] font-semibold text-[var(--color-text-primary)]">
            Building your pack
          </h2>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            This usually takes about 30 seconds.
          </p>
        </div>

        <ol className="space-y-4">
          {GENERATION_STEPS.map((label, i) => {
            const isDone = doneIndexes.includes(i)
            const isActive = activeIndex === i && !isDone

            return (
              <li key={i} className="flex items-center gap-3">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <CheckCircle2
                      size={18}
                      className="text-[var(--color-signal-strong)]"
                    />
                  ) : isActive ? (
                    <Loader2
                      size={17}
                      className="animate-spin text-[var(--color-primary)]"
                    />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-[var(--color-border-strong)] block" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-[14px] transition-colors duration-200',
                    isDone
                      ? 'text-[var(--color-signal-strong)] line-through decoration-1'
                      : isActive
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>

        {/* Progress bar */}
        <div className="mt-8 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
            style={{ width: `${Math.round((doneIndexes.length / GENERATION_STEPS.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewPackPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [generating, setGenerating] = useState(false)
  const [genActiveIndex, setGenActiveIndex] = useState(0)
  const [genDoneIndexes, setGenDoneIndexes] = useState<number[]>([])

  // Step 1 fields
  const [jd, setJd] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')

  // Step 2 fields
  const [roleLevel, setRoleLevel] = useState<string>('senior')
  const [interviewType, setInterviewType] = useState<string>('mixed')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const jdValid = jd.trim().length > 100
  const derivedTitle = title.trim() || (company.trim() ? `Interview prep — ${company.trim()}` : '')

  async function handleGenerate() {
    setError(null)
    setIsSubmitting(true)
    setGenerating(true)
    setGenActiveIndex(0)
    setGenDoneIndexes([])

    // Advance animation steps at even intervals while API call runs
    const stepInterval = 8000 // advance a step every 8s
    const timers: ReturnType<typeof setTimeout>[] = []
    GENERATION_STEPS.forEach((_, i) => {
      if (i === 0) return // step 0 starts immediately as active
      timers.push(setTimeout(() => {
        setGenDoneIndexes((prev) => [...prev, i - 1])
        setGenActiveIndex(i)
      }, i * stepInterval))
    })

    try {
      // Read profile/nodes from localStorage to send to API
      let clientProfile = null
      let clientNodes = null
      try {
        const stored = localStorage.getItem('im:graph')
        if (stored) {
          const parsed = JSON.parse(stored)
          clientProfile = parsed.profile ?? null
          clientNodes = parsed.nodes ?? null
        }
      } catch { /* ignore */ }

      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_raw: jd,
          title: derivedTitle || 'Untitled pack',
          company: company.trim() || null,
          role_level: roleLevel,
          interview_type: interviewType,
          profile: clientProfile,
          nodes: clientNodes,
        }),
      })

      // Clear remaining step timers
      timers.forEach(clearTimeout)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Failed to create pack (${res.status})`)
        setGenerating(false)
        setIsSubmitting(false)
        return
      }

      const data = await res.json()
      const pack = data.pack

      // Save mined stories/pressure points to localStorage
      try {
        if (data.stories?.length > 0) {
          localStorage.setItem('im:stories', JSON.stringify(data.stories))
        }
        if (data.pressure_points?.length > 0) {
          localStorage.setItem('im:pressure', JSON.stringify(data.pressure_points))
        }
        if (pack) {
          const existing = JSON.parse(localStorage.getItem('im:packs') ?? '[]')
          localStorage.setItem('im:packs', JSON.stringify([pack, ...existing]))
        }
      } catch { /* ignore */ }

      // Complete animation then navigate
      setGenDoneIndexes(GENERATION_STEPS.map((_, i) => i))
      setTimeout(() => router.push(`/packs/${pack.id}`), 600)
    } catch (err) {
      timers.forEach(clearTimeout)
      setError(err instanceof Error ? err.message : 'Failed to create pack')
      setGenerating(false)
      setIsSubmitting(false)
    }
  }

  const labelClass = 'block text-[13px] font-semibold text-[var(--color-text-primary)] mb-1.5'
  const inputClass =
    'w-full px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition-[border-color,box-shadow] duration-[var(--transition-fast)]'
  const selectClass = cn(inputClass, 'cursor-pointer appearance-none')

  return (
    <>
      {generating && <GeneratingOverlay activeIndex={genActiveIndex} doneIndexes={genDoneIndexes} />}

      <div className="space-y-6 max-w-xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          crumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Interview Packs', href: '/packs' },
            { label: 'New pack' },
          ]}
        />

        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">
            New Interview Pack
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Paste a job description and we'll build your tailored prep plan.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                  Paste the job description
                </h2>
                <ProgressDots step={1} />
              </div>

              {/* JD textarea */}
              <div>
                <label htmlFor="jd" className={labelClass}>
                  Job description <span className="text-[var(--color-signal-critical)]">*</span>
                </label>
                <textarea
                  id="jd"
                  rows={12}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here — responsibilities, requirements, about the company…"
                  className={cn(inputClass, 'resize-none leading-relaxed')}
                />
                <p
                  className={cn(
                    'mt-1.5 text-[12px] transition-colors duration-150',
                    jdValid
                      ? 'text-[var(--color-signal-strong)]'
                      : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {jd.trim().length} chars
                  {!jdValid && jd.trim().length > 0 && ' — need at least 100'}
                  {jdValid && ' ✓'}
                </p>
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className={labelClass}>
                  Company name{' '}
                  <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. FinovaTech"
                  className={inputClass}
                />
              </div>

              {/* Pack title */}
              <div>
                <label htmlFor="pack-title" className={labelClass}>
                  Pack title{' '}
                  <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  id="pack-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    company.trim()
                      ? `e.g. Interview prep — ${company.trim()}`
                      : 'Auto-generated from company name'
                  }
                  className={inputClass}
                />
              </div>

              {/* CTA */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!jdValid}
                  className={cn(
                    'flex items-center gap-2 font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] transition-colors duration-[var(--transition-fast)]',
                    jdValid
                      ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer'
                      : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed',
                  )}
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                  Configure the role
                </h2>
                <ProgressDots step={2} />
              </div>

              {/* Role level */}
              <div>
                <label htmlFor="role-level" className={labelClass}>
                  Role level
                </label>
                <div className="relative">
                  <select
                    id="role-level"
                    value={roleLevel}
                    onChange={(e) => setRoleLevel(e.target.value)}
                    className={selectClass}
                  >
                    {ROLE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    ▾
                  </span>
                </div>
              </div>

              {/* Interview type */}
              <div>
                <label htmlFor="interview-type" className={labelClass}>
                  Interview type
                </label>
                <div className="relative">
                  <select
                    id="interview-type"
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className={selectClass}
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    ▾
                  </span>
                </div>
              </div>

              {/* Summary preview */}
              <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/15 px-4 py-3 text-[13px] text-[var(--color-primary)] space-y-0.5">
                <p>
                  <span className="font-semibold">Title:</span>{' '}
                  {derivedTitle || 'Untitled pack'}
                </p>
                {company && (
                  <p>
                    <span className="font-semibold">Company:</span> {company}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Level:</span>{' '}
                  {ROLE_LEVELS.find((l) => l.value === roleLevel)?.label}
                </p>
                <p>
                  <span className="font-semibold">Format:</span>{' '}
                  {INTERVIEW_TYPES.find((t) => t.value === interviewType)?.label}
                </p>
              </div>

              {error && (
                <p className="text-[13px] text-[var(--color-signal-critical)]">{error}</p>
              )}

              {/* Actions */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--transition-fast)]"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-center gap-2 font-semibold text-[14px] px-6 py-2.5 rounded-[var(--radius-xl)] transition-colors duration-[var(--transition-fast)]',
                    isSubmitting
                      ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Generate my pack
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
