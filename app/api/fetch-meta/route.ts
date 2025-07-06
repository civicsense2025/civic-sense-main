// app/api/fetch-meta/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface MetaData {
  title: string
  description: string
  domain: string
  url: string
  image?: string | null
  siteName?: string | null
  type?: string | null
  favicon?: string | null
  canonicalUrl?: string | null
  author?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
  keywords?: string[]
  language?: string | null
}

// Simple HTML entity decoder without external dependencies
function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"'
  }
  
  let decoded = text
  
  // Handle numeric entities
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16))
    } catch {
      return match
    }
  })
  
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      const charCode = parseInt(num, 10)
      if (charCode >= 32 && charCode <= 126 || charCode >= 160) {
        return String.fromCharCode(charCode)
      }
      return match
    } catch {
      return match
    }
  })
  
  // Handle named entities
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement)
  }
  
  return decoded
}

// Extract meta content from HTML with multiple patterns
function extractMetaContent(html: string, property: string, attribute: 'property' | 'name' | 'itemprop' = 'property'): string | null {
  // Try multiple patterns to catch different formatting
  const patterns = [
    // Standard meta tags
    new RegExp(`<meta[^>]*${attribute}=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*${attribute}=['"]${property}['"][^>]*content=['"]([^'"]+)['"][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*content=['"]([^'"]+)['"][^>]*${attribute}=['"]${property}['"][^>]*>`, 'i'),
    // Handle spaces and different quote styles
    new RegExp(`<meta\\s+${attribute}\\s*=\\s*["']${property}["']\\s+content\\s*=\\s*["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+content\\s*=\\s*["']([^"']+)["']\\s+${attribute}\\s*=\\s*["']${property}["'][^>]*>`, 'i')
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim())
    }
  }
  
  return null
}

// Extract title from HTML
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1].trim())
  }
  return null
}

// Resolve relative URLs to absolute
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href
  } catch {
    return relative
  }
}

