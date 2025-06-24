/**
 * News AI Agent Monitor API Route
 * 
 * This route implements the core NewsAIAgent that continuously monitors breaking news
 * and automatically generates comprehensive civic education content packages.
 * 
 * The agent follows CivicSense's mission of revealing uncomfortable truths about power
 * and transforming passive observers into confident civic participants.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// CORE INTERFACES AND TYPES
// ============================================================================

/**
 * Represents a breaking news event with civic relevance analysis
 */
interface NewsEvent {
  /** Unique identifier for the news event */
  id: string
  /** Main headline of the news event */
  headline: string
  /** Full article content */
  content: string
  /** Source URL where the news was found */
  sourceUrl: string
  /** Publisher/source name (e.g., "Reuters", "AP News") */
  source: string
  /** When the news was published */
  publishedAt: string
  /** When we discovered this news */
  discoveredAt: string
  
  /** Civic relevance score (0-100) - higher means more relevant for civic education */
  civicRelevanceScore: number
  /** Power dynamics revealed by this news */
  powerDynamicsRevealed: string[]
  /** Specific government actors involved */
  governmentActorsInvolved: string[]
  /** Policy areas affected */
  policyAreasAffected: string[]
  /** Potential civic actions citizens can take */
  potentialCivicActions: string[]
  
  /** Content generation status */
  contentGenerationStatus: 'pending' | 'processing' | 'completed' | 'failed'
  /** Generated content package ID if completed */
  contentPackageId?: string
  
  /** Additional metadata from source_metadata table */
  credibilityScore?: number
  biasRating?: string
  domain?: string
}

/**
 * Configuration for the News AI Agent
 */
interface AgentConfig {
  /** Whether the agent is currently active */
  isActive: boolean
  /** How often to check for new news (in minutes) */
  monitoringIntervalMinutes: number
  /** Minimum civic relevance score to trigger content generation */
  minCivicRelevanceScore: number
  /** Maximum number of news events to process per cycle */
  maxEventsPerCycle: number
  
  /** Content generation settings */
  contentGeneration: {
    /** Whether to generate question topics */
    generateQuestions: boolean
    /** Whether to generate skills */
    generateSkills: boolean
    /** Whether to generate glossary terms */
    generateGlossary: boolean
    /** Whether to generate events */
    generateEvents: boolean
    /** Whether to generate public figures */
    generatePublicFigures: boolean
  }

  /** Database table targeting configuration */
  databaseTargets: {
    /** Whether to save to content_packages tracking table */
    saveToContentPackages: boolean
    /** Whether to save directly to content tables */
    saveToContentTables: boolean
    /** Specific tables to target */
    targetTables: {
      question_topics: boolean
      questions: boolean
      skills: boolean
      glossary_terms: boolean
      events: boolean
      public_figures: boolean
    }
    /** Custom table mappings (for enterprise/custom schemas) */
    customTableMappings?: {
      question_topics?: string
      questions?: string
      skills?: string
      glossary_terms?: string
      events?: string
      public_figures?: string
      content_packages?: string
    }
    /** Schema configuration */
    schemaConfig: {
      /** Database schema name (default: 'public') */
      schemaName: string
      /** Whether to use custom field mappings */
      useCustomFieldMappings: boolean
      /** Custom field mappings for each table */
      customFieldMappings?: {
        question_topics?: Record<string, string>
        questions?: Record<string, string>
        skills?: Record<string, string>
        glossary_terms?: Record<string, string>
        events?: Record<string, string>
        public_figures?: Record<string, string>
      }
    }
  }
  
  /** AI provider configuration */
  aiProvider: 'openai' | 'anthropic'
  /** Model to use for content generation */
  aiModel: string
  
  /** Quality control settings */
  qualityControl: {
    /** Minimum quality score for auto-publishing */
    minQualityScore: number
    /** Whether to require human review before publishing */
    requireHumanReview: boolean
    /** Whether to set content as active by default */
    publishAsActive: boolean
    /** Whether to validate schema before insertion */
    validateSchema: boolean
  }
}

