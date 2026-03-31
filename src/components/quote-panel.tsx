'use client'

import { useState, useEffect, useMemo } from 'react'
import { SkipForward, X, Quote } from 'lucide-react'

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

interface QuotePanelProps {
  position?: 'top' | 'bottom'
}

export function QuotePanel({ position = 'top' }: QuotePanelProps) {
  const [hidden, setHidden] = useState(true) // default hidden until localStorage check
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isHidden = localStorage.getItem(LS_HIDDEN) === 'true'
    setHidden(isHidden)
    const savedIndex = parseInt(localStorage.getItem(LS_INDEX) ?? '0', 10)
    setQuoteIndex(isNaN(savedIndex) ? 0 : savedIndex % QUOTES.length)
  }, [])

  // Randomly vary position on mount if not specified
  const resolvedPosition = useMemo(() => position, [position])

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
      className={`relative overflow-hidden rounded-[var(--radius-lg)] px-5 py-4 border ${resolvedPosition === 'bottom' ? 'mt-2' : 'mb-2'}`}
      style={{
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        borderColor: '#FCD34D',
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute -top-3 -left-2 text-[80px] font-serif leading-none select-none pointer-events-none"
        style={{ color: '#F59E0B', opacity: 0.15 }}
        aria-hidden
      >
        &ldquo;
      </div>

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: '#F59E0B' }}
        >
          <Quote size={12} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {!confirming ? (
            <>
              <p className="text-[13px] leading-relaxed font-medium italic" style={{ color: '#78350F' }}>
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#92400E' }}>
                {quote.attribution}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] leading-relaxed font-medium" style={{ color: '#78350F' }}>
                Please confirm you don&apos;t want to inject any humour into your job hunting journey, because you&apos;re in this now for the love of the game and want no distractions.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleConfirmHide}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={{ background: '#78350F', color: '#FEF3C7' }}
                >
                  Yes. I am this person.
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: '#F59E0B', color: '#92400E', background: 'transparent' }}
                >
                  On second thought, I need this
                </button>
              </div>
              <p className="text-[10px]" style={{ color: '#B45309' }}>
                You can restore it later from My Professional History.
              </p>
            </div>
          )}
        </div>

        {!confirming && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full transition-colors hover:opacity-80"
              style={{ color: '#92400E', background: 'rgba(245, 158, 11, 0.2)' }}
              title="Another gem"
            >
              <SkipForward size={11} />
              Next
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-full transition-colors hover:opacity-70"
              style={{ color: '#B45309' }}
              aria-label="Hide quote panel"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
