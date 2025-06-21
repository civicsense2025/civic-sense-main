import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { z } from 'zod'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validate OpenAI API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const GenerationRequestSchema = z.object({
  maxArticles: z.number().min(1).max(50).default(10),
  daysSinceCreated: z.number().min(0).max(30).default(7),
  categories: z.array(z.string()).optional(),
  forceGeneration: z.boolean().default(false),
  userId: z.string(),
  
  // Content generation controls
  questionsPerTopic: z.number().min(3).max(50).default(6),
  questionTypeDistribution: z.object({
    multipleChoice: z.number().min(0).max(100).default(60),
    trueFalse: z.number().min(0).max(100).default(25),
    shortAnswer: z.number().min(0).max(100).default(15),
    fillInBlank: z.number().min(0).max(100).default(0),
    matching: z.number().min(0).max(100).default(0)
  }).default({
    multipleChoice: 60,
    trueFalse: 25,
    shortAnswer: 15,
    fillInBlank: 0,
    matching: 0
  }),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100).default(30),
    medium: z.number().min(0).max(100).default(50),
    hard: z.number().min(0).max(100).default(20)
  }).default({
    easy: 30,
    medium: 50,
    hard: 20
  }),
  
  // Scheduling options
  generateForFutureDates: z.boolean().default(false),
  startDate: z.string().optional(),
  daysToGenerate: z.number().min(1).max(30).default(1),
  scheduleRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'every12hours', 'weekly']).default('daily')
})

interface NewsArticle {
  id: string
  url: string
  title: string
  description: string
  domain: string
  published_time?: string
  credibility_score?: number
  bias_rating?: string
  author?: string
  og_site_name?: string
}

interface ExistingContent {
  topics: Array<{
    topic_id: string
    topic_title: string
    description: string
    categories: any
  }>
  topicTitles: Set<string>
  topicKeywords: Set<string>
}

