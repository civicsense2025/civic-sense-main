/**
 * CivicSense Web Search Service
 * 
 * Comprehensive web search and fact-checking for AI-generated glossary terms
 * Integrates with multiple search providers for verification and enrichment
 */

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

export interface SearchProvider {
  name: string
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  factCheck(claim: string): Promise<FactCheckResult>
  isAvailable(): Promise<boolean>
}

export interface SearchOptions {
  maxResults?: number
  timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  dateRange?: {
    start: string
    end: string
  }
  domains?: string[] // Preferred domains to search
  excludeDomains?: string[] // Domains to exclude
  searchType?: 'web' | 'news' | 'academic' | 'government' | 'mixed'
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  publishedDate?: string
  credibilityScore: number // 0-100, based on domain and content analysis
  sourceType: 'government' | 'academic' | 'news' | 'think_tank' | 'legal' | 'other'
  isRecent: boolean // Published within last 2 years
  keyQuotes: string[] // Important quotes from the content
}

export interface FactCheckResult {
  claim: string
  verdict: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false' | 'unverified'
  confidence: number // 0-100
  sources: SearchResult[]
  explanation: string
  contradictingEvidence?: string[]
  supportingEvidence?: string[]
  lastUpdated: string
}

export interface WebSearchEnrichment {
  searchedTerms: string[]
  totalResults: number
  governmentSources: SearchResult[]
  academicSources: SearchResult[]
  newsSources: SearchResult[]
  currentEvents: SearchResult[]
  factChecks: FactCheckResult[]
  suggestions: string[]
  overallCredibility: number
  lastSearched: string
}

// =============================================================================
// SEARCH PROVIDERS
// =============================================================================

