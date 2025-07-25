// lib/guest-tracking.ts - Implementation using Supabase
import { createClient } from "@supabase/supabase-js"

interface GuestUsageRecord {
  ip: string
  date: string
  attempts: number
  tokens: string[]
  firstSeen: string
  lastSeen: string
  completedTopics: string[] // Track completed topic IDs
}

interface GuestAnalyticsRecord {
  ip: string
  date: string
  timestamp: string
  guest_token: string
  attempts: number
  topic_id?: string // Track which topic was completed
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a Supabase client without database types for custom tables
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Table name for guest usage tracking
const GUEST_USAGE_TABLE = 'guest_usage_tracking'
const GUEST_ANALYTICS_TABLE = 'guest_usage_analytics'

export async function getGuestUsage(ip: string, date: string): Promise<GuestUsageRecord> {
  try {
    // Query Supabase for existing record
    const { data, error } = await supabase
      .from(GUEST_USAGE_TABLE)
      .select()
      .eq('ip', ip)
      .eq('date', date)
      .single()
    
    if (error || !data) {
      // Return default record if not found
      return {
        ip,
        date,
        attempts: 0,
        tokens: [],
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        completedTopics: [] // Initialize empty array
      }
    }
    
    return {
      ...data,
      completedTopics: data.completedTopics || [] // Ensure completedTopics exists
    } as GuestUsageRecord
  } catch (error) {
    console.error('Error getting guest usage:', error)
    // Return safe default
    return {
      ip,
      date,
      attempts: 0,
      tokens: [],
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      completedTopics: [] // Initialize empty array
    }
  }
}

export async function recordGuestUsage(ip: string, guestToken: string, timestamp: string, topicId?: string): Promise<void> {
  const date = timestamp.split('T')[0]
  
  try {
    // Get existing record
    const existing = await getGuestUsage(ip, date)
    
    // Update record with completed topic if provided
    const updatedTopics = topicId && !existing.completedTopics.includes(topicId)
      ? [...existing.completedTopics, topicId]
      : existing.completedTopics
    
    // Update record
    const updated: GuestUsageRecord = {
      ...existing,
      attempts: existing.attempts + 1,
      tokens: existing.tokens.includes(guestToken) 
        ? existing.tokens 
        : [...existing.tokens, guestToken],
      lastSeen: timestamp,
      completedTopics: updatedTopics
    }
    
    // Upsert to Supabase
    const { error } = await supabase
      .from(GUEST_USAGE_TABLE)
      .upsert({
        ip,
        date,
        attempts: updated.attempts,
        tokens: updated.tokens,
        firstSeen: existing.attempts === 0 ? timestamp : existing.firstSeen,
        lastSeen: timestamp,
        completedTopics: updatedTopics
      })
    
    if (error) {
      console.error('Error upserting guest usage:', error)
    }
    
    // Also store analytics data (optional)
    await supabase
      .from(GUEST_ANALYTICS_TABLE)
      .insert({
        ip,
        date,
        timestamp,
        guest_token: guestToken,
        attempts: updated.attempts,
        topic_id: topicId
      })
    
  } catch (error) {
    console.error('Error recording guest usage:', error)
    // Don't throw - we don't want to break the user experience if tracking fails
  }
}

export async function resetGuestUsage(ip: string, guestToken: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // Delete the record for today
    const { error } = await supabase
      .from(GUEST_USAGE_TABLE)
      .delete()
      .eq('ip', ip)
      .eq('date', today)
    
    if (error) {
      console.error('Error resetting guest usage:', error)
      throw error
    }
  } catch (error) {
    console.error('Error resetting guest usage:', error)
    throw error
  }
}

// Get completed topics for a guest user
export async function getCompletedTopics(ip: string): Promise<string[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const usage = await getGuestUsage(ip, today)
    return usage.completedTopics || []
  } catch (error) {
    console.error('Error getting completed topics:', error)
    return []
  }
}

// Optional: Get analytics for admin dashboard
export async function getGuestAnalytics(ip: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(GUEST_ANALYTICS_TABLE)
      .select()
      .eq('ip', ip)
      .order('timestamp', { ascending: false })
      .limit(30)
    
    if (error) {
      console.error('Error getting guest analytics:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error getting guest analytics:', error)
    return []
  }
}