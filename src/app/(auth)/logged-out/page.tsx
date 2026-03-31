import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Goodbye' }

export default function LoggedOutPage() {
  return (
    <div className="text-center space-y-6">
      <div>
        <p className="text-[40px] mb-3">👋</p>
        <h1 className="text-[26px] font-semibold text-[var(--color-text-primary)]">
          Goodbye — come back soon.
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-2">
          Your prep will be here waiting.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Sign back in
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/"
          className="text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
