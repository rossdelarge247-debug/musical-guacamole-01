interface MatchScoreCardProps {
  score: number
  rationale: string
}

function scoreColor(score: number) {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

export function MatchScoreCard({ score, rationale }: MatchScoreCardProps) {
  const r = 32
  const circ = 2 * Math.PI * r
  const fill = circ * (score / 100)
  const color = scoreColor(score)

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        Match Score
      </p>
      <div className="flex items-center gap-4">
        {/* Ring gauge */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            {/* Track */}
            <circle
              cx={40} cy={40} r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={8}
            />
            {/* Progress arc */}
            <circle
              cx={40} cy={40} r={r}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${fill} ${circ}`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] font-bold leading-none" style={{ color }}>
              {score}%
            </span>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-[13px] italic text-[var(--color-text-muted)] leading-relaxed">
          {rationale}
        </p>
      </div>
    </div>
  )
}
