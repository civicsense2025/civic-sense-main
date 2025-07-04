import { ensureSupabaseInitialized } from './supabase';

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  category?: string;
  relevanceScore?: number;
  tier?: number;
  credibilityScore?: number;
  database_id?: string | null;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  status: string;
  source: string;
  fromCache: boolean;
  message: string;
}

interface RSSSource {
  name: string;
  url: string;
  category: string;
  tier: number;
  credibility: number;
}

// Mobile-optimized RSS sources (prioritizing most reliable feeds)
const MOBILE_RSS_SOURCES: RSSSource[] = [
  // Tier 1 - Most reliable and mobile-friendly RSS feeds
  {
    name: 'Associated Press',
    url: 'https://feeds.apnews.com/rss/apf-politics',
    category: 'US Politics',
    tier: 1,
    credibility: 95
  },
  {
    name: 'Reuters Politics',
    url: 'https://www.reuters.com/rssFeed/politicsNews',
    category: 'US Politics',
    tier: 1,
    credibility: 95
  },
  {
    name: 'NPR Politics',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'US Politics',
    tier: 1,
    credibility: 92
  },
  {
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
    category: 'US Politics',
    tier: 1,
    credibility: 90
  },
  {
    name: 'Politico',
    url: 'https://rss.politico.com/politics-news.xml',
    category: 'US Politics',
    tier: 1,
    credibility: 90
  },
  {
    name: 'The Hill',
    url: 'https://thehill.com/news/feed/',
    category: 'US Politics',
    tier: 1,
    credibility: 85
  },
  // Tier 2 - Additional reliable sources
  {
    name: 'CNN Politics',
    url: 'http://rss.cnn.com/rss/edition_politics.rss',
    category: 'US Politics',
    tier: 2,
    credibility: 75
  },
  {
    name: 'ABC News Politics',
    url: 'https://abcnews.go.com/abcnews/politicsheadlines',
    category: 'US Politics',
    tier: 2,
    credibility: 80
  }
];

// HTML entity decoder for React Native
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&hellip;': '…'
  };
  
  let decoded = text;
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decoded;
}

// Clean text for mobile consumption
function cleanText(text: string): string {
  if (!text) return '';
  
  return decodeHtmlEntities(text)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Parse RSS feed for mobile
function parseRSSXML(content: string, sourceName: string): any[] {
  const items: any[] = [];
  
  try {
    // Handle both <item> and <entry> elements (RSS vs Atom)
    const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
    const matches = content.match(itemRegex) || [];
    
    for (const match of matches) {
      try {
        const item = parseRSSItem(match, sourceName);
        if (item && item.title && item.description && item.link) {
          items.push(item);
        }
      } catch (error) {
        console.error(`Error parsing RSS item for ${sourceName}:`, error);
        continue;
      }
    }
    
  } catch (error) {
    console.error(`Error parsing RSS XML for ${sourceName}:`, error);
  }
  
  return items;
}

// Parse individual RSS item
function parseRSSItem(itemXml: string, sourceName: string): any | null {
  try {
    // Extract title
    let title = '';
    const titleMatches = [
      itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i),
      itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    ];
    
    for (const match of titleMatches) {
      if (match && match[1]) {
        title = cleanText(match[1]);
        break;
      }
    }
    
    // Extract description
    let description = '';
    const descMatches = [
      itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i),
      itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i),
      itemXml.match(/<summary><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i),
      itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
    ];
    
    for (const match of descMatches) {
      if (match && match[1]) {
        description = cleanText(match[1]);
        if (description.length > 50) break;
      }
    }
    
    // Extract link
    let link = '';
    const linkMatches = [
      itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i),
      itemXml.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*\/?>/i),
      itemXml.match(/<guid[^>]*>(https?:\/\/[\s\S]*?)<\/guid>/i)
    ];
    
    for (const match of linkMatches) {
      if (match && match[1]) {
        const potentialLink = cleanText(match[1]);
        if (potentialLink.startsWith('http')) {
          link = potentialLink;
          break;
        }
      }
    }
    
    // Extract publication date
    let pubDate = new Date().toISOString();
    const dateMatches = [
      itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i),
      itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i),
      itemXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)
    ];
    
    for (const match of dateMatches) {
      if (match && match[1]) {
        const dateStr = cleanText(match[1]);
        try {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            pubDate = parsedDate.toISOString();
            break;
          }
        } catch {
          // Keep default date
        }
      }
    }
    
    // Validate required fields
    if (!title || title.length < 10 || !description || description.length < 20 || !link) {
      return null;
    }
    
    return {
      title,
      description: description.substring(0, 300),
      link,
      pubDate,
      sourceName
    };
    
  } catch (error) {
    console.error('Error parsing RSS item:', error);
    return null;
  }
}

