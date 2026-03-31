import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'
import { mineStories } from '@/lib/ai/engines/story'

// POST /api/ai/stories — mine stories from candidate graph
export async function POST() {
  try {
    const flags = getDemoFlags()
    const supabase = await createClient()

    if (flags.auth) {
      return NextResponse.json({ stories: getDemoStories(), demo: true })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'No profile found' }, { status: 404 })

    const { data: nodes } = await supabase
      .from('candidate_graph_nodes')
      .select('*')
      .eq('profile_id', profile.id)

    const mined = await mineStories(profile, nodes ?? [])

    // Save to DB
    const { data: saved } = await supabase
      .from('stories')
      .insert(mined.map((s) => ({ ...s, profile_id: profile.id })))
      .select()

    return NextResponse.json({ stories: saved ?? mined, demo: false })
  } catch (err) {
    console.error('Story mining error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/ai/stories — fetch all stories for user
export async function GET() {
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ stories: getDemoStories() })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ stories: [] })

  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('profile_id', profile.id)
    .order('confidence_score', { ascending: false })

  return NextResponse.json({ stories: stories ?? [] })
}

function getDemoStories() {
  return [
    {
      id: 'demo-story-1',
      title: 'Onboarding Redesign',
      summary: 'Led cross-functional redesign of onboarding, reducing time-to-value by 40%.',
      context: 'Users were struggling with a 12-step onboarding flow that took on average 45 minutes to complete.',
      challenge: 'Three teams had conflicting priorities and no shared owner for the onboarding experience.',
      action: 'I mapped the full onboarding journey, identified the three biggest drop-off points, and ran a structured alignment session with engineering, design, and CS leads.',
      outcome: 'Shipped a new 5-step onboarding flow in 6 weeks. Time-to-value dropped 40%, 30-day retention rose 18%.',
      metric: '40% time-to-value reduction, 18% retention uplift',
      stakeholder_angle: 'Engineering initially resistant — I involved their lead early and gave them ownership of the technical architecture decision.',
      question_fit_tags: ['leadership', 'stakeholder', 'achievement', 'change'],
      signal_strengths: { ownership: 5, leadership: 4, judgment: 4, influence: 4, commercial_awareness: 3 },
      confidence_score: 0.92,
      is_overused: false,
      variants: [
        { mode: 'short', content: 'Led a cross-functional team to cut onboarding time by 40% and lift 30-day retention by 18% — by mapping drop-off points and aligning three resistant teams on a shared delivery plan.', word_count: 35 },
        { mode: 'medium', content: 'We had a 12-step onboarding flow that was losing users before they got value. Three teams owned different parts of it with no shared accountability. I mapped the full journey, identified the top three drop-off points, and ran a structured alignment session. We shipped a new 5-step flow in 6 weeks — time-to-value dropped 40%, retention went up 18%.', word_count: 65 },
      ],
    },
    {
      id: 'demo-story-2',
      title: 'API v2 Failure and Recovery',
      summary: 'Launched without sufficient validation, reverted, and rebuilt with a customer co-design process.',
      context: 'Under pressure to ship, I pushed a major API change without adequate customer testing.',
      challenge: 'The v2 API broke integrations for 12 enterprise customers within 48 hours of launch.',
      action: 'I personally called all 12 affected customers, owned the failure publicly to leadership, coordinated an emergency rollback, and built a new validation process involving 5 customer partners in the redesign.',
      outcome: 'Trust recovered within 6 weeks. The co-designed v2 shipped 3 months later with zero integration issues.',
      metric: '12 customers affected, 0 churned, v2 shipped with zero integration issues',
      stakeholder_angle: 'CEO was directly involved — I kept him informed at every stage rather than managing upward after the fact.',
      question_fit_tags: ['failure', 'resilience', 'self_awareness', 'stakeholder'],
      signal_strengths: { ownership: 5, self_awareness: 5, resilience: 4, judgment: 3 },
      confidence_score: 0.88,
      is_overused: false,
      variants: [],
    },
    {
      id: 'demo-story-3',
      title: 'Analytics Product Launch',
      summary: 'Owned end-to-end launch of a new analytics module, generating £180k in first-year incremental ARR.',
      context: 'Customers were exporting data to build their own reports — a signal we were leaving value on the table.',
      challenge: 'No dedicated analytics team — I had to build the product with borrowed engineering time across two sprints.',
      action: 'I ran 15 customer discovery calls, prioritised 3 core reports based on frequency and willingness-to-pay signals, and shipped an MVP in 8 weeks.',
      outcome: 'The analytics module drove £180k in incremental ARR in year one and became our second most cited purchase reason.',
      metric: '£180k incremental ARR year one',
      stakeholder_angle: 'Sales were initially sceptical — I showed them early customer feedback and a revenue projection that converted them into advocates.',
      question_fit_tags: ['achievement', 'commercial', 'leadership', 'strategy'],
      signal_strengths: { commercial_awareness: 5, ownership: 5, decisiveness: 4, strategic_thinking: 4 },
      confidence_score: 0.94,
      is_overused: false,
      variants: [],
    },
  ]
}
