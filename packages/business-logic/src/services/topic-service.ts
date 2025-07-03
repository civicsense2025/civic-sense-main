import { supabase } from './supabase/client'

export type TopicStatusType = 'breaking' | 'featured' | 'trending' | 'viral'

export interface TopicStatus {
  id: string
  topic_id: string
  status_type: TopicStatusType
  started_at: string
  ended_at: string | null
  reason: string | null
  added_by: string | null
  engagement_metrics: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface TopicStatusHistory {
  current: TopicStatus | null
  history: TopicStatus[]
}

export const topicStatusOperations = {
  /**
   * Get current status of a topic
   */
  async getCurrentStatus(topicId: string, statusType: TopicStatusType): Promise<TopicStatus | null> {
    const { data, error } = await supabase
      .from('topic_status_history')
      .select('*')
      .eq('topic_id', topicId)
      .eq('status_type', statusType)
      .is('ended_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as TopicStatus
  },

  /**
   * Get status history of a topic
   */
  async getStatusHistory(topicId: string): Promise<TopicStatusHistory> {
    const { data, error } = await supabase
      .from('topic_status_history')
      .select('*')
      .eq('topic_id', topicId)
      .order('started_at', { ascending: false })

    if (error) throw error

    const history = data as TopicStatus[]
    const current = history.find(status => !status.ended_at) || null

    return {
      current,
      history
    }
  },

  /**
   * Update topic status
   */
  async updateStatus(
    topicId: string,
    statusType: TopicStatusType,
    reason?: string,
    engagementMetrics?: Record<string, any>
  ): Promise<{ success: boolean; status_id: string }> {
    const { data, error } = await supabase
      .rpc('update_topic_status', {
        p_topic_id: topicId,
        p_status_type: statusType,
        p_reason: reason,
        p_engagement_metrics: engagementMetrics
      })

    if (error) throw error

    return {
      success: true,
      status_id: data.status_id
    }
  },

  /**
   * End topic status
   */
  async endStatus(
    topicId: string,
    statusType: TopicStatusType
  ): Promise<{ success: boolean; status_id: string | null }> {
    const { data, error } = await supabase
      .rpc('end_topic_status', {
        p_topic_id: topicId,
        p_status_type: statusType
      })

    if (error) throw error

    return {
      success: true,
      status_id: data.status_id
    }
  },

  /**
   * Get all topics with a specific status
   */
  async getTopicsWithStatus(statusType: TopicStatusType): Promise<{
    topic_id: string
    topic_title: string
    status: TopicStatus
  }[]> {
    const { data, error } = await supabase
      .from('topic_status_history')
      .select(`
        *,
        question_topics!inner (
          topic_id,
          topic_title
        )
      `)
      .eq('status_type', statusType)
      .is('ended_at', null)

    if (error) throw error

    return data.map(row => ({
      topic_id: row.question_topics.topic_id,
      topic_title: row.question_topics.topic_title,
      status: row as TopicStatus
    }))
  },

  /**
   * Get all breaking news topics
   */
  async getBreakingTopics() {
    return this.getTopicsWithStatus('breaking')
  },

  /**
   * Get all featured topics
   */
  async getFeaturedTopics() {
    return this.getTopicsWithStatus('featured')
  },

  /**
   * Get all trending topics
   */
  async getTrendingTopics() {
    return this.getTopicsWithStatus('trending')
  },

  /**
   * Get all viral topics
   */
  async getViralTopics() {
    return this.getTopicsWithStatus('viral')
  }
} 