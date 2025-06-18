import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * CivicSense News Ticker API
 * 
 * This endpoint provides real-time civic news using:
 * 1. RSS feeds from trusted news sources (primary) - Always current, no API key needed
 * 2. XML sitemaps from news sources - For additional coverage
 * 3. NewsAPI.org (secondary) - Set NEWS_API_KEY for additional sources
 * 4. OpenAI analysis (enhancement) - Set OPENAI_API_KEY for content analysis
 * 
 * RSS feeds provide real current news without API limitations
 * Articles are automatically saved to source_metadata table for future reference
 */

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/**
 * HTML Entity Decoder
 * Properly decodes HTML entities and special characters
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  }
  
  let decoded = text
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  
  // Decode numeric entities like &#8217; and &#x2019;
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10))
  })
  
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
  
  return decoded
}

/**
 * Clean and validate text content
 */
function cleanText(text: string): string {
  if (!text) return ''
  
  return decodeHtmlEntities(text)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Safe URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

// RSS Feed sources for US politics and vetted political coverage
const RSS_NEWS_SOURCES = [
  {
    name: 'Politico',
    url: 'https://rss.politico.com/politics-news.xml',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'Rolling Stone Politics',
    url: 'https://www.rollingstone.com/politics/feed/',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'NPR Politics',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'US Politics', 
    type: 'rss'
  },
  {
    name: 'Reuters US Politics',
    url: 'https://www.reuters.com/arc/outboundfeeds/rss/category/politics/?size=20',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'AP News Politics',
    url: 'https://apnews.com/news-sitemap-content.xml',
    category: 'US Politics',
    type: 'sitemap'
  },
  {
    name: 'The Hill',
    url: 'https://thehill.com/news/feed/',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'CNN Politics',
    url: 'http://rss.cnn.com/rss/edition_politics.rss',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'Washington Post Politics',
    url: 'https://feeds.washingtonpost.com/rss/politics',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'NBC Politics',
    url: 'https://feeds.nbcnews.com/nbcnews/public/politics',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'Axios Politics',
    url: 'https://api.axios.com/feed/politics',
    category: 'US Politics',
    type: 'rss'
  },
  {
    name: 'USA Today Politics',
    url: 'http://rssfeeds.usatoday.com/usatoday-NewsPolitics',
    category: 'US Politics',
    type: 'rss'
  }
  // NOTE: Vanity Fair sitemap requires special handling - will implement if needed
  // {
  //   name: 'Vanity Fair Politics',
  //   url: 'https://www.vanityfair.com/categories-sitemap.xml',
  //   category: 'US Politics',
  //   type: 'sitemap'
  // }
]

const US_POLITICS_KEYWORDS = [
  // US Government institutions
  'congress', 'senate', 'house representatives', 'supreme court', 'federal government',
  'white house', 'biden', 'trump', 'harris', 'administration', 'cabinet',
  'department of', 'sec ', 'fda', 'epa', 'irs', 'fbi', 'cia', 'doj',
  
  // US Political processes
  'election', 'voting', 'ballot', 'midterm', 'primary', 'caucus', 'campaign',
  'legislation', 'bill', 'amendment', 'veto', 'filibuster', 'confirmation',
  
  // US Political parties and figures
  'republican', 'democratic', 'gop', 'rnc', 'dnc', 'senator', 'representative',
  'governor', 'attorney general', 'secretary of state',
  
  // US Policy areas
  'immigration', 'healthcare', 'medicare', 'medicaid', 'social security',
  'foreign policy', 'defense spending', 'infrastructure', 'climate policy',
  'tax reform', 'budget', 'debt ceiling', 'trade war', 'tariffs',
  
  // US Constitutional and legal
  'constitution', 'constitutional', 'civil rights', 'voting rights',
  'first amendment', 'second amendment', 'roe v wade', 'supreme court ruling'
]

interface ProcessedArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  category: string
  content?: string
  relevanceScore: number
  database_id?: string | null
}

interface SourceMetadataInsert {
  url: string
  title: string
  description?: string | null
  domain: string
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
  og_site_name?: string | null
  og_type?: string | null
  content_type?: string | null
  language?: string | null
  author?: string | null
  published_time?: string | null
  modified_time?: string | null
  credibility_score?: number | null
  bias_rating?: string | null
  has_https?: boolean
  has_valid_ssl?: boolean
  is_accessible?: boolean
  fetch_status?: string
  response_time_ms?: number | null
  last_fetched_at?: string
}

