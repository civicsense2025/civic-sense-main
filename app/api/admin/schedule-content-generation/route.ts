import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ScheduledGenerationConfig {
  id: string
  name: string
  isActive: boolean
  schedule: {
    interval: 'every12hours' | 'daily' | 'weekly'
    timeOfDay: string // HH:MM format
    timezone: string
  }
  generationSettings: {
    maxArticles: number
    daysSinceCreated: number
    questionsPerTopic: number
    questionTypeDistribution: {
      multipleChoice: number
      trueFalse: number
      shortAnswer: number
      fillInBlank: number
      matching: number
    }
    difficultyDistribution: {
      easy: number
      medium: number
      hard: number
    }
    daysAhead: number // How many days in the future to generate content
  }
  lastRun?: string
  nextRun?: string
  createdBy: string
  createdAt: string
}

// GET - List all scheduled generation configs
export async function GET(request: NextRequest) {
  try {
    const { data: schedules, error } = await supabase
      .from('scheduled_content_generation')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedules: schedules || []
    })

  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// POST - Create or update a scheduled generation config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config, userId } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    if (action === 'create') {
      // Create new scheduled generation
      const newConfig: Partial<ScheduledGenerationConfig> = {
        name: config.name || 'Daily Content Generation',
        isActive: config.isActive ?? true,
        schedule: config.schedule,
        generationSettings: config.generationSettings,
        createdBy: userId,
        createdAt: new Date().toISOString()
      }

      // Calculate next run time
      newConfig.nextRun = calculateNextRun(config.schedule)

      const { data, error } = await supabase
        .from('scheduled_content_generation')
        .insert(newConfig)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Scheduled generation created successfully',
        config: data
      })

    } else if (action === 'update') {
      // Update existing scheduled generation
      const { data, error } = await supabase
        .from('scheduled_content_generation')
        .update({
          name: config.name,
          isActive: config.isActive,
          schedule: config.schedule,
          generationSettings: config.generationSettings,
          nextRun: calculateNextRun(config.schedule)
        })
        .eq('id', config.id)
        .eq('createdBy', userId) // Ensure user can only update their own schedules
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Scheduled generation updated successfully',
        config: data
      })

    } else if (action === 'delete') {
      // Delete scheduled generation
      const { error } = await supabase
        .from('scheduled_content_generation')
        .delete()
        .eq('id', config.id)
        .eq('createdBy', userId)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Scheduled generation deleted successfully'
      })

    } else if (action === 'run_now') {
      // Trigger immediate generation with the saved settings
      const generationResult = await triggerGeneration(config.generationSettings, userId)
      
      // Update last run time
      await supabase
        .from('scheduled_content_generation')
        .update({ 
          lastRun: new Date().toISOString(),
          nextRun: calculateNextRun(config.schedule)
        })
        .eq('id', config.id)

      return NextResponse.json({
        success: true,
        message: 'Generation triggered successfully',
        result: generationResult
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing scheduled generation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Helper function to calculate next run time based on schedule
function calculateNextRun(schedule: ScheduledGenerationConfig['schedule']): string {
  const now = new Date()
  const [hours, minutes] = schedule.timeOfDay.split(':').map(n => parseInt(n))
  
  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)
  
  // If the time has passed today, schedule for tomorrow/next interval
  if (nextRun <= now) {
    switch (schedule.interval) {
      case 'every12hours':
        nextRun.setHours(nextRun.getHours() + 12)
        break
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        break
    }
  }
  
  return nextRun.toISOString()
}

// Helper function to trigger content generation
async function triggerGeneration(settings: ScheduledGenerationConfig['generationSettings'], userId: string) {
  try {
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + settings.daysAhead)

    const generationPayload = {
      maxArticles: settings.maxArticles,
      daysSinceCreated: settings.daysSinceCreated,
      questionsPerTopic: settings.questionsPerTopic,
      questionTypeDistribution: settings.questionTypeDistribution,
      difficultyDistribution: settings.difficultyDistribution,
      generateForFutureDates: true,
      startDate: targetDate.toISOString().split('T')[0],
      daysToGenerate: 1,
      forceGeneration: false,
      userId: userId
    }

    // Call the main generation endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/generate-content-from-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generationPayload)
    })

    const result = await response.json()
    return result

  } catch (error) {
    console.error('Error triggering generation:', error)
    throw error
  }
}

// CRON/Webhook endpoint for automated execution
export async function PUT(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (cron job, webhook, etc.)
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log('🕐 Running scheduled content generation check...')

    // Get all active schedules that are due to run
    const now = new Date().toISOString()
    const { data: dueSchedules, error } = await supabase
      .from('scheduled_content_generation')
      .select('*')
      .eq('isActive', true)
      .lte('nextRun', now)

    if (error) throw error

    if (!dueSchedules || dueSchedules.length === 0) {
      console.log('📭 No scheduled generations due')
      return NextResponse.json({
        success: true,
        message: 'No scheduled generations due',
        executed: 0
      })
    }

    console.log(`🎯 Found ${dueSchedules.length} scheduled generation(s) to execute`)

    const results = []
    for (const schedule of dueSchedules) {
      try {
        console.log(`🚀 Executing scheduled generation: ${schedule.name}`)
        
        const generationResult = await triggerGeneration(
          schedule.generationSettings, 
          schedule.createdBy
        )
        
        // Update last run and calculate next run
        await supabase
          .from('scheduled_content_generation')
          .update({
            lastRun: new Date().toISOString(),
            nextRun: calculateNextRun(schedule.schedule)
          })
          .eq('id', schedule.id)

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: true,
          result: generationResult
        })

        console.log(`✅ Completed scheduled generation: ${schedule.name}`)

      } catch (error) {
        console.error(`❌ Failed scheduled generation: ${schedule.name}`, error)
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Executed ${results.length} scheduled generation(s)`,
      executed: results.length,
      results
    })

  } catch (error) {
    console.error('Error in scheduled generation execution:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 