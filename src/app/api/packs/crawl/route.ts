import { NextResponse } from 'next/server'

// POST /api/packs/crawl — fetch and strip a job posting URL
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { url } = body

  if (!url || typeof url !== 'string' || !url.match(/^https?:\/\//i)) {
    return NextResponse.json({ error: 'A valid http(s) URL is required' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; InterviewMonkey/1.0; +https://interviewmonkey.io)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote server responded with ${res.status}` },
        { status: 502 },
      )
    }

    const html = await res.text()

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const pageTitle = titleMatch ? titleMatch[1].trim() : ''

    // Strip scripts, styles, and all HTML tags; collapse whitespace
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000)

    return NextResponse.json({ text, title: pageTitle, url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Could not fetch the URL: ${msg}` },
      { status: 502 },
    )
  }
}
