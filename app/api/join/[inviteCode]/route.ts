import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/join/[inviteCode] - Get invite info
export async function GET(
  request: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const supabase = createClient()
    
    // Get invite link details
    const { data: inviteLink, error } = await supabase
      .from('pod_invite_links')
      .select(`
        id,
        pod_id,
        description,
        max_uses,
        current_uses,
        expires_at,
        allowed_roles,
        require_approval,
        age_restrictions,
        learning_pods!inner(
          pod_name,
          pod_type,
          family_name
        )
      `)
      .eq('invite_code', params.inviteCode)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !inviteLink) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite link',
        valid: false 
      }, { status: 404 })
    }

    // Check if invite link is still usable
    if (inviteLink.max_uses && inviteLink.current_uses >= inviteLink.max_uses) {
      return NextResponse.json({ 
        error: 'Invite link has reached maximum uses',
        valid: false 
      }, { status: 410 })
    }

    return NextResponse.json({
      valid: true,
      invite: {
        podId: inviteLink.pod_id,
        podName: (inviteLink.learning_pods as any).pod_name,
        podType: (inviteLink.learning_pods as any).pod_type,
        familyName: (inviteLink.learning_pods as any).family_name,
        description: inviteLink.description,
        requiresApproval: inviteLink.require_approval,
        ageRestrictions: inviteLink.age_restrictions,
        allowedRoles: inviteLink.allowed_roles,
        usageInfo: {
          currentUses: inviteLink.current_uses,
          maxUses: inviteLink.max_uses,
          expiresAt: inviteLink.expires_at
        }
      }
    })
  } catch (error) {
    console.error('Error in invite GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/join/[inviteCode] - Join pod via invite
export async function POST(
  request: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Must be logged in to join a pod' }, { status: 401 })
    }

    const body = await request.json()
    const { age, message } = body

    // Get invite link details
    const { data: inviteLink, error: inviteError } = await supabase
      .from('pod_invite_links')
      .select(`
        id,
        pod_id,
        max_uses,
        current_uses,
        expires_at,
        allowed_roles,
        require_approval,
        age_restrictions
      `)
      .eq('invite_code', params.inviteCode)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !inviteLink) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite link',
        success: false 
      }, { status: 404 })
    }

    // Check usage limits
    if (inviteLink.max_uses && inviteLink.current_uses >= inviteLink.max_uses) {
      return NextResponse.json({ 
        error: 'Invite link has reached maximum uses',
        success: false 
      }, { status: 410 })
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('pod_memberships')
      .select('id')
      .eq('pod_id', inviteLink.pod_id)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ 
        error: 'You are already a member of this pod',
        success: false 
      }, { status: 409 })
    }

    // Check age restrictions
    if (inviteLink.age_restrictions && age) {
      const restrictions = inviteLink.age_restrictions as any
      if (restrictions.min_age && age < restrictions.min_age) {
        return NextResponse.json({ 
          error: `Minimum age requirement: ${restrictions.min_age}`,
          success: false 
        }, { status: 403 })
      }
      if (restrictions.max_age && age > restrictions.max_age) {
        return NextResponse.json({ 
          error: `Maximum age limit: ${restrictions.max_age}`,
          success: false 
        }, { status: 403 })
      }
    }

    // Update invite link usage
    await supabase
      .from('pod_invite_links')
      .update({ current_uses: inviteLink.current_uses + 1 })
      .eq('id', inviteLink.id)

    // If approval required, create join request
    if (inviteLink.require_approval) {
      const { error: requestError } = await supabase
        .from('pod_join_requests')
        .insert({
          pod_id: inviteLink.pod_id,
          requester_id: user.id,
          invite_link_id: inviteLink.id,
          requested_role: inviteLink.allowed_roles[0],
          message,
          requester_age: age
        })

      if (requestError) {
        console.error('Error creating join request:', requestError)
        return NextResponse.json({ 
          error: 'Failed to submit join request',
          success: false 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        requiresApproval: true,
        message: 'Join request submitted successfully. You will be notified when it is reviewed.'
      })
    }

    // Add user directly to pod
    const { error: membershipError } = await supabase
      .from('pod_memberships')
      .insert({
        pod_id: inviteLink.pod_id,
        user_id: user.id,
        role: inviteLink.allowed_roles[0],
        membership_status: 'active',
        parental_consent: age ? age >= 13 : true
      })

    if (membershipError) {
      console.error('Error adding member to pod:', membershipError)
      return NextResponse.json({ 
        error: 'Failed to join pod',
        success: false 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      podId: inviteLink.pod_id,
      message: 'Successfully joined the pod!'
    })
  } catch (error) {
    console.error('Error in invite POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 