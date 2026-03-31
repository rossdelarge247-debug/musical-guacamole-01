'use client'

import { useState, useRef, useEffect } from 'react'
import { FlaskConical, Plus, Search, Copy, Check, Loader2, X } from 'lucide-react'
import { cn, wordCount } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'stakeholder' | 'failure' | 'strategy' | 'leadership' | 'commercial'
type Priority = 'high' | 'medium' | 'low'
type TransformMode =
  | 'More concise'
  | 'More strategic'
  | 'More direct'
  | 'More natural'
  | 'More evidence'
  | 'More executive'
  | 'Simpler English'
  | 'Less corporate'

interface Question {
  id: string
  text: string
  type: QuestionType
  priority: Priority
  answerShape: string
}

interface Story {
  id: string
  title: string
  summary: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Tell me about a time you had to align multiple stakeholders on a difficult decision.',
    type: 'stakeholder',
    priority: 'high',
    answerShape: 'Tension → Intervention → Outcome → Learning',
  },
  {
    id: 'q2',
    text: 'Describe your biggest professional failure and what you learned.',
    type: 'failure',
    priority: 'high',
    answerShape: 'Context → Mistake → Consequence → What I did → What I learned',
  },
  {
    id: 'q3',
    text: 'How do you decide what not to build?',
    type: 'strategy',
    priority: 'high',
    answerShape: 'Framework → Trade-off → Example → Outcome',
  },
  {
    id: 'q4',
    text: 'Tell me about a time you led a team through significant change.',
    type: 'leadership',
    priority: 'medium',
    answerShape: 'Context → Challenge → Actions → Result → Learning',
  },
  {
    id: 'q5',
    text: 'Give me an example of when you had to influence without authority.',
    type: 'leadership',
    priority: 'medium',
    answerShape: 'Situation → Stakeholders → Approach → Outcome',
  },
  {
    id: 'q6',
    text: 'Tell me about a time you used data to challenge a widely-held assumption.',
    type: 'commercial',
    priority: 'medium',
    answerShape: 'Assumption → Data → Insight → Action → Impact',
  },
]

