// utils/source-extraction.ts
import { supabase } from '@/lib/supabase'

interface QuestionData {
  id: string
  explanation: string
  sources: any
}

interface SourceLink {
  name: string
  url: string
}

interface SourceData {
  name: string
  url: string
}

// Cache for storing processed metadata
const metadataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// Process sources from question explanations - local utility version
async function extractAndSaveSourcesFromQuestion(questionId: string, explanation: string, sources: SourceData[]) {
  const uniqueUrls = new Set<string>()
  
  // Extract URLs from explanation
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
  const matches = explanation.match(urlRegex) || []
  matches.forEach(url => uniqueUrls.add(url.trim()))
  
  // Add explicitly provided sources
  sources.forEach(source => {
    if (source.url) uniqueUrls.add(source.url.trim())
  })

  // Process each unique URL
  const promises = Array.from(uniqueUrls).map(async (url) => {
    try {
      // Check cache first
      const cached = metadataCache.get(url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        await linkQuestionToSource(questionId, url, cached.data)
        return
      }

      // Fetch metadata
      const response = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        const metadata = await response.json()
        metadataCache.set(url, { data: metadata, timestamp: Date.now() })
        await linkQuestionToSource(questionId, url, metadata)
      }
    } catch (error) {
      console.error(`Error processing source ${url}:`, error)
    }
  })

  await Promise.all(promises)
}

// Link question to source
async function linkQuestionToSource(questionId: string, url: string, metadata: any) {
  try {
    // First ensure source metadata exists
    const { data: sourceData } = await supabase
      .from('source_metadata')
      .select('id')
      .eq('url', url)
      .single()

    if (!sourceData) {
      console.warn('Source metadata not found for URL:', url)
      return
    }

    // Create the link
    await supabase
      .from('question_source_links')
      .upsert({
        question_id: questionId,
        source_metadata_id: sourceData.id,
        source_name: metadata.title || 'Unknown Source',
        source_type: 'reference',
        is_primary_source: false,
        display_order: 0
      }, {
        onConflict: 'question_id,source_metadata_id'
      })
  } catch (error) {
    console.error('Error linking question to source:', error)
  }
}

// Extract all unique URLs from a text string
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi
  const matches = text.match(urlRegex) || []
  const uniqueUrls = new Set(matches.map(url => url.trim()))
  return Array.from(uniqueUrls)
}

// Parse sources from various formats (string, array, JSON)
export function parseSourcesField(sources: any): SourceLink[] {
  const parsedSources: SourceLink[] = []

  if (!sources) return parsedSources

  try {
    // Handle string that might be JSON
    if (typeof sources === 'string') {
      try {
        sources = JSON.parse(sources)
      } catch {
        // If it's just a URL string
        if (sources.startsWith('http')) {
          parsedSources.push({ name: '', url: sources })
          return parsedSources
        }
      }
    }

    // Handle array of sources
    if (Array.isArray(sources)) {
      sources.forEach(source => {
        if (typeof source === 'string' && source.startsWith('http')) {
          parsedSources.push({ name: '', url: source })
        } else if (source && typeof source === 'object') {
          if (source.url) {
            parsedSources.push({
              name: source.name || source.title || '',
              url: source.url
            })
          }
        }
      })
    }
    // Handle single object
    else if (sources && typeof sources === 'object' && sources.url) {
      parsedSources.push({
        name: sources.name || sources.title || '',
        url: sources.url
      })
    }
  } catch (error) {
    console.error('Error parsing sources:', error)
  }

  return parsedSources
}

