'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCheck } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { PageLoading } from '@/components/ui/loading-spinner'
import { GraphNodeCard, type GraphNode, type NodeType } from '@/components/candidate-graph/graph-node-card'
import { NodeEditorModal } from '@/components/candidate-graph/node-editor-modal'

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

type FilterKey = 'all' | NodeType

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'role', label: 'Roles' },
  { key: 'achievement', label: 'Achievements' },
  { key: 'proof_point', label: 'Proof Points' },
  { key: 'failure', label: 'Failures' },
  { key: 'lesson', label: 'Lessons' },
]

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[22px] font-bold text-[var(--color-text-primary)] tabular-nums">
        {value}
      </span>
      <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline toast
// ---------------------------------------------------------------------------

interface ToastState {
  type: 'success' | 'error'
  message: string
}

function InlineToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const isSuccess = toast.type === 'success'
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-[14px] font-medium"
      style={{
        background: isSuccess ? '#D1FAE5' : '#FEE2E2',
        borderColor: isSuccess ? '#6EE7B7' : '#FCA5A5',
        color: isSuccess ? '#065F46' : '#991B1B',
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 text-inherit opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidateGraphPage() {
  const router = useRouter()

  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterKey>('all')
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null)
  const [miningStories, setMiningStories] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Fetch graph on mount — prefer localStorage (real CV data) over the API
  // demo fixture, fall back to API for authenticated Supabase sessions
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Check localStorage first (populated by cv-upload after Claude parse)
        try {
          const stored = localStorage.getItem('im:graph')
          if (stored) {
            const { nodes: localNodes } = JSON.parse(stored)
            if (Array.isArray(localNodes) && localNodes.length > 0) {
              if (!cancelled) {
                setNodes(localNodes)
                setLoading(false)
              }
              return
            }
          }
        } catch { /* ignore parse errors */ }

        // Fall back to API (real Supabase session or empty state)
        const res = await fetch('/api/profile/graph')
        if (!res.ok) throw new Error(`Failed to load graph (${res.status})`)
        const data = await res.json()
        if (!cancelled) setNodes(data.nodes ?? data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Verify a single node
  const handleVerify = useCallback(async (id: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, user_verified: true } : n)),
    )
    try {
      const res = await fetch(`/api/profile/graph/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_verified: true }),
      })
      if (!res.ok) throw new Error('Verify failed')
      setToast({ type: 'success', message: 'Node verified.' })
    } catch {
      // Rollback
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, user_verified: false } : n)),
      )
      setToast({ type: 'error', message: 'Could not verify node — please try again.' })
    }
  }, [])

  // Verify all nodes
  const handleVerifyAll = useCallback(async () => {
    const prev = nodes
    setNodes((n) => n.map((node) => ({ ...node, user_verified: true })))
    try {
      const unverified = prev.filter((n) => !n.user_verified)
      await Promise.all(
        unverified.map((n) =>
          fetch(`/api/profile/graph/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_verified: true }),
          }),
        ),
      )
      setToast({ type: 'success', message: `All ${unverified.length} nodes marked as verified.` })
    } catch {
      setNodes(prev)
      setToast({ type: 'error', message: 'Verify all failed — please try again.' })
    }
  }, [nodes])

  // Delete a node
  const handleDelete = useCallback(async (id: string) => {
    const backup = nodes
    setNodes((prev) => prev.filter((n) => n.id !== id))
    try {
      const res = await fetch(`/api/profile/graph/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setToast({ type: 'success', message: 'Node deleted.' })
    } catch {
      setNodes(backup)
      setToast({ type: 'error', message: 'Could not delete node — please try again.' })
    }
  }, [nodes])

  // Save edited node
  const handleSave = useCallback(async (updated: Partial<GraphNode> & { id: string }) => {
    setEditingNode(null)
    const backup = nodes
    setNodes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
    )
    try {
      const res = await fetch(`/api/profile/graph/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error('Save failed')
      setToast({ type: 'success', message: 'Node saved.' })
    } catch {
      setNodes(backup)
      setToast({ type: 'error', message: 'Could not save node — please try again.' })
    }
  }, [nodes])

  // Mine stories
  const handleMineStories = useCallback(async () => {
    setMiningStories(true)
    try {
      const res = await fetch('/api/ai/stories', { method: 'POST' })
      if (!res.ok) throw new Error('Mining failed')
      router.push('/stories')
    } catch {
      setToast({ type: 'error', message: 'Could not mine stories — please try again.' })
      setMiningStories(false)
    }
  }, [router])

  // Derived stats
  const totalNodes = nodes.length
  const verifiedCount = nodes.filter((n) => n.user_verified).length
  const rolesCount = nodes.filter((n) => n.type === 'role').length
  const achievementsCount = nodes.filter((n) => n.type === 'achievement').length

  // Filtered nodes
  const visibleNodes =
    filter === 'all' ? nodes : nodes.filter((n) => n.type === filter)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Breadcrumbs
            crumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'My Profile', href: '/profile' },
              { label: 'Candidate Graph' },
            ]}
          />
          <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
            Candidate Graph
          </h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] max-w-xl">
            Review and correct what we extracted — everything here powers your stories and answers.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleMineStories}
          disabled={miningStories || loading || nodes.length === 0}
          className="shrink-0 flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[var(--transition-fast)]"
        >
          {miningStories ? 'Mining…' : 'Mine Stories'}
          {!miningStories && <ArrowRight size={14} />}
        </button>
      </div>

      {/* Inline toast */}
      {toast && (
        <InlineToast toast={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Loading */}
      {loading && <PageLoading label="Loading your Candidate Graph…" />}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-[var(--radius-md)] border border-[#FCA5A5] bg-[#FEE2E2] px-4 py-3 text-[14px] text-[#991B1B]">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total nodes" value={totalNodes} />
            <StatCard label="Verified" value={verifiedCount} />
            <StatCard label="Roles" value={rolesCount} />
            <StatCard label="Achievements" value={achievementsCount} />
          </div>

          {/* Filter + Verify All */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={[
                    'px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors duration-[var(--transition-fast)]',
                    filter === tab.key
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Verify All */}
            {nodes.some((n) => !n.user_verified) && (
              <button
                onClick={handleVerifyAll}
                className="ml-auto flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-signal-strong)] border border-[var(--color-signal-strong)]/30 hover:bg-[#D1FAE5] px-3 py-1.5 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)]"
              >
                <CheckCheck size={14} />
                Verify All
              </button>
            )}
          </div>

          {/* Empty state */}
          {visibleNodes.length === 0 && (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
              <p className="text-[15px] text-[var(--color-text-muted)]">
                {nodes.length === 0
                  ? 'No nodes yet — upload your CV to build your Candidate Graph.'
                  : 'No nodes match this filter.'}
              </p>
            </div>
          )}

          {/* Grid */}
          {visibleNodes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleNodes.map((node) => (
                <GraphNodeCard
                  key={node.id}
                  node={node}
                  onVerify={handleVerify}
                  onEdit={setEditingNode}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      <NodeEditorModal
        node={editingNode}
        onSave={handleSave}
        onClose={() => setEditingNode(null)}
      />
    </div>
  )
}
