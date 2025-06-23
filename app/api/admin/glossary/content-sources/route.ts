import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sources = []

    try {
      // Get topics for content extraction
      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title, description, why_this_matters')
        .eq('is_active', true)
        .limit(50)

      if (topics && !topicsError) {
        const topicSources = topics.map(topic => ({
          id: `topic_${topic.topic_id}`,
          type: 'topics',
          title: topic.topic_title || 'Untitled Topic',
          content_preview: `${topic.description || ''} ${topic.why_this_matters || ''}`.trim(),
          content: `
            Topic: ${topic.topic_title}
            Description: ${topic.description || 'No description'}
            Why This Matters: ${topic.why_this_matters || 'Not specified'}
          `.trim(),
          selected: false
        }))
        sources.push(...topicSources)
      }
    } catch (error) {
      console.warn('Could not fetch topics:', error)
    }

    try {
      // Get sample questions for content extraction
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question, explanation, topic_id')
        .eq('is_active', true)
        .limit(30)

      if (questions && !questionsError) {
        const questionSources = questions.map(question => ({
          id: `question_${question.id}`,
          type: 'questions',
          title: question.question?.substring(0, 80) + '...' || 'Untitled Question',
          content_preview: question.explanation?.substring(0, 200) || 'No explanation',
          content: `
            Question: ${question.question || 'No question text'}
            Explanation: ${question.explanation || 'No explanation'}
            Topic ID: ${question.topic_id || 'Unknown'}
          `.trim(),
          selected: false
        }))
        sources.push(...questionSources)
      }
    } catch (error) {
      console.warn('Could not fetch questions:', error)
    }

    try {
      // Get public figures for content extraction
      const { data: figures, error: figuresError } = await supabase
        .from('public_figures')
        .select('id, name, description, bio, key_positions')
        .eq('is_active', true)
        .limit(20)

      if (figures && !figuresError) {
        const figureSources = figures.map(figure => ({
          id: `figure_${figure.id}`,
          type: 'public_figures',
          title: figure.name || 'Unnamed Figure',
          content_preview: figure.description?.substring(0, 200) || 'No description',
          content: `
            Name: ${figure.name || 'Unknown'}
            Description: ${figure.description || 'No description'}
            Bio: ${figure.bio || 'No bio'}
            Key Positions: ${Array.isArray(figure.key_positions) ? figure.key_positions.join(', ') : 'None'}
          `.trim(),
          selected: false
        }))
        sources.push(...figureSources)
      }
    } catch (error) {
      console.warn('Could not fetch public figures:', error)
    }

    try {
      // Get surveys for content extraction
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('id, title, description')
        .eq('is_active', true)
        .limit(10)

      if (surveys && !surveysError) {
        const surveySources = surveys.map(survey => ({
          id: `survey_${survey.id}`,
          type: 'surveys',
          title: survey.title || 'Untitled Survey',
          content_preview: survey.description?.substring(0, 200) || 'No description',
          content: `
            Survey: ${survey.title || 'Untitled Survey'}
            Description: ${survey.description || 'No description'}
          `.trim(),
          selected: false
        }))
        sources.push(...surveySources)
      }
    } catch (error) {
      console.warn('Could not fetch surveys:', error)
    }

    // Sort sources by type and title
    sources.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
      return a.title.localeCompare(b.title)
    })

    return NextResponse.json({
      success: true,
      sources,
      total: sources.length,
      by_type: {
        topics: sources.filter(s => s.type === 'topics').length,
        questions: sources.filter(s => s.type === 'questions').length,
        public_figures: sources.filter(s => s.type === 'public_figures').length,
        surveys: sources.filter(s => s.type === 'surveys').length
      }
    })

  } catch (error) {
    console.error('Error fetching content sources:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch content sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 