class BraveSearchProvider implements SearchProvider {
  name = 'Brave Search'
  private apiKey: string | null = null

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || null
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured')
    }

    try {
      const params = new URLSearchParams({
        q: query,
        count: (options.maxResults || 10).toString(),
        offset: '0',
        mkt: 'en-US',
        safesearch: 'moderate',
        result_filter: 'web,news',
        // Add more specific parameters for civic content
        ...(options.searchType === 'government' && { 
          site: 'site:gov OR site:congress.gov OR site:supremecourt.gov' 
        }),
        ...(options.searchType === 'academic' && { 
          site: 'site:edu OR site:jstor.org OR site:scholar.google.com' 
        }),
        ...(options.timeFilter && { freshness: options.timeFilter })
      })

      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: {
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status}`)
      }

      const data = await response.json()
      return this.formatBraveResults(data.web?.results || [], query)
    } catch (error) {
      console.error('Brave Search error:', error)
      return []
    }
  }

  async factCheck(claim: string): Promise<FactCheckResult> {
    // Use general search for fact-checking
    const query = `fact check "${claim}" site:snopes.com OR site:factcheck.org OR site:politifact.com`
    const results = await this.search(query, { maxResults: 5 })
    
    return {
      claim,
      verdict: 'unverified', // Would need more sophisticated analysis
      confidence: results.length > 0 ? 60 : 20,
      sources: results,
      explanation: results.length > 0 
        ? `Found ${results.length} fact-checking sources for verification`
        : 'No specific fact-check sources found',
      lastUpdated: new Date().toISOString()
    }
  }

  private formatBraveResults(results: any[], query: string): SearchResult[] {
    return results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.description || '',
      domain: this.extractDomain(result.url || ''),
      publishedDate: result.age || undefined,
      credibilityScore: this.calculateCredibilityScore(result.url || ''),
      sourceType: this.determineSourceType(result.url || ''),
      isRecent: this.isRecentContent(result.age),
      keyQuotes: this.extractKeyQuotes(result.description || '', query)
    }))
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  private calculateCredibilityScore(url: string): number {
    const domain = this.extractDomain(url)
    
    // Government sources
    if (domain.endsWith('.gov') || domain.includes('congress.gov')) return 95
    
    // Academic sources
    if (domain.endsWith('.edu') || domain.includes('scholar.')) return 90
    
    // Established news sources
    const establishedNews = [
      'reuters.com', 'apnews.com', 'bbc.com', 'npr.org', 'pbs.org',
      'nytimes.com', 'washingtonpost.com', 'wsj.com', 'economist.com'
    ]
    if (establishedNews.some(site => domain.includes(site))) return 85
    
    // Think tanks and policy institutes
    const thinkTanks = [
      'brookings.edu', 'heritage.org', 'cato.org', 'urban.org',
      'americanprogress.org', 'aei.org', 'cfr.org'
    ]
    if (thinkTanks.some(site => domain.includes(site))) return 80
    
    // Legal sources
    if (domain.includes('law.') || domain.includes('legal') || domain.includes('court')) return 85
    
    // Default
    return 65
  }

  private determineSourceType(url: string): SearchResult['sourceType'] {
    const domain = this.extractDomain(url)
    
    if (domain.endsWith('.gov')) return 'government'
    if (domain.endsWith('.edu')) return 'academic'
    if (domain.includes('law.') || domain.includes('court')) return 'legal'
    
    const thinkTanks = ['brookings', 'heritage', 'cato', 'urban', 'aei', 'cfr']
    if (thinkTanks.some(tt => domain.includes(tt))) return 'think_tank'
    
    const newsOutlets = ['reuters', 'ap', 'bbc', 'npr', 'pbs', 'nytimes', 'washingtonpost']
    if (newsOutlets.some(news => domain.includes(news))) return 'news'
    
    return 'other'
  }

  private isRecentContent(ageString?: string): boolean {
    if (!ageString) return false
    
    // Parse Brave's age format (e.g., "2 days ago", "1 month ago")
    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
    
    // Simple heuristic - if it mentions days, weeks, or months, it's probably recent
    return ageString.includes('day') || ageString.includes('week') || 
           ageString.includes('month') || ageString.includes('2024') || 
           ageString.includes('2025')
  }

  private extractKeyQuotes(snippet: string, query: string): string[] {
    // Extract sentences that contain key terms from the query
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 3)
    
    return sentences
      .filter(sentence => 
        queryTerms.some(term => sentence.toLowerCase().includes(term))
      )
      .map(sentence => sentence.trim())
      .slice(0, 2)
  }
}

class PerplexitySearchProvider implements SearchProvider {
  name = 'Perplexity AI'
  private apiKey: string | null = null

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || null
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured')
    }

    try {
      const searchQuery = this.buildPerplexityQuery(query, options)
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant that provides detailed, factual information with source citations. Focus on government, academic, and authoritative sources.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
          return_citations: true,
          return_related_questions: false
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`)
      }

      const data = await response.json()
      return this.formatPerplexityResults(data, query)
    } catch (error) {
      console.error('Perplexity Search error:', error)
      return []
    }
  }

  async factCheck(claim: string): Promise<FactCheckResult> {
    const query = `Fact-check this claim with authoritative sources: "${claim}". Provide evidence for and against, with source citations.`
    const results = await this.search(query, { maxResults: 5, searchType: 'mixed' })
    
    // Analyze the response to determine verdict (simplified)
    const content = results.map(r => r.snippet).join(' ').toLowerCase()
    let verdict: FactCheckResult['verdict'] = 'unverified'
    let confidence = 50
    
    if (content.includes('false') || content.includes('incorrect') || content.includes('debunked')) {
      verdict = 'false'
      confidence = 80
    } else if (content.includes('true') || content.includes('accurate') || content.includes('confirmed')) {
      verdict = 'true'
      confidence = 80
    } else if (content.includes('partially') || content.includes('mixed')) {
      verdict = 'mixed'
      confidence = 70
    }

    return {
      claim,
      verdict,
      confidence,
      sources: results,
      explanation: `Analysis based on ${results.length} authoritative sources`,
      lastUpdated: new Date().toISOString()
    }
  }

  private buildPerplexityQuery(query: string, options: SearchOptions): string {
    let enhancedQuery = query
    
    if (options.searchType === 'government') {
      enhancedQuery += ' site:gov OR government sources'
    } else if (options.searchType === 'academic') {
      enhancedQuery += ' academic research peer-reviewed'
    } else if (options.searchType === 'news') {
      enhancedQuery += ' news recent developments 2024 2025'
    }
    
    if (options.timeFilter === 'week' || options.timeFilter === 'month') {
      enhancedQuery += ' recent current latest'
    }
    
    return enhancedQuery
  }

  private formatPerplexityResults(data: any, query: string): SearchResult[] {
    const content = data.choices?.[0]?.message?.content || ''
    const citations = data.citations || []
    
    // Parse citations and content into structured results
    return citations.slice(0, 10).map((citation: any, index: number) => ({
      title: citation.title || `Source ${index + 1}`,
      url: citation.url || '',
      snippet: citation.text || content.substring(index * 100, (index + 1) * 100),
      domain: this.extractDomain(citation.url || ''),
      publishedDate: citation.publishedDate,
      credibilityScore: this.calculateCredibilityScore(citation.url || ''),
      sourceType: this.determineSourceType(citation.url || ''),
      isRecent: citation.publishedDate ? this.isRecentDate(citation.publishedDate) : false,
      keyQuotes: [citation.text || ''].filter(Boolean)
    }))
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  private calculateCredibilityScore(url: string): number {
    const domain = this.extractDomain(url)
    
    if (domain.endsWith('.gov')) return 95
    if (domain.endsWith('.edu')) return 90
    if (['reuters.com', 'apnews.com', 'bbc.com'].some(d => domain.includes(d))) return 85
    
    return 70
  }

  private determineSourceType(url: string): SearchResult['sourceType'] {
    const domain = this.extractDomain(url)
    
    if (domain.endsWith('.gov')) return 'government'
    if (domain.endsWith('.edu')) return 'academic'
    if (domain.includes('news') || domain.includes('times')) return 'news'
    
    return 'other'
  }

  private isRecentDate(dateString: string): boolean {
    try {
      const date = new Date(dateString)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      return date > twoYearsAgo
    } catch {
      return false
    }
  }
}

