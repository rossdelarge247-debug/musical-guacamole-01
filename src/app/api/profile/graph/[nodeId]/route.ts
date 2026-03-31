import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'

// PATCH /api/profile/graph/[nodeId] — update a single node
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  const { nodeId } = await params
  const body = await request.json()
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ node: { id: nodeId, ...body } })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: node, error } = await supabase
    .from('candidate_graph_nodes')
    .update(body)
    .eq('id', nodeId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ node })
}

// DELETE /api/profile/graph/[nodeId] — delete a node
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  const { nodeId } = await params
  const flags = getDemoFlags()

  if (flags.auth) {
    return NextResponse.json({ deleted: nodeId })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await supabase
    .from('candidate_graph_nodes')
    .delete()
    .eq('id', nodeId)

  return NextResponse.json({ deleted: nodeId })
}
