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
- PERSONAL STAKES: Show how this affects daily life, not just theory
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

<json_output_format>
You must return a valid JSON object with this EXACT structure. No additional text or explanation outside the JSON:

{
  "terms": [
    {
      "term": "Precise civic concept name",
      "definition": "Complete, standalone explanation (2-3 sentences max)",
      "part_of_speech": "noun",
      "examples": [
        "Extended example with full context",
        "Another complete example"
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

CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no text before or after.
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
 * Sends a Server-Sent Event for real-time progress tracking
 */
function sendProgressUpdate(
  controller: ReadableStreamDefaultController, 
  type: 'processing' | 'saved' | 'skipped' | 'failed' | 'complete',
  data: {
    termIndex?: number
    totalTerms?: number
    termName?: string
    error?: string
    stats?: any
  }
) {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  }
  
  const message = `data: ${JSON.stringify(event)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
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
 * Handles AI generation with real-time streaming progress updates
 */
async function handleStreamingGeneration(supabase: any, validatedData: any, user: any) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Build prompt
        const prompt = buildPrompt(validatedData.type, validatedData)
        const includeWebSearch = validatedData.options?.include_web_search ?? true
        const requestedCount = validatedData.options?.count || 5

        console.log(`📝 STREAMING: ${validatedData.type}, Provider: ${validatedData.provider}, Requested: ${requestedCount} terms`)

        // Send initial progress
        sendProgressUpdate(controller, 'processing', {
          termIndex: 0,
          totalTerms: requestedCount,
          termName: 'Starting AI generation...'
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
          
          console.log(`✅ Generated ${generatedTerms.length} terms with ${usedProvider} (requested: ${requestedCount})`)
          
          if (generatedTerms.length > requestedCount) {
            generatedTerms.length = requestedCount
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

        // Process terms for database schema
        const processedTerms = generatedTerms.map((term) => ({
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

        // Process terms one by one with streaming updates
        const savedTerms: any[] = []
        const skippedTerms: string[] = []
        const failedTerms: Array<{term: string, error: string}> = []

        for (let i = 0; i < processedTerms.length; i++) {
          const term = processedTerms[i]
          
          // Send processing update
          sendProgressUpdate(controller, 'processing', {
            termIndex: i + 1,
            totalTerms: processedTerms.length,
            termName: term.term
          })

          try {
            console.log(`🔍 STREAMING DB: Checking if "${term.term}" already exists...`)
            
            // Check if this specific term already exists
            const { data: existingTerm, error: checkError } = await supabase
              .from('glossary_terms')
              .select('term')
              .eq('term', term.term)
              .single()

            if (checkError && checkError.code !== 'PGRST116') {
              // PGRST116 is "not found" which is expected, anything else is an error
              console.error(`❌ STREAMING DB: Error checking existence for "${term.term}":`, checkError)
              throw new Error(`Database check failed: ${checkError.message}`)
            }

            if (existingTerm) {
              console.log(`⏭️ STREAMING DB: "${term.term}" already exists, skipping...`)
              skippedTerms.push(term.term)
              sendProgressUpdate(controller, 'skipped', {
                termIndex: i + 1,
                totalTerms: processedTerms.length,
                termName: term.term
              })
              continue
            }

            console.log(`💾 STREAMING DB: Saving new term "${term.term}"...`)
            
            // Save this individual term - FORCE COMMIT
            const { data: savedTerm, error: saveError } = await supabase
              .from('glossary_terms')
              .insert([term])
              .select()
              .single()

            if (saveError) {
              console.error(`❌ STREAMING DB: Failed to save "${term.term}":`, saveError)
              failedTerms.push({
                term: term.term,
                error: saveError.message
              })
              sendProgressUpdate(controller, 'failed', {
                termIndex: i + 1,
                totalTerms: processedTerms.length,
                termName: term.term,
                error: saveError.message
              })
              continue
            }

            if (savedTerm) {
              console.log(`✅ STREAMING DB: Successfully saved "${term.term}" with ID: ${savedTerm.id}`)
              savedTerms.push(savedTerm)
              sendProgressUpdate(controller, 'saved', {
                termIndex: i + 1,
                totalTerms: processedTerms.length,
                termName: term.term
              })
              
              // FORCE VERIFY the save by immediately checking if it exists
              const { data: verifyTerm } = await supabase
                .from('glossary_terms')
                .select('id, term')
                .eq('id', savedTerm.id)
                .single()
              
              if (verifyTerm) {
                console.log(`🔒 STREAMING DB: Verified "${term.term}" is saved with ID: ${verifyTerm.id}`)
              } else {
                console.error(`⚠️ STREAMING DB: Failed to verify "${term.term}" was saved!`)
              }
            } else {
              console.error(`⚠️ STREAMING DB: No savedTerm returned for "${term.term}" despite no error`)
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            failedTerms.push({
              term: term.term,
              error: errorMessage
            })
            sendProgressUpdate(controller, 'failed', {
              termIndex: i + 1,
              totalTerms: processedTerms.length,
              termName: term.term,
              error: errorMessage
            })
          }
        }

        console.log(`🎉 STREAMING COMPLETE: Processing finished`)
        console.log(`   📊 Requested: ${requestedCount}`)
        console.log(`   🤖 Generated: ${generatedTerms.length}`)
        console.log(`   ✅ Saved: ${savedTerms.length}`)
        console.log(`   ⏭️ Skipped: ${skippedTerms.length}`)
        console.log(`   ❌ Failed: ${failedTerms.length}`)
        console.log(`   🏭 Provider: ${usedProvider}`)
        
        if (savedTerms.length > 0) {
          console.log(`   💾 Saved terms:`, savedTerms.map(t => `"${t.term}" (${t.id})`).join(', '))
        }
        if (skippedTerms.length > 0) {
          console.log(`   ⏭️ Skipped terms:`, skippedTerms.join(', '))
        }
        if (failedTerms.length > 0) {
          console.log(`   ❌ Failed terms:`, failedTerms.map(f => `"${f.term}": ${f.error}`).join(', '))
        }

        // FINAL VERIFICATION: Double-check all "saved" terms actually exist in DB
        console.log(`🔍 FINAL VERIFICATION: Checking ${savedTerms.length} allegedly saved terms...`)
        const finalVerificationCount = await verifyTermsInDatabase(supabase, savedTerms)
        
        if (finalVerificationCount !== savedTerms.length) {
          console.error(`⚠️ VERIFICATION FAILED: Expected ${savedTerms.length} terms in DB, found ${finalVerificationCount}`)
        } else {
          console.log(`✅ VERIFICATION PASSED: All ${finalVerificationCount} terms confirmed in database`)
        }

        // Send completion update
        sendProgressUpdate(controller, 'complete', {
          stats: {
            requested: requestedCount,
            generated: generatedTerms.length,
            saved: savedTerms.length,
            skipped: skippedTerms.length,
            failed: failedTerms.length,
            provider: usedProvider,
            verifiedInDB: finalVerificationCount
          }
        })

        controller.close()

      } catch (error) {
        console.error('Streaming generation error:', error)
        sendProgressUpdate(controller, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
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
// ROBUST JSON EXTRACTION AND PARSING
// ============================================================================

/**
 * Attempts to repair incomplete JSON by adding missing closing braces/brackets
 */
function repairTruncatedJson(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Count open vs closed braces and brackets
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escapeNext = false;
  
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
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceDepth++;
      else if (char === '}') braceDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
    }
  }
  
  // Add missing closing characters
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
 * Robust JSON extractor that handles code fences, preambles, truncation, and trailing commas
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

  // 3️⃣ Try progressive parsing strategies
  const strategies = [
    // Strategy 1: Parse as-is
    () => JSON.parse(candidate),
    
    // Strategy 2: Repair truncated JSON
    () => {
      console.log('Attempting truncated JSON repair...');
      const repaired = repairTruncatedJson(candidate);
      return JSON.parse(repaired);
    },
    
    // Strategy 3: Clean trailing commas and parse
    () => {
      console.log('Attempting comma cleanup...');
      const cleaned = candidate
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/,+/g, ',') // Remove duplicate commas
        .replace(/([}\]])(\s*)([{\[])/g, '$1,$2$3'); // Add missing commas between objects
      return JSON.parse(cleaned);
    },
    
    // Strategy 4: Extract just the terms array if main object fails
    () => {
      console.log('Attempting terms array extraction...');
      const termsMatch = candidate.match(/"terms"\s*:\s*\[([\s\S]*)\]/);
      if (termsMatch) {
        const termsArray = `[${termsMatch[1]}]`;
        const repaired = repairTruncatedJson(termsArray);
        const parsed = JSON.parse(repaired);
        return { terms: parsed };
      }
      throw new Error('No terms array found');
    },
    
    // Strategy 5: Use jsonrepair for tolerant JSON fixing
    () => {
      console.log('Attempting jsonrepair...');
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    }
  ];

  // Try each strategy in order
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      console.log(`✅ JSON parsing successful with strategy ${i + 1}`);
      return result;
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
      if (i === strategies.length - 1) {
        // Last strategy failed
        console.error('All parsing strategies failed');
        console.error('Final candidate (first 1000 chars):', candidate.substring(0, 1000));
        throw new Error(`All JSON parsing strategies failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  throw new Error('Unexpected end of parsing strategies');
}

// Simplified term generation with Claude
async function generateWithAnthropic(prompt: string, includeWebSearch: boolean = true): Promise<any[]> {
  try {
    const systemPrompt = includeWebSearch 
      ? `${CIVICSENSE_STANDARDS}\n\nIMPORTANT: Use web search to verify facts and find current examples for each term you generate.`
      : CIVICSENSE_STANDARDS

    // Check if this is a large request that should be batched
    const countMatch = prompt.match(/Generate (\d+) new civic education terms/);
    const requestedCount = countMatch ? parseInt(countMatch[1]) : 5;
    
    if (requestedCount > 10) {
      console.log(`📦 Large Claude request (${requestedCount} terms). Processing in batches to avoid truncation...`);
      return await generateClaudeInBatches(prompt, systemPrompt, requestedCount);
    }

    const response = await anthropic.messages.create({
      model: getValidatedModelName('anthropic'),
      max_tokens: 8000, // Increased for larger requests like 50 terms
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

    console.log('Raw Claude response preview:', content.substring(0, 300));
    console.log('Response length:', content.length, 'tokens used:', response.usage?.output_tokens || 'unknown');

    // Use robust JSON extraction
    try {
      const parsed = extractJson(content)
      const terms = parsed.terms || [parsed]
      console.log(`✅ Successfully extracted ${terms.length} terms from Claude`)
      return terms
    } catch (extractError) {
      // Check if this looks like truncation
      if (content.length > 10000 && extractError instanceof Error && extractError.message.includes('parsing failed')) {
        console.warn('⚠️ Possible truncation detected. Retrying with smaller batch...');
        if (requestedCount > 5) {
          return await generateClaudeInBatches(prompt, systemPrompt, requestedCount);
        }
      }
      
      console.error('❌ JSON extraction failed:', extractError)
      throw new Error(`Failed to extract JSON: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Anthropic generation error:', error)
    throw new Error('Failed to generate terms with Anthropic')
  }
}

// Helper function to batch Claude requests
async function generateClaudeInBatches(prompt: string, systemPrompt: string, requestedCount: number): Promise<any[]> {
  const batchSize = 8; // Conservative batch size for Claude
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
    
    console.log(`Processing Claude batch ${i + 1}/${batches}: ${batchCount} terms`);
    
    try {
      const response = await anthropic.messages.create({
        model: getValidatedModelName('anthropic'),
        max_tokens: 6000, // Smaller for batched requests
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
      const parsed = extractJson(content)
      const batchTerms = parsed.terms || [parsed]
      allTerms.push(...batchTerms);
      
      console.log(`✅ Claude batch ${i + 1}/${batches} complete: ${batchTerms.length} terms`);
      
      // Small delay between batches to avoid rate limits
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (batchError) {
      console.error(`❌ Claude batch ${i + 1} failed:`, batchError);
      // Continue with other batches rather than failing completely
    }
  }
  
  console.log(`Claude batching complete: ${allTerms.length} total terms`);
  return allTerms;
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

    // Process terms for database schema
    const processedTerms = generatedTerms.map((term) => ({
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
          
          const matchingCategory = categories.find(cat => 
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

    console.log(`🎉 Generation complete: ${savedTerms.length} terms saved using ${usedProvider}`)
    console.log(`📊 Final stats: Requested=${requestedCount}, Generated=${generatedTerms.length}, Saved=${savedTerms.length}, Skipped=${skippedTerms.length}, Failed=${failedTerms.length}`)

    return NextResponse.json({
      success: true,
      message: `Generated ${savedTerms.length} terms successfully (${skippedTerms.length} skipped, ${failedTerms.length} failed)`,
      terms: savedTerms,
      provider: usedProvider,
      generation_type: validatedData.type,
      stats: {
        requested: requestedCount,
        generated: generatedTerms.length,
        saved: savedTerms.length,
        skipped: skippedTerms.length,
        failed: failedTerms.length
      },
      skipped_terms: skippedTerms,
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