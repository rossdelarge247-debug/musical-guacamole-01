import type { Metadata } from 'next'
import Link from 'next/link'
import { Mic2, Users, Video, ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

export const metadata: Metadata = { title: 'Mock Interview Studio' }

const MODES = [
  {
    id: 'ai',
    icon: Mic2,
    label: 'AI-Led Mock',
    description: 'Interview Monkey asks questions, adapts to your answers, and coaches your delivery. Full control over pace and difficulty.',
    badge: 'Available now',
    badgeColour: 'var(--color-signal-strong)',
    href: '/mock/ai',
    cta: 'Start AI mock',
    available: true,
  },
  {
    id: 'human',
    icon: Users,
    label: 'Human-Led Mock',
    description: 'A friend, mentor, or coach asks questions naturally. Interview Monkey listens and surfaces prompts on your performance screen.',
    badge: 'R3 — Dual surface',
    badgeColour: 'var(--color-signal-warning)',
    href: '/live/demo-session',
    cta: 'Set up session',
    available: true,
  },
  {
    id: 'live',
    icon: Video,
    label: 'Live Workspace',
    description: 'Teleprompter mode for real interviews. Second screen shows minimal cues while you focus on the video call.',
    badge: 'R3 — Pro',
    badgeColour: 'var(--color-primary)',
    href: '/live/demo-session',
    cta: 'Open live workspace',
    available: true,
  },
]

export default function MockPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mock Interview Studio' }]} />
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          Mock Interview Studio
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Practice under pressure. Choose your mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map((mode) => {
          const Icon = mode.icon
          return (
            <div
              key={mode.id}
              className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card-hover)] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[var(--color-primary)]" />
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                  style={{
                    background: mode.badgeColour + '20',
                    color: mode.badgeColour,
                    border: `1px solid ${mode.badgeColour}40`,
                  }}
                >
                  {mode.badge}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">{mode.label}</p>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{mode.description}</p>
              </div>
              <Link
                href={mode.href}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-xl)] text-[14px] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                {mode.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          )
        })}
      </div>

      {/* Recent sessions placeholder */}
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          RECENT SESSIONS
        </h2>
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-[14px] text-[var(--color-text-muted)]">
            No sessions yet — complete your first mock to see your history here.
          </p>
        </div>
      </div>
    </div>
  )
}
