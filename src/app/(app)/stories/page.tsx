'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  LayoutGrid,
  Network,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import { cn, formatSignalLabel, scoreToColour } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SignalBar } from '@/components/ui/signal-bar'
import { PageLoading } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import type { Story, QuestionType, SignalType, StoryVariant } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'grid' | 'constellation'

type FilterTag = 'all' | QuestionType

const FILTER_PILLS: { label: string; value: FilterTag }[] = [
  { label: 'All', value: 'all' },
  { label: 'Leadership', value: 'leadership' },
  { label: 'Behavioural', value: 'behavioural' },
  { label: 'Strategy', value: 'strategy' },
  { label: 'Failure', value: 'failure' },
  { label: 'Commercial', value: 'commercial' },
]

const VARIANT_MODE_LABELS: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  strategic: 'Strategic',
  reflective: 'Reflective',
  concise: 'Concise',
  executive: 'Executive',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTagBadgeVariant(tag: QuestionType) {
  const map: Partial<Record<QuestionType, 'primary' | 'strong' | 'warning' | 'critical' | 'strategic'>> = {
    leadership: 'primary',
    strategy: 'strategic',
    failure: 'critical',
    commercial: 'warning',
    achievement: 'strong',
    behavioural: 'default' as 'primary',
    competency: 'default' as 'primary',
  }
  return map[tag] ?? 'default'
}

