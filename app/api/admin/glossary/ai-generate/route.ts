import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'

// Simplified AI Generation Request Schema
const AIGenerationRequestSchema = z.object({
  type: z.enum(['extract_from_content', 'generate_new', 'optimize_existing']),
  provider: z.enum(['openai', 'anthropic']).default('anthropic'),
  content_sources: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    content: z.string().optional()
  })).optional(),
  custom_content: z.string().optional(),
  options: z.object({
    count: z.number().min(1).max(50).default(5),
    categories: z.array(z.string()).optional(),
    difficulty_level: z.number().min(1).max(5).optional(),
    include_web_search: z.boolean().default(true),
  }).optional().default({
    count: 5,
    include_web_search: true
  })
})

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Simplified CivicSense Standards with clearer JSON output format
const CIVICSENSE_STANDARDS = `You are creating glossary terms for CivicSense - we help people understand how power actually works in America, not how it's supposed to work.

<brand_voice>
Write like you're talking to a smart friend:
- DIRECT, NOT ACADEMIC: "Here's what's really happening" vs "It may be observed that"
- SPECIFIC, NOT VAGUE: "Congress voted to..." vs "Some lawmakers might..."
- PRACTICAL WISDOM: Connect abstract concepts to real consequences
- PERSONAL STAKES: Show how this affects daily life, not theory
</brand_voice>

<definition_standards>
Each glossary term should:
1. EXPLAIN HOW IT REALLY WORKS: Not textbook theory, but actual practice
2. NAME SPECIFIC ACTORS: Who does this, who benefits, who decides
3. SHOW PERSONAL IMPACT: How this affects readers' daily lives
4. PROVIDE REAL EXAMPLES: Recent (2024-2025) verifiable incidents  
5. INCLUDE NEXT STEPS: What readers can actually do with this knowledge
</definition_standards>

<writing_approach>
For each term:
1. Start with a complete, standalone definition that someone can understand instantly
2. Explain the real-world mechanism: WHO does WHAT to WHOM and WHY
3. Use extended examples that tell the full story with context and consequences
4. Connect to reader's personal experience (rent, taxes, job security, voting power)
5. Make examples so clear that readers think "Oh! I totally get how this screws people over"
6. Suggest concrete actions they can take this week

PREFERRED LANGUAGE PATTERNS:
- Active voice showing clear cause and effect
- "X killed Y people while Z made $W billion" instead of "people died and money was made"
- "Boeing executives chose profits over safety" instead of "officials should have prioritized safety"
- Direct statements: "This killed 346 people" not "This led to deaths"
- Specific accountability: "Dr. Curtis Wright approved OxyContin at FDA, then joined Purdue Pharma"
</writing_approach>

<critical_json_formatting_rules>
MANDATORY JSON FORMATTING REQUIREMENTS:

1. STRUCTURE: Return ONLY a valid JSON object. No text before or after. No markdown blocks. No explanations.

2. ESCAPING: Always escape these characters in JSON strings:
   - Use \\" for quotation marks inside strings
   - Use \\\\ for backslashes
   - Use \\n for line breaks (but avoid them in JSON)
   - Use \\t for tabs (but avoid them)

3. NO THINKING TAGS: Never include <thinking>, <analysis>, or any XML-style tags in your response

4. ARRAY FORMATTING: 
   - Each array element must end with a comma EXCEPT the last one
   - Examples: ["item1", "item2", "item3"] NOT ["item1", "item2", "item3",]
   - No trailing commas in arrays or objects

5. STRING FORMATTING:
   - Keep strings on single lines when possible
   - If you must break lines, use \\n character, don't use actual line breaks
   - No unescaped quotes in strings
   - End all string values with proper closing quotes

6. OBJECT FORMATTING:
   - Every object property must end with a comma EXCEPT the last property
   - Proper closing braces for all objects
   - No trailing commas after the last property

7. NUMBERS: Use plain numbers without quotes (example: "quality_score": 85 not "quality_score": "85")

8. EXAMPLES ARRAY: Each example should be a complete, self-contained string. Keep examples under 300 characters to prevent truncation.

EXAMPLE OF PERFECT JSON STRUCTURE:
{
  "terms": [
    {
      "term": "Term Name",
      "definition": "Complete definition without line breaks or unescaped quotes",
      "part_of_speech": "noun",
      "examples": [
        "First example with proper escaping",
        "Second example"
      ],
      "synonyms": ["synonym1", "synonym2"],
      "category": "power_structures",
      "difficulty_level": 3,
      "uncomfortable_truth": "What they don't want you to know",
      "power_dynamics": [
        "Who holds power",
        "How they use it"
      ],
      "action_steps": [
        "Immediate action",
        "Long-term strategy"
      ],
      "quality_score": 85
    }
  ]
}
</critical_json_formatting_rules>

<json_output_format>
You must return a valid JSON object with this EXACT structure. Follow ALL formatting rules above:

{
  "terms": [
    {
      "term": "Precise civic concept name",
      "definition": "Complete, standalone explanation (2-3 sentences max, no line breaks)",
      "part_of_speech": "noun",
      "examples": [
        "Extended example with full context (under 300 chars)",
        "Another complete example (under 300 chars)"
      ],
      "synonyms": ["synonym1", "synonym2"],
      "category": "voting|government|power_structures|constitutional_law|etc",
      "difficulty_level": 3,
      "uncomfortable_truth": "What politicians don't want citizens to know",
      "power_dynamics": [
        "WHO holds power",
        "HOW they use it"
      ],
      "action_steps": [
        "Immediate action with specific website/phone",
        "Medium-term strategy",
        "Long-term change approach"
      ],
      "quality_score": 85
    }
  ]
}

FINAL CHECKLIST BEFORE RESPONDING:
- ✓ JSON starts with { and ends with }
- ✓ All strings properly quoted and escaped
- ✓ No trailing commas anywhere
- ✓ No <thinking> or other tags
- ✓ All examples under 300 characters
- ✓ Valid JSON that can be parsed by JSON.parse()
- ✓ No text outside the JSON object

CRITICAL: Return ONLY the JSON object. Test your JSON mentally before responding.
</json_output_format>`

