'use client'

import { useState, useEffect } from 'react'
import { SkipForward, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Library — intentionally false, comedic, and philosophical
// ---------------------------------------------------------------------------

const QUOTES = [
  {
    text: 'The secret to getting a job is to convince a stranger you are useful, so they will pay you money until you both agree to call it a career.',
    attribution: '— Benjamin Franklin, allegedly, 1752',
  },
  {
    text: 'From each according to his ability, to each according to his LinkedIn Premium subscription.',
    attribution: '— Karl Marx, Das Kapital (the unpublished networking chapter)',
  },
  {
    text: 'If you know how to write a cover letter and you have written one, what more could you need? The answer is a referral, Epictetus. It is always a referral.',
    attribution: '— Epictetus, The Discourses, Book IV (the lost job-seeking edition)',
  },
]

const LS_HIDDEN = 'im:quote-hidden'
const LS_INDEX = 'im:quote-index'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotePanel() {
  const [hidden, setHidden] = useState(true)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHidden(localStorage.getItem(LS_HIDDEN) === 'true')
    const saved = parseInt(localStorage.getItem(LS_INDEX) ?? '0', 10)
    setQuoteIndex(isNaN(saved) ? 0 : saved % QUOTES.length)
  }, [])

  if (!mounted || hidden) return null

  const quote = QUOTES[quoteIndex]

  function handleSkip() {
    const next = (quoteIndex + 1) % QUOTES.length
    setQuoteIndex(next)
    localStorage.setItem(LS_INDEX, String(next))
    setConfirming(false)
  }

  function handleConfirmHide() {
    localStorage.setItem(LS_HIDDEN, 'true')
    setHidden(true)
    setConfirming(false)
  }

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-lg)] border px-8 py-8 text-center"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Decorative opening quote mark */}
      <div
        className="absolute top-3 left-5 text-[72px] font-serif leading-none select-none pointer-events-none"
        style={{ color: 'var(--color-primary)', opacity: 0.08 }}
        aria-hidden
      >
        &ldquo;
      </div>

      {!confirming ? (
        <>
          <p
            className="relative text-[22px] leading-relaxed italic mx-auto max-w-2xl"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>

          <p
            className="mt-4 text-[13px] font-medium tracking-wide"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {quote.attribution}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <SkipForward size={12} />
              Another gem
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors hover:opacity-70"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <X size={12} />
              Hide
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3 max-w-lg mx-auto">
          <p
            className="text-[15px] leading-relaxed italic"
            style={{
              color: 'var(--color-text-secondary)',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            Please confirm you don&apos;t want to inject any humour into your job hunting journey — because you&apos;re in this now for the love of the game and want no distractions.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handleConfirmHide}
              className="text-[12px] font-semibold px-4 py-2 rounded-[var(--radius-md)] border transition-colors hover:bg-[var(--color-background)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Yes. I am this person.
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[12px] font-semibold px-4 py-2 rounded-[var(--radius-md)] transition-colors text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              On second thought, I need this
            </button>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            You can restore it from My Professional History.
          </p>
        </div>
      )}
    </div>
  )
}
