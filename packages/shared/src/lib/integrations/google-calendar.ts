/**
 * Google Calendar Integration Service
 * 
 * Handles syncing CivicSense topics and news to users' Google Calendars
 * Uses existing Google OAuth infrastructure from classroom integration
 */

import { createClient } from './supabase/client'

// Topic data structure from question_topics table
interface TopicData {
  topic_id: string
  topic_title: string
  description?: string
  emoji: string
  date: string
  categories?: string[]
  is_breaking?: boolean
  is_featured?: boolean
  why_this_matters?: string
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CalendarEvent {
  id?: string
  summary: string
  description: string
  start: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  end: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  location?: string
  source?: {
    title: string
    url: string
  }
}

export interface CalendarSyncOptions {
  includeBreakingNews?: boolean
  includeFeaturedTopics?: boolean
  includeAllTopics?: boolean
  calendarId?: string
  timeZone?: string
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  skippedCount: number
  errors: string[]
  calendarId: string
}

// ============================================================================
// GOOGLE CALENDAR SERVICE
// ============================================================================

export class GoogleCalendarService {
  private accessToken: string
  private userId: string
  private baseUrl = 'https://www.googleapis.com/calendar/v3'

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken
    this.userId = userId
  }

  /**
   * Get user's calendars
   */
  async getCalendars() {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Error fetching calendars:', error)
      throw error
    }
  }

  /**
   * Create or get CivicSense calendar
   */
  async getOrCreateCivicSenseCalendar(): Promise<string> {
    try {
      const calendars = await this.getCalendars()
      
      // Look for existing CivicSense calendar
      const existingCalendar = calendars.find(
        (cal: any) => cal.summary === 'CivicSense - Daily Topics & News'
      )

      if (existingCalendar) {
        return existingCalendar.id
      }

      // Create new calendar
      const calendarData = {
        summary: 'CivicSense - Daily Topics & News',
        description: 'Daily civic education topics and breaking news from CivicSense',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      const response = await fetch(`${this.baseUrl}/calendars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create calendar: ${response.statusText}`)
      }

      const calendar = await response.json()
      return calendar.id
    } catch (error) {
      console.error('Error creating/getting calendar:', error)
      throw error
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(calendarId: string, event: CalendarEvent): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create event: ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  /**
   * Batch create events
   */
  async batchCreateEvents(calendarId: string, events: CalendarEvent[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      skippedCount: 0,
      errors: [],
      calendarId,
    }

    for (const event of events) {
      try {
        await this.createEvent(calendarId, event)
        result.syncedCount++
      } catch (error) {
        result.errors.push(`Failed to sync "${event.summary}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.skippedCount++
      }
    }

    if (result.errors.length > 0) {
      result.success = false
    }

    return result
  }
}

// ============================================================================
// TOPIC TO CALENDAR EVENT CONVERSION
// ============================================================================

/**
 * Convert CivicSense topic to Google Calendar event
 */
export function topicToCalendarEvent(topic: TopicData, timeZone?: string): CalendarEvent {
  const topicDate = new Date(topic.date || Date.now())
  const eventDate = topicDate.toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Create deep link to topic
  const topicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.com'}/quiz/${topic.topic_id}`
  
  // Build comprehensive description
  const description = [
    topic.description || '',
    '',
    topic.why_this_matters ? `Why this matters: ${topic.why_this_matters}` : '',
    '',
    `Categories: ${topic.categories?.join(', ') || 'General'}`,
    topic.is_breaking ? '🚨 Breaking News' : '',
    topic.is_featured ? '⭐ Featured Topic' : '',
    '',
    `Learn more: ${topicUrl}`,
  ].filter(Boolean).join('\n')

  const emoji = topic.emoji || '📚'
  const summary = `${emoji} ${topic.topic_title}`

  return {
    summary,
    description,
    start: {
      date: eventDate,
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      date: eventDate,
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: topicUrl, // Use the deep link as location for easy access
    source: {
      title: 'CivicSense',
      url: topicUrl,
    },
  }
}

// ============================================================================
// MAIN SYNC FUNCTIONS
// ============================================================================

/**
 * Sync topics to Google Calendar
 */
export async function syncTopicsToCalendar(
  accessToken: string,
  userId: string,
  options: CalendarSyncOptions = {}
): Promise<SyncResult> {
  try {
    const calendarService = new GoogleCalendarService(accessToken, userId)
    const supabase = createClient()

    // Get or create CivicSense calendar
    const calendarId = options.calendarId || await calendarService.getOrCreateCivicSenseCalendar()

    // Build query for topics
    let query = supabase
      .from('question_topics')
      .select('*')
      .order('date', { ascending: false })

    // Apply filters based on options
    if (options.includeBreakingNews && !options.includeAllTopics) {
      query = query.eq('is_breaking', true)
    } else if (options.includeFeaturedTopics && !options.includeAllTopics) {
      query = query.eq('is_featured', true)
    }

    // Limit to recent topics (last 30 days) to avoid overwhelming the calendar
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('date', thirtyDaysAgo.toISOString())

    const { data: topics, error } = await query

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`)
    }

    if (!topics || topics.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        skippedCount: 0,
        errors: [],
        calendarId,
      }
    }

    // Convert topics to calendar events
    const events = topics.map(topic => topicToCalendarEvent(topic, options.timeZone))

    // Batch create events
    const result = await calendarService.batchCreateEvents(calendarId, events)

    // Log sync activity
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: userId,
        calendar_id: calendarId,
        synced_count: result.syncedCount,
        skipped_count: result.skippedCount,
        errors: result.errors,
        sync_options: options,
        synced_at: new Date().toISOString(),
      })
      .single()

    return result
  } catch (error) {
    console.error('Error syncing topics to calendar:', error)
    throw error
  }
}

/**
 * Get user's Google Calendar access token from existing integration
 */
export async function getUserCalendarToken(userId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    // Check if user has Google integration with calendar scope
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, expires_at, scopes')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single()

    if (error || !integration) {
      console.log('No Google integration found for user')
      return null
    }

    // Check if the integration includes calendar scope
    const scopes = integration.scopes || []
    if (!scopes.includes('calendar')) {
      console.log('Google integration does not include calendar scope')
      return null
    }

    // Check if token is expired
    if (integration.expires_at && new Date(integration.expires_at) <= new Date()) {
      // TODO: Implement token refresh logic using refresh_token
      console.warn('Google access token expired, refresh needed')
      return null
    }

    return integration.access_token
  } catch (error) {
    console.error('Error fetching calendar token:', error)
    return null
  }
}

/**
 * Check if user has calendar sync enabled
 */
export async function isCalendarSyncEnabled(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('calendar_sync_enabled')
      .eq('user_id', userId)
      .single()

    if (error || !settings) {
      return false
    }

    return settings.calendar_sync_enabled || false
  } catch (error) {
    console.error('Error checking calendar sync settings:', error)
    return false
  }
} 