import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-[var(--color-border)] bg-white flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-[var(--color-primary)] font-bold text-lg tracking-tight">
            Interview Monkey
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[13px] text-[var(--color-text-muted)]">
        <span>© {new Date().getFullYear()} Interview Monkey Ltd</span>
        {' · '}
        <Link href="/privacy" className="hover:text-[var(--color-primary)] transition-colors">
          Privacy
        </Link>
        {' · '}
        <Link href="/terms" className="hover:text-[var(--color-primary)] transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  )
}