// Fetch RSS feed with mobile-optimized approach
async function fetchRSSFeed(source: RSSSource): Promise<any[]> {
  try {
    console.log(`📱 Mobile RSS: Fetching ${source.name} (Tier ${source.tier})`);
    
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CivicSense Mobile/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const content = await response.text();
    const items = parseRSSXML(content, source.name);
    
    if (items.length > 0) {
      console.log(`📱 Mobile RSS: Got ${items.length} articles from ${source.name}`);
      return items.slice(0, source.tier === 1 ? 10 : 5); // Limit per source
    }
    
    return [];
    
  } catch (error) {
    console.error(`📱 Mobile RSS: Failed to fetch ${source.name}:`, error);
    return [];
  }
}

// Calculate civic relevance score
function calculateCivicRelevance(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  const politicalKeywords = [
    'congress', 'senate', 'house', 'president', 'biden', 'trump', 'harris',
    'republican', 'democrat', 'gop', 'election', 'voting', 'campaign',
    'legislation', 'bill', 'policy', 'government', 'federal', 'supreme court'
  ];
  
  politicalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 10;
  });
  
  return Math.min(score, 100);
}

// Save article to database
async function saveArticleToDatabase(article: NewsArticle): Promise<string | null> {
  try {
    const supabase = await ensureSupabaseInitialized();
    const domain = new URL(article.url).hostname.replace('www.', '');
    
    const { data: savedId, error } = await supabase.rpc('get_or_create_source_metadata', {
      p_url: article.url,
      p_title: article.title,
      p_description: article.description || '',
      p_domain: domain,
      p_author: null,
      p_published_time: article.publishedAt,
      p_modified_time: null
    });
    
    if (error) {
      console.error('Mobile DB Save Error:', error);
      return null;
    }
    
    // Update with additional metadata
    if (savedId) {
      await supabase
        .from('source_metadata')
        .update({
          og_title: article.title,
          og_description: article.description,
          og_site_name: article.source.name,
          og_type: 'article',
          content_type: 'article',
          language: 'en',
          credibility_score: article.credibilityScore || 70,
          has_https: article.url.startsWith('https://'),
          has_valid_ssl: true,
          is_accessible: true,
          fetch_status: 'success',
          last_fetched_at: new Date().toISOString()
        })
        .eq('id', savedId);
    }
    
    return savedId;
  } catch (error) {
    console.error('Mobile DB Save Error:', error);
    return null;
  }
}

