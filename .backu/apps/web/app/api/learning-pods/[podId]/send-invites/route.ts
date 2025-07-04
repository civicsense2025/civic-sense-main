import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface InviteStudent {
  email: string
  name: string
}

// Send invitation emails to students for learning pod
export async function POST(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {
    const { podId } = await params
    const body = await request.json()
    const { 
      courseId, 
      courseName, 
      students, 
      requireParentConsent = false 
    } = body

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({
        error: 'Invalid student data'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Get pod details for invitation
    const { data: pod, error: podError } = await supabase
      .from('learning_pods')
      .select('pod_name, join_code, family_name')
      .eq('id', podId)
      .single()

    if (podError || !pod) {
      return NextResponse.json({
        error: 'Pod not found or access denied'
      }, { status: 404 })
    }

    const inviteResults = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://civicsense.us'
    const podInviteUrl = `${baseUrl}/learning-pods?join=${pod.join_code}`

    // Send email invitations
    for (const student of students as InviteStudent[]) {
      try {
        // Send real email using MailerSend service
        const { sendLearningPodInvite } = await import('@/lib/email/mailerlite-service')
        const emailResult = await sendLearningPodInvite(
          student.email,
          {
            studentName: student.name,
            podName: pod.pod_name,
            teacherName: pod.family_name || 'Your teacher',
            joinUrl: podInviteUrl,
            courseName,
            requireParentConsent
          }
        )
        
        const emailSent = emailResult.success

        if (emailSent) {
          inviteResults.sent++
          
          // Log the invite with analytics tracking
          await supabase
            .from('pod_invites')
            .insert({
              pod_id: podId,
              email: student.email,
              invited_by: 'system', // Could be current user ID
              invite_type: 'classroom_import',
              classroom_course_id: courseId,
              sent_at: new Date().toISOString(),
              requires_parent_consent: requireParentConsent,
              email_message_id: emailResult.messageId
            })
          
          // Track successful email sending for analytics
          console.log(`📊 Learning pod invite sent: ${student.email}`, {
            pod_id: podId,
            course_id: courseId,
            requires_parent_consent: requireParentConsent,
            message_id: emailResult.messageId
          })
        } else {
          inviteResults.failed++
          inviteResults.errors.push(`Failed to send email to ${student.email}: ${emailResult.error}`)
          
          // Track failed email for analytics
          console.log(`📊 Learning pod invite failed: ${student.email}`, {
            pod_id: podId,
            course_id: courseId,
            error: emailResult.error
          })
        }

      } catch (error) {
        console.error(`Error sending invite to ${student.email}:`, error)
        inviteResults.failed++
        inviteResults.errors.push(`Error sending to ${student.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      results: inviteResults,
      message: `Sent ${inviteResults.sent} invitations successfully. ${inviteResults.failed} failed.`
    })

  } catch (error) {
    console.error('Error sending invites:', error)
    return NextResponse.json({
      error: 'Failed to send invites',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 