interface GeneratedContent {
  topic: {
    topic_id: string
    topic_title: string
    description: string
    why_this_matters: string
    emoji: string
    categories: string[]
    source_analysis_id: string
    ai_extraction_metadata: any
    date?: string
    day_of_week?: string
  }
  questions: Array<{
    topic_id: string
    question_number: number
    question_type: string
    category: string
    question: string
    option_a?: string
    option_b?: string
    option_c?: string
    option_d?: string
    correct_answer: string
    hint: string
    explanation: string
    tags: string[]
    sources: any
    difficulty_level: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Early validation of required environment variables
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY environment variable'
      }, { status: 500 })
    }

    const body = await request.json()
    const { 
      maxArticles, 
      daysSinceCreated, 
      categories, 
      forceGeneration, 
      userId,
      questionsPerTopic,
      questionTypeDistribution,
      difficultyDistribution,
      generateForFutureDates,
      startDate,
      daysToGenerate,
      scheduleRecurring,
      recurringInterval
    } = GenerationRequestSchema.parse(body)

    console.log('🚀 Starting content generation from news articles...')
    console.log('🔑 OpenAI API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No')

    // Step 1: Fetch recent news articles from source_metadata
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceCreated)

    const { data: newsArticles, error: articlesError } = await supabase
      .from('source_metadata')
      .select('*')
      .gte('last_fetched_at', cutoffDate.toISOString())
      .gte('credibility_score', 70) // Only use credible sources
      .not('title', 'is', null)
      .not('description', 'is', null)
      .order('credibility_score', { ascending: false })
      .limit(maxArticles * 2) // Get more than needed for filtering

    if (articlesError) {
      throw new Error(`Failed to fetch news articles: ${articlesError.message}`)
    }

    if (!newsArticles || newsArticles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No suitable news articles found in the specified time range',
        articlesFound: 0
      })
    }

    console.log(`📰 Found ${newsArticles.length} news articles to analyze`)

    // Step 2: Filter for civic-relevant articles
    const civicArticles = newsArticles.filter(article => 
      isCivicRelevant(article.title + ' ' + (article.description || ''))
    ).slice(0, maxArticles)

    console.log(`🎯 Filtered to ${civicArticles.length} civic-relevant articles`)

    // Step 3: Get existing content to avoid duplicates
    const existingContent = await getExistingContent()
    console.log(`📚 Found ${existingContent.topics.length} existing topics to compare against`)

    // Step 4: Generate content for articles across multiple days if requested
    const generatedContent: GeneratedContent[] = []
    const errors: Array<{ article: string, error: string }> = []
    
    // Calculate target dates for generation
    const targetDates: string[] = []
    if (generateForFutureDates) {
      const baseDate = startDate ? new Date(startDate) : new Date()
      for (let i = 0; i < daysToGenerate; i++) {
        const targetDate = new Date(baseDate)
        targetDate.setDate(baseDate.getDate() + i)
        targetDates.push(targetDate.toISOString().split('T')[0])
      }
    } else {
      targetDates.push(new Date().toISOString().split('T')[0])
    }

    console.log(`📅 Generating content for ${targetDates.length} date(s): ${targetDates.join(', ')}`)

    // Distribute articles across target dates
    const articlesPerDate = Math.max(1, Math.floor(civicArticles.length / targetDates.length))
    
    for (let dateIndex = 0; dateIndex < targetDates.length; dateIndex++) {
      const targetDate = targetDates[dateIndex]
      const dayOfWeek = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })
      
      // Get articles for this date
      const startIdx = dateIndex * articlesPerDate
      const endIdx = dateIndex === targetDates.length - 1 
        ? civicArticles.length 
        : (dateIndex + 1) * articlesPerDate
      const dateArticles = civicArticles.slice(startIdx, endIdx)
      
      console.log(`📅 Processing ${dateArticles.length} articles for ${targetDate} (${dayOfWeek})`)

      for (const article of dateArticles) {
        try {
          console.log(`🔄 Processing: ${article.title.substring(0, 50)}...`)
          
          // Check if content already exists (unless forcing)
          if (!forceGeneration && contentAlreadyExists(article, existingContent)) {
            console.log(`⏭️ Skipping: Similar content already exists`)
            continue
          }

          const generated = await generateContentFromArticle(
            article, 
            existingContent, 
            {
              targetDate,
              dayOfWeek,
              questionsPerTopic,
              questionTypeDistribution,
              difficultyDistribution
            }
          )
          
          if (generated) {
            generatedContent.push(generated)
            console.log(`✅ Generated topic: ${generated.topic.topic_title} for ${targetDate}`)
          }

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ article: article.title, error: errorMsg })
          console.error(`❌ Error processing ${article.title}:`, errorMsg)
        }
      }
    }

    // Step 5: Save generated content to database
    const saveResults = await saveGeneratedContent(generatedContent, userId)

    console.log(`🎉 Content generation complete!`)

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedContent.length} new topics from ${civicArticles.length} articles`,
      results: {
        articlesProcessed: civicArticles.length,
        topicsGenerated: generatedContent.length,
        questionsGenerated: generatedContent.reduce((sum, content) => sum + content.questions.length, 0),
        saveResults,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Error in content generation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

async function getExistingContent(): Promise<ExistingContent> {
  const { data: topics } = await supabase
    .from('question_topics')
    .select('topic_id, topic_title, description, categories')
    .eq('is_active', true)

  const topicTitles = new Set<string>()
  const topicKeywords = new Set<string>()

  if (topics) {
    topics.forEach(topic => {
      topicTitles.add(topic.topic_title.toLowerCase())
      
      // Extract keywords from titles and descriptions
      const text = `${topic.topic_title} ${topic.description}`.toLowerCase()
      const keywords = text.match(/\b\w{4,}\b/g) || []
      keywords.forEach(keyword => topicKeywords.add(keyword))
    })
  }

  return {
    topics: topics || [],
    topicTitles,
    topicKeywords
  }
}

function isCivicRelevant(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  const civicKeywords = [
    // Government institutions
    'congress', 'senate', 'house', 'supreme court', 'federal', 'government',
    'biden', 'trump', 'harris', 'president', 'administration', 'cabinet',
    'governor', 'mayor', 'legislature', 'judicial', 'executive',
    
    // Political processes
    'election', 'voting', 'ballot', 'campaign', 'policy', 'legislation',
    'bill', 'law', 'regulation', 'oversight', 'hearing', 'committee',
    
    // Civic issues
    'democracy', 'constitution', 'rights', 'civil rights', 'due process',
    'immigration', 'healthcare', 'education', 'climate', 'economy',
    'budget', 'taxes', 'spending', 'deficit', 'infrastructure',
    
    // Political parties and movements
    'republican', 'democratic', 'gop', 'conservative', 'liberal',
    'progressive', 'partisan', 'bipartisan'
  ]
  
  return civicKeywords.some(keyword => lowerText.includes(keyword))
}

function contentAlreadyExists(article: NewsArticle, existing: ExistingContent): boolean {
  const articleTitle = article.title.toLowerCase()
  const articleText = `${article.title} ${article.description}`.toLowerCase()
  
  // Check for exact title matches
  if (existing.topicTitles.has(articleTitle)) {
    return true
  }
  
  // Check for substantial keyword overlap
  const articleKeywords = new Set(articleText.match(/\b\w{4,}\b/g) || [])
  const overlapCount = Array.from(articleKeywords).filter(keyword => 
    existing.topicKeywords.has(keyword)
  ).length
  
  // If more than 60% of keywords overlap, consider it duplicate
  const overlapRatio = overlapCount / Math.max(articleKeywords.size, 1)
  return overlapRatio > 0.6
}

interface GenerationOptions {
  targetDate: string
  dayOfWeek: string
  questionsPerTopic: number
  questionTypeDistribution: {
    multipleChoice: number
    trueFalse: number
    shortAnswer: number
    fillInBlank: number
    matching: number
  }
  difficultyDistribution: {
    easy: number
    medium: number
    hard: number
  }
}

async function generateContentFromArticle(
  article: NewsArticle, 
  existingContent: ExistingContent,
  options: GenerationOptions
): Promise<GeneratedContent | null> {
  
  const prompt = `You are CivicSense's AI content architect. Generate civic education content from this news article that follows our brand principles:

