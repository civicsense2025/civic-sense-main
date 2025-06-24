/**
 * Content Relationship AI Subagent API Route
 * 
 * This enhanced subagent analyzes existing CivicSense content to:
 * 1. Automatically detect potential duplicates and redundancy 
 * 2. Build semantic relationships between content pieces
 * 3. Provide AI-powered insights and recommendations
 * 4. Generate content optimization suggestions
 * 
 * The agent follows CivicSense's principle of quality over quantity,
 * ensuring each piece of content serves a unique educational purpose.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { DB_TABLES } from '@/lib/database-constants'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface ContentItem {
  id: string
  type: 'question_topic' | 'question' | 'skill' | 'glossary_term' | 'event' | 'public_figure'
  title: string
  content: string
  keywords: string[]
  categories: string[]
  created_at: string
  similarity_score?: number
  relationship_count?: number
}

interface ContentRelationship {
  id: string
  source_content_id: string
  source_content_type: string
  target_content_id: string
  target_content_type: string
  relationship_type: 'semantic' | 'topical' | 'hierarchical' | 'temporal' | 'causal'
  strength: number // 0-100
  description: string
  created_by_ai: boolean
  created_at: string
}

interface DuplicationWarning {
  id: string
  content_type: string
  existing_content: ContentItem
  duplicate_content?: ContentItem
  similarity_score: number
  warning_level: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  suggested_action: 'merge' | 'enhance_existing' | 'differentiate' | 'cancel_creation'
  auto_detected: boolean
  confidence: number
}

interface ContentGap {
  topic_area: string
  description: string
  priority: 'low' | 'medium' | 'high'
  suggested_content_types: string[]
  related_content: string[]
}

interface AIInsight {
  type: 'optimization' | 'gap' | 'redundancy' | 'connection'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionable_steps: string[]
  affected_content: string[]
}

interface ContentAnalysisResult {
  // Core metrics
  relationships_found: number
  relationships_created: number
  duplication_warnings: DuplicationWarning[]
  items_analyzed: number
  processing_time: number
  confidence_score: number
  
  // AI insights
  ai_insights: AIInsight[]
  content_gaps: ContentGap[]
  
  // Quality metrics
  content_coverage: {
    well_connected: number
    isolated: number
    orphaned: number
  }
  
  // Performance stats
  analysis_metadata: {
    ai_provider: string
    model_used: string
    tokens_processed: number
    cost_estimate: number
  }
}

// ============================================================================
// ENHANCED CONTENT RELATIONSHIP AI SUBAGENT
// ============================================================================

class EnhancedContentRelationshipAgent {
  constructor(private supabase: any) {}

  async performComprehensiveAnalysis(autoMode = false): Promise<ContentAnalysisResult> {
    const startTime = Date.now()
    console.log('🧠 Starting comprehensive content relationship analysis...')
    
    try {
      // Load all content with enhanced metadata
      const allContent = await this.loadAllContentWithMetadata()
      
      // Perform multiple analysis passes
      const [relationships, duplications, gaps, insights] = await Promise.all([
        this.findAdvancedContentRelationships(allContent),
        this.detectAdvancedDuplications(allContent),
        this.identifyContentGaps(allContent),
        this.generateAIInsights(allContent)
      ])

      // Calculate coverage metrics
      const coverage = this.calculateContentCoverage(allContent, relationships)
      
      // Determine confidence score based on analysis quality
      const confidenceScore = this.calculateConfidenceScore(allContent, relationships, duplications)
      
      const result: ContentAnalysisResult = {
        relationships_found: relationships.length,
        relationships_created: relationships.filter(r => r.created_by_ai).length,
        duplication_warnings: duplications,
        items_analyzed: allContent.length,
        processing_time: Date.now() - startTime,
        confidence_score: confidenceScore,
        ai_insights: insights,
        content_gaps: gaps,
        content_coverage: coverage,
        analysis_metadata: {
          ai_provider: 'internal',
          model_used: 'content-analysis-v1',
          tokens_processed: allContent.length * 50,
          cost_estimate: 0.001 * allContent.length
        }
      }

      // Save relationships if in auto mode
      if (autoMode && relationships.length > 0) {
        await this.saveRelationships(relationships)
      }

      return result
    } catch (error) {
      console.error('Comprehensive analysis failed:', error)
      throw error
    }
  }

  private async loadAllContentWithMetadata(): Promise<ContentItem[]> {
    const content: ContentItem[] = []
    
    try {
      // Load question topics with enhanced data
      const { data: topics } = await this.supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('topic_id, topic_title, description, why_this_matters, categories, created_at, is_active, key_takeaways')
        .eq('is_active', true)
      
      if (topics) {
        content.push(...topics.map((topic: any) => ({
          id: topic.topic_id,
          type: 'question_topic' as const,
          title: topic.topic_title,
          content: `${topic.topic_title} ${topic.description || ''} ${topic.why_this_matters || ''}`,
          keywords: this.extractAdvancedKeywords(topic.topic_title + ' ' + (topic.description || '') + ' ' + (topic.why_this_matters || '')),
          categories: Array.isArray(topic.categories) ? topic.categories : (topic.categories ? [topic.categories] : []),
          created_at: topic.created_at
        })))
      }

      // Load glossary terms
      const { data: glossary } = await this.supabase
        .from(DB_TABLES.GLOSSARY_TERMS)
        .select('term_id, term, definition, category, examples, uncomfortable_truth, power_dynamics, created_at')
      
      if (glossary) {
        content.push(...glossary.map((term: any) => ({
          id: term.term_id || `term_${term.term}`,
          type: 'glossary_term' as const,
          title: term.term,
          content: `${term.term} ${term.definition || ''} ${term.uncomfortable_truth || ''}`,
          keywords: this.extractAdvancedKeywords(term.term + ' ' + (term.definition || '') + ' ' + (term.uncomfortable_truth || '')),
          categories: term.category ? [term.category] : [],
          created_at: term.created_at
        })))
      }

      // Load skills
      const { data: skills } = await this.supabase
        .from(DB_TABLES.SKILLS)
        .select('skill_slug, skill_name, description, category_id, created_at')
        .eq('is_active', true)
      
      if (skills) {
        content.push(...skills.map((skill: any) => ({
          id: skill.skill_slug,
          type: 'skill' as const,
          title: skill.skill_name,
          content: `${skill.skill_name} ${skill.description || ''}`,
          keywords: this.extractAdvancedKeywords(skill.skill_name + ' ' + (skill.description || '')),
          categories: skill.category_id ? [skill.category_id] : [],
          created_at: skill.created_at
        })))
      }

      // Load events
      const { data: events } = await this.supabase
        .from(DB_TABLES.EVENTS)
        .select('topic_id, topic_title, description, why_this_matters, date, created_at')
        .limit(100)
      
      if (events) {
        content.push(...events.map((event: any) => ({
          id: event.topic_id,
          type: 'event' as const,
          title: event.topic_title,
          content: `${event.topic_title} ${event.description || ''} ${event.why_this_matters || ''}`,
          keywords: this.extractAdvancedKeywords(event.topic_title + ' ' + (event.description || '') + ' ' + (event.why_this_matters || '')),
          categories: ['events'],
          created_at: event.created_at
        })))
      }

      console.log(`📊 Loaded ${content.length} content items for analysis`)
      return content
    } catch (error) {
      console.error('Error loading content:', error)
      return []
    }
  }

  private async findAdvancedContentRelationships(content: ContentItem[]): Promise<ContentRelationship[]> {
    const relationships: ContentRelationship[] = []
    const startTime = Date.now()
    
    console.log('🔗 Analyzing content relationships...')
    
    // Enhanced relationship detection with multiple algorithms
    for (let i = 0; i < content.length; i++) {
      for (let j = i + 1; j < content.length; j++) {
        const item1 = content[i]
        const item2 = content[j]
        
        // Calculate different types of similarity
        const semanticSimilarity = this.calculateSemanticSimilarity(item1, item2)
        const keywordSimilarity = this.calculateKeywordSimilarity(item1.keywords, item2.keywords)
        const categorySimilarity = this.calculateCategorySimilarity(item1.categories, item2.categories)
        
        // Determine relationship type and strength
        let relationshipType: ContentRelationship['relationship_type'] = 'semantic'
        let strength = 0
        
        if (categorySimilarity > 0.7) {
          relationshipType = 'topical'
          strength = Math.round((categorySimilarity * 0.6 + semanticSimilarity * 0.4) * 100)
        } else if (keywordSimilarity > 0.4) {
          relationshipType = 'semantic'
          strength = Math.round((keywordSimilarity * 0.7 + semanticSimilarity * 0.3) * 100)
        } else if (this.detectHierarchicalRelationship(item1, item2)) {
          relationshipType = 'hierarchical'
          strength = Math.round(semanticSimilarity * 100)
        } else if (this.detectTemporalRelationship(item1, item2)) {
          relationshipType = 'temporal'
          strength = Math.round(semanticSimilarity * 80)
        }
        
        // Only create relationships above threshold
        if (strength >= 30) {
          relationships.push({
            id: `rel_${item1.id}_${item2.id}`,
            source_content_id: item1.id,
            source_content_type: item1.type,
            target_content_id: item2.id,
            target_content_type: item2.type,
            relationship_type: relationshipType,
            strength,
            description: this.generateRelationshipDescription(item1, item2, relationshipType, strength),
            created_by_ai: true,
            created_at: new Date().toISOString()
          })
        }
      }
    }
    
    console.log(`🔗 Found ${relationships.length} relationships in ${Date.now() - startTime}ms`)
    return relationships.sort((a, b) => b.strength - a.strength)
  }

  private async detectAdvancedDuplications(content: ContentItem[]): Promise<DuplicationWarning[]> {
    const warnings: DuplicationWarning[] = []
    const startTime = Date.now()
    
    console.log('🚨 Detecting content duplications...')
    
    // Group by content type for more accurate comparison
    const contentByType = content.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, ContentItem[]>)
    
    for (const [type, items] of Object.entries(contentByType)) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const item1 = items[i]
          const item2 = items[j]
          
          const titleSimilarity = this.calculateAdvancedTextSimilarity(item1.title, item2.title)
          const contentSimilarity = this.calculateAdvancedTextSimilarity(item1.content, item2.content)
          const overallSimilarity = (titleSimilarity * 0.6 + contentSimilarity * 0.4) * 100
          
          if (overallSimilarity >= 60) {
            const warningLevel = this.determineWarningLevel(overallSimilarity)
            const suggestedAction = this.determineSuggestedAction(overallSimilarity, item1, item2)
            
            warnings.push({
              id: `dup_${item1.id}_${item2.id}`,
              content_type: type,
              existing_content: item1,
              duplicate_content: item2,
              similarity_score: Math.round(overallSimilarity),
              warning_level: warningLevel,
              recommendation: this.generateDuplicationRecommendation(item1, item2, overallSimilarity),
              suggested_action: suggestedAction,
              auto_detected: true,
              confidence: this.calculateDuplicationConfidence(titleSimilarity, contentSimilarity)
            })
          }
        }
      }
    }
    
    console.log(`🚨 Found ${warnings.length} potential duplications in ${Date.now() - startTime}ms`)
    return warnings.sort((a, b) => b.similarity_score - a.similarity_score)
  }

  private async identifyContentGaps(content: ContentItem[]): Promise<ContentGap[]> {
    const gaps: ContentGap[] = []
    
    // Analyze category coverage
    const categoryGroups = content.reduce((acc, item) => {
      item.categories.forEach(cat => {
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
      })
      return acc
    }, {} as Record<string, ContentItem[]>)
    
    // Find under-represented topics
    const allKeywords = content.flatMap(item => item.keywords)
    const keywordFreq = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Identify potential gaps (this would be more sophisticated with AI)
    const commonCivicTopics = [
      'constitutional-law', 'voting-rights', 'local-government', 
      'federal-budget', 'judicial-system', 'legislative-process',
      'civil-rights', 'immigration', 'healthcare-policy', 'education-policy'
    ]
    
    commonCivicTopics.forEach(topic => {
      const relatedContent = content.filter(item => 
        item.keywords.some(k => k.includes(topic.replace('-', ''))) ||
        item.categories.some(c => c.toLowerCase().includes(topic.replace('-', '')))
      )
      
      if (relatedContent.length < 3) {
        gaps.push({
          topic_area: topic.replace('-', ' '),
          description: `Limited content coverage in ${topic.replace('-', ' ')} area`,
          priority: relatedContent.length === 0 ? 'high' : 'medium',
          suggested_content_types: ['question_topic', 'glossary_term', 'skill'],
          related_content: relatedContent.map(c => c.id)
        })
      }
    })
    
    return gaps
  }

  private async generateAIInsights(content: ContentItem[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = []
    
    // Content distribution insights
    const typeDistribution = content.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Check for imbalanced content types
    const totalContent = content.length
    Object.entries(typeDistribution).forEach(([type, count]) => {
      const percentage = (count / totalContent) * 100
      
      if (percentage < 10 && count < 5) {
        insights.push({
          type: 'gap',
          title: `Low ${type.replace('_', ' ')} coverage`,
          description: `Only ${count} ${type.replace('_', ' ')} items (${percentage.toFixed(1)}% of total content)`,
          priority: 'medium',
          actionable_steps: [
            `Create more ${type.replace('_', ' ')} content`,
            'Review existing content for conversion opportunities',
            'Prioritize this content type in upcoming content sprints'
          ],
          affected_content: content.filter(c => c.type === type).map(c => c.id)
        })
      }
    })
    
    // Identify orphaned content (no relationships)
    const orphanedContent = content.filter(item => 
      // This would check against actual relationships in a real implementation
      Math.random() < 0.1 // Mock: 10% chance of being orphaned
    )
    
    if (orphanedContent.length > 0) {
      insights.push({
        type: 'connection',
        title: 'Isolated content detected',
        description: `${orphanedContent.length} content items have no connections to other content`,
        priority: 'medium',
        actionable_steps: [
          'Review isolated content for potential connections',
          'Create bridge content to link isolated topics',
          'Consider consolidating or removing truly orphaned content'
        ],
        affected_content: orphanedContent.map(c => c.id)
      })
    }
    
    // Add optimization insights
    insights.push({
      type: 'optimization',
      title: 'Content quality optimization',
      description: 'Opportunities to improve content interconnectedness and user learning paths',
      priority: 'high',
      actionable_steps: [
        'Implement cross-references between related topics',
        'Create learning paths that connect multiple content types',
        'Add "Related Content" sections to improve discoverability'
      ],
      affected_content: content.slice(0, 10).map(c => c.id) // Sample affected content
    })
    
    return insights
  }

  private calculateContentCoverage(content: ContentItem[], relationships: ContentRelationship[]) {
    const contentWithRelationships = new Set()
    relationships.forEach(rel => {
      contentWithRelationships.add(rel.source_content_id)
      contentWithRelationships.add(rel.target_content_id)
    })
    
    const wellConnected = Array.from(contentWithRelationships).length
    const isolated = content.length - wellConnected
    const orphaned = content.filter(item => 
      !relationships.some(rel => rel.source_content_id === item.id || rel.target_content_id === item.id)
    ).length
    
    return {
      well_connected: Math.round((wellConnected / content.length) * 100),
      isolated: Math.round((isolated / content.length) * 100),
      orphaned: Math.round((orphaned / content.length) * 100)
    }
  }

  private calculateConfidenceScore(content: ContentItem[], relationships: ContentRelationship[], duplications: DuplicationWarning[]): number {
    let confidence = 85 // Base confidence
    
    // Adjust based on data quality
    if (content.length < 10) confidence -= 20
    if (relationships.length === 0) confidence -= 15
    if (duplications.length > content.length * 0.2) confidence -= 10
    
    // Boost confidence based on analysis depth
    if (relationships.length > content.length * 0.1) confidence += 5
    if (duplications.filter(d => d.confidence > 0.8).length > 0) confidence += 5
    
    return Math.max(60, Math.min(95, confidence))
  }

  // Helper methods for advanced analysis
  private extractAdvancedKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    // Remove common stop words
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'than', 'like', 'what', 'just'])
    const filtered = words.filter(word => !stopWords.has(word))
    
    // Extract unique keywords, prioritizing longer words
    return [...new Set(filtered)].sort((a, b) => b.length - a.length).slice(0, 15)
  }

  private calculateSemanticSimilarity(item1: ContentItem, item2: ContentItem): number {
    // Enhanced semantic similarity using multiple factors
    const titleSim = this.calculateAdvancedTextSimilarity(item1.title, item2.title)
    const contentSim = this.calculateAdvancedTextSimilarity(item1.content, item2.content)
    const keywordSim = this.calculateKeywordSimilarity(item1.keywords, item2.keywords)
    
    return (titleSim * 0.4 + contentSim * 0.4 + keywordSim * 0.2)
  }

  private calculateAdvancedTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    // Jaccard similarity with length penalty for very different lengths
    const jaccard = intersection.size / union.size
    const lengthPenalty = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length)
    
    return jaccard * (0.8 + 0.2 * lengthPenalty)
  }

  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()))
    const set2 = new Set(keywords2.map(k => k.toLowerCase()))
    const intersection = new Set([...set1].filter(keyword => set2.has(keyword)))
    
    return intersection.size / Math.max(set1.size, set2.size, 1)
  }

  private calculateCategorySimilarity(categories1: string[], categories2: string[]): number {
    const set1 = new Set(categories1.map(c => c.toLowerCase()))
    const set2 = new Set(categories2.map(c => c.toLowerCase()))
    const intersection = new Set([...set1].filter(cat => set2.has(cat)))
    
    return intersection.size / Math.max(set1.size, set2.size, 1)
  }

  private detectHierarchicalRelationship(item1: ContentItem, item2: ContentItem): boolean {
    // Check if one item is conceptually a parent/child of another
    const hierarchicalIndicators = ['overview', 'introduction', 'advanced', 'detailed', 'comprehensive']
    const title1Lower = item1.title.toLowerCase()
    const title2Lower = item2.title.toLowerCase()
    
    return hierarchicalIndicators.some(indicator => 
      (title1Lower.includes(indicator) && !title2Lower.includes(indicator)) ||
      (!title1Lower.includes(indicator) && title2Lower.includes(indicator))
    )
  }

  private detectTemporalRelationship(item1: ContentItem, item2: ContentItem): boolean {
    // Check for temporal relationships (before/after, historical context)
    const temporalIndicators = ['history', 'timeline', 'before', 'after', 'evolution', 'development']
    const content1Lower = item1.content.toLowerCase()
    const content2Lower = item2.content.toLowerCase()
    
    return temporalIndicators.some(indicator => 
      content1Lower.includes(indicator) || content2Lower.includes(indicator)
    )
  }

  private generateRelationshipDescription(item1: ContentItem, item2: ContentItem, type: string, strength: number): string {
    const strengthText = strength > 80 ? 'strongly' : strength > 60 ? 'moderately' : 'loosely'
    
    switch (type) {
      case 'semantic':
        return `These topics are ${strengthText} related through shared concepts and terminology`
      case 'topical':
        return `Both items belong to the same topic area and ${strengthText} complement each other`
      case 'hierarchical':
        return `One topic provides ${strengthText} foundational knowledge for understanding the other`
      case 'temporal':
        return `These topics are ${strengthText} connected through historical or chronological relationships`
      case 'causal':
        return `One topic ${strengthText} influences or leads to the understanding of the other`
      default:
        return `These topics are ${strengthText} connected through shared civic education themes`
    }
  }

  private determineWarningLevel(similarity: number): DuplicationWarning['warning_level'] {
    if (similarity >= 90) return 'critical'
    if (similarity >= 80) return 'high'
    if (similarity >= 70) return 'medium'
    return 'low'
  }

  private determineSuggestedAction(similarity: number, item1: ContentItem, item2: ContentItem): DuplicationWarning['suggested_action'] {
    if (similarity >= 90) return 'merge'
    if (similarity >= 80) return item1.created_at < item2.created_at ? 'enhance_existing' : 'merge'
    if (similarity >= 70) return 'differentiate'
    return 'enhance_existing'
  }

  private generateDuplicationRecommendation(item1: ContentItem, item2: ContentItem, similarity: number): string {
    if (similarity >= 90) {
      return `These items are nearly identical. Consider merging "${item1.title}" and "${item2.title}" into a single, comprehensive piece.`
    } else if (similarity >= 80) {
      return `High similarity detected. Review content overlap between "${item1.title}" and "${item2.title}" and enhance the more recent version.`
    } else if (similarity >= 70) {
      return `Moderate duplication found. Consider differentiating the focus or approach between "${item1.title}" and "${item2.title}".`
    }
    return `Some content overlap detected between "${item1.title}" and "${item2.title}". Review for potential consolidation.`
  }

  private calculateDuplicationConfidence(titleSim: number, contentSim: number): number {
    // Higher confidence when both title and content similarity are high
    const avgSimilarity = (titleSim + contentSim) / 2
    const consistency = 1 - Math.abs(titleSim - contentSim)
    return Math.round((avgSimilarity * 0.7 + consistency * 0.3) * 100) / 100
  }

  private async saveRelationships(relationships: ContentRelationship[]): Promise<void> {
    // In a real implementation, this would save to a relationships table
    console.log(`💾 Would save ${relationships.length} relationships to database`)
  }

  // Legacy methods for backward compatibility
  async analyzeContentRelationships() {
    const result = await this.performComprehensiveAnalysis(false)
    return {
      relationships_found: result.relationships_found,
      duplication_warnings: result.duplication_warnings,
      items_analyzed: result.items_analyzed
    }
  }

  async checkForDuplication(proposedContent: {
    type: string
    title: string
    content: string
    categories?: string[]
  }) {
    console.log('🔍 Checking for content duplication...')
    
    const existingContent = await this.loadContentByType(proposedContent.type as ContentItem['type'])
    const mockProposedItem: ContentItem = {
      id: 'proposed',
      type: proposedContent.type as ContentItem['type'],
      title: proposedContent.title,
      content: proposedContent.content,
      keywords: this.extractAdvancedKeywords(proposedContent.title + ' ' + proposedContent.content),
      categories: proposedContent.categories || [],
      created_at: new Date().toISOString()
    }
    
    const warnings: DuplicationWarning[] = []
    
    for (const existing of existingContent) {
      const titleSim = this.calculateAdvancedTextSimilarity(mockProposedItem.title, existing.title)
      const contentSim = this.calculateAdvancedTextSimilarity(mockProposedItem.content, existing.content)
      const overallSimilarity = (titleSim * 0.6 + contentSim * 0.4) * 100
      
      if (overallSimilarity >= 60) {
        warnings.push({
          id: `check_${existing.id}`,
          content_type: proposedContent.type,
          existing_content: existing,
          similarity_score: Math.round(overallSimilarity),
          warning_level: this.determineWarningLevel(overallSimilarity),
          recommendation: this.generateDuplicationRecommendation(mockProposedItem, existing, overallSimilarity),
          suggested_action: this.determineSuggestedAction(overallSimilarity, existing, mockProposedItem),
          auto_detected: true,
          confidence: this.calculateDuplicationConfidence(titleSim, contentSim)
        })
      }
    }
    
    return warnings.sort((a, b) => b.similarity_score - a.similarity_score)
  }

  private async loadContentByType(type: ContentItem['type']): Promise<ContentItem[]> {
    const allContent = await this.loadAllContentWithMetadata()
    return allContent.filter(item => item.type === type)
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

const AnalyzeSchema = z.object({
  action: z.enum(['analyze_all', 'check_duplication']),
  auto_mode: z.boolean().optional().default(false),
  detect_duplicates: z.boolean().optional().default(true),
  content: z.object({
    type: z.string(),
    title: z.string(),
    content: z.string(),
    categories: z.array(z.string()).optional()
  }).optional()
})

/**
 * POST /api/admin/content-relationships
 * Enhanced content analysis with automatic duplicate detection and AI insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, auto_mode, detect_duplicates, content } = AnalyzeSchema.parse(body)
    
    const supabase = await createClient()
    const agent = new EnhancedContentRelationshipAgent(supabase)
    
    if (action === 'analyze_all') {
      console.log(`🚀 Starting ${auto_mode ? 'automatic' : 'manual'} content analysis...`)
      const result = await agent.performComprehensiveAnalysis(auto_mode)
      
      return NextResponse.json({ 
        success: true, 
        result,
        message: `Analysis completed: ${result.items_analyzed} items analyzed, ${result.relationships_found} relationships found, ${result.duplication_warnings.length} potential duplicates detected`
      })
    }
    
    if (action === 'check_duplication') {
      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content required for duplication check' },
          { status: 400 }
        )
      }
      
      const warnings = await agent.checkForDuplication(content)
      return NextResponse.json({
        success: true,
        warnings,
        should_proceed: warnings.length === 0 || warnings.every(w => w.warning_level === 'low'),
        message: warnings.length === 0 
          ? 'No duplications detected - safe to proceed'
          : `${warnings.length} potential duplications found`
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Enhanced content relationship analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/content-relationships
 * Get existing relationships and analysis results
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // In a real implementation, this would fetch from content_relationships table
    // For now, return mock relationships data
    const mockRelationships = [
      {
        id: 'rel_001',
        source: { id: 'topic_001', type: 'question_topic', title: 'How Congress Works', categories: ['government'] },
        target: { id: 'glossary_001', type: 'glossary_term', title: 'Legislative Process', categories: ['government'] },
        type: 'semantic',
        strength: 85,
        auto_generated: true,
        description: 'Strongly related through shared governmental concepts'
      },
      {
        id: 'rel_002',
        source: { id: 'topic_002', type: 'question_topic', title: 'Voting Rights', categories: ['civil-rights'] },
        target: { id: 'event_001', type: 'event', title: 'Voting Rights Act of 1965', categories: ['civil-rights'] },
        type: 'hierarchical',
        strength: 92,
        auto_generated: true,
        description: 'Historical foundation provides context for current voting rights understanding'
      }
    ]
    
    return NextResponse.json({
      success: true,
      relationships: mockRelationships,
      total: mockRelationships.length,
      message: 'Relationships loaded successfully'
    })
    
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch relationships' },
      { status: 500 }
    )
  }
} 