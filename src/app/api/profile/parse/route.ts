import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/ai/claude'
import { getDemoFlags } from '@/lib/demo/flags'
import type { CandidateGraphNode, GraphNodeType } from '@/types'

const PARSE_SYSTEM = `You are an expert CV analyst. Extract a structured professional profile from the candidate's CV or profile text.
Output valid JSON only. No markdown fences. Be thorough — extract every role, achievement, metric, and signal you can find.
Never invent information not present in the text.`

export async function POST(request: Request) {
  try {
    const { text, level } = await request.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No profile text provided' }, { status: 400 })
    }

    const flags = getDemoFlags()
    const supabase = await createClient()

    // Get authenticated user (or demo user)
    let userId = 'demo-user'
    if (!flags.auth) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      userId = user.id
    }

    // --- AI: Parse CV into profile + graph nodes ---
    const { content: profileJson } = await callClaude({
      task: 'candidate_graph_extraction',
      system: PARSE_SYSTEM,
      prompt: `Extract a complete structured profile from this CV/profile text.

TEXT:
${text}

Return JSON with:
{
  "headline": "one-line professional summary",
  "skills": ["skill1", "skill2", ...],
  "parsing_confidence": 0.0–1.0,
  "nodes": [
    {
      "type": "role|project|achievement|proof_point|stakeholder|decision|failure|lesson|signal",
      "title": "...",
      "description": "...",
      "context": "...",
      "date_from": "YYYY-MM or null",
      "date_to": "YYYY-MM or null",
      "organisation": "... or null",
      "metrics": ["quantified metric 1", ...],
      "tags": ["tag1", ...],
      "confidence": 0.0–1.0
    }
  ]
}`,
      maxTokens: 4096,
    })

    let parsed: {
      headline: string
      skills: string[]
      parsing_confidence: number
      nodes: Partial<CandidateGraphNode>[]
    }

    try {
      parsed = JSON.parse(profileJson)
    } catch {
      return NextResponse.json(
        { error: `AI response was not valid JSON. Raw response: ${profileJson.slice(0, 300)}` },
        { status: 500 },
      )
    }

    if (flags.auth) {
      // Demo mode — return parsed data without DB write
      return NextResponse.json({
        profile: {
          id: 'demo-profile',
          user_id: userId,
          headline: parsed.headline,
          skills: parsed.skills,
          level: level ?? 'mid',
          parsing_confidence: parsed.parsing_confidence,
        },
        nodes: parsed.nodes.map((n, i) => ({ ...n, id: `demo-node-${i}`, profile_id: 'demo-profile' })),
        demo: true,
      })
    }

    // --- Upsert profile ---
    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .upsert({
        user_id: userId,
        raw_cv_text: text,
        headline: parsed.headline,
        skills: parsed.skills,
        level: level ?? 'mid',
        parsing_confidence: parsed.parsing_confidence,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    // --- Insert graph nodes ---
    const nodesToInsert = parsed.nodes.map((n) => ({
      profile_id: profile.id,
      type: (n.type ?? 'achievement') as GraphNodeType,
      title: n.title ?? 'Untitled',
      description: n.description ?? '',
      context: n.context ?? null,
      date_from: n.date_from ?? null,
      date_to: n.date_to ?? null,
      organisation: n.organisation ?? null,
      metrics: n.metrics ?? [],
      tags: n.tags ?? [],
      confidence: n.confidence ?? 0.8,
      user_verified: false,
    }))

    const { data: nodes } = await supabase
      .from('candidate_graph_nodes')
      .insert(nodesToInsert)
      .select()

    return NextResponse.json({ profile, nodes: nodes ?? [], demo: false })
  } catch (err) {
    console.error('CV parse error:', err)
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Internal server error: ${detail}` }, { status: 500 })
  }
}
