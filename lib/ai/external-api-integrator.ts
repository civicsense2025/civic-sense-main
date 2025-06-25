/**
 * External API Integration System for Civic Education Data
 * 
 * Integrates with external APIs to enrich collection content:
 * - Government data APIs (Congress.gov, FEC, etc.)
 * - News and media APIs for current events
 * - Academic and research institutions
 * - Civic organizations and NGOs
 * - Educational content providers
 */

interface ExternalDataSource {
  id: string
  name: string
  type: 'government' | 'news' | 'academic' | 'civic_org' | 'educational'
  base_url: string
  api_key?: string
  rate_limit: {
    requests_per_minute: number
    requests_per_day: number
  }
  reliability_score: number
  data_quality_score: number
  last_updated: string
  supported_endpoints: string[]
  authentication_type: 'api_key' | 'oauth' | 'bearer' | 'none'
}

interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    source: string
    timestamp: string
    rate_limit_remaining: number
    cache_hit: boolean
    response_time_ms: number
  }
}

interface EnrichedContent {
  original_content_id: string
  enrichment_type: 'current_events' | 'legislative_data' | 'historical_context' | 'expert_analysis'
  source_apis: string[]
  enriched_data: {
    related_bills?: Array<{
      bill_id: string
      title: string
      status: string
      summary: string
      sponsor: string
      last_action: string
    }>
    current_events?: Array<{
      headline: string
      source: string
      date: string
      relevance_score: number
      summary: string
      impact_analysis: string
    }>
    expert_opinions?: Array<{
      expert_name: string
      affiliation: string
      opinion_summary: string
      credibility_score: number
      political_leaning?: string
    }>
    historical_precedents?: Array<{
      event_name: string
      date: string
      context: string
      similarity_score: number
      lessons_learned: string[]
    }>
  }
  quality_score: number
  last_updated: string
  expiration_date: string
}

export class ExternalAPIIntegrator {
  private dataSources = new Map<string, ExternalDataSource>()
  private responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private rateLimiters = new Map<string, { requests: number[]; lastReset: number }>()

  // Configuration
  private readonly CACHE_TTL_HOURS = 24
  private readonly MAX_RETRIES = 3
  private readonly TIMEOUT_MS = 10000
  private readonly QUALITY_THRESHOLD = 0.7

  constructor() {
    this.initializeDataSources()
  }

