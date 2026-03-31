'use client'

import type { ComponentProps } from 'react'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type NodeType =
  | 'role'
  | 'achievement'
  | 'failure'
  | 'proof_point'
  | 'stakeholder'
  | 'decision'
  | 'lesson'
  | 'signal'

export interface GraphNode {
  id: string
  type: NodeType
  title: string
  description: string
  organisation: string
  date_from: string
  date_to: string
  metrics: string[]
  tags: string[]
  confidence: number // 0–1
  user_verified: boolean
}

interface GraphNodeCardProps {
  node: GraphNode
  onVerify: (id: string) => void
  onEdit: (node: GraphNode) => void
  onDelete: (id: string) => void
}

const NODE_TYPE_BADGE: Record<NodeType, ComponentProps<typeof Badge>['variant']> = {
  role: 'primary',
  achievement: 'strong',
  failure: 'warning',
  proof_point: 'strategic',
  stakeholder: 'default',
  decision: 'default',
  lesson: 'default',
  signal: 'default',
}

const NODE_TYPE_LABEL: Record<NodeType, string> = {
  role: 'Role',
  achievement: 'Achievement',
  failure: 'Failure',
  proof_point: 'Proof Point',
  stakeholder: 'Stakeholder',
  decision: 'Decision',
  lesson: 'Lesson',
  signal: 'Signal',
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const colour =
    value >= 0.8
      ? 'var(--color-signal-strong)'
      : value >= 0.6
        ? 'var(--color-signal-warning)'
        : 'var(--color-signal-critical)'

  return (
    <span
      className="text-[12px] font-semibold tabular-nums px-1.5 py-0.5 rounded-[var(--radius-sm)]"
      style={{ color: colour, background: `color-mix(in srgb, ${colour} 12%, transparent)` }}
    >
      {pct}%
    </span>
  )
}

function formatDateRange(from: string, to: string): string {
  const parts: string[] = []
  if (from) parts.push(from)
  if (to) parts.push(to)
  return parts.join(' – ')
}

export function GraphNodeCard({ node, onVerify, onEdit, onDelete }: GraphNodeCardProps) {
  const badgeVariant = NODE_TYPE_BADGE[node.type] ?? 'default'
  const typeLabel = NODE_TYPE_LABEL[node.type] ?? node.type
  const dateRange = formatDateRange(node.date_from, node.date_to)

  return (
    <article
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3',
        'transition-shadow duration-[var(--transition-fast)] hover:shadow-sm',
      )}
    >
      {/* Top row: badge + title + confidence + verified */}
      <div className="flex items-start gap-2">
        <Badge variant={badgeVariant}>{typeLabel}</Badge>

        <p className="flex-1 text-[15px] font-semibold text-[var(--color-text-primary)] leading-snug min-w-0 break-words">
          {node.title}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          <ConfidencePill value={node.confidence} />
          {node.user_verified && (
            <CheckCircle2
              size={16}
              className="text-[var(--color-signal-strong)]"
              aria-label="Verified"
            />
          )}
        </div>
      </div>

      {/* Organisation + date range */}
      {(node.organisation || dateRange) && (
        <p className="text-[13px] text-[var(--color-text-muted)] leading-none -mt-1">
          {[node.organisation, dateRange].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Description */}
      {node.description && (
        <p
          className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {node.description}
        </p>
      )}

      {/* Metrics */}
      {node.metrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.metrics.map((m) => (
            <span
              key={m}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-background)] border border-[var(--color-border)]"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)] mt-auto">
        {!node.user_verified && (
          <button
            onClick={() => onVerify(node.id)}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-signal-strong)] hover:opacity-80 transition-opacity duration-[var(--transition-fast)] px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--color-signal-strong)]/30 hover:bg-[#D1FAE5]"
          >
            Verify ✓
          </button>
        )}

        <button
          onClick={() => onEdit(node)}
          className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--transition-fast)] px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-background)]"
        >
          <Pencil size={12} />
          Edit
        </button>

        <button
          onClick={() => onDelete(node.id)}
          aria-label="Delete node"
          className="ml-auto flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-[var(--color-signal-critical)] border border-[var(--color-signal-critical)]/30 hover:bg-[#FEE2E2] transition-colors duration-[var(--transition-fast)]"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </article>
  )
}
