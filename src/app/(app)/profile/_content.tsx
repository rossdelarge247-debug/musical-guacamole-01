'use client'

import { useEffect, useState } from 'react'
import { Upload, FileText, Clock, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { CVUpload } from '@/components/onboarding/cv-upload'
import { QuotePanel } from '@/components/quote-panel'

interface GraphData {
  profile: {
    headline: string
    skills: string[]
    parsing_confidence: number
  }
  savedAt: number
  fileName?: string
  nodes: Array<{ type: string }>
}

interface HistoryEntry {
  fileName: string
  uploadedAt: number
  headline: string
  nodeCount: number
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ConfirmDeleteBanner({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border px-4 py-3 space-y-2" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
      <p className="text-[13px] font-semibold" style={{ color: '#991B1B' }}>
        Delete your CV data?
      </p>
      <p className="text-[12px]" style={{ color: '#B91C1C' }}>
        This will clear your Candidate Graph, skills, and all parsed career moments from this device. You can re-upload at any time.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-[var(--radius-md)] text-white transition-colors"
          style={{ background: '#DC2626' }}
        >
          Yes, delete everything
        </button>
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface ProfileContentProps {
  firstName: string | null
}

export function ProfileContent({ firstName }: ProfileContentProps) {
  const [graphData, setGraphData] = useState<GraphData | null | false>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [quotesHidden, setQuotesHidden] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('im:graph')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.profile) {
          setGraphData(parsed as GraphData)
        } else {
          setGraphData(false)
        }
      } else {
        setGraphData(false)
      }

      const hist = localStorage.getItem('im:cv-history')
      if (hist) setHistory(JSON.parse(hist))

      setQuotesHidden(localStorage.getItem('im:quote-hidden') === 'true')
    } catch {
      setGraphData(false)
    }
  }, [])

  function handleDelete() {
    localStorage.removeItem('im:graph')
    localStorage.removeItem('im:cv-history')
    setGraphData(false)
    setHistory([])
    setConfirming(false)
    setShowUpload(true)
  }

  function handleRestoreQuotes() {
    localStorage.removeItem('im:quote-hidden')
    setQuotesHidden(false)
  }

  // Wait for localStorage check
  if (graphData === null) return null

  // No CV yet — just show upload
  if (graphData === false || showUpload) {
    return (
      <div className="space-y-6">
        <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          {showUpload ? 'Upload a new CV to rebuild your Candidate Graph.' : 'Upload your CV to build your Candidate Graph and story bank.'}
        </p>
        <CVUpload />
      </div>
    )
  }

  const { profile, savedAt, fileName, nodes } = graphData
  const roleCount = nodes?.filter((n) => n.type === 'role').length ?? 0
  const nodeCount = nodes?.length ?? 0
  const confidence = Math.round((profile.parsing_confidence ?? 0.8) * 100)
  const displayName = firstName ?? 'Your profile'

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div
        className="rounded-[var(--radius-lg)] border p-5 space-y-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <h2 className="text-[18px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {displayName}
            </h2>
            {profile.headline && (
              <p className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                {profile.headline}
              </p>
            )}
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {confidence}% parse confidence
          </span>
        </div>

        <div className="flex gap-4 flex-wrap text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          <span>{nodeCount} graph nodes</span>
          <span>·</span>
          <span>{roleCount} roles</span>
          <span>·</span>
          <span>{profile.skills?.length ?? 0} skills</span>
        </div>
      </div>

      {/* CV file card */}
      <div
        className="rounded-[var(--radius-lg)] border p-5 space-y-3"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Current CV
        </p>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {fileName ?? 'CV'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              <Clock size={11} />
              <span className="text-[12px]">Imported {formatDate(savedAt)}</span>
            </div>
          </div>
        </div>

        {confirming ? (
          <ConfirmDeleteBanner onConfirm={handleDelete} onCancel={() => setConfirming(false)} />
        ) : (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <Upload size={13} />
              Re-upload CV
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors hover:border-red-300 hover:text-red-600"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <Trash2 size={13} />
              Delete &amp; start again
            </button>
          </div>
        )}
      </div>

      {/* Upload history */}
      {history.length > 0 && (
        <div
          className="rounded-[var(--radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface)]"
            style={{ background: 'var(--color-background)' }}
          >
            {historyOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span className="text-[12px] font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--color-text-muted)' }}>
              Previous uploads
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              {history.length}
            </span>
          </button>
          {historyOpen && (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {history.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ background: 'var(--color-surface)' }}>
                  <FileText size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.fileName}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {entry.nodeCount} nodes · {entry.headline || 'No headline'} · {formatDate(entry.uploadedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quote panel preference */}
      {quotesHidden && (
        <div className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            The Wisdom Corner (Helper Monkey&apos;s quotes) is hidden.
          </p>
          <button
            onClick={handleRestoreQuotes}
            className="text-[12px] font-medium underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Restore it
          </button>
        </div>
      )}

      {/* Quote panel at bottom of profile page */}
      <QuotePanel position="bottom" />
    </div>
  )
}
