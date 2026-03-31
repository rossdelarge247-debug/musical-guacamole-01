/**
 * PRESSURE POINT ENGINE
 * Identifies candidate vulnerabilities and generates defense strategies.
 * Model: Claude Opus 4.6 (deep reasoning)
 */

import { callClaude } from '@/lib/ai/claude'
import type { CandidateProfile, CandidateGraphNode, PressurePoint } from '@/types'

const SYSTEM = `You are an expert interview strategist who helps candidates prepare for difficult questions.
Your job is to proactively identify vulnerabilities in a candidate's background and generate calm, strategic responses.
Be honest about risks — candidates are better served by realistic preparation than false reassurance.
Output valid JSON only. No markdown fences.`

export async function detectPressurePoints(
  profile: CandidateProfile,
  nodes: CandidateGraphNode[],
): Promise<Partial<PressurePoint>[]> {
  const prompt = `
Identify 2–5 likely pressure points in this candidate's background that an interviewer might probe.

CANDIDATE LEVEL: ${profile.level}
EXPERIENCE NODES:
${JSON.stringify(nodes, null, 2)}

For each pressure point return:
- type: gap|short_tenure|low_metrics|limited_leadership|apparent_pivot|domain_mismatch|title_mismatch|unexplained_departure|over_qualified
- title (short label)
- interviewer_concern (what a sceptical interviewer is actually thinking — be direct)
- severity: low|medium|high
- defense_line (the single most important thing to say — one sentence)
- recommended_framing (2–3 sentences of strategic framing — calm, confident, not defensive)
- proof_points (array of 1–3 specific things from the candidate's background that support the framing)
- bad_responses_to_avoid (array of 1–3 response patterns that would make things worse)
- drills (array of 2–3 follow-up questions an interviewer might ask, each with recommended_approach)
- interviewer_lenses (array of 1–2 role types who would be most concerned — e.g. "risk-averse line manager", "startup founder")

Return a JSON array.`

  const { content } = await callClaude({
    task: 'pressure_point_detection',
    system: SYSTEM,
    prompt,
    maxTokens: 3000,
  })

  try {
    return JSON.parse(content) as Partial<PressurePoint>[]
  } catch {
    return []
  }
}
