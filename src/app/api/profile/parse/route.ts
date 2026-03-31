import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDemoFlags } from '@/lib/demo/flags'
import { env, keyStatus } from '@/lib/env'
import Anthropic from '@anthropic-ai/sdk'
import type { GraphNodeType } from '@/types'

// ─── PDF extraction ───────────────────────────────────────────────────────────

async function extractText(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return file.text()
  }

  if (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = ((await import('pdf-parse')) as any).default ?? (await import('pdf-parse'))
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await pdfParse(buffer)
    return result.text
  }

  // DOCX — extract raw text from zip XML (no extra dep needed)
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    const { unzipSync } = await import('fflate')
    const buffer = new Uint8Array(await file.arrayBuffer())
    const unzipped = unzipSync(buffer)
    const wordDoc = unzipped['word/document.xml']
    if (!wordDoc) throw new Error('Could not read DOCX document.xml')
    const xml = new TextDecoder().decode(wordDoc)
    // Strip XML tags, collapse whitespace
    return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // Fallback: try reading as text
  return file.text()
}

// ─── Streaming helpers ────────────────────────────────────────────────────────

function encodeEvent(data: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data) + '\n')
}

const PARSE_SYSTEM = `You are an expert CV and career analyst extracting a structured professional profile.

Output ONLY valid JSON — no markdown fences, no commentary before or after.

The JSON must match this exact schema:
{
  "headline": "one crisp sentence summarising who this person is professionally",
  "skills": ["up to 20 concrete skills, tools, or competencies"],
  "parsing_confidence": 0.0 to 1.0,
  "nodes": [
    {
      "type": "role|project|achievement|proof_point|stakeholder|decision|failure|lesson|signal",
      "title": "concise title",
      "description": "1-2 sentence description of what happened and why it mattered",
      "context": "brief situational context or null",
      "date_from": "YYYY-MM or null",
      "date_to": "YYYY-MM or null",
      "organisation": "company or organisation name or null",
      "metrics": ["any quantified outcomes, e.g. '40% reduction in churn'"],
      "tags": ["2-5 lowercase thematic tags"],
      "confidence": 0.0 to 1.0
    }
  ]
}

Extract EVERYTHING — every role, achievement, project, failure, lesson, signal. Be thorough.
Do NOT invent anything not present in the text. If a field has no value, use null or [].`

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const flags = getDemoFlags()

  // ── Auth check ──
  let userId = 'demo-user'
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  if (!flags.auth) {
    supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    userId = user.id
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Run processing async so we can return the stream immediately
  ;(async () => {
    try {
      // ── Debug: emit env var status as first event ──
      await writer.write(
        encodeEvent({
          type: 'debug',
          ai_demo: flags.ai,
          auth_demo: flags.auth,
          anthropic_key: keyStatus(env.ANTHROPIC_API_KEY),
        }),
      )

      // ── Extract text ──
      await writer.write(
        encodeEvent({ type: 'status', message: 'Reading your document…' }),
      )

      let cvText = ''
      const contentType = request.headers.get('content-type') ?? ''

      if (contentType.includes('multipart/form-data')) {
        const form = await request.formData()
        const file = form.get('file') as File | null
        const pastedText = form.get('text') as string | null

        if (pastedText) {
          cvText = pastedText
        } else if (file) {
          await writer.write(
            encodeEvent({
              type: 'status',
              message: `Extracting text from ${file.name}…`,
            }),
          )
          try {
            cvText = await extractText(file)
          } catch (e) {
            await writer.write(
              encodeEvent({
                type: 'error',
                message: `Could not read file: ${e instanceof Error ? e.message : 'unknown error'}. Try pasting your CV text instead.`,
              }),
            )
            await writer.close()
            return
          }
        }
      } else {
        // Legacy JSON body (paste mode)
        const body = await request.json().catch(() => ({}))
        cvText = body.text ?? ''
      }

      if (!cvText.trim()) {
        await writer.write(
          encodeEvent({ type: 'error', message: 'No text could be extracted from your CV.' }),
        )
        await writer.close()
        return
      }

      const wordCount = cvText.trim().split(/\s+/).length
      await writer.write(
        encodeEvent({
          type: 'status',
          message: `Extracted ${wordCount.toLocaleString()} words — passing to Claude…`,
        }),
      )

      // ── Demo mode: return fixture with simulated streaming ──
      if (flags.ai) {
        const steps = [
          { type: 'status', message: 'Scanning career history…' },
          { type: 'found', category: 'Role', value: 'Senior Product Manager · Demo Corp' },
          { type: 'found', category: 'Achievement', value: 'Onboarding redesign — 40% time-to-value reduction' },
          { type: 'found', category: 'Failure / Learning', value: 'API v2 launch without validation — recovered in 6 weeks' },
          { type: 'found', category: 'Proof point', value: 'Analytics module — £180k incremental ARR' },
          { type: 'status', message: 'Extracting skills and signals…' },
          { type: 'status', message: 'Building Candidate Graph…' },
        ]
        for (const step of steps) {
          await writer.write(encodeEvent(step))
          await new Promise((r) => setTimeout(r, 600))
        }
        const demoResult = {
          profile: { id: 'demo-profile', user_id: userId, headline: 'Experienced product leader with a track record of cross-functional delivery and commercial impact', skills: ['Product Strategy', 'Stakeholder Management', 'Data Analysis', 'Agile Delivery', 'Commercial Awareness'], level: 'mid', parsing_confidence: 0.87 },
          nodes: [],
          summary: { nodeCount: 4, roleCount: 1, achievementCount: 2, skillCount: 5 },
          demo: true,
        }
        await writer.write(encodeEvent({ type: 'complete', data: demoResult }))
        await writer.close()
        return
      }

      // ── Real Claude call ──
      await writer.write(
        encodeEvent({ type: 'status', message: 'Claude is reading your CV…' }),
      )

      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY() })
      let fullResponse = ''

      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: PARSE_SYSTEM,
          messages: [
            {
              role: 'user',
              content: `Extract a complete structured profile from this CV.\n\nCV TEXT:\n${cvText}`,
            },
          ],
        })

        let lastProgressAt = 0
        const emittedDiscoveries = new Set<string>()

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullResponse += event.delta.text

            // Throttle: scan for NEW discoveries every 800ms
            const now = Date.now()
            if (now - lastProgressAt > 800) {
              lastProgressAt = now
              for (const discovery of extractNewDiscoveries(fullResponse, emittedDiscoveries)) {
                await writer.write(encodeEvent({ type: 'found', ...discovery }))
              }
            }
          }
        }
      } catch (aiErr) {
        await writer.write(
          encodeEvent({
            type: 'error',
            message: `Claude API error: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`,
          }),
        )
        await writer.close()
        return
      }

      // ── Parse final JSON ──
      await writer.write(
        encodeEvent({ type: 'status', message: 'Building your Candidate Graph…' }),
      )

      let parsed: {
        headline: string
        skills: string[]
        parsing_confidence: number
        nodes: {
          type?: string
          title?: string
          description?: string
          context?: string
          date_from?: string | null
          date_to?: string | null
          organisation?: string | null
          metrics?: string[]
          tags?: string[]
          confidence?: number
        }[]
      }

      try {
        // Strip any accidental markdown fences
        const clean = fullResponse
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim()
        parsed = JSON.parse(clean)
      } catch {
        await writer.write(
          encodeEvent({
            type: 'error',
            message: `Could not parse Claude's response as JSON. Raw output (first 400 chars): ${fullResponse.slice(0, 400)}`,
          }),
        )
        await writer.close()
        return
      }

      // ── Persist or return ──
      if (flags.auth) {
        const nodeCount = parsed.nodes?.length ?? 0
        const roleCount = parsed.nodes?.filter((n) => n.type === 'role').length ?? 0
        const achievementCount = parsed.nodes?.filter((n) => n.type === 'achievement').length ?? 0
        await writer.write(
          encodeEvent({
            type: 'complete',
            data: {
              profile: {
                id: 'demo-profile',
                user_id: userId,
                headline: parsed.headline,
                skills: parsed.skills,
                level: 'mid',
                parsing_confidence: parsed.parsing_confidence,
              },
              nodes: parsed.nodes.map((n, i) => ({
                ...n,
                id: `demo-node-${i}`,
                profile_id: 'demo-profile',
              })),
              summary: { nodeCount, roleCount, achievementCount, skillCount: parsed.skills?.length ?? 0 },
              demo: false,
            },
          }),
        )
        await writer.close()
        return
      }

      // Save to Supabase
      const { data: profile, error: profileError } = await supabase!
        .from('candidate_profiles')
        .upsert(
          {
            user_id: userId,
            raw_cv_text: cvText,
            headline: parsed.headline,
            skills: parsed.skills,
            level: 'mid',
            parsing_confidence: parsed.parsing_confidence,
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single()

      if (profileError || !profile) {
        await writer.write(
          encodeEvent({ type: 'error', message: `Failed to save profile: ${profileError?.message}` }),
        )
        await writer.close()
        return
      }

      const nodesToInsert = (parsed.nodes ?? []).map((n) => ({
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

      const { data: nodes, error: nodesError } = await supabase!
        .from('candidate_graph_nodes')
        .insert(nodesToInsert)
        .select()

      if (nodesError) {
        console.error('Nodes insert error:', nodesError.message)
      }

      // If Supabase insert failed, fall back to the parsed nodes so
      // localStorage still gets populated with real Claude output.
      const savedNodes = nodes ?? nodesToInsert.map((n, i) => ({
        ...n,
        id: `local-node-${profile.id}-${i}`,
        profile_id: profile.id,
        created_at: new Date().toISOString(),
      }))

      await writer.write(
        encodeEvent({
          type: 'complete',
          data: {
            profile,
            nodes: savedNodes,
            summary: {
              nodeCount: savedNodes.length,
              roleCount: savedNodes.filter((n) => n.type === 'role').length,
              achievementCount: savedNodes.filter((n) => n.type === 'achievement').length,
              skillCount: parsed.skills?.length ?? 0,
            },
            demo: false,
          },
        }),
      )
      await writer.close()
    } catch (err) {
      console.error('CV parse error:', err)
      try {
        await writer.write(
          encodeEvent({
            type: 'error',
            message: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
          }),
        )
        await writer.close()
      } catch {}
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

// ── Partial JSON scraper — finds all new discoveries as Claude writes ─────────
function extractNewDiscoveries(
  partial: string,
  emitted: Set<string>,
): Array<{ category: string; value: string }> {
  const results: Array<{ category: string; value: string }> = []

  function emit(category: string, value: string) {
    const key = `${category}:${value}`
    if (!emitted.has(key)) {
      emitted.add(key)
      results.push({ category, value })
    }
  }

  // Headline — emitted once
  for (const m of partial.matchAll(/"headline"\s*:\s*"([^"]{20,})"/g)) {
    emit('Profile', m[1])
  }

  // Role nodes — title only (organisation often repeated in the title itself)
  for (const m of partial.matchAll(/"type"\s*:\s*"role"[\s\S]*?"title"\s*:\s*"([^"]+)"/g)) {
    // Try to also get organisation if present without duplicating
    const orgMatch = partial.slice(m.index ?? 0, (m.index ?? 0) + 300)
      .match(/"organisation"\s*:\s*"([^"]+)"/)
    const title = m[1]
    const org = orgMatch?.[1]
    // Only append org if it doesn't already appear in the title
    const value = org && !title.includes(org) ? `${title} · ${org}` : title
    emit('Role', value)
  }

  // Achievement nodes
  for (const m of partial.matchAll(/"type"\s*:\s*"achievement"[\s\S]*?"title"\s*:\s*"([^"]+)"/g)) {
    emit('Achievement', m[1])
  }

  // Failure / lesson nodes
  for (const m of partial.matchAll(/"type"\s*:\s*"failure"[\s\S]*?"title"\s*:\s*"([^"]+)"/g)) {
    emit('Learning', m[1])
  }

  // Proof points
  for (const m of partial.matchAll(/"type"\s*:\s*"proof_point"[\s\S]*?"title"\s*:\s*"([^"]+)"/g)) {
    emit('Proof point', m[1])
  }

  // Decisions
  for (const m of partial.matchAll(/"type"\s*:\s*"decision"[\s\S]*?"title"\s*:\s*"([^"]+)"/g)) {
    emit('Decision', m[1])
  }

  return results
}
