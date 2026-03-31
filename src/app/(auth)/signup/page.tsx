import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/onboarding/signup-form'

export const metadata: Metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Start for free
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Create your account — no credit card required
        </p>
      </div>

      <div className="bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[var(--radius-lg)] p-4">
        <p className="text-[13px] text-[var(--color-primary)] font-medium">
          Free plan includes
        </p>
        <ul className="mt-1 text-[13px] text-[var(--color-text-secondary)] space-y-0.5">
          <li>→ 3 story assets from your CV</li>
          <li>→ 1 Interview Pack for 1 job</li>
          <li>→ 1 mock interview session</li>
        </ul>
      </div>

      <SignupForm />

      <p className="text-center text-[14px] text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[var(--color-primary)] font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-[12px] text-[var(--color-text-muted)]">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline hover:text-[var(--color-primary)]">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-[var(--color-primary)]">
          Privacy Policy
        </Link>
        . We process your data in the UK under GDPR.
      </p>
    </div>
  )
}
