import { Info } from 'lucide-react'
import type { OrgIntelligence } from '@/lib/ai/engines/org'

interface OverviewTabProps {
  overlapAreas: string[]
  gapAreas: string[]
  gapFillingTips: string[]
  orgIntel: OrgIntelligence | null
}

export function OverviewTab({ overlapAreas, gapAreas, gapFillingTips, orgIntel }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Where you match */}
      {overlapAreas.length > 0 && (
        <div className="bg-[#F0FDF4] border border-[#6EE7B7]/40 rounded-[var(--radius-md)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#065F46] mb-3">
            Where you match
          </p>
          <ul className="space-y-2">
            {overlapAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[#065F46]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-[5px]" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps to address */}
      {gapAreas.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Gaps to address
          </p>
          <div className="space-y-2">
            {gapAreas.map((gap, i) => (
              <div
                key={i}
                className="bg-[#FFFBEB] border border-[#FCD34D]/40 rounded-[var(--radius-md)] p-4"
              >
                <p className="text-[13px] font-semibold text-[#92400E] mb-1">{gap}</p>
                {gapFillingTips[i] && (
                  <p className="text-[13px] text-[#B45309] leading-relaxed">
                    {gapFillingTips[i]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key intel */}
      {orgIntel && orgIntel.key_intel.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Key intel
          </p>
          <div className="space-y-2">
            {(orgIntel.key_intel ?? []).map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3"
              >
                <Info size={14} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