const TRANSFORM_MODES: TransformMode[] = [
  'More concise',
  'More strategic',
  'More direct',
  'More natural',
  'More evidence',
  'More executive',
  'Simpler English',
  'Less corporate',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Compute groups dynamically from questions state in the component

const typeVariant: Record<QuestionType, 'primary' | 'warning' | 'strategic' | 'strong' | 'critical'> = {
  stakeholder: 'primary',
  failure: 'critical',
  strategy: 'strategic',
  leadership: 'strong',
  commercial: 'warning',
}

const priorityColor: Record<Priority, string> = {
  high: 'var(--color-signal-critical)',
  medium: 'var(--color-signal-warning)',
  low: 'var(--color-signal-strong)',
}

const typeLabel: Record<QuestionType, string> = {
  stakeholder: 'Stakeholder',
  failure: 'Failure',
  strategy: 'Strategy',
  leadership: 'Leadership',
  commercial: 'Commercial',
}

const shapeColorMap: Record<QuestionType, string> = {
  stakeholder: 'var(--color-primary)',
  failure: 'var(--color-signal-critical)',
  strategy: 'var(--color-signal-strategic)',
  leadership: 'var(--color-signal-strong)',
  commercial: 'var(--color-signal-warning)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnswerLabPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [generatedAnswer, setGeneratedAnswer] = useState('')
  const [savedAnswers, setSavedAnswers] = useState<Map<string, string>>(new Map())
  const [transforming, setTransforming] = useState<TransformMode | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load real stories from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('im:stories')
      if (stored) {
        const parsed: Story[] = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStories(parsed.map((s) => ({ id: s.id, title: s.title, summary: s.summary })))
          return
        }
      }
    } catch { /* ignore */ }
    // Fall back to API
    fetch('/api/ai/stories')
      .then((r) => r.json())
      .then((data) => {
        const s: Story[] = (data.stories ?? [])
          .filter((s: Story) => !s.id?.startsWith('demo-'))
          .map((s: Story) => ({ id: s.id, title: s.title, summary: s.summary }))
        setStories(s)
      })
      .catch(() => { /* silent */ })
  }, [])

  // Filter questions by search
  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase()),
  )

  const visibleGroups = Array.from(new Set(questions.map((q) => q.type))).filter((type) =>
    filteredQuestions.some((q) => q.type === type),
  )

  // Add custom question
  function handleAddQuestion() {
    if (!customQuestion.trim()) return
    const newQ: Question = {
      id: `custom-${Date.now()}`,
      text: customQuestion.trim(),
      type: 'strategy',
      priority: 'medium',
      answerShape: 'Context → Challenge → Action → Result',
    }
    setQuestions((prev) => [newQ, ...prev])
    setCustomQuestion('')
    setShowAddQuestion(false)
    setSelectedQuestion(newQ)
    setGeneratedAnswer('')
    setSelectedStory(null)
  }

  // Generate answer
  async function handleGenerate() {
    if (!selectedQuestion) return
    setGenerating(true)
    setError(null)
    setGeneratedAnswer('')

    try {
      const res = await fetch('/api/ai/answer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion.text,
          storyContext: selectedStory?.summary ?? null,
          answerShape: selectedQuestion.answerShape,
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setGeneratedAnswer((prev) => prev + chunk)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate answer')
    } finally {
      setGenerating(false)
    }
  }

  // Transform answer
  async function handleTransform(mode: TransformMode) {
    if (!generatedAnswer.trim() || transforming) return
    setTransforming(mode)
    setError(null)

    try {
      const res = await fetch('/api/ai/answer/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: generatedAnswer,
          mode,
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setGeneratedAnswer(accumulated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform answer')
    } finally {
      setTransforming(null)
    }
  }

  // Save answer
  function handleSave() {
    if (!selectedQuestion || !generatedAnswer) return
    setSavedAnswers((prev) => new Map(prev).set(selectedQuestion.id, generatedAnswer))
  }

  // Copy to clipboard
  async function handleCopy() {
    if (!generatedAnswer) return
    await navigator.clipboard.writeText(generatedAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSaved =
    selectedQuestion !== null &&
    savedAnswers.get(selectedQuestion.id) === generatedAnswer &&
    generatedAnswer.length > 0

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col border-r shrink-0 overflow-hidden"
        style={{
          width: '380px',
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h1
            className="text-[16px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Answer Lab
          </h1>
          <button
            onClick={() => setShowAddQuestion((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] font-medium transition-colors"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Plus size={13} />
            Add question
          </button>
        </div>

        {/* Inline add question */}
        {showAddQuestion && (
          <div
            className="px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-primary-light)' }}
          >
            <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Add a custom question
            </p>
            <textarea
              className="w-full text-[13px] rounded p-2 resize-none border focus:outline-none focus:ring-2"
              rows={3}
              placeholder="Type your interview question…"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddQuestion()
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddQuestion}
                className="text-[12px] font-medium px-3 py-1.5 rounded transition-colors"
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddQuestion(false)
                  setCustomQuestion('')
                }}
                className="text-[12px] px-3 py-1.5 rounded transition-colors"
                style={{
                  background: 'var(--color-background)',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div
          className="px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] border rounded focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto py-2">
          {visibleGroups.length === 0 ? (
            <p
              className="px-4 py-8 text-[13px] text-center"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No questions match your search.
            </p>
          ) : (
            visibleGroups.map((type) => (
              <div key={type} className="mb-2">
                {/* Group header */}
                <div
                  className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {typeLabel[type]}
                </div>
                {filteredQuestions
                  .filter((q) => q.type === type)
                  .map((question) => {
                    const isSelected = selectedQuestion?.id === question.id
                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          setSelectedQuestion(question)
                          setGeneratedAnswer('')
                          setSelectedStory(null)
                          setError(null)
                        }}
                        className="w-full text-left px-4 py-3 transition-colors border-l-2"
                        style={{
                          borderLeftColor: isSelected
                            ? 'var(--color-primary)'
                            : 'transparent',
                          background: isSelected
                            ? 'var(--color-primary-light)'
                            : 'transparent',
                        }}
                      >
                        <p
                          className="text-[14px] leading-snug mb-2"
                          style={{
                            color: 'var(--color-text-primary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {question.text}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={typeVariant[question.type]}>
                            {typeLabel[question.type]}
                          </Badge>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: priorityColor[question.priority] }}
                            title={`${question.priority} priority`}
                          />
                          <span
                            className="text-[11px] capitalize"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {question.priority}
                          </span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Right Panel ─────────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'var(--color-background)' }}
      >
        {selectedQuestion ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
              {/* Question text */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p
                  className="text-[20px] font-semibold leading-snug"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {selectedQuestion.text}
                </p>
              </div>

              {/* Answer shape */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Recommended Answer Shape
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedQuestion.answerShape.split(' → ').map((step, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span
                        className="px-3 py-1 rounded-full text-[12px] font-semibold text-white"
                        style={{ background: shapeColorMap[selectedQuestion.type] }}
                      >
                        {step}
                      </span>
                      {i < arr.length - 1 && (
                        <span
                          className="text-[14px] font-medium"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          →
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Story selector */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Best Story Match
                </p>
                {stories.length === 0 ? (
                  <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    No stories mined yet —{' '}
                    <a href="/stories" className="underline" style={{ color: 'var(--color-primary)' }}>
                      mine your stories
                    </a>{' '}
                    to use them here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {stories.slice(0, 3).map((story) => {
                      const isSelected = selectedStory?.id === story.id
                      return (
                        <button
                          key={story.id}
                          onClick={() =>
                            setSelectedStory((prev) =>
                              prev?.id === story.id ? null : story,
                            )
                          }
                          className="flex items-start gap-3 p-3 rounded-lg text-left transition-all border"
                          style={{
                            borderColor: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-border)',
                            background: isSelected
                              ? 'var(--color-primary-light)'
                              : 'var(--color-background)',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                            style={{
                              background: isSelected
                                ? 'var(--color-primary)'
                                : 'var(--color-border)',
                            }}
                          />
                          <div>
                            <p
                              className="text-[13px] font-semibold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {story.title}
                            </p>
                            <p
                              className="text-[12px] mt-0.5"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {story.summary}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Generate button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white rounded-lg transition-opacity disabled:opacity-60"
                  style={{
                    background: 'var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FlaskConical size={15} />
                      Generate answer
                    </>
                  )}
                </button>
                {selectedStory && (
                  <span
                    className="text-[12px]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Using story:{' '}
                    <span style={{ color: 'var(--color-primary)' }} className="font-medium">
                      {selectedStory.title}
                    </span>
                  </span>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-[13px]"
                  style={{
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Answer textarea */}
              {(generatedAnswer || generating) && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={generatedAnswer}
                      onChange={(e) => setGeneratedAnswer(e.target.value)}
                      rows={12}
                      className={cn(
                        'w-full resize-none text-[14px] leading-relaxed bg-transparent focus:outline-none',
                        generating && 'streaming-cursor',
                      )}
                      style={{
                        color: 'var(--color-text-primary)',
                        fontFamily: 'inherit',
                      }}
                      placeholder={generating ? '' : 'Your generated answer will appear here…'}
                    />
                    {generating && (
                      <span
                        className="inline-block w-0.5 h-4 animate-pulse ml-0.5 align-middle"
                        style={{ background: 'var(--color-primary)' }}
                      />
                    )}
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={!generatedAnswer || isSaved}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded transition-colors disabled:opacity-50"
                        style={{
                          background: isSaved ? '#D1FAE5' : 'var(--color-primary-light)',
                          color: isSaved ? '#065F46' : 'var(--color-primary)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        {isSaved ? (
                          <>
                            <Check size={12} />
                            Saved
                          </>
                        ) : (
                          'Save answer'
                        )}
                      </button>
                      <button
                        onClick={handleCopy}
                        disabled={!generatedAnswer}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded transition-colors disabled:opacity-50"
                        style={{
                          background: 'var(--color-background)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        {copied ? (
                          <>
                            <Check size={12} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {wordCount(generatedAnswer)} words
                    </span>
                  </div>
                </div>
              )}

              {/* Transform controls */}
              {generatedAnswer && !generating && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Transform
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRANSFORM_MODES.map((mode) => {
                      const isActive = transforming === mode
                      return (
                        <button
                          key={mode}
                          onClick={() => handleTransform(mode)}
                          disabled={transforming !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-all disabled:opacity-50"
                          style={{
                            borderColor: isActive
                              ? 'var(--color-primary)'
                              : 'var(--color-border)',
                            background: isActive
                              ? 'var(--color-primary-light)'
                              : 'var(--color-background)',
                            color: isActive
                              ? 'var(--color-primary)'
                              : 'var(--color-text-secondary)',
                          }}
                        >
                          {isActive && (
                            <Loader2 size={11} className="animate-spin shrink-0" />
                          )}
                          {mode}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <FlaskConical size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p
                className="text-[16px] font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Select a question to start building your answer
              </p>
              <p
                className="text-[14px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Choose from the question bank on the left, or add your own.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
