import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * CivicSense News Ticker API with Multi-Layer Caching
 * 
 * Caching Strategy:
 * 1. In-memory cache (immediate) - 15 minutes
 * 2. Database cache (persistent) - 30 minutes
 * 3. Fallback to RSS feeds when cache expires
 * 
 * This prevents hitting RSS feeds repeatedly when multiple users access the site
 */

// In-memory cache for immediate requests
interface CachedNewsData {
  articles: ProcessedArticle[]
  timestamp: number
  source: string
}

const NEWS_CACHE: Map<string, CachedNewsData> = new Map()
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in memory
const DB_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in database

/**
 * Get cache key for request parameters
 */
function getCacheKey(params: { sources?: string, categories?: string, maxArticles?: number }): string {
  return `news-${params.sources || 'default'}-${params.categories || 'default'}-${params.maxArticles || 20}`
}

/**
 * Check in-memory cache first
 */
function getMemoryCache(cacheKey: string): CachedNewsData | null {
  const cached = NEWS_CACHE.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Using in-memory cache for news')
    return cached
  }
  
  // Clean up expired cache entries
  if (cached) {
    NEWS_CACHE.delete(cacheKey)
  }
  
  return null
}

/**
 * Set in-memory cache
 */
function setMemoryCache(cacheKey: string, data: ProcessedArticle[], source: string): void {
  NEWS_CACHE.set(cacheKey, {
    articles: data,
    timestamp: Date.now(),
    source
  })
  
  // Clean up old cache entries (keep only last 10 entries)
  if (NEWS_CACHE.size > 10) {
    const firstKey = NEWS_CACHE.keys().next().value
    if (firstKey) {
      NEWS_CACHE.delete(firstKey)
    }
  }
}

/**
 * Check database cache for persistent caching across server restarts
 */
async function getDatabaseCache(cacheKey: string): Promise<CachedNewsData | null> {
  try {
    const { data, error } = await supabase
      .from('news_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - DB_CACHE_DURATION).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      return null
    }
    
    console.log('✅ Using database cache for news')
    return {
      articles: data.articles_data,
      timestamp: new Date(data.created_at).getTime(),
      source: data.source_info || 'database_cache'
    }
  } catch (error) {
    console.error('Error reading from database cache:', error)
    return null
  }
}

/**
 * Set database cache
 */
async function setDatabaseCache(cacheKey: string, data: ProcessedArticle[], source: string): Promise<void> {
  try {
    // First, clean up old cache entries for this key
    await supabase
      .from('news_cache')
      .delete()
      .eq('cache_key', cacheKey)
    
    // Insert new cache entry
    const { error } = await supabase
      .from('news_cache')
      .insert({
        cache_key: cacheKey,
        articles_data: data,
        source_info: source,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error setting database cache:', error)
    } else {
      console.log('✅ Saved news to database cache')
    }
  } catch (error) {
    console.error('Error setting database cache:', error)
  }
}

/**
 * Clean up old cache entries (called periodically)
 */
async function cleanupDatabaseCache(): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    await supabase
      .from('news_cache')
      .delete()
      .lt('created_at', cutoffTime.toISOString())
    
    console.log('🧹 Cleaned up old news cache entries')
  } catch (error) {
    console.error('Error cleaning up cache:', error)
  }
}

/**
 * Get cached news with fallback to fresh fetch
 */
