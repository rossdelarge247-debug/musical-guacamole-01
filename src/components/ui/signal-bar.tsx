import { cn } from '@/lib/utils'
import { formatSignalLabel, scoreToColour } from '@/lib/utils'
import type { SignalType } from '@/types'

interface SignalBarProps {
  signal: SignalType
  score: number // 0–5
  showLabel?: boolean
  compact?: boolean
}

export function SignalBar({ signal, score, showLabel = true, compact = false }: SignalBarProps) {
  const pct = Math.round((score / 5) * 100)
  const colour = scoreToColour(score)

  return (
    <div className={cn('space-y-1', compact && 'space-y-0.5')}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={cn('text-[var(--color-text-secondary)]', compact ? 'text-[11px]' : 'text-[12px]')}>
            {formatSignalLabel(signal)}
          </span>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: colour }}>
            {score}/5
          </span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-[var(--color-background)]', compact ? 'h-1.5' : 'h-2')}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  )
}

interface SignalGridProps {
  signals: Partial<Record<SignalType, number>>
  compact?: boolean
}

export function SignalGrid({ signals, compact = false }: SignalGridProps) {
  const entries = Object.entries(signals).filter(([, v]) => v !== undefined && v > 0) as [SignalType, number][]

  if (entries.length === 0) {
    return <p className="text-[13px] text-[var(--color-text-muted)]">No signals analysed yet.</p>
  }

  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
      {entries
        .sort(([, a], [, b]) => b - a)
        .map(([signal, score]) => (
          <SignalBar key={signal} signal={signal} score={score} compact={compact} />
        ))}
    </div>
  )
}