// Main mobile news fetching function
export async function fetchMobileNews(maxArticles: number = 20): Promise<NewsResponse> {
  console.log('📱 Mobile News: Starting fetch from RSS sources...');
  
  try {
    // Fetch from all sources in parallel (limited to first 6 for mobile performance)
    const sourcesToFetch = MOBILE_RSS_SOURCES.slice(0, 6);
    const feedPromises = sourcesToFetch.map(fetchRSSFeed);
    const feedResults = await Promise.allSettled(feedPromises);
    
    let allArticles: any[] = [];
    let successfulSources = 0;
    
    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const items = result.value.map(item => ({
          ...item,
          sourceName: sourcesToFetch[index].name,
          category: sourcesToFetch[index].category,
          tier: sourcesToFetch[index].tier,
          credibilityScore: sourcesToFetch[index].credibility
        }));
        allArticles = [...allArticles, ...items];
        successfulSources++;
      }
    });
    
    console.log(`📱 Mobile News: Fetched from ${successfulSources}/${sourcesToFetch.length} sources`);
    
    // Convert to NewsArticle format with comprehensive validation
    const processedArticles: NewsArticle[] = [];
    
    for (const article of allArticles) {
      // Comprehensive validation to prevent runtime errors
      if (!article || typeof article !== 'object') {
        continue;
      }
      
      // Validate core required properties with explicit checks
      if (typeof article.title !== 'string' || 
          article.title.length < 10 ||
          typeof article.link !== 'string' ||
          !article.link.startsWith('http') ||
          typeof article.sourceName !== 'string' ||
          article.sourceName.length === 0) {
        continue;
      }
      
      // Build article with validated properties and safe defaults
      const processedArticle: NewsArticle = {
        id: `mobile-${Date.now()}-${processedArticles.length}`,
        title: article.title,
        description: (typeof article.description === 'string' && article.description.length > 0) 
          ? article.description 
          : null,
        url: article.link,
        publishedAt: (typeof article.pubDate === 'string' && article.pubDate.length > 0)
          ? article.pubDate 
          : new Date().toISOString(),
        source: {
          id: null,
          name: article.sourceName // Already validated as non-empty string above
        },
        category: (typeof article.category === 'string' && article.category.length > 0)
          ? article.category 
          : 'US Politics',
        relevanceScore: calculateCivicRelevance(
          article.title + ' ' + (typeof article.description === 'string' ? article.description : '')
        ),
        tier: (typeof article.tier === 'number' && article.tier > 0)
          ? article.tier 
          : 2,
        credibilityScore: (typeof article.credibilityScore === 'number' && article.credibilityScore > 0)
          ? article.credibilityScore 
          : 70
      };
      
      processedArticles.push(processedArticle);
    }
    
    // Sort articles by tier, then credibility, then date
    processedArticles.sort((a, b) => {
      // Sort by tier, then credibility, then date
      if (a.tier !== b.tier) return (a.tier || 3) - (b.tier || 3);
      if (a.credibilityScore !== b.credibilityScore) return (b.credibilityScore || 0) - (a.credibilityScore || 0);
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    
    // Limit to maxArticles
    const limitedArticles = processedArticles.slice(0, maxArticles);
    
    // Save articles to database in background
    console.log(`📱 Mobile News: Saving ${processedArticles.length} articles to database...`);
    const savePromises = processedArticles.map(async (article) => {
      const savedId = await saveArticleToDatabase(article);
      return { ...article, database_id: savedId };
    });
    
    const savedArticles = await Promise.all(savePromises);
    const savedCount = savedArticles.filter(a => a.database_id).length;
    
    console.log(`📱 Mobile News: Saved ${savedCount}/${savedArticles.length} articles to database`);
    
    return {
      articles: savedArticles,
      totalResults: savedArticles.length,
      status: 'ok',
      source: 'mobile_rss',
      fromCache: false,
      message: `Mobile RSS: ${savedArticles.length} articles from ${successfulSources} sources, ${savedCount} saved to DB`
    };
    
  } catch (error) {
    console.error('📱 Mobile News: Fatal error:', error);
    
    // Return mock data as fallback
    return {
      articles: [],
      totalResults: 0,
      status: 'error',
      source: 'mobile_fallback',
      fromCache: false,
      message: 'Mobile news fetch failed, using fallback'
    };
  }
}

// Cache management for mobile
let mobileNewsCache: { data: NewsResponse; timestamp: number } | null = null;
const MOBILE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getCachedMobileNews(maxArticles: number = 20): Promise<NewsResponse> {
  const now = Date.now();
  
  // Check cache first
  if (mobileNewsCache && (now - mobileNewsCache.timestamp) < MOBILE_CACHE_DURATION) {
    console.log('📱 Using cached mobile news');
    return {
      ...mobileNewsCache.data,
      fromCache: true,
      message: mobileNewsCache.data.message + ' (cached)'
    };
  }
  
  // Fetch fresh data
  const freshData = await fetchMobileNews(maxArticles);
  
  // Cache the result
  mobileNewsCache = {
    data: freshData,
    timestamp: now
  };
  
  return freshData;
} 