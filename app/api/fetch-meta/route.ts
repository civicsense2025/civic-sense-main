import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as cheerio from 'cheerio'
import { URL } from 'url'

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

interface SourceData {
  name: string
  url: string
}

// Cache for storing processed metadata
const metadataCache = new Map<string, { data: MetaData; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// Helper function to resolve relative URLs
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href
  } catch {
    return relative
  }
}

// Helper function to extract domain info
function extractDomainInfo(url: string): { domain: string; hasHttps: boolean } {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    const hasHttps = urlObj.protocol === 'https:'
    return { domain, hasHttps }
  } catch {
    throw new Error('Invalid URL')
  }
}

// Enhanced HTML entity decoder
function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  
  // Use cheerio's built-in decoding
  const $ = cheerio.load(`<div>${text}</div>`)
  return $('div').text().trim()
}

// Extract metadata using cheerio (more reliable than regex)
function extractMetadata(html: string, url: string): MetaData {
  const $ = cheerio.load(html)
  const { domain } = extractDomainInfo(url)

  // Extract various meta tags
  const getMetaContent = (names: string[]): string | undefined => {
    for (const name of names) {
      const content = $(`meta[property="${name}"]`).attr('content') ||
                     $(`meta[name="${name}"]`).attr('content') ||
                     $(`meta[property="${name.toLowerCase()}"]`).attr('content') ||
                     $(`meta[name="${name.toLowerCase()}"]`).attr('content')
      if (content) return decodeHtmlEntities(content)
    }
    return undefined
  }

  // Title extraction priority
  const title = getMetaContent(['og:title', 'twitter:title']) || 
                $('title').text().trim() || 
                $('h1').first().text().trim() ||
                domain.charAt(0).toUpperCase() + domain.slice(1)

  // Description extraction priority
  const description = getMetaContent(['og:description', 'twitter:description', 'description']) || 
                      $('meta[name="description"]').attr('content') ||
                      $('p').first().text().trim().substring(0, 200) ||
                      `Visit ${domain} for more information`

  // Image extraction with URL resolution
  let image = getMetaContent(['og:image', 'twitter:image', 'og:image:url'])
  if (image) {
    image = resolveUrl(url, image)
  }

  // Favicon extraction
  let favicon = $('link[rel="icon"]').attr('href') ||
                $('link[rel="shortcut icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href')
  if (favicon) {
    favicon = resolveUrl(url, favicon)
  } else {
    favicon = `${new URL(url).origin}/favicon.ico`
  }

  // Extract additional metadata
  const siteName = getMetaContent(['og:site_name', 'application-name']) || domain
  const type = getMetaContent(['og:type']) || 'website'
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || url
  const author = getMetaContent(['author', 'article:author', 'twitter:creator'])
  const publishedTime = getMetaContent(['article:published_time', 'datePublished'])
  const modifiedTime = getMetaContent(['article:modified_time', 'dateModified'])
  const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim())
  const language = $('html').attr('lang') || getMetaContent(['og:locale']) || 'en'

  // Extract JSON-LD structured data if available
  const jsonLdScripts = $('script[type="application/ld+json"]')
  let structuredData: any = null
  jsonLdScripts.each((_, script) => {
    try {
      const data = JSON.parse($(script).html() || '{}')
      if (data['@type'] === 'Article' || data['@type'] === 'NewsArticle') {
        structuredData = data
      }
    } catch {}
  })

  // Use structured data as fallback
  if (structuredData) {
    return {
      title: structuredData.headline || title,
      description: structuredData.description || description,
      domain,
      url,
      image: structuredData.image?.url || structuredData.image || image || null,
      siteName: structuredData.publisher?.name || siteName || null,
      type: structuredData['@type'] || type || null,
      favicon: favicon || null,
      canonicalUrl: canonicalUrl || null,
      author: structuredData.author?.name || author || null,
      publishedTime: structuredData.datePublished || publishedTime || null,
      modifiedTime: structuredData.dateModified || modifiedTime || null,
      keywords,
      language: language || null
    }
  }

  // Truncate if too long
  const truncatedTitle = title.length > 200 ? title.substring(0, 197) + '...' : title
  const truncatedDescription = description.length > 500 ? description.substring(0, 497) + '...' : description

  return {
    title: truncatedTitle,
    description: truncatedDescription,
    domain,
    url,
    image: image || null,
    siteName: siteName || null,
    type: type || null,
    favicon: favicon || null,
    canonicalUrl: canonicalUrl || null,
    author: author || null,
    publishedTime: publishedTime || null,
    modifiedTime: modifiedTime || null,
    keywords,
    language: language || null
  }
}

