'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, ChevronRight, Zap, Trash2 } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { MatchScoreCard } from './_components/match-score-card'
import { OrgIntelCard } from './_components/org-intel-card'
import { OverviewTab } from './_components/overview-tab'
import { ExperienceTab } from './_components/experience-tab'

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_PACK = {
  id: 'demo-pack-1',
  title: 'Head of Product — FinovaTech',
  company: 'FinovaTech',
  role_level: 'senior',
  interview_type: 'mixed',
  opening_pitch:
    'I am a senior product leader with six years building B2B SaaS products at scale. My particular strength is translating complex technical constraints into commercially valuable user outcomes — I have done this most recently by leading an onboarding redesign that delivered 40% faster time-to-value and an 18% uplift in 30-day retention. I am drawn to this role because FinovaTech is solving a problem I genuinely believe matters, and the scope of the challenge matches where I want to grow.',
  target_signals: [
    'ownership',
    'leadership',
    'commercial_awareness',
    'judgment',
    'strategic_thinking',
  ],
  vocabulary: [
    'product-led growth',
    'outcome-based roadmap',
    'north star metric',
    'discovery cadence',
    'activation rate',
  ],
  likely_questions: [
    {
      id: 'q1',
      text: 'Tell me about a time you had to align multiple stakeholders on a difficult product decision.',
      type: 'stakeholder',
      priority: 'high',
      why_likely:
        'FinovaTech operates across 3 business units requiring heavy internal alignment.',
    },
    {
      id: 'q2',
      text: 'Describe a product you launched that did not perform as expected. What did you do?',
      type: 'failure',
      priority: 'high',
      why_likely: 'Senior roles test resilience and self-awareness under commercial pressure.',
    },
    {
      id: 'q3',
      text: 'How do you decide what not to build?',
      type: 'strategy',
      priority: 'high',
      why_likely: 'Prioritisation judgment is a key signal at senior level.',
    },
    {
      id: 'q4',
      text: 'What is your approach to building a product roadmap with limited engineering resource?',
      type: 'strategy',
      priority: 'medium',
      why_likely: 'FinovaTech is Series A with constrained headcount.',
    },
    {
      id: 'q5',
      text: 'Tell me about a time you influenced a decision without formal authority.',
      type: 'leadership',
      priority: 'medium',
      why_likely: 'Matrix structure means influence over authority is critical.',
    },
  ],
  inferred_priorities: [
    'Commercial growth',
    'Cross-functional leadership',
    'Data-led product decisions',
    'Stakeholder management',
  ],
  stories: [
    {
      id: 's1',
      title: 'Onboarding Redesign',
      summary:
        'Led end-to-end redesign of the onboarding flow, cutting time-to-value by 40% and improving 30-day retention by 18%.',
      signals: ['ownership', 'commercial_awareness', 'evidence'],
      confidence: 4.2,
    },
    {
      id: 's2',
      title: 'Cross-BU Roadmap Alignment',
      summary:
        'Facilitated a six-week alignment process across three business units to agree on a single unified roadmap.',
      signals: ['leadership', 'stakeholder_management', 'strategic_thinking'],
      confidence: 3.8,
    },
    {
      id: 's3',
      title: 'Failed Feature Launch',
      summary:
        'Launched a collaboration feature that saw <5% adoption. Diagnosed root cause, pivoted the approach, and recovered usage within one quarter.',
      signals: ['ownership', 'judgment', 'resilience'],
      confidence: 3.5,
    },
  ],
  pressure_points: [
    {
      id: 'pp1',
      type: 'gap',
      title: 'Limited enterprise sales experience',
      severity: 'medium',
      interviewer_concern:
        'Candidate may not have navigated long enterprise procurement cycles or executive-level buyer dynamics.',
    },
    {
      id: 'pp2',
      type: 'ambiguity',
      title: 'Metrics ownership unclear',
      severity: 'high',
      interviewer_concern:
        'Strong candidate but unclear whether they owned P&L accountability or merely influenced it.',
    },
    {
      id: 'pp3',
      type: 'challenge',
      title: 'Team size never exceeded 4 reports',
      severity: 'low',
      interviewer_concern:
        'Role may require managing 8+ direct reports across multiple geographies.',
    },
  ],
  readiness: {
    intro: 0,
    leadership: 0,
    failure: 0,
    conflict: 0,
    ambiguity: 0,
    evidence: 0,
    exec_presence: 0,
    motivation: 0,
  },
  match_score: 74,
  match_rationale:
    'Strong product leadership with measurable outcomes, but limited enterprise sales exposure and small team size create moderate gaps.',
  overlap_areas: [
    'B2B SaaS product leadership with measurable outcomes',
    'Data-led decision making',
    'Cross-functional stakeholder alignment',
    'Onboarding and activation optimisation',
  ],
  gap_areas: [
    'No enterprise sales cycle experience',
    'Team management capped at 4 direct reports',
    'No P&L ownership demonstrated',
  ],
  gap_filling_tips: [
    'Frame work with Sales as commercial partnership — reference deal sizes and buyer personas influenced',
    'Emphasise dotted-line influence: cross-BU alignment involved coordinating 15+ people',
    'Reframe as commercial accountability — connect retention/activation metrics to revenue impact',
  ],
  org_intel: {
    key_intel: [
      'FinovaTech is scaling fast — expect to own decisions with limited process support',
      'The role has a high cross-functional footprint; internal relationships will matter as much as output',
      'They emphasise "commercial awareness" — be ready to speak to revenue and cost impact',
      'The team is rebuilding after a period of churn — bringing structure will be welcomed',
    ],
    culture_signals: [
      'Move-fast, high ownership culture',
      'Data-informed but intuition is respected at senior level',
      'Direct communication style — they will reward candour',
    ],
    sentiment: 'positive' as const,
    sentiment_reason:
      'The JD reads with energy and clarity — this is a well-scoped role at a team that knows what they want.',
    what_they_care_about: [
      'Shipping things that actually move metrics',
      'People who take ownership without being told',
      'Commercial instinct alongside product craft',
    ],
    red_flags: ['"Wear many hats" — scope may be broader than the title suggests'],
  },
  experience_card_prompts: [
    {
      node_id: 'node-1',
      node_title: 'Head of Product, StartupCo',
      node_type: 'role',
      relevance_score: 0.88,
      focus_points: [
        'Led onboarding redesign with 40% time-to-value improvement',
        'Owned roadmap across three business units under resource constraints',
        'Built data instrumentation from scratch to drive decisions',
      ],
      story_prompt:
        'Frame your tenure as a commercial transformation story — lead with the revenue and retention metrics you moved, then explain the product choices that drove them.',
      zoom_in_areas: ['Team size and management depth', 'Stakeholder map complexity', 'How you handled conflicting priorities'],
      defend_areas: ['Only 4 direct reports for a role requiring 8+', 'No explicit P&L ownership mentioned'],
    },
    {
      node_id: 'node-2',
      node_title: 'Onboarding Redesign Project',
      node_type: 'project',
      relevance_score: 0.82,
      focus_points: [
        '40% faster time-to-value is a headline metric — lead with it',
        'Cross-functional scope shows you can drive change through others',
        '18% retention uplift directly maps to revenue impact',
      ],
      story_prompt:
        'Tell the story in three acts: the problem (high churn at activation), the process (discovery, prioritisation, tradeoffs), and the outcome (measurable commercial result).',
      zoom_in_areas: ['How you measured success', 'Who you had to influence to make it happen', 'What you cut from scope'],
      defend_areas: [],
    },
    {
      node_id: 'node-3',
      node_title: 'Cross-BU Roadmap Alignment',
      node_type: 'project',
      relevance_score: 0.71,
      focus_points: [
        'Shows large-scale stakeholder management across political boundaries',
        'Six-week timeline demonstrates structured facilitation skills',
        'Single unified roadmap outcome shows you can drive hard decisions',
      ],
      story_prompt:
        'Position this as your enterprise-scale leadership proof point — emphasise the number of stakeholders, the differing agendas, and the process you designed to resolve them.',
      zoom_in_areas: ['What your role was vs. others', 'How you handled the stakeholder who did not want to align', 'Lasting impact after you reached agreement'],
      defend_areas: ['Be ready to explain how this differs from an enterprise sales cycle if pressed'],
    },
  ],
}

