'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createTranscriber } from '@/lib/ai/deepgram'
import type { TeleprompterPrompt } from '@/types'

// Default empty prompt state
const EMPTY_PROMPT: TeleprompterPrompt = {
  question_type: null,
  question_detected: null,
  best_story_title: null,
  alternate_story_title: null,
  answer_shape: null,
  proof_point: null,
  coaching_nudge: null,
  updated_at: new Date().toISOString(),
}

type ListeningState = 'idle' | 'listening' | 'processing'

export default function TeleprompterPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [prompt, setPrompt] = useState<TeleprompterPrompt>(EMPTY_PROMPT)
  const [listening, setListening] = useState<ListeningState>('idle')
  const [transcript, setTranscript] = useState('')

  const startListening = useCallback(() => {
    setListening('listening')
    const transcriber = createTranscriber({
      onTranscript: (chunk) => {
        if (chunk.is_final) setTranscript(chunk.text)
      },
      onQuestion: async (questionText) => {
        setListening('processing')
        setTranscript(questionText)

        // In production: call /api/session/[id]/classify to get AI prompt
        // For Sprint Zero: use a demo prompt after a short delay
        await new Promise((r) => setTimeout(r, 900))

        setPrompt({
          question_type: 'leadership',
          question_detected: questionText,
          best_story_title: 'Policy Lab Alignment Workshop',
          alternate_story_title: 'Ops Redesign Programme',
          answer_shape: 'Tension → Intervention → Outcome → Learning',
          proof_point: 'Aligned 3 resistant specialists, unlocked next-phase sign-off',
          coaching_nudge: 'Lead with the conflict, not the background',
          updated_at: new Date().toISOString(),
        })
        setListening('listening')
      },
      onError: (err) => {
        console.error('Transcription error:', err)
        setListening('idle')
      },
    })

    transcriber.start()

    return () => transcriber.stop()
  }, [])

  // Hide cursor after 2s of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const show = () => {
      document.documentElement.style.cursor = 'default'
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        document.documentElement.style.cursor = 'none'
      }, 2000)
    }
    window.addEventListener('mousemove', show)
    return () => {
      window.removeEventListener('mousemove', show)
      clearTimeout(timeout)
    }
  }, [])

  // Keyboard shortcuts: ← previous story, → next story, Space = start/stop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (listening === 'idle') startListening()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [listening, startListening])

  const hasContent = prompt.question_type !== null

  return (
    <div className="teleprompter-surface min-h-screen flex flex-col p-10 lg:p-16 select-none">
      {/* Listening indicator */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        {listening === 'listening' && (
          <>
            <span className="w-2 h-2 rounded-full bg-[var(--color-signal-strong)] animate-pulse" />
            <span className="text-[11px] font-medium text-[var(--color-teleprompter-secondary)] uppercase tracking-widest">
              Listening
            </span>
          </>
        )}
        {listening === 'processing' && (
          <>
            <span className="w-2 h-2 rounded-full bg-[var(--color-signal-warning)] animate-pulse" />
            <span className="text-[11px] font-medium text-[var(--color-teleprompter-secondary)] uppercase tracking-widest">
              Processing
            </span>
          </>
        )}
        {listening === 'idle' && (
          <span className="text-[11px] text-[var(--color-teleprompter-secondary)] uppercase tracking-widest">
            Press Space to start
          </span>
        )}
      </div>

      {/* Session ID — minimal brand */}
      <div className="absolute bottom-6 right-8">
        <span className="text-[11px] text-[var(--color-teleprompter-secondary)]/40 font-medium tracking-wider">
          IM
        </span>
      </div>

      {!hasContent ? (
        /* Idle state — waiting for first question */
        <div className="flex-1 flex flex-col items-start justify-center max-w-2xl">
          <p className="text-[14px] text-[var(--color-teleprompter-secondary)] uppercase tracking-widest mb-6">
            Live Workspace ready
          </p>
          <p className="text-[28px] lg:text-[36px] font-light text-[var(--color-teleprompter-text)] leading-tight">
            Waiting for the first question…
          </p>
          {!sessionId.startsWith('demo') && (
            <p className="mt-4 text-[14px] text-[var(--color-teleprompter-secondary)]">
              {listening === 'idle'
                ? 'Press Space or tap the control surface to start listening.'
                : 'Listening for a question from your interviewer.'}
            </p>
          )}
          {transcript && (
            <p className="mt-8 text-[15px] text-[var(--color-teleprompter-secondary)] italic border-l-2 border-[var(--color-teleprompter-border)] pl-4">
              &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      ) : (
        /* Active prompt — teleprompter layout */
        <div className="flex-1 grid grid-rows-[auto_1fr_auto] gap-8 max-w-3xl">
          {/* Question classification — upper third */}
          <div className="space-y-3 pt-4">
            {prompt.question_type && (
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-teleprompter-secondary)]">
                  Question type
                </span>
                <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wide bg-[var(--color-teleprompter-border)] text-[var(--color-teleprompter-text)]">
                  {prompt.question_type.replace('_', ' ')}
                </span>
              </div>
            )}
            {prompt.question_detected && (
              <p className="text-[17px] text-[var(--color-teleprompter-secondary)] leading-relaxed italic">
                &ldquo;{prompt.question_detected}&rdquo;
              </p>
            )}
          </div>

          {/* Story + answer shape — middle */}
          <div className="space-y-6">
            {prompt.best_story_title && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-teleprompter-secondary)]">
                  Best story
                </p>
                <p className="text-[32px] lg:text-[40px] font-semibold text-[var(--color-teleprompter-text)] leading-tight">
                  {prompt.best_story_title}
                </p>
                {prompt.alternate_story_title && (
                  <p className="text-[15px] text-[var(--color-teleprompter-secondary)]">
                    Alt: {prompt.alternate_story_title}
                  </p>
                )}
              </div>
            )}

            {prompt.answer_shape && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-teleprompter-secondary)]">
                  Answer shape
                </p>
                <p className="text-[20px] text-[var(--color-teleprompter-text)] font-medium tracking-wide">
                  {prompt.answer_shape}
                </p>
              </div>
            )}
          </div>

          {/* Proof point + coaching nudge — bottom */}
          <div className="grid grid-cols-2 gap-6 pb-4 border-t border-[var(--color-teleprompter-border)] pt-6">
            {prompt.proof_point && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-teleprompter-secondary)]">
                  Proof point
                </p>
                <p className="text-[15px] text-[var(--color-teleprompter-text)]">
                  {prompt.proof_point}
                </p>
              </div>
            )}
            {prompt.coaching_nudge && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-signal-warning)]">
                  Nudge
                </p>
                <p className="text-[15px] text-[var(--color-signal-warning)] font-medium">
                  {prompt.coaching_nudge}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start button — only shown when idle */}
      {listening === 'idle' && (
        <div className="absolute bottom-10 left-10 lg:left-16">
          <button
            onClick={startListening}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--color-teleprompter-border)] text-[var(--color-teleprompter-secondary)] text-[14px] font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Start listening
          </button>
        </div>
      )}
    </div>
  )
}
