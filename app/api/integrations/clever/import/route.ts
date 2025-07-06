import { NextRequest, NextResponse } from 'next/server'
import { CleverIntegration } from '@/lib/integrations/clever'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/clever/import
// Body: { access_token: string, school_id?: string }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { access_token: accessToken, school_id: schoolId } = body

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing Clever OAuth access token' }, { status: 400 })
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    // Get user's accessible sections
    const sections = await clever.listSections()

    // For MVP we import all active sections user teaches
    const imported: string[] = []
    const errors: string[] = []

    for (const section of sections) {
      try {
        // Use provided school_id or extract from section data
        const targetSchoolId = schoolId || section.data.school
        
        const courseId = await clever.importSection(section.data.id, targetSchoolId)
        imported.push(courseId)
      } catch (error) {
        console.error(`Failed to import section ${section.data.id}:`, error)
        errors.push(`Section ${section.data.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported,
      totalSections: sections.length,
      successfulImports: imported.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Clever import failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    }, { status: 500 })
  }
}

// GET /api/integrations/clever/import - List available sections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('access_token')

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 })
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    // Get user's accessible sections and schools
    const [sections, schools] = await Promise.all([
      clever.listSections(),
      clever.listSchools()
    ])

    return NextResponse.json({
      success: true,
      sections: sections.map(section => ({
        id: section.data.id,
        name: section.data.name,
        description: section.data.description,
        grade: section.data.grade,
        subject: section.data.subject,
        school: section.data.school,
        teacher: section.data.teacher
      })),
      schools: schools.map(school => ({
        id: school.data.id,
        name: school.data.name,
        district: school.data.district
      }))
    })
  } catch (error) {
    console.error('Failed to list Clever sections:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to list sections' 
    }, { status: 500 })
  }
} 