type Pack = typeof DEMO_PACK
type TabId = 'overview' | 'questions' | 'experience' | 'stories' | 'pressure'

const EMPTY_READINESS = {
  intro: 0, leadership: 0, failure: 0, conflict: 0,
  ambiguity: 0, evidence: 0, exec_presence: 0, motivation: 0,
}

// Bridge DB column names / missing fields to the shape the page expects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalisePack(raw: any): Pack {
  return {
    ...raw,
    // DB uses readiness_scores; DEMO_PACK uses readiness
    readiness: raw.readiness ?? raw.readiness_scores ?? EMPTY_READINESS,
    stories: raw.stories ?? [],
    pressure_points: raw.pressure_points ?? [],
    likely_questions: raw.likely_questions ?? [],
    target_signals: raw.target_signals ?? [],
    inferred_priorities: raw.inferred_priorities ?? [],
    vocabulary: raw.vocabulary ?? [],
    overlap_areas: raw.overlap_areas ?? [],
    gap_areas: raw.gap_areas ?? [],
    gap_filling_tips: raw.gap_filling_tips ?? [],
    experience_card_prompts: raw.experience_card_prompts ?? [],
    match_score: raw.match_score ?? 0,
    match_rationale: raw.match_rationale ?? '',
    org_intel: raw.org_intel ?? null,
    opening_pitch: raw.opening_pitch ?? '',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSignal(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function priorityVariant(p: string): 'primary' | 'default' | 'outline' {
  if (p === 'high') return 'primary'
  if (p === 'medium') return 'default'
  return 'outline'
}

function severityVariant(s: string): 'critical' | 'warning' | 'default' {
  if (s === 'high') return 'critical'
  if (s === 'medium') return 'warning'
  return 'default'
}

function questionTypeVariant(t: string): 'strategic' | 'warning' | 'critical' | 'default' {
  if (t === 'strategy') return 'strategic'
  if (t === 'leadership') return 'warning'
  if (t === 'failure') return 'critical'
  return 'default'
}

function confidenceDotClass(score: number) {
  if (score >= 4) return 'bg-[var(--color-signal-strong)]'
  if (score >= 3) return 'bg-[var(--color-signal-warning)]'
  return 'bg-[var(--color-signal-critical)]'
}

const READINESS_LABELS: Record<keyof typeof DEMO_PACK.readiness, string> = {
  intro: 'Introduction',
  leadership: 'Leadership',
  failure: 'Handling failure',
  conflict: 'Conflict',
  ambiguity: 'Ambiguity',
  evidence: 'Evidence / data',
  exec_presence: 'Exec presence',
  motivation: 'Motivation',
}

// ─── Left panel sections ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 flex items-center gap-1 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check size={13} className="text-[var(--color-signal-strong)]" />
          <span className="text-[var(--color-signal-strong)]">Copied</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          Copy
        </>
      )}
    </button>
  )
}

