/**
 * JD & ROLE INTELLIGENCE ENGINE
 * Interprets the target role beyond keywords — infers priorities, competencies,
 * hidden success criteria, and maps them to the candidate's evidence.
 * Model: Claude Opus 4.6 (deep reasoning)
 */

import { callClaude } from '@/lib/ai/claude'
import type {
  JobPack,
  Story,
  PressurePoint,
  CandidateProfile,
  LikelyQuestion,
  SignalType,
} from '@/types'

const SYSTEM = `You are a senior talent strategist and interview preparation expert.
Your job is to analyse job descriptions deeply — beyond surface keywords — to understand what the role
actually requires, what signals will be evaluated, and how a specific candidate's background maps to it.
Output valid JSON only. No markdown fences.`

export interface JDAnalysis {
  inferred_priorities: string[]
  likely_competencies: string[]
  hidden_success_criteria: string[]
  expected_signals: SignalType[]
  likely_objection_zones: string[]
  likely_questions: LikelyQuestion[]
  vocabulary: string[]
  opening_pitch: string
}

export async function analyseJD(
  jdText: string,
  profile: CandidateProfile,
  stories: Story[],
  pressurePoints: PressurePoint[],
): Promise<JDAnalysis> {
  const prompt = `
Analyse this job description and map it to the candidate's background.

JOB DESCRIPTION:
${jdText}

CANDIDATE LEVEL: ${profile.level}
CANDIDATE STORIES (titles only): ${stories.map((s) => s.title).join(', ')}
CANDIDATE PRESSURE POINTS: ${pressurePoints.map((p) => p.type).join(', ')}

Return JSON with:
- inferred_priorities: array of 4–6 real priorities behind this role (not just keywords)
- likely_competencies: array of 5–8 competencies likely to be assessed
- hidden_success_criteria: array of 2–4 things not in the JD but crucial for success
- expected_signals: array of SignalType values the interviewer will be listening for
- likely_objection_zones: array of 2–3 areas where the candidate's background may raise concern
- likely_questions (array of 8–12 objects):
    - id: generate a UUID-style string
    - text: the question
    - type: behavioural|competency|leadership|strategy|situational|pressure|motivational|failure|conflict|ambiguity|achievement|stakeholder|change|commercial
    - priority: high|medium|low
    - why_likely: one sentence explaining why this question is likely for this role
    - best_story_id: null (system will match later)
- vocabulary: array of 6–10 role-specific terms the candidate should weave into answers naturally
- opening_pitch: a 3–4 sentence elevator pitch tailored to this specific role and candidate`

  const { content } = await callClaude({
    task: 'jd_deep_analysis',
    system: SYSTEM,
    prompt,
    maxTokens: 3000,
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
