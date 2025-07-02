import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

interface RosterStudent {
  googleId: string
  email: string
  fullName: string
  givenName: string
  familyName: string
  photoUrl?: string
}

// Import Google Classroom roster into learning pod
export async function POST(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {
    const { podId } = await params
    const body = await request.json()
    const { courseId, students, requireParentConsent = false } = body

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({
        error: 'Invalid student data'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify pod exists and user has permission
    const { data: pod, error: podError } = await supabase
      .from('learning_pods')
      .select('*')
      .eq('id', podId)
      .single()

    if (podError || !pod) {
      return NextResponse.json({
        error: 'Pod not found or access denied'
      }, { status: 404 })
    }

    const importResults = {
      success: 0,
      existing: 0,
      invitesPending: 0,
      errors: [] as string[]
    }

    // Process each student
    for (const student of students as RosterStudent[]) {
      try {
        // Check if user already exists by email
        let { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', student.email)
          .single()

        let userId: string

        if (existingUser) {
          userId = existingUser.id
          importResults.existing++
        } else {
          // Create placeholder user account for invitation
          const { data: newUser, error: userError } = await supabase
            .from('pending_users')
            .insert({
              email: student.email,
              full_name: student.fullName,
              given_name: student.givenName,
              family_name: student.familyName,
              google_id: student.googleId,
              photo_url: student.photoUrl,
              invite_source: 'google_classroom',
              invite_source_id: courseId,
              requires_parent_consent: requireParentConsent,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (userError) {
            console.error('Error creating pending user:', userError)
            importResults.errors.push(`Failed to create account for ${student.email}`)
            continue
          }

          userId = newUser.id
          importResults.invitesPending++
        }

        // Add to pod membership (or update if exists)
        // Students imported from Google Classroom get 'student' role
        const { error: membershipError } = await supabase
          .from('pod_memberships')
          .upsert({
            pod_id: podId,
            user_id: userId,
            role: 'student',
            membership_status: existingUser ? 'active' : 'pending',
            joined_at: new Date().toISOString(),
            // Additional metadata for classroom integration
            joined_via: 'google_classroom',
            classroom_course_id: courseId,
            google_classroom_id: student.googleId
          })

        if (membershipError) {
          console.error('Error creating pod membership:', membershipError)
          importResults.errors.push(`Failed to add ${student.email} to pod`)
          continue
        }

        importResults.success++

      } catch (studentError) {
        console.error(`Error processing student ${student.email}:`, studentError)
        importResults.errors.push(`Error processing ${student.email}`)
      }
    }

    // Update pod with classroom integration info
    await supabase
      .from('learning_pods')
      .update({
        classroom_course_id: courseId,
        classroom_integration_enabled: true,
        roster_last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', podId)

    return NextResponse.json({
      success: true,
      results: importResults,
      message: `Successfully processed ${importResults.success} students. ${importResults.existing} existing users, ${importResults.invitesPending} pending invites.`
    })

  } catch (error) {
    console.error('Error importing roster:', error)
    return NextResponse.json({
      error: 'Failed to import roster',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 