// Simplified prompt building
function buildPrompt(type: string, data: any): string {
  const baseInstructions = `Generate civic education terms following CivicSense standards. Return ONLY a valid JSON object with a "terms" array.`
  
  switch (type) {
    case 'extract_from_content':
      const contentText = data.content_sources?.map((source: any) => 
        `${source.title}: ${source.content || 'No content available'}`
      ).join('\n\n') || ''
      
      return `${baseInstructions}

Extract 5-10 civic education terms from this content that reveal uncomfortable truths about power structures:

${contentText}

Focus on terms that expose hidden power structures and provide actionable intelligence citizens can use immediately.`

    case 'generate_new':
      const count = data.options?.count || 5
      const categories = data.options?.categories?.join(', ') || 'general civic education'
      const customContent = data.custom_content || 'current American democracy and power structures'
      
      console.log(`🎯 Building prompt for ${count} terms about: ${customContent}`)
      
      return `${baseInstructions}

Generate ${count} new civic education terms about: ${customContent}
Focus on categories: ${categories}

IMPORTANT: Generate exactly ${count} terms. Your JSON response must contain exactly ${count} items in the "terms" array.

Each term must reveal something politicians actively hide from citizens. Include specific names, dates, dollar amounts where relevant. Connect abstract concepts to citizens' daily lives.`

    case 'optimize_existing':
      return `${baseInstructions}

Transform existing glossary terms into powerful civic education tools. Add uncomfortable truths, replace vague references with specific actors, update examples to recent (2024-2025) incidents, and transform passive suggestions into concrete action strategies.`

    default:
      throw new Error('Invalid generation type')
  }
}

// ============================================================================
// REAL-TIME PROGRESS TRACKING
// ============================================================================

/**
 * Enhanced progress update function with more detailed status types
 */
function sendProgressUpdate(
  controller: ReadableStreamDefaultController, 
  type: 'processing' | 'saved' | 'skipped' | 'failed' | 'complete' | 'generating' | 'parsing' | 'checking',
  data: {
    termIndex?: number
    totalTerms?: number
    termName?: string
    error?: string
    stats?: any
    batchInfo?: string
    currentOperation?: string
    terms?: any[]
    provider?: string
    skipped_terms?: string[]
    failed_terms?: Array<{term: string, error: string}>
  }
) {
  const message = JSON.stringify({
    type,
    timestamp: new Date().toISOString(),
    ...data
  }) + '\n'
  
  controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
}

// ============================================================================
// DATABASE VERIFICATION HELPERS
// ============================================================================

/**
 * Verifies that all "saved" terms actually exist in the database
 */
async function verifyTermsInDatabase(supabase: any, savedTerms: any[]): Promise<number> {
  if (savedTerms.length === 0) return 0
  
  try {
    const termIds = savedTerms.map(t => t.id).filter(Boolean)
    if (termIds.length === 0) return 0
    
    const { data: existingTerms, error } = await supabase
      .from('glossary_terms')
      .select('id, term')
      .in('id', termIds)
    
    if (error) {
      console.error('Error verifying terms in database:', error)
      return 0
    }
    
    console.log(`🔍 Database verification found ${existingTerms?.length || 0} of ${savedTerms.length} expected terms`)
    return existingTerms?.length || 0
  } catch (error) {
    console.error('Exception during database verification:', error)
    return 0
  }
}

// ============================================================================
// STREAMING GENERATION HANDLER
// ============================================================================

/**
 * Individual term processing with streaming updates
 */