  /**
   * Enrich collection content with external data
   */
  async enrichCollectionContent(
    collectionId: string,
    contentItems: Array<{
      id: string
      title: string
      description: string
      categories: string[]
      keywords: string[]
    }>,
    options: {
      includeCurrentEvents?: boolean
      includeLegislativeData?: boolean
      includeHistoricalContext?: boolean
      includeExpertAnalysis?: boolean
      maxEnrichmentsPerItem?: number
    } = {}
  ): Promise<{
    enriched_items: Array<{
      content_id: string
      enrichments: EnrichedContent[]
    }>
    data_sources_used: string[]
    processing_stats: {
      total_api_calls: number
      cache_hits: number
      failed_calls: number
      avg_response_time: number
    }
  }> {
    const {
      includeCurrentEvents = true,
      includeLegislativeData = true,
      includeHistoricalContext = false,
      includeExpertAnalysis = false,
      maxEnrichmentsPerItem = 3
    } = options

    console.log(`🔗 Enriching collection ${collectionId} with external data`)

    const enrichedItems: Array<{ content_id: string; enrichments: EnrichedContent[] }> = []
    const usedSources = new Set<string>()
    const stats = {
      total_api_calls: 0,
      cache_hits: 0,
      failed_calls: 0,
      total_response_time: 0
    }

    for (const item of contentItems) {
      const enrichments: EnrichedContent[] = []

      // Current events enrichment
      if (includeCurrentEvents) {
        const currentEventsData = await this.fetchCurrentEvents(item.keywords, item.categories)
        if (currentEventsData.success && currentEventsData.data) {
          enrichments.push(this.createCurrentEventsEnrichment(item.id, currentEventsData.data))
          usedSources.add('news_apis')
          stats.total_api_calls++
          stats.total_response_time += currentEventsData.metadata.response_time_ms
          if (currentEventsData.metadata.cache_hit) stats.cache_hits++
        } else {
          stats.failed_calls++
        }
      }

      // Legislative data enrichment
      if (includeLegislativeData) {
        const legislativeData = await this.fetchLegislativeData(item.keywords, item.categories)
        if (legislativeData.success && legislativeData.data) {
          enrichments.push(this.createLegislativeEnrichment(item.id, legislativeData.data))
          usedSources.add('congress_api')
          stats.total_api_calls++
          stats.total_response_time += legislativeData.metadata.response_time_ms
          if (legislativeData.metadata.cache_hit) stats.cache_hits++
        } else {
          stats.failed_calls++
        }
      }

      // Historical context enrichment
      if (includeHistoricalContext) {
        const historicalData = await this.fetchHistoricalContext(item.keywords, item.categories)
        if (historicalData.success && historicalData.data) {
          enrichments.push(this.createHistoricalEnrichment(item.id, historicalData.data))
          usedSources.add('historical_apis')
          stats.total_api_calls++
          stats.total_response_time += historicalData.metadata.response_time_ms
          if (historicalData.metadata.cache_hit) stats.cache_hits++
        } else {
          stats.failed_calls++
        }
      }

      // Expert analysis enrichment
      if (includeExpertAnalysis) {
        const expertData = await this.fetchExpertAnalysis(item.keywords, item.categories)
        if (expertData.success && expertData.data) {
          enrichments.push(this.createExpertAnalysisEnrichment(item.id, expertData.data))
          usedSources.add('expert_apis')
          stats.total_api_calls++
          stats.total_response_time += expertData.metadata.response_time_ms
          if (expertData.metadata.cache_hit) stats.cache_hits++
        } else {
          stats.failed_calls++
        }
      }

      // Limit enrichments per item and sort by quality
      const qualityFilteredEnrichments = enrichments
        .filter(e => e.quality_score >= this.QUALITY_THRESHOLD)
        .sort((a, b) => b.quality_score - a.quality_score)
        .slice(0, maxEnrichmentsPerItem)

      if (qualityFilteredEnrichments.length > 0) {
        enrichedItems.push({
          content_id: item.id,
          enrichments: qualityFilteredEnrichments
        })
      }
    }

    return {
      enriched_items: enrichedItems,
      data_sources_used: Array.from(usedSources),
      processing_stats: {
        total_api_calls: stats.total_api_calls,
        cache_hits: stats.cache_hits,
        failed_calls: stats.failed_calls,
        avg_response_time: stats.total_api_calls > 0 ? stats.total_response_time / stats.total_api_calls : 0
      }
    }
  }

  /**
   * Monitor external data source health and performance
   */
  async monitorDataSources(): Promise<{
    source_health: Array<{
      source_id: string
      status: 'healthy' | 'degraded' | 'down'
      response_time: number
      success_rate: number
      last_check: string
      issues: string[]
    }>
    overall_health: number
    recommendations: string[]
  }> {
    const sourceHealth: any[] = []
    let healthyCount = 0

    for (const [sourceId, source] of this.dataSources.entries()) {
      const healthCheck = await this.checkSourceHealth(sourceId)
      sourceHealth.push(healthCheck)
      
      if (healthCheck.status === 'healthy') {
        healthyCount++
      }
    }

    const overallHealth = healthyCount / this.dataSources.size
    const recommendations = this.generateHealthRecommendations(sourceHealth)

    return {
      source_health: sourceHealth,
      overall_health: overallHealth,
      recommendations: recommendations
    }
  }

