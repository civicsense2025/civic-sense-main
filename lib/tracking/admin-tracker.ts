import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Types for admin panel tracking
export interface AdminActivity {
  actionType: string
  actionCategory: string
  resourceType?: string
  resourceId?: string
  actionDetails?: Record<string, any>
  status?: 'success' | 'failure' | 'partial'
  errorMessage?: string
  durationMs?: number
}

export interface PerformanceMetric {
  metricType: string
  metricName: string
  value: number
  unit: string
  metadata?: Record<string, any>
}

export interface BulkOperation {
  operationType: string
  totalItems: number
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
}

export interface SystemAlert {
  alertType: 'error' | 'warning' | 'info' | 'success'
  alertCategory: string
  title: string
  message: string
  details?: Record<string, any>
  severity?: number
}

class AdminTracker {
  private supabase: SupabaseClient
  private performanceQueue: PerformanceMetric[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.supabase = createClient()
    this.startPerformanceFlush()
  }

  // Track admin activities
  async trackActivity(activity: AdminActivity): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('log_activity', {
        p_action_type: activity.actionType,
        p_action_category: activity.actionCategory,
        p_resource_type: activity.resourceType || null,
        p_resource_id: activity.resourceId || null,
        p_action_details: activity.actionDetails || {},
        p_status: activity.status || 'success',
        p_error_message: activity.errorMessage || null,
        p_duration_ms: activity.durationMs || null
      })

      if (error) {
        console.error('Failed to track admin activity:', error)
      }
    } catch (err) {
      console.error('Error tracking admin activity:', err)
    }
  }

  // Track performance metrics (batched for efficiency)
  trackPerformance(metric: PerformanceMetric): void {
    this.performanceQueue.push(metric)
  }

  // Flush performance metrics periodically
  private startPerformanceFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushPerformanceMetrics()
    }, 5000) // Flush every 5 seconds
  }

  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceQueue.length === 0) return

    const metrics = [...this.performanceQueue]
    this.performanceQueue = []

    try {
      const { error } = await this.supabase
        .schema('admin_panel')
        .from('performance_metrics')
        .insert(
          metrics.map(m => ({
            metric_type: m.metricType,
            metric_name: m.metricName,
            value: m.value,
            unit: m.unit,
            metadata: m.metadata || {}
          }))
        )

      if (error) {
        console.error('Failed to flush performance metrics:', error)
        // Re-add metrics to queue for retry
        this.performanceQueue.unshift(...metrics)
      }
    } catch (err) {
      console.error('Error flushing performance metrics:', err)
      this.performanceQueue.unshift(...metrics)
    }
  }

  // Track bulk operations
  async createBulkOperation(operation: BulkOperation): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .schema('admin_panel')
        .from('bulk_operations')
        .insert({
          operation_type: operation.operationType,
          total_items: operation.totalItems,
          status: operation.status || 'pending'
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to create bulk operation:', error)
        return null
      }

      return data?.id
    } catch (err) {
      console.error('Error creating bulk operation:', err)
      return null
    }
  }

  async updateBulkOperation(
    operationId: string,
    update: {
      processedItems?: number
      successfulItems?: number
      failedItems?: number
      status?: string
      errorSummary?: any[]
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('admin_panel')
        .from('bulk_operations')
        .update({
          processed_items: update.processedItems,
          successful_items: update.successfulItems,
          failed_items: update.failedItems,
          status: update.status,
          error_summary: update.errorSummary,
          ...(update.status === 'processing' ? { started_at: new Date().toISOString() } : {}),
          ...(update.status === 'completed' || update.status === 'failed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', operationId)

      if (error) {
        console.error('Failed to update bulk operation:', error)
      }
    } catch (err) {
      console.error('Error updating bulk operation:', err)
    }
  }

  // Create system alerts
  async createAlert(alert: SystemAlert): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('admin_panel')
        .from('system_alerts')
        .insert({
          alert_type: alert.alertType,
          alert_category: alert.alertCategory,
          title: alert.title,
          message: alert.message,
          details: alert.details || {},
          severity: alert.severity || 1
        })

      if (error) {
        console.error('Failed to create system alert:', error)
      }
    } catch (err) {
      console.error('Error creating system alert:', err)
    }
  }

  // Load user preferences
  async loadPreferences(userId: string): Promise<Record<string, any> | null> {
    try {
      const { data, error } = await this.supabase
        .schema('admin_panel')
        .from('user_preferences')
        .select('preferences')
        .eq('admin_user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Failed to load preferences:', error)
        return null
      }

      return data?.preferences || {}
    } catch (err) {
      console.error('Error loading preferences:', err)
      return null
    }
  }

  // Save user preferences
  async savePreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('admin_panel')
        .from('user_preferences')
        .upsert({
          admin_user_id: userId,
          preferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save preferences:', error)
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
    }
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushPerformanceMetrics() // Final flush
    }
  }
}

// Singleton instance
let adminTracker: AdminTracker | null = null

export function getAdminTracker(): AdminTracker {
  if (!adminTracker) {
    adminTracker = new AdminTracker()
  }
  return adminTracker
}

// Utility function for timing operations
export async function trackAdminOperation<T>(
  operation: () => Promise<T>,
  activity: Omit<AdminActivity, 'durationMs' | 'status' | 'errorMessage'>
): Promise<T> {
  const tracker = getAdminTracker()
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const durationMs = Math.round(performance.now() - startTime)
    
    await tracker.trackActivity({
      ...activity,
      status: 'success',
      durationMs
    })
    
    return result
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    
    await tracker.trackActivity({
      ...activity,
      status: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      durationMs
    })
    
    throw error
  }
}

// React hook for admin tracking
export function useAdminTracking() {
  const tracker = getAdminTracker()
  
  return {
    trackActivity: tracker.trackActivity.bind(tracker),
    trackPerformance: tracker.trackPerformance.bind(tracker),
    createBulkOperation: tracker.createBulkOperation.bind(tracker),
    updateBulkOperation: tracker.updateBulkOperation.bind(tracker),
    createAlert: tracker.createAlert.bind(tracker),
    trackOperation: trackAdminOperation
  }
} 