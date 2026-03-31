import { getDemoFlags } from '@/lib/demo/flags'
import { env } from '@/lib/env'
import Anthropic from '@anthropic-ai/sdk'
import type { GraphNode } from '@/components/candidate-graph/graph-node-card'

const ENHANCE_SYSTEM = `You are an expert interview coach helping a professional prepare for job interviews.

You are reviewing a specific role entry in their Candidate Graph — the structured career database that powers their interview answers.

Your job is to help them get MORE out of this role. Be specific, direct, and practical. No generic advice.

Output in this exact format (use markdown headings and bullet points):

## Questions an interviewer will ask
List 4–5 specific questions likely to come up in interview for THIS role, based on the position, sector, and responsibilities.

## What to add
2–3 specific things missing from this entry that would strengthen their answers (e.g. team size, budget owned, decision authority, specific outcomes).

## Strengthen the description
1–2 concrete suggestions to make the description more compelling and interview-ready.`

function buildUserMessage(role: GraphNode, children: GraphNode[]): string {
  const dateRange = [role.date_from, role.date_to].filter(Boolean).join(' – ')
  const lines: string[] = [
    `Role: ${role.title}`,
    role.organisation ? `Organisation: ${role.organisation}` : '',
    dateRange ? `Date range: ${dateRange}` : '',
    role.description ? `Description: ${role.description}` : '',
    role.metrics?.length ? `Metrics: ${role.metrics.join(', ')}` : '',
    role.tags?.length ? `Tags: ${role.tags.join(', ')}` : '',
  ].filter(Boolean)

  if (children.length > 0) {
    lines.push('')
    lines.push(`Associated career moments (${children.length}):`)
    for (const child of children) {
      const childDate = [child.date_from, child.date_to].filter(Boolean).join(' – ')
      lines.push(
        `- [${child.type}] ${child.title}${childDate ? ` (${childDate})` : ''}${child.description ? ': ' + child.description : ''}`,
      )
    }
  }

  return lines.join('\n')
}

const DEMO_FIXTURE = `## Questions an interviewer will ask
- Can you walk me through the biggest challenge you faced in this role and how you handled it?
- How did you prioritise competing demands from different stakeholders?
- What was the most significant decision you made, and what was the outcome?
- How did you measure success in this role?
- Tell me about a time things didn't go to plan — what did you do?

## What to add
- **Team size and structure** — how many people did you lead or collaborate with directly? This anchors the scope of your responsibility.
- **Budget or resource ownership** — even informal budget influence (vendor contracts, tooling spend) signals commercial awareness.
- **Specific quantified outcomes** — replace vague descriptions with numbers: percentages, revenue, time saved, retention rates.

## Strengthen the description
- Open with the problem or opportunity you were handed, not your job title — interviewers remember context, not job specs.
- End with a one-sentence outcome that makes the impact undeniable: "As a result, X happened" is far stronger than listing activities.`

// POST /api/ai/role/enhance — stream markdown enhancement for a role node
export async function POST(request: Request) {
  const flags = getDemoFlags()

  let role: GraphNode
  let children: GraphNode[]

  try {
    const body = await request.json()
    role = body.role
    children = body.children ?? []
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  if (!role) {
    return new Response('Missing role', { status: 400 })
  }

  // ── Demo mode: stream fixture over ~1 second ──────────────────────────────
  if (flags.ai) {
    const encoder = new TextEncoder()
    const chunks = DEMO_FIXTURE.split('\n')
    const stream = new ReadableStream({
      async start(controller) {
        const delay = Math.round(1000 / chunks.length)
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk + '\n'))
          await new Promise((r) => setTimeout(r, delay))
        }
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // ── Real Claude call with retry on overload ───────────────────────────────
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY() })
  const userMessage = buildUserMessage(role, children)

  const MAX_ATTEMPTS = 3
  const RETRY_DELAYS = [8000, 16000]

  let lastError: unknown = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]))
    }

    try {
      const anthropicStream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: ENHANCE_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of anthropicStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            }
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })

      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      const isOverload =
        msg.includes('overloaded') || msg.includes('529') || msg.includes('overload_error')
      if (!isOverload || attempt === MAX_ATTEMPTS - 1) break
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError)
  return new Response(`Helper Monkey went home. Try again in a moment. (${errMsg})`, {
    status: 503,
  })
}
