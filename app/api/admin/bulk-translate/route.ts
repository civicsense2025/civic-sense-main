import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { useTranslation } from '@/hooks/useTranslation'

interface BulkTranslationRequest {
  contentType: string
  targetLanguages: string[]
  batchSize: number
  options: {
    overwriteExisting: boolean
    priority: 'low' | 'normal' | 'high'
    skipTranslated?: boolean
    queueForReview?: boolean
  }
}

interface TranslationJob {
  id: string
  contentType: string
  contentId: string
  targetLanguage: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  startedAt: string
  estimatedCompletion?: string
  error?: string
}

const TRANSLATABLE_FIELDS = {
  questions: ['question', 'explanation', 'hint', 'option_a', 'option_b', 'option_c', 'option_d'],
  question_topics: ['topic_title', 'description', 'why_this_matters'],
  surveys: ['title', 'description'],
  survey_questions: ['question', 'help_text'],
  assessment_questions: ['question', 'explanation', 'hint'],
  public_figures: ['name', 'description', 'bio', 'legacy'],
  glossary: ['term', 'definition', 'example']
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin rights
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add proper admin role check
    // const { data: userRole } = await supabase
    //   .from('user_roles')
    //   .select('role')
    //   .eq('user_id', user.id)
    //   .single()
    // 
    // if (userRole?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const body: BulkTranslationRequest = await request.json()
    const { contentType, targetLanguages, batchSize, options } = body

    // Validate request
    if (!contentType || !targetLanguages?.length || !batchSize) {
      return NextResponse.json({ 
        error: 'Missing required fields: contentType, targetLanguages, batchSize' 
      }, { status: 400 })
    }

    if (!TRANSLATABLE_FIELDS[contentType as keyof typeof TRANSLATABLE_FIELDS]) {
      return NextResponse.json({ 
        error: `Unsupported content type: ${contentType}` 
      }, { status: 400 })
    }

    // Get content items that need translation
    const contentToTranslate = await getContentToTranslate(
      supabase,
      contentType,
      targetLanguages,
      batchSize,
      options
    )

    if (contentToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No content found that needs translation',
        jobIds: [],
        estimatedTime: 0
      })
    }

    // Create translation jobs
    const jobIds = await createTranslationJobs(
      supabase,
      contentType,
      contentToTranslate,
      targetLanguages,
      options
    )

    // Start background translation process
    processTranslationJobs(supabase, jobIds)

    const estimatedTime = calculateEstimatedTime(contentToTranslate.length, targetLanguages.length)

    return NextResponse.json({
      success: true,
      message: `Started bulk translation for ${contentToTranslate.length} ${contentType} items`,
      jobIds,
      contentCount: contentToTranslate.length,
      languages: targetLanguages,
      estimatedTime
    })

  } catch (error) {
    console.error('Bulk translation error:', error)
    return NextResponse.json({
      error: 'Failed to start bulk translation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getContentToTranslate(
  supabase: any,
  contentType: string,
  targetLanguages: string[],
  batchSize: number,
  options: BulkTranslationRequest['options']
) {
  let query = supabase
    .from(contentType)
    .select('id, translations')
    .limit(batchSize)

  // If not overwriting existing, filter out already translated content
  if (!options.overwriteExisting && options.skipTranslated) {
    // This would need more complex logic to check if all target languages are already translated
    // For now, we'll get all content and filter in memory
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch ${contentType}: ${error.message}`)
  }

  // Filter content based on translation requirements
  return (data || []).filter((item: any) => {
    if (options.overwriteExisting) {
      return true // Translate everything
    }

    // Check if any target language is missing translations
    const translations = item.translations || {}
    return targetLanguages.some(lang => {
      const fields = TRANSLATABLE_FIELDS[contentType as keyof typeof TRANSLATABLE_FIELDS]
      return fields.some(field => !translations[field]?.[lang]?.text)
    })
  })
}

async function createTranslationJobs(
  supabase: any,
  contentType: string,
  contentItems: any[],
  targetLanguages: string[],
  options: BulkTranslationRequest['options']
): Promise<string[]> {
  const jobs = []
  
  for (const item of contentItems) {
    for (const language of targetLanguages) {
      jobs.push({
        id: crypto.randomUUID(),
        content_type: contentType,
        content_id: item.id,
        target_language: language,
        status: 'pending',
        progress: 0,
        priority: options.priority,
        queue_for_review: options.queueForReview || false,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error: null
      })
    }
  }

  // Create jobs table if it doesn't exist
  await ensureTranslationJobsTable(supabase)

  // Insert jobs into database
  const { data, error } = await supabase
    .from('translation_jobs')
    .insert(jobs)
    .select('id')

  if (error) {
    throw new Error(`Failed to create translation jobs: ${error.message}`)
  }

  return jobs.map(job => job.id)
}

async function ensureTranslationJobsTable(supabase: any) {
  // Check if table exists, create if it doesn't
  const { error } = await supabase
    .from('translation_jobs')
    .select('id')
    .limit(1)

  if (error && error.code === '42P01') { // Table doesn't exist
    // In a real implementation, you'd want to run a migration instead
    console.warn('translation_jobs table does not exist. Please run the appropriate migration.')
  }
}

async function processTranslationJobs(supabase: any, jobIds: string[]) {
  // This would be better implemented as a queue/background job system
  // For now, we'll process jobs one by one
  
  setTimeout(async () => {
    for (const jobId of jobIds) {
      try {
        await processIndividualJob(supabase, jobId)
      } catch (error) {
        console.error(`Failed to process job ${jobId}:`, error)
        
        // Mark job as failed
        await supabase
          .from('translation_jobs')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }
    }
  }, 1000) // Start processing after 1 second
}

async function processIndividualJob(supabase: any, jobId: string) {
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('translation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  // Mark job as in progress
  await supabase
    .from('translation_jobs')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      progress: 0
    })
    .eq('id', jobId)

  // Get the content item
  const { data: contentItem, error: contentError } = await supabase
    .from(job.content_type)
    .select('*')
    .eq('id', job.content_id)
    .single()

  if (contentError || !contentItem) {
    throw new Error(`Content item not found: ${job.content_id}`)
  }

  // Get translatable fields for this content type
  const fields = TRANSLATABLE_FIELDS[job.content_type as keyof typeof TRANSLATABLE_FIELDS]
  
  // Collect texts to translate
  const textsToTranslate: { field: string; text: string }[] = []
  
  for (const field of fields) {
    const text = contentItem[field]
    if (text && typeof text === 'string' && text.trim()) {
      textsToTranslate.push({ field, text })
    }
  }

  if (textsToTranslate.length === 0) {
    // Mark as completed if no text to translate
    await supabase
      .from('translation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    return
  }

  // Update progress to 25%
  await supabase
    .from('translation_jobs')
    .update({ progress: 25 })
    .eq('id', jobId)

  // Translate texts using DeepL API
  const translatedTexts = await translateTexts(
    textsToTranslate.map(t => t.text),
    job.target_language
  )

  // Update progress to 75%
  await supabase
    .from('translation_jobs')
    .update({ progress: 75 })
    .eq('id', jobId)

  // Build updated translations object
  const currentTranslations = contentItem.translations || {}
  
  textsToTranslate.forEach((item, index) => {
    const field = item.field
    const translatedText = translatedTexts[index]
    
    if (!currentTranslations[field]) {
      currentTranslations[field] = {}
    }
    
    currentTranslations[field][job.target_language] = {
      text: translatedText,
      lastUpdated: new Date().toISOString(),
      autoTranslated: true,
      reviewStatus: job.queue_for_review ? 'pending' : 'approved'
    }
  })

  // Save translations back to content item
  await supabase
    .from(job.content_type)
    .update({ translations: currentTranslations })
    .eq('id', job.content_id)

  // Mark job as completed
  await supabase
    .from('translation_jobs')
    .update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId)
}

async function translateTexts(texts: string[], targetLanguage: string): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        targetLanguage,
        preserveFormatting: true
      }),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success && data.translations) {
      return data.translations.map((t: any) => t.translatedText || t.text || '')
    } else {
      throw new Error(data.error || 'Translation failed')
    }
  } catch (error) {
    console.error('Translation error:', error)
    // Return original texts as fallback
    return texts
  }
}

function calculateEstimatedTime(contentCount: number, languageCount: number): number {
  // Rough estimate: 2 seconds per content item per language
  const totalJobs = contentCount * languageCount
  const estimatedSeconds = totalJobs * 2
  return Math.ceil(estimatedSeconds / 60) // Return minutes
}

// GET endpoint to retrieve job status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const jobIds = searchParams.get('jobIds')?.split(',') || []

    if (jobIds.length === 0) {
      return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 })
    }

    const { data: jobs, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .in('id', jobIds)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    })

  } catch (error) {
    console.error('Job status fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 