  /**
   * Fetch current events related to content
   */
  private async fetchCurrentEvents(keywords: string[], categories: string[]): Promise<APIResponse<any>> {
    const cacheKey = `current_events_${keywords.join('_')}_${categories.join('_')}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          source: 'news_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 1000,
          cache_hit: true,
          response_time_ms: 5
        }
      }
    }

    // Rate limit check
    if (!this.checkRateLimit('news_apis')) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        metadata: {
          source: 'news_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 0,
          cache_hit: false,
          response_time_ms: 0
        }
      }
    }

    const startTime = Date.now()

    try {
      // Simulate API call to news services
      const searchQuery = keywords.concat(categories).join(' ')
      const mockNewsData = this.generateMockCurrentEvents(searchQuery)
      
      const responseTime = Date.now() - startTime
      
      // Cache the response
      this.setCache(cacheKey, mockNewsData, this.CACHE_TTL_HOURS)
      
      return {
        success: true,
        data: mockNewsData,
        metadata: {
          source: 'news_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 999,
          cache_hit: false,
          response_time_ms: responseTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'news_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 999,
          cache_hit: false,
          response_time_ms: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Fetch legislative data from Congress.gov and similar APIs
   */
  private async fetchLegislativeData(keywords: string[], categories: string[]): Promise<APIResponse<any>> {
    const cacheKey = `legislative_${keywords.join('_')}_${categories.join('_')}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          source: 'congress_api',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 500,
          cache_hit: true,
          response_time_ms: 5
        }
      }
    }

    if (!this.checkRateLimit('congress_api')) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        metadata: {
          source: 'congress_api',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 0,
          cache_hit: false,
          response_time_ms: 0
        }
      }
    }

    const startTime = Date.now()

    try {
      const mockLegislativeData = this.generateMockLegislativeData(keywords)
      const responseTime = Date.now() - startTime
      
      this.setCache(cacheKey, mockLegislativeData, this.CACHE_TTL_HOURS)
      
      return {
        success: true,
        data: mockLegislativeData,
        metadata: {
          source: 'congress_api',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 499,
          cache_hit: false,
          response_time_ms: responseTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'congress_api',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 499,
          cache_hit: false,
          response_time_ms: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Fetch historical context from academic and historical APIs
   */
  private async fetchHistoricalContext(keywords: string[], categories: string[]): Promise<APIResponse<any>> {
    const cacheKey = `historical_${keywords.join('_')}_${categories.join('_')}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          source: 'historical_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 200,
          cache_hit: true,
          response_time_ms: 5
        }
      }
    }

    const startTime = Date.now()

    try {
      const mockHistoricalData = this.generateMockHistoricalData(keywords)
      const responseTime = Date.now() - startTime
      
      this.setCache(cacheKey, mockHistoricalData, this.CACHE_TTL_HOURS * 2) // Longer cache for historical data
      
      return {
        success: true,
        data: mockHistoricalData,
        metadata: {
          source: 'historical_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 199,
          cache_hit: false,
          response_time_ms: responseTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'historical_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 199,
          cache_hit: false,
          response_time_ms: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Fetch expert analysis from academic and policy APIs
   */
  private async fetchExpertAnalysis(keywords: string[], categories: string[]): Promise<APIResponse<any>> {
    const cacheKey = `expert_${keywords.join('_')}_${categories.join('_')}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          source: 'expert_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 100,
          cache_hit: true,
          response_time_ms: 5
        }
      }
    }

    const startTime = Date.now()

    try {
      const mockExpertData = this.generateMockExpertAnalysis(keywords)
      const responseTime = Date.now() - startTime
      
      this.setCache(cacheKey, mockExpertData, this.CACHE_TTL_HOURS)
      
      return {
        success: true,
        data: mockExpertData,
        metadata: {
          source: 'expert_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 99,
          cache_hit: false,
          response_time_ms: responseTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'expert_apis',
          timestamp: new Date().toISOString(),
          rate_limit_remaining: 99,
          cache_hit: false,
          response_time_ms: Date.now() - startTime
        }
      }
    }
  }

  // Helper methods for creating enrichment objects
  private createCurrentEventsEnrichment(contentId: string, data: any): EnrichedContent {
    return {
      original_content_id: contentId,
      enrichment_type: 'current_events',
      source_apis: ['news_apis'],
      enriched_data: {
        current_events: data.articles
      },
      quality_score: 0.85,
      last_updated: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
  }

  private createLegislativeEnrichment(contentId: string, data: any): EnrichedContent {
    return {
      original_content_id: contentId,
      enrichment_type: 'legislative_data',
      source_apis: ['congress_api'],
      enriched_data: {
        related_bills: data.bills
      },
      quality_score: 0.9,
      last_updated: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }
  }

  private createHistoricalEnrichment(contentId: string, data: any): EnrichedContent {
    return {
      original_content_id: contentId,
      enrichment_type: 'historical_context',
      source_apis: ['historical_apis'],
      enriched_data: {
        historical_precedents: data.precedents
      },
      quality_score: 0.8,
      last_updated: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }
  }

  private createExpertAnalysisEnrichment(contentId: string, data: any): EnrichedContent {
    return {
      original_content_id: contentId,
      enrichment_type: 'expert_analysis',
      source_apis: ['expert_apis'],
      enriched_data: {
        expert_opinions: data.opinions
      },
      quality_score: 0.75,
      last_updated: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
    }
  }

  // Cache management
  private getFromCache(key: string): any | null {
    const cached = this.responseCache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.responseCache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCache(key: string, data: any, ttlHours: number): void {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlHours * 60 * 60 * 1000
    })
  }

  // Rate limiting
  private checkRateLimit(sourceId: string): boolean {
    const source = this.dataSources.get(sourceId)
    if (!source) return false

    const limiter = this.rateLimiters.get(sourceId) || { requests: [], lastReset: Date.now() }
    const now = Date.now()
    
    // Reset if more than a minute has passed
    if (now - limiter.lastReset > 60000) {
      limiter.requests = []
      limiter.lastReset = now
    }
    
    // Remove requests older than 1 minute
    limiter.requests = limiter.requests.filter(time => now - time < 60000)
    
    // Check if under rate limit
    if (limiter.requests.length >= source.rate_limit.requests_per_minute) {
      return false
    }
    
    // Add current request
    limiter.requests.push(now)
    this.rateLimiters.set(sourceId, limiter)
    
    return true
  }

  // Health monitoring
  private async checkSourceHealth(sourceId: string): Promise<any> {
    const source = this.dataSources.get(sourceId)
    if (!source) {
      return {
        source_id: sourceId,
        status: 'down',
        response_time: 0,
        success_rate: 0,
        last_check: new Date().toISOString(),
        issues: ['Source not found']
      }
    }

    // Simulate health check
    const responseTime = Math.random() * 1000 + 100 // 100-1100ms
    const successRate = 0.95 + Math.random() * 0.05 // 95-100%
    const issues: string[] = []

    if (responseTime > 800) issues.push('High response time')
    if (successRate < 0.98) issues.push('Low success rate')

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length === 1 ? 'degraded' : 'down'

    return {
      source_id: sourceId,
      status,
      response_time: responseTime,
      success_rate: successRate,
      last_check: new Date().toISOString(),
      issues
    }
  }

  private generateHealthRecommendations(sourceHealth: any[]): string[] {
    const recommendations: string[] = []
    
    const downSources = sourceHealth.filter(s => s.status === 'down')
    const degradedSources = sourceHealth.filter(s => s.status === 'degraded')
    
    if (downSources.length > 0) {
      recommendations.push(`${downSources.length} data source(s) are down - investigate immediately`)
    }
    
    if (degradedSources.length > 0) {
      recommendations.push(`${degradedSources.length} data source(s) are degraded - monitor closely`)
    }
    
    const avgResponseTime = sourceHealth.reduce((sum, s) => sum + s.response_time, 0) / sourceHealth.length
    if (avgResponseTime > 500) {
      recommendations.push('Average response time is high - consider caching strategies')
    }
    
    return recommendations
  }

  // Mock data generators (in production, these would be real API calls)
  private generateMockCurrentEvents(query: string): any {
    return {
      articles: [
        {
          headline: `Recent developments in ${query} policy`,
          source: 'Associated Press',
          date: new Date().toISOString(),
          relevance_score: 0.9,
          summary: `Latest news regarding ${query} with significant civic implications...`,
          impact_analysis: 'High impact on voter engagement and policy outcomes'
        },
        {
          headline: `Congressional action on ${query} issues`,
          source: 'Reuters',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          relevance_score: 0.8,
          summary: `Congress addresses concerns related to ${query}...`,
          impact_analysis: 'Moderate impact on federal legislation'
        }
      ]
    }
  }

  private generateMockLegislativeData(keywords: string[]): any {
    return {
      bills: [
        {
          bill_id: 'HR-2024-001',
          title: `Act to Address ${keywords[0]} Reform`,
          status: 'In Committee',
          summary: `Comprehensive legislation addressing ${keywords.join(' and ')} issues...`,
          sponsor: 'Rep. Jane Smith (D-CA)',
          last_action: 'Referred to House Committee on Oversight'
        },
        {
          bill_id: 'S-2024-045',
          title: `Senate Bill on ${keywords[0]} Transparency`,
          status: 'Passed Senate',
          summary: `Bipartisan effort to improve transparency in ${keywords[0]}...`,
          sponsor: 'Sen. John Doe (R-TX)',
          last_action: 'Sent to House for consideration'
        }
      ]
    }
  }

  private generateMockHistoricalData(keywords: string[]): any {
    return {
      precedents: [
        {
          event_name: `Historical ${keywords[0]} Crisis of 1970s`,
          date: '1975-03-15',
          context: `Similar challenges in ${keywords[0]} led to significant reforms...`,
          similarity_score: 0.85,
          lessons_learned: [
            'Importance of public transparency',
            'Need for bipartisan cooperation',
            'Long-term consequences of policy decisions'
          ]
        }
      ]
    }
  }

  private generateMockExpertAnalysis(keywords: string[]): any {
    return {
      opinions: [
        {
          expert_name: 'Dr. Sarah Johnson',
          affiliation: 'Georgetown Public Policy Institute',
          opinion_summary: `The current ${keywords[0]} situation requires careful analysis...`,
          credibility_score: 0.95,
          political_leaning: 'centrist'
        },
        {
          expert_name: 'Prof. Michael Chen',
          affiliation: 'Harvard Kennedy School',
          opinion_summary: `Historical patterns suggest that ${keywords[0]} policies...`,
          credibility_score: 0.9,
          political_leaning: 'liberal'
        }
      ]
    }
  }

  // Initialize data sources
  private initializeDataSources(): void {
    // Government APIs
    this.dataSources.set('congress_api', {
      id: 'congress_api',
      name: 'Congress.gov API',
      type: 'government',
      base_url: 'https://api.congress.gov',
      rate_limit: { requests_per_minute: 500, requests_per_day: 10000 },
      reliability_score: 0.95,
      data_quality_score: 0.9,
      last_updated: new Date().toISOString(),
      supported_endpoints: ['bills', 'members', 'committees', 'votes'],
      authentication_type: 'api_key'
    })

    // News APIs
    this.dataSources.set('news_apis', {
      id: 'news_apis',
      name: 'News API Aggregator',
      type: 'news',
      base_url: 'https://newsapi.org',
      rate_limit: { requests_per_minute: 1000, requests_per_day: 50000 },
      reliability_score: 0.85,
      data_quality_score: 0.8,
      last_updated: new Date().toISOString(),
      supported_endpoints: ['headlines', 'search', 'sources'],
      authentication_type: 'api_key'
    })

    // Academic APIs
    this.dataSources.set('academic_apis', {
      id: 'academic_apis',
      name: 'Academic Research APIs',
      type: 'academic',
      base_url: 'https://api.semantic-scholar.org',
      rate_limit: { requests_per_minute: 100, requests_per_day: 5000 },
      reliability_score: 0.9,
      data_quality_score: 0.95,
      last_updated: new Date().toISOString(),
      supported_endpoints: ['papers', 'authors', 'citations'],
      authentication_type: 'none'
    })

    // Civic organization APIs
    this.dataSources.set('civic_org_apis', {
      id: 'civic_org_apis',
      name: 'Civic Organization Data',
      type: 'civic_org',
      base_url: 'https://api.opensecrets.org',
      rate_limit: { requests_per_minute: 200, requests_per_day: 10000 },
      reliability_score: 0.8,
      data_quality_score: 0.85,
      last_updated: new Date().toISOString(),
      supported_endpoints: ['candidates', 'donors', 'lobbying'],
      authentication_type: 'api_key'
    })
  }
} 