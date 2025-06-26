/**
 * AI Collection Organizer Agent for CivicSense
 * 
 * Intelligently organizes content into thematic collections by analyzing:
 * - Content themes and relationships
 * - Skill inheritance and aggregation
 * - Source diversity and credibility
 * - Learning progression and difficulty
 * 
 * @example
 * ```typescript
 * const agent = new CollectionOrganizerAgent()
 * const suggestions = await agent.suggestCollections(contentItems)
 * const collection = await agent.createCollection(suggestion)
 * ```
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  Collection, 
  CollectionItem, 
  CreateCollectionRequest,
  COLLECTION_CATEGORIES 
} from '@/types/collections'
import type { CollectionSkill, CollectionSkillSummary } from '@/types/skills'
import { OpenAI } from 'openai'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// ============================================================================
// CONTENT ANALYSIS TYPES
// ============================================================================

interface ContentAnalysis {
  id: string
  type: 'topic' | 'question' | 'glossary_term' | 'survey' | 'event' | 'article'
  title: string
  description: string
  
  // Extracted themes
  primary_themes: string[]
  secondary_themes: string[]
  entities: string[] // People, places, organizations mentioned
  time_periods: string[] // Historical periods, current events
  
  // Content metadata
  difficulty_level: number
  estimated_minutes: number
  skills: CollectionSkill[]
  sources: string[]
  
  // Semantic vectors for similarity
  semantic_embedding?: number[]
  topic_keywords: string[]
  
  // CivicSense specific
  political_entities: string[]
  policy_areas: string[]
  civic_concepts: string[]
  current_relevance: number
}

interface CollectionSuggestion {
  suggested_title: string
  suggested_description: string
  suggested_emoji: string
  suggested_slug: string
  
  // Theme analysis
  primary_theme: string
  theme_confidence: number
  related_themes: string[]
  
  // Content grouping
  content_items: ContentAnalysis[]
  content_coherence_score: number
  
  // Inherited properties
  aggregated_skills: CollectionSkillSummary
  difficulty_range: [number, number]
  total_estimated_minutes: number
  source_diversity_score: number
  
  // Learning design
  suggested_learning_objectives: string[]
  suggested_prerequisites: string[]
  suggested_action_items: string[]
  
  // CivicSense metadata
  current_events_relevance: 1 | 2 | 3 | 4 | 5
  political_balance_score: 1 | 2 | 3 | 4 | 5
  suggested_categories: string[]
  suggested_tags: string[]
}

interface ThemeCluster {
  theme_name: string
  confidence: number
  content_ids: string[]
  keywords: string[]
  entities: string[]
  semantic_center: number[]
}

// ============================================================================
// AI COLLECTION ORGANIZER AGENT
// ============================================================================

export class CollectionOrganizerAgent {
  private supabase = createServiceClient()
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  private embeddingCache = new Map<string, number[]>()
  private similarityCache = new Map<string, number>()
  private readonly EMBEDDING_BATCH_SIZE = 50
  private readonly CACHE_TTL_HOURS = 24
  
  /**
   * Main entry point: analyze content and suggest collections
   */
  async suggestCollections(
    options: {
      content_types?: string[]
      max_suggestions?: number
      min_items_per_collection?: number
      theme_specificity?: 'broad' | 'specific' | 'mixed'
      include_current_events?: boolean
    } = {}
  ): Promise<CollectionSuggestion[]> {
    const {
      content_types = ['topic', 'question'],
      max_suggestions = 10,
      min_items_per_collection = 3,
      theme_specificity = 'mixed',
      include_current_events = true
    } = options
    
    try {
      // Step 1: Fetch and analyze all content
      console.log('🔍 Analyzing content for collection suggestions...')
      const contentAnalyses = await this.analyzeAllContent(content_types)
      
      if (contentAnalyses.length < min_items_per_collection) {
        throw new Error(`Insufficient content: need at least ${min_items_per_collection} items`)
      }
      
      // Step 2: Generate semantic embeddings for similarity analysis
      await this.generateSemanticEmbeddings(contentAnalyses)
      
      // Step 3: Identify theme clusters
      const themeClusters = await this.identifyThemeClusters(
        contentAnalyses, 
        theme_specificity
      )
      
      // Step 4: Generate collection suggestions from clusters
      const suggestions = await this.generateCollectionSuggestions(
        themeClusters,
        contentAnalyses,
        {
          max_suggestions,
          min_items_per_collection,
          include_current_events
        }
      )
      
      // Step 5: Rank and filter suggestions
      const rankedSuggestions = this.rankSuggestions(suggestions)
      
      console.log(`✅ Generated ${rankedSuggestions.length} collection suggestions`)
      return rankedSuggestions.slice(0, max_suggestions)
      
    } catch (error) {
      console.error('❌ Error generating collection suggestions:', error)
      throw error
    }
  }
  
  /**
   * Create a collection from a suggestion
   */
  async createCollectionFromSuggestion(
    suggestion: CollectionSuggestion,
    options: {
      created_by: string
      status?: 'draft' | 'published'
      auto_publish?: boolean
    }
  ): Promise<Collection> {
    try {
      // Create collection record in database
      const collectionData = {
        title: suggestion.suggested_title,
        description: suggestion.suggested_description,
        emoji: suggestion.suggested_emoji,
        slug: suggestion.suggested_slug,
        visibility: 'public' as const, // Add missing visibility property
        categories: suggestion.suggested_categories,
        tags: suggestion.suggested_tags,
        difficulty_level: suggestion.difficulty_range[0],
        estimated_minutes: suggestion.total_estimated_minutes,
        learning_objectives: suggestion.suggested_learning_objectives,
        action_items: suggestion.suggested_action_items,
        skills_required: suggestion.aggregated_skills,
        created_by: options.created_by,
        status: options.status || 'draft',
        is_featured: false,
        is_public: true
      }
      
      const { data: collection, error } = await this.supabase
        .from('collections')
        .insert(collectionData)
        .select()
        .single()
      
      if (error) throw error
      
      // Add content items to collection
      await this.addItemsToCollection(collection.id, suggestion.content_items)
      
      // Store skills summary
      await this.saveCollectionSkillsSummary(
        collection.id, 
        suggestion.aggregated_skills
      )
      
      console.log(`✅ Created collection: ${collection.id}`)
      return collection
      
    } catch (error) {
      console.error('❌ Error creating collection:', error)
      throw error
    }
  }
  
  // ============================================================================
  // CONTENT ANALYSIS METHODS
  // ============================================================================
  
  private async analyzeAllContent(contentTypes: string[]): Promise<ContentAnalysis[]> {
    const analyses: ContentAnalysis[] = []
    
    for (const contentType of contentTypes) {
      switch (contentType) {
        case 'topic':
          const topics = await this.analyzeTopics()
          analyses.push(...topics)
          break
        case 'question':
          const questions = await this.analyzeQuestions()
          analyses.push(...questions)
          break
        // Add other content types as needed
      }
    }
    
    return analyses
  }
  
  private async analyzeTopics(): Promise<ContentAnalysis[]> {
    const { data: topics, error } = await this.supabase
      .from('question_topics')
      .select(`
        topic_id,
        topic_title,
        description
      `)
      .eq('status', 'published')
    
    if (error) {
      console.warn('Failed to fetch topics, using empty array:', error)
      return []
    }
    
    return (topics || []).map(topic => ({
      id: topic.topic_id,
      type: 'topic' as const,
      title: topic.topic_title,
      description: topic.description || '',
      
      // Extract themes from existing data
      primary_themes: this.extractPrimaryThemes(topic),
      secondary_themes: this.extractSecondaryThemes(topic),
      entities: [],
      time_periods: this.extractTimePeriods(topic),
      
      difficulty_level: 3, // Default difficulty
      estimated_minutes: 10, // Default estimated time
      skills: [], // Will be populated later
      sources: [], // Will be populated later
      
      topic_keywords: this.extractKeywords(topic.topic_title, topic.description),
      political_entities: [],
      policy_areas: [],
      civic_concepts: [],
      current_relevance: 3 // Default current events relevance
    }))
  }
  
  private async analyzeQuestions(): Promise<ContentAnalysis[]> {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select(`
        id,
        text,
        topic_id,
        explanation,
        tags,
        question_topics!inner(
          topic_title,
          civic_concepts,
          political_entities,
          policy_areas
        )
      `)
      .eq('is_active', true)
    
    if (error) {
      console.warn('Failed to fetch questions, using empty array:', error)
      return []
    }
    
    return (questions || []).map(question => ({
      id: question.id,
      type: 'question' as const,
      title: question.text,
      description: question.explanation || '',
      
      primary_themes: this.extractPrimaryThemes({
        ...question,
        topic_title: question.question_topics?.topic_title
      }),
      secondary_themes: [],
      entities: question.question_topics?.political_entities || [],
      time_periods: [],
      
      difficulty_level: 3, // Default difficulty
      estimated_minutes: 2, // Typical question time
      skills: [],
      sources: [],
      
      topic_keywords: this.extractKeywords(
        question.text, 
        question.explanation
      ),
      political_entities: question.question_topics?.political_entities || [],
      policy_areas: question.question_topics?.policy_areas || [],
      civic_concepts: question.question_topics?.civic_concepts || [],
      current_relevance: 3
    }))
  }
  
  // ============================================================================
  // THEME EXTRACTION AND CLUSTERING
  // ============================================================================
  
  private extractPrimaryThemes(content: any): string[] {
    const themes: string[] = []
    
    // Extract from policy areas
    if (content.policy_areas?.length) {
      themes.push(...content.policy_areas)
    }
    
    // Extract from civic concepts
    if (content.civic_concepts?.length) {
      themes.push(...content.civic_concepts.slice(0, 3)) // Top 3
    }
    
    // Extract from title analysis
    const titleThemes = this.extractThemesFromText(content.topic_title || content.title)
    themes.push(...titleThemes)
    
    return [...new Set(themes)].slice(0, 5) // Dedupe and limit
  }
  
  private extractSecondaryThemes(content: any): string[] {
    const themes: string[] = []
    
    // Extract from tags
    if (content.tags?.length) {
      themes.push(...content.tags)
    }
    
    // Extract from description
    if (content.description) {
      const descThemes = this.extractThemesFromText(content.description)
      themes.push(...descThemes)
    }
    
    return [...new Set(themes)]
  }
  
  private extractThemesFromText(text: string): string[] {
    if (!text) return []
    
    // CivicSense-specific theme patterns
    const themePatterns = {
      // Current events
      'Ukraine War': /ukraine|russia|putin|zelens|nato|war in ukraine/i,
      'Iran-Israel Conflict': /iran|israel|gaza|hamas|hezbollah|middle east conflict/i,
      'China Relations': /china|taiwan|xi jinping|trade war|south china sea/i,
      
      // Domestic policy
      'Immigration': /immigration|border|asylum|deportation|visa|migrant/i,
      'Healthcare': /healthcare|medicare|medicaid|aca|obamacare|insurance/i,
      'Climate Policy': /climate|environment|green deal|carbon|renewable/i,
      'Gun Policy': /gun|firearm|second amendment|nra|gun control/i,
      
      // Government structure
      'Supreme Court': /supreme court|scotus|justice|judicial/i,
      'Congress': /congress|senate|house|representative|senator/i,
      'Executive Branch': /president|executive|white house|cabinet/i,
      
      // Constitutional topics
      'First Amendment': /first amendment|free speech|religion|press|assembly/i,
      'Voting Rights': /voting|election|ballot|suffrage|gerrymandering/i,
      'Civil Rights': /civil rights|discrimination|equality|segregation/i
    }
    
    const extractedThemes: string[] = []
    
    for (const [theme, pattern] of Object.entries(themePatterns)) {
      if (pattern.test(text)) {
        extractedThemes.push(theme)
      }
    }
    
    return extractedThemes
  }
  
  private extractTimePeriods(content: any): string[] {
    const text = `${content.topic_title || ''} ${content.description || ''}`
    const periods: string[] = []
    
    // Year patterns
    const yearMatches = text.match(/\b(19|20)\d{2}\b/g)
    if (yearMatches) {
      periods.push(...yearMatches)
    }
    
    // Era patterns
    const eraPatterns = {
      'Civil Rights Era': /civil rights movement|1960s|martin luther king/i,
      'Cold War': /cold war|soviet union|communist|1950s|1980s/i,
      'Post-9/11': /9\/11|september 11|war on terror|afghanistan|iraq war/i,
      'Trump Era': /trump administration|2017-2021/i,
      'Biden Era': /biden administration|2021-/i
    }
    
    for (const [era, pattern] of Object.entries(eraPatterns)) {
      if (pattern.test(text)) {
        periods.push(era)
      }
    }
    
    return periods
  }
  
  private extractKeywords(title: string, description?: string): string[] {
    const text = `${title} ${description || ''}`.toLowerCase()
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'how', 'what', 'why', 'when', 'where', 'which',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'
    ])
    
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
    
    // Count frequency and return top keywords
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
    
    return Array.from(wordCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }
  
  private async generateSemanticEmbeddings(analyses: ContentAnalysis[]): Promise<void> {
    // For now, use keyword-based similarity
    // In production, integrate with OpenAI embeddings or similar
    
    for (const analysis of analyses) {
      // Simple keyword-based embedding
      const allText = [
        analysis.title,
        analysis.description,
        ...analysis.primary_themes,
        ...analysis.topic_keywords
      ].join(' ').toLowerCase()
      
      // Create a simple word frequency vector
      const vocabulary = this.buildVocabulary(analyses)
      analysis.semantic_embedding = this.textToVector(allText, vocabulary)
    }
  }
  
  private buildVocabulary(analyses: ContentAnalysis[]): string[] {
    const allWords = new Set<string>()
    
    analyses.forEach(analysis => {
      const text = [
        analysis.title,
        analysis.description,
        ...analysis.primary_themes,
        ...analysis.topic_keywords
      ].join(' ').toLowerCase()
      
      text.split(/\s+/).forEach(word => {
        if (word.length > 2) allWords.add(word)
      })
    })
    
    return Array.from(allWords).slice(0, 1000) // Limit vocabulary size
  }
  
  private textToVector(text: string, vocabulary: string[]): number[] {
    const words = text.split(/\s+/)
    const vector = new Array(vocabulary.length).fill(0)
    
    words.forEach(word => {
      const index = vocabulary.indexOf(word)
      if (index !== -1) {
        vector[index] += 1
      }
    })
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }
  
  private async identifyThemeClusters(
    analyses: ContentAnalysis[],
    specificity: 'broad' | 'specific' | 'mixed'
  ): Promise<ThemeCluster[]> {
    const clusters: ThemeCluster[] = []
    
    // Group by primary themes
    const themeGroups = new Map<string, ContentAnalysis[]>()
    
    analyses.forEach(analysis => {
      analysis.primary_themes.forEach(theme => {
        if (!themeGroups.has(theme)) {
          themeGroups.set(theme, [])
        }
        themeGroups.get(theme)!.push(analysis)
      })
    })
    
    // Create clusters from theme groups
    for (const [theme, items] of themeGroups) {
      if (items.length >= 2) { // Minimum cluster size
        const cluster: ThemeCluster = {
          theme_name: theme,
          confidence: this.calculateThemeConfidence(items, theme),
          content_ids: items.map(item => item.id),
          keywords: this.extractClusterKeywords(items),
          entities: this.extractClusterEntities(items),
          semantic_center: this.calculateSemanticCenter(items)
        }
        
        clusters.push(cluster)
      }
    }
    
    // Sort by confidence and size
    return clusters
      .sort((a, b) => {
        const scoreA = a.confidence * a.content_ids.length
        const scoreB = b.confidence * b.content_ids.length
        return scoreB - scoreA
      })
      .slice(0, 20) // Limit number of clusters
  }
  
  private calculateThemeConfidence(items: ContentAnalysis[], theme: string): number {
    let totalScore = 0
    let maxScore = 0
    
    items.forEach(item => {
      const primaryThemeMatch = item.primary_themes.includes(theme) ? 3 : 0
      const secondaryThemeMatch = item.secondary_themes.includes(theme) ? 1 : 0
      const keywordMatch = item.topic_keywords.some(k => 
        k.toLowerCase().includes(theme.toLowerCase()) ||
        theme.toLowerCase().includes(k.toLowerCase())
      ) ? 1 : 0
      
      const itemScore = primaryThemeMatch + secondaryThemeMatch + keywordMatch
      totalScore += itemScore
      maxScore += 5 // Maximum possible score per item
    })
    
    return maxScore > 0 ? totalScore / maxScore : 0
  }
  
  private extractClusterKeywords(items: ContentAnalysis[]): string[] {
    const keywordCounts = new Map<string, number>()
    
    items.forEach(item => {
      item.topic_keywords.forEach(keyword => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
      })
    })
    
    return Array.from(keywordCounts.entries())
      .filter(([, count]) => count >= 2) // Keyword appears in multiple items
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword)
  }
  
  private extractClusterEntities(items: ContentAnalysis[]): string[] {
    const entityCounts = new Map<string, number>()
    
    items.forEach(item => {
      item.entities.forEach(entity => {
        entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1)
      })
    })
    
    return Array.from(entityCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([entity]) => entity)
  }
  
  private calculateSemanticCenter(items: ContentAnalysis[]): number[] {
    if (items.length === 0 || !items[0].semantic_embedding) return []
    
    const dimension = items[0].semantic_embedding.length
    const center = new Array(dimension).fill(0)
    
    items.forEach(item => {
      if (item.semantic_embedding) {
        item.semantic_embedding.forEach((value, index) => {
          center[index] += value
        })
      }
    })
    
    // Average the vectors
    return center.map(sum => sum / items.length)
  }
  
  // ============================================================================
  // COLLECTION SUGGESTION GENERATION
  // ============================================================================
  
  private async generateCollectionSuggestions(
    clusters: ThemeCluster[],
    allContent: ContentAnalysis[],
    options: {
      max_suggestions: number
      min_items_per_collection: number
      include_current_events: boolean
    }
  ): Promise<CollectionSuggestion[]> {
    const suggestions: CollectionSuggestion[] = []
    
    for (const cluster of clusters) {
      if (cluster.content_ids.length < options.min_items_per_collection) continue
      
      const clusterContent = allContent.filter(content => 
        cluster.content_ids.includes(content.id)
      )
      
      const suggestion = await this.createSuggestionFromCluster(cluster, clusterContent)
      
      // Filter by current events relevance if requested
      if (options.include_current_events || suggestion.current_events_relevance >= 3) {
        suggestions.push(suggestion)
      }
      
      if (suggestions.length >= options.max_suggestions) break
    }
    
    return suggestions
  }
  
  private async createSuggestionFromCluster(
    cluster: ThemeCluster,
    content: ContentAnalysis[]
  ): Promise<CollectionSuggestion> {
    const themeName = cluster.theme_name
    
    // Generate collection metadata
    const suggestion: CollectionSuggestion = {
      suggested_title: this.generateCollectionTitle(themeName, cluster),
      suggested_description: this.generateCollectionDescription(themeName, content, cluster),
      suggested_emoji: this.selectCollectionEmoji(themeName),
      suggested_slug: this.generateSlug(themeName),
      
      primary_theme: themeName,
      theme_confidence: cluster.confidence,
      related_themes: this.findRelatedThemes(content),
      
      content_items: content,
      content_coherence_score: this.calculateCoherenceScore(content),
      
      aggregated_skills: await this.aggregateSkills(content),
      difficulty_range: this.calculateDifficultyRange(content),
      total_estimated_minutes: content.reduce((sum, item) => sum + item.estimated_minutes, 0),
      source_diversity_score: this.calculateSourceDiversity(content),
      
      suggested_learning_objectives: this.generateLearningObjectives(themeName, content),
      suggested_prerequisites: this.generatePrerequisites(content),
      suggested_action_items: this.generateActionItems(themeName, content),
      
      current_events_relevance: this.calculateCurrentEventsRelevance(content),
      political_balance_score: this.calculatePoliticalBalance(content),
      suggested_categories: this.suggestCategories(themeName, content),
      suggested_tags: this.suggestTags(content, cluster)
    }
    
    return suggestion
  }
  
  private generateCollectionTitle(themeName: string, cluster: ThemeCluster): string {
    // If theme is specific enough, use it directly
    if (themeName.length > 10 && cluster.entities.length > 0) {
      return themeName
    }
    
    // Otherwise, enhance with context
    const topEntity = cluster.entities[0]
    if (topEntity) {
      return `${themeName}: ${topEntity}`
    }
    
    // Add "Understanding" prefix for broad topics
    return `Understanding ${themeName}`
  }
  
  private generateCollectionDescription(
    themeName: string,
    content: ContentAnalysis[],
    cluster: ThemeCluster
  ): string {
    const itemCount = content.length
    const avgDifficulty = content.reduce((sum, c) => sum + c.difficulty_level, 0) / content.length
    const totalMinutes = content.reduce((sum, c) => sum + c.estimated_minutes, 0)
    
    let description = `Comprehensive collection exploring ${themeName.toLowerCase()}`
    
    if (cluster.entities.length > 0) {
      description += `, covering ${cluster.entities.slice(0, 3).join(', ')}`
    }
    
    description += `. This ${Math.round(totalMinutes / 60)} hour learning path includes ${itemCount} carefully curated items`
    
    if (avgDifficulty >= 4) {
      description += ` designed for advanced learners`
    } else if (avgDifficulty <= 2) {
      description += ` perfect for beginners`
    }
    
    description += '. Build your civic knowledge and learn how power actually works in this critical area.'
    
    return description
  }
  
  private selectCollectionEmoji(themeName: string): string {
    const emojiMap: Record<string, string> = {
      // International relations
      'Ukraine War': '🇺🇦',
      'Iran-Israel Conflict': '🕊️',
      'China Relations': '🇨🇳',
      'NATO': '🛡️',
      
      // Domestic policy
      'Immigration': '🗽',
      'Healthcare': '🏥',
      'Climate Policy': '🌍',
      'Gun Policy': '⚖️',
      'Education': '🎓',
      
      // Government
      'Supreme Court': '⚖️',
      'Congress': '🏛️',
      'Executive Branch': '🏛️',
      'Federal Government': '🇺🇸',
      
      // Rights and freedoms
      'First Amendment': '🗣️',
      'Voting Rights': '🗳️',
      'Civil Rights': '✊',
      'Constitutional Law': '📜',
      
      // Economics
      'Economic Policy': '💰',
      'Trade': '🌐',
      'Labor': '👷',
      
      // Default themes
      'Foreign Policy': '🌍',
      'Domestic Policy': '🏡',
      'Current Events': '📰'
    }
    
    // Check for exact match
    if (emojiMap[themeName]) {
      return emojiMap[themeName]
    }
    
    // Check for partial matches
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (themeName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(themeName.toLowerCase())) {
        return emoji
      }
    }
    
    // Default emoji
    return '📚'
  }
  
  private generateSlug(themeName: string): string {
    return themeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  
  private findRelatedThemes(content: ContentAnalysis[]): string[] {
    const allThemes = new Set<string>()
    
    content.forEach(item => {
      item.secondary_themes.forEach(theme => allThemes.add(theme))
    })
    
    return Array.from(allThemes).slice(0, 5)
  }
  
  private calculateCoherenceScore(content: ContentAnalysis[]): number {
    if (content.length < 2) return 1
    
    // Calculate semantic similarity between items
    let totalSimilarity = 0
    let comparisons = 0
    
    for (let i = 0; i < content.length; i++) {
      for (let j = i + 1; j < content.length; j++) {
        const similarity = this.calculateSimilarity(content[i], content[j])
        totalSimilarity += similarity
        comparisons++
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }
  
  private calculateSimilarity(a: ContentAnalysis, b: ContentAnalysis): number {
    // Theme overlap
    const sharedPrimaryThemes = a.primary_themes.filter(theme => 
      b.primary_themes.includes(theme)
    ).length
    const themeScore = sharedPrimaryThemes / Math.max(a.primary_themes.length, b.primary_themes.length, 1)
    
    // Entity overlap
    const sharedEntities = a.entities.filter(entity => 
      b.entities.includes(entity)
    ).length
    const entityScore = sharedEntities / Math.max(a.entities.length, b.entities.length, 1)
    
    // Keyword overlap
    const sharedKeywords = a.topic_keywords.filter(keyword => 
      b.topic_keywords.includes(keyword)
    ).length
    const keywordScore = sharedKeywords / Math.max(a.topic_keywords.length, b.topic_keywords.length, 1)
    
    // Weighted average
    return (themeScore * 0.5 + entityScore * 0.3 + keywordScore * 0.2)
  }
  
  private async aggregateSkills(content: ContentAnalysis[]): Promise<CollectionSkillSummary> {
    // Analyze the content and aggregate skills
    const skills = content.flatMap(item => item.skills)
    const categories = [...new Set(content.flatMap(item => item.primary_themes))]
    
    return {
      total_skills: skills.length,
      skill_distribution: {
        critical_thinking: Math.round(content.length * 0.8),
        civic_knowledge: Math.round(content.length * 0.9),
        research: Math.round(content.length * 0.6),
        communication: Math.round(content.length * 0.5)
      },
      difficulty_progression: content.map(item => item.difficulty_level),
      mastery_indicators: [
        "Understands key concepts",
        "Can apply knowledge to new situations",
        "Demonstrates critical analysis"
      ]
    }
  }
  
  private calculateDifficultyRange(content: ContentAnalysis[]): [number, number] {
    const difficulties = content.map(c => c.difficulty_level)
    return [Math.min(...difficulties), Math.max(...difficulties)]
  }
  
  private calculateSourceDiversity(content: ContentAnalysis[]): number {
    try {
      const allSources = content.flatMap(item => item.sources || [])
      const uniqueSources = [...new Set(allSources)]
      
      if (uniqueSources.length === 0) return 1
      
      // Calculate diversity metrics
      const sourceDomains = uniqueSources.map(source => {
        try {
          const url = new URL(source)
          return url.hostname.replace('www.', '')
        } catch {
          return source.toLowerCase()
        }
      })
      
      const uniqueDomains = [...new Set(sourceDomains)]
      const domainDiversity = uniqueDomains.length
      
      // Analyze source types
      const sourceTypes = {
        government: sourceDomains.filter(d => d.includes('.gov')).length,
        academic: sourceDomains.filter(d => d.includes('.edu')).length,
        news: sourceDomains.filter(d => ['cnn.com', 'bbc.com', 'reuters.com', 'npr.org', 'politico.com'].includes(d)).length,
        nonprofit: sourceDomains.filter(d => d.includes('.org')).length
      }
      
      const typesDiversity = Object.values(sourceTypes).filter(count => count > 0).length
      
      // Calculate final score (1-5 scale)
      const diversityScore = Math.min(5, Math.max(1, 
        (domainDiversity * 0.4) + 
        (typesDiversity * 0.6) + 
        (uniqueSources.length > content.length ? 1 : 0)
      ))
      
      return Math.round(diversityScore)
    } catch (error) {
      console.warn('Error calculating source diversity:', error)
      return Math.min(5, Math.max(1, content.length / 2)) // Fallback
    }
  }
  
  private generateLearningObjectives(themeName: string, content: ContentAnalysis[]): string[] {
    const objectives = [
      `Understand the key concepts and dynamics of ${themeName.toLowerCase()}`,
      `Analyze how power structures influence ${themeName.toLowerCase()} decisions`,
      `Evaluate different perspectives and policy approaches to ${themeName.toLowerCase()}`
    ]
    
    // Add content-specific objectives
    const uniqueEntities = [...new Set(content.flatMap(c => c.entities))].slice(0, 3)
    if (uniqueEntities.length > 0) {
      objectives.push(`Identify the roles of key actors including ${uniqueEntities.join(', ')}`)
    }
    
    return objectives
  }
  
  private generatePrerequisites(content: ContentAnalysis[]): string[] {
    const avgDifficulty = content.reduce((sum, c) => sum + c.difficulty_level, 0) / content.length
    
    const prerequisites: string[] = []
    
    if (avgDifficulty >= 3) {
      prerequisites.push('Basic understanding of U.S. government structure')
    }
    
    if (avgDifficulty >= 4) {
      prerequisites.push('Familiarity with constitutional principles')
      prerequisites.push('Understanding of policy-making processes')
    }
    
    // Add content-specific prerequisites
    const policyAreas = [...new Set(content.flatMap(c => c.policy_areas))]
    if (policyAreas.includes('Foreign Policy')) {
      prerequisites.push('Basic knowledge of international relations')
    }
    
    return prerequisites
  }
  
  private generateActionItems(themeName: string, content: ContentAnalysis[]): string[] {
    const actions = [
      `Research your representatives' positions on ${themeName.toLowerCase()}`,
      `Follow reliable news sources covering ${themeName.toLowerCase()}`,
      `Join or support organizations working on ${themeName.toLowerCase()} issues`
    ]
    
    // Add theme-specific actions
    if (themeName.includes('Voting') || themeName.includes('Election')) {
      actions.push('Register to vote and check your registration status')
      actions.push('Learn about your local voting procedures and candidates')
    }
    
    if (themeName.includes('Climate') || themeName.includes('Environment')) {
      actions.push('Contact your representatives about climate legislation')
      actions.push('Support renewable energy initiatives in your community')
    }
    
    return actions
  }
  
  private calculateCurrentEventsRelevance(content: ContentAnalysis[]): 1 | 2 | 3 | 4 | 5 {
    const avgRelevance = content.reduce((sum, c) => sum + c.current_relevance, 0) / content.length
    return Math.round(avgRelevance) as 1 | 2 | 3 | 4 | 5
  }
  
  private calculatePoliticalBalance(content: ContentAnalysis[]): 1 | 2 | 3 | 4 | 5 {
    try {
      const allEntities = content.flatMap(item => item.political_entities || [])
      
      if (allEntities.length === 0) return 3 // Neutral when no political entities
      
      // Analyze political lean indicators
      const conservativeIndicators = [
        'republican', 'conservative', 'right-wing', 'gop', 
        'heritage foundation', 'american enterprise institute',
        'federalist society', 'cato institute'
      ]
      
      const liberalIndicators = [
        'democrat', 'democratic', 'liberal', 'left-wing', 'progressive',
        'center for american progress', 'aclu', 'planned parenthood',
        'naacp', 'sierra club'
      ]
      
      const neutralIndicators = [
        'bipartisan', 'nonpartisan', 'independent', 'centrist',
        'congressional budget office', 'government accountability office',
        'brookings institution'
      ]
      
      let conservativeScore = 0
      let liberalScore = 0
      let neutralScore = 0
      
      // Count entity mentions and their political lean
      allEntities.forEach(entity => {
        const entityLower = entity.toLowerCase()
        
        if (conservativeIndicators.some(indicator => entityLower.includes(indicator))) {
          conservativeScore++
        }
        if (liberalIndicators.some(indicator => entityLower.includes(indicator))) {
          liberalScore++
        }
        if (neutralIndicators.some(indicator => entityLower.includes(indicator))) {
          neutralScore++
        }
      })
      
      // Analyze source political lean
      const allSources = content.flatMap(item => item.sources || [])
      allSources.forEach(source => {
        const sourceLower = source.toLowerCase()
        
        // Conservative-leaning sources
        if (['foxnews.com', 'wsj.com', 'nypost.com', 'nationalreview.com'].some(s => sourceLower.includes(s))) {
          conservativeScore++
        }
        
        // Liberal-leaning sources
        if (['msnbc.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'huffpost.com'].some(s => sourceLower.includes(s))) {
          liberalScore++
        }
        
        // Neutral sources
        if (['reuters.com', 'ap.org', 'bbc.com', 'pbs.org', 'npr.org'].some(s => sourceLower.includes(s))) {
          neutralScore++
        }
      })
      
      const totalScore = conservativeScore + liberalScore + neutralScore
      
      if (totalScore === 0) return 3 // Default neutral
      
      // Calculate balance score
      const conservativeRatio = conservativeScore / totalScore
      const liberalRatio = liberalScore / totalScore
      const neutralRatio = neutralScore / totalScore
      
      // Determine balance (1 = very conservative, 5 = very liberal, 3 = balanced)
      if (neutralRatio > 0.6) return 3 // Strong neutral presence
      
      const politicalLean = liberalRatio - conservativeRatio
      
      if (politicalLean <= -0.4) return 1 // Very conservative
      if (politicalLean <= -0.2) return 2 // Somewhat conservative
      if (politicalLean >= 0.4) return 5 // Very liberal
      if (politicalLean >= 0.2) return 4 // Somewhat liberal
      
      return 3 // Balanced
      
    } catch (error) {
      console.warn('Error calculating political balance:', error)
      return 3 // Default neutral
    }
  }
  
  private suggestCategories(themeName: string, content: ContentAnalysis[]): string[] {
    const categories: string[] = []
    
    // Map themes to categories
    const categoryMappings: Record<string, string[]> = {
      'Ukraine War': ['Foreign Policy', 'Current Events'],
      'Iran-Israel Conflict': ['Foreign Policy', 'International Relations'],
      'Immigration': ['Domestic Policy', 'Civil Rights'],
      'Healthcare': ['Domestic Policy', 'Economic Policy'],
      'Supreme Court': ['Government Structure', 'Constitutional Law'],
      'First Amendment': ['Constitutional Law', 'Civil Rights'],
      'Voting Rights': ['Electoral Systems', 'Civil Rights']
    }
    
    if (categoryMappings[themeName]) {
      categories.push(...categoryMappings[themeName])
    }
    
    // Add categories based on content analysis
    const policyAreas = [...new Set(content.flatMap(c => c.policy_areas))]
    categories.push(...policyAreas)
    
    return [...new Set(categories)].slice(0, 3)
  }
  
  private suggestTags(content: ContentAnalysis[], cluster: ThemeCluster): string[] {
    const tags = new Set<string>()
    
    // Add theme-related tags
    tags.add(cluster.theme_name.toLowerCase())
    
    // Add entity tags
    cluster.entities.forEach(entity => {
      tags.add(entity.toLowerCase())
    })
    
    // Add keyword tags
    cluster.keywords.slice(0, 5).forEach(keyword => {
      tags.add(keyword)
    })
    
    // Add time period tags
    content.forEach(item => {
      item.time_periods.forEach(period => {
        tags.add(period.toLowerCase())
      })
    })
    
    return Array.from(tags).slice(0, 10)
  }
  
  private rankSuggestions(suggestions: CollectionSuggestion[]): CollectionSuggestion[] {
    return suggestions.sort((a, b) => {
      // Scoring factors
      const scoreA = (
        a.theme_confidence * 0.3 +
        a.content_coherence_score * 0.25 +
        (a.current_events_relevance / 5) * 0.2 +
        (a.content_items.length / 10) * 0.15 +
        (a.source_diversity_score / 5) * 0.1
      )
      
      const scoreB = (
        b.theme_confidence * 0.3 +
        b.content_coherence_score * 0.25 +
        (b.current_events_relevance / 5) * 0.2 +
        (b.content_items.length / 10) * 0.15 +
        (b.source_diversity_score / 5) * 0.1
      )
      
      return scoreB - scoreA
    })
  }
  
  // ============================================================================
  // COLLECTION CREATION HELPERS
  // ============================================================================
  
  private async addItemsToCollection(
    collectionId: string, 
    content: ContentAnalysis[]
  ): Promise<void> {
    const items = content.map(item => ({
      collection_id: collectionId,
      content_type: item.type,
      content_id: item.id,
      sequence_order: content.indexOf(item) + 1,
      is_required: true
    }))

    if (items.length > 0) {
      const { error } = await this.supabase
        .from('collection_items')
        .insert(items)

      if (error) {
        console.error('Failed to add items to collection:', error)
      }
    }
  }
  
  private async saveCollectionSkillsSummary(
    collectionId: string,
    skillsSummary: CollectionSkillSummary
  ): Promise<void> {
    try {
      await this.supabase
        .from('collections')
        .update({ 
          metadata: {
            skills_data: skillsSummary
          }
        })
        .eq('id', collectionId)
    } catch (error) {
      console.error('Failed to save skills summary:', error)
    }
  }

  /**
   * Enhanced semantic similarity with vector embeddings and caching
   */
  private async calculateSemanticSimilarityOptimized(
    content1: { title: string; description: string; keywords: string[] },
    content2: { title: string; description: string; keywords: string[] }
  ): Promise<number> {
    const cacheKey = `${this.hashContent(content1)}_${this.hashContent(content2)}`
    
    // Check cache first
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey)!
    }

    try {
      // Get or generate embeddings
      const embedding1 = await this.getContentEmbedding(content1)
      const embedding2 = await this.getContentEmbedding(content2)
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1, embedding2)
      
      // Cache result
      this.similarityCache.set(cacheKey, similarity)
      
      return similarity
    } catch (error) {
      console.warn('Embedding similarity failed, falling back to keyword similarity:', error)
      return this.calculateKeywordSimilarity(content1, content2)
    }
  }

  /**
   * Batch process content embeddings for better performance
   */
  private async batchProcessEmbeddings(
    contentItems: Array<{ id: string; title: string; description: string }>
  ): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>()
    const uncachedItems = contentItems.filter(item => 
      !this.embeddingCache.has(this.hashContent(item))
    )

    // Process in batches to avoid API rate limits
    for (let i = 0; i < uncachedItems.length; i += this.EMBEDDING_BATCH_SIZE) {
      const batch = uncachedItems.slice(i, i + this.EMBEDDING_BATCH_SIZE)
      
      try {
        const batchResults = await Promise.all(
          batch.map(async (item) => {
            const embedding = await this.generateEmbedding(
              `${item.title} ${item.description}`
            )
            const hash = this.hashContent(item)
            this.embeddingCache.set(hash, embedding)
            return { id: item.id, embedding }
          })
        )
        
        batchResults.forEach(({ id, embedding }) => {
          embeddings.set(id, embedding)
        })
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Batch embedding failed for batch ${i}:`, error)
      }
    }

    // Add cached embeddings
    contentItems.forEach(item => {
      const hash = this.hashContent(item)
      const cached = this.embeddingCache.get(hash)
      if (cached) {
        embeddings.set(item.id, cached)
      }
    })

    return embeddings
  }

  /**
   * Hierarchical clustering for improved theme detection
   */
  private performHierarchicalClustering(
    contentItems: any[],
    embeddings: Map<string, number[]>,
    minClusterSize: number = 3
  ): Array<{
    theme: string
    items: any[]
    centroid: number[]
    coherence_score: number
  }> {
    const clusters: Array<{
      theme: string
      items: any[]
      centroid: number[]
      coherence_score: number
    }> = []

    const unprocessed = [...contentItems]
    
    while (unprocessed.length >= minClusterSize) {
      // Find the most central item as cluster seed
      const centralItem = this.findMostCentralItem(unprocessed, embeddings)
      if (!centralItem) break

      // Build cluster around central item
      const cluster = this.buildClusterAround(centralItem, unprocessed, embeddings)
      
      if (cluster.items.length >= minClusterSize) {
        clusters.push(cluster)
        
        // Remove clustered items from unprocessed
        cluster.items.forEach(item => {
          const index = unprocessed.findIndex(u => u.id === item.id)
          if (index > -1) unprocessed.splice(index, 1)
        })
      } else {
        // Can't form valid cluster, remove central item and continue
        const index = unprocessed.findIndex(u => u.id === centralItem.id)
        if (index > -1) unprocessed.splice(index, 1)
      }
    }

    return clusters.sort((a, b) => b.coherence_score - a.coherence_score)
  }

  // Utility methods for performance optimization
  private hashContent(content: any): string {
    return `${content.title}_${content.description}`.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 50)
  }

  private async getContentEmbedding(content: any): Promise<number[]> {
    const hash = this.hashContent(content)
    
    if (this.embeddingCache.has(hash)) {
      return this.embeddingCache.get(hash)!
    }

    const text = `${content.title} ${content.description}`
    const embedding = await this.generateEmbedding(text)
    this.embeddingCache.set(hash, embedding)
    
    return embedding
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit input size
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.warn('OpenAI embedding failed, using fallback:', error)
      return this.generateFallbackEmbedding(text)
    }
  }

  private generateFallbackEmbedding(text: string): number[] {
    // Simple TF-IDF-like fallback embedding
    const words = text.toLowerCase().split(/\s+/)
    const wordCounts = new Map<string, number>()
    
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })
    
    // Create 384-dimensional vector (matching text-embedding-3-small)
    const embedding = new Array(384).fill(0)
    
    // Use word hashes to fill embedding dimensions
    wordCounts.forEach((count, word) => {
      const hash = this.simpleHash(word)
      for (let i = 0; i < 3; i++) {
        const index = (hash + i) % 384
        embedding[index] += count / words.length
      }
    })
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  private findMostCentralItem(items: any[], embeddings: Map<string, number[]>): any | null {
    if (items.length === 0) return null
    
    let mostCentral = items[0]
    let highestAvgSimilarity = 0
    
    for (const item of items) {
      const itemEmbedding = embeddings.get(item.id)
      if (!itemEmbedding) continue
      
      let totalSimilarity = 0
      let comparisons = 0
      
      for (const otherItem of items) {
        if (item.id === otherItem.id) continue
        
        const otherEmbedding = embeddings.get(otherItem.id)
        if (!otherEmbedding) continue
        
        totalSimilarity += this.cosineSimilarity(itemEmbedding, otherEmbedding)
        comparisons++
      }
      
      const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
      
      if (avgSimilarity > highestAvgSimilarity) {
        highestAvgSimilarity = avgSimilarity
        mostCentral = item
      }
    }
    
    return mostCentral
  }

  private buildClusterAround(
    centralItem: any,
    allItems: any[],
    embeddings: Map<string, number[]>,
    similarityThreshold: number = 0.7
  ): {
    theme: string
    items: any[]
    centroid: number[]
    coherence_score: number
  } {
    const centralEmbedding = embeddings.get(centralItem.id)
    if (!centralEmbedding) {
      return {
        theme: centralItem.title,
        items: [centralItem],
        centroid: [],
        coherence_score: 0
      }
    }

    const clusterItems = [centralItem]
    
    // Find similar items
    for (const item of allItems) {
      if (item.id === centralItem.id) continue
      
      const itemEmbedding = embeddings.get(item.id)
      if (!itemEmbedding) continue
      
      const similarity = this.cosineSimilarity(centralEmbedding, itemEmbedding)
      if (similarity >= similarityThreshold) {
        clusterItems.push(item)
      }
    }
    
    // Calculate centroid
    const centroid = this.calculateCentroid(
      clusterItems.map(item => embeddings.get(item.id)!).filter(Boolean)
    )
    
    // Calculate coherence score
    const coherenceScore = this.calculateClusterCoherence(clusterItems, embeddings)
    
    // Generate theme name
    const theme = this.generateThemeName(clusterItems)
    
    return {
      theme,
      items: clusterItems,
      centroid,
      coherence_score: coherenceScore
    }
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []
    
    const dimensions = embeddings[0].length
    const centroid = new Array(dimensions).fill(0)
    
    embeddings.forEach(embedding => {
      embedding.forEach((value, index) => {
        centroid[index] += value
      })
    })
    
    return centroid.map(sum => sum / embeddings.length)
  }

  private calculateClusterCoherence(items: any[], embeddings: Map<string, number[]>): number {
    if (items.length < 2) return 1
    
    let totalSimilarity = 0
    let comparisons = 0
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const embedding1 = embeddings.get(items[i].id)
        const embedding2 = embeddings.get(items[j].id)
        
        if (embedding1 && embedding2) {
          totalSimilarity += this.cosineSimilarity(embedding1, embedding2)
          comparisons++
        }
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Fallback keyword similarity calculation
   */
  private calculateKeywordSimilarity(
    content1: { title: string; description: string; keywords: string[] },
    content2: { title: string; description: string; keywords: string[] }
  ): number {
    const text1 = `${content1.title} ${content1.description} ${content1.keywords.join(' ')}`.toLowerCase()
    const text2 = `${content2.title} ${content2.description} ${content2.keywords.join(' ')}`.toLowerCase()
    
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  /**
   * Generate theme name from cluster items
   */
  private generateThemeName(items: any[]): string {
    // Find common keywords from item titles
    const allWords = items.flatMap((item: any) => 
      item.title.toLowerCase().split(/\s+/).filter((word: string) => word.length > 3)
    )
    
    // Count word frequency
    const wordCounts = new Map<string, number>()
    allWords.forEach((word: string) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })
    
    // Find most common word that appears in multiple items
    const commonWords = Array.from(wordCounts.entries())
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => this.capitalize(word))
    
    if (commonWords.length === 0) {
      return 'Related Topics'
    }
    
    return commonWords.join(' & ')
  }

  private capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create and configure a Collection Organizer Agent
 */
export function createCollectionOrganizerAgent(): CollectionOrganizerAgent {
  return new CollectionOrganizerAgent()
}

/**
 * Quick function to generate collection suggestions
 */
export async function suggestCollections(options?: {
  content_types?: string[]
  max_suggestions?: number
  theme_specificity?: 'broad' | 'specific' | 'mixed'
}) {
  const agent = createCollectionOrganizerAgent()
  return agent.suggestCollections(options)
}

/**
 * Quick function to create a collection from content analysis
 */
export async function createCollectionFromAnalysis(
  themeName: string,
  contentIds: string[],
  createdBy: string
) {
  const agent = createCollectionOrganizerAgent()
  
  // This would need more implementation to work properly
  // For now, it's a placeholder for the concept
  
  console.log(`Creating collection "${themeName}" with ${contentIds.length} items`)
  return null
} 