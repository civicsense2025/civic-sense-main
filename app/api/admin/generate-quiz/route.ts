import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

// Import our existing generation and optimization logic
import { generateQuizContent, parseAIResponse, validateAndFixSources } from '@/scripts/generate-quiz-content'
import { CivicSenseContentOrchestrator } from '@/scripts/optimize-question-content'

// Create server-side Supabase client
const openai = new OpenAI()

const QuizGenerationSchema = z.object({
  articleId: z.string(),
  userId: z.string(),
  focusAreas: z.array(z.string()).optional().default(['power_dynamics', 'civic_impact', 'historical_context'])
})

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  category?: string
  content?: string
  relevanceScore?: number
  credibilityScore?: number
  biasRating?: string
  domain?: string
  author?: string
}

interface GenerationSettings {
  aiProvider: 'openai' | 'anthropic' | 'perplexity'
  model?: string
  questionCount: number
  enableWebSearch: boolean
  validateSources: boolean
  enforceLimits: boolean
  customPrompt?: string
  categories: string[]
}

interface GenerationRequest {
  article: NewsArticle
  settings: GenerationSettings
  user_id?: string
}

// Enhanced prompt for news-based quiz generation
function generateNewsQuizPrompt(article: NewsArticle, settings: GenerationSettings): string {
  const webSearchInstructions = settings.enableWebSearch ? `
🔍 MANDATORY WEB SEARCH REQUIREMENTS:

STEP 1: USE YOUR WEB SEARCH CAPABILITIES
- You MUST search the web for current information about this news article
- Search for related government documents, policy details, and expert analysis
- Find specific articles from major outlets: CNN, BBC, NPR, AP, Reuters, Politico
- Search for government sources from .gov sites: house.gov, senate.gov, whitehouse.gov
- Verify all information is current and accurate

STEP 2: SOURCE VALIDATION
- Every source URL MUST come from your actual web search results
- Use ONLY real URLs you found through web search
- Include exact article titles from your search results
- Double-check that URLs are accessible and contain relevant information
- Prioritize primary sources and official government documents

⚠️ CRITICAL: DO NOT use placeholder URLs, example URLs, or made-up links. Every source must be real and from your web search.
` : ''

  const customInstructions = settings.customPrompt ? `
CUSTOM INSTRUCTIONS:
${settings.customPrompt}
` : ''

  return `You are creating a comprehensive educational quiz for CivicSense, a civic education platform that transforms current events into actionable civic knowledge.

${webSearchInstructions}

## NEWS ARTICLE TO ANALYZE:
**Title:** ${article.title}
**Source:** ${article.source.name}
**Published:** ${article.publishedAt}
**Description:** ${article.description}
**URL:** ${article.url}
**Content:** ${article.content || 'Use web search to find full article content'}

## CRITICAL REQUIREMENTS:

### QUIZ FOCUS:
- Transform this specific news event into civic education content
- Connect current events to foundational civic knowledge and democratic principles
- Maintain 8th-10th grade reading level with conversational tone
- Be educational, balanced, non-partisan, accurate, and engaging
- Follow CivicSense brand voice: bold, direct, practical, and action-oriented

### QUESTION REQUIREMENTS (EXACTLY ${settings.questionCount} QUESTIONS):
Generate exactly ${settings.questionCount} questions with this distribution:
- 50% Multiple Choice questions
- 20% True or False questions  
- 15% Short Answer questions
- 10% Matching questions
- 5% Fill in Blank questions

### DIFFICULTY DISTRIBUTION:
- 20% Recall (basic facts, dates, names)
- 40% Comprehension (understanding processes, cause-effect)
- 30% Analysis (comparing perspectives, identifying patterns)
- 10% Evaluation (making judgments, predicting consequences)

### CONTENT QUALITY STANDARDS:
- Use specific names, dates, dollar amounts, vote counts, and legal citations from the article
- Connect abstract concepts to real consequences for citizens' daily lives
- Include precise details from the news event and related government actions
- Provide historical context that enriches current understanding
- EVERY explanation must connect to democratic participation, civic engagement, or citizen responsibility
- Use exactly 3-4 relevant tags per question (no more, no less)

### SOURCE REQUIREMENTS:
- Each question MUST have 2-3 specific, verifiable sources with REAL URLs
- Sources must be current, reliable, and directly related to the news topic
- Use primary sources: government documents, official statements, credible news
- Prioritize: CNN, BBC, NPR, Associated Press, Reuters, Politico, government sites (.gov)
- Format: [{"name": "Specific Article Title - Publication Name", "url": "https://actual-working-url.com/article"}]

### HINT REQUIREMENTS:
Write hints in plain 8th-grade language that guide without giving away the answer:
- "Think about which branch of government has the power to..."
- "Remember that federal courts can overturn state laws, but..."
- "Consider how this news event affects your daily life through..."
- "Look for the key word that describes when Congress can..."

### EXPLANATION REQUIREMENTS:
Write 2-3 conversational sentences that connect the answer to broader civic principles:
- Focus on WHY this matters to citizens and democracy
- Use "you" to make it personal and relevant
- Connect to real-world impact on people's lives
- Include voting, civic participation, or democratic accountability
- Avoid formulaic patterns like "This shows how..." or "This demonstrates..."

### CATEGORIES:
Use these exact categories based on the news content: ${settings.categories.join(', ')}

${customInstructions}

## RESPONSE FORMAT:
Return ONLY this JSON structure (no markdown, no additional text):

{
  "topic": "Specific title connecting news event to civic education",
  "issue": "Brief description of the news event",
  "description": "2-3 sentence summary explaining civic importance and citizen impact",
  "questions": [
    {
      "questionNumber": 1,
      "questionType": "Multiple Choice",
      "difficultyLevel": "Comprehension",
      "category": "Government",
      "question": "Based on this news event, how does [specific detail] affect your rights as a citizen?",
      "optionA": "Specific, detailed option with real facts",
      "optionB": "Correct answer with precise information from the article",
      "optionC": "Realistic distractor with specific information",
      "optionD": "Another detailed distractor",
      "correctAnswer": "Exact text matching one of the options",
      "hint": "Think about which constitutional principle protects citizens when...",
      "explanation": "This affects your daily life because [specific impact]. When you vote in future elections, you're choosing people who will handle similar situations affecting your community.",
      "tags": ["specific civic term", "news topic", "democratic process"],
      "sources": [
        {"name": "CNN Politics Coverage - CNN", "url": "https://www.cnn.com/politics/specific-article"},
        {"name": "House of Representatives Official Statement", "url": "https://www.house.gov/specific-statement"}
      ]
    }
  ]
}

## QUALITY VALIDATION:
- Each question must be tied to the specific news event
- All sources must be real, specific articles or documents from reliable outlets
- Explanations must connect to democratic participation and civic engagement
- Questions must test precise knowledge about the news event's civic implications
- Maintain perfect balance of question types and difficulty levels
- Hints must be helpful but not give away the answer
- Explanations must use varied, conversational language

Remember: Generate EXACTLY ${settings.questionCount} questions that transform this news event into actionable civic education.`
}

