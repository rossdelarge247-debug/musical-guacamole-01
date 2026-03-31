'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GraphNode } from './graph-node-card'

interface NodeEditorModalProps {
  node: GraphNode | null
  onSave: (updated: Partial<GraphNode> & { id: string }) => void
  onClose: () => void
}

interface FormState {
  title: string
  description: string
  organisation: string
  date_from: string
  date_to: string
  metrics: string // one per line
  tags: string    // comma-separated
}

function nodeToForm(node: GraphNode): FormState {
  return {
    title: node.title,
    description: node.description,
    organisation: node.organisation,
    date_from: node.date_from,
    date_to: node.date_to,
    metrics: node.metrics.join('\n'),
    tags: node.tags.join(', '),
  }
}

const inputClass =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition-colors duration-[var(--transition-fast)]'

const labelClass = 'block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1'

export function NodeEditorModal({ node, onSave, onClose }: NodeEditorModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    node ? nodeToForm(node) : { title: '', description: '', organisation: '', date_from: '', date_to: '', metrics: '', tags: '' },
  )

  // Reset form whenever the node changes
  useEffect(() => {
    if (node) setForm(nodeToForm(node))
  }, [node])

  if (!node) return null

  function set(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev: FormState) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSave() {
    if (!node) return
    onSave({
      id: node.id,
      title: form.title.trim(),
      description: form.description.trim(),
      organisation: form.organisation.trim(),
      date_from: form.date_from.trim(),
      date_to: form.date_to.trim(),
      metrics: form.metrics
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  const lowConfidence = node.confidence < 0.7

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">Edit node</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors duration-[var(--transition-fast)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Low-confidence warning */}
          {lowConfidence && (
            <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[#FCD34D]/50 bg-[#FEF3C7] px-3.5 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#92400E]" />
              <p className="text-[13px] font-medium text-[#92400E]">
                Low confidence — please review this node carefully before saving.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              className={inputClass}
              placeholder="e.g. Led EMEA pricing overhaul"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={set('description')}
              className={cn(inputClass, 'resize-y')}
              placeholder="Brief context about this node…"
            />
          </div>

          {/* Organisation */}
          <div>
            <label className={labelClass}>Organisation</label>
            <input
              type="text"
              value={form.organisation}
              onChange={set('organisation')}
              className={inputClass}
              placeholder="e.g. Acme Corp"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date from</label>
              <input
                type="text"
                value={form.date_from}
                onChange={set('date_from')}
                className={inputClass}
                placeholder="YYYY-MM"
              />
            </div>
            <div>
              <label className={labelClass}>Date to</label>
              <input
                type="text"
                value={form.date_to}
                onChange={set('date_to')}
                className={inputClass}
                placeholder="YYYY-MM"
              />
            </div>
          </div>

          {/* Metrics */}
          <div>
            <label className={labelClass}>Metrics</label>
            <textarea
              rows={3}
              value={form.metrics}
              onChange={set('metrics')}
              className={cn(inputClass, 'resize-y')}
              placeholder="Reduced churn by 18%&#10;$2.4M ARR impact"
            />
            <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
              One metric per line
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={set('tags')}
              className={inputClass}
              placeholder="leadership, strategy, growth"
            />
            <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
              Comma-separated
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors duration-[var(--transition-fast)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[14px] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors duration-[var(--transition-fast)]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
