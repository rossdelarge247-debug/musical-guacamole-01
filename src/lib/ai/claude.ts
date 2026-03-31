/**
 * CLAUDE AI CLIENT
 *
 * Routes tasks to the appropriate Claude model:
 * - Sonnet 4.6 → most tasks (fast, cost-efficient, high quality)
 * - Opus 4.6   → deep reasoning tasks (Signal Engine, Pressure Point, JD analysis)
 *
 * In demo mode (no ANTHROPIC_API_KEY), returns labelled fixture responses.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getDemoFlags } from '@/lib/demo/flags'
import { env } from '@/lib/env'

export const CLAUDE_SONNET = 'claude-sonnet-4-6'
export const CLAUDE_OPUS = 'claude-opus-4-6'

// Tasks that warrant Opus (deep reasoning — requires claude-opus-4-6 access)
const OPUS_TASKS = new Set([
  'signal_analysis',
  'pressure_point_detection',
  'jd_deep_analysis',
])

function getClient(): Anthropic {
  const apiKey = env.ANTHROPIC_API_KEY()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

export function modelForTask(task: string): string {
  return OPUS_TASKS.has(task) ? CLAUDE_OPUS : CLAUDE_SONNET
}

export interface ClaudeRequest {
  task: string
  system: string
  prompt: string
  maxTokens?: number
  jsonMode?: boolean
}

export interface ClaudeResponse {
  content: string
  model: string
  demo: boolean
}

/** Non-streaming Claude call — returns full text */
export async function callClaude(req: ClaudeRequest): Promise<ClaudeResponse> {
  const flags = getDemoFlags()

  if (flags.ai) {
    return {
      content: getDemoResponse(req.task),
      model: 'demo',
      demo: true,
    }
  }

  const client = getClient()
  const model = modelForTask(req.task)

  const message = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? 2048,
    system: req.system,
    messages: [{ role: 'user', content: req.prompt }],
  })

  const content =
    message.content[0].type === 'text' ? message.content[0].text : ''

  return { content, model, demo: false }
}

/** Streaming Claude call — yields text deltas */
export async function* streamClaude(req: ClaudeRequest): AsyncGenerator<string> {
  const flags = getDemoFlags()

  if (flags.ai) {
    const demo = getDemoResponse(req.task)
    // Simulate streaming by yielding word by word
    for (const word of demo.split(' ')) {
      yield word + ' '
      await new Promise((r) => setTimeout(r, 30))
    }
    return
  }

  const client = getClient()
  const model = modelForTask(req.task)

  const stream = client.messages.stream({
    model,
    max_tokens: req.maxTokens ?? 2048,
    system: req.system,
    messages: [{ role: 'user', content: req.prompt }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

function getDemoResponse(task: string): string {
  const responses: Record<string, string> = {
    story_mining:
      '[DEMO MODE] Story extracted: Led a cross-functional team of 8 to redesign the onboarding flow, reducing time-to-value by 40% and increasing 30-day retention by 18%. Stakeholders: product, engineering, customer success.',
    signal_analysis:
      '[DEMO MODE] Signals detected: Leadership (4/5), Ownership (5/5), Commercial Awareness (3/5). Missing: Strategic Thinking. Suggestion: Add a sentence about the business impact of the retention improvement.',
    pressure_point_detection:
      '[DEMO MODE] Pressure point identified: Short tenure (8 months at previous role). Recommended framing: "I joined to solve a specific problem — once that was delivered, I took the opportunity to move into a larger scope." Avoid: vague explanations.',
    jd_deep_analysis:
      '[DEMO MODE] Role priorities inferred: stakeholder management, cross-functional delivery, data-led decision making. Likely objection zone: limited enterprise-scale evidence. Top story match: product redesign project.',
    answer_generation:
      '[DEMO MODE] Draft answer: "I was brought in to untangle a process that had stalled across three teams. I mapped the blockers, ran a structured alignment session, and within two weeks we had a shared delivery plan. The project shipped on time and within budget — the first time in three cycles."',
    answer_transform:
      '[DEMO MODE] Transformed (more concise): "Three teams, one stalled project. I mapped the blockers, ran alignment sessions, and we shipped on time — first time in three cycles."',
    cv_parsing:
      '[DEMO MODE] Profile extracted: 4 roles identified, 12 achievements, 6 proof points. Confidence: 87%. 2 items flagged for review.',
    candidate_graph_extraction: JSON.stringify({
      headline: 'Experienced product leader with a track record of cross-functional delivery and commercial impact',
      skills: ['Product Strategy', 'Stakeholder Management', 'Data Analysis', 'Agile Delivery', 'Commercial Awareness'],
      parsing_confidence: 0.87,
      nodes: [
        {
          type: 'role',
          title: 'Senior Product Manager',
          description: 'Led product strategy and delivery for a SaaS platform serving 50k+ users',
          context: 'Growth-stage B2B software company',
          date_from: '2021-03',
          date_to: null,
          organisation: 'Demo Corp',
          metrics: ['50k+ users', '40% reduction in time-to-value', '£2.4M ARR growth'],
          tags: ['product', 'saas', 'b2b', 'growth'],
          confidence: 0.92,
        },
        {
          type: 'achievement',
          title: 'Onboarding Redesign',
          description: 'Led cross-functional team of 8 to redesign onboarding, reducing time-to-value by 40%',
          context: 'Identified as top churn driver in user research',
          date_from: '2022-06',
          date_to: '2022-10',
          organisation: 'Demo Corp',
          metrics: ['40% time-to-value reduction', '18% improvement in 30-day retention'],
          tags: ['leadership', 'cross-functional', 'user research', 'retention'],
          confidence: 0.95,
        },
        {
          type: 'failure',
          title: 'API v2 Launch Misstep',
          description: 'Launched API v2 without adequate customer validation, causing integration issues for 12 enterprise clients',
          context: 'Pressure to ship ahead of competitor launch',
          date_from: '2023-02',
          date_to: '2023-04',
          organisation: 'Demo Corp',
          metrics: ['12 enterprise clients impacted', 'resolved in 6 weeks'],
          tags: ['failure', 'learning', 'enterprise', 'api'],
          confidence: 0.88,
        },
        {
          type: 'proof_point',
          title: 'Analytics Module Launch',
          description: 'Built and launched analytics module generating significant incremental revenue',
          context: 'Identified gap in competitor offerings',
          date_from: '2023-07',
          date_to: '2023-11',
          organisation: 'Demo Corp',
          metrics: ['£180k incremental ARR', '23% increase in enterprise deal size'],
          tags: ['commercial', 'analytics', 'revenue', 'enterprise'],
          confidence: 0.91,
        },
      ],
    }),
    default:
      '[DEMO MODE] AI response — add your ANTHROPIC_API_KEY to .env.local to enable real responses.',
  }

  return responses[task] ?? responses.default
}
