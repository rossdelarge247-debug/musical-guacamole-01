import type { Metadata } from 'next'
import { PlaySquare } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Replay Studio' }

export default function ReplayPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Replay Studio' }]} />
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          Replay Studio
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Debrief your mock sessions — strongest moments, weak answers, missed signals, and next drills.
        </p>
      </div>

      <EmptyState
        icon={PlaySquare}
        title="No sessions to replay yet"
        description="Complete a mock interview session to see your debrief — strongest moments, missed proof points, and your next recommended drills."
        action={{ label: 'Start a mock session', href: '/mock' }}
      />
    </div>
  )
}