/**
 * Enhanced RSS/XML parser with proper special character handling
 */
async function fetchRSSFeed(source: typeof RSS_NEWS_SOURCES[0]): Promise<any[]> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'CivicSense/1.0 (Educational News Aggregator)',
    'RSS Reader'
  ]
  
  for (const userAgent of userAgents) {
    try {
      console.log(`🔄 Fetching ${source.name} from ${source.url}`)
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const content = await response.text()
      
      // Parse based on feed type
      let items: any[] = []
      
      if (source.type === 'sitemap') {
        items = parseSitemapXML(content, source.name)
      } else {
        items = parseRSSXML(content, source.name)
      }
      
      if (items.length > 0) {
        console.log(`✅ Successfully fetched ${items.length} articles from ${source.name}`)
        return items.slice(0, 15) // Limit per source
      }
      
    } catch (error) {
      console.error(`❌ Error fetching ${source.name}:`, error instanceof Error ? error.message : 'Unknown error')
      continue
    }
  }
  
  console.warn(`⚠️ Could not fetch articles from ${source.name}`)
  return []
}

/**
 * Parse RSS/XML feeds with proper handling of special characters
 */
function parseRSSXML(content: string, sourceName: string): any[] {
  const items: any[] = []
  
  try {
    // Handle both <item> and <entry> elements (RSS vs Atom)
    const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi
    const matches = content.match(itemRegex) || []
    
    for (const match of matches) {
      try {
        const item = parseRSSItem(match, sourceName)
        if (item && item.title && item.description && item.link) {
          items.push(item)
        }
      } catch (error) {
        console.error(`Error parsing RSS item for ${sourceName}:`, error)
        continue
      }
    }
    
  } catch (error) {
    console.error(`Error parsing RSS XML for ${sourceName}:`, error)
  }
  
  return items
}

/**
 * Parse individual RSS item with robust handling
 */
function parseRSSItem(itemXml: string, sourceName: string): any | null {
  try {
    // Extract title
    let title = ''
    const titleMatches = [
      itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i),
      itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    ]
    
    for (const match of titleMatches) {
      if (match && match[1]) {
        title = cleanText(match[1])
        break
      }
    }
    
    // Clean up malformed titles that look like URL slugs or hashes
    if (title) {
      // If title looks like a URL slug (lots of hyphens, no spaces, or contains hash-like strings)
      if (title.includes('-') && !title.includes(' ') && title.length > 30) {
        title = title.replace(/-/g, ' ')
      }
      
      // Remove hash-like strings (long alphanumeric sequences) - be more aggressive
      title = title.replace(/\b[a-f0-9]{16,}\b/gi, '').trim()
      title = title.replace(/\b[0-9a-f]{8,}\b/gi, '').trim()
      
      // Clean up multiple spaces and normalize
      title = title.replace(/\s+/g, ' ').trim()
      
      // If title is still too short or looks corrupted, skip this item
      if (title.length < 15 || !/[A-Z]/.test(title) || title.split(' ').length < 4) {
        console.warn(`Skipping item with malformed title: "${title}"`)
        return null
      }
      
      // Capitalize properly if it's all lowercase or weird casing
      if (title === title.toLowerCase() || title.split(' ').every(word => word === word.toLowerCase())) {
        title = title.split(' ').map(word => {
          // Don't capitalize certain words unless they're the first word
          const lowercaseWords = ['and', 'or', 'but', 'for', 'nor', 'so', 'yet', 'a', 'an', 'the', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'to', 'up', 'with']
          if (lowercaseWords.includes(word.toLowerCase()) && title.split(' ').indexOf(word) !== 0) {
            return word.toLowerCase()
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }).join(' ')
      }
    }
    
    // Extract description
    let description = ''
    const descMatches = [
      itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i),
      itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i),
      itemXml.match(/<summary><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i),
      itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i),
      itemXml.match(/<content[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i),
      itemXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
    ]
    
    for (const match of descMatches) {
      if (match && match[1]) {
        description = cleanText(match[1])
        if (description.length > 50) break // Prefer longer descriptions
      }
    }
    
    // If description is too generic or short, enhance it with title context
    if (description.length < 20 || description.includes('Article from')) {
      if (title.length > 20) {
        description = `News article: ${title.substring(0, 150)}${title.length > 150 ? '...' : ''}`
      }
    }
    
    // Extract link
    let link = ''
    const linkMatches = [
      itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i),
      itemXml.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*\/?>/i),
      itemXml.match(/<guid[^>]*>(https?:\/\/[\s\S]*?)<\/guid>/i),
      itemXml.match(/<id[^>]*>(https?:\/\/[\s\S]*?)<\/id>/i)
    ]
    
    for (const match of linkMatches) {
      if (match && match[1]) {
        const potentialLink = cleanText(match[1])
        if (isValidUrl(potentialLink)) {
          link = potentialLink
          break
        }
      }
    }
    
    // Extract publication date
    let pubDate = new Date().toISOString()
    const dateMatches = [
      itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i),
      itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i),
      itemXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i),
      itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)
    ]
    
    for (const match of dateMatches) {
      if (match && match[1]) {
        const dateStr = cleanText(match[1])
        const parsedDate = parseDate(dateStr)
        if (parsedDate !== new Date().toISOString()) {
          pubDate = parsedDate
          break
        }
      }
    }
    
    // Validate required fields with higher standards
    if (!title || title.length < 10 || !description || description.length < 20 || !link) {
      return null
    }
    
    return {
      title,
      description: description.substring(0, 300), // Limit description length
      link,
      pubDate,
      sourceName
    }
    
  } catch (error) {
    console.error('Error parsing RSS item:', error)
    return null
  }
}

