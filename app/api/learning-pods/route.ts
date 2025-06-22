import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { arePodsEnabled } from '@/lib/comprehensive-feature-flags'

// Helper function to get default emoji for pod type
function getPodDefaultEmoji(podType: string): string {
  const emojiMap: Record<string, string> = {
    'family': '👨‍👩‍👧‍👦',
    'friends': '👥',
    'classroom': '🏫',
    'study_group': '📚',
    'campaign': '🗳️',
    'organization': '🏢',
    'book_club': '📖',
    'debate_team': '⚖️',
    'custom': '✨'
  }
  return emojiMap[podType] || '👥'
}

// GET /api/learning-pods - Get user's learning pods
export async function GET(request: NextRequest) {
  // Feature flag check - disable pods API in production
  if (!arePodsEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Add debugging
    console.log('GET /api/learning-pods - Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookies: request.headers.get('cookie') ? 'present' : 'missing'
    })
    
    if (authError || !user) {
      console.error('Authentication failed in GET:', authError)
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'Auth session missing!'
      }, { status: 401 })
    }

    // Get user's pod memberships with pod details including new fields
    const { data: pods, error } = await supabase
      .from('pod_memberships')
      .select(`
        pod_id,
        role,
        membership_status,
        joined_at,
        learning_pods!inner(
          id,
          pod_name,
          pod_type,
          custom_type_label,
          family_name,
          join_code,
          content_filter_level,
          pod_emoji,
          pod_color,
          pod_slug,
          pod_motto,
          banner_image_url,
          created_at,
          personality_type,
          theme_id,
          accessibility_mode,
          unlocked_features,
          milestone_data,
          challenge_participation,
          partnership_status,
          pod_themes(
            name,
            display_name,
            emoji,
            primary_color,
            secondary_color,
            description
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')

    if (error) {
      console.error('Error fetching user pods:', error)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Get member counts for each pod
    const podIds = pods?.map((p: any) => p.learning_pods.id) || []
    const { data: memberCounts } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .in('pod_id', podIds)
      .eq('membership_status', 'active')

    const memberCountMap = memberCounts?.reduce((acc: Record<string, number>, m: { pod_id: string }) => {
      acc[m.pod_id] = (acc[m.pod_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Format response with enhanced pod features
    const formattedPods = pods?.map((pod: any) => ({
      id: pod.learning_pods.id,
      pod_name: pod.learning_pods.pod_name,
      pod_type: pod.learning_pods.pod_type,
      custom_type_label: pod.learning_pods.custom_type_label,
      family_name: pod.learning_pods.family_name,
      join_code: pod.learning_pods.join_code,
      member_count: memberCountMap[pod.learning_pods.id] || 0,
      user_role: pod.role,
      is_admin: ['admin', 'parent', 'organizer', 'teacher'].includes(pod.role),
      content_filter_level: pod.learning_pods.content_filter_level,
      pod_emoji: pod.learning_pods.pod_emoji,
      pod_color: pod.learning_pods.pod_color,
      pod_slug: pod.learning_pods.pod_slug,
      pod_motto: pod.learning_pods.pod_motto,
      banner_image_url: pod.learning_pods.banner_image_url,
      created_at: pod.learning_pods.created_at,
      // Enhanced features from migration
      personality_type: pod.learning_pods.personality_type,
      theme_id: pod.learning_pods.theme_id,
      theme: pod.learning_pods.pod_themes,
      accessibility_mode: pod.learning_pods.accessibility_mode,
      unlocked_features: pod.learning_pods.unlocked_features || [],
      milestone_data: pod.learning_pods.milestone_data || {},
      challenge_participation: pod.learning_pods.challenge_participation || [],
      partnership_status: pod.learning_pods.partnership_status
    })) || []

    return NextResponse.json({ pods: formattedPods })
  } catch (error) {
    console.error('Error in learning-pods GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/learning-pods - Create new learning pod
export async function POST(request: NextRequest) {
  // Feature flag check - disable pods API in production
  if (!arePodsEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Add debugging
    console.log('POST /api/learning-pods - Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      podName, 
      podType, 
      familyName, 
      description, 
      contentFilterLevel, 
      customTypeLabel,
      podEmoji,
      podColor,
      podSlug,
      podMotto,
      // Enhanced customization fields
      personalityType,
      themeId,
      accessibilityMode
    } = body

    if (!podName?.trim()) {
      return NextResponse.json({ error: 'Pod name is required' }, { status: 400 })
    }

    if (podType === 'custom' && !customTypeLabel?.trim()) {
      return NextResponse.json({ error: 'Custom type label is required for custom pod types' }, { status: 400 })
    }

    // Generate a unique join code
    const generateJoinCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    let joinCode = generateJoinCode()
    
    // Ensure join code is unique
    let codeExists = true
    while (codeExists) {
      const { data: existingPod } = await supabase
        .from('learning_pods')
        .select('id')
        .eq('join_code', joinCode)
        .single()
      
      if (!existingPod) {
        codeExists = false
      } else {
        joinCode = generateJoinCode()
      }
    }

    // Generate slug if not provided
    let finalSlug = null
    if (podSlug?.trim()) {
      finalSlug = podSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }

    // Create the learning pod with enhanced features
    const { data: pod, error: podError } = await supabase
      .from('learning_pods')
      .insert({
        pod_name: podName.trim(),
        pod_type: podType || 'family',
        family_name: familyName?.trim() || null,
        description: description?.trim() || null,
        content_filter_level: contentFilterLevel || 'moderate',
        custom_type_label: podType === 'custom' ? customTypeLabel?.trim() : null,
        pod_emoji: podEmoji || getPodDefaultEmoji(podType),
        pod_color: podColor || '#3b82f6',
        pod_slug: finalSlug,
        pod_motto: podMotto?.trim() || null,
        join_code: joinCode,
        created_by: user.id,
        is_public: false,
        // Enhanced customization fields
        personality_type: personalityType || null,
        theme_id: themeId || null,
        accessibility_mode: accessibilityMode || 'standard',
        unlocked_features: JSON.stringify([]),
        milestone_data: JSON.stringify({}),
        challenge_participation: JSON.stringify([]),
        partnership_status: 'open'
      })
      .select('id')
      .single()

    // If slug wasn't provided, generate one from the pod name
    if (!finalSlug && pod) {
      const { data: generatedSlug } = await supabase
        .rpc('generate_pod_slug', { 
          pod_name: podName.trim(), 
          pod_id: pod.id 
        })
      
      if (generatedSlug) {
        await supabase
          .from('learning_pods')
          .update({ pod_slug: generatedSlug })
          .eq('id', pod.id)
      }
    }

    if (podError) {
      console.error('Error creating pod:', podError)
      return NextResponse.json({ error: 'Failed to create pod' }, { status: 500 })
    }

    // Determine creator role based on pod type
    // For classroom pods, creator should be 'teacher', otherwise 'admin'
    const creatorRole = podType === 'classroom' ? 'teacher' : 'admin'
    
    console.log('Assigning creator role:', { podType, creatorRole, userId: user.id })

    // Add creator as member with appropriate role
    const { error: membershipError } = await supabase
      .from('pod_memberships')
      .insert({
        pod_id: pod.id,
        user_id: user.id,
        role: creatorRole,
        membership_status: 'active',
        joined_at: new Date().toISOString()
      })

    if (membershipError) {
      console.error('Error creating pod membership:', membershipError)
      // Try to clean up the pod if membership creation failed
      await supabase.from('learning_pods').delete().eq('id', pod.id)
      return NextResponse.json({ error: 'Failed to create pod membership' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      podId: pod.id,
      message: 'Learning pod created successfully!'
    })
  } catch (error) {
    console.error('Error in learning-pods POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 