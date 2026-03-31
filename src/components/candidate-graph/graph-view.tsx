'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react'
import { GraphNodeCard, type GraphNode, type NodeType } from '@/components/candidate-graph/graph-node-card'
import { NodeEditorModal } from '@/components/candidate-graph/node-editor-modal'
import { EnhancementPanel } from '@/components/candidate-graph/enhancement-panel'

// ---------------------------------------------------------------------------
// Role grouping
// ---------------------------------------------------------------------------

const CHILD_TYPES = new Set<NodeType>(['achievement', 'proof_point', 'failure', 'lesson', 'decision', 'signal', 'stakeholder'])

function groupNodesByRole(nodes: GraphNode[]): {
  groups: Array<{ role: GraphNode; children: GraphNode[] }>
  ungrouped: GraphNode[]
} {
  const roles = nodes
    .filter((n) => n.type === 'role')
    .sort((a, b) => (b.date_from ?? '').localeCompare(a.date_from ?? ''))

  const allChildren = nodes.filter((n) => CHILD_TYPES.has(n.type))
  const assigned = new Set<string>()

  const groups = roles.map((role) => {
    const children = allChildren.filter((n) => {
      if (assigned.has(n.id)) return false
      if (role.organisation && n.organisation &&
        role.organisation.toLowerCase().trim() === n.organisation.toLowerCase().trim()) return true
      if (role.date_from && n.date_from) {
        const roleEnd = role.date_to ?? '9999-12'
        const nodeEnd = n.date_to ?? n.date_from
        return n.date_from <= roleEnd && nodeEnd >= role.date_from
      }
      return false
    })
    children.forEach((n) => assigned.add(n.id))
    return { role, children }
  })

  return { groups, ungrouped: allChildren.filter((n) => !assigned.has(n.id)) }
}

// ---------------------------------------------------------------------------
// Role section
// ---------------------------------------------------------------------------

interface RoleSectionProps {
  role: GraphNode
  children: GraphNode[]
  onVerify: (id: string) => void
  onEdit: (node: GraphNode) => void
  onDelete: (id: string) => void
}

