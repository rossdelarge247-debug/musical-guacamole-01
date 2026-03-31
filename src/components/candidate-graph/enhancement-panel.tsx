'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2, Check, X, RefreshCw, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import type { GraphNode } from './graph-node-card'
import type { IntakeQuestion } from '@/app/api/ai/role/intake/route'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recommendation {
  id: string
  text: string
  status: 'pending' | 'accepted' | 'declined'
}

type SectionType = 'questions' | 'what_to_add' | 'strengthen'

interface Section {
  title: string
  type: SectionType
  items: Recommendation[]
}

interface IntakeState {
  itemId: string
  phase: 'loading' | 'questions' | 'applying' | 'done' | 'error'
  questions: IntakeQuestion[]
  answers: Record<string, string>
  error?: string
}

// ---------------------------------------------------------------------------
// Markdown parser
// ---------------------------------------------------------------------------

let _idSeq = 0

const SECTION_ORDER: Record<SectionType, number> = {
  what_to_add: 0,
  strengthen: 1,
  questions: 2,
}

function getSectionType(title: string): SectionType {
  const t = title.toLowerCase()
  if (t.includes('question')) return 'questions'
  if (t.includes('add')) return 'what_to_add'
  return 'strengthen'
}

function parseMarkdown(text: string): Section[] {
  const raw: Section[] = []
  let current: Section | null = null

  for (const raw_line of text.split('\n')) {
    const line = raw_line.trim()
    if (line.startsWith('## ')) {
      if (current && current.items.length > 0) raw.push(current)
      const title = line.slice(3).trim()
      current = { title, type: getSectionType(title), items: [] }
    } else if ((line.startsWith('- ') || line.startsWith('* ')) && current) {
      const cleaned = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '$1').trim()
      if (cleaned) current.items.push({ id: String(++_idSeq), text: cleaned, status: 'pending' })
    }
  }
  if (current && current.items.length > 0) raw.push(current)

  return raw.sort((a, b) => SECTION_ORDER[a.type] - SECTION_ORDER[b.type])
}

// ---------------------------------------------------------------------------
// Thinking steps
// ---------------------------------------------------------------------------

const STEPS = [
  'Reading your role description…',
  'Identifying what interviewers look for in this position…',
  'Scanning for gaps and missing context…',
  'Crafting specific recommendations…',
  'Polishing the final suggestions…',
]

// ---------------------------------------------------------------------------
// IntakeFlow sub-component
// ---------------------------------------------------------------------------

interface IntakeFlowProps {
  state: IntakeState
  onAnswerChange: (questionId: string, value: string) => void
  onApply: () => void
  onCancel: () => void
}

