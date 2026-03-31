'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Trophy,
  Lightbulb,
  BarChart2,
  User,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'extracting' | 'analysing' | 'done' | 'error'

interface Discovery {
  id: string
  category: string
  value: string
}

interface ParseResult {
  profile: { headline: string; skills: string[]; parsing_confidence: number }
  summary: { nodeCount: number; roleCount: number; achievementCount: number; skillCount: number }
  demo: boolean
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Role: Briefcase,
  Achievement: Trophy,
  Learning: Lightbulb,
  'Proof point': BarChart2,
  Profile: User,
}

const CATEGORY_COLOR: Record<string, string> = {
  Role: '#2557A7',
  Achievement: '#059669',
  Learning: '#D97706',
  'Proof point': '#7C3AED',
  Profile: '#0891B2',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CVUpload() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [result, setResult] = useState<ParseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{ ai_demo: boolean; anthropic_key: string } | null>(null)
  const discoveryIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  function addDiscovery(category: string, value: string) {
    const id = String(discoveryIdRef.current++)
    setDiscoveries((prev) => [...prev, { id, category, value }])
    // Auto-scroll discovery list
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, 50)
  }

  async function runStream(body: FormData) {
    setPhase('extracting')
    setDiscoveries([])
    setErrorMsg(null)
    setStatusMsg('Starting…')
    setDebugInfo(null)

    try {
      const res = await fetch('/api/profile/parse', {
        method: 'POST',
        body,
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }

      setPhase('analysing')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process complete newline-delimited JSON lines
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const event = JSON.parse(trimmed)
            if (event.type === 'debug') {
              setDebugInfo({ ai_demo: event.ai_demo, anthropic_key: event.anthropic_key })
            } else if (event.type === 'status') {
              setStatusMsg(event.message)
            } else if (event.type === 'found') {
              addDiscovery(event.category, event.value)
            } else if (event.type === 'error') {
              setErrorMsg(event.message)
              setPhase('error')
              return
            } else if (event.type === 'complete') {
              setResult(event.data)
              // Save to localStorage (with fileName for profile page)
              try {
                const savedAt = Date.now()
                // Push previous graph to history before overwriting
                const existing = localStorage.getItem('im:graph')
                if (existing) {
                  const old = JSON.parse(existing)
                  if (old.savedAt) {
                    const history: Array<{ fileName: string; uploadedAt: number; headline: string; nodeCount: number }> =
                      JSON.parse(localStorage.getItem('im:cv-history') ?? '[]')
                    history.unshift({
                      fileName: old.fileName ?? 'CV',
                      uploadedAt: old.savedAt,
                      headline: old.profile?.headline ?? '',
                      nodeCount: old.nodes?.length ?? 0,
                    })
                    localStorage.setItem('im:cv-history', JSON.stringify(history.slice(0, 5)))
                  }
                }
                localStorage.setItem('im:graph', JSON.stringify({
                  profile: event.data.profile,
                  nodes: event.data.nodes ?? [],
                  savedAt,
                  fileName: fileName ?? 'Pasted text',
                }))
              } catch { /* ignore */ }
              // Skip done state — go straight to Candidate Graph
              window.location.href = '/dashboard'
              return
            }
          } catch {
            // malformed line — skip
          }
        }
      }

      if (phase !== 'done' && phase !== 'error') {
        setErrorMsg('Stream ended without a result. Please try again.')
        setPhase('error')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      setPhase('error')
    }
  }

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      setFileName(file.name)
      const form = new FormData()
      form.append('file', file)
      await runStream(form)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return
    setFileName(null)
    const form = new FormData()
    form.append('text', pasteText)
    await runStream(form)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: phase === 'extracting' || phase === 'analysing',
  })

  // ── Done state ──────────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const { profile, summary, demo } = result
    const safeSummary = summary ?? { nodeCount: 0, roleCount: 0, achievementCount: 0, skillCount: 0 }
    const confidence = Math.round((profile.parsing_confidence ?? 0.8) * 100)
    return (
      <div className="space-y-5">
        {/* Success header */}
        <div
          className="rounded-xl p-5 border"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} style={{ color: '#16A34A' }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold" style={{ color: '#15803D' }}>
                Candidate Graph built — {confidence}% confidence
                {demo && <span className="ml-2 text-[11px] font-normal px-1.5 py-0.5 rounded" style={{ background: '#FEF9C3', color: '#92400E' }}>DEMO — add ANTHROPIC_API_KEY for real analysis</span>}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: '#166534' }}>
                {profile.headline}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Graph nodes', value: safeSummary.nodeCount },
            { label: 'Roles found', value: safeSummary.roleCount },
            { label: 'Achievements', value: safeSummary.achievementCount },
            { label: 'Skills', value: safeSummary.skillCount },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3 text-center border"
              style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <p className="text-[28px] font-bold" style={{ color: '#2557A7' }}>{s.value}</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
              Skills extracted
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full text-[12px] font-medium"
                  style={{ background: '#EFF6FF', color: '#2557A7' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <a
          href="/profile/graph"
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Review your Candidate Graph
          <ArrowRight size={15} />
        </a>
      </div>
    )
  }

  // ── Analysing state ─────────────────────────────────────────────────────────
  if (phase === 'extracting' || phase === 'analysing') {
    return (
      <div
        className="rounded-xl border p-6 space-y-5"
        style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: '#2557A7' }}
            />
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#2557A7' }}
            >
              <Loader2 size={15} className="text-white animate-spin" />
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: '#111827' }}>
              {phase === 'extracting' ? 'Reading your CV…' : 'Helper Monkey is analysing your career…'}
            </p>
            <p className="text-[12px]" style={{ color: '#6B7280' }}>{statusMsg}</p>
          </div>
        </div>

        {/* Debug: API key status */}
        {debugInfo && (
          <div
            className="rounded-lg px-3 py-2 text-[11px] font-mono"
            style={{
              background: debugInfo.ai_demo ? '#FEF2F2' : '#F0FDF4',
              color: debugInfo.ai_demo ? '#991B1B' : '#166534',
              border: `1px solid ${debugInfo.ai_demo ? '#FECACA' : '#BBF7D0'}`,
            }}
          >
            {debugInfo.ai_demo
              ? `⚠ ANTHROPIC_API_KEY not detected on server — using demo fixture`
              : `✓ Helper Monkey is awake (${debugInfo.anthropic_key})`}
          </div>
        )}

        {/* Discoveries feed */}
        {discoveries.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
              Found so far
            </p>
            <div
              ref={listRef}
              className="space-y-1.5 max-h-64 overflow-y-auto pr-1"
              style={{ scrollBehavior: 'smooth' }}
            >
              {discoveries.map((d) => {
                const Icon = CATEGORY_ICON[d.category] ?? User
                const color = CATEGORY_COLOR[d.category] ?? '#6B7280'
                return (
                  <div
                    key={d.id}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: '#F9FAFB' }}
                  >
                    <Icon size={13} className="shrink-0 mt-0.5" style={{ color }} />
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide mr-2"
                        style={{ color }}
                      >
                        {d.category}
                      </span>
                      <span className="text-[13px]" style={{ color: '#374151' }}>
                        {d.value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Progress pulse */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
          <div
            className="h-full rounded-full animate-pulse"
            style={{ background: '#2557A7', width: phase === 'extracting' ? '25%' : `${Math.min(25 + discoveries.length * 8, 90)}%`, transition: 'width 0.5s ease' }}
          />
        </div>

        {fileName && (
          <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
            <span className="font-mono">{fileName}</span>
          </p>
        )}
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#DC2626' }}>
                Parsing failed
              </p>
              <p className="text-[12px] mt-1 font-mono break-words" style={{ color: '#991B1B' }}>
                {errorMsg}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setPhase('idle'); setDiscoveries([]) }}
          className="text-[13px] font-medium px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: '#E5E7EB', color: '#374151' }}
        >
          Try again
        </button>
      </div>
    )
  }

  // ── Idle state ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['Upload file', 'Paste text'].map((label, i) => {
          const active = i === 1 ? pasteMode : !pasteMode
          return (
            <button
              key={label}
              onClick={() => setPasteMode(i === 1)}
              className={cn(
                'px-4 py-2 rounded-lg text-[14px] font-medium transition-colors',
                active
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {!pasteMode ? (
        <div
          {...getRootProps()}
          className={cn(
            'bg-white border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]',
          )}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
            <Upload size={22} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {isDragActive ? 'Drop your CV here' : 'Drag and drop your CV'}
            </p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
              or <span className="text-[var(--color-primary)] font-medium">browse to upload</span>
            </p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
              PDF, DOCX, or TXT · up to 5MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <FileText size={15} />
            Paste your CV or LinkedIn profile text below
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your full CV or LinkedIn profile here…"
            rows={14}
            className="w-full px-4 py-3 text-[14px] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors bg-white resize-none leading-relaxed"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Build my Candidate Graph
          </button>
        </div>
      )}
    </div>
  )
}