// Process all questions in a topic to extract and save sources
export async function processTopicSources(topicId: string) {
  console.log(`🔄 Processing sources for topic: ${topicId}`)

  try {
    // Fetch all questions for the topic
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, explanation, sources')
      .eq('topic_id', topicId)
      .eq('is_active', true)

    if (error) {
      throw error
    }

    if (!questions || questions.length === 0) {
      console.log('No questions found for topic')
      return {
        topicId,
        total: 0,
        successful: 0,
        failed: 0,
        results: []
      }
    }

    console.log(`Found ${questions.length} questions to process`)

    // Process each question
    const results = await Promise.all(
      questions.map(async (question) => {
        try {
          await processQuestionSources(question)
          return { questionId: question.id, status: 'success' }
        } catch (error) {
          console.error(`Error processing question ${question.id}:`, error)
          return { 
            questionId: question.id, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      })
    )

    // Summary
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length

    console.log(`✅ Topic processing complete: ${successful} successful, ${failed} failed`)
    
    return {
      topicId,
      total: questions.length,
      successful,
      failed,
      results
    }

  } catch (error) {
    console.error('Error processing topic sources:', error)
    throw error
  }
}

// Process sources for a single question
export async function processQuestionSources(question: QuestionData) {
  const allUrls = new Set<string>()

  // Extract URLs from explanation
  if (question.explanation) {
    const explanationUrls = extractUrlsFromText(question.explanation)
    explanationUrls.forEach(url => allUrls.add(url))
  }

  // Parse and extract URLs from sources field
  const parsedSources = parseSourcesField(question.sources)
  parsedSources.forEach(source => {
    if (source.url) allUrls.add(source.url)
  })

  console.log(`📎 Found ${allUrls.size} unique URLs for question ${question.id}`)

  // Process each URL
  const urlArray = Array.from(allUrls)
  const batchSize = 5 // Process in batches to avoid overwhelming the API

  for (let i = 0; i < urlArray.length; i += batchSize) {
    const batch = urlArray.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (url) => {
        try {
          // Fetch metadata
          const response = await fetch('/api/fetch-meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          })

          if (response.ok) {
            const metadata = await response.json()
            
            // Create source link
            await createQuestionSourceLink(question.id, url, metadata)
          }
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error)
        }
      })
    )

    // Small delay between batches
    if (i + batchSize < urlArray.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// Create or update a question-source link
async function createQuestionSourceLink(questionId: string, url: string, metadata: any) {
  try {
    // First get the source metadata ID
    const { data: sourceData, error: sourceError } = await supabase
      .from('source_metadata')
      .select('id')
      .eq('url', url)
      .single()

    if (sourceError || !sourceData) {
      console.error('Source metadata not found for URL:', url)
      return
    }

    // Create or update the link
    const { error: linkError } = await supabase
      .from('question_source_links')
      .upsert({
        question_id: questionId,
        source_metadata_id: sourceData.id,
        source_name: metadata.title || metadata.siteName || 'Source',
        source_type: determineSourceType(url, metadata),
        is_primary_source: false,
        relevance_score: 1.0,
        display_order: 0
      }, {
        onConflict: 'question_id,source_metadata_id'
      })

    if (linkError) {
      throw linkError
    }

    console.log(`✅ Linked question ${questionId} to source ${url}`)

  } catch (error) {
    console.error('Error creating question-source link:', error)
  }
}

// Determine the type of source based on URL and metadata
function determineSourceType(url: string, metadata: any): string {
  const domain = new URL(url).hostname.toLowerCase()

  // Government sources
  if (domain.endsWith('.gov')) {
    return 'government'
  }

  // Academic sources
  if (domain.endsWith('.edu') || domain.includes('academic') || domain.includes('journal')) {
    return 'academic'
  }

  // News sources
  const newsKeywords = ['news', 'times', 'post', 'journal', 'tribune', 'gazette', 'reuters', 'ap', 'bbc', 'cnn', 'npr']
  if (newsKeywords.some(keyword => domain.includes(keyword))) {
    return 'news'
  }

  // Legal sources
  if (domain.includes('law') || domain.includes('legal') || domain.includes('court')) {
    return 'legal'
  }

  // Research organizations
  const researchKeywords = ['research', 'institute', 'foundation', 'center', 'think', 'policy']
  if (researchKeywords.some(keyword => domain.includes(keyword))) {
    return 'research'
  }

  // Social media
  const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com', 'linkedin.com']
  if (socialDomains.includes(domain)) {
    return 'social'
  }

  // Default
  return 'reference'
}

// Batch process all questions in the database
export async function processAllQuestionSources(limit: number = 100) {
  console.log('🚀 Starting batch processing of all question sources')

  try {
    // Get all active topics
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('topic_id')
      .eq('is_active', true)
      .limit(limit)

    if (topicsError) {
      throw topicsError
    }

    console.log(`Processing ${topics.length} topics`)

    const results: Array<{
      topicId: string
      total: number
      successful: number
      failed: number
      results: Array<{
        questionId: string
        status: string
        error?: string
      }>
    } | {
      topicId: string
      status: string
      error: string
    }> = []
    
    // Process topics sequentially to avoid overwhelming the system
    for (const topic of topics) {
      try {
        const result = await processTopicSources(topic.topic_id)
        results.push(result)
        
        // Delay between topics
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to process topic ${topic.topic_id}:`, error)
        results.push({
          topicId: topic.topic_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Summary with proper type checking
    const totalQuestions = results.reduce((sum, r) => {
      if (r && 'total' in r) {
        return sum + (r.total || 0)
      }
      return sum
    }, 0)
    
    const totalSuccessful = results.reduce((sum, r) => {
      if (r && 'successful' in r) {
        return sum + (r.successful || 0)
      }
      return sum
    }, 0)
    
    const totalFailed = results.reduce((sum, r) => {
      if (r && 'failed' in r) {
        return sum + (r.failed || 0)
      }
      return sum
    }, 0)

    console.log(`
🎉 Batch processing complete!
Topics processed: ${results.length}
Total questions: ${totalQuestions}
Successful: ${totalSuccessful}
Failed: ${totalFailed}
    `)

    return {
      topics: results.length,
      totalQuestions,
      totalSuccessful,
      totalFailed,
      results
    }

  } catch (error) {
    console.error('Error in batch processing:', error)
    throw error
  }
}

// Monitor source fetch queue
export async function monitorFetchQueue() {
  try {
    const { data: queueStats, error } = await supabase
      .from('source_fetch_queue')
      .select('fetch_type, priority, retry_count')

    if (error) throw error

    const stats = {
      total: queueStats.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      failedRetries: 0
    }

    queueStats.forEach(item => {
      // Null-safe type counting
      const fetchType = item.fetch_type || 'unknown'
      const priority = item.priority || 'normal'
      
      // Count by type
      stats.byType[fetchType] = (stats.byType[fetchType] || 0) + 1
      
      // Count by priority
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1
      
      // Count failed retries
      if (item.retry_count !== null && item.retry_count >= 3) {
        stats.failedRetries++
      }
    })

    return stats

  } catch (error) {
    console.error('Error monitoring fetch queue:', error)
    throw error
  }
}

// Clean up old or failed metadata
export async function cleanupOldMetadata(daysOld: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Delete old failed fetches
    const { data: deleted, error } = await supabase
      .from('source_metadata')
      .delete()
      .eq('fetch_status', 'failed')
      .lt('last_fetched_at', cutoffDate.toISOString())
      .select('id')

    if (error) throw error

    console.log(`🧹 Cleaned up ${deleted?.length || 0} old failed metadata records`)

    return deleted?.length || 0

  } catch (error) {
    console.error('Error cleaning up metadata:', error)
    throw error
  }
}