function IntakeFlow({ state, onAnswerChange, onApply, onCancel }: IntakeFlowProps) {
  return (
    <div
      className="mx-4 mb-3 rounded-[var(--radius-md)] border overflow-hidden"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
        background: 'var(--color-primary-light)',
      }}
    >
      {/* Mini header */}
      <div
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
      >
        <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
          Helper Monkey needs a bit more info…
        </span>
      </div>

      {state.phase === 'loading' && (
        <div className="px-3 py-4 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            Helper Monkey is working out what to ask…
          </span>
        </div>
      )}

      {state.phase === 'questions' && (
        <div className="px-3 py-3 space-y-3">
          {state.questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <label className="block text-[12px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {q.text}
              </label>

              {q.type === 'text' && (
                <input
                  type="text"
                  className="w-full text-[13px] px-2.5 py-1.5 rounded border focus:outline-none focus:ring-1"
                  placeholder={q.placeholder ?? ''}
                  value={state.answers[q.id] ?? ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              )}

              {q.type === 'number' && (
                <input
                  type="number"
                  className="w-full text-[13px] px-2.5 py-1.5 rounded border focus:outline-none focus:ring-1"
                  placeholder={q.placeholder ?? ''}
                  value={state.answers[q.id] ?? ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              )}

              {q.type === 'radio' && q.options && (
                <div className="flex gap-2 flex-wrap">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onAnswerChange(q.id, opt)}
                      className="text-[12px] font-medium px-3 py-1 rounded-full border transition-colors"
                      style={{
                        borderColor: state.answers[q.id] === opt ? 'var(--color-primary)' : 'var(--color-border)',
                        background: state.answers[q.id] === opt ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: state.answers[q.id] === opt ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'select' && q.options && (
                <select
                  className="w-full text-[13px] px-2.5 py-1.5 rounded border focus:outline-none"
                  value={state.answers[q.id] ?? ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Select…</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onApply}
              className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-[var(--radius-md)] text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <Sparkles size={12} />
              Help me Monkey!
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[12px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.phase === 'applying' && (
        <div className="px-3 py-4 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            Helper Monkey is crafting your card…
          </span>
        </div>
      )}

      {state.phase === 'done' && (
        <div className="px-3 py-3 flex items-center gap-2">
          <Check size={14} style={{ color: '#065F46' }} />
          <span className="text-[13px] font-medium" style={{ color: '#065F46' }}>
            Card added to your role!
          </span>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="px-3 py-3 space-y-2">
          <p className="text-[13px]" style={{ color: 'var(--color-signal-critical)' }}>
            {state.error}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EnhancementPanel
// ---------------------------------------------------------------------------

interface EnhancementPanelProps {
  role: GraphNode
  children: GraphNode[]
  onClose: () => void
  onAddNode: (nodeData: Partial<GraphNode>) => void
}

export function EnhancementPanel({ role, children, onClose, onAddNode }: EnhancementPanelProps) {
  const [phase, setPhase] = useState<'loading' | 'done' | 'error'>('loading')
  const [sections, setSections] = useState<Section[]>([])
  const [step, setStep] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [questionsCollapsed, setQuestionsCollapsed] = useState(true)
  const [activeIntake, setActiveIntake] = useState<IntakeState | null>(null)

  const run = useCallback(async () => {
    setPhase('loading')
    setStep(0)
    setSections([])
    setErrorMsg('')
    setActiveIntake(null)

    try {
      const res = await fetch('/api/ai/role/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, children }),
      })
      if (!res.ok || !res.body) {
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      const parsed = parseMarkdown(accumulated)
      if (parsed.length === 0) throw new Error('Helper Monkey returned nothing useful — try again.')
      setSections(parsed)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setPhase('error')
    }
  }, [role, children])

  useEffect(() => { run() }, [run])

  // Advance thinking step while loading
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200)
    return () => clearInterval(t)
  }, [phase])

  // Auto-add interviewer questions to Answer Lab
  useEffect(() => {
    if (phase !== 'done') return
    const qs = sections.find((s) => s.type === 'questions')
    if (!qs || qs.items.length === 0) return
    try {
      const stored = localStorage.getItem('im:packs')
      if (!stored) return
      const packs = JSON.parse(stored)
      if (!Array.isArray(packs) || packs.length === 0) return
      const pack = packs[0]
      const existingIds = new Set<string>((pack.likely_questions ?? []).map((q: { id: string }) => q.id))
      const newQs = qs.items
        .filter((item) => !existingIds.has(`enhance-${item.id}`))
        .map((item) => ({
          id: `enhance-${item.id}`,
          text: item.text,
          type: 'strategy',
          priority: 'medium',
          why_likely: `Helper Monkey enhancement — ${role.title}`,
        }))
      if (newQs.length === 0) return
      packs[0] = { ...pack, likely_questions: [...(pack.likely_questions ?? []), ...newQs] }
      localStorage.setItem('im:packs', JSON.stringify(packs))
    } catch { /* silent */ }
  }, [phase, sections, role.title])

  function updateItem(si: number, id: string, status: 'accepted' | 'declined') {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, items: s.items.map((item) => item.id === id ? { ...item, status } : item) },
      ),
    )
  }

  async function handleLetsDoIt(item: Recommendation) {
    setActiveIntake({ itemId: item.id, phase: 'loading', questions: [], answers: {} })
    try {
      const res = await fetch('/api/ai/role/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, children, item: item.text }),
      })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      const data = await res.json()
      setActiveIntake((prev) => prev ? { ...prev, phase: 'questions', questions: data.questions ?? [] } : null)
    } catch (err) {
      setActiveIntake((prev) => prev
        ? { ...prev, phase: 'error', error: err instanceof Error ? err.message : 'Failed to load questions.' }
        : null,
      )
    }
  }

  function handleAnswerChange(questionId: string, value: string) {
    setActiveIntake((prev) => prev ? { ...prev, answers: { ...prev.answers, [questionId]: value } } : null)
  }

  async function handleApply(item: Recommendation, si: number) {
    if (!activeIntake) return
    setActiveIntake((prev) => prev ? { ...prev, phase: 'applying' } : null)
    try {
      const answers = activeIntake.questions.map((q) => ({
        questionId: q.id,
        questionText: q.text,
        answer: activeIntake.answers[q.id] ?? '',
      }))
      const res = await fetch('/api/ai/role/intake/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, item: item.text, answers }),
      })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      const nodeData = await res.json()
      onAddNode(nodeData)
      updateItem(si, item.id, 'accepted')
      // Show "done" briefly then auto-dismiss the intake form
      setActiveIntake((prev) => prev ? { ...prev, phase: 'done' } : null)
      setTimeout(() => setActiveIntake(null), 1800)
    } catch (err) {
      setActiveIntake((prev) => prev
        ? { ...prev, phase: 'error', error: err instanceof Error ? err.message : 'Helper Monkey got confused. Try again.' }
        : null,
      )
    }
  }

  const label = [role.title, role.organisation].filter(Boolean).join(' · ')

  return (
    <div
      className="mt-4 rounded-[var(--radius-lg)] border overflow-hidden"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b"
        style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-border)' }}
      >
        <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
        <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: 'var(--color-primary)' }}>
          Helper Monkey on: {label}
        </span>
        <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity" aria-label="Close">
          <X size={15} style={{ color: 'var(--color-primary)' }} />
        </button>
      </div>

      {/* ── Loading ── */}
      {phase === 'loading' && (
        <div className="px-5 py-6 space-y-5" style={{ background: 'var(--color-background)' }}>
          <div className="flex items-start gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--color-primary)' }} />
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                <Loader2 size={15} className="text-white animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Helper Monkey is thinking…
              </p>
              <p key={step} className="text-[13px] mt-0.5 transition-all" style={{ color: 'var(--color-text-secondary)' }}>
                {STEPS[step]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-12">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                  opacity: i <= step ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {phase === 'error' && (
        <div className="px-5 py-5 space-y-3" style={{ background: 'var(--color-background)' }}>
          <p className="text-[13px]" style={{ color: 'var(--color-signal-critical)' }}>{errorMsg}</p>
          <button
            onClick={run}
            className="flex items-center gap-2 text-[13px] font-medium px-3 py-2 rounded-[var(--radius-md)] border transition-colors hover:bg-[var(--color-surface)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {phase === 'done' && (
        <div style={{ background: 'var(--color-background)' }}>
          {sections.map((section, si) => {
            // ── Questions section: collapsed, shown last, auto-added to Answer Lab ──
            if (section.type === 'questions') {
              const count = section.items.length
              return (
                <div key={si} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setQuestionsCollapsed((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[var(--color-surface)] transition-colors"
                  >
                    {questionsCollapsed
                      ? <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                      : <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
                    }
                    <BookOpen size={13} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Interview questions
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {count} added to Answer Lab
                    </span>
                  </button>
                  {!questionsCollapsed && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className="px-3 py-2 rounded-[var(--radius-md)] text-[13px]"
                          style={{
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {item.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            // ── What to add / Strengthen sections ──
            const isWhatToAdd = section.type === 'what_to_add'

            return (
              <div key={si} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {section.title}
                  </p>
                </div>

                <div>
                  {section.items.map((item) => {
                    if (item.status === 'declined') return null
                    const accepted = item.status === 'accepted'
                    const isActiveIntake = activeIntake?.itemId === item.id

                    return (
                      <div key={item.id}>
                        <div
                          className="flex items-start gap-3 px-4 py-3 border-t transition-colors"
                          style={{
                            borderColor: 'var(--color-border)',
                            background: accepted ? '#F0FDF4' : 'var(--color-surface)',
                          }}
                        >
                          <p
                            className="text-[13px] flex-1 leading-relaxed"
                            style={{ color: accepted ? '#166534' : 'var(--color-text-secondary)' }}
                          >
                            {item.text}
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            {accepted ? (
                              <span
                                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: '#D1FAE5', color: '#065F46' }}
                              >
                                <Check size={10} />
                                Noted
                              </span>
                            ) : isWhatToAdd ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleLetsDoIt(item)}
                                  disabled={!!activeIntake}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:opacity-80 disabled:opacity-40"
                                  style={{
                                    background: 'var(--color-primary-light)',
                                    color: 'var(--color-primary)',
                                    border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                                  }}
                                >
                                  <Sparkles size={10} />
                                  {"Let's do it"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(si, item.id, 'declined')}
                                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--color-background)]"
                                  style={{
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                  }}
                                >
                                  <X size={10} />
                                  No thanks
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateItem(si, item.id, 'accepted')}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
                                  style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}
                                >
                                  <Check size={10} />
                                  Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(si, item.id, 'declined')}
                                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--color-background)]"
                                  style={{
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                  }}
                                >
                                  <X size={10} />
                                  No thanks
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline intake form for "Let's do it" */}
                        {isActiveIntake && isWhatToAdd && (
                          <IntakeFlow
                            state={activeIntake}
                            onAnswerChange={handleAnswerChange}
                            onApply={() => handleApply(item, si)}
                            onCancel={() => setActiveIntake(null)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          {(() => {
            const anyAccepted = sections.some((s) => s.items.some((i) => i.status === 'accepted'))
            return (
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {anyAccepted ? (
                  <button
                    onClick={run}
                    className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-60"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <RefreshCw size={12} />
                    Run again
                  </button>
                ) : (
                  <button
                    onClick={run}
                    className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <RefreshCw size={12} />
                    Try again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`text-[13px] font-semibold px-4 py-1.5 rounded-[var(--radius-md)] transition-colors ${anyAccepted ? 'text-white' : ''}`}
                  style={anyAccepted
                    ? { background: 'var(--color-primary)', color: '#fff' }
                    : { color: 'var(--color-text-muted)' }
                  }
                >
                  {anyAccepted ? 'Finish ✓' : 'Close'}
                </button>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
