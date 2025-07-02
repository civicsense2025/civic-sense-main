import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Test endpoint to verify Google Classroom API connectivity
export async function GET(request: NextRequest) {
  try {
    // Get test access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('test_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No access token found. Please authenticate first.'
      }, { status: 401 })
    }

    // Test API connectivity by fetching courses
    const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!coursesResponse.ok) {
      const errorText = await coursesResponse.text()
      console.error('Classroom API error:', errorText)
      
      let errorMessage = 'Failed to fetch courses from Google Classroom'
      if (coursesResponse.status === 401) {
        errorMessage = 'Invalid or expired access token'
      } else if (coursesResponse.status === 403) {
        errorMessage = 'Insufficient permissions. Check OAuth scopes in Google Cloud Console.'
      } else if (coursesResponse.status === 404) {
        errorMessage = 'Google Classroom API endpoint not found'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: errorText
      }, { status: coursesResponse.status })
    }

    const coursesData = await coursesResponse.json()
    const courses = coursesData.courses || []

    // Test user info API as well
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    let userInfo = null
    if (userResponse.ok) {
      userInfo = await userResponse.json()
    }

    // Test a specific course's details if we have courses
    let courseDetails = null
    if (courses.length > 0) {
      const firstCourse = courses[0]
      const courseDetailResponse = await fetch(
        `https://classroom.googleapis.com/v1/courses/${firstCourse.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (courseDetailResponse.ok) {
        courseDetails = await courseDetailResponse.json()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Google Classroom API connection successful!',
      data: {
        coursesCount: courses.length,
                 courses: courses.map((course: any) => ({
          id: course.id,
          name: course.name,
          section: course.section,
          descriptionHeading: course.descriptionHeading,
          enrollmentCode: course.enrollmentCode,
          courseState: course.courseState,
          ownerId: course.ownerId,
          creationTime: course.creationTime
        })),
        userInfo: userInfo ? {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        } : null,
        testResults: {
          coursesApiWorking: true,
          userInfoApiWorking: userResponse.ok,
          courseDetailsApiWorking: courseDetails !== null,
          totalAPIsTest: 2 + (courseDetails ? 1 : 0)
        }
      }
    })
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during API test'
    }, { status: 500 })
  }
} 