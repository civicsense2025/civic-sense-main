import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

interface TranslationContribution {
  contentType: 'question' | 'topic'
  contentId: string
  targetLanguage: string
  translations: Record<string, string>
  contributor: {
    name: string
    email?: string
  }
  metadata?: {
    usedDeepLSuggestions?: string[]
    hasDeepLSuggestions?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: TranslationContribution = await request.json()
    
    const { contentType, contentId, targetLanguage, translations, contributor, metadata } = body

    // Validate required fields
    if (!contentType || !contentId || !targetLanguage || !translations || !contributor.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store the contribution in a pending_translations table for review
    const { data, error } = await supabase
      .from('pending_translations' as any)
      .insert({
        content_type: contentType,
        content_id: contentId,
        target_language: targetLanguage,
        translations,
        contributor_name: contributor.name,
        contributor_email: contributor.email,
        metadata: {
          ...metadata,
          submission_date: new Date().toISOString(),
          user_agent: request.headers.get('user-agent') || null
        },
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving translation contribution:', error)
      return NextResponse.json(
        { error: 'Failed to save translation contribution' },
        { status: 500 }
      )
    }

    // Optionally, send notification to admins about new contribution
    // This could be done via email, webhook, etc.

    return NextResponse.json({
      success: true,
      contributionId: (data as any)?.id,
      message: 'Translation contribution submitted successfully'
    })

  } catch (error) {
    console.error('Translation contribution API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const contentType = searchParams.get('contentType')
    const targetLanguage = searchParams.get('targetLanguage')

    const supabase = await createClient()

    // Check if user is admin (you may want to implement proper admin check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('pending_translations' as any)
      .select('*')
      .eq('status', status)
      .order('submitted_at', { ascending: false })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    if (targetLanguage) {
      query = query.eq('target_language', targetLanguage)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching translation contributions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch translation contributions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contributions: data
    })

  } catch (error) {
    console.error('Translation contributions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { contributionId, action, feedback } = body

    // Check if user is admin (implement proper admin check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'approve') {
      // Get the contribution
      const { data: contribution, error: fetchError } = await supabase
        .from('pending_translations' as any)
        .select('*')
        .eq('id', contributionId)
        .single()

      if (fetchError || !contribution) {
        return NextResponse.json(
          { error: 'Contribution not found' },
          { status: 404 }
        )
      }

      const contrib = contribution as any
      // Apply the translation to the actual content
      const tableName = contrib.content_type === 'question' ? 'questions' : 'question_topics'
      
      // Get current translations
      const { data: currentContent, error: currentError } = await supabase
        .from(tableName)
        .select('translations')
        .eq(contrib.content_type === 'question' ? 'id' : 'id', contrib.content_id)
        .single()

      if (currentError) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        )
      }

      // Merge new translations with existing ones
      const currentTranslations = (currentContent as any)?.translations || {}
      const updatedTranslations = { ...currentTranslations }

      // Add new translations for this language
      Object.entries(contrib.translations).forEach(([field, text]) => {
        if (!updatedTranslations[field]) {
          updatedTranslations[field] = {}
        }
        updatedTranslations[field][contrib.target_language] = {
          text: text as string,
          lastUpdated: new Date().toISOString(),
          autoTranslated: false,
          contributor: contrib.contributor_name
        }
      })

      // Update the content with new translations
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ translations: updatedTranslations })
        .eq(contrib.content_type === 'question' ? 'id' : 'id', contrib.content_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to apply translation' },
          { status: 500 }
        )
      }

      // Mark contribution as approved
      await supabase
        .from('pending_translations' as any)
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewer_feedback: feedback
        })
        .eq('id', contributionId)

    } else if (action === 'reject') {
      // Mark contribution as rejected
      await supabase
        .from('pending_translations' as any)
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewer_feedback: feedback
        })
        .eq('id', contributionId)
    }

    return NextResponse.json({
      success: true,
      message: `Translation contribution ${action}ed successfully`
    })

  } catch (error) {
    console.error('Translation contribution review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 