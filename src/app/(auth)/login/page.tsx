import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/onboarding/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Sign in to your Interview Monkey account
        </p>
      </div>

      <LoginForm redirectTo={searchParams.redirect ?? '/dashboard'} />

      <p className="text-center text-[14px] text-[var(--color-text-secondary)]">
        {"Don't have an account? "}
        <Link
          href="/signup"
          className="text-[var(--color-primary)] font-medium hover:underline"
        >
          Start for free
        </Link>
      </p>
    </div>
  )
}
