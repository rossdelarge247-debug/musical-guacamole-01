/**
 * SIGNAL ENGINE
 * Interprets what an answer signals — ownership, leadership, judgment, etc.
 * Model: Claude Opus 4.6 (deep reasoning)
 */

import { callClaude, streamClaude } from '@/lib/ai/claude'
import type { SignalAnalysis, SignalType } from '@/types'

const SYSTEM = `You are a senior interview assessor with deep expertise in leadership and competency frameworks.
Your job is to analyse interview answers and identify the professional signals they convey — and those they fail to convey.
Be precise, evidence-based, and direct. Output valid JSON only. No markdown fences.`

const ALL_SIGNALS: SignalType[] = [
  'ownership', 'leadership', 'judgment', 'prioritisation',
  'commercial_awareness', 'self_awareness', 'influence', 'resilience',
  'scale', 'decisiveness', 'strategic_thinking',
]

export async function analyseSignals(
  answerText: string,
  questionText: string,
  candidateLevel: string,
): Promise<SignalAnalysis> {
  const prompt = `
Analyse the signals in this interview answer at ${candidateLevel} level.

QUESTION: ${questionText}

ANSWER: ${answerText}

Score each signal 0–5 where:
0 = absent, 1 = weak, 2 = implied, 3 = present, 4 = strong, 5 = exceptional

Signals to score: ${ALL_SIGNALS.join(', ')}

Return JSON with:
- signals_detected: object of signal → score (only include signals scored 2+)
- signals_missing: array of signals that would be expected at ${candidateLevel} level but are absent
- overall_score: 0–100
- summary: 2–3 sentence plain-English assessment
- suggestions: array of 2–3 specific improvement actions (max 15 words each)`

  const { content } = await callClaude({
    task: 'signal_analysis',
    system: SYSTEM,
    prompt,
    maxTokens: 1024,
  })

  try {
    const parsed = JSON.parse(content)
    return { ...parsed, answer_id: '' } as SignalAnalysis
  } catch {
    return {
      answer_id: '',
      signals_detected: {},
      signals_missing: [],
      overall_score: 0,
      summary: 'Analysis unavailable.',
      suggestions: [],
    }
  }
}

export async function* coachAnswer(
  answerText: string,
  questionText: string,
  targetSignals: SignalType[],
): AsyncGenerator<string> {
  const prompt = `
Coach this interview answer. Be direct — short bullet points, not paragraphs.

QUESTION: ${questionText}
ANSWER: ${answerText}
TARGET SIGNALS TO STRENGTHEN: ${targetSignals.join(', ')}

Provide:
1. What's working (max 2 points)
2. What's missing (max 3 points)
3. One specific opening line rewrite
4. One specific closing line rewrite

Keep every point under 20 words.`

  yield* streamClaude({
    task: 'answer_coaching',
    system: SYSTEM,
    prompt,
    maxTokens: 512,
  })
}
