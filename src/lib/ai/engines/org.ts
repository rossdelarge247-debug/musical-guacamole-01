/**
 * ORG INTELLIGENCE ENGINE
 * Extracts cultural signals, sentiment, and key intel from a job description.
 * Tells the candidate what they need to know *before* the interview.
 * Model: Claude Haiku (fast, sufficient for this extraction task)
 */

import { callClaude } from '@/lib/ai/claude'

const SYSTEM = `You are an expert recruiter and organisational psychologist.
Given a job description and company name, extract intelligence about the organisation and role
that a candidate should know before their interview.
Output valid JSON only. No markdown fences.`

export interface OrgIntelligence {
  key_intel: string[]             // 3–5 important things to know about role/org
  culture_signals: string[]       // 2–3 inferred culture traits from language/tone
  sentiment: 'positive' | 'neutral' | 'cautious'
  sentiment_reason: string        // One sentence explaining the sentiment
  what_they_care_about: string[]  // 2–3 things that REALLY matter to this team
  red_flags: string[]             // 0–2 potential concerns to be aware of (empty if none)
}

export async function researchOrg(
  jdText: string,
  company: string | null,
): Promise<OrgIntelligence> {
  const prompt = `
Analyse this job description to extract organisational intelligence.

${company ? `COMPANY: ${company}` : ''}
JOB DESCRIPTION:
${jdText.slice(0, 4000)}

Return JSON with these exact keys:
- key_intel: array of 3–5 specific, actionable things the candidate should know before this interview (not generic advice)
- culture_signals: array of 2–3 culture traits you can infer from the language, tone, and what is emphasised
- sentiment: "positive" | "neutral" | "cautious" — based on what the JD signals about the role/team health
- sentiment_reason: one sentence explaining the sentiment reading
- what_they_care_about: array of 2–3 things that clearly matter most to this team/organisation (read between the lines)
- red_flags: array of 0–2 things a savvy candidate should probe on (e.g. vague scope, high churn signals, unrealistic expectations) — empty array if nothing notable`

  const { content, demo } = await callClaude({
    task: 'org_intelligence',
    system: SYSTEM,
    prompt,
    maxTokens: 1200,
  })

  if (demo) {
    return getDemoOrgIntelligence(company)
  }

  try {
    return JSON.parse(content) as OrgIntelligence
  } catch {
    return getDemoOrgIntelligence(company)
  }
}

function getDemoOrgIntelligence(company: string | null): OrgIntelligence {
  const co = company ?? 'this company'
  return {
    key_intel: [
      `${co} is scaling fast — expect to own decisions with limited process support`,
      'The role has a high cross-functional footprint; internal relationships will matter as much as output',
      'They emphasise "commercial awareness" — be ready to speak to revenue and cost impact',
      'The team is rebuilding after a period of churn — bringing structure will be welcomed',
    ],
    culture_signals: [
      'Move-fast, high ownership culture',
      'Data-informed but intuition is respected at senior level',
      'Direct communication style — they will reward candour',
    ],
    sentiment: 'positive',
    sentiment_reason:
      'The JD reads with energy and clarity — this is a well-scoped role at a team that knows what they want.',
    what_they_care_about: [
      'Shipping things that actually move metrics',
      'People who take ownership without being told',
      'Commercial instinct alongside product craft',
    ],
    red_flags: [
      '"Wear many hats" — scope may be broader than the title suggests',
    ],
  }
}
