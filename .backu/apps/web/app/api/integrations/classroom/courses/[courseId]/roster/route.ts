import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Get student roster for a specific Google Classroom course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('test_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        error: 'Not authenticated with Google Classroom',
        students: []
      }, { status: 401 })
    }

    // Fetch students from Google Classroom API
    const studentsResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!studentsResponse.ok) {
      if (studentsResponse.status === 404) {
        return NextResponse.json({
          error: 'Course not found',
          students: []
        }, { status: 404 })
      }
      throw new Error(`Google Classroom API error: ${studentsResponse.status}`)
    }

    const studentsData = await studentsResponse.json()
    const students = studentsData.students || []

    // Enhanced student data with profiles
    const enhancedStudents = await Promise.all(
      students.map(async (student: any) => {
        let profile = student.profile
        
        try {
          // Get detailed profile if basic profile is missing info
          if (!profile?.name?.fullName || !profile?.emailAddress) {
            const profileResponse = await fetch(`https://classroom.googleapis.com/v1/userProfiles/${student.userId}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              profile = profileData
            }
          }
        } catch (error) {
          console.warn(`Failed to get detailed profile for student ${student.userId}:`, error)
        }

        return {
          id: student.userId,
          courseId: student.courseId,
          profile: {
            id: profile?.id || student.userId,
            name: {
              fullName: profile?.name?.fullName || 'Unknown Student',
              givenName: profile?.name?.givenName || '',
              familyName: profile?.name?.familyName || ''
            },
            emailAddress: profile?.emailAddress || '',
            photoUrl: profile?.photoUrl
          },
          enrollmentStatus: 'ACTIVE' // Google Classroom only returns active students
        }
      })
    )

    return NextResponse.json({
      success: true,
      students: enhancedStudents,
      count: enhancedStudents.length,
      courseId
    })

  } catch (error) {
    console.error('Error fetching course roster:', error)
    return NextResponse.json({
      error: 'Failed to fetch course roster',
      details: error instanceof Error ? error.message : 'Unknown error',
      students: []
    }, { status: 500 })
  }
} 