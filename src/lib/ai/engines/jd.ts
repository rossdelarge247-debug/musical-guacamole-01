/**
 * JD & ROLE INTELLIGENCE ENGINE
 * Interprets the target role beyond keywords — infers priorities, competencies,
 * hidden success criteria, and maps them to the candidate's evidence.
 * Model: Claude Opus 4.6 (deep reasoning)
 */

import { callClaude } from '@/lib/ai/claude'
import type {
  Story,
  PressurePoint,
  CandidateProfile,
  CandidateGraphNode,
  LikelyQuestion,
  SignalType,
} from '@/types'

const SYSTEM = `You are a senior talent strategist and interview preparation expert.
Your job is to analyse job descriptions deeply — beyond surface keywords — to understand what the role
actually requires, what signals will be evaluated, and how a specific candidate's background maps to it.
Output valid JSON only. No markdown fences.`

export interface ExperienceCardPrompt {
  node_id: string
  node_title: string
  node_type: string
  relevance_score: number        // 0–1 how relevant this node is to this role
  focus_points: string[]         // 2–3 specific things to emphasise from this experience
  story_prompt: string           // A specific story angle to develop for this role
  zoom_in_areas: string[]        // What interviewers will want more detail on
  defend_areas: string[]         // Things to pre-empt or be ready to justify
}

export interface JDAnalysis {
  inferred_priorities: string[]
  likely_competencies: string[]
  hidden_success_criteria: string[]
  expected_signals: SignalType[]
  likely_objection_zones: string[]
  likely_questions: LikelyQuestion[]
  vocabulary: string[]
  opening_pitch: string
  // New fields
  match_score: number                          // 0–100 overall fit %
  match_rationale: string                      // One sentence explaining the score
  overlap_areas: string[]                      // 3–5 where candidate maps well
  gap_areas: string[]                          // 2–4 gaps or risks
  gap_filling_tips: string[]                   // Matching tips for each gap
  experience_card_prompts: ExperienceCardPrompt[]  // Per-node coaching
}

export async function analyseJD(
  jdText: string,
  profile: CandidateProfile,
  stories: Story[],
  pressurePoints: PressurePoint[],
  nodes?: CandidateGraphNode[],
): Promise<JDAnalysis> {
  const nodesSummary = nodes && nodes.length > 0
    ? nodes
        .filter((n) => ['role', 'achievement', 'proof_point', 'project', 'failure'].includes(n.type))
        .map((n) => `[${n.id}] ${n.type}: ${n.title} — ${n.description?.slice(0, 120)} (org: ${n.organisation ?? 'n/a'})`)
        .join('\n')
    : 'No nodes provided'

  const prompt = `
Analyse this job description and map it to the candidate's background.

JOB DESCRIPTION:
${jdText}

CANDIDATE LEVEL: ${profile.level}
CANDIDATE HEADLINE: ${profile.headline ?? 'Not provided'}
CANDIDATE SKILLS: ${profile.skills?.join(', ') ?? 'Not provided'}
CANDIDATE STORIES (titles only): ${stories.map((s) => s.title).join(', ') || 'None'}
CANDIDATE PRESSURE POINTS: ${pressurePoints.map((p) => p.type).join(', ') || 'None'}

CANDIDATE EXPERIENCE NODES:
${nodesSummary}

Return JSON with exactly these keys:
- inferred_priorities: array of 4–6 real priorities behind this role (not just keywords)
- likely_competencies: array of 5–8 competencies likely to be assessed
- hidden_success_criteria: array of 2–4 things not in the JD but crucial for success
- expected_signals: array of SignalType values the interviewer will be listening for
- likely_objection_zones: array of 2–3 areas where the candidate's background may raise concern
- likely_questions (array of 10–14 objects):
    - id: generate a UUID-style string
    - text: the question
    - type: behavioural|competency|leadership|strategy|situational|pressure|motivational|failure|conflict|ambiguity|achievement|stakeholder|change|commercial
    - priority: high|medium|low
    - why_likely: one sentence explaining why this question is likely for THIS specific role and candidate combo
    - best_story_id: null
- vocabulary: array of 6–10 role-specific terms the candidate should weave into answers naturally
- opening_pitch: a 3–4 sentence elevator pitch tailored to this specific role and candidate
- match_score: integer 0–100 representing overall candidate fit for this role
- match_rationale: one sentence explaining what drives the score (honest, specific)
- overlap_areas: array of 3–5 specific areas where the candidate's background maps well to this role
- gap_areas: array of 2–4 gaps, risks, or areas the candidate may be questioned on
- gap_filling_tips: array of tips matching each gap_area (same length) — specific, actionable advice for the interview
- experience_card_prompts: array of objects (one per relevant experience node, skip irrelevant ones):
    - node_id: the id from the experience nodes list above
    - node_title: the title from the node
    - node_type: the type from the node
    - relevance_score: 0.0–1.0 float
    - focus_points: array of 2–3 specific things to emphasise from this experience for this role
    - story_prompt: a specific story angle to develop and practise for this interview
    - zoom_in_areas: array of 1–2 aspects interviewers will probe for more detail
    - defend_areas: array of 0–2 things to be ready to pre-empt or justify (empty array if nothing to defend)`

  const { content } = await callClaude({
    task: 'jd_deep_analysis',
    system: SYSTEM,
    prompt,
    maxTokens: 4000,
  })

  try {
    return JSON.parse(content) as JDAnalysis
  } catch {
    return {
      inferred_priorities: [],
      likely_competencies: [],
      hidden_success_criteria: [],
      expected_signals: [],
      likely_objection_zones: [],
      likely_questions: [],
      vocabulary: [],
      opening_pitch: '',
      match_score: 0,
      match_rationale: '',
      overlap_areas: [],
      gap_areas: [],
      gap_filling_tips: [],
      experience_card_prompts: [],
    }
  }
}

