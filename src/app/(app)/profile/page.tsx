import type { Metadata } from 'next'
import { CVUpload } from '@/components/onboarding/cv-upload'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

export const metadata: Metadata = { title: 'My Profile' }

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Profile' }]} />
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          My Profile
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Upload your CV to build your Candidate Graph and story bank.
        </p>
      </div>

      <CVUpload />
    </div>
  )
}
