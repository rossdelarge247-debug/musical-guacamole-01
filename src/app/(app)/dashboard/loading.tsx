import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Banner */}
      <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />

      {/* Quick actions */}
      <div>
        <Skeleton className="h-3.5 w-28 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-3"
            >
              <Skeleton className="w-9 h-9 rounded-[var(--radius-md)]" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>

      {/* Readiness heat map */}
      <div>
        <Skeleton className="h-3.5 w-40 mb-3" />
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
