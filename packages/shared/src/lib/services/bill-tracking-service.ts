import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CongressAPIClient } from '../lib/integrations/congress-api'
import { getDetailedBillProgress, getBillUrgency, getStakeholderImpact } from './utils/congressional'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Comprehensive Bill Tracking Service
 * 
 * Provides real-time bill status tracking, content relationships,
 * and intelligent notifications for the CivicSense platform.
 */
export class BillTrackingService {
  private supabase: SupabaseClient
  private congressAPI: CongressAPIClient

  constructor() {
    // Use service role client to bypass RLS policies for administrative operations
    this.supabase = createServiceClient()
    
    this.congressAPI = new CongressAPIClient({
      baseUrl: process.env.NEXT_PUBLIC_CONGRESS_API_BASE_URL!,
      apiKey: process.env.CONGRESS_API_KEY!,
      rateLimitPerSecond: 1
    })
  }

  /**
   * Track a bill for status updates and create relationships
   */
  async trackBill(billId: string, options: {
    enableNotifications?: boolean
    linkToQuizTopics?: boolean
    generateCivicContent?: boolean
  } = {}): Promise<{
    success: boolean
    trackingRecord?: any
    error?: string
  }> {
    try {
      // Get bill details with relationships
      const { data: bill } = await this.supabase
        .from('congressional_bills')
        .select(`
          *,
          bill_actions(*),
          bill_content_analysis(*),
          primary_sponsor:primary_sponsor_id(*)
        `)
        .eq('id', billId)
        .single()

      if (!bill) {
        return { success: false, error: 'Bill not found' }
      }

      // Get enhanced progress information
      const progress = getDetailedBillProgress(bill.bill_actions || [])
      const urgency = getBillUrgency(bill)
      const stakeholderImpact = getStakeholderImpact(bill)

      // Create or update tracking record
      const trackingRecord = {
        bill_id: billId,
        current_stage: progress.currentStage,
        progress_percentage: progress.percentage,
        is_stalled: progress.isStalled,
        days_since_last_action: progress.daysSinceLastAction,
        urgency_level: urgency.level,
        urgency_reasons: urgency.reasons,
        stakeholder_impact_level: stakeholderImpact.impactLevel,
        affected_stakeholders: stakeholderImpact.primaryStakeholders,
        affected_sectors: stakeholderImpact.affectedSectors,
        geographic_scope: stakeholderImpact.geographicScope,
        notifications_enabled: options.enableNotifications || false,
        last_checked: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const { data: tracking, error: trackingError } = await this.supabase
        .from('bill_tracking')
        .upsert(trackingRecord, { onConflict: 'bill_id' })
        .select()
        .single()

      if (trackingError) throw trackingError

      // Generate content relationships if requested
      if (options.linkToQuizTopics) {
        await this.linkBillToQuizTopics(billId, bill)
      }

      // Generate civic content if requested
      if (options.generateCivicContent) {
        await this.generateCivicContent(billId, bill, progress, urgency, stakeholderImpact)
      }

      return { success: true, trackingRecord: tracking }

    } catch (error) {
      console.error('Error tracking bill:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update bill status and check for significant changes
   */
  async updateBillStatus(billId: string): Promise<{
    success: boolean
    hasSignificantChanges?: boolean
    changes?: StatusChange[]
    error?: string
  }> {
    try {
      // Get current bill data
      const { data: currentBill } = await this.supabase
        .from('congressional_bills')
        .select('congress_number, bill_type, bill_number, current_status, last_action_date')
        .eq('id', billId)
        .single()

      if (!currentBill) {
        return { success: false, error: 'Bill not found' }
      }

      // Fetch latest actions from Congress API
      const latestActions = await this.congressAPI.getBillActions(
        currentBill.congress_number,
        currentBill.bill_type,
        currentBill.bill_number
      )

      if (!latestActions.actions || latestActions.actions.length === 0) {
        return { success: true, hasSignificantChanges: false }
      }

      // Check for new actions
      const { data: existingActions } = await this.supabase
        .from('bill_actions')
        .select('action_date, action_text')
        .eq('bill_id', billId)
        .order('action_date', { ascending: false })

      const existingActionDates = new Set(
        existingActions?.map(a => a.action_date) || []
      )

      const newActions = latestActions.actions.filter((action: any) => 
        !existingActionDates.has(action.actionDate)
      )

      let changes: StatusChange[] = []

      // Process new actions
      for (const action of newActions) {
        // Store new action
        await this.supabase
          .from('bill_actions')
          .insert({
            bill_id: billId,
            action_date: action.actionDate,
            action_text: action.text,
            action_type: this.categorizeAction(action.text),
            chamber: this.determineChamber(action.text),
            significance_score: this.scoreActionSignificance(action.text)
          })

        // Track the change
        changes.push({
          type: 'new_action',
          date: action.actionDate,
          description: action.text,
          significance: this.scoreActionSignificance(action.text)
        })
      }

      // Update bill's current status if needed
      const latestAction = latestActions.actions[0]
      if (latestAction && latestAction.actionDate !== currentBill.last_action_date) {
        await this.supabase
          .from('congressional_bills')
          .update({
            current_status: latestAction.text,
            last_action_date: latestAction.actionDate,
            last_action_text: latestAction.text,
            updated_at: new Date().toISOString()
          })
          .eq('id', billId)

        changes.push({
          type: 'status_change',
          date: latestAction.actionDate,
          description: `Status updated: ${latestAction.text}`,
          significance: this.scoreActionSignificance(latestAction.text)
        })
      }

      // Update tracking information
      await this.updateTrackingRecord(billId)

      // Send notifications if enabled and changes are significant
      if (changes.length > 0) {
        await this.sendNotificationsIfEnabled(billId, changes)
      }

      return {
        success: true,
        hasSignificantChanges: changes.some(c => c.significance >= 7),
        changes
      }

    } catch (error) {
      console.error('Error updating bill status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Link bill to related quiz topics based on content analysis
   */
  async linkBillToQuizTopics(billId: string, bill: any): Promise<void> {
    try {
      // Get bill content analysis
      const { data: analysis } = await this.supabase
        .from('bill_content_analysis')
        .select('*')
        .eq('bill_id', billId)
        .single()

      if (!analysis) return

      // Find related quiz topics based on categories and content
      const { data: potentialTopics } = await this.supabase
        .from('question_topics')
        .select('*')
        .contains('categories', bill.categories || [])
        .eq('is_active', true)

      for (const topic of potentialTopics || []) {
        // Calculate relevance score
        const relevanceScore = this.calculateTopicRelevance(bill, topic, analysis)
        
        if (relevanceScore >= 0.6) { // 60% relevance threshold
          // Create relationship
          await this.supabase
            .from('bill_topic_relationships')
            .upsert({
                          bill_id: billId,
            topic_id: topic.id,
            relationship_type: 'content_similarity',
            relevance_score: relevanceScore,
            created_at: new Date().toISOString()
            }, { onConflict: 'bill_id,topic_id' })
        }
      }

    } catch (error) {
      console.error('Error linking bill to quiz topics:', error)
    }
  }

  /**
   * Get comprehensive bill relationships
   */
  async getBillRelationships(billId: string): Promise<{
    relatedBills: any[]
    relatedHearings: any[]
    relatedTopics: any[]
    relatedQuestions: any[]
    relatedEvents: any[]
  }> {
    try {
      const [relatedBills, relatedHearings, relatedTopics, relatedQuestions, relatedEvents] = await Promise.all([
        // Related bills
        this.supabase
          .from('bill_relationships')
          .select(`
            relationship_type,
            related_bill:related_bill_id(
              title,
              bill_type,
              bill_number,
              current_status
            )
          `)
          .eq('bill_id', billId),

        // Related hearings
        this.supabase
          .from('bill_hearing_relationships')
          .select(`
            relationship_type,
            relevance_score,
            hearing:hearing_id(
              title,
              hearing_date,
              committee_name
            )
          `)
          .eq('bill_id', billId),

        // Related quiz topics
        this.supabase
          .from('bill_topic_relationships')
          .select(`
            relationship_type,
            relevance_score,
            topic:topic_id(
              topic_title,
              description,
              emoji
            )
          `)
          .eq('bill_id', billId),

        // Related questions
        this.supabase
          .from('auto_generated_questions')
          .select('*')
          .eq('source_bill_id', billId)
          .eq('is_active', true),

        // Related civic events
        this.supabase
          .from('auto_generated_events')
          .select('*')
          .eq('source_bill_id', billId)
          .eq('is_published', true)
      ])

      return {
        relatedBills: relatedBills.data || [],
        relatedHearings: relatedHearings.data || [],
        relatedTopics: relatedTopics.data || [],
        relatedQuestions: relatedQuestions.data || [],
        relatedEvents: relatedEvents.data || []
      }

    } catch (error) {
      console.error('Error getting bill relationships:', error)
      return {
        relatedBills: [],
        relatedHearings: [],
        relatedTopics: [],
        relatedQuestions: [],
        relatedEvents: []
      }
    }
  }

  /**
   * Monitor all tracked bills for updates
   */
  async monitorAllTrackedBills(): Promise<{
    updated: number
    errors: number
    significantChanges: number
  }> {
    try {
      // Get all tracked bills
      const { data: trackedBills } = await this.supabase
        .from('bill_tracking')
        .select('bill_id')
        .eq('notifications_enabled', true)

      let updated = 0
      let errors = 0
      let significantChanges = 0

      for (const tracked of trackedBills || []) {
        try {
          const result = await this.updateBillStatus(tracked.bill_id)
          if (result.success) {
            updated++
            if (result.hasSignificantChanges) {
              significantChanges++
            }
          } else {
            errors++
          }
        } catch (error) {
          errors++
          console.error(`Error updating bill ${tracked.bill_id}:`, error)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1100))
      }

      return { updated, errors, significantChanges }

    } catch (error) {
      console.error('Error monitoring tracked bills:', error)
      return { updated: 0, errors: 1, significantChanges: 0 }
    }
  }

  // Helper methods
  private categorizeAction(actionText: string): string {
    const text = actionText.toLowerCase()
    
    if (text.includes('introduced')) return 'introduced'
    if (text.includes('referred')) return 'committee_action'
    if (text.includes('reported')) return 'committee_action'
    if (text.includes('passed') || text.includes('agreed to')) return 'floor_action'
    if (text.includes('signed') || text.includes('became law')) return 'enacted'
    if (text.includes('vetoed')) return 'vetoed'
    
    return 'other'
  }

  private determineChamber(actionText: string): string {
    const text = actionText.toLowerCase()
    
    if (text.includes('house')) return 'house'
    if (text.includes('senate')) return 'senate'
    
    return 'both'
  }

  private scoreActionSignificance(actionText: string): number {
    const text = actionText.toLowerCase()
    
    if (text.includes('signed') || text.includes('became law') || text.includes('vetoed')) return 10
    if (text.includes('passed') || text.includes('agreed to')) return 9
    if (text.includes('reported') || text.includes('ordered')) return 7
    if (text.includes('referred') || text.includes('introduced')) return 5
    if (text.includes('hearing') || text.includes('markup')) return 6
    
    return 3
  }

  private calculateTopicRelevance(bill: any, topic: any, analysis: any): number {
    let score = 0
    
    // Category overlap
    const billCategories = bill.categories || []
    const topicCategories = topic.categories || []
    const categoryOverlap = billCategories.filter((cat: string) => topicCategories.includes(cat))
    score += (categoryOverlap.length / Math.max(billCategories.length, topicCategories.length)) * 0.4
    
    // Content keyword matching
    const billContent = `${bill.title} ${bill.description || ''} ${analysis?.plain_english_summary || ''}`.toLowerCase()
    const topicContent = `${topic.topic_title} ${topic.description}`.toLowerCase()
    
    // Simple keyword overlap calculation
    const billWords = new Set(billContent.split(/\s+/))
    const topicWords = new Set(topicContent.split(/\s+/))
    const commonWords = [...billWords].filter(word => topicWords.has(word))
    const contentScore = commonWords.length / Math.max(billWords.size, topicWords.size)
    score += contentScore * 0.6
    
    return Math.min(score, 1.0)
  }

  private async updateTrackingRecord(billId: string): Promise<void> {
    // Update the tracking record with latest progress
    const { data: bill } = await this.supabase
      .from('congressional_bills')
      .select('*, bill_actions(*)')
      .eq('id', billId)
      .single()

    if (bill) {
      const progress = getDetailedBillProgress(bill.bill_actions || [])
      const urgency = getBillUrgency(bill)

      await this.supabase
        .from('bill_tracking')
        .update({
          current_stage: progress.currentStage,
          progress_percentage: progress.percentage,
          is_stalled: progress.isStalled,
          days_since_last_action: progress.daysSinceLastAction,
          urgency_level: urgency.level,
          last_checked: new Date().toISOString()
        })
        .eq('bill_id', billId)
    }
  }

  private async sendNotificationsIfEnabled(billId: string, changes: StatusChange[]): Promise<void> {
    // Implementation for sending notifications
    // This would integrate with your notification system
    console.log(`Notifications for bill ${billId}:`, changes)
  }

  private async generateCivicContent(
    billId: string, 
    bill: any, 
    progress: any, 
    urgency: any, 
    stakeholderImpact: any
  ): Promise<void> {
    // Generate civic education content from bill tracking data
    console.log(`Generating civic content for bill ${billId}`)
  }
}

// Type definitions
interface StatusChange {
  type: 'new_action' | 'status_change' | 'milestone_reached'
  date: string
  description: string
  significance: number
}

export default BillTrackingService 