/**
 * Content package generated from a news event
 */
interface ContentPackage {
  /** Unique identifier */
  id: string
  /** Source news event ID */
  newsEventId: string
  /** When this package was generated */
  generatedAt: string
  
  /** Generated content components */
  questionTopic?: {
    topicId: string
    title: string
    description: string
  }
  questions?: Array<{
    text: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  skills?: Array<{
    skillId: string
    title: string
    description: string
  }>
  glossaryTerms?: Array<{
    term: string
    definition: string
    context: string
  }>
  events?: Array<{
    title: string
    description: string
    date: string
    significance: string
  }>
  publicFigures?: Array<{
    name: string
    role: string
    bio: string
    relevanceToTopic: string
  }>
  
  /** Quality scores for each component */
  qualityScores: {
    overall: number
    brandVoiceCompliance: number
    factualAccuracy: number
    civicActionability: number
  }
  
  /** Publication status */
  status: 'draft' | 'review' | 'published' | 'rejected'
}

// ============================================================================
// NEWS AI AGENT IMPLEMENTATION
// ============================================================================

/**
 * Main News AI Agent class that orchestrates news monitoring and content generation
 */
class NewsAIAgent {
  private supabase: any
  private config: AgentConfig
  private isRunning: boolean = false
  private monitoringInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Initialize with default configuration
    this.config = {
      isActive: false,
      monitoringIntervalMinutes: 15,
      minCivicRelevanceScore: 70,
      maxEventsPerCycle: 5,
      contentGeneration: {
        generateQuestions: true,
        generateSkills: true,
        generateGlossary: true,
        generateEvents: true,
        generatePublicFigures: true
      },
      aiProvider: 'openai',
      aiModel: 'gpt-4',
      qualityControl: {
        minQualityScore: 75,
        requireHumanReview: true,
        publishAsActive: true,
        validateSchema: true
      },
      databaseTargets: {
        saveToContentPackages: true,
        saveToContentTables: true,
        targetTables: {
          question_topics: true,
          questions: true,
          skills: true,
          glossary_terms: true,
          events: true,
          public_figures: true
        },
        schemaConfig: {
          schemaName: 'public',
          useCustomFieldMappings: false,
          customFieldMappings: {}
        }
      }
    }
  }

