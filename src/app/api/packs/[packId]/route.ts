import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'

// GET /api/packs/[packId]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params
  const flags = getDemoFlags()

  if (packId.startsWith('demo-')) {
    return NextResponse.json({ pack: getDemoPack(packId) })
  }

  if (packId.startsWith('local-')) {
    // Client-side only pack — client should load from localStorage
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (flags.auth) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: pack, error } = await supabase
    .from('job_packs')
    .select('*, stories(*), pressure_points(*)')
    .eq('id', packId)
    .eq('user_id', user.id)
    .single()

  if (error || !pack) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ pack })
}

// PATCH /api/packs/[packId] — update readiness scores etc.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params
  const body = await request.json()
  const flags = getDemoFlags()

  if (flags.auth) return NextResponse.json({ pack: { id: packId, ...body } })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: pack } = await supabase
    .from('job_packs')
    .update(body)
    .eq('id', packId)
    .eq('user_id', user.id)
    .select()
    .single()

  return NextResponse.json({ pack })
}

function getDemoPack(packId: string) {
  return {
    id: packId,
    title: 'Head of Product — FinovaTech',
    company: 'FinovaTech',
    role_level: 'senior',
    interview_type: 'mixed',
    created_at: new Date().toISOString(),
    opening_pitch:
      'I am a senior product leader with six years building B2B SaaS products at scale. My particular strength is translating complex technical constraints into commercially valuable user outcomes — I have done this most recently by leading an onboarding redesign that delivered 40% faster time-to-value and an 18% uplift in 30-day retention. I am drawn to this role because FinovaTech is solving a problem I genuinely believe matters, and the scope of the challenge matches where I want to grow.',
    inferred_priorities: [
      'Commercial growth through product-led acquisition',
      'Cross-functional leadership across engineering, design, and data',
      'Data-led product decisions at pace',
      'Stakeholder management across business units',
    ],
    target_signals: ['ownership', 'leadership', 'commercial_awareness', 'judgment', 'strategic_thinking'],
    vocabulary: [
      'product-led growth',
      'outcome-based roadmap',
      'north star metric',
      'discovery cadence',
      'activation rate',
      'retention loop',
    ],
    likely_questions: [
      {
        id: 'q1',
        text: 'Tell me about a time you had to align multiple stakeholders on a difficult product decision.',
        type: 'stakeholder',
        priority: 'high',
        why_likely: 'FinovaTech operates across 3 business units requiring heavy internal alignment.',
      },
      {
        id: 'q2',
        text: 'Describe a product you launched that did not perform as expected. What did you do?',
        type: 'failure',
        priority: 'high',
        why_likely: 'Senior roles test resilience and self-awareness under commercial pressure.',
      },
      {
        id: 'q3',
        text: 'How do you decide what not to build?',
        type: 'strategy',
        priority: 'high',
        why_likely: 'Prioritisation judgment is a key signal at senior level.',
      },
      {
        id: 'q4',
        text: 'What is your approach to building a product roadmap with limited engineering resource?',
        type: 'strategy',
        priority: 'medium',
        why_likely: 'FinovaTech is Series A with constrained headcount.',
      },
      {
        id: 'q5',
        text: 'Tell me about a time you influenced a decision without formal authority.',
        type: 'leadership',
        priority: 'medium',
        why_likely: 'Matrix structure means influence over authority is critical.',
      },
      {
        id: 'q6',
        text: 'How do you balance speed of delivery with quality?',
        type: 'strategy',
        priority: 'medium',
        why_likely: 'Series A companies face constant speed vs quality tension.',
      },
    ],
    readiness_scores: {},
    proof_point_ledger: [],
    mapped_story_ids: ['demo-story-1', 'demo-story-2', 'demo-story-3'],
    pressure_point_ids: ['pp-1', 'pp-2'],
  }
}
