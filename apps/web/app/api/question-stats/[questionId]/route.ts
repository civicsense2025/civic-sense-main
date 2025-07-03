import { NextRequest, NextResponse } from 'next/server'
import { questionStatsService } from '@/lib/question-stats'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params
    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessment_type') as 'onboarding' | 'civics_test' | null

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    let stats
    if (assessmentType) {
      stats = await questionStatsService.getAssessmentQuestionStats(questionId, assessmentType)
    } else {
      stats = await questionStatsService.getQuestionStats(questionId)
    }

    if (!stats) {
      return NextResponse.json(
        { error: 'Question stats not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching question stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 