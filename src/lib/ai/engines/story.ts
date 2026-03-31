/**
 * STORY INTELLIGENCE ENGINE
 * Converts candidate profile + graph nodes into reusable story assets.
 * Model: Claude Sonnet 4.6
 */

import { callClaude, streamClaude } from '@/lib/ai/claude'
import type { CandidateProfile, CandidateGraphNode, Story } from '@/types'

const SYSTEM = `You are an expert interview coach specialising in behavioural and competency-based interviews.
Your job is to transform a candidate's real professional experience into structured, reusable story assets.
Always ground stories in the candidate's actual evidence — never invent or inflate.
Output valid JSON only. No markdown fences.`

export async function mineStories(
  profile: CandidateProfile,
  nodes: CandidateGraphNode[],
): Promise<Partial<Story>[]> {
  const prompt = `
Extract 5–8 high-quality interview stories from this candidate's experience.

CANDIDATE LEVEL: ${profile.level}
PROFILE HEADLINE: ${profile.headline ?? 'Not provided'}
EXPERIENCE NODES:
${JSON.stringify(nodes, null, 2)}

For each story return a JSON object with:
- title (string)
- summary (one sentence)
- context (2–3 sentences)
- challenge (what was the difficulty or stakes)
- action (what the candidate specifically did — use "I" not "we")
- outcome (concrete result)
- metric (quantified impact if available, else null)
- stakeholder_angle (who else was affected and how)
- question_fit_tags (array of: behavioural|competency|leadership|strategy|situational|pressure|motivational|failure|conflict|ambiguity|achievement|stakeholder|change|commercial)
- signal_strengths (object: ownership|leadership|judgment|prioritisation|commercial_awareness|self_awareness|influence|resilience|scale|decisiveness|strategic_thinking each scored 0–5)
- confidence_score (0–1 based on evidence density)

Return a JSON array of story objects.`

  const { content } = await callClaude({
    task: 'story_mining',
    system: SYSTEM,
    prompt,
    maxTokens: 4096,
  })

  try {
    return JSON.parse(content) as Partial<Story>[]
  } catch {
    return []
  }
}

export async function* generateStoryVariants(
  story: Story,
  targetLevel: string,
): AsyncGenerator<string> {
  const prompt = `
Generate answer variants for this interview story at ${targetLevel} level.

STORY: ${JSON.stringify(story, null, 2)}

Generate these variants in sequence, clearly labelled:
1. SHORT (60–80 words) — punchy opener, just the hook and result
2. MEDIUM (150–200 words) — full STAR structure, concise
3. LONG (280–320 words) — full detail with context, stakeholders, and reflection
4. STRATEGIC (150–200 words) — emphasise judgment, priorities, and impact at scale
5. CONCISE (under 50 words) — one-breath version for follow-up pressure
6. EXECUTIVE (200–250 words) — strategic framing, leadership signal, board-level language

Format each: === VARIANT: [name] ===\n[content]`

  yield* streamClaude({
    task: 'story_variants',
    system: SYSTEM,
    prompt,
    maxTokens: 3000,
  })
}