**Brand Principles:**
- Truth over comfort: Present facts even when they challenge popular narratives
- Clarity over politeness: Cut through political speak and institutional doublespeak  
- Action over passive consumption: Connect learning to meaningful civic participation
- Systems thinking: Address root causes rather than symptoms
- Current events priority: Focus on what's happening NOW in 2024-2025

**NEWS ARTICLE:**
Title: ${article.title}
Source: ${article.og_site_name || article.domain}
Description: ${article.description}
URL: ${article.url}
Published: ${article.published_time || 'Recent'}
Credibility Score: ${article.credibility_score || 'Unknown'}

**CRITICAL: PRIORITIZE CURRENT EVENTS AND RECENT DEVELOPMENTS**
- Start with what's happening in 2025 and recent developments from 2024-2025
- Connect current events to broader patterns, but lead with the present
- Show how recent actions reveal ongoing power dynamics
- Focus on immediate implications for citizens

**TASK:** Generate ONE comprehensive topic with EXACTLY ${options.questionsPerTopic} questions that:

1. **Topic Requirements:**
- Focus on HOW power actually works NOW, not just what happened historically
- Connect to actionable civic participation relevant to current events
- Use format: "How [System/Process] Actually Works" or "What They Don't Want You to Know About [Issue]"
- Include specific "why this matters" that shows real impact on citizens' lives
- Choose appropriate emoji that represents power/systems/action
- Set date to: ${options.targetDate} (${options.dayOfWeek})

2. **Question Requirements:**
- EXACTLY ${options.questionsPerTopic} questions total
- Question type distribution: ${options.questionTypeDistribution.multipleChoice}% multiple choice, ${options.questionTypeDistribution.trueFalse}% true/false, ${options.questionTypeDistribution.shortAnswer}% short answer${options.questionTypeDistribution.fillInBlank > 0 ? `, ${options.questionTypeDistribution.fillInBlank}% fill-in-blank` : ''}
- Difficulty levels: ${options.difficultyDistribution.easy}% easy (recall), ${options.difficultyDistribution.medium}% medium (analysis), ${options.difficultyDistribution.hard}% hard (evaluation)
- Focus on current civic mechanisms and recent developments, not just historical context
- Include questions about: current power structures, recent policy changes, current institutional processes, recent precedents
- Each question must teach something actionable about how democracy works NOW
- Use direct imperative language in explanations: "Watch for", "Track", "Monitor", "Notice" - NEVER "you can/should"