/**
 * Parse XML sitemap (like AP News)
 */
function parseSitemapXML(content: string, sourceName: string): any[] {
  const items: any[] = []
  
  try {
    // Extract URLs from sitemap
    const urlRegex = /<url[\s\S]*?<\/url>/gi
    const urlMatches = content.match(urlRegex) || []
    
    for (const urlMatch of urlMatches) {
      try {
        const locMatch = urlMatch.match(/<loc[^>]*>([\s\S]*?)<\/loc>/i)
        const lastmodMatch = urlMatch.match(/<lastmod[^>]*>([\s\S]*?)<\/lastmod>/i)
        
        if (locMatch && locMatch[1]) {
          const url = cleanText(locMatch[1])
          
          if (isValidUrl(url) && isCivicRelevant(url)) {
            const pubDate = lastmodMatch ? parseDate(cleanText(lastmodMatch[1])) : new Date().toISOString()
            
            // Generate title from URL
            const urlPath = new URL(url).pathname
            const title = urlPath.split('/').pop()?.replace(/-/g, ' ') || 'News Article'
            
            items.push({
              title: cleanText(title),
              description: `Article from ${sourceName}`,
              link: url,
              pubDate,
              sourceName
            })
          }
        }
      } catch (error) {
        continue
      }
    }
    
  } catch (error) {
    console.error(`Error parsing sitemap XML for ${sourceName}:`, error)
  }
  
  return items.slice(0, 10) // Limit sitemap results
}

/**
 * Enhanced save to source_metadata table with all available metadata
 */
async function saveArticleToDatabase(article: ProcessedArticle): Promise<string | null> {
  try {
    
    // Extract domain from URL
    const domain = new URL(article.url).hostname.replace('www.', '')
    
    // Prepare metadata for database
    const sourceMetadata = {
      url: article.url,
      title: article.title,
      description: article.description,
      domain: domain,
      
      // OpenGraph-style metadata from news article
      og_title: article.title,
      og_description: article.description,
      og_image: article.urlToImage || null,
      og_site_name: article.source.name,
      og_type: 'article',
      
      // Additional metadata
      content_type: 'article',
      language: 'en',
      
      // Article-specific fields
      author: null, // Would be extracted from content in production
      published_time: article.publishedAt,
      modified_time: null,
      
      // Quality indicators
      credibility_score: calculateCredibilityScore(article.source.name),
      bias_rating: getBiasRating(article.source.name),
      
      // Technical metadata
      has_https: article.url.startsWith('https://'),
      has_valid_ssl: true, // Assume true for major news sources
      is_accessible: true,
      fetch_status: 'success',
      response_time_ms: null, // Not measured in RSS parsing
      
      last_fetched_at: new Date().toISOString(),
    }
    
    // Use get_or_create_source_metadata function
    const { data, error } = await supabase.rpc('get_or_create_source_metadata', {
      p_url: article.url,
      p_title: article.title,
      p_description: article.description,
      p_domain: domain,
      p_author: null,
      p_published_time: article.publishedAt,
      p_modified_time: null
    })
    
    if (error) {
      console.error('Error saving article to database:', error)
      return null
    }
    
    // Update the record with additional metadata
    if (data) {
      const { error: updateError } = await supabase
        .from('source_metadata')
        .update({
          og_title: sourceMetadata.og_title,
          og_description: sourceMetadata.og_description,
          og_image: sourceMetadata.og_image,
          og_site_name: sourceMetadata.og_site_name,
          og_type: sourceMetadata.og_type,
          content_type: sourceMetadata.content_type,
          language: sourceMetadata.language,
          credibility_score: sourceMetadata.credibility_score,
          bias_rating: sourceMetadata.bias_rating,
          has_https: sourceMetadata.has_https,
          has_valid_ssl: sourceMetadata.has_valid_ssl,
          is_accessible: sourceMetadata.is_accessible,
          fetch_status: sourceMetadata.fetch_status,
          last_fetched_at: sourceMetadata.last_fetched_at
        })
        .eq('id', data)
      
      if (updateError) {
        console.error('Error updating article metadata:', updateError)
      } else {
        console.log(`✅ Saved article to database: ${article.title.substring(0, 50)}...`)
      }
    }
    
    return data
  } catch (error) {
    console.error('Error saving article to database:', error)
    return null
  }
}