function RoleSection({ role, children, onVerify, onEdit, onDelete }: RoleSectionProps) {
  const [childrenExpanded, setChildrenExpanded] = useState(true)
  const [showEnhancement, setShowEnhancement] = useState(false)

  const dateRange = [role.date_from, role.date_to].filter(Boolean).join(' – ')

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Role header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">{role.title}</h2>
            {(role.organisation || dateRange) && (
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                {[role.organisation, dateRange].filter(Boolean).join(' · ')}
              </p>
            )}
            {role.description && (
              <p className="text-[14px] text-[var(--color-text-primary)] mt-2 leading-relaxed">{role.description}</p>
            )}
            {role.metrics && role.metrics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {role.metrics.map((m, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">{m}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEnhancement((v) => !v)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
              style={{ background: showEnhancement ? 'var(--color-primary-light)' : undefined }}
            >
              <Sparkles size={13} />
              Enhance with Helper Monkey
            </button>
            <button onClick={() => onEdit(role)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors" aria-label="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
            <button onClick={() => onDelete(role.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </button>
          </div>
        </div>

        {showEnhancement && (
          <EnhancementPanel
            role={role}
            children={children}
            onClose={() => setShowEnhancement(false)}
          />
        )}
      </div>

      {/* Children */}
      {children.length > 0 && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3">
          <button
            onClick={() => setChildrenExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-3"
          >
            {childrenExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {children.length} career moment{children.length !== 1 ? 's' : ''}
          </button>
          {childrenExpanded && (
            <div className="ml-6 pl-5 border-l-2 border-[var(--color-primary)]/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children.map((child) => (
                  <GraphNodeCard key={child.id} node={child} onVerify={onVerify} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline toast
// ---------------------------------------------------------------------------

interface ToastState { type: 'success' | 'error'; message: string }

function InlineToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const ok = toast.type === 'success'
  return (
    <div role="status" className="flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-[14px] font-medium"
      style={{ background: ok ? '#D1FAE5' : '#FEE2E2', borderColor: ok ? '#6EE7B7' : '#FCA5A5', color: ok ? '#065F46' : '#991B1B' }}>
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">✕</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GraphView — the main exported component
// ---------------------------------------------------------------------------

interface GraphViewProps {
  /** Pre-loaded nodes (from localStorage). If not provided, loads from localStorage + API. */
  initialNodes?: GraphNode[]
  initialSkills?: string[]
}

export function GraphView({ initialNodes, initialSkills }: GraphViewProps) {
  const router = useRouter()

  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes ?? [])
  const [skills, setSkills] = useState<string[]>(initialSkills ?? [])
  const [loading, setLoading] = useState(!initialNodes)
  const [error, setError] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null)
  const [miningStories, setMiningStories] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Load from localStorage/API if no initial data provided
  useEffect(() => {
    if (initialNodes) return
    let cancelled = false
    ;(async () => {
      try {
        const stored = localStorage.getItem('im:graph')
        if (stored) {
          const { nodes: localNodes, profile } = JSON.parse(stored)
          if (Array.isArray(localNodes) && localNodes.length > 0) {
            if (!cancelled) { setNodes(localNodes); setSkills(profile?.skills ?? []) }
            return
          }
        }
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
  }, [initialNodes])

  const handleVerify = useCallback(async (id: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, user_verified: true } : n)))
    try {
      const res = await fetch(`/api/profile/graph/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_verified: true }) })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Node verified.' })
    } catch {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, user_verified: false } : n)))
      setToast({ type: 'error', message: 'Could not verify — please try again.' })
    }
  }, [])

  const handleVerifyAll = useCallback(async () => {
    const prev = nodes
    setNodes((n) => n.map((node) => ({ ...node, user_verified: true })))
    try {
      const unverified = prev.filter((n) => !n.user_verified)
      await Promise.all(unverified.map((n) => fetch(`/api/profile/graph/${n.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_verified: true }) })))
      setToast({ type: 'success', message: `All ${unverified.length} nodes verified.` })
    } catch {
      setNodes(prev)
      setToast({ type: 'error', message: 'Verify all failed — please try again.' })
    }
  }, [nodes])

  const handleDelete = useCallback(async (id: string) => {
    const backup = nodes
    setNodes((prev) => prev.filter((n) => n.id !== id))
    try {
      const res = await fetch(`/api/profile/graph/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Removed.' })
    } catch {
      setNodes(backup)
      setToast({ type: 'error', message: 'Could not remove — please try again.' })
    }
  }, [nodes])

  const handleSave = useCallback(async (updated: Partial<GraphNode> & { id: string }) => {
    setEditingNode(null)
    const backup = nodes
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)))
    try {
      const res = await fetch(`/api/profile/graph/${updated.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Saved.' })
    } catch {
      setNodes(backup)
      setToast({ type: 'error', message: 'Could not save — please try again.' })
    }
  }, [nodes])

  const handleMineStories = useCallback(async () => {
    setMiningStories(true)
    try {
      const res = await fetch('/api/ai/stories', { method: 'POST' })
      if (!res.ok) throw new Error()
      router.push('/stories')
    } catch {
      setToast({ type: 'error', message: 'Could not mine stories — please try again.' })
      setMiningStories(false)
    }
  }, [router])

  const { groups, ungrouped } = useMemo(() => groupNodesByRole(nodes), [nodes])
  const hasUnverified = nodes.some((n) => !n.user_verified)

  if (loading) {
    return <p className="text-[14px] text-[var(--color-text-muted)] py-8">Loading your Candidate Graph…</p>
  }

  if (error) {
    return <div className="rounded-[var(--radius-md)] border px-4 py-3 text-[14px]" style={{ borderColor: '#FCA5A5', background: '#FEE2E2', color: '#991B1B' }}>{error}</div>
  }

  if (nodes.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed py-16 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[15px]" style={{ color: 'var(--color-text-muted)' }}>No data yet — upload your CV to build your Candidate Graph.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Skills tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="px-3 py-1 rounded-full text-[12px] font-medium border" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 justify-end">
        {hasUnverified && (
          <button onClick={handleVerifyAll} className="flex items-center gap-1.5 text-[13px] font-medium border px-3 py-2 rounded-[var(--radius-md)] transition-colors" style={{ color: 'var(--color-signal-strong)', borderColor: 'color-mix(in srgb, var(--color-signal-strong) 30%, transparent)' }}>
            <CheckCheck size={14} /> Verify All
          </button>
        )}
        <button
          onClick={handleMineStories}
          disabled={miningStories}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
        >
          {miningStories ? 'Mining…' : 'Mine Stories'}
          {!miningStories && <ArrowRight size={14} />}
        </button>
      </div>

      {toast && <InlineToast toast={toast} onDismiss={() => setToast(null)} />}

      {/* Role groups */}
      {groups.map(({ role, children }) => (
        <RoleSection key={role.id} role={role} children={children} onVerify={handleVerify} onEdit={setEditingNode} onDelete={handleDelete} />
      ))}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Other</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ungrouped.map((node) => (
              <GraphNodeCard key={node.id} node={node} onVerify={handleVerify} onEdit={setEditingNode} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      <NodeEditorModal node={editingNode} onSave={handleSave} onClose={() => setEditingNode(null)} />
    </div>
  )
}