3. **Content Standards:**
- Write at 8th-10th grade level but don't dumb down concepts
- Use specific names, dates, and concrete details from recent news (2024-2025)
- Connect abstract concepts to daily life impact in the current political climate
- Include both immediate and long-term consequences of recent events
- Be factual and non-partisan while being direct about current power dynamics

4. **Enhanced Metadata Requirements:**
- Temporal Distribution: Aim for 70% current events (2024-2025), 20% recent history (last 5 years), 10% historical context
- Skill Focus Areas: Track proficiency levels (1=Basic, 2=Intermediate, 3=Advanced) for:
  * Critical Analysis
  * Systems Thinking
  * Power Structure Analysis
  * Civic Action Planning
- Key Figures: For each mentioned political figure, include:
  * Current position/role
  * Relevance to the topic
  * First and last appearance dates
- Policy Areas: Tag each question with relevant policy domains
- Bias Analysis:
  * Political balance (-1 to 1 scale)
  * Factual accuracy (0 to 1 scale)
  * Sensationalism level (0 to 1 scale)
  * Source diversity (0 to 1 scale)
- Content Timeline:
  * Track start and end dates
  * Flag ongoing developments
- Source Quality:
  * Government sources (%)
  * Academic sources (%)
  * News sources (%)
  * Primary sources (%)

5. **Avoid Duplicating Existing Content:**
Here are some existing topic titles to avoid repeating:
${Array.from(existingContent.topicTitles).slice(0, 10).join(', ')}

Return JSON in this exact format:
{
  "topic": {
    "topic_id": "slug-from-article-main-theme",
    "topic_title": "How [System] Actually Works: [Specific Situation]",
    "description": "Brief explanation of the power dynamics revealed...",
    "why_this_matters": "<ul><li><strong>Your [Right/Issue]:</strong> Specific impact on daily life</li><li><strong>Your [Power]:</strong> What you can do about it</li><li><strong>Your [System]:</strong> How this reveals larger patterns</li></ul>",
    "emoji": "⚡",
    "categories": ["Government", "Constitutional Law", "Power Dynamics"],
    "source_analysis_id": "${article.id}",
    "metadata": {
      "temporal_distribution": {
        "current_events": 70,
        "recent_history": 20,
        "historical": 10
      },
      "skill_focus_areas": [
        {
          "name": "Critical Analysis",
          "proficiency_level": 2,
          "frequency": 40
        }
      ],
      "key_figures": [
        {
          "name": "Full Name",
          "role": "Current Position",
          "current_position": "Specific Title",
          "relevance": "Why this person matters",
          "first_appearance_date": "YYYY-MM-DD",
          "last_appearance_date": "YYYY-MM-DD"
        }
      ],
      "policy_areas": ["Area1", "Area2"],
      "bias_analysis": {
        "political_balance": 0,
        "factual_accuracy": 0.9,
        "sensationalism_level": 0.1,
        "source_diversity": 0.8,
        "citation_quality": {
          "government_sources": 0.3,
          "academic_sources": 0.3,
          "news_sources": 0.2,
          "primary_sources": 0.2
        }
      },
      "content_timeline": {
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "is_ongoing": true
      }
    }
  },
  "questions": [
    {
      "question_number": 1,
      "question_type": "multiple_choice",
      "category": "Government",
      "question": "Which institution has the primary authority to...",
      "option_a": "Executive Branch",
      "option_b": "Legislative Branch", 
      "option_c": "Judicial Branch",
      "option_d": "State Governments",
      "correct_answer": "option_b",
      "hint": "Think about which branch creates laws versus enforces them",
      "explanation": "The legislative branch holds this power because the Constitution specifically grants Congress authority over... This matters because when you contact your representatives about this issue, you're targeting the right institution.",
      "tags": ["separation of powers", "congressional authority", "citizen advocacy"],
      "sources": [
        {"name": "U.S. Constitution Article I", "url": "https://constitution.congress.gov/browse/article-1/"},
        {"name": "${article.title} - ${article.og_site_name || article.domain}", "url": "${article.url}"}
      ],
      "difficulty_level": 2,
      "metadata": {
        "skill_focus": {
          "name": "Critical Analysis",
          "proficiency_level": 2
        },
        "key_figures": [
          {
            "name": "Full Name",
            "role": "Current Position",
            "relevance": "Why this person matters"
          }
        ],
        "policy_areas": ["Area1"],
        "temporal_focus": "current_events"
      }
    }
  ]
}`

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are an expert civic educator who creates content that reveals how power actually works in American government. You write in a direct, engaging style that connects current events to fundamental democratic processes and citizen action."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  } catch (error: any) {
    // Handle OpenAI API errors specifically
    if (error?.status === 401) {
      throw new Error('OpenAI API authentication failed - please check your API key')
    } else if (error?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded - please try again later')
    } else if (error?.status === 500) {
      throw new Error('OpenAI API server error - please try again later')
    } else {
      throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`)
    }
  }

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No content generated from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    
    // Validate and enhance the generated content
    if (!parsed.topic || !parsed.questions) {
      throw new Error('Invalid generated content structure')
    }

    // Add metadata and IDs
    const topicId = parsed.topic.topic_id
    const enhancedContent: GeneratedContent = {
      topic: {
        ...parsed.topic,
        date: options.targetDate,
        day_of_week: options.dayOfWeek,
        ai_extraction_metadata: {
          generated_at: new Date().toISOString(),
          source_url: article.url,
          source_domain: article.domain,
          source_credibility: article.credibility_score,
          ai_model: 'gpt-4o',
          generation_method: 'news_analysis',
          generation_options: {
            questionsPerTopic: options.questionsPerTopic,
            questionTypeDistribution: options.questionTypeDistribution,
            difficultyDistribution: options.difficultyDistribution
          }
        }
      },
      questions: parsed.questions.map((q: any, index: number) => ({
        ...q,
        topic_id: topicId,
        question_number: index + 1,
        sources: q.sources || [
          {
            name: `${article.title} - ${article.og_site_name || article.domain}`,
            url: article.url
          }
        ]
      }))
    }

    return enhancedContent

  } catch (parseError) {
    throw new Error(`Failed to parse generated content: ${parseError}`)
  }
}