export async function generateAnswerDraft(
  questionText: string,
  questionType: string,
  storyTitle: string,
  storyContent: string,
  proofPoints: string[],
  candidateLevel: string,
): Promise<string> {
  const prompt = `
Generate a strong draft interview answer.

QUESTION: ${questionText}
QUESTION TYPE: ${questionType}
CANDIDATE LEVEL: ${candidateLevel}

STORY TO USE: ${storyTitle}
STORY DETAIL: ${storyContent}
PROOF POINTS: ${proofPoints.join(' | ')}

Write a ${candidateLevel}-appropriate answer using the story and proof points.
- Use first person ("I"), not "we"
- Lead with the most relevant part, not the background
- End with the outcome and what you learned or would do again
- 150–200 words
- No generic phrases like "I am a team player"

Return plain text only — no labels, no markdown.`

  const { content } = await callClaude({
    task: 'answer_generation',
    system: SYSTEM,
    prompt,
    maxTokens: 512,
  })

  return content
}

export async function transformAnswer(
  answerText: string,
  mode: string,
  candidateLevel: string,
): Promise<string> {
  const instructions: Record<string, string> = {
    more_concise: 'Reduce to 60% of the length without losing impact. Cut context, keep evidence.',
    more_strategic: 'Reframe to emphasise judgment, priorities, and business impact. Add one strategic insight.',
    more_direct: 'Cut the warm-up. Start with the action or outcome. Remove hedging language.',
    more_natural: 'Make it sound like something a real person would say in conversation. Reduce corporate language.',
    more_evidence: 'Add or strengthen the proof points. Make the metric or outcome more specific.',
    more_executive: 'Raise the register. Use precise, authoritative language. Emphasise leadership and scale.',
    simpler_english: 'Simplify vocabulary and sentence structure. Make every sentence clear on first read.',
    less_corporate: 'Remove jargon, buzzwords, and corporate phrases. Use plain, direct language.',
  }

  const instruction = instructions[mode] ?? 'Improve the answer quality.'

  const prompt = `Transform this interview answer: ${instruction}

ORIGINAL ANSWER: ${answerText}
CANDIDATE LEVEL: ${candidateLevel}

Return only the transformed answer — no labels, no markdown, no explanation.`

  const { content } = await callClaude({
    task: 'answer_transform',
    system: `You are an expert interview writing coach. Transform answers precisely as instructed. Never add fluff. Output plain text only.`,
    prompt,
    maxTokens: 512,
  })

  return content
}
