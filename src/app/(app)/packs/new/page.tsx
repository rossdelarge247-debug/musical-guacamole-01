'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader2,
  Link2,
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { cn } from '@/lib/utils'

// ─── Generation states ────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  { label: 'Reading the job description…', icon: '📖' },
  { label: 'Investigating the organisation…', icon: '🔍' },
  { label: 'Mapping to your experience…', icon: '🗺️' },
  { label: 'Identifying story opportunities…', icon: '✨' },
  { label: 'Building your pack…', icon: '📦' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function GeneratingOverlay({
  activeIndex,
  doneIndexes,
}: {
  activeIndex: number
  doneIndexes: number[]
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)] flex items-center justify-center">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg p-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            Helper Monkey at work
          </p>
          <h2 className="text-[22px] font-semibold text-[var(--color-text-primary)]">
            Analysing your opportunity
          </h2>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            This usually takes about 30–45 seconds.
          </p>
        </div>

        <ol className="space-y-4">
          {GENERATION_STEPS.map((step, i) => {
            const isDone = doneIndexes.includes(i)
            const isActive = activeIndex === i && !isDone

            return (
              <li key={i} className="flex items-center gap-3">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center">
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-[var(--color-signal-strong)]" />
                  ) : isActive ? (
                    <Loader2 size={17} className="animate-spin text-[var(--color-primary)]" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-[var(--color-border-strong)] block" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-[14px] transition-colors duration-200',
                    isDone
                      ? 'text-[var(--color-signal-strong)]'
                      : isActive
                        ? 'text-[var(--color-text-primary)] font-medium'
                        : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {step.label}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-8 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
            style={{
              width: `${Math.round((doneIndexes.length / GENERATION_STEPS.length) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── URL detection ────────────────────────────────────────────────────────────

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\/\S{4,}/i.test(s.trim())
}

// ─── Main page ────────────────────────────────────────────────────────────────

type InputMode = 'idle' | 'url' | 'file' | 'text'
type FetchState = 'idle' | 'fetching' | 'done' | 'error'

export default function NewPackPage() {
  const router = useRouter()

  const [input, setInput] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('idle')
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [fetchedTitle, setFetchedTitle] = useState<string>('')
  const [resolvedJd, setResolvedJd] = useState('')  // the final text to send to API
  const [fileName, setFileName] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [genActiveIndex, setGenActiveIndex] = useState(0)
  const [genDoneIndexes, setGenDoneIndexes] = useState<number[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect URL as user types
  function handleInputChange(value: string) {
    setInput(value)
    setError(null)
    setFetchState('idle')
    setResolvedJd('')

    if (looksLikeUrl(value)) {
      setInputMode('url')
    } else if (value.trim().length > 0) {
      setInputMode('text')
      setResolvedJd(value)
    } else {
      setInputMode('idle')
    }
  }

  // Fetch URL content
  async function handleFetchUrl() {
    const url = input.trim()
    setFetchState('fetching')
    setError(null)
    try {
      const res = await fetch('/api/packs/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFetchState('error')
        setError(data.error ?? 'Could not fetch that URL')
        return
      }
      setFetchState('done')
      setFetchedTitle(data.title ?? '')
      setResolvedJd(data.text ?? '')
    } catch {
      setFetchState('error')
      setError('Network error — check your connection and try again')
    }
  }

  // Handle file drop / select
  const handleFile = useCallback((file: File) => {
    setError(null)
    setFileName(file.name)
    setInputMode('file')
    setInput('')
    setResolvedJd('')

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      setResolvedJd(text.slice(0, 12000))
      setFetchState('done')
    }
    reader.onerror = () => {
      setError('Could not read that file')
      setFetchState('error')
    }
    reader.readAsText(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // Derive company / title from input
  function deriveCompany(): string | null {
    if (fetchedTitle) {
      // Try to extract company from "<Role> at <Company>" pattern
      const atMatch = fetchedTitle.match(/\bat\s+(.+?)(?:\s*[|\-–]|$)/i)
      if (atMatch) return atMatch[1].trim()
    }
    return null
  }

  // The JD text ready to submit
  const jdReady =
    inputMode === 'text'
      ? input.trim().length > 100
      : resolvedJd.length > 100

  async function handleGenerate() {
    const jdText = inputMode === 'text' ? input.trim() : resolvedJd
    if (!jdText || jdText.length < 50) return

    setError(null)
    setGenerating(true)
    setGenActiveIndex(0)
    setGenDoneIndexes([])

    // Advance animation steps at even intervals while API call runs
    const stepMs = 9000
    const timers: ReturnType<typeof setTimeout>[] = []
    GENERATION_STEPS.forEach((_, i) => {
      if (i === 0) return
      timers.push(
        setTimeout(() => {
          setGenDoneIndexes((prev) => [...prev, i - 1])
          setGenActiveIndex(i)
        }, i * stepMs),
      )
    })

    try {
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

      const company = deriveCompany()
      const packTitle = fetchedTitle
        ? fetchedTitle.slice(0, 80)
        : company
          ? `Interview prep — ${company}`
          : 'Interview Pack'

      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_raw: jdText,
          title: packTitle,
          company,
          role_level: 'auto',
          interview_type: 'mixed',
          profile: clientProfile,
          nodes: clientNodes,
        }),
      })

      timers.forEach(clearTimeout)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Failed to create pack (${res.status})`)
        setGenerating(false)
        return
      }

      const data = await res.json()
      const pack = data.pack

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

      setGenDoneIndexes(GENERATION_STEPS.map((_, i) => i))
      setTimeout(() => router.push(`/packs/${pack.id}`), 600)
    } catch (err) {
      timers.forEach(clearTimeout)
      setError(err instanceof Error ? err.message : 'Failed to create pack')
      setGenerating(false)
    }
  }

  return (
    <>
      {generating && (
        <GeneratingOverlay activeIndex={genActiveIndex} doneIndexes={genDoneIndexes} />
      )}

      <div className="space-y-6 max-w-2xl">
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
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-1">
            Paste a link, upload a file, or drop in the job description text — Helper Monkey will do the rest.
          </p>
        </div>

        {/* Main input card */}
        <div
          className={cn(
            'bg-[var(--color-surface)] border rounded-[var(--radius-lg)] transition-colors duration-200',
            isDragging
              ? 'border-[var(--color-primary)] shadow-md'
              : 'border-[var(--color-border)]',
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* File mode header */}
          {inputMode === 'file' && fileName && (
            <div className="flex items-center gap-3 px-5 pt-5 pb-0">
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary-light)' }}
              >
                <FileText size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {fileName}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {fetchState === 'done' ? `${resolvedJd.length.toLocaleString()} characters read` : 'Reading…'}
                </p>
              </div>
              <button
                onClick={() => {
                  setInputMode('idle')
                  setFileName('')
                  setResolvedJd('')
                  setFetchState('idle')
                  setInput('')
                }}
                className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-signal-critical)] transition-colors"
              >
                Remove
              </button>
            </div>
          )}

          {/* Text/URL textarea — hidden in file mode */}
          {inputMode !== 'file' && (
            <div className="p-5">
              <textarea
                rows={8}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  isDragging
                    ? 'Drop your file here…'
                    : 'Paste a job posting URL, drop a file, or paste the description text…'
                }
                className="w-full text-[14px] text-[var(--color-text-primary)] bg-transparent placeholder:text-[var(--color-text-muted)] focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* URL fetch strip */}
          {inputMode === 'url' && fetchState !== 'done' && (
            <div className="px-5 pb-4 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
                <Link2 size={14} className="shrink-0 text-[var(--color-primary)]" />
                <span className="truncate">{input.slice(0, 60)}{input.length > 60 ? '…' : ''}</span>
              </div>
              <button
                onClick={handleFetchUrl}
                disabled={fetchState === 'fetching'}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-[var(--radius-md)] transition-colors',
                  fetchState === 'fetching'
                    ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
                )}
              >
                {fetchState === 'fetching' ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <Link2 size={13} />
                    Fetch this posting
                  </>
                )}
              </button>
            </div>
          )}

          {/* URL fetched confirmation */}
          {inputMode === 'url' && fetchState === 'done' && (
            <div className="px-5 pb-4 flex items-center gap-2 text-[13px]">
              <CheckCircle2 size={14} className="text-[var(--color-signal-strong)] shrink-0" />
              <span style={{ color: 'var(--color-signal-strong)' }}>
                {fetchedTitle ? `"${fetchedTitle.slice(0, 60)}"` : 'Posting read'} — {resolvedJd.length.toLocaleString()} chars
              </span>
              <button
                onClick={() => { setInput(''); setInputMode('idle'); setFetchState('idle'); setResolvedJd('') }}
                className="ml-auto text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-signal-critical)] transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Divider + file upload area */}
          <div
            className="border-t px-5 py-3 flex items-center gap-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              className="sr-only"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Upload size={13} />
              Upload file
            </button>
            <span className="text-[11px] text-[var(--color-text-muted)]">PDF, Word, or TXT</span>
            <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">
              or drag &amp; drop above
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-[13px] text-[var(--color-signal-critical)] rounded-[var(--radius-md)] border px-4 py-3" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {jdReady
              ? inputMode === 'file'
                ? `${resolvedJd.length.toLocaleString()} characters ready`
                : inputMode === 'url' && fetchState === 'done'
                  ? `Fetched from URL — ready to analyse`
                  : `${input.trim().length} chars`
              : 'Paste a link or text above to get started'}
          </p>
          <button
            onClick={handleGenerate}
            disabled={!jdReady}
            className={cn(
              'flex items-center gap-2 font-semibold text-[14px] px-6 py-2.5 rounded-[var(--radius-xl)] transition-colors duration-[var(--transition-fast)]',
              jdReady
                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer'
                : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed',
            )}
          >
            <Sparkles size={15} />
            Analyse with Helper Monkey
          </button>
        </div>
      </div>
    </>
  )
}
