import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Get Google Classroom courses for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies (set during OAuth)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('test_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        error: 'Not authenticated with Google Classroom',
        courses: []
      }, { status: 401 })
    }

    // Fetch courses from Google Classroom API
    const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!coursesResponse.ok) {
      const errorText = await coursesResponse.text()
      console.error('Google Classroom API Error Response:', {
        status: coursesResponse.status,
        statusText: coursesResponse.statusText,
        body: errorText
      })
      throw new Error(`Google Classroom API error: ${coursesResponse.status} - ${errorText}`)
    }

    const coursesData = await coursesResponse.json()
    const courses = coursesData.courses || []

    // Enhanced course data with student counts
    const enhancedCourses = await Promise.all(
      courses.map(async (course: any) => {
        let studentCount = 0
        
        try {
          // Get student count for each course
          const studentsResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/students`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json()
            studentCount = studentsData.students?.length || 0
          }
        } catch (error) {
          console.warn(`Failed to get student count for course ${course.id}:`, error)
        }

        return {
          id: course.id,
          name: course.name,
          section: course.section,
          descriptionHeading: course.descriptionHeading,
          enrollmentCode: course.enrollmentCode,
          courseState: course.courseState,
          teacherFolder: course.teacherFolder,
          studentCount,
          creationTime: course.creationTime
        }
      })
    )

    return NextResponse.json({
      success: true,
      courses: enhancedCourses,
      count: enhancedCourses.length
    })

  } catch (error) {
    console.error('Error fetching Google Classroom courses:', error)
    return NextResponse.json({
      error: 'Failed to fetch courses',
      details: error instanceof Error ? error.message : 'Unknown error',
      courses: []
    }, { status: 500 })
  }
} 