// Extract favicon URL
function extractFavicon(html: string, baseUrl: string): string | null {
  // Try various favicon patterns
  const patterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["'][^>]*>/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']shortcut icon["'][^>]*>/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return resolveUrl(baseUrl, match[1])
    }
  }
  
  // Default favicon path
  try {
    const url = new URL(baseUrl)
    return `${url.origin}/favicon.ico`
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { url } = body
    
    console.log('[fetch-meta] Processing request for:', url)
    
    if (!url || typeof url !== 'string') {
      console.error('[fetch-meta] Invalid URL provided:', url)
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    // Parse URL to get domain
    let domain: string
    let urlObj: URL
    try {
      urlObj = new URL(url)
      domain = urlObj.hostname.replace('www.', '')
    } catch (error) {
      console.error('[fetch-meta] Invalid URL format:', url, error)
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    try {
      console.log('[fetch-meta] Fetching content from:', url)
      
      // Fetch the webpage with comprehensive headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000) // 20 seconds timeout
      })
      
      console.log('[fetch-meta] Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      console.log('[fetch-meta] Content-Type:', contentType)
      
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        console.warn('[fetch-meta] Non-HTML content type:', contentType)
      }
      
      const html = await response.text()
      console.log('[fetch-meta] HTML length:', html.length)
      
      // Extract all metadata
      const ogTitle = extractMetaContent(html, 'og:title')
      const ogDescription = extractMetaContent(html, 'og:description')
      const ogImage = extractMetaContent(html, 'og:image')
      const ogSiteName = extractMetaContent(html, 'og:site_name')
      const ogType = extractMetaContent(html, 'og:type')
      
      // Twitter Card fallbacks
      const twitterTitle = extractMetaContent(html, 'twitter:title', 'name')
      const twitterDescription = extractMetaContent(html, 'twitter:description', 'name')
      const twitterImage = extractMetaContent(html, 'twitter:image', 'name')
      
      // Standard meta tags
      const metaDescription = extractMetaContent(html, 'description', 'name')
      const metaAuthor = extractMetaContent(html, 'author', 'name')
      const metaKeywords = extractMetaContent(html, 'keywords', 'name')
      
      // Article metadata - Enhanced date extraction
      const articlePublished = extractMetaContent(html, 'article:published_time') || 
                              extractMetaContent(html, 'datePublished', 'name') ||
                              extractMetaContent(html, 'publishdate', 'name') ||
                              extractMetaContent(html, 'publish_date', 'name') ||
                              extractMetaContent(html, 'date', 'name') ||
                              extractMetaContent(html, 'pubdate', 'name') ||
                              extractMetaContent(html, 'publication_date', 'name') ||
                              extractMetaContent(html, 'created_time', 'name') ||
                              extractMetaContent(html, 'timestamp', 'name') ||
                              // Schema.org structured data
                              extractMetaContent(html, 'datePublished', 'itemprop') ||
                              extractMetaContent(html, 'publishDate', 'itemprop') ||
                              // Additional OpenGraph patterns
                              extractMetaContent(html, 'article:published') ||
                              extractMetaContent(html, 'og:article:published_time') ||
                              // News-specific patterns
                              extractMetaContent(html, 'sailthru.date', 'name') ||
                              extractMetaContent(html, 'parsely-pub-date', 'name') ||
                              extractMetaContent(html, 'DC.date.issued', 'name') ||
                              extractMetaContent(html, 'DC.Date', 'name')
                              
      const articleModified = extractMetaContent(html, 'article:modified_time') || 
                             extractMetaContent(html, 'dateModified', 'name') ||
                             extractMetaContent(html, 'lastmod', 'name') ||
                             extractMetaContent(html, 'last_modified', 'name') ||
                             extractMetaContent(html, 'updated_time', 'name') ||
                             extractMetaContent(html, 'modified_time', 'name') ||
                             // Schema.org structured data
                             extractMetaContent(html, 'dateModified', 'itemprop') ||
                             extractMetaContent(html, 'modifiedDate', 'itemprop') ||
                             // Additional OpenGraph patterns
                             extractMetaContent(html, 'article:modified') ||
                             extractMetaContent(html, 'og:article:modified_time') ||
                             // Additional patterns
                             extractMetaContent(html, 'DC.date.modified', 'name')
                             
      const articleAuthor = extractMetaContent(html, 'article:author') ||
                           extractMetaContent(html, 'author', 'name') ||
                           extractMetaContent(html, 'article:author:name') ||
                           extractMetaContent(html, 'sailthru.author', 'name') ||
                           extractMetaContent(html, 'parsely-author', 'name') ||
                           extractMetaContent(html, 'DC.creator', 'name') ||
                           extractMetaContent(html, 'twitter:creator', 'name') ||
                           // Schema.org structured data
                           extractMetaContent(html, 'author', 'itemprop') ||
                           extractMetaContent(html, 'creator', 'itemprop')
      
      // Extract title
      const htmlTitle = extractTitle(html)
      
      // Extract favicon
      const favicon = extractFavicon(html, url)
      
      // Extract canonical URL
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
      const canonicalUrl = canonicalMatch ? resolveUrl(url, canonicalMatch[1]) : url
      
      // Extract language
      const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["'][^>]*>/i)
      const language = langMatch ? langMatch[1] : extractMetaContent(html, 'og:locale') || 'en'
      
      // Resolve image URLs to absolute
      let image = ogImage || twitterImage
      if (image) {
        image = resolveUrl(url, image)
      }
      
      // Determine the best values
      const title = ogTitle || twitterTitle || htmlTitle || domain.charAt(0).toUpperCase() + domain.slice(1)
      const description = ogDescription || twitterDescription || metaDescription || `Visit ${domain} for more information`
      const siteName = ogSiteName || domain.charAt(0).toUpperCase() + domain.slice(1)
      const author = articleAuthor || metaAuthor || null
      const keywords = metaKeywords ? metaKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
      
      // Truncate if too long
      const truncatedTitle = title.length > 200 ? title.substring(0, 197) + '...' : title
      const truncatedDescription = description.length > 500 ? description.substring(0, 497) + '...' : description
      
      const responseTime = Date.now() - startTime
      
      const metadata: MetaData = {
        title: truncatedTitle,
        description: truncatedDescription,
        domain,
        url,
        image: image || null,
        siteName,
        type: ogType || 'website',
        favicon,
        canonicalUrl,
        author,
        publishedTime: articlePublished || null,
        modifiedTime: articleModified || null,
        keywords: keywords.length > 0 ? keywords : undefined,
        language
      }
      
      console.log('[fetch-meta] Successfully extracted metadata:', {
        ...metadata,
        description: metadata.description.substring(0, 100) + '...'
      })
      console.log(`[fetch-meta] Completed in ${responseTime}ms`)
      
      return NextResponse.json(metadata)
      
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      console.error('[fetch-meta] Error fetching URL:', url, fetchError)
      
      // Return fallback data even on error
      const fallbackMetadata: MetaData = {
        title: domain.charAt(0).toUpperCase() + domain.slice(1),
        description: `Visit ${domain} for more information`,
        domain,
        url,
        favicon: `${urlObj.origin}/favicon.ico`
      }
      
      console.log('[fetch-meta] Returning fallback metadata')
      return NextResponse.json(fallbackMetadata)
    }
    
  } catch (error) {
    console.error('[fetch-meta] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({
      message: 'Meta fetching API is working! Send a POST request with { url: "https://example.com" }',
      endpoint: '/api/fetch-meta',
      method: 'POST',
      example: {
        url: 'https://example.com/article'
      }
    })
  }
  
  // Allow GET requests for testing
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url })
  }))
}