async function saveGeneratedContent(
  generatedContent: GeneratedContent[], 
  userId: string
): Promise<{ topicsSaved: number, questionsSaved: number, errors: string[] }> {
  
  let topicsSaved = 0
  let questionsSaved = 0
  const errors: string[] = []

  for (const content of generatedContent) {
    try {
      // Save topic
      const { data: topicData, error: topicError } = await supabase
        .from('question_topics')
        .insert({
          topic_id: content.topic.topic_id,
          topic_title: content.topic.topic_title,
          description: content.topic.description,
          why_this_matters: content.topic.why_this_matters,
          emoji: content.topic.emoji,
          categories: content.topic.categories,
          source_analysis_id: content.topic.source_analysis_id,
          ai_extraction_metadata: content.topic.ai_extraction_metadata,
          date: content.topic.date || new Date().toISOString().split('T')[0],
          day_of_week: content.topic.day_of_week || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          is_active: false, // Set to false initially for review
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (topicError) {
        throw new Error(`Topic save error: ${topicError.message}`)
      }

      topicsSaved++
      console.log(`💾 Saved topic: ${content.topic.topic_title}`)

      // Save questions
      const questionsToInsert = content.questions.map(q => ({
        topic_id: content.topic.topic_id,
        question_number: q.question_number,
        question_type: q.question_type,
        category: q.category,
        question: q.question,
        option_a: q.option_a || null,
        option_b: q.option_b || null,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_answer: q.correct_answer,
        hint: q.hint,
        explanation: q.explanation,
        tags: q.tags,
        sources: q.sources,
        difficulty_level: q.difficulty_level || 2,
        is_active: false, // Set to false initially for review
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        throw new Error(`Questions save error: ${questionsError.message}`)
      }

      questionsSaved += content.questions.length
      console.log(`💾 Saved ${content.questions.length} questions for topic`)

    } catch (error) {
      const errorMsg = `Failed to save ${content.topic.topic_title}: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  return { topicsSaved, questionsSaved, errors }
} 