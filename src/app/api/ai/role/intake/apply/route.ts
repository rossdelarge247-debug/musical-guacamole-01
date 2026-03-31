import { getDemoFlags } from '@/lib/demo/flags'
import { env } from '@/lib/env'
import Anthropic from '@anthropic-ai/sdk'
import type { GraphNode } from '@/components/candidate-graph/graph-node-card'
import { NextResponse } from 'next/server'

interface Answer {
  questionId: string
  questionText: string
  answer: string
}

const APPLY_SYSTEM = `You are an expert interview coach. A candidate has answered intake questions to fill a gap in their career record. Generate a concise proof point card for their Candidate Graph.

Return ONLY valid JSON — no markdown fences, no commentary. Format exactly:
{
  "type": "proof_point",
  "title": "...",
  "description": "...",
  "metrics": ["..."],
  "tags": ["..."]
}

Rules:
- title: 6–10 words, factual and specific — no buzzwords
- description: 2–3 compelling sentences; concrete, specific, interview-ready; starts with action or context
- metrics: 0–3 specific numbers or measurable facts extracted from their answers; empty array if none
- tags: 2–4 relevant lowercase skill/context tags (no spaces, use hyphens)`

const DEMO_RESULT = {
  type: 'proof_point',
  title: 'Led cross-functional team of 8',
  description: 'Managed a hybrid team of 4 direct and 4 indirect reports spanning engineering and design. Coordinated priorities across time zones and maintained delivery cadence through a major product pivot. Grew the team from 4 to 8 over 18 months through a structured hiring and onboarding process.',
  metrics: ['8 team members', '4 direct reports', 'cross-functional'],
  tags: ['leadership', 'team-management', 'cross-functional', 'hybrid'],
}

export async function POST(request: Request) {
  const flags = getDemoFlags()

  let role: GraphNode
  let item: string
  let answers: Answer[]

  try {
    const body = await request.json()
    role = body.role
    item = body.item
    answers = body.answers ?? []
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!role || !item) {
    return NextResponse.json({ error: 'Missing role or item' }, { status: 400 })
  }

  const roleContext = {
    organisation: role.organisation ?? '',
    date_from: role.date_from ?? '',
    date_to: role.date_to ?? '',
  }

  if (flags.ai) {
    await new Promise((r) => setTimeout(r, 1200))
    return NextResponse.json({ ...DEMO_RESULT, ...roleContext })
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY() })

    const answersText = answers
      .filter((a) => a.answer.trim())
      .map((a) => `Q: ${a.questionText}\nA: ${a.answer}`)
      .join('\n\n')

    const userMessage = [
      `Role: ${role.title}`,
      role.organisation ? `Organisation: ${role.organisation}` : '',
      role.description ? `Role description: ${role.description}` : '',
      `\nSuggestion being implemented: ${item}`,
      answersText ? `\nCandidate answers:\n${answersText}` : '',
    ].filter(Boolean).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: APPLY_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ ...parsed, ...roleContext })
  } catch (err) {
    console.error('Intake apply route error:', err)
    return NextResponse.json({ ...DEMO_RESULT, ...roleContext })
  }
}
