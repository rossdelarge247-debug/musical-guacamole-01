import { transformAnswer } from '@/lib/ai/engines/jd'
import { streamClaude } from '@/lib/ai/claude'

// POST /api/ai/answer/transform — transform an answer (streaming)
export async function POST(request: Request) {
  try {
    const { answer_text, mode, candidate_level } = await request.json()

    if (!answer_text?.trim() || !mode) {
      return new Response('Missing answer_text or mode', { status: 400 })
    }

    // Stream the transformed answer back
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use the streaming version for real-time feel
          const generator = streamClaude({
            task: 'answer_transform',
            system: `You are an expert interview writing coach. Transform answers precisely as instructed.
Never add fluff. Output the transformed answer only — no labels, no markdown, no explanation.`,
            prompt: buildTransformPrompt(answer_text, mode, candidate_level ?? 'mid'),
            maxTokens: 512,
          })

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('Transform error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}

function buildTransformPrompt(answer: string, mode: string, level: string): string {
  const instructions: Record<string, string> = {
    more_concise: 'Reduce to 60% of the length without losing impact. Cut context, keep evidence and outcome.',
    more_strategic: 'Reframe to emphasise judgment, priorities, and business impact. Add one strategic insight.',
    more_direct: 'Cut the warm-up. Start with the action or outcome. Remove all hedging language.',
    more_natural: 'Make it sound like something a confident person would say in conversation. Reduce corporate language.',
    more_evidence: 'Add or strengthen the proof points. Make the metric or outcome more specific and concrete.',
    more_executive: 'Raise the register. Use precise, authoritative language. Emphasise leadership, scale, and impact.',
    simpler_english: 'Simplify vocabulary and sentence structure. Make every sentence clear on first read.',
    less_corporate: 'Remove jargon, buzzwords, and corporate phrases. Use plain, direct, human language.',
  }

  const instruction = instructions[mode] ?? 'Improve the answer quality.'

  return `Transform this interview answer. Instruction: ${instruction}

ANSWER (${level} level candidate):
${answer}

Return only the transformed answer — no labels, no markdown, no explanation.`
}
