import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/learning-pods/[podId]/invite - Get invite links for a pod
export async function GET(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view invite links for this pod
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', params.podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get invite links for this pod
    const { data: inviteLinks, error } = await supabase
      .from('pod_invite_links')
      .select(`
        id,
        invite_code,
        invite_url,
        description,
        max_uses,
        current_uses,
        expires_at,
        allowed_roles,
        require_approval,
        age_restrictions,
        is_active,
        created_at
      `)
      .eq('pod_id', params.podId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invite links:', error)
      return NextResponse.json({ error: 'Failed to fetch invite links' }, { status: 500 })
    }

    return NextResponse.json({ inviteLinks })
  } catch (error) {
    console.error('Error in invite links GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/learning-pods/[podId]/invite - Create new invite link
export async function POST(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      description,
      maxUses,
      expiresInHours = 720, // 30 days default
      allowedRoles = ['member'],
      requireApproval = false,
      ageRestrictions = {}
    } = body

    // Check if user has permission to create invite links
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', params.podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate unique invite code
    const generateInviteCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    let inviteCode = generateInviteCode()
    let codeExists = true
    
    // Ensure unique code
    while (codeExists) {
      const { data } = await supabase
        .from('pod_invite_links')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()
      
      if (!data) {
        codeExists = false
      } else {
        inviteCode = generateInviteCode()
      }
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/join/${inviteCode}`
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

    // Create invite link
    const { data: inviteLink, error } = await supabase
      .from('pod_invite_links')
      .insert({
        pod_id: params.podId,
        created_by: user.id,
        invite_code: inviteCode,
        invite_url: inviteUrl,
        description,
        max_uses: maxUses,
        expires_at: expiresAt,
        allowed_roles: allowedRoles,
        require_approval: requireApproval,
        age_restrictions: ageRestrictions
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invite link:', error)
      return NextResponse.json({ error: 'Failed to create invite link' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      inviteLink: {
        ...inviteLink,
        shareUrl: inviteUrl
      }
    })
  } catch (error) {
    console.error('Error in invite links POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 