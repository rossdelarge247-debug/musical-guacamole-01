import { Info, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OrgIntelligence } from '@/lib/ai/engines/org'

function sentimentVariant(s: OrgIntelligence['sentiment']): 'strong' | 'default' | 'warning' {
  if (s === 'positive') return 'strong'
  if (s === 'cautious') return 'warning'
  return 'default'
}

export function OrgIntelCard({ intel }: { intel: OrgIntelligence }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Org Intel
      </p>

      {/* Sentiment */}
      <div className="flex items-start gap-2">
        <Badge variant={sentimentVariant(intel.sentiment)} className="shrink-0 mt-0.5">
          {intel.sentiment}
        </Badge>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          {intel.sentiment_reason}
        </p>
      </div>

      {/* What they care about */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          What they care about
        </p>
        <ul className="space-y-1.5">
          {(intel.what_they_care_about ?? []).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)]">
              <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] shrink-0 mt-[6px]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Culture signals */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          Culture signals
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(intel.culture_signals ?? []).map((sig, i) => (
            <Badge key={i} variant="strategic">{sig}</Badge>
          ))}
        </div>
      </div>

      {/* Red flags */}
      {(intel.red_flags ?? []).length > 0 && (
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1">
            <AlertTriangle size={11} className="text-[var(--color-signal-warning)]" />
            Watch out for
          </p>
          <ul className="space-y-1.5">
            {(intel.red_flags ?? []).map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[#92400E]">
                <span className="w-1 h-1 rounded-full bg-[#F59E0B] shrink-0 mt-[6px]" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