async function processTermWithStreaming(
  supabase: any,
  term: any,
  termIndex: number,
  totalTerms: number,
  controller: ReadableStreamDefaultController
): Promise<{success: boolean, result?: any, error?: string}> {
  
  try {
    // Send checking status
    sendProgressUpdate(controller, 'checking', {
      termIndex: termIndex + 1,
      totalTerms,
      termName: term.term,
      currentOperation: `Checking if "${term.term}" already exists...`
    })

    // Check if this specific term already exists
    const { data: existingTerm } = await supabase
      .from('glossary_terms')
      .select('term')
      .eq('term', term.term)
      .single()

    if (existingTerm) {
      sendProgressUpdate(controller, 'skipped', {
        termIndex: termIndex + 1,
        totalTerms,
        termName: term.term,
        currentOperation: `Term "${term.term}" already exists in database`
      })
      return { success: false, error: 'already_exists' }
    }

    // Send processing status
    sendProgressUpdate(controller, 'processing', {
      termIndex: termIndex + 1,
      totalTerms,
      termName: term.term,
      currentOperation: `Saving "${term.term}" to database...`
    })

    // Save this individual term
    const { data: savedTerm, error: saveError } = await supabase
      .from('glossary_terms')
      .insert([term])
      .select()
      .single()

    if (saveError) {
      sendProgressUpdate(controller, 'failed', {
        termIndex: termIndex + 1,
        totalTerms,
        termName: term.term,
        error: saveError.message,
        currentOperation: `Failed to save "${term.term}": ${saveError.message}`
      })
      return { success: false, error: saveError.message }
    }

    if (savedTerm) {
      sendProgressUpdate(controller, 'saved', {
        termIndex: termIndex + 1,
        totalTerms,
        termName: term.term,
        currentOperation: `Successfully saved "${term.term}"`
      })
      return { success: true, result: savedTerm }
    }

    return { success: false, error: 'No term returned from database' }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    sendProgressUpdate(controller, 'failed', {
      termIndex: termIndex + 1,
      totalTerms,
      termName: term.term,
      error: errorMessage,
      currentOperation: `Error processing "${term.term}": ${errorMessage}`
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Handles AI generation with real-time streaming progress updates
 */
async function handleStreamingGeneration(supabase: any, validatedData: any, user: any) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        sendProgressUpdate(controller, 'generating', {
          currentOperation: 'Starting AI generation...'
        })

        // Build prompt and generate terms
        const prompt = buildPrompt(validatedData.type, validatedData)
        const includeWebSearch = validatedData.options?.include_web_search ?? true
        const requestedCount = validatedData.options?.count || 5

        sendProgressUpdate(controller, 'generating', {
          currentOperation: `Requesting ${requestedCount} terms from ${validatedData.provider}...`
        })

        // Generate terms using selected provider
        let generatedTerms: any[]
        let usedProvider = validatedData.provider

        try {
          if (validatedData.provider === 'openai') {
            generatedTerms = await generateWithOpenAI(prompt)
          } else {
            generatedTerms = await generateWithAnthropic(prompt, includeWebSearch)
          }

          sendProgressUpdate(controller, 'parsing', {
            currentOperation: `Generated ${generatedTerms.length} terms, checking for duplicates...`
          })

        } catch (primaryError) {
          sendProgressUpdate(controller, 'failed', {
            error: `Primary provider (${validatedData.provider}) failed: ${primaryError}`,
            currentOperation: `Trying fallback provider...`
          })

          // Try fallback provider
          const fallbackProvider = validatedData.provider === 'openai' ? 'anthropic' : 'openai'
          
          try {
            if (fallbackProvider === 'openai') {
              generatedTerms = await generateWithOpenAI(prompt)
            } else {
              generatedTerms = await generateWithAnthropic(prompt, includeWebSearch)
            }
            usedProvider = fallbackProvider
            sendProgressUpdate(controller, 'parsing', {
              currentOperation: `Fallback successful: Generated ${generatedTerms.length} terms with ${fallbackProvider}`
            })
          } catch (fallbackError) {
            throw new Error('Both AI providers failed')
          }
        }

        // ============================================================================
        // PRE-DATABASE DEDUPLICATION
        // ============================================================================
        
        // Check for existing terms in database first
        sendProgressUpdate(controller, 'checking', {
          currentOperation: `Checking ${generatedTerms.length} generated terms against existing database entries...`
        })

        const termNames = generatedTerms.map(t => t.term?.toLowerCase().trim()).filter(Boolean)
        const { data: existingTerms } = await supabase
          .from('glossary_terms')
          .select('term')
          .in('term', termNames.map(name => 
            // Convert back to proper case for database query
            generatedTerms.find(t => t.term?.toLowerCase().trim() === name)?.term
          ).filter(Boolean))

        const existingTermSet = new Set(
          existingTerms?.map((t: any) => t.term.toLowerCase().trim()) || []
        )

        // Filter out duplicates and existing terms
        const uniqueTerms: any[] = []
        const duplicates: string[] = []
        const alreadyExists: string[] = []
        const seenInGeneration = new Set<string>()

        for (const term of generatedTerms) {
          const termKey = term.term?.toLowerCase().trim()
          if (!termKey) continue

          if (existingTermSet.has(termKey)) {
            alreadyExists.push(term.term)
          } else if (seenInGeneration.has(termKey)) {
            duplicates.push(term.term)
          } else {
            seenInGeneration.add(termKey)
            uniqueTerms.push(term)
          }
        }

        sendProgressUpdate(controller, 'processing', {
          currentOperation: `Filtered to ${uniqueTerms.length} unique new terms (${duplicates.length} duplicates in generation, ${alreadyExists.length} already exist in database)`,
          stats: {
            generated: generatedTerms.length,
            unique_new: uniqueTerms.length,
            duplicates_in_generation: duplicates.length,
            already_exist: alreadyExists.length
          }
        })

        if (uniqueTerms.length === 0) {
          sendProgressUpdate(controller, 'complete', {
            stats: {
              requested: requestedCount,
              generated: generatedTerms.length,
              saved: 0,
              skipped: alreadyExists.length,
              failed: 0,
              duplicates: duplicates.length,
              verified: 0
            },
            terms: [],
            provider: usedProvider,
            skipped_terms: alreadyExists,
            failed_terms: [],
            currentOperation: `Complete! No new terms to save - all generated terms already exist or are duplicates`
          })
          controller.close()
          return
        }

        // Process terms for database schema
        const processedTerms = uniqueTerms.map((term) => ({
          // Core fields
          term: term.term || 'Untitled Term',
          definition: term.definition || 'No definition provided',
          part_of_speech: term.part_of_speech || 'noun',
          
          // Arrays
          examples: Array.isArray(term.examples) ? term.examples : [],
          synonyms: Array.isArray(term.synonyms) ? term.synonyms : [],
          
          // Metadata JSONB
          metadata: {
            uncomfortable_truth: term.uncomfortable_truth || '',
            tags: [term.category || 'general'],
            crossword_clue: term.crossword_clue || `A civic concept: ${term.term}`,
            ai_model: usedProvider === 'anthropic' ? 'claude-3.7-sonnet' : 'gpt-4-turbo',
            generation_timestamp: new Date().toISOString(),
            web_search_used: includeWebSearch && usedProvider === 'anthropic',
            quality_score: term.quality_score || 75
          },
          
          // Educational context JSONB
          educational_context: {
            power_dynamics: Array.isArray(term.power_dynamics) ? term.power_dynamics : [],
            action_steps: Array.isArray(term.action_steps) ? term.action_steps : [],
            learning_objectives: [
              `Understand how ${term.term || 'this concept'} affects citizen power`,
              'Apply knowledge to effective democratic participation'
            ],
            civic_category: term.category || 'general',
            target_audience: term.difficulty_level >= 4 ? 'advanced learners' : 'general public'
          },
          
          // Source info JSONB
          source_info: {
            provider: usedProvider,
            generation_type: validatedData.type,
            source_content: validatedData.custom_content || 'AI Generated',
            credibility_level: 'ai_generated',
            generated_at: new Date().toISOString()
          },
          
          // Game data JSONB
          game_data: {
            crossword_clue: term.crossword_clue || `A civic concept: ${term.term}`,
            matching_description: term.definition ? term.definition.substring(0, 60) + '...' : '',
            difficulty_hint: term.difficulty_level >= 4 ? 'Advanced civic concept' : 'Fundamental democratic idea'
          },
          
          // Direct fields
          difficulty_level: Math.min(Math.max(term.difficulty_level || 3, 1), 5),
          quality_score: Math.min(Math.max(term.quality_score || 75, 0), 100),
          ai_generated: true,
          is_verified: false,
          is_active: true
        }))

        // Send status for starting database operations
        sendProgressUpdate(controller, 'processing', {
          totalTerms: processedTerms.length,
          currentOperation: `Saving ${processedTerms.length} verified unique terms to database...`
        })

        // Process and save terms ONE AT A TIME with real-time updates
        const savedTerms: any[] = []
        const skippedTerms: string[] = []
        const failedTerms: Array<{term: string, error: string}> = []

        for (let i = 0; i < processedTerms.length; i++) {
          const term = processedTerms[i]
          
          const result = await processTermWithStreaming(
            supabase, 
            term, 
            i, 
            processedTerms.length, 
            controller
          )

          if (result.success && result.result) {
            savedTerms.push(result.result)
          } else if (result.error === 'already_exists') {
            skippedTerms.push(term.term)
          } else {
            failedTerms.push({
              term: term.term,
              error: result.error || 'Unknown error'
            })
          }

          // Send intermediate stats update every few terms
          if ((i + 1) % 3 === 0 || i === processedTerms.length - 1) {
            sendProgressUpdate(controller, 'processing', {
              termIndex: i + 1,
              totalTerms: processedTerms.length,
              currentOperation: `Database progress: ${i + 1}/${processedTerms.length} processed`,
              stats: {
                saved: savedTerms.length,
                skipped: skippedTerms.length,
                failed: failedTerms.length
              }
            })
          }

          // Small delay to prevent overwhelming the database and give UI time to update
          if (i < processedTerms.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        // Create category relationships for successfully saved terms
        if (savedTerms.length > 0) {
          sendProgressUpdate(controller, 'processing', {
            currentOperation: `Creating category relationships for ${savedTerms.length} saved terms...`
          })

          const { data: categories } = await supabase
            .from('categories')
            .select('id, category_slug, category_title')

          if (categories) {
            const categoryRelationships = []
            
            for (const savedTerm of savedTerms) {
              // Find the original generated term that matches this saved term
              const originalTerm = uniqueTerms.find(gt => gt.term === savedTerm.term)
              if (!originalTerm) {
                console.warn(`⚠️ Could not find original term data for: ${savedTerm.term}`)
                continue
              }

              const categorySlug = originalTerm?.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              
              // Guard against undefined categorySlug
              if (!categorySlug) {
                console.warn(`⚠️ No category slug for term: ${savedTerm.term}`)
                continue
              }
              
              const matchingCategory = categories.find((cat: any) => 
                cat.category_slug === categorySlug ||
                cat.category_title.toLowerCase().includes(categorySlug.replace('-', ' '))
              )
              
              if (matchingCategory) {
                categoryRelationships.push({
                  term_id: savedTerm.id,
                  category_id: matchingCategory.id,
                  is_primary: true,
                  relevance_score: 8
                })
              } else {
                console.warn(`⚠️ No matching category found for slug: ${categorySlug}`)
              }
            }
            
            if (categoryRelationships.length > 0) {
              const { error: categoryError } = await supabase
                .from('glossary_term_categories')
                .insert(categoryRelationships)
              
              if (categoryError) {
                console.warn(`⚠️ Error creating category relationships:`, categoryError)
              } else {
                console.log(`✅ Created ${categoryRelationships.length} category relationships`)
              }
            }
          }
        }

        // Verify saved terms in database
        const verifiedCount = await verifyTermsInDatabase(supabase, savedTerms)
        
        // Combine all skipped terms (pre-existing + duplicates + generation skipped)
        const allSkippedTerms = [...alreadyExists, ...duplicates, ...skippedTerms]
        
        // Send final completion status
        sendProgressUpdate(controller, 'complete', {
          stats: {
            requested: requestedCount,
            generated: generatedTerms.length,
            unique_new: uniqueTerms.length,
            saved: savedTerms.length,
            skipped: allSkippedTerms.length,
            failed: failedTerms.length,
            verified: verifiedCount,
            duplicates_in_generation: duplicates.length,
            already_existed: alreadyExists.length
          },
          terms: savedTerms,
          provider: usedProvider,
          skipped_terms: allSkippedTerms,
          failed_terms: failedTerms,
          currentOperation: `Complete! ${savedTerms.length} new terms saved, ${allSkippedTerms.length} skipped (${duplicates.length} duplicates + ${alreadyExists.length} pre-existing), ${failedTerms.length} failed`
        })

        controller.close()

      } catch (error) {
        sendProgressUpdate(controller, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          currentOperation: 'Generation failed'
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ============================================================================
// MODEL VALIDATION
// ============================================================================

/**
 * Validates and returns the correct model name for the provider
 */
function getValidatedModelName(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-7-sonnet-20250219' // Updated Claude model
    case 'openai':
      return 'gpt-4-turbo-preview' // Stable OpenAI model
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

// ============================================================================
// IMPROVED JSON EXTRACTION AND PARSING
// ============================================================================

/**
 * Enhanced JSON repair for truncated responses with better closing detection
 */
function repairTruncatedJson(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Step 1: Remove any trailing incomplete content that might confuse the parser
  // Look for patterns that suggest truncation mid-string or mid-property
  const truncationPatterns = [
    /,\s*$/,                    // Trailing comma
    /:\s*$/,                    // Colon without value
    /,\s*"[^"]*$/,             // Incomplete property name
    /:\s*"[^"]*$/,             // Incomplete string value
    /"\s*,?\s*$/               // Dangling quote
  ];
  
  for (const pattern of truncationPatterns) {
    if (pattern.test(repaired)) {
      // Find the last complete object/array boundary
      const lastCompleteEnd = Math.max(
        repaired.lastIndexOf('}'),
        repaired.lastIndexOf(']')
      );
      if (lastCompleteEnd > -1) {
        repaired = repaired.substring(0, lastCompleteEnd + 1);
        break;
      }
    }
  }
  
  // Step 2: Count and balance braces/brackets
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escapeNext = false;
  let lastNonWhitespaceChar = '';
  let lastNonWhitespaceIndex = -1;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{') braceDepth++;
      else if (char === '}') braceDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
      
      if (char.trim()) {
        lastNonWhitespaceChar = char;
        lastNonWhitespaceIndex = i;
      }
    }
  }
  
  // Step 3: Handle incomplete strings
  if (inString) {
    repaired += '"';
  }
  
  // Step 4: Clean up trailing incomplete content based on last character
  if (lastNonWhitespaceChar === ',' || lastNonWhitespaceChar === ':') {
    // Remove trailing incomplete field
    repaired = repaired.substring(0, lastNonWhitespaceIndex);
    
    // Recount after truncation
    braceDepth = 0;
    bracketDepth = 0;
    inString = false;
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '"' && (i === 0 || repaired[i-1] !== '\\')) {
        inString = !inString;
      }
      if (!inString) {
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }
    }
  }
  
  // Step 5: Close unclosed structures
  while (bracketDepth > 0) {
    repaired += ']';
    bracketDepth--;
  }
  while (braceDepth > 0) {
    repaired += '}';
    braceDepth--;
  }
  
  return repaired;
}

/**
 * Enhanced comma and structural cleanup
 */
function cleanupJsonStructure(jsonStr: string): string {
  let cleaned = jsonStr;
  
  // Remove trailing commas before closing brackets/braces
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove duplicate consecutive commas
  cleaned = cleaned.replace(/,+/g, ',');
  
  // Fix missing commas between array elements and objects
  cleaned = cleaned.replace(/}(\s*){/g, '},\n$1{');
  cleaned = cleaned.replace(/](\s*)\[/g, '],$1[');
  
  // Fix quotes in strings that might break JSON
  // This is a simplified approach - in practice, this is complex
  cleaned = cleaned.replace(/([^\\])"([^",}\]]*)"([^,}\]\s:])/g, '$1\\"$2\\"$3');
  
  return cleaned;
}

