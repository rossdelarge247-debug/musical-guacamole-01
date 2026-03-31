import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: number
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 20, className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 size={size} className="animate-spin text-[var(--color-primary)]" />
      {label && <span className="text-[14px] text-[var(--color-text-secondary)]">{label}</span>}
    </div>
  )
}

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size={24} label={label} />
    </div>
  )
}