async function getCachedNews(params: { sources?: string, categories?: string, maxArticles?: number }): Promise<{
  articles: ProcessedArticle[]
  source: string
  fromCache: boolean
}> {
  const cacheKey = getCacheKey(params)
  
  // 1. Check in-memory cache first
  const memoryCache = getMemoryCache(cacheKey)
  if (memoryCache) {
    return {
      articles: memoryCache.articles.slice(0, params.maxArticles || 20),
      source: memoryCache.source,
      fromCache: true
    }
  }
  
  // 2. Check database cache
  const dbCache = await getDatabaseCache(cacheKey)
  if (dbCache) {
    // Update in-memory cache with database data
    setMemoryCache(cacheKey, dbCache.articles, dbCache.source)
    
    return {
      articles: dbCache.articles.slice(0, params.maxArticles || 20),
      source: dbCache.source,
      fromCache: true
    }
  }
  
  // 3. Fetch fresh data and cache it
  console.log('🔄 No valid cache found, fetching fresh news...')
  const freshArticles = await fetchRealTimeNews()
  
  if (freshArticles.length > 0) {
    // Cache the results
    setMemoryCache(cacheKey, freshArticles, 'rss_feeds')
    await setDatabaseCache(cacheKey, freshArticles, 'rss_feeds')
    
    return {
      articles: freshArticles.slice(0, params.maxArticles || 20),
      source: 'rss_feeds',
      fromCache: false
    }
  }
  
  // Fallback to mock data
  const mockArticles = getMockUSPoliticsNews()
  return {
    articles: mockArticles.slice(0, params.maxArticles || 20),
    source: 'mock_fallback',
    fromCache: false
  }
}

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
  // ============================================================================
  // 🏛 U.S. POLITICS & GOVERNMENT - Tier 1 (Highest Priority)
  // ============================================================================
  {
    name: 'Politico',
    url: 'https://rss.politico.com/politics-news.xml',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 90
  },
  {
    name: 'The Hill',
    url: 'https://thehill.com/news/feed/',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 85
  },
  {
    name: 'NPR Politics',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'US Politics', 
    type: 'rss',
    tier: 1,
    credibility: 92
  },
  {
    name: 'PBS NewsHour Politics',
    url: 'https://www.pbs.org/newshour/feeds/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 90
  },
  {
    name: 'AP News Politics',
    url: 'https://feeds.apnews.com/rss/apf-politics',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 95
  },
  {
    name: 'Reuters US Politics',
    url: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com+politics&ceid=US:en&hl=en-US&gl=US',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 95
  },
  {
    name: 'Washington Post Politics',
    url: 'https://feeds.washingtonpost.com/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 88
  },
  {
    name: 'States Newsroom DC Bureau',
    url: 'https://statesnewsroom.com/dc-bureau/feed/',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 85
  },

  // ============================================================================
  // 💼 ECONOMIC & FINANCIAL POLICY
  // ============================================================================
  {
    name: 'Federal Reserve News',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    category: 'Economic Policy',
    type: 'rss',
    tier: 1,
    credibility: 98
  },
  {
    name: 'NPR Economy',
    url: 'https://feeds.npr.org/1017/rss.xml',
    category: 'Economic Policy',
    type: 'rss',
    tier: 1,
    credibility: 90
  },
  {
    name: 'AP News Business',
    url: 'https://feeds.apnews.com/rss/apf-business',
    category: 'Economic Policy',
    type: 'rss',
    tier: 1,
    credibility: 93
  },
  {
    name: 'Bloomberg Government',
    url: 'https://news.google.com/rss/search?q=when:24h+allinurl:bloomberg.com+government&ceid=US:en&hl=en-US&gl=US',
    category: 'Economic Policy',
    type: 'rss',
    tier: 1,
    credibility: 88
  },

  // ============================================================================
  // 🌍 FOREIGN POLICY & INTERNATIONAL NEWS
  // ============================================================================
  {
    name: 'PBS NewsHour World',
    url: 'https://www.pbs.org/newshour/feeds/rss/world',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 1,
    credibility: 90
  },
  {
    name: 'NPR World',
    url: 'https://feeds.npr.org/1004/rss.xml',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 1,
    credibility: 92
  },
  {
    name: 'AP News International',
    url: 'https://feeds.apnews.com/rss/apf-international',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 1,
    credibility: 95
  },
  {
    name: 'Reuters World News',
    url: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com+world&ceid=US:en&hl=en-US&gl=US',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 1,
    credibility: 95
  },
  {
    name: 'Foreign Policy Magazine',
    url: 'https://foreignpolicy.com/feed/',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 1,
    credibility: 88
  },

  // ============================================================================
  // 🏛 GOVERNMENT & OVERSIGHT - Tier 2
  // ============================================================================
  {
    name: 'Government Executive',
    url: 'https://www.govexec.com/rss/all/',
    category: 'Government Operations',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Federal News Network',
    url: 'https://federalnewsnetwork.com/feed/',
    category: 'Government Operations',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'Roll Call',
    url: 'https://rollcall.com/feed/',
    category: 'Congressional News',
    type: 'rss',
    tier: 2,
    credibility: 88
  },
  {
    name: 'CQ Roll Call',
    url: 'https://news.google.com/rss/search?q=when:24h+allinurl:rollcall.com&ceid=US:en&hl=en-US&gl=US',
    category: 'Congressional News',
    type: 'rss',
    tier: 2,
    credibility: 88
  },

  // ============================================================================
  // 📺 MAJOR NEWS NETWORKS - Tier 2
  // ============================================================================
  {
    name: 'CNN Politics',
    url: 'http://rss.cnn.com/rss/edition_politics.rss',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'CBS News Politics',
    url: 'https://www.cbsnews.com/latest/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'NBC Politics',
    url: 'https://feeds.nbcnews.com/nbcnews/public/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'ABC News Politics',
    url: 'https://abcnews.go.com/abcnews/politicsheadlines',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },

  // ============================================================================
  // 📰 SPECIALIZED POLITICAL NEWS - Tier 2
  // ============================================================================
  {
    name: 'Axios Politics',
    url: 'https://api.axios.com/feed/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'USA Today Politics',
    url: 'http://rssfeeds.usatoday.com/usatoday-NewsPolitics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'Wall Street Journal Politics',
    url: 'https://news.google.com/rss/search?q=when:24h+allinurl:wsj.com+politics&ceid=US:en&hl=en-US&gl=US',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 85
  },

  // ============================================================================
  // 🎯 INVESTIGATIVE & ANALYSIS - Tier 2
  // ============================================================================
  {
    name: 'ProPublica',
    url: 'https://www.propublica.org/feeds/propublica/main',
    category: 'Investigative',
    type: 'rss',
    tier: 2,
    credibility: 92
  },
  {
    name: 'Center for Investigative Reporting',
    url: 'https://revealnews.org/feed/',
    category: 'Investigative',
    type: 'rss',
    tier: 2,
    credibility: 88
  },

  // ============================================================================
  // 🏛️ POLICY THINK TANKS & ANALYSIS - Tier 2
  // ============================================================================
  {
    name: 'Cato Institute',
    url: 'https://www.cato.org/rss/commentary',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Brookings Institution',
    url: 'https://www.brookings.edu/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 88
  },
  {
    name: 'American Enterprise Institute',
    url: 'https://www.aei.org/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'Center for Strategic and International Studies',
    url: 'https://www.csis.org/analysis/feed',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 87
  },
  {
    name: 'Council on Foreign Relations',
    url: 'https://www.cfr.org/rss/feeds/blog_feed.xml',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 89
  },

  // ============================================================================
  // 🎖️ DEFENSE & MILITARY POLICY - Tier 1
  // ============================================================================
  {
    name: 'Military.com',
    url: 'https://www.military.com/rss/daily-news',
    category: 'Defense Policy',
    type: 'rss',
    tier: 1,
    credibility: 85
  },
  {
    name: 'Defense News',
    url: 'https://www.defensenews.com/arc/outboundfeeds/rss/category/pentagon/?outputType=xml',
    category: 'Defense Policy',
    type: 'rss',
    tier: 1,
    credibility: 87
  },

  // ============================================================================
  // 📰 MAJOR INTERNATIONAL NEWS - Tier 1 (Enhanced)
  // ============================================================================
  {
    name: 'New York Times Politics',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 85
  },
  {
    name: 'BBC Politics',
    url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
    category: 'International Politics',
    type: 'rss',
    tier: 1,
    credibility: 90
  },
  {
    name: 'Reuters Politics',
    url: 'https://www.reuters.com/rssFeed/politicsNews',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 95
  },
  {
    name: 'The Guardian Politics',
    url: 'https://www.theguardian.com/us/politics/rss',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 82
  },
  {
    name: 'Bloomberg Politics',
    url: 'https://www.bloomberg.com/feed/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 88
  },
  {
    name: 'Time Politics',
    url: 'https://time.com/section/politics/feed/',
    category: 'US Politics',
    type: 'rss',
    tier: 1,
    credibility: 80
  },
  {
    name: 'Al Jazeera Politics',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'International Politics',
    type: 'rss',
    tier: 1,
    credibility: 78
  },
  {
    name: 'The Economist Politics',
    url: 'https://www.economist.com/sections/politics/rss.xml',
    category: 'International Politics',
    type: 'rss',
    tier: 1,
    credibility: 90
  },

  // ============================================================================
  // 📺 ENHANCED MAJOR NEWS NETWORKS - Tier 2
  // ============================================================================
  {
    name: 'Fox News Politics',
    url: 'https://feeds.foxnews.com/foxnews/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'The Independent Politics',
    url: 'https://www.independent.co.uk/news/uk/politics/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'The Washington Times Politics',
    url: 'https://www.washingtontimes.com/rss/politics/',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 72
  },
  {
    name: 'Newsweek Politics',
    url: 'https://www.newsweek.com/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'Los Angeles Times Politics',
    url: 'https://www.latimes.com/local/politics/rss2',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Telegraph Politics',
    url: 'https://www.telegraph.co.uk/rss-feed/politics/',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },

  // ============================================================================
  // 📊 POLITICAL ANALYSIS & DATA - Enhanced Tier 1
  // ============================================================================
  {
    name: 'FiveThirtyEight',
    url: 'https://fivethirtyeight.com/feed/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 1,
    credibility: 88
  },
  {
    name: 'Talking Points Memo',
    url: 'https://talkingpointsmemo.com/feed',
    category: 'Political Analysis',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Hill Briefing Room',
    url: 'https://thehill.com/homenews/briefing-room/feed',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Open Secrets',
    url: 'https://www.opensecrets.org/news/feed/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 1,
    credibility: 90
  },

  // ============================================================================
  // 🏛️ ENHANCED POLICY THINK TANKS - Tier 2
  // ============================================================================
  {
    name: 'Heritage Foundation',
    url: 'https://www.heritage.org/rss',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'Carnegie Endowment',
    url: 'https://carnegieendowment.org/feed/',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 87
  },
  {
    name: 'RAND Corporation',
    url: 'https://www.rand.org/blog.rss',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Center for American Progress',
    url: 'https://www.americanprogress.org/issues/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 80
  },

  // ============================================================================
  // 📝 POLITICAL COMMENTARY & BLOGS - Tier 2
  // ============================================================================
  {
    name: 'The National Review',
    url: 'https://www.nationalreview.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'The American Conservative',
    url: 'https://www.theamericanconservative.com/rss/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Intercept Politics',
    url: 'https://theintercept.com/feed/',
    category: 'Investigative',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Hot Air',
    url: 'https://hotair.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'RedState',
    url: 'https://www.redstate.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 68
  },
  {
    name: 'The Daily Caller',
    url: 'https://dailycaller.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'Power Line Blog',
    url: 'https://www.powerlineblog.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 72
  },
  {
    name: 'Crooks and Liars',
    url: 'https://crooksandliars.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'PoliticusUSA',
    url: 'https://www.politicususa.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 72
  },

  // ============================================================================
  // 🌍 INTERNATIONAL POLITICAL NEWS - Tier 2
  // ============================================================================
  {
    name: 'Politico Europe',
    url: 'https://www.politico.eu/rss-feed/',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'The Spectator',
    url: 'https://www.spectator.co.uk/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'EU Observer',
    url: 'https://euobserver.com/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 82
  },

  // ============================================================================
  // 🏛️ PARTY ORGANIZATIONS - Tier 3 (Monitoring Only)
  // ============================================================================
  {
    name: 'Republican National Committee',
    url: 'https://www.gop.com/feed/',
    category: 'Party Politics',
    type: 'rss',
    tier: 3,
    credibility: 65
  },
  {
    name: 'Democratic National Committee',
    url: 'https://www.democrats.org/feed',
    category: 'Party Politics',
    type: 'rss',
    tier: 3,
    credibility: 65
  },

  // ============================================================================
  // 📚 ACADEMIC & INTELLECTUAL - Tier 2
  // ============================================================================
  {
    name: 'The New York Review of Books Politics',
    url: 'https://www.nybooks.com/feed/politics/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 2,
    credibility: 88
  },
  {
    name: 'Americas Voice',
    url: 'https://americasvoice.org/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 75
  },

  // ============================================================================
  // 🌐 AGGREGATED FEEDS - Tier 3 (Backup)
  // ============================================================================
  {
    name: 'Google News - Government',
    url: 'https://news.google.com/rss/search?q=when:24h+government+congress+senate&ceid=US:en&hl=en-US&gl=US',
    category: 'Government',
    type: 'rss',
    tier: 3,
    credibility: 80
  },
  {
    name: 'Google News - Federal Policy',
    url: 'https://news.google.com/rss/search?q=when:24h+federal+policy+regulation&ceid=US:en&hl=en-US&gl=US',
    category: 'Policy',
    type: 'rss',
    tier: 3,
    credibility: 80
  },

  // ============================================================================
  // 📺 MAJOR NEWS NETWORKS - Enhanced Tier 2
  // ============================================================================
  {
    name: 'CNN Politics',
    url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'Fox News Politics',
    url: 'https://feeds.foxnews.com/foxnews/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'USA Today Politics',
    url: 'https://rssfeeds.usatoday.com/UsatodaycomPolitics-TopStories',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'CBS News Politics',
    url: 'https://www.cbsnews.com/latest/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'NBC Politics',
    url: 'https://feeds.nbcnews.com/nbcnews/public/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'ABC News Politics',
    url: 'https://abcnews.go.com/abcnews/politicsheadlines',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Independent Politics',
    url: 'https://www.independent.co.uk/news/uk/politics/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'The Washington Times Politics',
    url: 'https://www.washingtontimes.com/rss/politics/',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 72
  },
  {
    name: 'Newsweek Politics',
    url: 'https://www.newsweek.com/rss/politics',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'Los Angeles Times Politics',
    url: 'https://www.latimes.com/local/politics/rss2',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },

  // ============================================================================
  // 📊 POLITICAL ANALYSIS & DATA - Tier 1
  // ============================================================================
  {
    name: 'FiveThirtyEight',
    url: 'https://fivethirtyeight.com/feed/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 1,
    credibility: 88
  },
  {
    name: 'Talking Points Memo',
    url: 'https://talkingpointsmemo.com/feed',
    category: 'Political Analysis',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Hill Briefing Room',
    url: 'https://thehill.com/homenews/briefing-room/feed',
    category: 'US Politics',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Open Secrets',
    url: 'https://www.opensecrets.org/news/feed/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 1,
    credibility: 90
  },

  // ============================================================================
  // 🏛️ ENHANCED POLICY THINK TANKS - Tier 2
  // ============================================================================
  {
    name: 'Cato Institute',
    url: 'https://www.cato.org/rss/commentary',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Brookings Institution',
    url: 'https://www.brookings.edu/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 88
  },
  {
    name: 'Heritage Foundation',
    url: 'https://www.heritage.org/rss',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'American Enterprise Institute',
    url: 'https://www.aei.org/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'Center for Strategic and International Studies',
    url: 'https://www.csis.org/analysis/feed',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 87
  },
  {
    name: 'Council on Foreign Relations',
    url: 'https://www.cfr.org/rss/feeds/blog_feed.xml',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 89
  },
  {
    name: 'Carnegie Endowment',
    url: 'https://carnegieendowment.org/feed/',
    category: 'Foreign Policy',
    type: 'rss',
    tier: 2,
    credibility: 87
  },
  {
    name: 'RAND Corporation',
    url: 'https://www.rand.org/blog.rss',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Center for American Progress',
    url: 'https://www.americanprogress.org/issues/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 80
  },

  // ============================================================================
  // 📝 POLITICAL COMMENTARY & BLOGS - Tier 2
  // ============================================================================
  {
    name: 'The National Review',
    url: 'https://www.nationalreview.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'The American Conservative',
    url: 'https://www.theamericanconservative.com/rss/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'The Intercept Politics',
    url: 'https://theintercept.com/feed/',
    category: 'Investigative',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'Hot Air',
    url: 'https://hotair.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'RedState',
    url: 'https://www.redstate.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 68
  },
  {
    name: 'The Daily Caller',
    url: 'https://dailycaller.com/feed/',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 70
  },
  {
    name: 'Power Line Blog',
    url: 'https://www.powerlineblog.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 72
  },
  {
    name: 'Crooks and Liars',
    url: 'https://crooksandliars.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
  {
    name: 'PoliticusUSA',
    url: 'https://www.politicususa.com/feed',
    category: 'Political Commentary',
    type: 'rss',
    tier: 2,
    credibility: 72
  },

  // ============================================================================
  // 🌍 INTERNATIONAL POLITICAL NEWS - Tier 2
  // ============================================================================
  {
    name: 'Politico Europe',
    url: 'https://www.politico.eu/rss-feed/',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 85
  },
  {
    name: 'The Spectator',
    url: 'https://www.spectator.co.uk/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 78
  },
  {
    name: 'The Telegraph Politics',
    url: 'https://www.telegraph.co.uk/rss-feed/politics/',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 80
  },
  {
    name: 'EU Observer',
    url: 'https://euobserver.com/rss',
    category: 'International Politics',
    type: 'rss',
    tier: 2,
    credibility: 82
  },
  {
    name: 'The Economist Politics',
    url: 'https://www.economist.com/sections/politics/rss.xml',
    category: 'International Politics',
    type: 'rss',
    tier: 1,
    credibility: 90
  },

  // ============================================================================
  // 🎖️ DEFENSE & MILITARY POLICY - Enhanced
  // ============================================================================
  {
    name: 'Military.com',
    url: 'https://www.military.com/rss/daily-news',
    category: 'Defense Policy',
    type: 'rss',
    tier: 1,
    credibility: 85
  },
  {
    name: 'Defense News',
    url: 'https://www.defensenews.com/arc/outboundfeeds/rss/category/pentagon/?outputType=xml',
    category: 'Defense Policy',
    type: 'rss',
    tier: 1,
    credibility: 87
  },

  // ============================================================================
  // 🏛️ PARTY ORGANIZATIONS - Tier 3 (Monitoring Only)
  // ============================================================================
  {
    name: 'Republican National Committee',
    url: 'https://www.gop.com/feed/',
    category: 'Party Politics',
    type: 'rss',
    tier: 3,
    credibility: 65
  },
  {
    name: 'Democratic National Committee',
    url: 'https://www.democrats.org/feed',
    category: 'Party Politics',
    type: 'rss',
    tier: 3,
    credibility: 65
  },

  // ============================================================================
  // 📚 ACADEMIC & INTELLECTUAL - Tier 2
  // ============================================================================
  {
    name: 'The New York Review of Books Politics',
    url: 'https://www.nybooks.com/feed/politics/',
    category: 'Political Analysis',
    type: 'rss',
    tier: 2,
    credibility: 88
  },
  {
    name: 'Americas Voice',
    url: 'https://americasvoice.org/feed/',
    category: 'Policy Analysis',
    type: 'rss',
    tier: 2,
    credibility: 75
  },
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
  // Enhanced properties for source quality and prioritization
  tier?: number
  credibilityScore?: number
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
 * Now includes tier-based prioritization and credibility scoring
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
      console.log(`🔄 Fetching ${source.name} (Tier ${source.tier}, Credibility: ${source.credibility}) from ${source.url}`)
      
      // Create abort controller for timeout - longer timeout for Tier 1 sources
      const controller = new AbortController()
      const timeout = source.tier === 1 ? 20000 : 15000 // 20s for Tier 1, 15s for others
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
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
        console.log(`✅ Successfully fetched ${items.length} articles from ${source.name} (Tier ${source.tier})`)
        
        // Limit per source based on tier - Tier 1 gets more articles
        const limit = source.tier === 1 ? 20 : source.tier === 2 ? 15 : 10
        return items.slice(0, limit)
      }
      
    } catch (error) {
      console.error(`❌ Error fetching ${source.name} (Tier ${source.tier}):`, error instanceof Error ? error.message : 'Unknown error')
      continue
    }
  }
  
  console.warn(`⚠️ Could not fetch articles from ${source.name} (Tier ${source.tier})`)
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
 * Enhanced to use source tier and credibility data
 */