/**
 * Enhanced partial terms extraction with better boundary detection
 */
function extractPartialTermsArray(jsonStr: string): any {
  const termsMatch = jsonStr.match(/"terms"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
  if (!termsMatch) {
    throw new Error('No terms array found in response');
  }
  
  const termsContent = termsMatch[1];
  const completeTerms = [];
  let currentTerm = '';
  let braceDepth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < termsContent.length; i++) {
    const char = termsContent[i];
    
    if (escapeNext) {
      escapeNext = false;
      currentTerm += char;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      currentTerm += char;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    currentTerm += char;
    
    if (!inString) {
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        
        if (braceDepth === 0) {
          // We have a complete term object
          try {
            // Clean up the term string
            let termStr = currentTerm.trim();
            
            // Remove leading comma if present
            termStr = termStr.replace(/^,\s*/, '');
            
            // Parse the individual term
            const termObj = JSON.parse(termStr);
            
            // Validate it has required fields
            if (termObj.term && termObj.definition) {
              completeTerms.push(termObj);
            }
            
            currentTerm = '';
          } catch (e) {
            // Skip malformed term and continue
            console.warn(`Skipping malformed term: ${e instanceof Error ? e.message : 'Unknown error'}`);
            currentTerm = '';
          }
        }
      }
    }
  }
  
  console.log(`Extracted ${completeTerms.length} complete terms from partial response`);
  return { terms: completeTerms };
}

