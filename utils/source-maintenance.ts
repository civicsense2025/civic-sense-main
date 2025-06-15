import { supabase } from "@/lib/supabase"

// Define proper types for sources
interface QuestionSource {
  name: string
  url: string
}

interface BrokenSource {
  url: string
  questionId: string
  sourceName: string
  error: string
  statusCode?: number
}

interface SourceReplacement {
  originalUrl: string
  newUrl: string
  newTitle: string
  confidence: number
  reason: string
}

// OpenAI types (simplified to avoid dependency)
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAICompletion {
  choices: Array<{
    message?: {
      content?: string
    }
  }>
}

/**
 * Type guard to check if value is a valid QuestionSource array
 */
function isQuestionSourceArray(value: unknown): value is QuestionSource[] {
  if (!Array.isArray(value)) return false
  return value.every(item => 
    typeof item === 'object' && 
    item !== null && 
    typeof (item as any).name === 'string' && 
    typeof (item as any).url === 'string'
  )
}

/**
 * Safely convert Json to QuestionSource array
 */
function toQuestionSourceArray(value: unknown): QuestionSource[] {
  if (isQuestionSourceArray(value)) {
    return value
  }
  return []
}

/**
 * Simple OpenAI API call without the full SDK
 */
async function callOpenAI(messages: OpenAIMessage[]): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data: OpenAICompletion = await response.json()
    return data.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    return null
  }
}

/**
 * Check if a URL returns a 404 or other error
 */
async function checkSourceAvailability(url: string): Promise<{ isAvailable: boolean; statusCode?: number; error?: string }> {
  try {
    console.log(`🔍 Checking availability of: ${url}`)
    
    // Create a timeout promise that we can control
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    })
    
    // Create the fetch promise
    const fetchPromise = fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading content
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      redirect: 'follow'
    })

    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise])
    
    if (response.status === 404) {
      return { isAvailable: false, statusCode: 404, error: 'Not Found' }
    }
    
    if (response.status >= 400) {
      return { isAvailable: false, statusCode: response.status, error: response.statusText }
    }
    
    return { isAvailable: true, statusCode: response.status }
    
  } catch (error) {
    console.warn(`Error checking ${url}:`, error)
    
    // Handle different types of errors more comprehensively
    if (error instanceof Error) {
      // Handle timeout errors
      if (error.name === 'AbortError' || 
          error.message.includes('timeout') || 
          error.message.includes('Request timeout') ||
          (error as any).code === 23) { // TIMEOUT_ERR code
        console.log(`⏰ Timeout for ${url}`)
        return {
          isAvailable: false,
          statusCode: 408, // Request Timeout
          error: 'Request timeout (10 seconds)'
        }
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log(`🌐 Network error for ${url}`)
        return {
          isAvailable: false,
          statusCode: 0,
          error: `Network error: ${error.message}`
        }
      }
      
      // Handle DNS/connection errors
      if (error.message.includes('ENOTFOUND') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ECONNRESET')) {
        console.log(`🔌 Connection error for ${url}`)
        return {
          isAvailable: false,
          statusCode: 0,
          error: `Connection failed: ${error.message}`
        }
      }
      
      // Handle SSL/TLS errors
      if (error.message.includes('certificate') || 
          error.message.includes('SSL') ||
          error.message.includes('TLS')) {
        console.log(`🔒 SSL error for ${url}`)
        return {
          isAvailable: false,
          statusCode: 0,
          error: `SSL/Certificate error: ${error.message}`
        }
      }
      
      console.log(`❓ Other error for ${url}: ${error.message}`)
      return {
        isAvailable: false,
        statusCode: 0,
        error: error.message
      }
    }
    
    // Handle non-Error objects (like the timeout error you encountered)
    console.log(`❓ Unknown error type for ${url}:`, error)
    return {
      isAvailable: false,
      statusCode: 408, // Assume timeout for unknown errors with code 23
      error: 'Request failed (likely timeout)'
    }
  }
}

/**
 * Find replacement sources using OpenAI
 */