function calculateCredibilityScore(sourceName: string): number {
  // First, try to find exact match in our RSS sources
  const sourceData = RSS_NEWS_SOURCES.find(source => 
    sourceName.toLowerCase().includes(source.name.toLowerCase()) ||
    source.name.toLowerCase().includes(sourceName.toLowerCase())
  )
  
  if (sourceData) {
    return sourceData.credibility
  }
  
  // Fallback to original credibility mapping for sources not in RSS list
  const credibilityMap: Record<string, number> = {
    // Tier 1 Sources (Highest Credibility)
    'Reuters': 95,
    'Associated Press': 95,
    'AP News': 95,
    'BBC': 90,
    'NPR': 88,
    'PBS': 90,
    'The Economist': 90,
    'FiveThirtyEight': 88,
    'Open Secrets': 90,
    'ProPublica': 92,
    
    // Major News Networks
    'Politico': 85,
    'New York Times': 85,
    'Washington Post': 88,
    'Wall Street Journal': 85,
    'The Guardian': 82,
    'Bloomberg': 88,
    'Time': 80,
    'Los Angeles Times': 80,
    'CNN': 75,
    'Fox News': 70,
    'USA Today': 75,
    'ABC News': 80,
    'CBS News': 80,
    'NBC News': 78,
    'Newsweek': 75,
    'Al Jazeera': 78,
    'The Independent': 75,
    'The Washington Times': 72,
    'The Telegraph': 80,
    
    // Government & Oversight
    'Government Executive': 85,
    'Federal News Network': 82,
    'Roll Call': 88,
    'The Hill': 85,
    
    // Policy Think Tanks & Analysis
    'Cato Institute': 85,
    'Brookings Institution': 88,
    'American Enterprise Institute': 82,
    'AEI': 82,
    'Heritage Foundation': 82,
    'Center for Strategic and International Studies': 87,
    'CSIS': 87,
    'Council on Foreign Relations': 89,
    'CFR': 89,
    'Carnegie Endowment': 87,
    'RAND Corporation': 85,
    'Center for American Progress': 80,
    
    // Foreign Policy & Defense
    'Foreign Policy': 88,
    'Military.com': 85,
    'Defense News': 87,
    
    // Political Commentary & Analysis
    'The National Review': 78,
    'The American Conservative': 80,
    'The Intercept': 85,
    'Talking Points Memo': 80,
    'Hot Air': 70,
    'RedState': 68,
    'The Daily Caller': 70,
    'Power Line': 72,
    'Crooks and Liars': 75,
    'PoliticusUSA': 72,
    'The New York Review of Books': 88,
    'Americas Voice': 75,
    
    // International
    'Politico Europe': 85,
    'The Spectator': 78,
    'EU Observer': 82,
    
    // Specialized
    'Axios': 82,
    
    // Party Organizations (Lower credibility due to bias)
    'Republican National Committee': 65,
    'Democratic National Committee': 65,
    'GOP': 65,
    'Democrats': 65
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
 * Enhanced with more comprehensive mapping
 */
function getBiasRating(sourceName: string): string {
  const biasMap: Record<string, string> = {
    // Center Sources (Minimal Bias)
    'Reuters': 'center',
    'Associated Press': 'center',
    'AP News': 'center',
    'BBC': 'center',
    'Politico': 'center',
    'USA Today': 'center',
    'ABC News': 'center',
    'Government Executive': 'center',
    'Federal News Network': 'center',
    'Roll Call': 'center',
    'The Hill': 'center',
    'Axios': 'center',
    'Federal Reserve': 'center',
    'The Economist': 'center',
    'Military.com': 'center',
    'Defense News': 'center',
    'Center for Strategic and International Studies': 'center',
    'CSIS': 'center',
    'Council on Foreign Relations': 'center',
    'CFR': 'center',
    'Open Secrets': 'center',
    'FiveThirtyEight': 'center',
    'EU Observer': 'center',
    
    // Center-Left Sources
    'NPR': 'center-left',
    'PBS': 'center-left',
    'New York Times': 'center-left',
    'Washington Post': 'center-left',
    'CBS News': 'center-left',
    'NBC News': 'center-left',
    'ProPublica': 'center-left',
    'The Guardian': 'center-left',
    'Los Angeles Times': 'center-left',
    'The Independent': 'center-left',
    'Time': 'center-left',
    'Foreign Policy': 'center-left',
    'Brookings Institution': 'center-left',
    'Carnegie Endowment': 'center-left',
    'Center for American Progress': 'center-left',
    'Talking Points Memo': 'center-left',
    'The Intercept': 'center-left',
    'Crooks and Liars': 'center-left',
    'PoliticusUSA': 'center-left',
    'The New York Review of Books': 'center-left',
    'Americas Voice': 'center-left',
    'Politico Europe': 'center-left',
    
    // Center-Right Sources
    'Wall Street Journal': 'center-right',
    'Bloomberg': 'center-right',
    'The Telegraph': 'center-right',
    'Cato Institute': 'center-right', // Libertarian
    'American Enterprise Institute': 'center-right',
    'AEI': 'center-right',
    'Heritage Foundation': 'center-right',
    'RAND Corporation': 'center-right',
    'The American Conservative': 'center-right',
    'The Spectator': 'center-right',
    
    // Left Sources
    'CNN': 'left',
    'Al Jazeera': 'left',
    
    // Right Sources
    'Fox News': 'right',
    'The Washington Times': 'right',
    'The National Review': 'right',
    'Hot Air': 'right',
    'RedState': 'right',
    'The Daily Caller': 'right',
    'Power Line': 'right',
    
    // Mixed/Unknown
    'Newsweek': 'center',
    
    // Party Organizations (Highly Biased)
    'Republican National Committee': 'right',
    'Democratic National Committee': 'left',
    'GOP': 'right',
    'Democrats': 'left'
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
  console.log('📡 Fetching real-time civic news from enhanced RSS feed network...')
  console.log(`🎯 Monitoring ${RSS_NEWS_SOURCES.length} sources across ${RSS_NEWS_SOURCES.filter(s => s.tier === 1).length} Tier 1, ${RSS_NEWS_SOURCES.filter(s => s.tier === 2).length} Tier 2, and ${RSS_NEWS_SOURCES.filter(s => s.tier === 3).length} Tier 3 sources`)
  
  // Sort sources by tier for prioritized fetching
  const sortedSources = RSS_NEWS_SOURCES.sort((a, b) => a.tier - b.tier)
  
  const allFeedPromises = sortedSources.map(async (source) => {
    const items = await fetchRSSFeed(source)
    return items.map(item => ({
      ...item,
      sourceName: source.name,
      category: source.category,
      tier: source.tier,
      credibilityScore: source.credibility
    }))
  })
  
  const feedResults = await Promise.allSettled(allFeedPromises)
  let allArticles: any[] = []
  let successfulSources = 0
  let tier1Sources = 0
  
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles = [...allArticles, ...result.value]
      successfulSources++
      if (sortedSources[index].tier === 1) tier1Sources++
      console.log(`✅ Fetched ${result.value.length} articles from ${sortedSources[index].name} (Tier ${sortedSources[index].tier})`)
    } else {
      console.error(`❌ Failed to fetch from ${sortedSources[index].name} (Tier ${sortedSources[index].tier}):`, result.reason)
    }
  })
  
  console.log(`📊 Successfully fetched from ${successfulSources}/${RSS_NEWS_SOURCES.length} sources (${tier1Sources} Tier 1 sources)`)
  
  // Convert to ProcessedArticle format with enhanced processing
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
      title: cleanText(article.title),
      description: cleanText(article.description),
      url: article.link,
      urlToImage: undefined,
      publishedAt: parseDate(article.pubDate),
      source: {
        id: null,
        name: article.sourceName
      },
      category: article.category,
      content: cleanText(article.description),
      relevanceScore: calculateCivicRelevance(article.title + ' ' + article.description),
      // Enhanced with tier and credibility data
      tier: article.tier,
      credibilityScore: article.credibilityScore
    }))
    // Sort by tier first (Tier 1 articles first), then by relevance score, then by date
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
    .slice(0, 30) // Increased limit to accommodate more sources
  
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
          console.log(`✅ Article saved to database: "${article.title.substring(0, 50)}..." (ID: ${savedId}, Tier ${article.tier})`)
        } else {
          console.log(`⚠️ Article not saved: "${article.title.substring(0, 50)}..." (Tier ${article.tier})`)
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
  
  const tier1Count = articlesWithDbSave.filter(a => a.tier === 1).length
  const tier2Count = articlesWithDbSave.filter(a => a.tier === 2).length
  const tier3Count = articlesWithDbSave.filter(a => a.tier === 3).length
  
  console.log(`🎯 Found ${articlesWithDbSave.length} relevant civic articles:`)
  console.log(`   📰 Tier 1 (High Priority): ${tier1Count} articles`)
  console.log(`   📰 Tier 2 (Medium Priority): ${tier2Count} articles`)
  console.log(`   📰 Tier 3 (Backup): ${tier3Count} articles`)
  console.log(`💾 Saved articles to source_metadata table for AI News Agent processing`)
  
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
    const sources = searchParams.get('sources') || undefined
    const categories = searchParams.get('categories') || undefined

    // Clean up database cache periodically (every 10th request)
    if (Math.random() < 0.1) {
      cleanupDatabaseCache().catch(console.error)
    }

    // Use cached news with intelligent fallback
    const result = await getCachedNews({
      sources,
      categories,
      maxArticles
    })
    
    const cacheStatus = result.fromCache ? 'cached' : 'fresh'
    console.log(`🔔 Serving ${result.articles.length} articles (${cacheStatus}) from ${result.source}`)
    
    return NextResponse.json({
      articles: result.articles,
      totalResults: result.articles.length,
      status: 'ok',
      source: result.source,
      fromCache: result.fromCache,
      message: result.fromCache 
        ? `Using cached US politics news (${cacheStatus})`
        : 'Live US politics news from vetted sources (Rolling Stone, Politico, NPR, Reuters, The Hill, etc.)'
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
      fromCache: false,
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