/**
 * Enhanced JSON extractor with better error-specific handling
 */
function extractJson(raw: string): any {
  console.log('Extracting JSON from response of length:', raw.length);
  
  // 1️⃣ Remove markdown code fences and explanatory text
  let cleaned = raw
    // Remove "Here is the JSON..." type preambles
    .replace(/^.*?(?=\{)/s, '')
    // Remove markdown code fences
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract content between code fences
      return match.replace(/```json\s*|\s*```/g, '');
    })
    // Remove any trailing explanation after the last }
    .replace(/\}[^}]*$/, '}')
    // Remove thinking tags that might interfere
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
    .trim();

  // 2️⃣ Find the main JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1) {
    throw new Error('No opening brace found in response');
  }
  
  let candidate = cleaned;
  if (firstBrace > 0 || lastBrace < cleaned.length - 1) {
    candidate = cleaned.slice(firstBrace, lastBrace + 1);
  }
  
  console.log('JSON candidate length:', candidate.length);
  console.log('JSON candidate preview:', candidate.substring(0, 500) + '...');

  // 3️⃣ Try progressive parsing strategies with enhanced error handling
  const strategies = [
    // Strategy 1: Parse as-is
    () => {
      return JSON.parse(candidate);
    },
    
    // Strategy 2: Enhanced truncated JSON repair
    () => {
      console.log('Attempting enhanced truncated JSON repair...');
      const repaired = repairTruncatedJson(candidate);
      console.log('Repaired JSON length:', repaired.length);
      return JSON.parse(repaired);
    },
    
    // Strategy 3: Structural cleanup
    () => {
      console.log('Attempting structural cleanup...');
      const cleaned = cleanupJsonStructure(candidate);
      return JSON.parse(cleaned);
    },
    
    // Strategy 4: Combined repair and cleanup
    () => {
      console.log('Attempting combined repair and cleanup...');
      const repaired = repairTruncatedJson(candidate);
      const cleaned = cleanupJsonStructure(repaired);
      return JSON.parse(cleaned);
    },
    
    // Strategy 5: Enhanced partial terms extraction
    () => {
      console.log('Attempting enhanced partial terms array extraction...');
      return extractPartialTermsArray(candidate);
    },
    
    // Strategy 6: jsonrepair as last resort
    () => {
      console.log('Attempting jsonrepair as last resort...');
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    }
  ];

  // Try each strategy in order
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      console.log(`✅ JSON parsing successful with strategy ${i + 1}`);
      
      // Validate the result has terms
      if (!result.terms && !Array.isArray(result)) {
        console.warn('Result has no terms array, trying next strategy...');
        continue;
      }
      
      // Additional validation
      const terms = result.terms || [result];
      if (terms.length === 0) {
        console.warn('Result has empty terms array, trying next strategy...');
        continue;
      }
      
      return result;
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
      if (i === strategies.length - 1) {
        // Last strategy failed
        console.error('All parsing strategies failed');
        console.error('Final candidate (first 1000 chars):', candidate.substring(0, 1000));
        console.error('Final candidate (last 1000 chars):', candidate.substring(Math.max(0, candidate.length - 1000)));
        throw new Error(`All JSON parsing strategies failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  throw new Error('Unexpected end of parsing strategies');
}

// Helper function to batch Claude requests with smarter sizing and duplicate prevention
async function generateClaudeInBatches(prompt: string, systemPrompt: string, requestedCount: number): Promise<any[]> {
  // More conservative batch sizing to prevent truncation
  const batchSize = Math.min(5, Math.max(2, Math.floor(requestedCount / 10))); // 2-5 terms per batch
  const batches = Math.ceil(requestedCount / batchSize);
  const allTerms: any[] = [];
  const seenTerms = new Set<string>(); // Track terms across batches to reduce duplicates
  
  console.log(`🔄 Claude batching: ${requestedCount} terms → ${batches} batches of ~${batchSize} terms each`);
  
  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 
      ? requestedCount - (i * batchSize) 
      : batchSize;
    
    // Enhanced prompt with context from previous batches
    let batchPrompt = prompt.replace(
      /Generate \d+ new civic education terms/,
      `Generate exactly ${batchCount} new civic education terms`
    );
    
    // Add context about previously generated terms to reduce duplicates
    if (seenTerms.size > 0) {
      const previousTermsList = Array.from(seenTerms).slice(0, 10).join(', '); // Show first 10
      batchPrompt += `\n\nIMPORTANT: Do NOT generate terms for concepts already covered. Previous batches generated: ${previousTermsList}${seenTerms.size > 10 ? ', and others' : ''}. Generate completely different civic concepts.`;
    }
    
    console.log(`🔄 Claude batch ${i + 1}/${batches}: ${batchCount} terms`);
    
    try {
      const response = await anthropic.messages.create({
        model: getValidatedModelName('anthropic'),
        max_tokens: 4000, // Reduced from 6000 to prevent truncation
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: batchPrompt
          }
        ]
      })

      const contentBlock = response.content[0]
      if (!contentBlock || contentBlock.type !== 'text') {
        throw new Error('No text content generated')
      }
      
      const content = contentBlock.text
      console.log(`📦 Claude batch ${i + 1} response: ${content.length} chars, ${response.usage?.output_tokens || 'unknown'} tokens`);
      
      const parsed = extractJson(content)
      const batchTerms = parsed.terms || [parsed]
      
      if (batchTerms.length > 0) {
        // Track new terms and add to collection
        const newTerms = [];
        let duplicatesInBatch = 0;
        
        for (const term of batchTerms) {
          const termKey = term.term?.toLowerCase().trim();
          if (termKey && !seenTerms.has(termKey)) {
            seenTerms.add(termKey);
            newTerms.push(term);
          } else {
            duplicatesInBatch++;
            console.log(`⚠️ Duplicate within batch: ${term.term || 'Unknown term'}`);
          }
        }
        
        allTerms.push(...newTerms);
        console.log(`✅ Claude batch ${i + 1}/${batches} complete: ${newTerms.length} unique terms (${duplicatesInBatch} duplicates filtered)`);
      } else {
        console.warn(`⚠️ Claude batch ${i + 1} produced no terms`);
      }
      
      // Longer delay between batches to avoid rate limits and let Claude process properly
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (batchError) {
      console.error(`❌ Claude batch ${i + 1} failed:`, batchError);
      // Continue with other batches rather than failing completely
    }
  }
  
  console.log(`🎉 Claude batching complete: ${allTerms.length} unique terms from ${batches} batches (${seenTerms.size} total unique concepts)`);
  return allTerms;
}

// Simplified Anthropic generation with improved truncation handling
async function generateWithAnthropic(prompt: string, includeWebSearch: boolean = true): Promise<any[]> {
  try {
    const systemPrompt = includeWebSearch 
      ? `${CIVICSENSE_STANDARDS}\n\nIMPORTANT: Use web search to verify facts and find current examples for each term you generate.`
      : CIVICSENSE_STANDARDS

    // Check if this is a large request that should be batched
    const countMatch = prompt.match(/Generate (\d+) new civic education terms/);
    const requestedCount = countMatch ? parseInt(countMatch[1]) : 5;
    
    // Batch for any request > 8 terms to prevent truncation
    if (requestedCount > 8) {
      console.log(`📦 Large Claude request (${requestedCount} terms). Processing in batches to avoid truncation...`);
      return await generateClaudeInBatches(prompt, systemPrompt, requestedCount);
    }

    // For smaller requests, process with reduced max_tokens
    const response = await anthropic.messages.create({
      model: getValidatedModelName('anthropic'),
      max_tokens: 5000, // Reduced from 8000 to prevent truncation
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    const contentBlock = response.content[0]
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new Error('No text content generated')
    }
    
    const content = contentBlock.text
    if (!content) throw new Error('No content generated')

    console.log('Claude response:', content.length, 'chars,', response.usage?.output_tokens || 'unknown', 'tokens');

    // Use enhanced JSON extraction
    try {
      const parsed = extractJson(content)
      const terms = parsed.terms || [parsed]
      console.log(`✅ Successfully extracted ${terms.length} terms from Claude`)
      return terms
    } catch (extractError) {
      console.error('❌ JSON extraction failed:', extractError)
      throw new Error(`Failed to extract JSON: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Anthropic generation error:', error)
    throw new Error('Failed to generate terms with Anthropic')
  }
}