async function findReplacementSources(
  questionText: string, 
  brokenUrl: string, 
  sourceName: string,
  questionCategory?: string
): Promise<SourceReplacement[]> {
  try {
    console.log(`🔍 Finding replacement for broken source: ${brokenUrl}`)
    
    const searchPrompt = `
I need to find a replacement for a broken news/information source. Here are the details:

**Original Question:** ${questionText}
**Broken Source:** ${brokenUrl} (${sourceName})
**Category:** ${questionCategory || 'General'}

Please find 2-3 current, reliable sources that would be appropriate for answering this civic education question. 

For each source, provide:
1. The URL
2. The title/headline
3. A confidence score (1-10) for how well it replaces the original
4. A brief reason why it's a good replacement

Focus on:
- Authoritative sources (government sites, established news organizations, educational institutions)
- Recent and relevant content
- Sources that directly address the topic of the question
- Avoiding partisan or biased sources when possible

Format your response as a JSON array with this structure:
[
  {
    "url": "https://example.com/article",
    "title": "Article Title",
    "confidence": 8,
    "reason": "Official government source with current information"
  }
]
`

    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: "You are a helpful assistant that finds reliable, authoritative sources for civic education content. Respond only with valid JSON."
      },
      {
        role: "user",
        content: searchPrompt
      }
    ]

    const response = await callOpenAI(messages)
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    try {
      const sources = JSON.parse(response)
      if (!Array.isArray(sources)) {
        console.error('OpenAI response is not an array:', response)
        return []
      }
      
      return sources.map((source: any) => ({
        originalUrl: brokenUrl,
        newUrl: source.url || '',
        newTitle: source.title || 'Unknown Title',
        confidence: source.confidence || 5,
        reason: source.reason || 'AI-suggested replacement'
      })).filter(s => s.newUrl) // Filter out sources without URLs
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response)
      return []
    }

  } catch (error) {
    console.error('Error finding replacement sources:', error)
    return []
  }
}

/**
 * Remove broken source from question and source_metadata
 */
async function removeBrokenSource(questionId: string, brokenUrl: string): Promise<void> {
  try {
    console.log(`🗑️ Removing broken source ${brokenUrl} from question ${questionId}`)
    
    // Get the current question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('sources')
      .eq('id', questionId)
      .single()
    
    if (questionError) {
      throw new Error(`Failed to fetch question: ${questionError.message}`)
    }
    
    if (!question.sources) {
      console.warn(`Question ${questionId} has no sources`)
      return
    }
    
    // Safely convert to QuestionSource array
    const sources = toQuestionSourceArray(question.sources)
    
    // Remove the broken source from the sources array
    const updatedSources = sources.filter((source: QuestionSource) => 
      source.url !== brokenUrl
    )
    
    // Update the question - convert back to Json format
    const { error: updateError } = await supabase
      .from('questions')
      .update({ sources: updatedSources as unknown as any })
      .eq('id', questionId)
    
    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`)
    }
    
    // Remove from source_metadata table
    const { error: deleteError } = await supabase
      .from('source_metadata')
      .delete()
      .eq('url', brokenUrl)
    
    if (deleteError) {
      console.warn(`Failed to delete from source_metadata: ${deleteError.message}`)
    }
    
    console.log(`✅ Successfully removed broken source from question ${questionId}`)
    
  } catch (error) {
    console.error(`Error removing broken source:`, error)
    throw error
  }
}

/**
 * Add new source to question and fetch its metadata
 */
async function addSourceToQuestion(
  questionId: string, 
  newUrl: string, 
  newTitle: string
): Promise<void> {
  try {
    console.log(`➕ Adding new source ${newUrl} to question ${questionId}`)
    
    // Get the current question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('sources')
      .eq('id', questionId)
      .single()
    
    if (questionError) {
      throw new Error(`Failed to fetch question: ${questionError.message}`)
    }
    
    const currentSources = toQuestionSourceArray(question.sources)
    
    // Add the new source
    const newSource: QuestionSource = {
      name: newTitle,
      url: newUrl
    }
    
    const updatedSources = [...currentSources, newSource]
    
    // Update the question - convert back to Json format
    const { error: updateError } = await supabase
      .from('questions')
      .update({ sources: updatedSources as unknown as any })
      .eq('id', questionId)
    
    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`)
    }
    
    // Fetch and save metadata for the new source
    try {
      const response = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      })
      
      if (response.ok) {
        const metadata = await response.json()
        
        // Save to source_metadata table
        const { error: metadataError } = await supabase
          .from('source_metadata')
          .upsert({
            url: newUrl,
            title: metadata.title,
            description: metadata.description,
            domain: metadata.domain,
            image_url: metadata.image,
            site_name: metadata.siteName,
            type: metadata.type,
            favicon_url: metadata.favicon,
            author: metadata.author,
            published_time: metadata.publishedTime ? new Date(metadata.publishedTime).toISOString() : null,
            modified_time: metadata.modifiedTime ? new Date(metadata.modifiedTime).toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (metadataError) {
          console.warn(`Failed to save metadata for ${newUrl}:`, metadataError)
        }
      }
    } catch (metadataError) {
      console.warn(`Failed to fetch metadata for ${newUrl}:`, metadataError)
    }
    
    console.log(`✅ Successfully added new source to question ${questionId}`)
    
  } catch (error) {
    console.error(`Error adding source to question:`, error)
    throw error
  }
}

/**
 * Scan all questions for broken sources
 */
