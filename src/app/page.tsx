import Link from 'next/link'
import {
  FlaskConical,
  Network,
  ShieldAlert,
  MonitorPlay,
  ArrowRight,
  Check,
  Mic2,
} from 'lucide-react'

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FlaskConical,
    colour: '#7C3AED',
    bg: '#EDE9FE',
    label: 'Answer Lab',
    description:
      'Build polished answers to every likely question. Eight AI transform modes — make it sharper, shorter, more executive, less corporate.',
  },
  {
    icon: Network,
    colour: '#0891B2',
    bg: '#CFFAFE',
    label: 'Candidate Graph',
    description:
      'Upload your CV and we mine every role, achievement, and proof point into a structured graph you can draw on in any interview.',
  },
  {
    icon: ShieldAlert,
    colour: '#DC2626',
    bg: '#FEE2E2',
    label: 'Pressure Point Studio',
    description:
      'Know your weak spots before the interviewer finds them. Defence lines, drills, and what to avoid — for every gap in your story.',
  },
  {
    icon: MonitorPlay,
    colour: '#2557A7',
    bg: '#DBEAFE',
    label: 'Live Workspace',
    description:
      'Teleprompter mode for real interviews. A minimal second screen shows cues — question type, best story, answer shape — while you focus on the call.',
  },
]