// Simplified OpenAI generation - with batch processing for large requests
async function generateWithOpenAI(prompt: string): Promise<any[]> {
  try {
    // Check if this is a large request
    const countMatch = prompt.match(/Generate (\d+) new civic education terms/);
    const requestedCount = countMatch ? parseInt(countMatch[1]) : 5;
    
    // If requesting more than 20 terms, batch the requests
    if (requestedCount > 5) {
      console.log(`📦 Large OpenAI request (${requestedCount} terms). Processing in batches...`);
      const batchSize = 5;
      const batches = Math.ceil(requestedCount / batchSize);
      const allTerms: any[] = [];
      
      for (let i = 0; i < batches; i++) {
        const batchCount = i === batches - 1 
          ? requestedCount - (i * batchSize) 
          : batchSize;
        
        const batchPrompt = prompt.replace(
          /Generate \d+ new civic education terms/,
          `Generate ${batchCount} new civic education terms`
        );
        
        const response = await openai.chat.completions.create({
          model: getValidatedModelName('openai'),
          messages: [
            {
              role: "system",
              content: CIVICSENSE_STANDARDS
            },
            {
              role: "user",
              content: batchPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000, // Reduced to stay within model limits
          response_format: { type: "json_object" }
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No content generated')

        console.log(`OpenAI batch ${i + 1} raw response:`, typeof content, content?.substring(0, 300))

        // Fix OpenAI double-parsing issue - content might already be an object
        const parsed = typeof content === 'string' ? JSON.parse(content) : content
        console.log(`OpenAI batch ${i + 1} parsed structure:`, Object.keys(parsed), 'terms count:', parsed.terms?.length || 'no terms key')
        
        const batchTerms = parsed.terms || (Array.isArray(parsed) ? parsed : [parsed])
        allTerms.push(...batchTerms);
        
        console.log(`✅ OpenAI batch ${i + 1}/${batches} complete: ${batchTerms.length} terms`);
      }
      
      // Verify total count
      if (allTerms.length < requestedCount) {
        console.warn(`⚠️ OpenAI generated ${allTerms.length} terms but ${requestedCount} were requested.`);
      } else if (allTerms.length > requestedCount) {
        console.log(`Trimming ${allTerms.length} terms to requested ${requestedCount}`);
        allTerms.length = requestedCount;
      }
      
      return allTerms;
    }
    
    // For smaller requests, process normally
    const response = await openai.chat.completions.create({
      model: getValidatedModelName('openai'),
      messages: [
        {
          role: "system",
          content: CIVICSENSE_STANDARDS
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000, // Reduced to stay within model limits
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No content generated')

    console.log('OpenAI single request raw response:', typeof content, content?.substring(0, 300))

    // Fix OpenAI double-parsing issue - content might already be an object
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    console.log('OpenAI single request parsed structure:', Object.keys(parsed), 'terms count:', parsed.terms?.length || 'no terms key')
    
    const terms = parsed.terms || (Array.isArray(parsed) ? parsed : [parsed])
    console.log(`OpenAI returning ${terms.length} terms`)
    return terms
  } catch (error) {
    console.error('OpenAI generation error:', error)
    throw new Error('Failed to generate terms with OpenAI')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('📥 Received request body:', JSON.stringify(body, null, 2))
    
    // Add detailed validation logging
    let validatedData
    try {
      validatedData = AIGenerationRequestSchema.parse(body)
      console.log('✅ Request validation successful:', JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('❌ Validation failed:', validationError.errors)
        return NextResponse.json({ 
          error: 'Invalid request data',
          details: validationError.errors 
        }, { status: 400 })
      }
      throw validationError
    }
    
    // Check if streaming mode is requested
    const { searchParams } = new URL(request.url)
    const streamMode = searchParams.get('stream') === 'true'
    
    if (streamMode) {
      return handleStreamingGeneration(supabase, validatedData, user)
    }

    // Build prompt
    const prompt = buildPrompt(validatedData.type, validatedData)
    const includeWebSearch = validatedData.options?.include_web_search ?? true
    const requestedCount = validatedData.options?.count || 5

    console.log(`📝 Request: ${validatedData.type}, Provider: ${validatedData.provider}, Requested: ${requestedCount} terms`)

    // Generate terms using selected provider
    let generatedTerms: any[]
    let usedProvider = validatedData.provider
    
    try {
      if (validatedData.provider === 'openai') {
        generatedTerms = await generateWithOpenAI(prompt)
      } else {
        generatedTerms = await generateWithAnthropic(prompt, includeWebSearch)
      }
      
      console.log(`✅ Generated ${generatedTerms.length} terms with ${usedProvider} (requested: ${requestedCount})`)
      
      if (generatedTerms.length !== requestedCount) {
        console.warn(`⚠️ Count mismatch: requested ${requestedCount}, got ${generatedTerms.length}`)
        if (generatedTerms.length > requestedCount) {
          console.log(`✂️ Trimming generated terms to requested count (${requestedCount})`)
          generatedTerms.length = requestedCount
        }
      }
      
    } catch (primaryError) {
      console.error(`Primary provider (${validatedData.provider}) failed:`, primaryError)
      
      // Try fallback provider
      const fallbackProvider = validatedData.provider === 'openai' ? 'anthropic' : 'openai'
      console.log(`Attempting fallback to ${fallbackProvider}...`)
      
      try {
        if (fallbackProvider === 'openai') {
          generatedTerms = await generateWithOpenAI(prompt)
        } else {
          generatedTerms = await generateWithAnthropic(prompt, includeWebSearch)
        }
        usedProvider = fallbackProvider
      } catch (fallbackError) {
        throw new Error('Both AI providers failed')
      }
    }

    // ============================================================================
    // PRE-DATABASE DEDUPLICATION (NON-STREAMING)
    // ============================================================================
    
    console.log(`🔍 Checking ${generatedTerms.length} generated terms for duplicates and existing entries...`)

    // Check for existing terms in database first
    const termNames = generatedTerms.map(t => t.term?.toLowerCase().trim()).filter(Boolean)
    const { data: existingTerms } = await supabase
      .from('glossary_terms')
      .select('term')
      .in('term', termNames.map(name => 
        // Convert back to proper case for database query
        generatedTerms.find(t => t.term?.toLowerCase().trim() === name)?.term
      ).filter(Boolean))

    const existingTermSet = new Set(
      existingTerms?.map((t: any) => t.term.toLowerCase().trim()) || []
    )

    // Filter out duplicates and existing terms
    const uniqueTerms: any[] = []
    const duplicates: string[] = []
    const alreadyExists: string[] = []
    const seenInGeneration = new Set<string>()

    for (const term of generatedTerms) {
      const termKey = term.term?.toLowerCase().trim()
      if (!termKey) continue

      if (existingTermSet.has(termKey)) {
        alreadyExists.push(term.term)
      } else if (seenInGeneration.has(termKey)) {
        duplicates.push(term.term)
      } else {
        seenInGeneration.add(termKey)
        uniqueTerms.push(term)
      }
    }

    console.log(`📊 Deduplication results:`)
    console.log(`   🎯 Generated: ${generatedTerms.length} terms`)
    console.log(`   🆕 Unique new: ${uniqueTerms.length} terms`)
    console.log(`   🔄 Duplicates in generation: ${duplicates.length} terms`)
    console.log(`   📚 Already in database: ${alreadyExists.length} terms`)

    if (duplicates.length > 0) {
      console.log(`⚠️ Duplicates found in generation: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`)
    }
    if (alreadyExists.length > 0) {
      console.log(`📚 Terms already in database: ${alreadyExists.slice(0, 5).join(', ')}${alreadyExists.length > 5 ? '...' : ''}`)
    }

    if (uniqueTerms.length === 0) {
      console.log(`🟡 No new terms to save - all generated terms already exist or are duplicates`)
      return NextResponse.json({
        success: true,
        message: `No new terms to save - all ${generatedTerms.length} generated terms were duplicates or already exist`,
        terms: [],
        provider: usedProvider,
        generation_type: validatedData.type,
        stats: {
          requested: requestedCount,
          generated: generatedTerms.length,
          unique_new: 0,
          saved: 0,
          skipped: alreadyExists.length + duplicates.length,
          failed: 0,
          duplicates_in_generation: duplicates.length,
          already_existed: alreadyExists.length
        },
        skipped_terms: [...alreadyExists, ...duplicates],
        failed_terms: []
      })
    }

    // Process terms for database schema
    const processedTerms = uniqueTerms.map((term) => ({
      // Core fields
      term: term.term || 'Untitled Term',
      definition: term.definition || 'No definition provided',
      part_of_speech: term.part_of_speech || 'noun',
      
      // Arrays
      examples: Array.isArray(term.examples) ? term.examples : [],
      synonyms: Array.isArray(term.synonyms) ? term.synonyms : [],
      
      // Metadata JSONB
      metadata: {
        uncomfortable_truth: term.uncomfortable_truth || '',
        tags: [term.category || 'general'],
        crossword_clue: term.crossword_clue || `A civic concept: ${term.term}`,
        ai_model: usedProvider === 'anthropic' ? 'claude-3.7-sonnet' : 'gpt-4-turbo',
        generation_timestamp: new Date().toISOString(),
        web_search_used: includeWebSearch && usedProvider === 'anthropic',
        quality_score: term.quality_score || 75
      },
      
      // Educational context JSONB
      educational_context: {
        power_dynamics: Array.isArray(term.power_dynamics) ? term.power_dynamics : [],
        action_steps: Array.isArray(term.action_steps) ? term.action_steps : [],
        learning_objectives: [
          `Understand how ${term.term || 'this concept'} affects citizen power`,
          'Apply knowledge to effective democratic participation'
        ],
        civic_category: term.category || 'general',
        target_audience: term.difficulty_level >= 4 ? 'advanced learners' : 'general public'
      },
      
      // Source info JSONB
      source_info: {
        provider: usedProvider,
        generation_type: validatedData.type,
        source_content: validatedData.custom_content || 'AI Generated',
        credibility_level: 'ai_generated',
        generated_at: new Date().toISOString()
      },
      
      // Game data JSONB
      game_data: {
        crossword_clue: term.crossword_clue || `A civic concept: ${term.term}`,
        matching_description: term.definition ? term.definition.substring(0, 60) + '...' : '',
        difficulty_hint: term.difficulty_level >= 4 ? 'Advanced civic concept' : 'Fundamental democratic idea'
      },
      
      // Direct fields
      difficulty_level: Math.min(Math.max(term.difficulty_level || 3, 1), 5),
      quality_score: Math.min(Math.max(term.quality_score || 75, 0), 100),
      ai_generated: true,
      is_verified: false,
      is_active: true
    }))

    console.log(`🔧 Processing ${processedTerms.length} terms for database storage...`)

    // Process and save terms ONE AT A TIME to avoid wasting API tokens
    const savedTerms: any[] = []
    const skippedTerms: string[] = []
    const failedTerms: Array<{term: string, error: string}> = []

    for (let i = 0; i < processedTerms.length; i++) {
      const term = processedTerms[i]
      console.log(`💾 Processing term ${i + 1}/${processedTerms.length}: "${term.term}"`)

      try {
        // Check if this specific term already exists
        const { data: existingTerm } = await supabase
          .from('glossary_terms')
          .select('term')
          .eq('term', term.term)
          .single()

        if (existingTerm) {
          console.log(`⏭️ Skipping "${term.term}" - already exists`)
          skippedTerms.push(term.term)
          continue
        }

        // Save this individual term
        const { data: savedTerm, error: saveError } = await supabase
          .from('glossary_terms')
          .insert([term])
          .select()
          .single()

        if (saveError) {
          console.error(`❌ Failed to save "${term.term}":`, saveError.message)
          failedTerms.push({
            term: term.term,
            error: saveError.message
          })
          continue
        }

        if (savedTerm) {
          savedTerms.push(savedTerm)
          console.log(`✅ Saved "${term.term}" successfully`)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Error processing "${term.term}":`, errorMessage)
        failedTerms.push({
          term: term.term,
          error: errorMessage
        })
      }
    }

    console.log(`💾 Database processing complete:`)
    console.log(`   ✅ Saved: ${savedTerms.length} terms`)
    console.log(`   ⏭️ Skipped (duplicates): ${skippedTerms.length} terms`)
    console.log(`   ❌ Failed: ${failedTerms.length} terms`)
    
    if (failedTerms.length > 0) {
      console.log(`Failed terms:`, failedTerms.map(f => `"${f.term}": ${f.error}`).join(', '))
    }

    if (savedTerms.length === 0 && skippedTerms.length > 0) {
      console.log(`🟡 All generated terms already existed in database - no new terms saved`)
    }

    // Create category relationships for successfully saved terms
    if (savedTerms.length > 0) {
      console.log(`🔗 Creating category relationships for ${savedTerms.length} saved terms...`)
      const { data: categories } = await supabase
        .from('categories')
        .select('id, category_slug, category_title')

      if (categories) {
        const categoryRelationships = []
        
        for (const savedTerm of savedTerms) {
          // Find the original generated term that matches this saved term
          const originalTerm = generatedTerms.find(gt => gt.term === savedTerm.term)
          if (!originalTerm) {
            console.warn(`⚠️ Could not find original term data for: ${savedTerm.term}`)
            continue
          }

          const categorySlug = originalTerm?.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          
          // Guard against undefined categorySlug
          if (!categorySlug) {
            console.warn(`⚠️ No category slug for term: ${savedTerm.term}`)
            continue
          }
          
          const matchingCategory = categories.find((cat: any) => 
            cat.category_slug === categorySlug ||
            cat.category_title.toLowerCase().includes(categorySlug.replace('-', ' '))
          )
          
          if (matchingCategory) {
            categoryRelationships.push({
              term_id: savedTerm.id,
              category_id: matchingCategory.id,
              is_primary: true,
              relevance_score: 8
            })
          } else {
            console.warn(`⚠️ No matching category found for slug: ${categorySlug}`)
          }
        }
        
        if (categoryRelationships.length > 0) {
          const { error: categoryError } = await supabase
            .from('glossary_term_categories')
            .insert(categoryRelationships)
          
          if (categoryError) {
            console.warn(`⚠️ Error creating category relationships:`, categoryError)
          } else {
            console.log(`✅ Created ${categoryRelationships.length} category relationships`)
          }
        }
      }
    }

    // Combine all skipped terms
    const allSkippedTerms = [...alreadyExists, ...duplicates, ...skippedTerms]

    console.log(`🎉 Generation complete: ${savedTerms.length} terms saved using ${usedProvider}`)
    console.log(`📊 Final stats: Requested=${requestedCount}, Generated=${generatedTerms.length}, Unique=${uniqueTerms.length}, Saved=${savedTerms.length}, Skipped=${allSkippedTerms.length}, Failed=${failedTerms.length}`)

    return NextResponse.json({
      success: true,
      message: `Generated ${savedTerms.length} new terms successfully (${allSkippedTerms.length} skipped: ${duplicates.length} duplicates + ${alreadyExists.length} pre-existing, ${failedTerms.length} failed)`,
      terms: savedTerms,
      provider: usedProvider,
      generation_type: validatedData.type,
      stats: {
        requested: requestedCount,
        generated: generatedTerms.length,
        unique_new: uniqueTerms.length,
        saved: savedTerms.length,
        skipped: allSkippedTerms.length,
        failed: failedTerms.length,
        duplicates_in_generation: duplicates.length,
        already_existed: alreadyExists.length
      },
      skipped_terms: allSkippedTerms,
      failed_terms: failedTerms
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in AI glossary generation:', error)
    return NextResponse.json({ 
      error: 'Failed to generate glossary terms',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}