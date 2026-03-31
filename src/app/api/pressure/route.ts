import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'
import { detectPressurePoints } from '@/lib/ai/engines/pressure'

// POST /api/pressure — detect pressure points for the current user
export async function POST(request: Request) {
  try {
    const flags = getDemoFlags()

    if (flags.auth) {
      // No Supabase — caller supplies profile + nodes from localStorage
      const body = await request.json().catch(() => ({}))
      const { profile, nodes } = body

      if (!profile || !nodes?.length) {
        return NextResponse.json(
          { error: 'No CV data found. Upload your CV first.' },
          { status: 400 },
        )
      }

      const points = await detectPressurePoints(profile, nodes)
      return NextResponse.json({ points, demo: false })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'No profile found. Upload your CV first.' },
        { status: 404 },
      )
    }

    const { data: nodes } = await supabase
      .from('candidate_graph_nodes')
      .select('*')
      .eq('profile_id', profile.id)

    const points = await detectPressurePoints(profile, nodes ?? [])

    // Delete existing pressure points and replace with fresh analysis
    await supabase.from('pressure_points').delete().eq('profile_id', profile.id)
    const { data: saved } = await supabase
      .from('pressure_points')
      .insert(points.map((p) => ({ ...p, profile_id: profile.id })))
      .select()

    return NextResponse.json({ points: saved ?? points, demo: false })
  } catch (err) {
    console.error('Pressure point detection error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/pressure — fetch saved pressure points
export async function GET() {
  const flags = getDemoFlags()

  if (flags.auth) {
    // Client reads from localStorage — return empty to signal "not yet run"
    return NextResponse.json({ points: [] })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ points: [] })

  const { data: points } = await supabase
    .from('pressure_points')
    .select('*')
    .eq('profile_id', profile.id)
    .order('severity', { ascending: false })

  return NextResponse.json({ points: points ?? [] })
}
