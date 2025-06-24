/**
 * Content Relationship AI Subagent API Route
 * 
 * This subagent analyzes existing CivicSense content to:
 * 1. Build semantic relationships between content pieces
 * 2. Detect potential duplicates or overly similar content
 * 3. Recommend against creating redundant content
 * 4. Suggest content enhancement opportunities
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
  relationship_strength?: number
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
  content_type: string
  existing_content: ContentItem
  similarity_score: number
  warning_level: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  suggested_action: 'merge' | 'enhance_existing' | 'differentiate' | 'cancel_creation'
}

interface ContentAnalysisResult {
  relationships_found: number
  relationships_created: number
  duplication_warnings: DuplicationWarning[]
  enhancement_opportunities: Array<{
    content_id: string
    content_type: string
    opportunity: string
    priority: 'low' | 'medium' | 'high'
  }>
  processing_stats: {
    items_analyzed: number
    processing_time: number
    ai_provider: string
    cost_estimate: number
  }
}

// ============================================================================
// CONTENT RELATIONSHIP AI SUBAGENT
// ============================================================================

class ContentRelationshipAgent {
  constructor(private supabase: any) {}

  async analyzeContentRelationships() {
    console.log('🔗 Starting content relationship analysis...')
    
    const allContent = await this.loadAllContent()
    const relationships = await this.findContentRelationships(allContent)
    const duplicationWarnings = await this.detectDuplications(allContent)
    
    return {
      relationships_found: relationships.length,
      duplication_warnings: duplicationWarnings,
      items_analyzed: allContent.length
    }
  }

  async checkForDuplication(proposedContent: {
    type: string
    title: string
    content: string
    categories?: string[]
  }) {
    const existingContent = await this.loadContentByType(proposedContent.type as ContentItem['type'])
    const similarities = await this.findSimilarContent(proposedContent, existingContent)
    
    const warnings: DuplicationWarning[] = []
    
    for (const similar of similarities) {
      if (similar.similarity_score && similar.similarity_score > 70) {
        warnings.push({
          content_type: proposedContent.type,
          existing_content: similar,
          similarity_score: similar.similarity_score,
          warning_level: similar.similarity_score > 90 ? 'critical' : 'high',
          recommendation: `Very similar to existing content: "${similar.title}"`,
          suggested_action: similar.similarity_score > 90 ? 'cancel_creation' : 'enhance_existing'
        })
      }
    }
    
    return warnings
  }

  private async loadAllContent(): Promise<ContentItem[]> {
    const content: ContentItem[] = []
    
    // Load question topics
    const { data: topics } = await this.supabase
      .from(DB_TABLES.QUESTION_TOPICS)
      .select('topic_id, topic_title, description, categories, created_at')
      .eq('is_active', true)
    
    if (topics) {
      content.push(...topics.map((topic: any) => ({
        id: topic.topic_id,
        type: 'question_topic' as const,
        title: topic.topic_title,
        content: `${topic.topic_title} ${topic.description || ''}`,
        keywords: this.extractKeywords(topic.topic_title + ' ' + (topic.description || '')),
        categories: topic.categories || [],
        created_at: topic.created_at
      })))
    }

    // Load glossary terms
    const { data: glossary } = await this.supabase
      .from(DB_TABLES.GLOSSARY_TERMS)
      .select('term_id, term, definition, category, created_at')
    
    if (glossary) {
      content.push(...glossary.map((term: any) => ({
        id: term.term_id,
        type: 'glossary_term' as const,
        title: term.term,
        content: `${term.term} ${term.definition || ''}`,
        keywords: this.extractKeywords(term.term + ' ' + (term.definition || '')),
        categories: term.category ? [term.category] : [],
        created_at: term.created_at
      })))
    }

    return content
  }

  private async loadContentByType(type: ContentItem['type']): Promise<ContentItem[]> {
    const allContent = await this.loadAllContent()
    return allContent.filter(item => item.type === type)
  }

  private async findContentRelationships(content: ContentItem[]): Promise<ContentRelationship[]> {
    const relationships: ContentRelationship[] = []
    
    // Basic relationship detection based on keyword overlap
    for (let i = 0; i < content.length; i++) {
      for (let j = i + 1; j < content.length; j++) {
        const item1 = content[i]
        const item2 = content[j]
        
        const similarity = this.calculateKeywordSimilarity(item1.keywords, item2.keywords)
        
        if (similarity > 0.3) {
          relationships.push({
            id: `rel_${item1.id}_${item2.id}`,
            source_content_id: item1.id,
            source_content_type: item1.type,
            target_content_id: item2.id,
            target_content_type: item2.type,
            relationship_type: 'semantic',
            strength: Math.round(similarity * 100),
            description: `Related through shared concepts and keywords`,
            created_by_ai: true,
            created_at: new Date().toISOString()
          })
        }
      }
    }
    
    return relationships
  }

  private async findSimilarContent(
    proposedContent: { type: string; title: string; content: string; categories?: string[] },
    existingContent: ContentItem[]
  ): Promise<ContentItem[]> {
    const similarities: ContentItem[] = []
    
    for (const existing of existingContent) {
      const titleSimilarity = this.calculateTextSimilarity(proposedContent.title, existing.title)
      const contentSimilarity = this.calculateTextSimilarity(proposedContent.content, existing.content)
      
      const overallSimilarity = (titleSimilarity + contentSimilarity) / 2
      
      if (overallSimilarity > 0.5) {
        similarities.push({
          ...existing,
          similarity_score: Math.round(overallSimilarity * 100)
        })
      }
    }
    
    return similarities.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
  }

  private async detectDuplications(content: ContentItem[]): Promise<DuplicationWarning[]> {
    const warnings: DuplicationWarning[] = []
    
    const contentByType = content.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, ContentItem[]>)
    
    for (const [type, items] of Object.entries(contentByType)) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const similarity = this.calculateContentSimilarity(items[i], items[j])
          
          if (similarity > 70) {
            warnings.push({
              content_type: type,
              existing_content: items[j],
              similarity_score: similarity,
              warning_level: similarity > 90 ? 'critical' : 'high',
              recommendation: `Consider merging "${items[i].title}" and "${items[j].title}"`,
              suggested_action: 'merge'
            })
          }
        }
      }
    }
    
    return warnings
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10)
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    const intersection = new Set([...set1].filter(keyword => set2.has(keyword)))
    
    return intersection.size / Math.max(set1.size, set2.size)
  }

  private calculateContentSimilarity(item1: ContentItem, item2: ContentItem): number {
    const titleSim = this.calculateTextSimilarity(item1.title, item2.title)
    const contentSim = this.calculateTextSimilarity(item1.content, item2.content)
    
    return Math.round(((titleSim + contentSim) / 2) * 100)
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

const AnalyzeSchema = z.object({
  action: z.enum(['analyze_all', 'check_duplication']),
  content: z.object({
    type: z.string(),
    title: z.string(),
    content: z.string(),
    categories: z.array(z.string()).optional()
  }).optional()
})

/**
 * POST /api/admin/content-relationships
 * Analyze content relationships and detect duplications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, content } = AnalyzeSchema.parse(body)
    
    const supabase = await createClient()
    const agent = new ContentRelationshipAgent(supabase)
    
    if (action === 'analyze_all') {
      const result = await agent.analyzeContentRelationships()
      return NextResponse.json({ success: true, result })
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
        should_proceed: warnings.length === 0 || warnings.every(w => w.warning_level === 'low')
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Content relationship analysis error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
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
    
    // For now, return empty relationships array
    // In the future, this would fetch from content_relationships table
    return NextResponse.json({
      success: true,
      relationships: [],
      total: 0
    })
    
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch relationships' },
      { status: 500 }
    )
  }
} 