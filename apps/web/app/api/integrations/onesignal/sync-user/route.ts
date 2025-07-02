import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { oneSignal } from '@civicsense/shared/lib/integrations/onesignal'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// Validation schema for sync request
const SyncUserSchema = z.object({
  userId: z.string().min(1),
  oneSignalUserId: z.string().optional(),
  pushToken: z.string().optional(),
  userData: z.object({
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    preferences: z.object({
      notifications: z.boolean(),
      emailUpdates: z.boolean(),
      democraticAlerts: z.boolean(),
      localCivicReminders: z.boolean()
    }),
    civicProfile: z.object({
      engagementLevel: z.enum(['beginner', 'intermediate', 'advanced']),
      topicsOfInterest: z.array(z.string()),
      location: z.object({
        state: z.string(),
        district: z.string().optional(),
        city: z.string().optional()
      }).optional(),
      lastActiveQuiz: z.string().optional(),
      streakCount: z.number()
    })
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SyncUserSchema.parse(body)
    
    // Get user from Supabase to verify they exist
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, civic_engagement_level, quiz_streak_count')
      .eq('id', validatedData.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build comprehensive user data for OneSignal
    const civicUserData = {
      userId: validatedData.userId,
      email: user.email || validatedData.userData.email,
      pushToken: validatedData.pushToken,
      preferences: validatedData.userData.preferences,
      civicProfile: {
        ...validatedData.userData.civicProfile,
        engagementLevel: user.civic_engagement_level || validatedData.userData.civicProfile.engagementLevel,
        streakCount: user.quiz_streak_count || validatedData.userData.civicProfile.streakCount
      }
    }

    // Sync to OneSignal
    const syncResult = await oneSignal.createOrUpdateUser(civicUserData)
    
    if (!syncResult.success) {
      console.error('OneSignal sync failed:', syncResult.error)
      return NextResponse.json(
        { error: 'Failed to sync with OneSignal', details: syncResult.error },
        { status: 500 }
      )
    }

    // Store OneSignal ID in our database for future reference
    if (syncResult.oneSignalId) {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: validatedData.userId,
          onesignal_user_id: syncResult.oneSignalId,
          push_token: validatedData.pushToken,
          notification_preferences: validatedData.userData.preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }

    // Track sync for analytics
    await supabase
      .from('user_events')
      .insert({
        user_id: validatedData.userId,
        event_type: 'onesignal_sync',
        event_data: {
          oneSignalUserId: syncResult.oneSignalId,
          syncSuccess: true
        }
      })

    return NextResponse.json({
      success: true,
      oneSignalUserId: syncResult.oneSignalId,
      message: 'User synced to OneSignal successfully'
    })

  } catch (error) {
    console.error('OneSignal sync API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle user updates (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tags } = body

    if (!userId || !tags) {
      return NextResponse.json(
        { error: 'Missing userId or tags' },
        { status: 400 }
      )
    }

    // Update tags in OneSignal
    const success = await oneSignal.updateUserTags(userId, tags)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update OneSignal tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OneSignal tags updated successfully'
    })

  } catch (error) {
    console.error('OneSignal tag update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's OneSignal status (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onesignal_user_id, push_token, notification_preferences')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      success: true,
      oneSignalUserId: profile?.onesignal_user_id || null,
      pushToken: profile?.push_token || null,
      notificationPreferences: profile?.notification_preferences || null
    })

  } catch (error) {
    console.error('OneSignal status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 