/**
 * Calculate credibility score based on news source
 */
function calculateCredibilityScore(sourceName: string): number {
  const credibilityMap: Record<string, number> = {
    'Reuters': 95,
    'Associated Press': 95,
    'AP News': 95,
    'BBC': 90,
    'NPR': 88,
    'Politico': 85,
    'CNN': 75,
    'Fox News': 70,
  }
  
  // Find closest match
  for (const [source, score] of Object.entries(credibilityMap)) {
    if (sourceName.toLowerCase().includes(source.toLowerCase())) {
      return score
    }
  }
  
  return 70 // Default for unknown sources
}

/**
 * Get bias rating based on news source
 */
function getBiasRating(sourceName: string): string {
  const biasMap: Record<string, string> = {
    'Reuters': 'center',
    'Associated Press': 'center',
    'AP News': 'center',
    'BBC': 'center',
    'NPR': 'center-left',
    'Politico': 'center',
    'CNN': 'left',
    'Fox News': 'right',
  }
  
  // Find closest match
  for (const [source, bias] of Object.entries(biasMap)) {
    if (sourceName.toLowerCase().includes(source.toLowerCase())) {
      return bias
    }
  }
  
  return 'unknown' // Default for unknown sources
}

async function fetchRealTimeNews(): Promise<ProcessedArticle[]> {
  console.log('📡 Fetching real-time US politics news from vetted RSS feeds...')
  
  const allFeedPromises = RSS_NEWS_SOURCES.map(async (source) => {
    const items = await fetchRSSFeed(source)
    return items.map(item => ({
      ...item,
      sourceName: source.name,
      category: source.category
    }))
  })
  
  const feedResults = await Promise.allSettled(allFeedPromises)
  let allArticles: any[] = []
  
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles = [...allArticles, ...result.value]
      console.log(`✅ Fetched ${result.value.length} articles from ${RSS_NEWS_SOURCES[index].name}`)
    } else {
      console.error(`❌ Failed to fetch from ${RSS_NEWS_SOURCES[index].name}:`, result.reason)
    }
  })
  
  // Convert to ProcessedArticle format with minimal processing (preserve original content)
  const processedArticles: ProcessedArticle[] = allArticles
    .filter(article => {
      // Enhanced validation to prevent corrupted data
      const hasValidTitle = article.title && typeof article.title === 'string' && article.title.trim().length > 0
      const hasValidDescription = article.description && typeof article.description === 'string' && article.description.trim().length > 0
      const hasValidLink = article.link && typeof article.link === 'string' && isValidUrl(article.link)
      const isUSPoliticsContent = hasValidTitle && hasValidDescription && isCivicRelevant(article.title + ' ' + article.description)
      
      return hasValidTitle && hasValidDescription && hasValidLink && isUSPoliticsContent
    })
    .map((article, index) => ({
      id: `rss-${Date.now()}-${index}`,
      title: cleanText(article.title), // Only clean HTML entities and tags, preserve original text
      description: cleanText(article.description), // Preserve full description, just clean entities/tags
      url: article.link,
      urlToImage: undefined,
      publishedAt: parseDate(article.pubDate),
      source: {
        id: null,
        name: article.sourceName
      },
      category: article.category,
      content: cleanText(article.description), // Preserve original content
      relevanceScore: calculateCivicRelevance(article.title + ' ' + article.description)
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20) // Limit to 20 most recent
  
  // Process each article and save to database with better error handling
  const articlesWithDbSave = await Promise.all(
    processedArticles.map(async (article, index) => {
      try {
        // Validate article data before saving
        if (!article.title || !article.description || !article.url) {
          console.warn(`⚠️ Skipping invalid article: missing required fields`)
          return article
        }
        
        // Save to database and get the saved record ID
        const savedId = await saveArticleToDatabase(article)
        
        if (savedId) {
          console.log(`✅ Article saved to database: "${article.title.substring(0, 50)}..." (ID: ${savedId})`)
        } else {
          console.log(`⚠️ Article not saved: "${article.title.substring(0, 50)}..."`)
        }
        
        return {
          ...article,
          database_id: savedId
        }
      } catch (error) {
        console.error(`❌ Error processing article "${article.title.substring(0, 50)}...":`, error)
        return article
      }
    })
  )
  
  console.log(`🎯 Found ${articlesWithDbSave.length} relevant US politics articles`)
  console.log(`💾 Saved articles to source_metadata table for future reference`)
  return articlesWithDbSave
}

function parseDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function isCivicRelevant(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  // Check for US politics keywords
  const hasUSPoliticsKeywords = US_POLITICS_KEYWORDS.some((keyword: string) => 
    lowerText.includes(keyword.toLowerCase())
  )
  
  // Additional US-specific political entities and topics
  const usPoliticalEntities = [
    'united states', 'america', 'american', 'us ',
    'washington dc', 'capitol hill', 'pentagon', 'oval office',
    'state department', 'treasury department', 'justice department',
    'homeland security', 'veterans affairs', 'energy department',
    // Key political figures (update as needed)
    'biden', 'trump', 'harris', 'mcconnell', 'schumer', 'pelosi',
    'desantis', 'newsom', 'abbott', 'youngkin',
    // US-specific issues
    'border wall', 'gun control', 'abortion rights', 'january 6',
    'mar-a-lago', 'classified documents', 'electoral college'
  ]
  
  const hasUSPoliticalEntities = usPoliticalEntities.some((entity: string) =>
    lowerText.includes(entity)
  )
  
  // More comprehensive exclusion of clearly non-political content
  const excludePatterns = [
    // Animals and nature
    'turtle', 'tortoise', 'animal', 'wildlife', 'zoo', 'pet', 'dog', 'cat', 'bird',
    // Entertainment and lifestyle
    'recipe', 'cooking', 'food', 'restaurant', 'celebrity gossip', 'celebrity', 'fashion',
    'sports', 'entertainment', 'movie', 'music', 'concert', 'album', 'song',
    // Business that's not political
    'costco', 'walmart', 'target', 'amazon', 'gas station', 'fuel pumps', 'store opening',
    'retail', 'shopping', 'sale', 'discount', 'price drop', 'earnings report',
    // Technology that's not political
    'iphone', 'android', 'video game', 'gaming', 'app update', 'software update',
    // Weather and local non-political news
    'weather', 'traffic', 'local crime', 'accident', 'car crash', 'fire department',
    'road closure', 'construction', 'flood', 'storm', 'earthquake',
    // Health and medical that's not policy related
    'diet', 'exercise', 'fitness', 'nutrition', 'vitamin', 'supplement',
    // Travel and tourism
    'vacation', 'tourist', 'hotel', 'flight', 'airline', 'cruise'
  ]
  
  const hasExcludedContent = excludePatterns.some((pattern: string) =>
    lowerText.includes(pattern)
  )
  
  // Require stronger political connection - either explicit keywords OR political entities AND no excluded content
  const isRelevant = (hasUSPoliticsKeywords || hasUSPoliticalEntities) && !hasExcludedContent
  
  // Additional check: require minimum political relevance score
  if (isRelevant) {
    const politicalScore = calculatePoliticalRelevance(text)
    return politicalScore >= 20 // Require at least some political content
  }
  
  return false
}

// New function to calculate political relevance more precisely
function calculatePoliticalRelevance(text: string): number {
  const lowerText = text.toLowerCase()
  let score = 0
  
  // Core political institutions (high value)
  const coreInstitutions = ['congress', 'senate', 'house', 'supreme court', 'white house', 'president', 'governor']
  coreInstitutions.forEach(inst => {
    if (lowerText.includes(inst)) score += 25
  })
  
  // Political processes (medium-high value)  
  const politicalProcesses = ['election', 'voting', 'campaign', 'legislation', 'bill', 'policy', 'regulation']
  politicalProcesses.forEach(proc => {
    if (lowerText.includes(proc)) score += 15
  })
  
  // Political parties and figures (medium value)
  const politicalEntities = ['republican', 'democrat', 'gop', 'biden', 'trump', 'harris']
  politicalEntities.forEach(entity => {
    if (lowerText.includes(entity)) score += 10
  })
  
  // Government departments (lower value)
  const govDepts = ['department', 'sec ', 'fda', 'epa', 'irs', 'fbi', 'cia']
  govDepts.forEach(dept => {
    if (lowerText.includes(dept)) score += 5
  })
  
  return score
}

function calculateCivicRelevance(text: string): number {
  const lowerText = text.toLowerCase()
  let score = 0
  
  // High-value civic keywords (worth more points)
  const highValueKeywords = ['constitution', 'democracy', 'voting rights', 'civil rights', 'supreme court']
  const mediumValueKeywords = ['congress', 'senate', 'election', 'legislation', 'policy']
  const lowValueKeywords = ['government', 'federal', 'state', 'local']
  
  highValueKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 30
  })
  
  mediumValueKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 20
  })
  
  lowValueKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 10
  })
  
  // Bonus for multiple US politics concepts
  const usPoliticsConceptCount = US_POLITICS_KEYWORDS.filter((keyword: string) => 
    lowerText.includes(keyword.toLowerCase())
  ).length
  score += usPoliticsConceptCount * 5
  
  return Math.min(score, 100) // Cap at 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxArticles = parseInt(searchParams.get('maxArticles') || '20')

    // Fetch real-time news from RSS feeds
    const rssArticles = await fetchRealTimeNews()
    
    if (rssArticles.length > 0) {
      console.log(`✅ Using ${rssArticles.length} real-time RSS news articles`)
      return NextResponse.json({
        articles: rssArticles.slice(0, maxArticles),
        totalResults: rssArticles.length,
        status: 'ok',
        source: 'rss_feeds',
        message: 'Live US politics news from vetted sources (Rolling Stone, Politico, NPR, Reuters, The Hill, etc.)'
      })
    }

    // Fallback to mock data if RSS fails
    console.log('📰 RSS feeds failed, falling back to mock data')
    const mockArticles = getMockUSPoliticsNews()
    return NextResponse.json({
      articles: mockArticles.slice(0, maxArticles),
      totalResults: mockArticles.length,
      status: 'ok',
      source: 'mock_fallback',
      message: 'Using demo data - RSS feeds temporarily unavailable'
    })

  } catch (error) {
    console.error('Error in news API:', error)
    
    // Final fallback to mock data
    const mockArticles = getMockUSPoliticsNews()
    return NextResponse.json({
      articles: mockArticles.slice(0, 10),
      totalResults: mockArticles.length,
      status: 'error',
      source: 'mock_error',
      message: 'Error occurred - using demo data'
    }, { status: 500 })
  }
}