// Add schema validation
const QuizContentSchema = z.object({
  topic_id: z.string(),
  title: z.string(),
  description: z.string(),
  why_this_matters: z.string(),
  categories: z.array(z.string()),
  learning_objectives: z.array(z.string()),
  questions: z.array(
    z.object({
      text: z.string(),
      options: z.array(z.string()),
      correct_index: z.number(),
      analysis: z.string(),
      primary_source: z.string()
    })
  )
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    // Validate request
    const body = await req.json()
    const { articleId, userId, focusAreas } = QuizGenerationSchema.parse(body)
    
    // Get article from source_metadata
    const { data: article, error } = await supabase
      .from('source_metadata')
      .select('*')
      .eq('id', articleId)
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found', details: error?.message },
        { status: 404 }
      )
    }

    // Generate quiz content using CivicSense guidelines
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: `You are CivicSense's Quiz Architect. Generate civic education content that:
1. Explains HOW power is being exercised, not just what's happening
2. Connects to real-world civic actions users can take
3. Highlights systemic factors over individual actors
4. Uses primary sources and verifiable facts
5. Follows format: {
  "topic_id": "news-<shortened-title>",
  "title": "How [Current Event] Actually Works",
  "description": "Explanation of power dynamics in...",
  "why_this_matters": "This affects your [specific right/issue] because...",
  "categories": ["government", "systems"],
  "learning_objectives": ["Analyze power structures in...", "Identify leverage points for..."],
  "questions": [{
    "text": "Which branch of government holds primary authority over...",
    "options": ["Executive", "Legislative", "Judicial", "State"],
    "correct_index": 1,
    "analysis": "While the executive implements, the legislative branch...",
    "primary_source": "U.S. Constitution Article I"
  }]
}`
      }, {
        role: "user",
        content: `News Article:
Title: ${article.title}
Content: ${article.description}
Source: ${article.domain}

Generate quiz content focusing on: ${focusAreas.join(', ')}`
      }],
      response_format: { type: "json_object" }
    })

    const quizContent = JSON.parse(completion.choices[0].message.content!)

    // Validate and save to database
    const { error: dbError } = await supabase
      .from('question_topics')
      .insert({
        ...quizContent,
        source_metadata_id: articleId,
        generated_by: userId,
        generated_at: new Date().toISOString(),
        content_flags: {
          verified_sources: [article.url],
          needs_human_review: false
        }
      })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      quizId: quizContent.topic_id,
      article: article.title
    })

  } catch (error: unknown) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate quiz', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Fallback for non-streaming generation
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CivicSense Admin Quiz Generator API',
    version: '1.0.0',
    endpoints: {
      'POST /api/admin/generate-quiz': 'Generate quiz from news article (streaming)',
      'POST /api/admin/save-quiz': 'Save generated quiz to database'
    },
    requirements: {
      authentication: 'User ID required',
      permissions: 'Admin or content creator access',
      rate_limits: 'Max 10 generations per hour per user'
    }
  })
} 