export async function scanForBrokenSources(): Promise<BrokenSource[]> {
  console.log('🔍 Starting scan for broken sources...')
  
  const brokenSources: BrokenSource[] = []
  
  try {
    // Get all questions with sources
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question, sources, category')
      .not('sources', 'is', null)
    
    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`)
    }
    
    console.log(`📊 Checking ${questions.length} questions for broken sources...`)
    
    for (const question of questions) {
      if (!question.sources) {
        continue
      }
      
      // Safely convert to QuestionSource array
      const sources = toQuestionSourceArray(question.sources)
      
      for (const source of sources) {
        if (!source || !source.url) continue
        
        try {
          const availability = await checkSourceAvailability(source.url)
          
          if (!availability.isAvailable) {
            brokenSources.push({
              url: source.url,
              questionId: question.id,
              sourceName: source.name || 'Unknown',
              error: availability.error || 'Unknown error',
              statusCode: availability.statusCode
            })
            
            console.log(`❌ Found broken source: ${source.url} (${availability.statusCode || 'Error'}: ${availability.error})`)
          } else {
            console.log(`✅ Source OK: ${source.url} (${availability.statusCode})`)
          }
        } catch (error) {
          // If checkSourceAvailability itself throws an error, treat as broken
          console.error(`💥 Error checking source ${source.url}:`, error)
          brokenSources.push({
            url: source.url,
            questionId: question.id,
            sourceName: source.name || 'Unknown',
            error: error instanceof Error ? error.message : 'Check failed',
            statusCode: 0
          })
        }
        
        // Add delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`🔍 Scan complete. Found ${brokenSources.length} broken sources.`)
    return brokenSources
    
  } catch (error) {
    console.error('Error scanning for broken sources:', error)
    throw error
  }
}

/**
 * Fix broken sources by finding replacements
 */
export async function fixBrokenSources(brokenSources: BrokenSource[]): Promise<void> {
  console.log(`🔧 Starting to fix ${brokenSources.length} broken sources...`)
  
  for (const brokenSource of brokenSources) {
    try {
      console.log(`\n🔧 Fixing broken source: ${brokenSource.url}`)
      
      // Get question details
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('question, category')
        .eq('id', brokenSource.questionId)
        .single()
      
      if (questionError) {
        console.error(`Failed to fetch question details:`, questionError)
        continue
      }
      
      // Find replacement sources
      const replacements = await findReplacementSources(
        question.question,
        brokenSource.url,
        brokenSource.sourceName,
        question.category
      )
      
      if (replacements.length === 0) {
        console.warn(`❌ No replacements found for ${brokenSource.url}`)
        continue
      }
      
      // Use the highest confidence replacement
      const bestReplacement = replacements.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      )
      
      console.log(`🔄 Replacing with: ${bestReplacement.newUrl} (confidence: ${bestReplacement.confidence})`)
      
      // Remove broken source
      await removeBrokenSource(brokenSource.questionId, brokenSource.url)
      
      // Add new source
      await addSourceToQuestion(
        brokenSource.questionId,
        bestReplacement.newUrl,
        bestReplacement.newTitle
      )
      
      console.log(`✅ Successfully replaced broken source for question ${brokenSource.questionId}`)
      
      // Add delay to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`Error fixing broken source ${brokenSource.url}:`, error)
    }
  }
  
  console.log('🔧 Finished fixing broken sources.')
}

/**
 * Main function to run source maintenance
 */
export async function runSourceMaintenance(): Promise<{
  brokenSources: BrokenSource[]
  fixedCount: number
  errors: string[]
}> {
  const errors: string[] = []
  
  try {
    console.log('🚀 Starting source maintenance...')
    
    // Scan for broken sources
    const brokenSources = await scanForBrokenSources()
    
    if (brokenSources.length === 0) {
      console.log('✅ No broken sources found!')
      return { brokenSources: [], fixedCount: 0, errors: [] }
    }
    
    // Fix broken sources
    const initialCount = brokenSources.length
    await fixBrokenSources(brokenSources)
    
    // Scan again to see how many were fixed
    const remainingBroken = await scanForBrokenSources()
    const fixedCount = initialCount - remainingBroken.length
    
    console.log(`🎉 Source maintenance complete! Fixed ${fixedCount}/${initialCount} broken sources.`)
    
    return {
      brokenSources: remainingBroken,
      fixedCount,
      errors
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)
    console.error('Source maintenance failed:', error)
    
    return {
      brokenSources: [],
      fixedCount: 0,
      errors
    }
  }
}

/**
 * Remove only broken sources without replacement (for cleanup)
 */
export async function removeBrokenSourcesOnly(): Promise<number> {
  console.log('🗑️ Removing broken sources without replacement...')
  
  const brokenSources = await scanForBrokenSources()
  let removedCount = 0
  
  for (const brokenSource of brokenSources) {
    try {
      await removeBrokenSource(brokenSource.questionId, brokenSource.url)
      removedCount++
    } catch (error) {
      console.error(`Failed to remove ${brokenSource.url}:`, error)
    }
  }
  
  console.log(`🗑️ Removed ${removedCount} broken sources.`)
  return removedCount
} 