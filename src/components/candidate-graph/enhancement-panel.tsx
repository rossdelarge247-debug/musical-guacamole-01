'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2, Check, X, RefreshCw } from 'lucide-react'
import type { GraphNode } from './graph-node-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recommendation {
  id: string
  text: string
  status: 'pending' | 'accepted' | 'declined'
}

interface Section {
  title: string
  items: Recommendation[]
}

// ---------------------------------------------------------------------------
// Markdown parser — sections + bullet items
// ---------------------------------------------------------------------------

let _idSeq = 0

function parseMarkdown(text: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('## ')) {
      if (current && current.items.length > 0) sections.push(current)
      current = { title: line.slice(3).trim(), items: [] }
    } else if ((line.startsWith('- ') || line.startsWith('* ')) && current) {
      const cleaned = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '$1').trim()
      if (cleaned) current.items.push({ id: String(++_idSeq), text: cleaned, status: 'pending' })
    }
  }
  if (current && current.items.length > 0) sections.push(current)
  return sections
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
// Component
// ---------------------------------------------------------------------------

interface EnhancementPanelProps {
  role: GraphNode
  children: GraphNode[]
  onClose: () => void
}

export function EnhancementPanel({ role, children, onClose }: EnhancementPanelProps) {
  const [phase, setPhase] = useState<'loading' | 'done' | 'error'>('loading')
  const [sections, setSections] = useState<Section[]>([])
  const [step, setStep] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const run = useCallback(async () => {
    setPhase('loading')
    setStep(0)
    setSections([])
    setErrorMsg('')

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

  // Run on mount
  useEffect(() => { run() }, [run])

  // Advance thinking step while loading
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200)
    return () => clearInterval(t)
  }, [phase])

  function updateItem(si: number, id: string, status: 'accepted' | 'declined') {
    setSections((prev) =>
      prev.map((s, i) =>
        i !== si ? s : { ...s, items: s.items.map((item) => item.id === id ? { ...item, status } : item) },
      ),
    )
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
        <button
          onClick={onClose}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={15} style={{ color: 'var(--color-primary)' }} />
        </button>
      </div>

      {/* ── Loading ── */}
      {phase === 'loading' && (
        <div className="px-5 py-6 space-y-5" style={{ background: 'var(--color-background)' }}>
          <div className="flex items-start gap-3">
            {/* Pulsing avatar */}
            <div className="relative w-9 h-9 shrink-0">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: 'var(--color-primary)' }}
              />
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary)' }}
              >
                <Loader2 size={15} className="text-white animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Helper Monkey is thinking…
              </p>
              <p
                key={step}
                className="text-[13px] mt-0.5 transition-all"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {STEPS[step]}
              </p>
            </div>
          </div>

          {/* Progress dots */}
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
          <p className="text-[13px]" style={{ color: 'var(--color-signal-critical)' }}>
            {errorMsg}
          </p>
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
          {sections.map((section, si) => (
            <div key={si} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
              {/* Section header */}
              <div className="px-4 pt-4 pb-2">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {section.title}
                </p>
              </div>

              {/* Recommendation cards */}
              <div>
                {section.items.map((item) => {
                  if (item.status === 'declined') return null
                  const accepted = item.status === 'accepted'
                  return (
                    <div
                      key={item.id}
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
                        ) : (
                          <>
                            <button
                              onClick={() => updateItem(si, item.id, 'accepted')}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
                              style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}
                            >
                              <Check size={10} />
                              Accept
                            </button>
                            <button
                              onClick={() => updateItem(si, item.id, 'declined')}
                              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--color-background)]"
                              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                            >
                              <X size={10} />
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={run}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <RefreshCw size={12} />
              Try again
            </button>
            <button
              onClick={onClose}
              className="text-[12px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
