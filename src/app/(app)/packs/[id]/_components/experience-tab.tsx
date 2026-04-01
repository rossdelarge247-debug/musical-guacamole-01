import { AlertTriangle, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ExperienceCardPrompt } from '@/lib/ai/engines/jd'

function RelevancePill({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 70 ? { bg: '#D1FAE5', text: '#065F46' }
    : pct >= 40 ? { bg: '#FEF3C7', text: '#92400E' }
    : { bg: '#FEE2E2', text: '#991B1B' }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: color.bg, color: color.text }}
    >
      {pct}% match
    </span>
  )
}

function nodeTypeVariant(type: string): 'primary' | 'strategic' | 'default' {
  if (type === 'role') return 'primary'
  if (type === 'project') return 'strategic'
  return 'default'
}

function ExperienceCard({ card }: { card: ExperienceCardPrompt }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 flex flex-col gap-3 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all duration-[var(--transition-fast)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug">
          {card.node_title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={nodeTypeVariant(card.node_type)}>{card.node_type}</Badge>
          <RelevancePill score={card.relevance_score} />
        </div>
      </div>

      {/* Emphasise */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
          Emphasise
        </p>
        <ul className="space-y-1">
          {card.focus_points.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)]">
              <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] shrink-0 mt-[6px]" />
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* Story angle */}
      <div className="bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[var(--radius-sm)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-1">
          Your story angle
        </p>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          {card.story_prompt}
        </p>
      </div>

      {/* They will probe */}
      {card.zoom_in_areas.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1">
            <Eye size={11} />
            They will probe
          </p>
          <div className="flex flex-wrap gap-1.5">
            {card.zoom_in_areas.map((z, i) => (
              <Badge key={i} variant="default">{z}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Defend areas */}
      {card.defend_areas.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#FCD34D]/40 rounded-[var(--radius-sm)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#92400E] mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} />
            Be ready to justify
          </p>
          <ul className="space-y-1">
            {card.defend_areas.map((d, i) => (
              <li key={i} className="text-[12px] text-[#92400E] leading-relaxed">{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ExperienceTab({ prompts }: { prompts: ExperienceCardPrompt[] }) {
  if (prompts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[14px] text-[var(--color-text-muted)] italic">
          Build your candidate profile to unlock experience coaching.
        </p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {prompts.map((card) => (
        <ExperienceCard key={card.node_id} card={card} />
      ))}
    </div>
  )
}
