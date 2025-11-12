import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    
    // Remove X-Frame-Options and CSP headers by modifying the HTML
    // This is a simple approach - in production you'd want more sophisticated handling
    let modifiedHtml = html
      .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')
      .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
      .replace(/X-Frame-Options[^;]*;?/gi, '')
      .replace(/Content-Security-Policy[^;]*;?/gi, '')

    // Add base tag to fix relative URLs
    const baseUrl = new URL(url)
    if (!modifiedHtml.includes('<base')) {
      modifiedHtml = modifiedHtml.replace(
        '<head>',
        `<head><base href="${baseUrl.origin}${baseUrl.pathname}">`
      )
    }

    return new NextResponse(modifiedHtml, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    )
  }
}

