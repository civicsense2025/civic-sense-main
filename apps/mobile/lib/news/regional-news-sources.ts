/**
 * Regional News Sources - CivicSense Mobile
 * 
 * Language and region-specific news sources for localized civic education.
 * Integrates with existing RSS news system to provide culturally relevant content.
 */

export interface RegionalNewsSource {
  id: string
  name: string
  url: string
  language: string
  region: string
  category: 'politics' | 'government' | 'local' | 'international' | 'economics'
  type: 'rss' | 'api' | 'scraper'
  credibility: number // 0-100
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right'
  tier: 1 | 2 | 3 // Priority tier
  civicFocus: number // 0-100, how much they focus on civic education topics
  updateFrequency: 'hourly' | 'daily' | 'weekly'
  isActive: boolean
}

// Regional news sources organized by language and region
export const REGIONAL_NEWS_SOURCES: Record<string, RegionalNewsSource[]> = {
  // English sources by region
  'en-US': [
    {
      id: 'npr-politics-us',
      name: 'NPR Politics',
      url: 'https://feeds.npr.org/1001/rss.xml',
      language: 'en',
      region: 'US',
      category: 'politics',
      type: 'rss',
      credibility: 92,
      bias: 'center-left',
      tier: 1,
      civicFocus: 95,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'pbs-newshour-us',
      name: 'PBS NewsHour',
      url: 'https://www.pbs.org/newshour/feeds/rss/politics',
      language: 'en',
      region: 'US',
      category: 'politics',
      type: 'rss',
      credibility: 90,
      bias: 'center',
      tier: 1,
      civicFocus: 90,
      updateFrequency: 'daily',
      isActive: true
    },
    {
      id: 'ap-politics-us',
      name: 'Associated Press Politics',
      url: 'https://feeds.apnews.com/rss/apf-politics',
      language: 'en',
      region: 'US',
      category: 'politics',
      type: 'rss',
      credibility: 95,
      bias: 'center',
      tier: 1,
      civicFocus: 85,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  'en-GB': [
    {
      id: 'bbc-politics-uk',
      name: 'BBC Politics',
      url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
      language: 'en',
      region: 'GB',
      category: 'politics',
      type: 'rss',
      credibility: 90,
      bias: 'center',
      tier: 1,
      civicFocus: 80,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'guardian-politics-uk',
      name: 'The Guardian Politics',
      url: 'https://www.theguardian.com/politics/rss',
      language: 'en',
      region: 'GB',
      category: 'politics',
      type: 'rss',
      credibility: 82,
      bias: 'center-left',
      tier: 1,
      civicFocus: 75,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  // Spanish sources by region
  'es-ES': [
    {
      id: 'el-pais-politica-es',
      name: 'El País Política',
      url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/politica',
      language: 'es',
      region: 'ES',
      category: 'politics',
      type: 'rss',
      credibility: 85,
      bias: 'center-left',
      tier: 1,
      civicFocus: 80,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'abc-politica-es',
      name: 'ABC Política',
      url: 'https://www.abc.es/rss/feeds/abc_politica.xml',
      language: 'es',
      region: 'ES',
      category: 'politics',
      type: 'rss',
      credibility: 82,
      bias: 'center-right',
      tier: 1,
      civicFocus: 75,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  'es-MX': [
    {
      id: 'reforma-politica-mx',
      name: 'Reforma Política',
      url: 'https://www.reforma.com/rss/politica.xml',
      language: 'es',
      region: 'MX',
      category: 'politics',
      type: 'rss',
      credibility: 80,
      bias: 'center',
      tier: 1,
      civicFocus: 85,
      updateFrequency: 'daily',
      isActive: true
    },
    {
      id: 'universal-politica-mx',
      name: 'El Universal Política',
      url: 'https://www.eluniversal.com.mx/rss/politica.xml',
      language: 'es',
      region: 'MX',
      category: 'politics',
      type: 'rss',
      credibility: 78,
      bias: 'center',
      tier: 2,
      civicFocus: 80,
      updateFrequency: 'daily',
      isActive: true
    }
  ],

  // French sources
  'fr-FR': [
    {
      id: 'lemonde-politique-fr',
      name: 'Le Monde Politique',
      url: 'https://www.lemonde.fr/politique/rss_full.xml',
      language: 'fr',
      region: 'FR',
      category: 'politics',
      type: 'rss',
      credibility: 88,
      bias: 'center-left',
      tier: 1,
      civicFocus: 82,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'lefigaro-politique-fr',
      name: 'Le Figaro Politique',
      url: 'https://www.lefigaro.fr/rss/figaro_politique.xml',
      language: 'fr',
      region: 'FR',
      category: 'politics',
      type: 'rss',
      credibility: 85,
      bias: 'center-right',
      tier: 1,
      civicFocus: 78,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  // German sources
  'de-DE': [
    {
      id: 'tagesschau-politik-de',
      name: 'Tagesschau Politik',
      url: 'https://www.tagesschau.de/xml/rss2/',
      language: 'de',
      region: 'DE',
      category: 'politics',
      type: 'rss',
      credibility: 90,
      bias: 'center',
      tier: 1,
      civicFocus: 85,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'spiegel-politik-de',
      name: 'Der Spiegel Politik',
      url: 'https://www.spiegel.de/politik/index.rss',
      language: 'de',
      region: 'DE',
      category: 'politics',
      type: 'rss',
      credibility: 85,
      bias: 'center-left',
      tier: 1,
      civicFocus: 80,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  // Italian sources
  'it-IT': [
    {
      id: 'repubblica-politica-it',
      name: 'La Repubblica Politica',
      url: 'https://www.repubblica.it/rss/politica/rss2.0.xml',
      language: 'it',
      region: 'IT',
      category: 'politics',
      type: 'rss',
      credibility: 82,
      bias: 'center-left',
      tier: 1,
      civicFocus: 78,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'corriere-politica-it',
      name: 'Corriere della Sera Politica',
      url: 'https://www.corriere.it/rss/politica.xml',
      language: 'it',
      region: 'IT',
      category: 'politics',
      type: 'rss',
      credibility: 85,
      bias: 'center',
      tier: 1,
      civicFocus: 80,
      updateFrequency: 'hourly',
      isActive: true
    }
  ],

  // Portuguese sources
  'pt-BR': [
    {
      id: 'folha-politica-br',
      name: 'Folha de S.Paulo Política',
      url: 'https://feeds.folha.uol.com.br/poder/rss091.xml',
      language: 'pt',
      region: 'BR',
      category: 'politics',
      type: 'rss',
      credibility: 82,
      bias: 'center-left',
      tier: 1,
      civicFocus: 85,
      updateFrequency: 'hourly',
      isActive: true
    },
    {
      id: 'globo-politica-br',
      name: 'O Globo Política',
      url: 'https://oglobo.globo.com/rss.xml',
      language: 'pt',
      region: 'BR',
      category: 'politics',
      type: 'rss',
      credibility: 80,
      bias: 'center',
      tier: 1,
      civicFocus: 80,
      updateFrequency: 'daily',
      isActive: true
    }
  ],

  // Arabic sources
  'ar-SA': [
    {
      id: 'alarabiya-politics-sa',
      name: 'العربية سياسة',
      url: 'https://www.alarabiya.net/politics.rss',
      language: 'ar',
      region: 'SA',
      category: 'politics',
      type: 'rss',
      credibility: 75,
      bias: 'center',
      tier: 2,
      civicFocus: 70,
      updateFrequency: 'daily',
      isActive: true
    }
  ],

  // Chinese sources
  'zh-CN': [
    {
      id: 'xinhua-politics-cn',
      name: '新华网政治',
      url: 'http://www.xinhuanet.com/politics/news_politics.xml',
      language: 'zh',
      region: 'CN',
      category: 'politics',
      type: 'rss',
      credibility: 70,
      bias: 'center',
      tier: 2,
      civicFocus: 75,
      updateFrequency: 'daily',
      isActive: true
    }
  ],

  // Japanese sources
  'ja-JP': [
    {
      id: 'nhk-politics-jp',
      name: 'NHK政治',
      url: 'https://www3.nhk.or.jp/rss/news/cat6.xml',
      language: 'ja',
      region: 'JP',
      category: 'politics',
      type: 'rss',
      credibility: 88,
      bias: 'center',
      tier: 1,
      civicFocus: 82,
      updateFrequency: 'hourly',
      isActive: true
    }
  ]
}

/**
 * Get news sources for a specific language and region
 */
export function getNewsSourcesForLocale(
  language: string, 
  region?: string
): RegionalNewsSource[] {
  const localeKey = region ? `${language}-${region}` : language
  
  // Try exact match first
  let sources = REGIONAL_NEWS_SOURCES[localeKey] || []
  
  // If no exact match, try language only
  if (sources.length === 0) {
    Object.entries(REGIONAL_NEWS_SOURCES).forEach(([key, regionSources]) => {
      if (key.startsWith(`${language}-`)) {
        sources.push(...regionSources)
      }
    })
  }
  
  // Filter by active sources and sort by tier and credibility
  return sources
    .filter(source => source.isActive)
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return b.credibility - a.credibility
    })
}

/**
 * Get top civic education focused sources for a locale
 */
export function getCivicFocusedSources(
  language: string,
  region?: string,
  limit: number = 3
): RegionalNewsSource[] {
  const sources = getNewsSourcesForLocale(language, region)
  
  return sources
    .filter(source => source.civicFocus >= 80)
    .sort((a, b) => b.civicFocus - a.civicFocus)
    .slice(0, limit)
}

/**
 * Get balanced news sources (different bias perspectives)
 */
export function getBalancedSources(
  language: string,
  region?: string
): RegionalNewsSource[] {
  const sources = getNewsSourcesForLocale(language, region)
  const balanced: RegionalNewsSource[] = []
  
  // Try to get one source from each bias category
  const biasCategories = ['center', 'center-left', 'center-right', 'left', 'right']
  
  biasCategories.forEach(bias => {
    const sourceWithBias = sources.find(source => source.bias === bias)
    if (sourceWithBias) {
      balanced.push(sourceWithBias)
    }
  })
  
  // If we don't have enough variety, add highest credibility sources
  if (balanced.length < 3) {
    const additionalSources = sources
      .filter(source => !balanced.includes(source))
      .sort((a, b) => b.credibility - a.credibility)
      .slice(0, 3 - balanced.length)
    
    balanced.push(...additionalSources)
  }
  
  return balanced
}

/**
 * Search for sources by category and region
 */
export function searchSources(
  category: RegionalNewsSource['category'],
  language?: string,
  region?: string
): RegionalNewsSource[] {
  const allSources = Object.values(REGIONAL_NEWS_SOURCES).flat()
  
  return allSources.filter(source => {
    if (source.category !== category) return false
    if (language && source.language !== language) return false
    if (region && source.region !== region) return false
    return source.isActive
  })
}

/**
 * Get source metadata for analytics
 */
export function getSourceMetadata(sourceId: string): RegionalNewsSource | null {
  const allSources = Object.values(REGIONAL_NEWS_SOURCES).flat()
  return allSources.find(source => source.id === sourceId) || null
}

/**
 * Check if we have good coverage for a language/region
 */
export function getLocaleCoverage(language: string, region?: string): {
  hasMinimal: boolean // At least 1 source
  hasGood: boolean // At least 3 sources
  hasExcellent: boolean // At least 5 sources with good variety
  sourceCount: number
  civicFocusAverage: number
  credibilityAverage: number
  biasVariety: string[]
} {
  const sources = getNewsSourcesForLocale(language, region)
  const biasVariety = [...new Set(sources.map(s => s.bias))]
  
  return {
    hasMinimal: sources.length >= 1,
    hasGood: sources.length >= 3,
    hasExcellent: sources.length >= 5 && biasVariety.length >= 3,
    sourceCount: sources.length,
    civicFocusAverage: sources.reduce((sum, s) => sum + s.civicFocus, 0) / sources.length || 0,
    credibilityAverage: sources.reduce((sum, s) => sum + s.credibility, 0) / sources.length || 0,
    biasVariety
  }
}

/**
 * Generate RSS feed URLs for news ticker integration
 */
export function getRegionalNewsFeeds(
  language: string,
  region?: string,
  maxSources: number = 5
): string[] {
  const sources = getNewsSourcesForLocale(language, region)
    .filter(source => source.type === 'rss')
    .slice(0, maxSources)
  
  return sources.map(source => source.url)
}

/**
 * Integration with existing news system
 */
export function enhanceNewsSourcesWithRegional(
  baseLanguage: string = 'en',
  userLanguage?: string,
  userRegion?: string
): { sources: string[]; sourceMetadata: Record<string, RegionalNewsSource> } {
  const sources: string[] = []
  const sourceMetadata: Record<string, RegionalNewsSource> = {}
  
  // Always include some base language sources for fallback
  const baseSources = getNewsSourcesForLocale(baseLanguage).slice(0, 2)
  baseSources.forEach(source => {
    sources.push(source.url)
    sourceMetadata[source.url] = source
  })
  
  // Add user's preferred language sources if different
  if (userLanguage && userLanguage !== baseLanguage) {
    const userSources = getNewsSourcesForLocale(userLanguage, userRegion).slice(0, 3)
    userSources.forEach(source => {
      if (!sources.includes(source.url)) {
        sources.push(source.url)
        sourceMetadata[source.url] = source
      }
    })
  }
  
  return { sources, sourceMetadata }
}