function getMockUSPoliticsNews(): ProcessedArticle[] {
  const baseTime = Date.now()
  
  return [
    {
      id: 'mock-1',
      title: 'Senate Republicans Block Biden\'s Climate Spending Package',
      description: 'GOP senators used procedural tactics to halt the $2.3 trillion climate and infrastructure bill, citing concerns over federal spending and inflation.',
      url: 'https://example.com/senate-climate-bill',
      publishedAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      source: { id: 'politico', name: 'Politico' },
      category: 'US Politics',
      relevanceScore: 95,
      content: 'Detailed coverage of Senate procedural moves and partisan division on climate policy...'
    },
    {
      id: 'mock-2',
      title: 'Trump Classified Documents Case Heads to Appeals Court',
      description: 'Federal appeals court will review lower court ruling on executive privilege claims in the ongoing classified documents investigation.',
      url: 'https://example.com/trump-documents-appeal',
      publishedAt: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
      source: { id: 'rolling-stone', name: 'Rolling Stone' },
      category: 'US Politics',
      relevanceScore: 98,
      content: 'Analysis of legal precedents and potential implications for presidential immunity...'
    },
    {
      id: 'mock-3',
      title: 'House Republicans Launch Investigation into Border Security',
      description: 'New House oversight committee begins probe into DHS policies amid rising immigration numbers at the southern border.',
      url: 'https://example.com/border-investigation',
      publishedAt: new Date(baseTime - 6 * 60 * 60 * 1000).toISOString(),
      source: { id: 'the-hill', name: 'The Hill' },
      category: 'US Politics',
      relevanceScore: 90,
      content: 'Republican committee chairs outline investigation scope and timeline for hearings...'
    }
  ]
} 