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
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
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
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message.includes('timeout'))
    const error = isTimeout
      ? 'That site took too long to respond (or blocks automated access). Copy the job description text and paste it directly instead.'
      : `Could not fetch the URL — try copying and pasting the text directly.`
    return NextResponse.json({ error, canPaste: true }, { status: 502 })
  }
}
