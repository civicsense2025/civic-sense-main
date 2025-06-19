import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface InstitutionalPod {
  pod_id: string
  pod_name: string
  pod_type: string
  institutional_type: string
  level: string
  parent_name: string
  member_count: number
  user_role: string
}

// GET /api/integrations/classroom/institutional-pods - Get hierarchical pod structure
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') // 'district', 'school', 'course', 'all'
    const districtId = searchParams.get('districtId')
    const schoolId = searchParams.get('schoolId')

    // Get user's institutional pods with hierarchy
    const { data: userPods, error: podsError } = await supabase
      .rpc('school.get_user_institutional_pods')

    if (podsError) {
      console.error('Error fetching user pods:', podsError)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Get detailed pod hierarchy view
    let hierarchyQuery = supabase
      .from('school.pod_hierarchy')
      .select('*')

    // Apply filters based on user's access
    if (districtId) {
      hierarchyQuery = hierarchyQuery.eq('district_id', districtId)
    }
    if (schoolId) {
      hierarchyQuery = hierarchyQuery.eq('school_id', schoolId)
    }

    const { data: podHierarchy, error: hierarchyError } = await hierarchyQuery

    if (hierarchyError) {
      console.error('Error fetching pod hierarchy:', hierarchyError)
      return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
    }

    // Filter based on level if specified
    let filteredUserPods: InstitutionalPod[] = (userPods as InstitutionalPod[]) || []
    if (level && level !== 'all') {
      const levelMap: Record<string, string> = {
        'district': 'District',
        'school': 'School', 
        'course': 'Course'
      }
      filteredUserPods = filteredUserPods.filter((pod: InstitutionalPod) => pod.level === levelMap[level])
    }

    // Group pods by hierarchy level
    const groupedPods = {
      district: filteredUserPods.filter((pod: InstitutionalPod) => pod.level === 'District'),
      school: filteredUserPods.filter((pod: InstitutionalPod) => pod.level === 'School'),
      course: filteredUserPods.filter((pod: InstitutionalPod) => pod.level === 'Course')
    }

    // Calculate aggregate statistics
    const stats = {
      totalPods: filteredUserPods.length,
      totalMembers: filteredUserPods.reduce((sum: number, pod: InstitutionalPod) => sum + (pod.member_count || 0), 0),
      byLevel: {
        district: groupedPods.district.length,
        school: groupedPods.school.length,
        course: groupedPods.course.length
      },
      byRole: filteredUserPods.reduce((acc: Record<string, number>, pod: InstitutionalPod) => {
        acc[pod.user_role] = (acc[pod.user_role] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Get recent activity across institutional pods
    const podIds = filteredUserPods.map((pod: InstitutionalPod) => pod.pod_id)
    const { data: recentActivity } = await supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        created_at,
        time_spent_seconds,
        final_score,
        learning_pods!inner(pod_name, institutional_type)
      `)
      .in('pod_id', podIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      data: {
        userPods: filteredUserPods,
        hierarchy: podHierarchy,
        groupedPods,
        stats,
        recentActivity: recentActivity || []
      }
    })
  } catch (error) {
    console.error('Error in institutional pods GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/integrations/classroom/institutional-pods - Create institutional pod
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      type, // 'district_program', 'school_program', 'course_pod'
      name,
      districtId,
      schoolId,
      courseId,
      courseName
    } = body

    let podId: string | null = null

    try {
      switch (type) {
        case 'district_program':
          if (!districtId || !name) {
            return NextResponse.json({ error: 'District ID and name required' }, { status: 400 })
          }
          
          const { data: districtPodId } = await supabase
            .rpc('school.create_district_program', {
              p_district_id: districtId,
              p_program_name: name,
              p_created_by: user.id
            })
          
          podId = districtPodId
          break

        case 'school_program':
          if (!schoolId || !name) {
            return NextResponse.json({ error: 'School ID and name required' }, { status: 400 })
          }
          
          const { data: schoolPodId } = await supabase
            .rpc('school.create_school_program', {
              p_school_id: schoolId,
              p_program_name: name,
              p_created_by: user.id
            })
          
          podId = schoolPodId
          break

        case 'course_pod':
          if (!courseId || !courseName || !schoolId) {
            return NextResponse.json({ error: 'Course ID, name, and school ID required' }, { status: 400 })
          }
          
          const { data: coursePodId } = await supabase
            .rpc('school.create_course_pod', {
              p_course_id: courseId,
              p_course_name: courseName,
              p_school_id: schoolId,
              p_teacher_id: user.id
            })
          
          podId = coursePodId
          break

        default:
          return NextResponse.json({ error: 'Invalid pod type' }, { status: 400 })
      }

      if (!podId) {
        return NextResponse.json({ error: 'Failed to create pod' }, { status: 500 })
      }

      // Fetch the created pod details
      const { data: createdPod } = await supabase
        .from('learning_pods')
        .select(`
          id,
          pod_name,
          pod_type,
          institutional_type,
          school_id,
          school_district_id,
          created_at
        `)
        .eq('id', podId)
        .single()

      return NextResponse.json({
        success: true,
        message: `${type.replace('_', ' ')} created successfully`,
        pod: createdPod
      })

    } catch (rpcError) {
      console.error('Error calling RPC function:', rpcError)
      return NextResponse.json({ 
        error: 'Failed to create institutional pod',
        details: rpcError instanceof Error ? rpcError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in institutional pods POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 