class SerpAPIProvider implements SearchProvider {
  name = 'Google Search (SerpAPI)'
  private apiKey: string | null = null

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || null
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('SerpAPI key not configured')
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: this.apiKey,
        num: (options.maxResults || 10).toString(),
        hl: 'en',
        gl: 'us'
      })

      if (options.timeFilter) {
        params.append('tbs', `qdr:${options.timeFilter[0]}`) // d, w, m, y
      }

      const response = await fetch(`https://serpapi.com/search?${params}`)
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`)
      }

      const data = await response.json()
      return this.formatSerpResults(data.organic_results || [], query)
    } catch (error) {
      console.error('SerpAPI Search error:', error)
      return []
    }
  }

  async factCheck(claim: string): Promise<FactCheckResult> {
    const query = `"${claim}" fact check site:snopes.com OR site:factcheck.org OR site:politifact.com`
    const results = await this.search(query, { maxResults: 5 })
    
    return {
      claim,
      verdict: 'unverified',
      confidence: results.length > 0 ? 60 : 20,
      sources: results,
      explanation: `Found ${results.length} potential fact-checking sources`,
      lastUpdated: new Date().toISOString()
    }
  }

  private formatSerpResults(results: any[], query: string): SearchResult[] {
    return results.map(result => ({
      title: result.title || '',
      url: result.link || '',
      snippet: result.snippet || '',
      domain: this.extractDomain(result.link || ''),
      publishedDate: result.date,
      credibilityScore: this.calculateCredibilityScore(result.link || ''),
      sourceType: this.determineSourceType(result.link || ''),
      isRecent: result.date ? this.isRecentDate(result.date) : false,
      keyQuotes: this.extractKeyQuotes(result.snippet || '', query)
    }))
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  private calculateCredibilityScore(url: string): number {
    const domain = this.extractDomain(url)
    
    if (domain.endsWith('.gov')) return 95
    if (domain.endsWith('.edu')) return 90
    if (['reuters.com', 'apnews.com', 'bbc.com'].some(d => domain.includes(d))) return 85
    
    return 70
  }

  private determineSourceType(url: string): SearchResult['sourceType'] {
    const domain = this.extractDomain(url)
    
    if (domain.endsWith('.gov')) return 'government'
    if (domain.endsWith('.edu')) return 'academic'
    
    return 'other'
  }

  private isRecentDate(dateString: string): boolean {
    try {
      const date = new Date(dateString)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      return date > twoYearsAgo
    } catch {
      return false
    }
  }

  private extractKeyQuotes(snippet: string, query: string): string[] {
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 3)
    
    return sentences
      .filter(sentence => 
        queryTerms.some(term => sentence.toLowerCase().includes(term))
      )
      .map(sentence => sentence.trim())
      .slice(0, 2)
  }
}

// =============================================================================
// WEB SEARCH SERVICE
// =============================================================================

export class WebSearchService {
  private providers: SearchProvider[] = []
  private cache = new Map<string, { data: SearchResult[]; timestamp: number }>()
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  constructor() {
    // Initialize providers in priority order: Brave > Perplexity > SerpAPI
    this.providers = [
      new BraveSearchProvider(),
      new PerplexitySearchProvider(),
      new SerpAPIProvider()
    ]
  }

  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return true
      }
    }
    return false
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const cacheKey = `${query}-${JSON.stringify(options)}`
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // Try providers in order
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          console.log(`🔍 Using ${provider.name} for search: "${query}"`)
          const results = await provider.search(query, options)
          
          // Cache results
          this.cache.set(cacheKey, { data: results, timestamp: Date.now() })
          
          return results
        } catch (error) {
          console.warn(`${provider.name} search failed:`, error)
          continue
        }
      }
    }

    console.warn('No search providers available')
    return []
  }

  async factCheck(claim: string): Promise<FactCheckResult> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          console.log(`🔍 Fact-checking with ${provider.name}: "${claim}"`)
          return await provider.factCheck(claim)
        } catch (error) {
          console.warn(`${provider.name} fact-check failed:`, error)
          continue
        }
      }
    }

    return {
      claim,
      verdict: 'unverified',
      confidence: 0,
      sources: [],
      explanation: 'No fact-checking providers available',
      lastUpdated: new Date().toISOString()
    }
  }

  async enrichTermDefinition(term: string, definition: string): Promise<WebSearchEnrichment> {
    const searchTerms = [
      `"${term}" government definition`,
      `${term} 2024 2025 current`,
      `${term} examples recent`,
      `how does ${term} work`,
      `${term} controversy scandal`
    ]

    const allResults: SearchResult[] = []
    const factChecks: FactCheckResult[] = []

    // Perform searches
    for (const searchTerm of searchTerms) {
      try {
        const results = await this.search(searchTerm, { 
          maxResults: 5,
          timeFilter: 'year' // Focus on recent content
        })
        allResults.push(...results)
      } catch (error) {
        console.warn(`Search failed for "${searchTerm}":`, error)
      }
    }

    // Fact-check key claims in the definition
    const claims = this.extractClaimsFromDefinition(definition)
    for (const claim of claims.slice(0, 2)) { // Limit to avoid rate limits
      try {
        const factCheck = await this.factCheck(claim)
        factChecks.push(factCheck)
      } catch (error) {
        console.warn(`Fact-check failed for "${claim}":`, error)
      }
    }

    // Categorize results
    const governmentSources = allResults.filter(r => r.sourceType === 'government')
    const academicSources = allResults.filter(r => r.sourceType === 'academic')
    const newsSources = allResults.filter(r => r.sourceType === 'news')
    const currentEvents = allResults.filter(r => r.isRecent && r.sourceType === 'news')

    // Calculate overall credibility
    const avgCredibility = allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.credibilityScore, 0) / allResults.length
      : 0

    // Generate suggestions for improvement
    const suggestions = this.generateImprovementSuggestions(allResults, factChecks, definition)

    return {
      searchedTerms: searchTerms,
      totalResults: allResults.length,
      governmentSources: governmentSources.slice(0, 3),
      academicSources: academicSources.slice(0, 3),
      newsSources: newsSources.slice(0, 5),
      currentEvents: currentEvents.slice(0, 3),
      factChecks,
      suggestions,
      overallCredibility: Math.round(avgCredibility),
      lastSearched: new Date().toISOString()
    }
  }

  private extractClaimsFromDefinition(definition: string): string[] {
    // Simple claim extraction - look for sentences with specific verbs or numbers
    const sentences = definition.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    return sentences
      .filter(sentence => {
        const lower = sentence.toLowerCase()
        return lower.includes('killed') || 
               lower.includes('died') || 
               lower.includes('cost') ||
               lower.includes('billion') ||
               lower.includes('million') ||
               lower.includes('approved') ||
               lower.includes('banned') ||
               lower.includes('increased') ||
               lower.includes('decreased')
      })
      .map(s => s.trim())
      .slice(0, 3)
  }

  private generateImprovementSuggestions(
    results: SearchResult[], 
    factChecks: FactCheckResult[], 
    definition: string
  ): string[] {
    const suggestions: string[] = []

    // Check for recent developments
    const recentResults = results.filter(r => r.isRecent)
    if (recentResults.length > 0) {
      suggestions.push('Consider adding recent 2024-2025 developments and examples')
    }

    // Check for government sources
    const govSources = results.filter(r => r.sourceType === 'government')
    if (govSources.length === 0) {
      suggestions.push('Add official government sources or documentation')
    }

    // Check fact-check results
    const problematicFactChecks = factChecks.filter(fc => 
      fc.verdict === 'false' || fc.verdict === 'mostly_false'
    )
    if (problematicFactChecks.length > 0) {
      suggestions.push('Some claims may need verification - check fact-checking sources')
    }

    // Check for formulaic language patterns
    if (definition.includes('should have') || definition.match(/these .+ who should/i)) {
      suggestions.push('Replace passive "should have" language with direct, active statements')
    }

    // Check for vague language
    const vagueTerms = ['officials', 'some experts', 'many believe', 'it is said']
    if (vagueTerms.some(term => definition.toLowerCase().includes(term))) {
      suggestions.push('Replace vague terms with specific names, titles, and organizations')
    }

    // Check for concrete examples
    const hasNumbers = /\$[\d,]+|\d+%|\d+ (people|deaths|cases)/.test(definition)
    if (!hasNumbers) {
      suggestions.push('Add specific numbers, dollar amounts, or measurable impacts')
    }

    return suggestions
  }

  clearCache(): void {
    this.cache.clear()
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const webSearchService = new WebSearchService()

// Types are already exported above as interfaces 