  /**
   * Initialize the agent with database connection
   */
  async initialize() {
    this.supabase = await createClient()
    
    // Load configuration from database
    const { data: savedConfig } = await this.supabase
      .from('news_agent_config')
      .select('*')
      .single()
    
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig.config }
    }
  }

  /**
   * Start the news monitoring loop
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    this.config.isActive = true

    console.log('🚀 News AI Agent started monitoring...')

    // Initial run
    await this.monitoringCycle()

    // Set up interval for continuous monitoring
    this.monitoringInterval = setInterval(
      () => this.monitoringCycle(),
      this.config.monitoringIntervalMinutes * 60 * 1000
    )

    // Save updated config
    await this.saveConfig()
  }

  /**
   * Stop the news monitoring loop
   */
  async stopMonitoring(): Promise<void> {
    this.isRunning = false
    this.config.isActive = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('⏹️ News AI Agent stopped monitoring')
    await this.saveConfig()
  }

  /**
   * Single monitoring cycle - check for news and process events
   */
  private async monitoringCycle(): Promise<void> {
    try {
      console.log('🔍 Starting monitoring cycle...')

      // Fetch latest news from multiple sources
      const newsEvents = await this.fetchLatestNews()
      
      // Analyze civic relevance for each event
      const relevantEvents = await this.analyzeNewsRelevance(newsEvents)
      
      // Filter events that meet our threshold
      const eventsToProcess = relevantEvents
        .filter(event => event.civicRelevanceScore >= this.config.minCivicRelevanceScore)
        .slice(0, this.config.maxEventsPerCycle)

      console.log(`📊 Found ${eventsToProcess.length} relevant news events`)

      // Generate content packages for each relevant event
      for (const event of eventsToProcess) {
        await this.generateContentPackage(event)
      }

      // Log monitoring cycle completion
      await this.logMonitoringCycle({
        timestamp: new Date().toISOString(),
        eventsFound: newsEvents.length,
        relevantEvents: relevantEvents.length,
        eventsProcessed: eventsToProcess.length,
        status: 'completed'
      })

    } catch (error) {
      console.error('❌ Error in monitoring cycle:', error)
      
      await this.logMonitoringCycle({
        timestamp: new Date().toISOString(),
        eventsFound: 0,
        relevantEvents: 0,
        eventsProcessed: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Fetch latest news from multiple sources
   * Enhanced to work seamlessly with news ticker saved articles
   */
  private async fetchLatestNews(): Promise<Partial<NewsEvent>[]> {
    try {
      console.log('📰 Fetching news from source_metadata (populated by news ticker)...')
      
      // Query the source_metadata table for recent news articles with better filtering
      const { data: newsArticles, error } = await this.supabase
        .from('source_metadata')
        .select('*')
        .not('title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200) // Get more articles for better analysis
        .gte('last_fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days instead of 24 hours

      if (error) {
        console.error('Error fetching news from source_metadata:', error)
        // Trigger news ticker refresh if no articles found
        await this.triggerNewsTickerRefresh()
        return this.getMockNewsData()
      }

      if (!newsArticles || newsArticles.length === 0) {
        console.log('No recent news found in source_metadata, triggering news ticker refresh...')
        await this.triggerNewsTickerRefresh()
        return this.getMockNewsData()
      }

      // Convert source_metadata entries to NewsEvent format with enhanced mapping
      const newsEvents: Partial<NewsEvent>[] = newsArticles
        .filter((article: any) => this.isNewsArticleValid(article))
        .map((article: any) => ({
          id: `source_${article.id}`,
          headline: article.title || article.og_title || 'Untitled Article',
          content: article.description || article.og_description || 'No content available',
          sourceUrl: article.url,
          source: article.og_site_name || article.domain || 'Unknown Source',
          publishedAt: article.published_time || article.created_at,
          discoveredAt: article.last_fetched_at || new Date().toISOString(),
          // Additional metadata from source_metadata
          credibilityScore: article.credibility_score || 70,
          biasRating: article.bias_rating || 'unknown',
          domain: article.domain
        }))

      console.log(`📰 Found ${newsEvents.length} valid news articles from source_metadata`)
      console.log(`🎯 Articles from sources: ${[...new Set(newsEvents.map(e => e.source))].join(', ')}`)
      
      return newsEvents

    } catch (error) {
      console.error('Error in fetchLatestNews:', error)
      await this.triggerNewsTickerRefresh()
      return this.getMockNewsData()
    }
  }

  /**
   * Validate that a news article from source_metadata is suitable for processing
   */
  private isNewsArticleValid(article: Record<string, any>): boolean {
    // Must have title and it should be substantial (not just a domain)
    if (!article.title || article.title.length < 10) return false
    
    // Skip malformed entries that start with "[{" or similar
    if (article.title.startsWith('[{') || article.title.startsWith('{')) return false
    
    // Must have a URL or domain
    if (!article.url && !article.domain) return false
    
    // If we have a description, it should be substantial, but it's not required
    if (article.description && article.description.length < 20) return false
    
    // Skip entries that are just domain names (title equals domain)
    if (article.title === article.domain) return false
    
    // More lenient approach - don't require high credibility, just exclude obviously bad sources
    const lowQualityIndicators = ['spam', 'fake', 'clickbait', 'tabloid']
    const titleLower = article.title.toLowerCase()
    const domainLower = (article.domain || '').toLowerCase()
    
    if (lowQualityIndicators.some(indicator => 
      titleLower.includes(indicator) || domainLower.includes(indicator)
    )) {
      return false
    }
    
    return true
  }

  /**
   * Trigger news ticker refresh to populate source_metadata with fresh articles
   */
  private async triggerNewsTickerRefresh(): Promise<void> {
    try {
      console.log('🔄 Triggering news ticker refresh to get fresh articles...')
      
      // Call the news headlines API to refresh the source_metadata table
      const response = await fetch('/api/news/headlines?maxArticles=50', {
        method: 'GET',
        headers: {
          'User-Agent': 'CivicSense-AI-Agent/1.0'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ News ticker refresh successful: ${result.articles?.length || 0} articles processed`)
      } else {
        console.warn('⚠️ News ticker refresh failed:', response.statusText)
      }
      
    } catch (error) {
      console.error('❌ Error triggering news ticker refresh:', error)
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  /**
   * Fallback mock data when database queries fail
   */
  private getMockNewsData(): Partial<NewsEvent>[] {
    return [
      {
        id: 'mock_001',
        headline: 'Senate Votes to Block Federal Minimum Wage Increase',
        content: 'The Senate voted 52-48 to block a proposed federal minimum wage increase to $15/hour. All Republican senators and 2 Democratic senators voted against the measure...',
        sourceUrl: 'https://example.com/news/minimum-wage-vote',
        source: 'Associated Press',
        publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        discoveredAt: new Date().toISOString()
      },
      {
        id: 'mock_002', 
        headline: 'Celebrity Divorce Settlement Finalized',
        content: 'Famous actor and actress finalize their divorce settlement...',
        sourceUrl: 'https://example.com/entertainment/celebrity-divorce',
        source: 'Entertainment Weekly',
        publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        discoveredAt: new Date().toISOString()
      }
    ]
  }

  /**
   * Analyze civic relevance of news events
   */
  private async analyzeNewsRelevance(newsEvents: Partial<NewsEvent>[]): Promise<NewsEvent[]> {
    const analyzedEvents: NewsEvent[] = []

    for (const event of newsEvents) {
      // In production, this would use AI to analyze civic relevance
      // For now, we'll use rule-based scoring
      
      const civicRelevanceScore = this.calculateCivicRelevanceScore(event)
      const powerDynamics = this.identifyPowerDynamics(event)
      const governmentActors = this.identifyGovernmentActors(event)
      const policyAreas = this.identifyPolicyAreas(event)
      const civicActions = this.identifyPotentialCivicActions(event)

      analyzedEvents.push({
        ...event,
        civicRelevanceScore,
        powerDynamicsRevealed: powerDynamics,
        governmentActorsInvolved: governmentActors,
        policyAreasAffected: policyAreas,
        potentialCivicActions: civicActions,
        contentGenerationStatus: 'pending'
      } as NewsEvent)
    }

    return analyzedEvents
  }

  /**
   * Calculate civic relevance score based on content analysis
   * Enhanced to use source_metadata credibility and bias information
   */
  private calculateCivicRelevanceScore(event: Partial<NewsEvent>): number {
    let score = 0
    const headline = event.headline?.toLowerCase() || ''
    const content = event.content?.toLowerCase() || ''
    const fullText = headline + ' ' + content

    // Base civic relevance from content
    const civicScore = this.calculateBaseCivicScore(fullText)
    score += civicScore

    // Credibility bonus from source_metadata
    if (event.credibilityScore) {
      const credibilityBonus = Math.floor((event.credibilityScore - 50) / 5) // Scale 50-100 to 0-10 bonus
      score += Math.max(0, credibilityBonus)
    }

    // Source bias adjustment - center and center-left/right sources get bonus
    if (event.biasRating) {
      const biasMultiplier = this.getBiasRelevanceMultiplier(event.biasRating)
      score = Math.floor(score * biasMultiplier)
    }

    // Domain-specific bonuses for trusted political news sources
    if (event.domain) {
      const domainBonus = this.getDomainCivicBonus(event.domain)
      score += domainBonus
    }

    // Penalty for entertainment and non-civic content
    const entertainmentPenalty = this.getEntertainmentPenalty(fullText)
    score -= entertainmentPenalty

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate base civic relevance score from content
   */
  private calculateBaseCivicScore(text: string): number {
    let score = 0

    // High-value civic keywords (worth more points)
    const highValueKeywords = [
      'constitution', 'democracy', 'voting rights', 'civil rights', 'supreme court',
      'federal budget', 'congressional hearing', 'senate vote', 'house vote',
      'executive order', 'presidential', 'gubernatorial', 'mayoral'
    ]
    const highValueMatches = highValueKeywords.filter(keyword => text.includes(keyword))
    score += highValueMatches.length * 25

    // Medium-value civic keywords
    const mediumValueKeywords = [
      'congress', 'senate', 'house', 'election', 'legislation', 'policy', 'bill',
      'governor', 'mayor', 'city council', 'state legislature', 'ballot measure',
      'primary election', 'general election', 'midterm', 'campaign finance'
    ]
    const mediumValueMatches = mediumValueKeywords.filter(keyword => text.includes(keyword))
    score += mediumValueMatches.length * 15

    // Government institutions and processes
    const govKeywords = [
      'federal', 'state', 'local', 'government', 'agency', 'department',
      'regulatory', 'oversight', 'investigation', 'hearing', 'committee'
    ]
    const govMatches = govKeywords.filter(keyword => text.includes(keyword))
    score += govMatches.length * 10

    // Policy areas that affect citizens
    const policyKeywords = [
      'healthcare', 'education', 'immigration', 'environment', 'climate',
      'minimum wage', 'tax', 'budget', 'spending', 'infrastructure',
      'social security', 'medicare', 'medicaid', 'unemployment'
    ]
    const policyMatches = policyKeywords.filter(keyword => text.includes(keyword))
    score += policyMatches.length * 12

    return score
  }

  /**
   * Get bias relevance multiplier based on source bias rating
   */
  private getBiasRelevanceMultiplier(biasRating: string): number {
    switch (biasRating.toLowerCase()) {
      case 'center':
        return 1.2 // 20% bonus for center sources
      case 'center-left':
      case 'center-right':
        return 1.1 // 10% bonus for center-leaning sources
      case 'left':
      case 'right':
        return 1.0 // No penalty for clearly biased but transparent sources
      case 'far-left':
      case 'far-right':
        return 0.8 // 20% penalty for extreme bias
      default:
        return 1.0 // No adjustment for unknown bias
    }
  }

  /**
   * Get civic relevance bonus based on news domain
   */
  private getDomainCivicBonus(domain: string): number {
    const domainLower = domain.toLowerCase()

    // Tier 1: Highest civic relevance sources
    const tier1Domains = [
      'politico.com', 'thehill.com', 'rollcall.com', 'govexec.com',
      'federalnewsnetwork.com', 'congress.gov', 'whitehouse.gov'
    ]
    if (tier1Domains.some(d => domainLower.includes(d))) return 20

    // Tier 2: High civic relevance sources
    const tier2Domains = [
      'reuters.com', 'apnews.com', 'npr.org', 'pbs.org', 'bbc.com',
      'washingtonpost.com', 'nytimes.com', 'wsj.com', 'axios.com'
    ]
    if (tier2Domains.some(d => domainLower.includes(d))) return 15

    // Tier 3: Good civic relevance sources
    const tier3Domains = [
      'cnn.com', 'foxnews.com', 'msnbc.com', 'cbsnews.com', 'abcnews.go.com',
      'nbcnews.com', 'usatoday.com', 'bloomberg.com'
    ]
    if (tier3Domains.some(d => domainLower.includes(d))) return 10

    // Government domains get high bonus
    if (domainLower.endsWith('.gov')) return 25

    return 0
  }

  /**
   * Calculate penalty for entertainment and non-civic content
   */
  private getEntertainmentPenalty(text: string): number {
    let penalty = 0

    // Entertainment keywords
    const entertainmentKeywords = [
      'celebrity', 'actor', 'actress', 'movie', 'film', 'tv show', 'television',
      'music', 'album', 'song', 'concert', 'entertainment', 'hollywood',
      'divorce', 'wedding', 'dating', 'relationship', 'fashion', 'style'
    ]
    const entertainmentMatches = entertainmentKeywords.filter(keyword => text.includes(keyword))
    penalty += entertainmentMatches.length * 15

    // Sports keywords (unless related to politics/policy)
    if (!text.includes('policy') && !text.includes('government') && !text.includes('funding')) {
      const sportsKeywords = ['sports', 'football', 'basketball', 'baseball', 'soccer', 'game', 'playoff']
      const sportsMatches = sportsKeywords.filter(keyword => text.includes(keyword))
      penalty += sportsMatches.length * 10
    }

    // Business/financial (unless policy-related)
    if (!text.includes('regulation') && !text.includes('policy') && !text.includes('government')) {
      const businessKeywords = ['earnings', 'quarterly', 'stock price', 'ipo', 'merger', 'acquisition']
      const businessMatches = businessKeywords.filter(keyword => text.includes(keyword))
      penalty += businessMatches.length * 8
    }

    return penalty
  }

  /**
   * Identify power dynamics revealed by the news event
   */
  private identifyPowerDynamics(event: Partial<NewsEvent>): string[] {
    // In production, this would use AI analysis
    // For mock, return relevant power dynamics based on content
    
    const dynamics: string[] = []
    const content = (event.headline + ' ' + event.content).toLowerCase()

    if (content.includes('senate') || content.includes('vote')) {
      dynamics.push('Legislative power concentration in Senate')
      dynamics.push('Party line voting patterns override constituent interests')
    }

    if (content.includes('minimum wage')) {
      dynamics.push('Corporate influence on wage policy')
      dynamics.push('Regional economic disparities in federal policy')
    }

    return dynamics
  }

  /**
   * Identify government actors involved in the news event
   */
  private identifyGovernmentActors(event: Partial<NewsEvent>): string[] {
    // In production, this would use NER (Named Entity Recognition)
    const actors: string[] = []
    const content = (event.headline + ' ' + event.content).toLowerCase()

    if (content.includes('senate')) {
      actors.push('U.S. Senate')
    }
    if (content.includes('congress')) {
      actors.push('U.S. Congress')
    }
    if (content.includes('federal')) {
      actors.push('Federal Government')
    }

    return actors
  }

  /**
   * Identify policy areas affected by the news event
   */
  private identifyPolicyAreas(event: Partial<NewsEvent>): string[] {
    const areas: string[] = []
    const content = (event.headline + ' ' + event.content).toLowerCase()

    if (content.includes('minimum wage') || content.includes('economy')) {
      areas.push('Economic Policy')
      areas.push('Labor Rights')
    }
    if (content.includes('healthcare')) {
      areas.push('Healthcare Policy')
    }
    if (content.includes('education')) {
      areas.push('Education Policy')
    }

    return areas
  }

  /**
   * Identify potential civic actions citizens can take
   */
  private identifyPotentialCivicActions(event: Partial<NewsEvent>): string[] {
    const actions: string[] = []
    
    // Always include basic actions
    actions.push('Contact your senators about this vote')
    actions.push('Research your representatives\' positions on minimum wage')
    actions.push('Join local advocacy groups focused on economic justice')
    actions.push('Attend town halls to ask about economic policy positions')

    return actions
  }

  /**
   * Generate comprehensive content package for a news event
   */
  private async generateContentPackage(event: NewsEvent): Promise<void> {
    try {
      console.log(`📝 Generating content package for: ${event.headline}`)

      // Mark event as processing
      event.contentGenerationStatus = 'processing'
      await this.saveNewsEvent(event)

      // Instead of making an HTTP call, directly instantiate the content generator
      // This avoids the fetch URL issue and is more efficient
      const { ContentPackageGenerator } = await import('../content-generator')
      const generator = new ContentPackageGenerator(this.supabase, this.config.aiProvider)
      
      const contentTypes = {
        questions: this.config.contentGeneration.generateQuestions,
        skills: this.config.contentGeneration.generateSkills,
        glossary: this.config.contentGeneration.generateGlossary,
        events: this.config.contentGeneration.generateEvents,
        publicFigures: this.config.contentGeneration.generatePublicFigures
      }

      const { packageId, content, qualityScores } = await generator.generateContentPackage(
        event,
        contentTypes,
        this.config.qualityControl.minQualityScore
      )

      // Update event status
      event.contentGenerationStatus = 'completed'
      event.contentPackageId = packageId
      await this.saveNewsEvent(event)

      console.log(`✅ Content package generated successfully: ${packageId}`)

    } catch (error) {
      console.error(`❌ Failed to generate content package for ${event.id}:`, error)
      
      event.contentGenerationStatus = 'failed'
      await this.saveNewsEvent(event)
    }
  }

  /**
   * Save news event to database
   */
  private async saveNewsEvent(event: NewsEvent): Promise<void> {
    await this.supabase
      .from('news_events')
      .upsert(event, { onConflict: 'id' })
  }

  /**
   * Save agent configuration to database
   */
  private async saveConfig(): Promise<void> {
    await this.supabase
      .from('news_agent_config')
      .upsert({
        id: 'singleton',
        config: this.config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
  }

  /**
   * Log monitoring cycle results
   */
  private async logMonitoringCycle(log: {
    timestamp: string
    eventsFound: number
    relevantEvents: number
    eventsProcessed: number
    status: 'completed' | 'failed'
    error?: string
  }): Promise<void> {
    await this.supabase
      .from('news_agent_logs')
      .insert(log)
  }

  // Getter methods for accessing private properties
  get currentConfig(): AgentConfig {
    return this.config
  }

  get runningStatus(): boolean {
    return this.isRunning
  }
}

// Global agent instance
let agentInstance: NewsAIAgent | null = null

/**
 * Get or create the singleton agent instance
 */
async function getAgentInstance(): Promise<NewsAIAgent> {
  if (!agentInstance) {
    agentInstance = new NewsAIAgent()
    await agentInstance.initialize()
  }
  return agentInstance
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/admin/news-agent/monitor
 * Get agent status and recent activity
 */
export async function GET() {
  try {
    const agent = await getAgentInstance()
    const supabaseClient = await createClient()

    // Get recent logs
    const { data: recentLogs } = await supabaseClient
      .from('news_agent_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    // Get recent news events
    const { data: recentEvents } = await supabaseClient
      .from('news_events')
      .select('*')
      .order('discovered_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          isRunning: agent.runningStatus,
          config: agent.currentConfig
        },
        recentLogs: recentLogs || [],
        recentEvents: recentEvents || []
      }
    })

  } catch (error) {
    console.error('Error getting agent status:', error)
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/news-agent/monitor
 * Start or stop the news monitoring agent
 */
export async function POST(request: NextRequest) {
  try {
    const { action, config } = await request.json()
    const agent = await getAgentInstance()

    if (action === 'start') {
      // Update config if provided
      if (config) {
        Object.assign(agent.currentConfig, config)
      }
      
      await agent.startMonitoring()
      
      return NextResponse.json({
        success: true,
        message: 'News AI Agent started successfully'
      })

    } else if (action === 'stop') {
      await agent.stopMonitoring()
      
      return NextResponse.json({
        success: true,
        message: 'News AI Agent stopped successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error controlling agent:', error)
    return NextResponse.json(
      { error: 'Failed to control agent' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/news-agent/monitor
 * Update agent configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const newConfig = await request.json()
    const agent = await getAgentInstance()

    // Update configuration
    Object.assign(agent.currentConfig, newConfig)
    
    // Save to database
    const supabaseClient = await createClient()
    await supabaseClient
      .from('news_agent_config')
      .upsert({
        id: 'singleton',
        config: agent.currentConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      message: 'Agent configuration updated successfully',
      config: agent.currentConfig
    })

  } catch (error) {
    console.error('Error updating agent config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
} 