// Batch save metadata to database
async function saveMetadataToDatabase(url: string, metadata: MetaData, responseTime: number, fetchStatus: string = 'success', fetchError?: string) {
  try {
    const { domain, hasHttps } = extractDomainInfo(url)

    const { data, error } = await supabase
      .from('source_metadata')
      .upsert({
        url,
        title: metadata.title,
        description: metadata.description,
        domain,
        og_title: metadata.title,
        og_description: metadata.description,
        og_image: metadata.image,
        og_site_name: metadata.siteName,
        og_type: metadata.type,
        favicon_url: metadata.favicon,
        canonical_url: metadata.canonicalUrl,
        language: metadata.language,
        has_https: hasHttps,
        is_accessible: fetchStatus === 'success',
        fetch_status: fetchStatus,
        fetch_error: fetchError,
        response_time_ms: responseTime,
        last_fetched_at: new Date().toISOString()
      }, {
        onConflict: 'url'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving metadata to database:', error)
      return null
    }

    // Remove from fetch queue
    await supabase
      .from('source_fetch_queue')
      .delete()
      .eq('url', url)

    console.log(`✅ Saved metadata to database for ${url}`)
    return data
  } catch (error) {
    console.error('Error in saveMetadataToDatabase:', error)
    return null
  }
}

// Process sources from question explanations
async function extractAndSaveSourcesFromQuestionInternal(questionId: string, explanation: string, sources: SourceData[]) {
  const uniqueUrls = new Set<string>()
  
  // Extract URLs from explanation
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
  const matches = explanation.match(urlRegex) || []
  matches.forEach(url => uniqueUrls.add(url.trim()))
  
  // Add explicitly provided sources
  sources.forEach(source => {
    if (source.url) uniqueUrls.add(source.url.trim())
  })

  // Process each unique URL
  const promises = Array.from(uniqueUrls).map(async (url) => {
    try {
      // Check cache first
      const cached = metadataCache.get(url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        await linkQuestionToSource(questionId, url, cached.data)
        return
      }

      // Fetch metadata
      const response = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        const metadata = await response.json()
        metadataCache.set(url, { data: metadata, timestamp: Date.now() })
        await linkQuestionToSource(questionId, url, metadata)
      }
    } catch (error) {
      console.error(`Error processing source ${url}:`, error)
    }
  })

  await Promise.all(promises)
}

// Link question to source
async function linkQuestionToSource(questionId: string, url: string, metadata: MetaData) {
  try {
    // First ensure source metadata exists
    const { data: sourceData } = await supabase
      .from('source_metadata')
      .select('id')
      .eq('url', url)
      .single()

    if (!sourceData) {
      const savedData = await saveMetadataToDatabase(url, metadata, 0)
      if (!savedData) return
    }

    // Get the source metadata ID again to ensure we have it
    const { data: finalSourceData } = await supabase
      .from('source_metadata')
      .select('id')
      .eq('url', url)
      .single()

    if (!finalSourceData) {
      console.error('Could not find or create source metadata')
      return
    }

    // Create the link
    await supabase
      .from('question_source_links')
      .upsert({
        question_id: questionId,
        source_metadata_id: finalSourceData.id,
        source_name: metadata.title,
        source_type: 'reference',
        is_primary_source: false,
        display_order: 0
      }, {
        onConflict: 'question_id,source_metadata_id'
      })
  } catch (error) {
    console.error('Error linking question to source:', error)
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { url, urls } = body // Support both single URL and batch processing

    // Batch processing
    if (urls && Array.isArray(urls)) {
      const results = await Promise.all(
        urls.map(async (url: string) => {
          try {
            return await fetchSingleUrl(url)
          } catch (error) {
            return {
              url,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      )
      return NextResponse.json({ results })
    }

    // Single URL processing
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const result = await fetchSingleUrl(url)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in fetch-meta API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fetch metadata for a single URL
async function fetchSingleUrl(url: string): Promise<MetaData> {
  const startTime = Date.now()
  
  // Check cache first
  const cached = metadataCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached metadata for ${url}`)
    return cached.data
  }

  // Check database for recent metadata
  const { data: existingMetadata } = await supabase
    .from('source_metadata')
    .select('*')
    .eq('url', url)
    .single()

  if (existingMetadata?.fetch_status === 'success' && existingMetadata.last_fetched_at) {
    const lastFetched = new Date(existingMetadata.last_fetched_at)
    const daysSinceLastFetch = (Date.now() - lastFetched.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceLastFetch < 7) {
      const metadata: MetaData = {
        title: existingMetadata.title,
        description: existingMetadata.description || '',
        domain: existingMetadata.domain,
        url,
        image: existingMetadata.og_image || null,
        siteName: existingMetadata.og_site_name || null,
        type: existingMetadata.og_type || null,
        favicon: existingMetadata.favicon_url || null,
        canonicalUrl: existingMetadata.canonical_url || null,
        language: existingMetadata.language || null
      }
      
      metadataCache.set(url, { data: metadata, timestamp: Date.now() })
      return metadata
    }
  }

  // Fetch fresh metadata
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivicSense/1.0; +https://civicsense.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow'
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const metadata = extractMetadata(html, url)

    // Save to database in background
    saveMetadataToDatabase(url, metadata, responseTime).catch(error => {
      console.error('Background save failed:', error)
    })

    // Update cache
    metadataCache.set(url, { data: metadata, timestamp: Date.now() })

    return metadata

  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error(`❌ Error fetching URL ${url}:`, error)

    // Save failed fetch
    const { domain } = extractDomainInfo(url)
    const fallbackMetadata: MetaData = {
      title: domain.charAt(0).toUpperCase() + domain.slice(1),
      description: `Visit ${domain} for more information`,
      domain,
      url
    }

    await saveMetadataToDatabase(url, fallbackMetadata, responseTime, 'failed', errorMessage)

    return fallbackMetadata
  }
}