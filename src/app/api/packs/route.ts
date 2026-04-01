import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'
import { analyseJD } from '@/lib/ai/engines/jd'
import { mineStories } from '@/lib/ai/engines/story'
import { detectPressurePoints } from '@/lib/ai/engines/pressure'
import { researchOrg } from '@/lib/ai/engines/org'
import type { Story, PressurePoint, CandidateProfile, CandidateGraphNode } from '@/types'

const VALID_LEVELS = ['graduate', 'early', 'mid', 'senior', 'director', 'executive'] as const
type CandidateLevel = typeof VALID_LEVELS[number]

function sanitiseLevel(raw: string | undefined | null): CandidateLevel {
  if (raw && VALID_LEVELS.includes(raw as CandidateLevel)) return raw as CandidateLevel
  return 'mid'
}

// POST /api/packs — create a new Interview Pack from a JD
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jd_raw, title, company, role_level, interview_type, profile: clientProfile, nodes: clientNodes } = body

    if (!jd_raw?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
    }

    const flags = getDemoFlags()

    let userId = 'demo-user'
    let profile: CandidateProfile
    let nodes: CandidateGraphNode[]
    let stories: Story[]
    let pressurePoints: PressurePoint[]
    // supabase is only initialised when Supabase is configured (flags.auth === false)
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null

    if (flags.auth) {
      // No Supabase — use caller-supplied profile/nodes from localStorage
      profile = clientProfile ?? getDemoProfile()
      nodes = clientNodes ?? getDemoNodes()
      stories = [] as Story[]
      pressurePoints = [] as PressurePoint[]
    } else {
      supabase = await createClient()
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      userId = user.id

      const { data: p } = await supabase!
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!p) return NextResponse.json({ error: 'Build your profile first' }, { status: 400 })
      profile = p

      const { data: n } = await supabase!
        .from('candidate_graph_nodes')
        .select('*')
        .eq('profile_id', p.id)
      nodes = n ?? []

      const { data: s } = await supabase!
        .from('stories')
        .select('*')
        .eq('profile_id', p.id)
      stories = s ?? []

      const { data: pp } = await supabase!
        .from('pressure_points')
        .select('*')
        .eq('profile_id', p.id)
      pressurePoints = pp ?? []
    }

    // Run AI engines in parallel
    const [jdAnalysis, minedStories, detectedPressure, orgIntel] = await Promise.all([
      analyseJD(jd_raw, profile, stories, pressurePoints, nodes),
      stories.length === 0 ? mineStories(profile, nodes) : Promise.resolve([]),
      pressurePoints.length === 0 ? detectPressurePoints(profile, nodes) : Promise.resolve([]),
      researchOrg(jd_raw, company ?? null),
    ])

    if (flags.auth) {
      // No Supabase — return in-memory pack (real AI analysis, no DB persistence)
      return NextResponse.json({
        pack: {
          id: `local-pack-${Date.now()}`,
          user_id: userId,
          title: title || `${company || 'Role'} — Interview Pack`,
          company: company || null,
          jd_raw,
          role_level: sanitiseLevel(role_level),
          interview_type: interview_type || 'mixed',
          ...jdAnalysis,
          org_intel: orgIntel,
          mapped_story_ids: [],
          pressure_point_ids: [],
          proof_point_ledger: [],
          readiness_scores: {},
          created_at: new Date().toISOString(),
        },
        stories: minedStories,
        pressure_points: detectedPressure,
        demo: false,
      })
    }

    // Save new stories if mined
    let storyIds: string[] = stories.map((s) => s.id)
    if (minedStories.length > 0) {
      const { data: savedStories } = await supabase!
        .from('stories')
        .insert(minedStories.map((s) => ({ ...s, profile_id: profile.id })))
        .select('id')
      storyIds = (savedStories ?? []).map((s) => s.id)
    }

    // Save pressure points if detected
    let ppIds: string[] = pressurePoints.map((p) => p.id)
    if (detectedPressure.length > 0) {
      const { data: savedPP } = await supabase!
        .from('pressure_points')
        .insert(detectedPressure.map((p) => ({ ...p, profile_id: profile.id })))
        .select('id')
      ppIds = (savedPP ?? []).map((p) => p.id)
    }

    // Create the pack
    const { data: pack, error } = await supabase!
      .from('job_packs')
      .insert({
        user_id: userId,
        profile_id: profile.id,
        title: title || `${company || 'Role'} — Interview Pack`,
        company: company || null,
        jd_raw,
        role_level: sanitiseLevel(role_level),
        interview_type: interview_type || 'mixed',
        inferred_priorities: jdAnalysis.inferred_priorities,
        likely_questions: jdAnalysis.likely_questions,
        target_signals: jdAnalysis.expected_signals,
        vocabulary: jdAnalysis.vocabulary,
        answer_priorities: jdAnalysis.hidden_success_criteria,
        opening_pitch: jdAnalysis.opening_pitch,
        match_score: jdAnalysis.match_score,
        match_rationale: jdAnalysis.match_rationale,
        overlap_areas: jdAnalysis.overlap_areas,
        gap_areas: jdAnalysis.gap_areas,
        gap_filling_tips: jdAnalysis.gap_filling_tips,
        experience_card_prompts: jdAnalysis.experience_card_prompts,
        org_intel: orgIntel,
        mapped_story_ids: storyIds,
        pressure_point_ids: ppIds,
        proof_point_ledger: [],
        readiness_scores: {},
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ pack, demo: false })
  } catch (err) {
    console.error('Pack creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/packs — list all packs for the user
export async function GET() {
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ packs: [] })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase!.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: packs } = await supabase!
    .from('job_packs')
    .select('id, title, company, role_level, interview_type, created_at, readiness_scores')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ packs: packs ?? [] })
}

function getDemoProfile(): CandidateProfile {
  return {
    id: 'demo-profile',
    user_id: 'demo-user',
    raw_cv_text: null,
    level: 'mid',
    headline: 'Senior Product Manager with 6 years in B2B SaaS',
    skills: ['product strategy', 'stakeholder management', 'data analysis', 'agile'],
    language_profile: null,
    parsing_confidence: 0.9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function getDemoNodes(): CandidateGraphNode[] {
  return []
}
