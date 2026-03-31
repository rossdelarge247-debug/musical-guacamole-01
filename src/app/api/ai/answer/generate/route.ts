import { NextResponse } from 'next/server'
import { generateAnswerDraft } from '@/lib/ai/engines/jd'

// POST /api/ai/answer/generate — generate a draft answer for a question
export async function POST(request: Request) {
  try {
    const {
      question_text,
      question_type,
      story_title,
      story_content,
      proof_points,
      candidate_level,
    } = await request.json()

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
    }

    const draft = await generateAnswerDraft(
      question_text,
      question_type ?? 'behavioural',
      story_title ?? '',
      story_content ?? '',
      proof_points ?? [],
      candidate_level ?? 'mid',
    )

    return NextResponse.json({ draft })
  } catch (err) {
    console.error('Answer generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