function ReadinessBar({ label, score }: { label: string; score: number }) {
  const tested = score > 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--color-text-secondary)]">{label}</span>
        {tested ? (
          <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
            {score}/5
          </span>
        ) : (
          <span className="text-[11px] text-[var(--color-text-muted)] italic">Not tested</span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        {tested && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(score / 5) * 100}%`,
              background:
                score >= 4
                  ? 'var(--color-signal-strong)'
                  : score >= 2.5
                  ? 'var(--color-signal-warning)'
                  : 'var(--color-signal-critical)',
            }}
          />
        )}
        {!tested && (
          <div
            className="h-full w-0 bg-[var(--color-border-strong)]"
          />
        )}
      </div>
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────────

function QuestionsTab({ pack }: { pack: Pack }) {
  return (
    <div className="space-y-3">
      {pack.likely_questions.map((q) => (
        <div
          key={q.id}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all duration-[var(--transition-fast)]"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug">
              {q.text}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant={questionTypeVariant(q.type)}>
              {q.type}
            </Badge>
            <Badge variant={priorityVariant(q.priority)}>
              {q.priority} priority
            </Badge>
          </div>

          {q.why_likely && (
            <p className="text-[12px] text-[var(--color-text-muted)] italic mb-3 leading-relaxed">
              {q.why_likely}
            </p>
          )}

          <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">
            Open in Answer Lab
            <ChevronRight size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

function StoriesTab({ pack }: { pack: Pack }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {pack.stories.map((s) => (
        <div
          key={s.id}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 flex flex-col gap-3 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all duration-[var(--transition-fast)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {s.title}
            </h3>
            <span
              title={`Confidence: ${s.confidence.toFixed(1)}/5`}
              className={cn(
                'shrink-0 w-2.5 h-2.5 rounded-full mt-1',
                confidenceDotClass(s.confidence),
              )}
            />
          </div>

          {/* Summary */}
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
            {s.summary}
          </p>

          {/* Signal badges */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {s.signals.slice(0, 3).map((sig) => (
              <Badge key={sig} variant="primary">
                {formatSignal(sig)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PressureTab({ pack }: { pack: Pack }) {
  return (
    <div className="space-y-3">
      {pack.pressure_points.map((pp) => (
        <div
          key={pp.id}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 hover:border-[var(--color-signal-critical)]/30 hover:shadow-sm transition-all duration-[var(--transition-fast)]"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {pp.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="default">{pp.type}</Badge>
              <Badge variant={severityVariant(pp.severity)}>{pp.severity}</Badge>
            </div>
          </div>

          <p className="text-[13px] italic text-[var(--color-text-muted)] leading-relaxed mb-3">
            "{pp.interviewer_concern}"
          </p>

          <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline">
            <Zap size={12} />
            Practice drills
            <ChevronRight size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [pack, setPack] = useState<Pack | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPack = useCallback(async () => {
    try {
      // For local packs (no Supabase), load from localStorage
      if (id?.startsWith('local-')) {
        try {
          const stored = localStorage.getItem('im:packs')
          if (stored) {
            const packs = JSON.parse(stored)
            const found = packs.find((p: Pack) => p.id === id)
            if (found) { setPack(normalisePack(found)); setLoading(false); return }
          }
        } catch { /* ignore */ }
        setLoading(false)
        return
      }

      const res = await fetch(`/api/packs/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPack(normalisePack(data.pack ?? data))
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPack()
  }, [fetchPack])

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await fetch(`/api/packs/${id}`, { method: 'DELETE' })
      try {
        const stored = localStorage.getItem('im:packs')
        if (stored) {
          const filtered = JSON.parse(stored).filter((p: { id: string }) => p.id !== id)
          localStorage.setItem('im:packs', JSON.stringify(filtered))
        }
      } catch { /* ignore */ }
      // If pack was not found (stale entry), go to /new so they can retry immediately
      router.push(pack ? '/packs' : '/packs/new')
    } catch { /* ignore */ } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoading label="Loading pack…" />
  if (!pack) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center max-w-sm mx-auto">
      <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">This pack no longer exists</p>
      <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">
        It was likely deleted. Remove it from your list and create a fresh one for the same role.
      </p>
      <a href="/packs/new" className="mt-1 text-[14px] font-semibold text-[var(--color-primary)] hover:underline">
        Create a new pack →
      </a>
      <a href="/packs" className="text-[13px] text-[var(--color-text-muted)] hover:underline">
        ← Back to Interview Packs
      </a>
      {confirmDelete ? (
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[12px] text-[var(--color-text-muted)]">Remove this entry?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[12px] font-semibold text-[var(--color-signal-critical)] hover:underline disabled:opacity-50"
          >
            {deleting ? 'Removing…' : 'Yes, remove'}
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-[12px] text-[var(--color-text-muted)] hover:underline">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-signal-critical)] transition-colors"
        >
          <Trash2 size={12} />
          Remove from list
        </button>
      )}
    </div>
  )

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'questions', label: 'Questions', count: pack.likely_questions.length },
    { id: 'experience', label: 'Experience', count: (pack.experience_card_prompts ?? []).length },
    { id: 'stories', label: 'Stories', count: pack.stories.length },
    { id: 'pressure', label: 'Pressure', count: pack.pressure_points.length },
  ]

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <Breadcrumbs
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Packs', href: '/packs' },
          { label: pack.title },
        ]}
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── LEFT PANEL ── */}
        <aside className="w-full lg:w-[380px] lg:shrink-0 space-y-4">
          {/* Pack header card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            {/* Title + company */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] leading-snug">
                  {pack.title}
                </h1>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--color-text-muted)]">Delete?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-[11px] font-semibold text-[var(--color-signal-critical)] hover:underline disabled:opacity-50"
                    >
                      {deleting ? '…' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[11px] text-[var(--color-text-muted)] hover:underline"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-signal-critical)] transition-colors mt-0.5"
                    aria-label="Delete pack"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {pack.company && (
                  <Badge variant="primary">{pack.company}</Badge>
                )}
                <Badge variant="default">{pack.role_level}</Badge>
                <Badge variant="default">{pack.interview_type}</Badge>
              </div>
            </div>

            {/* Opening pitch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Opening pitch
                </p>
                <CopyButton text={pack.opening_pitch} />
              </div>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                {pack.opening_pitch}
              </p>
            </div>
          </div>

          {/* Match Score card */}
          <MatchScoreCard
            score={pack.match_score ?? 0}
            rationale={pack.match_rationale ?? ''}
          />

          {/* Org Intel card */}
          {pack.org_intel && <OrgIntelCard intel={pack.org_intel} />}

          {/* Signals + vocabulary card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            {/* Target signals */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Likely signals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pack.target_signals.map((s) => (
                  <Badge key={s} variant="strong">
                    {formatSignal(s)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Key vocabulary */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Key vocabulary
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pack.vocabulary.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Readiness card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              Readiness
            </p>
            <div className="space-y-3">
              {(Object.keys(pack.readiness) as Array<keyof typeof pack.readiness>).map((key) => (
                <ReadinessBar
                  key={key}
                  label={READINESS_LABELS[key]}
                  score={pack.readiness[key]}
                />
              ))}
            </div>
            <p className="mt-4 text-[12px] text-[var(--color-text-muted)] italic">
              Complete mock interviews to populate readiness scores.
            </p>
          </div>

          {/* Inferred priorities */}
          {pack.inferred_priorities.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Inferred priorities
              </p>
              <ul className="space-y-2">
                {pack.inferred_priorities.map((priority) => (
                  <li
                    key={priority}
                    className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] shrink-0" />
                    {priority}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius-md)] text-[13px] font-semibold transition-all duration-[var(--transition-fast)]',
                  activeTab === tab.id
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]',
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                      activeTab === tab.id
                        ? 'bg-white/25 text-white'
                        : 'bg-[var(--color-border)] text-[var(--color-text-muted)]',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                overlapAreas={pack.overlap_areas ?? []}
                gapAreas={pack.gap_areas ?? []}
                gapFillingTips={pack.gap_filling_tips ?? []}
                orgIntel={pack.org_intel ?? null}
              />
            )}
            {activeTab === 'questions' && <QuestionsTab pack={pack} />}
            {activeTab === 'experience' && (
              <ExperienceTab prompts={pack.experience_card_prompts ?? []} />
            )}
            {activeTab === 'stories' && <StoriesTab pack={pack} />}
            {activeTab === 'pressure' && <PressureTab pack={pack} />}
          </div>
        </div>
      </div>
    </div>
  )
}
