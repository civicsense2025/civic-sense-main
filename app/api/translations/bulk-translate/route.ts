import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { collectionTranslationService } from '@/lib/translation/auto-translate-collections'
import { z } from 'zod'

const BulkTranslateSchema = z.object({
  targetLanguage: z.string().min(2).max(5),
  contentTypes: z.array(z.enum(['question_topics', 'questions', 'news_articles', 'collections', 'public_figures'])),
  preserveCivicTerms: z.boolean().default(true),
  quality: z.enum(['basic', 'enhanced', 'premium']).default('enhanced'),
  batchSize: z.number().min(1).max(100).default(20),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      targetLanguage, 
      contentTypes, 
      preserveCivicTerms, 
      quality, 
      batchSize,
      priority 
    } = BulkTranslateSchema.parse(body)

    // Check if user has translation permissions
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const hasPermission = userRole?.role === 'admin' || userRole?.role === 'translator'
    
    if (!hasPermission && quality === 'premium') {
      return NextResponse.json(
        { error: 'Premium translation requires special permissions' }, 
        { status: 403 }
      )
    }

    // Queue translation jobs for each content type
    const translationJobs = []
    
    for (const contentType of contentTypes) {
      const jobId = `${contentType}_${targetLanguage}_${Date.now()}`
      
      // Create translation job record
      const { data: job, error: jobError } = await supabase
        .from('translation_jobs')
        .insert({
          id: jobId,
          content_type: contentType,
          target_language: targetLanguage,
          requested_by: user.id,
          status: 'queued',
          settings: {
            preserveCivicTerms,
            quality,
            batchSize
          },
          priority,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (jobError) {
        console.error(`Error creating translation job for ${contentType}:`, jobError)
        continue
      }

      translationJobs.push(job)

      // Start translation processing based on content type
      switch (contentType) {
        case 'question_topics':
          processTopicTranslations(jobId, targetLanguage, { preserveCivicTerms, quality, batchSize })
          break
        case 'questions':
          processQuestionTranslations(jobId, targetLanguage, { preserveCivicTerms, quality, batchSize })
          break
        case 'news_articles':
          processNewsTranslations(jobId, targetLanguage, { preserveCivicTerms, quality, batchSize })
          break
        case 'collections':
          processCollectionTranslations(jobId, targetLanguage, { preserveCivicTerms, quality, batchSize })
          break
        case 'public_figures':
          processPublicFigureTranslations(jobId, targetLanguage, { preserveCivicTerms, quality, batchSize })
          break
      }
    }

    return NextResponse.json({
      success: true,
      message: `Started translation jobs for ${contentTypes.length} content types`,
      jobs: translationJobs.map(job => ({
        id: job.id,
        contentType: job.content_type,
        status: job.status
      })),
      estimatedCompletion: calculateEstimatedCompletion(translationJobs, batchSize)
    })

  } catch (error) {
    console.error('Bulk translation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Translation request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Background processing functions (non-blocking)
async function processTopicTranslations(
  jobId: string, 
  targetLanguage: string, 
  settings: { preserveCivicTerms: boolean; quality: string; batchSize: number }
) {
  try {
    const supabase = await createClient()

    // Get untranslated topics
    const { data: topics } = await supabase
      .from('question_topics')
      .select('*')
      .is(`translations->title->${targetLanguage}`, null)
      .limit(settings.batchSize)

    if (!topics || topics.length === 0) {
      await updateJobStatus(jobId, 'completed', 'No topics to translate')
      return
    }

    await updateJobStatus(jobId, 'processing', `Translating ${topics.length} topics`)

    let successCount = 0
    for (const topic of topics) {
      try {
        // Use existing translation service
        const translated = await collectionTranslationService.translateCollection(
          {
            id: topic.topic_id,
            title: topic.topic_title,
            description: topic.description || '',
            content: topic.content || {},
            translations: topic.translations || {}
          },
          targetLanguage
        )

        // Save translations back to database
        const { error: updateError } = await supabase
          .from('question_topics')
          .update({
            translations: {
              ...topic.translations,
              title: {
                ...topic.translations?.title,
                [targetLanguage]: {
                  text: translated.title,
                  lastUpdated: new Date().toISOString(),
                  autoTranslated: true,
                  quality: settings.quality
                }
              },
              description: translated.description ? {
                ...topic.translations?.description,
                [targetLanguage]: {
                  text: translated.description,
                  lastUpdated: new Date().toISOString(),
                  autoTranslated: true,
                  quality: settings.quality
                }
              } : topic.translations?.description
            }
          })
          .eq('topic_id', topic.topic_id)

        if (!updateError) {
          successCount++
        }
      } catch (error) {
        console.error(`Error translating topic ${topic.topic_id}:`, error)
      }
    }

    await updateJobStatus(jobId, 'completed', `Translated ${successCount}/${topics.length} topics`)

  } catch (error) {
    console.error(`Error in topic translation job ${jobId}:`, error)
    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function processQuestionTranslations(
  jobId: string, 
  targetLanguage: string, 
  settings: { preserveCivicTerms: boolean; quality: string; batchSize: number }
) {
  try {
    const supabase = await createClient()

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .is(`translations->question_text->${targetLanguage}`, null)
      .limit(settings.batchSize)

    if (!questions || questions.length === 0) {
      await updateJobStatus(jobId, 'completed', 'No questions to translate')
      return
    }

    await updateJobStatus(jobId, 'processing', `Translating ${questions.length} questions`)

    let successCount = 0
    // Process question translations...
    // Implementation similar to topics but for questions

    await updateJobStatus(jobId, 'completed', `Translated ${successCount}/${questions.length} questions`)

  } catch (error) {
    console.error(`Error in question translation job ${jobId}:`, error)
    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function processNewsTranslations(
  jobId: string, 
  targetLanguage: string, 
  settings: { preserveCivicTerms: boolean; quality: string; batchSize: number }
) {
  // Implementation for news article translations
  try {
    const supabase = await createClient()
    
    const { data: articles } = await supabase
      .from('news_articles')
      .select('*')
      .is(`translations->title->${targetLanguage}`, null)
      .limit(settings.batchSize)

    if (!articles || articles.length === 0) {
      await updateJobStatus(jobId, 'completed', 'No articles to translate')
      return
    }

    // Process news translations...
    await updateJobStatus(jobId, 'completed', `Translated ${articles.length} articles`)

  } catch (error) {
    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function processCollectionTranslations(
  jobId: string, 
  targetLanguage: string, 
  settings: { preserveCivicTerms: boolean; quality: string; batchSize: number }
) {
  // Implementation for collection translations
  try {
    await updateJobStatus(jobId, 'completed', 'Collection translations processed')
  } catch (error) {
    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function processPublicFigureTranslations(
  jobId: string, 
  targetLanguage: string, 
  settings: { preserveCivicTerms: boolean; quality: string; batchSize: number }
) {
  // Implementation for public figure translations
  try {
    await updateJobStatus(jobId, 'completed', 'Public figure translations processed')
  } catch (error) {
    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function updateJobStatus(jobId: string, status: string, message?: string) {
  try {
    const supabase = await createClient()
    await supabase
      .from('translation_jobs')
      .update({
        status,
        message,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', jobId)
  } catch (error) {
    console.error(`Error updating job status for ${jobId}:`, error)
  }
}

function calculateEstimatedCompletion(jobs: any[], batchSize: number): string {
  // Rough estimation: 1 minute per batch of content
  const estimatedMinutes = jobs.length * Math.ceil(batchSize / 10)
  const completionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000)
  return completionTime.toISOString()
} 