const PROOF_POINTS = [
  'Answer any behavioural question with confidence',
  'Know which story to use before you open your mouth',
  'Spot and fix weak spots in your profile before the interview',
  'Real-time prompts during live calls — without anyone knowing',
  'Built for UK senior roles: director, VP, and executive level',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F3F4F6', fontFamily: 'var(--font-sans)' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 border-b"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#E5E7EB' }}
      >
        <span className="font-bold text-[17px] tracking-tight" style={{ color: '#2557A7' }}>
          Interview Monkey
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[14px] font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#374151' }}
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="text-[14px] font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: '#2557A7', borderRadius: '8px' }}
          >
            Try demo
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-14 overflow-hidden"
        style={{ background: '#0F172A' }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider mb-6"
            style={{ background: 'rgba(37,87,167,0.25)', color: '#93C5FD', border: '1px solid rgba(37,87,167,0.4)' }}
          >
            <Mic2 size={12} />
            AI Interview Performance System
          </div>

          <h1
            className="text-[56px] sm:text-[72px] font-bold leading-[1.05] tracking-tight mb-6"
            style={{ color: '#F9FAFB' }}
          >
            Prep smarter.{' '}
            <span style={{ color: '#2557A7' }}>Answer better.</span>
            <br />
            Sound sharper.
          </h1>

          <p
            className="text-[20px] leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: '#94A3B8' }}
          >
            Interview Monkey turns your work history into polished interview answers —
            and puts real-time prompts on a second screen while you&apos;re live in the room.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[16px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: '#2557A7', borderRadius: '12px' }}
            >
              Try the demo
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[16px] font-semibold transition-all hover:bg-white/10"
              style={{ color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }}
            >
              Create free account
            </Link>
          </div>

          {/* Mini social proof */}
          <p className="mt-8 text-[13px]" style={{ color: '#475569' }}>
            No credit card required · Free tier available · Built for UK senior roles
          </p>
        </div>

        {/* Gradient fade to background */}
        <div
          className="h-16"
          style={{ background: 'linear-gradient(to bottom, #0F172A, #F3F4F6)' }}
        />
      </section>

      {/* ── Proof points ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROOF_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#DBEAFE' }}
              >
                <Check size={11} style={{ color: '#2557A7' }} strokeWidth={3} />
              </span>
              <span className="text-[15px]" style={{ color: '#374151' }}>{point}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#2557A7' }}
          >
            Everything in one place
          </p>
          <h2
            className="text-[36px] font-bold tracking-tight"
            style={{ color: '#111827' }}
          >
            Four tools. One system.
          </h2>
          <p className="text-[16px] mt-3 max-w-xl mx-auto" style={{ color: '#6B7280' }}>
            From first prep session to the moment you&apos;re live on the call —
            Interview Monkey has every stage covered.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.label}
                className="rounded-2xl p-6 border"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#E5E7EB',
                  borderRadius: '16px',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: f.bg, borderRadius: '10px' }}
                >
                  <Icon size={20} style={{ color: f.colour }} />
                </div>
                <h3
                  className="text-[17px] font-semibold mb-2"
                  style={{ color: '#111827' }}
                >
                  {f.label}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#6B7280' }}>
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Teleprompter callout ───────────────────────────────────────────── */}
      <section
        className="mx-6 sm:mx-auto max-w-5xl rounded-2xl mb-20 overflow-hidden"
        style={{ background: '#0F172A', borderRadius: '20px' }}
      >
        <div className="px-8 py-12 sm:px-16 sm:py-16 flex flex-col sm:flex-row items-center gap-10">
          {/* Mock teleprompter screen */}
          <div
            className="shrink-0 w-full sm:w-72 rounded-xl p-5 border"
            style={{ background: '#0A0F1E', borderColor: 'rgba(37,87,167,0.3)', borderRadius: '14px' }}
          >
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
                  Question type
                </p>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(37,87,167,0.3)', color: '#93C5FD' }}
                >
                  Stakeholder alignment
                </span>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
                  Best story
                </p>
                <p className="text-[12px] font-semibold" style={{ color: '#F1F5F9' }}>
                  Onboarding Redesign ↗
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
                  Answer shape
                </p>
                <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                  Tension → Intervention → Outcome → Learning
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2 mt-2"
                style={{ background: 'rgba(37,87,167,0.15)', border: '1px solid rgba(37,87,167,0.25)' }}
              >
                <p className="text-[11px]" style={{ color: '#93C5FD' }}>
                  💡 Lead with the business risk, not the process
                </p>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#2557A7' }}
            >
              Live Workspace
            </p>
            <h3
              className="text-[28px] sm:text-[34px] font-bold leading-tight mb-4"
              style={{ color: '#F9FAFB' }}
            >
              A teleprompter for your interview — that nobody else can see.
            </h3>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#94A3B8' }}>
              Open a minimal second window on your phone or second monitor. As the interviewer speaks,
              Interview Monkey detects the question type and surfaces your best story, answer shape,
              and a coaching nudge — in real time.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#2557A7', borderRadius: '10px' }}
            >
              See it in demo mode
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing tease ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <h2
          className="text-[32px] font-bold tracking-tight mb-4"
          style={{ color: '#111827' }}
        >
          Start free. Upgrade when it clicks.
        </h2>
        <p className="text-[16px] mb-10 max-w-xl mx-auto" style={{ color: '#6B7280' }}>
          The free tier gives you three stories, one Interview Pack, and one mock session.
          Enough to know if it works for you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          {[
            {
              name: 'Free',
              price: '£0',
              description: 'Try it out',
              items: ['3 stories', '1 Interview Pack', '1 mock session', 'Answer Lab'],
              cta: 'Get started',
              href: '/signup',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '£29',
              period: '/mo',
              description: 'Serious prep',
              items: ['Unlimited stories & packs', 'Unlimited mocks', 'Live Workspace', 'Pressure Point Studio'],
              cta: 'Start free trial',
              href: '/signup',
              highlight: true,
            },
            {
              name: 'Prime',
              price: '£79',
              period: '/mo',
              description: 'Executive level',
              items: ['Everything in Pro', 'Coach Mode add-on', 'Priority AI (Opus)', 'GDPR export & audit'],
              cta: 'Talk to us',
              href: '/signup',
              highlight: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className="rounded-2xl p-6 border flex flex-col"
              style={{
                background: tier.highlight ? '#2557A7' : '#FFFFFF',
                borderColor: tier.highlight ? '#2557A7' : '#E5E7EB',
                borderRadius: '16px',
              }}
            >
              <p
                className="text-[12px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: tier.highlight ? '#93C5FD' : '#9CA3AF' }}
              >
                {tier.name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="text-[36px] font-bold"
                  style={{ color: tier.highlight ? '#FFFFFF' : '#111827' }}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className="text-[14px]"
                    style={{ color: tier.highlight ? '#93C5FD' : '#9CA3AF' }}
                  >
                    {tier.period}
                  </span>
                )}
              </div>
              <p
                className="text-[13px] mb-5"
                style={{ color: tier.highlight ? '#BFDBFE' : '#6B7280' }}
              >
                {tier.description}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[14px]"
                    style={{ color: tier.highlight ? '#E0F2FE' : '#374151' }}>
                    <Check size={13} strokeWidth={3}
                      style={{ color: tier.highlight ? '#93C5FD' : '#2557A7', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className="block text-center px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all"
                style={{
                  background: tier.highlight ? 'rgba(255,255,255,0.15)' : '#EFF6FF',
                  color: tier.highlight ? '#FFFFFF' : '#2557A7',
                  borderRadius: '10px',
                  border: tier.highlight ? '1px solid rgba(255,255,255,0.2)' : 'none',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section
        className="mx-6 sm:mx-auto max-w-3xl rounded-2xl mb-20 px-8 py-14 text-center"
        style={{ background: '#2557A7', borderRadius: '20px' }}
      >
        <h2 className="text-[34px] font-bold text-white mb-4 tracking-tight">
          Your next interview is closer than you think.
        </h2>
        <p className="text-[16px] mb-8" style={{ color: '#BFDBFE' }}>
          Start with the demo — no account needed. See exactly how Interview Monkey
          builds, refines, and deploys your best answers.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[16px] font-semibold bg-white transition-all hover:bg-blue-50"
          style={{ color: '#2557A7', borderRadius: '12px' }}
        >
          Open demo dashboard
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto text-[13px]"
        style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}
      >
        <span className="font-semibold" style={{ color: '#2557A7' }}>Interview Monkey</span>
        <span>© {new Date().getFullYear()} Interview Monkey Ltd · London, UK</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