function storyInitials(title: string): string {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function averageSignalScore(signals: Record<SignalType, number>): number {
  const values = Object.values(signals).filter((v) => v > 0)
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function topSignals(signals: Record<SignalType, number>, n: number): [SignalType, number][] {
  return (Object.entries(signals) as [SignalType, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
}

function nodeColour(avgScore: number): string {
  if (avgScore >= 4) return 'var(--color-signal-strong)'
  if (avgScore >= 2.5) return 'var(--color-signal-warning)'
  return 'var(--color-signal-critical)'
}

function confidenceColour(score: number): string {
  if (score >= 0.8) return 'var(--color-signal-strong)'
  if (score >= 0.5) return 'var(--color-signal-warning)'
  return 'var(--color-signal-critical)'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VariantsPanel({ variants }: { variants: StoryVariant[] }) {
  const [activeMode, setActiveMode] = useState(variants[0]?.mode ?? 'short')
  const active = variants.find((v) => v.mode === activeMode) ?? variants[0]

  if (variants.length === 0) {
    return (
      <div className="mt-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)]">
        <p className="text-[13px] text-[var(--color-text-muted)]">No variants generated yet. Open in Answer Lab to create them.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-background)]">
        {variants.map((v) => (
          <button
            key={v.mode}
            onClick={() => setActiveMode(v.mode)}
            className={cn(
              'px-3 py-2 text-[12px] font-semibold transition-colors',
              activeMode === v.mode
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-white -mb-px'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {VARIANT_MODE_LABELS[v.mode] ?? v.mode}
          </button>
        ))}
      </div>
      {/* Content */}
      {active && (
        <div className="p-4 bg-white">
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">{active.content}</p>
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{active.word_count} words</p>
        </div>
      )}
    </div>
  )
}

function StoryCard({
  story,
  expanded,
  onToggleExpand,
}: {
  story: Story
  expanded: boolean
  onToggleExpand: () => void
}) {
  const visibleTags = story.question_fit_tags.slice(0, 4)
  const extraTags = story.question_fit_tags.length - 4
  const top3 = topSignals(story.signal_strengths, 3)

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px] p-5 flex flex-col gap-3 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">{story.title}</h3>
          {story.is_overused && (
            <Badge variant="warning">
              <AlertTriangle size={10} className="mr-1" />
              Overused
            </Badge>
          )}
        </div>
        {/* Confidence dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: confidenceColour(story.confidence_score) }}
          />
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: confidenceColour(story.confidence_score) }}>
            {Math.round(story.confidence_score * 100)}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug line-clamp-2">{story.summary}</p>

      {/* Question fit tags */}
      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <Badge key={tag} variant={getTagBadgeVariant(tag) as 'default'}>
            {tag}
          </Badge>
        ))}
        {extraTags > 0 && (
          <Badge variant="outline">+{extraTags} more</Badge>
        )}
      </div>

      {/* Top 3 signal bars */}
      {top3.length > 0 && (
        <div className="space-y-1.5">
          {top3.map(([signal, score]) => (
            <SignalBar key={signal} signal={signal} score={score} compact />
          ))}
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)] mt-auto">
        <Link
          href={`/answer-lab?story=${story.id}`}
          className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)] hover:underline"
        >
          Open in Answer Lab
          <ArrowRight size={13} />
        </Link>
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {expanded ? (
            <>Hide variants <ChevronUp size={13} /></>
          ) : (
            <>View variants <ChevronDown size={13} /></>
          )}
        </button>
      </div>

      {/* Variants panel (animated) */}
      {expanded && <VariantsPanel variants={story.variants} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Constellation node positions (deterministic scatter within a grid)
// ---------------------------------------------------------------------------

function getNodePosition(index: number, total: number, width: number, height: number) {
  // Lay out in a loose grid with slight offset per row for visual interest
  const cols = Math.ceil(Math.sqrt(total * 1.6))
  const col = index % cols
  const row = Math.floor(index / cols)
  const colW = width / cols
  const rowH = height / Math.ceil(total / cols)
  // Add a small offset to alternate rows
  const offsetX = (row % 2) * (colW * 0.3)
  return {
    x: colW * col + colW * 0.5 + offsetX,
    y: rowH * row + rowH * 0.5,
  }
}

function ConstellationView({
  stories,
  selected,
  onSelect,
}: {
  stories: Story[]
  selected: Story | null
  onSelect: (story: Story | null) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dims, setDims] = useState({ w: 800, h: 500 })
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setDims({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const W = dims.w
  const H = dims.h
  const nodePositions = stories.map((s, i) => ({
    story: s,
    ...getNodePosition(i, stories.length, W, H),
  }))

  // Build connection lines: stories sharing a question_fit_tag
  const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const a = nodePositions[i]
      const b = nodePositions[j]
      const shared = a.story.question_fit_tags.some((t) => b.story.question_fit_tags.includes(t))
      if (shared) {
        lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `${a.story.id}-${b.story.id}` })
      }
    }
  }

  return (
    <div className="flex gap-0 w-full" style={{ minHeight: 520 }}>
      {/* Canvas */}
      <div
        className="relative flex-1 rounded-[var(--radius-lg)] overflow-hidden"
        style={{ background: '#0F172A', minHeight: 520 }}
      >
        <svg
          ref={svgRef}
          width={W}
          height={H}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Connection lines */}
          {lines.map((l) => (
            <line
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="white"
              strokeWidth={1}
              strokeOpacity={0.15}
            />
          ))}

          {/* Nodes */}
          {nodePositions.map(({ story, x, y }) => {
            const avg = averageSignalScore(story.signal_strengths)
            const diameter = Math.min(80, Math.max(48, story.confidence_score * 60))
            const r = diameter / 2
            const colour = nodeColour(avg)
            const isHovered = hovered === story.id
            const isSelected = selected?.id === story.id
            const scale = isHovered || isSelected ? 1.15 : 1

            return (
              <g
                key={story.id}
                transform={`translate(${x}, ${y}) scale(${scale})`}
                style={{ transformOrigin: `${x}px ${y}px`, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={() => setHovered(story.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(isSelected ? null : story)}
              >
                {/* Glow ring for selected */}
                {isSelected && (
                  <circle
                    cx={0}
                    cy={0}
                    r={r + 6}
                    fill="none"
                    stroke={colour}
                    strokeWidth={2}
                    strokeOpacity={0.6}
                  />
                )}
                {/* Main circle */}
                <circle cx={0} cy={0} r={r} fill={colour} fillOpacity={isSelected ? 0.9 : 0.7} />
                {/* Initials */}
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={diameter < 56 ? 11 : 13}
                  fontWeight="700"
                  fontFamily="inherit"
                >
                  {storyInitials(story.title)}
                </text>
                {/* Hover label */}
                {isHovered && !isSelected && (
                  <>
                    <rect
                      x={r + 6}
                      y={-20}
                      width={Math.min(160, story.title.length * 7 + 16)}
                      height={38}
                      rx={6}
                      fill="#1E293B"
                      fillOpacity={0.95}
                    />
                    <text
                      x={r + 14}
                      y={-5}
                      fill="white"
                      fontSize={11}
                      fontWeight="600"
                      fontFamily="inherit"
                    >
                      {story.title.length > 20 ? story.title.slice(0, 20) + '…' : story.title}
                    </text>
                    {topSignals(story.signal_strengths, 1).map(([sig]) => (
                      <text
                        key={sig}
                        x={r + 14}
                        y={10}
                        fill={colour}
                        fontSize={10}
                        fontFamily="inherit"
                      >
                        {formatSignalLabel(sig)}
                      </text>
                    ))}
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-[11px] text-white/60">
          <div className="flex items-center gap-2 font-semibold text-white/80 mb-1">Legend</div>
          {[
            { colour: 'var(--color-signal-strong)', label: 'Strong signals (4–5)' },
            { colour: 'var(--color-signal-warning)', label: 'Moderate signals (2.5–4)' },
            { colour: 'var(--color-signal-critical)', label: 'Weak signals (&lt;2.5)' },
          ].map(({ colour, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colour }} />
              <span dangerouslySetInnerHTML={{ __html: label }} />
            </div>
          ))}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block w-6 border-t border-white/20" />
            <span>Shared question type</span>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="w-80 shrink-0 ml-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-3 overflow-y-auto"
          style={{ maxHeight: 520 }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">{selected.title}</h3>
            <button
              onClick={() => onSelect(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-[18px] leading-none"
            >
              ×
            </button>
          </div>

          <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug">{selected.summary}</p>

          <div className="flex flex-wrap gap-1.5">
            {selected.question_fit_tags.map((tag) => (
              <Badge key={tag} variant={getTagBadgeVariant(tag) as 'default'}>
                {tag}
              </Badge>
            ))}
          </div>

          <div className="space-y-1.5">
            {topSignals(selected.signal_strengths, 5).map(([signal, score]) => (
              <SignalBar key={signal} signal={signal} score={score} compact />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: confidenceColour(selected.confidence_score) }}
            />
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              Confidence: <strong>{Math.round(selected.confidence_score * 100)}%</strong>
            </span>
          </div>

          <Link
            href={`/answer-lab?story=${selected.id}`}
            className="mt-auto flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white text-[13px] font-semibold py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Open in Answer Lab
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [mining, setMining] = useState(false)
  const [filter, setFilter] = useState<FilterTag>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

  const [mineError, setMineError] = useState<string | null>(null)

  const fetchStories = useCallback(async () => {
    try {
      // Prefer localStorage (real mined stories) over the API demo fixture
      try {
        const stored = localStorage.getItem('im:stories')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStories(parsed)
            setLoading(false)
            return
          }
        }
      } catch { /* ignore */ }

      const res = await fetch('/api/ai/stories')
      const data = await res.json()
      // Don't show API demo fixtures — only show empty state so user mines real ones
      const apiStories = data.stories ?? []
      const isDemo = apiStories.some((s: { id: string }) => s.id?.startsWith('demo-'))
      setStories(isDemo ? [] : apiStories)
    } catch {
      // ignore — empty state shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  async function handleMineMore() {
    setMining(true)
    setMineError(null)
    try {
      // In no-Supabase mode, read graph from localStorage and send to API
      let body: BodyInit | undefined
      const stored = localStorage.getItem('im:graph')
      if (stored) {
        const { profile, nodes } = JSON.parse(stored)
        body = JSON.stringify({ profile, nodes })
      }

      const res = await fetch('/api/ai/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const data = await res.json()
      if (!res.ok) {
        setMineError(data.error ?? 'Failed to mine stories')
        return
      }
      const mined = data.stories ?? []
      setStories(mined)
      try { localStorage.setItem('im:stories', JSON.stringify(mined)) } catch { /* ignore */ }
    } catch {
      setMineError('Could not connect to server')
    } finally {
      setMining(false)
    }
  }

  function toggleVariants(id: string) {
    setExpandedVariants((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered =
    filter === 'all'
      ? stories
      : stories.filter((s) => s.question_fit_tags.includes(filter as QuestionType))

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">Story Constellation</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-0.5">
            Your story assets — how they cover question types and signal strength.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--color-background)] rounded-[var(--radius-md)] p-0.5 border border-[var(--color-border)]">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] font-semibold transition-colors',
                view === 'grid'
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              <LayoutGrid size={13} />
              Grid
            </button>
            <button
              onClick={() => setView('constellation')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] font-semibold transition-colors',
                view === 'constellation'
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              <Network size={13} />
              Constellation
            </button>
          </div>

          {/* Mine more */}
          <button
            onClick={handleMineMore}
            disabled={mining}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white text-[13px] font-semibold px-4 py-2 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-colors"
          >
            {mining ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            Mine more stories
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setFilter(pill.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors border',
              filter === pill.value
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]',
            )}
          >
            {pill.label}
          </button>
        ))}
        {filtered.length > 0 && (
          <span className="text-[12px] text-[var(--color-text-muted)] ml-1">
            {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
          </span>
        )}
      </div>

      {/* Mine error */}
      {mineError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {mineError}
          {mineError.includes('Upload') && (
            <a href="/profile" className="ml-2 underline font-medium">Upload CV →</a>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <PageLoading label="Loading your stories…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No stories yet"
          description={
            filter === 'all'
              ? 'Upload your CV and then click Mine Stories to extract your real interview stories.'
              : `No stories tagged with "${filter}". Try a different filter or mine more stories.`
          }
          action={
            filter !== 'all'
              ? undefined
              : { label: 'Mine stories now', href: '#' }
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              expanded={expandedVariants.has(story.id)}
              onToggleExpand={() => toggleVariants(story.id)}
            />
          ))}
        </div>
      ) : (
        <ConstellationView
          stories={filtered}
          selected={selectedStory}
          onSelect={setSelectedStory}
        />
      )}
    </div>
  )
}
