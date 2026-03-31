import { getDemoFlags } from '@/lib/demo/flags'
import { env } from '@/lib/env'
import Anthropic from '@anthropic-ai/sdk'
import type { GraphNode } from '@/components/candidate-graph/graph-node-card'
import { NextResponse } from 'next/server'

export interface IntakeQuestion {
  id: string
  text: string
  type: 'text' | 'number' | 'radio' | 'select'
  options?: string[]
  placeholder?: string
}

const INTAKE_SYSTEM = `You are an expert interview coach helping a professional fill a gap in their career record.

A "What to add" suggestion has been made for their role. Generate a short intake questionnaire (3–5 questions) to gather the specific information needed to write a compelling proof point card.

Return ONLY valid JSON — no markdown fences, no commentary. Format exactly:
{
  "questions": [
    { "id": "q1", "text": "...", "type": "text", "placeholder": "e.g. ..." },
    { "id": "q2", "text": "...", "type": "radio", "options": ["Yes", "No"] },
    { "id": "q3", "text": "...", "type": "number", "placeholder": "e.g. 5" }
  ]
}

Question types:
- text: open-ended short answer
- number: numeric value only
- radio: 2–4 options (good for yes/no or small fixed choices)
- select: 4+ dropdown options

Keep questions focused and specific to the suggestion. No generic or vague questions.`

const DEMO_FIXTURE: { questions: IntakeQuestion[] } = {
  questions: [
    { id: 'q1', text: 'How many people were on the team (direct reports)?', type: 'number', placeholder: 'e.g. 4' },
    { id: 'q2', text: 'Did you manage any indirect reports or extended team?', type: 'radio', options: ['Yes', 'No'] },
    { id: 'q3', text: 'How was the team structured?', type: 'select', options: ['Fully co-located', 'Hybrid', 'Fully remote', 'Distributed across timezones'] },
    { id: 'q4', text: 'What was the biggest challenge managing this team?', type: 'text', placeholder: 'e.g. aligning priorities across functions' },
  ],
}

export async function POST(request: Request) {
  const flags = getDemoFlags()

  let role: GraphNode
  let children: GraphNode[]
  let item: string

  try {
    const body = await request.json()
    role = body.role
    children = body.children ?? []
    item = body.item
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!role || !item) {
    return NextResponse.json({ error: 'Missing role or item' }, { status: 400 })
  }

  if (flags.ai) {
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json(DEMO_FIXTURE)
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY() })

    const childSummary = children.length > 0
      ? `\nAssociated achievements (${children.length}): ${children.map((c) => c.title).join(', ')}`
      : ''

    const userMessage = [
      `Role: ${role.title}`,
      role.organisation ? `Organisation: ${role.organisation}` : '',
      role.description ? `Description: ${role.description}` : '',
      childSummary,
      `\nSuggestion to implement: ${item}`,
    ].filter(Boolean).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: INTAKE_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Intake route error:', err)
    // Fall back to demo fixture on any error
    return NextResponse.json(DEMO_FIXTURE)
  }
}
