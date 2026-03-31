import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'

// GET /api/profile/graph — fetch all graph nodes for the current user
export async function GET() {
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ nodes: getDemoNodes() })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ nodes: [] })

  const { data: nodes } = await supabase
    .from('candidate_graph_nodes')
    .select('*')
    .eq('profile_id', profile.id)
    .order('date_from', { ascending: false })

  return NextResponse.json({ nodes: nodes ?? [] })
}

// PATCH /api/profile/graph — bulk update verification status
export async function PATCH(request: Request) {
  const { nodeIds, user_verified } = await request.json()
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ updated: nodeIds.length })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await supabase
    .from('candidate_graph_nodes')
    .update({ user_verified })
    .in('id', nodeIds)

  return NextResponse.json({ updated: nodeIds.length })
}

function getDemoNodes() {
  return [
    {
      id: 'demo-node-1',
      type: 'role',
      title: 'Senior Product Manager',
      description: 'Led product strategy for a B2B SaaS platform with 40k+ users.',
      organisation: 'TechCorp Ltd',
      date_from: '2022-03',
      date_to: null,
      metrics: ['40k+ users', '£2.4M ARR', '18% retention uplift'],
      tags: ['product', 'b2b', 'saas'],
      confidence: 0.95,
      user_verified: false,
    },
    {
      id: 'demo-node-2',
      type: 'achievement',
      title: 'Onboarding Redesign',
      description: 'Led cross-functional team to redesign the onboarding flow, reducing time-to-value by 40%.',
      organisation: 'TechCorp Ltd',
      date_from: '2023-01',
      date_to: '2023-06',
      metrics: ['40% time-to-value reduction', '18% 30-day retention uplift'],
      tags: ['leadership', 'cross-functional', 'product'],
      confidence: 0.92,
      user_verified: false,
    },
    {
      id: 'demo-node-3',
      type: 'role',
      title: 'Product Manager',
      description: 'Owned the data and analytics product line. Managed two direct reports.',
      organisation: 'StartupCo',
      date_from: '2020-06',
      date_to: '2022-02',
      metrics: ['2 direct reports', '3 product launches'],
      tags: ['product', 'analytics', 'management'],
      confidence: 0.89,
      user_verified: false,
    },
    {
      id: 'demo-node-4',
      type: 'failure',
      title: 'Failed launch — v2 API',
      description: 'Launched v2 API without sufficient customer validation. Reverted after 3 weeks.',
      organisation: 'StartupCo',
      date_from: '2021-09',
      date_to: '2021-10',
      metrics: [],
      tags: ['failure', 'lesson', 'validation'],
      confidence: 0.80,
      user_verified: false,
    },
    {
      id: 'demo-node-5',
      type: 'proof_point',
      title: 'Stakeholder alignment — 3 resistant departments',
      description: 'Aligned engineering, legal, and customer success on a shared delivery plan in 2 weeks.',
      organisation: 'TechCorp Ltd',
      date_from: '2023-03',
      date_to: null,
      metrics: ['3 departments aligned', '2-week timeline'],
      tags: ['stakeholder', 'influence', 'leadership'],
      confidence: 0.91,
      user_verified: false,
    },
  ]
}
