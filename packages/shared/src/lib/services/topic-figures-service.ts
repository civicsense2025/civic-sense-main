/**
 * Service for managing relationships between question topics and public figures
 * Uses JSONB array approach for optimal performance and simplicity
 */

import { createClient } from './supabase/client'
import type { Database } from './database.types'

type QuestionTopic = Database['public']['Tables']['question_topics']['Row']
type PublicFigure = Database['public']['Tables']['public_figures']['Row']

export interface TopicWithFigures extends QuestionTopic {
  figureDetails?: PublicFigure[]
}

export class TopicFiguresService {
  private supabase = createClient()

  /**
   * Add a public figure to a topic
   */
  async addFigureToTopic(topicId: string, figureId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('add_figure_to_topic', {
        p_topic_id: topicId,
        p_figure_id: figureId
      })
      
      return !error
    } catch (error) {
      console.error('Error adding figure to topic:', error)
      return false
    }
  }

  /**
   * Remove a public figure from a topic
   */
  async removeFigureFromTopic(topicId: string, figureId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('remove_figure_from_topic', {
        p_topic_id: topicId,
        p_figure_id: figureId
      })
      
      return !error
    } catch (error) {
      console.error('Error removing figure from topic:', error)
      return false
    }
  }

  /**
   * Get all topics with their related figures
   */
  async getTopicsWithFigures(limit?: number): Promise<TopicWithFigures[]> {
    try {
      let query = this.supabase
        .from('question_topics')
        .select('*')
        .not('related_figures', 'eq', '[]')
        
      if (limit) {
        query = query.limit(limit)
      }
      
      const { data: topics, error } = await query
      
      if (error) throw error
      if (!topics?.length) return []

      // Get all unique figure IDs from all topics
      const allFigureIds = new Set<string>()
      topics.forEach(topic => {
        if (Array.isArray(topic.related_figures)) {
          topic.related_figures.forEach(id => allFigureIds.add(id))
        }
      })

      // Fetch all figures in one query
      const { data: figures } = await this.supabase
        .from('public_figures')
        .select('*')
        .in('id', Array.from(allFigureIds))

      // Map figures to topics
      const figuresMap = new Map(figures?.map(f => [f.id, f]) || [])
      
      return topics.map(topic => ({
        ...topic,
        figureDetails: Array.isArray(topic.related_figures) 
          ? topic.related_figures.map(id => figuresMap.get(id)).filter(Boolean) 
          : []
      }))
    } catch (error) {
      console.error('Error fetching topics with figures:', error)
      return []
    }
  }

  /**
   * Get topics related to a specific public figure
   */
  async getTopicsForFigure(figureId: string): Promise<QuestionTopic[]> {
    try {
      const { data, error } = await this.supabase
        .from('question_topics')
        .select('*')
        .contains('related_figures', [figureId])
        
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching topics for figure:', error)
      return []
    }
  }

  /**
   * Get figures related to a specific topic
   */
  async getFiguresForTopic(topicId: string): Promise<PublicFigure[]> {
    try {
      // First get the topic with its related figures
      const { data: topic, error: topicError } = await this.supabase
        .from('question_topics')
        .select('related_figures')
        .eq('topic_id', topicId)
        .single()
        
      if (topicError) throw topicError
      if (!topic?.related_figures || !Array.isArray(topic.related_figures)) {
        return []
      }

      // Then fetch the figure details
      const { data: figures, error: figuresError } = await this.supabase
        .from('public_figures')
        .select('*')
        .in('id', topic.related_figures)
        
      if (figuresError) throw figuresError
      return figures || []
    } catch (error) {
      console.error('Error fetching figures for topic:', error)
      return []
    }
  }

  /**
   * Bulk update figures for a topic
   */
  async setTopicFigures(topicId: string, figureIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('question_topics')
        .update({ related_figures: figureIds })
        .eq('topic_id', topicId)
        
      return !error
    } catch (error) {
      console.error('Error setting topic figures:', error)
      return false
    }
  }

  /**
   * Search for topics by figure name or topic content
   */
  async searchTopicsWithFigures(query: string): Promise<TopicWithFigures[]> {
    try {
      // Search topics by title/description
      const { data: topics, error } = await this.supabase
        .from('question_topics')
        .select('*')
        .or(`topic_title.ilike.%${query}%,description.ilike.%${query}%`)
        .not('related_figures', 'eq', '[]')
        
      if (error) throw error
      if (!topics?.length) return []

      // Also search for figures and find their topics
      const { data: figures } = await this.supabase
        .from('public_figures')
        .select('id')
        .or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%`)

      if (figures?.length) {
        const figureIds = figures.map(f => f.id)
        const { data: figureTopics } = await this.supabase
          .from('question_topics')
          .select('*')
          .overlaps('related_figures', figureIds)
          
        // Combine results (remove duplicates)
        const allTopics = [...topics]
        figureTopics?.forEach(ft => {
          if (!topics.find(t => t.topic_id === ft.topic_id)) {
            allTopics.push(ft)
          }
        })
        
        return this.enrichTopicsWithFigures(allTopics)
      }

      return this.enrichTopicsWithFigures(topics)
    } catch (error) {
      console.error('Error searching topics with figures:', error)
      return []
    }
  }

  /**
   * Helper to enrich topics with figure details
   */
  private async enrichTopicsWithFigures(topics: QuestionTopic[]): Promise<TopicWithFigures[]> {
    if (!topics.length) return []

    const allFigureIds = new Set<string>()
    topics.forEach(topic => {
      if (Array.isArray(topic.related_figures)) {
        topic.related_figures.forEach(id => allFigureIds.add(id))
      }
    })

    const { data: figures } = await this.supabase
      .from('public_figures')
      .select('*')
      .in('id', Array.from(allFigureIds))

    const figuresMap = new Map(figures?.map(f => [f.id, f]) || [])
    
    return topics.map(topic => ({
      ...topic,
      figureDetails: Array.isArray(topic.related_figures)
        ? topic.related_figures.map(id => figuresMap.get(id)).filter(Boolean)
        : []
    }))
  }
}

// Export singleton instance
export const topicFiguresService = new TopicFiguresService()

// React Hook for easier usage
export function useTopicFigures() {
  return {
    addFigureToTopic: topicFiguresService.addFigureToTopic.bind(topicFiguresService),
    removeFigureFromTopic: topicFiguresService.removeFigureFromTopic.bind(topicFiguresService),
    getTopicsWithFigures: topicFiguresService.getTopicsWithFigures.bind(topicFiguresService),
    getTopicsForFigure: topicFiguresService.getTopicsForFigure.bind(topicFiguresService),
    getFiguresForTopic: topicFiguresService.getFiguresForTopic.bind(topicFiguresService),
    setTopicFigures: topicFiguresService.setTopicFigures.bind(topicFiguresService),
    searchTopicsWithFigures: topicFiguresService.searchTopicsWithFigures.bind(topicFiguresService),
  }
} 