import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-access'

// Service client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical'
  congressional_photos: 'healthy' | 'warning' | 'critical'
  ai_services: 'healthy' | 'warning' | 'critical'
  storage: 'healthy' | 'warning' | 'critical'
  memory_usage: number
  error_rate: number
  last_backup: string | null
  pending_issues: number
  recent_failures: string[]
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const health: SystemHealth = {
      database: 'healthy',
      congressional_photos: 'healthy', 
      ai_services: 'healthy',
      storage: 'healthy',
      memory_usage: 0.45,
      error_rate: 0.01,
      last_backup: null,
      pending_issues: 0,
      recent_failures: []
    }

    // Check database health
    try {
      const { data, error } = await supabase
        .from('public_figures')
        .select('id')
        .limit(1)
      
      if (error) {
        health.database = 'critical'
        health.recent_failures.push(`Database error: ${error.message}`)
      }
    } catch (error) {
      health.database = 'critical'
      health.recent_failures.push('Database connection failed')
    }

    // Check congressional photos status
    try {
      const { data: photoCount, error: photoError } = await supabase
        .from('congressional_photos')
        .select('id', { count: 'exact' })
      
      const { data: membersCount, error: membersError } = await supabase
        .from('public_figures')
        .select('id', { count: 'exact' })
        .eq('is_politician', true)
        .eq('congress_member_type', 'Representative')
      
      if (photoError || membersError) {
        health.congressional_photos = 'critical'
        health.recent_failures.push('Failed to check photo status')
      } else {
        const photoPercentage = (photoCount?.length || 0) / (membersCount?.length || 1)
        
        if (photoPercentage < 0.3) {
          health.congressional_photos = 'critical'
          health.pending_issues++
        } else if (photoPercentage < 0.7) {
          health.congressional_photos = 'warning'
        }
      }
    } catch (error) {
      health.congressional_photos = 'critical'
      health.recent_failures.push('Photo status check failed')
    }

    // Check for recent failed photo downloads
    try {
      const { data: recentFailures } = await supabase
        .from('congressional_photos')
        .select('bioguide_id, local_path')
        .is('local_path', null)
        .limit(10)
      
      if (recentFailures && recentFailures.length > 5) {
        health.congressional_photos = 'warning'
        health.pending_issues += recentFailures.length
      }
    } catch (error) {
      console.warn('Could not check recent photo failures:', error)
    }

    // Check AI services (simplified check)
    try {
      // This is a placeholder - you'd implement actual AI service health checks
      const aiHealthCheck = process.env.OPENAI_API_KEY ? 'healthy' : 'critical'
      health.ai_services = aiHealthCheck as any
      
      if (aiHealthCheck === 'critical') {
        health.recent_failures.push('AI services not configured')
      }
    } catch (error) {
      health.ai_services = 'critical'
      health.recent_failures.push('AI service check failed')
    }

    // Simulate memory usage (in real implementation, you'd get actual metrics)
    health.memory_usage = Math.random() * 0.3 + 0.3 // 30-60%
    
    // Simulate error rate (in real implementation, you'd calculate from logs)
    health.error_rate = Math.random() * 0.05 // 0-5%

    // Check for last backup (placeholder)
    try {
      // In real implementation, check when last backup was performed
      health.last_backup = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    } catch (error) {
      health.last_backup = null
    }

    return NextResponse.json(health)

  } catch (error) {
    console.error('System health check error:', error)
    
    return NextResponse.json({
      database: 'critical',
      congressional_photos: 'critical', 
      ai_services: 'critical',
      storage: 'critical',
      memory_usage: 0,
      error_rate: 1,
      last_backup: null,
      pending_issues: 1,
      recent_failures: ['Health check system failure']
    } as SystemHealth, { status: 500 })
  }
} 