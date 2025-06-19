import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { z } from 'zod'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Validation schema for preview requests
const PreviewRequestSchema = z.object({
  maxArticles: z.number().min(1).max(20).default(5),
  daysSinceCreated: z.number().min(0).max(30).default(7),
  questionsPerTopic: z.number().min(3).max(50).default(6),
  questionTypeDistribution: z.object({
    multipleChoice: z.number().min(0).max(100).default(60),
    trueFalse: z.number().min(0).max(100).default(25),
    shortAnswer: z.number().min(0).max(100).default(15),
    fillInBlank: z.number().min(0).max(100).default(0),
    matching: z.number().min(0).max(100).default(0)
  }).default({}),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100).default(30),
    medium: z.number().min(0).max(100).default(50),
    hard: z.number().min(0).max(100).default(20)
  }).default({}),
  categories: z.array(z.string()).default([]),
  userId: z.string().uuid(),
  includeAIGenerated: z.boolean().default(false), // Generate with AI or use templates
  targetDate: z.string().optional()
})

interface NewsArticle {
  id: string
  url: string
  title: string
  description: string
  domain: string
  credibility_score?: number
  bias_rating?: string
  published_time?: string
}

interface PreviewTopic {
  id: string
  title: string
  description: string
  category: string
  source: string
  credibilityScore: number
  estimatedQuestions: number
  difficulty: string
  civicActionSteps: string[]
  uncomfortableTruths: string[]
  powerDynamicsRevealed: string[]
  sampleQuestions: PreviewQuestion[]
}

interface PreviewQuestion {
  id: string
  type: string
  difficulty: string
  text: string
  options?: string[]
  correctAnswer?: number | string
  explanation: string
  civicAction: string
  uncomfortableTruth: string
  powerDynamicRevealed?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PreviewRequestSchema.parse(body)
    
    console.log('🔍 Generating content preview...')

    // Check cache first
    const cacheKey = generateCacheKey(validatedData)
    const cachedPreview = await getCachedPreview(cacheKey, validatedData.userId)
    
    if (cachedPreview) {
      console.log('📋 Returning cached preview')
      return NextResponse.json({
        success: true,
        preview: cachedPreview.preview_data,
        cached: true,
        generatedAt: cachedPreview.created_at,
        expiresAt: cachedPreview.expires_at
      })
    }

    // Generate new preview
    const preview = await generateContentPreview(validatedData)
    
    // Cache the preview
    await cachePreview(cacheKey, preview, validatedData)
    
    console.log('✅ Content preview generated successfully')
    
    return NextResponse.json({
      success: true,
      preview,
      cached: false,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating content preview:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Preview generation failed'
    }, { status: 500 })
  }
}

async function generateContentPreview(settings: z.infer<typeof PreviewRequestSchema>) {
  // Fetch recent news articles
  const articles = await fetchRecentArticles(settings)
  
  // Filter for civic relevance
  const civicArticles = articles.filter(article => 
    isCivicRelevant(article.title + ' ' + (article.description || ''))
  ).slice(0, settings.maxArticles)

  console.log(`📰 Found ${civicArticles.length} civic-relevant articles for preview`)

  // Generate preview topics
  const previewTopics: PreviewTopic[] = []
  
  for (let i = 0; i < Math.min(3, civicArticles.length); i++) {
    const article = civicArticles[i]
    
    if (settings.includeAIGenerated) {
      // Generate with AI
      const aiTopic = await generateAIPreviewTopic(article, settings, i + 1)
      if (aiTopic) previewTopics.push(aiTopic)
    } else {
      // Use template-based generation
      const templateTopic = generateTemplateTopic(article, settings, i + 1)
      previewTopics.push(templateTopic)
    }
  }

  // Generate overall statistics and recommendations
  const statistics = {
    articlesAnalyzed: civicArticles.length,
    topicsToGenerate: Math.min(settings.maxArticles, civicArticles.length),
    questionsToGenerate: Math.min(settings.maxArticles, civicArticles.length) * settings.questionsPerTopic,
    estimatedProcessingTime: Math.min(settings.maxArticles, civicArticles.length) * 45, // seconds
    contentQualityScore: calculateExpectedQualityScore(civicArticles),
    civicEducationValue: 'High - Reveals uncomfortable truths about power dynamics'
  }

  const recommendations = generateRecommendations(settings, civicArticles)

  return {
    statistics,
    sampleTopics: previewTopics,
    sampleArticles: civicArticles.slice(0, 5).map(article => ({
      title: article.title,
      source: article.domain,
      credibilityScore: article.credibility_score,
      civicRelevance: assessCivicRelevance(article)
    })),
    generationSettings: {
      aiModel: 'gpt-4-turbo', // Default model for generation
      questionTypes: settings.questionTypeDistribution,
      difficultyLevels: settings.difficultyDistribution,
      targetDate: settings.targetDate || new Date().toISOString().split('T')[0]
    },
    recommendations,
    qualityIndicators: {
      uncomfortableTruthsExpected: previewTopics.reduce((sum, topic) => sum + topic.uncomfortableTruths.length, 0),
      powerDynamicsRevealed: previewTopics.reduce((sum, topic) => sum + topic.powerDynamicsRevealed.length, 0),
      civicActionsGenerated: previewTopics.reduce((sum, topic) => sum + topic.civicActionSteps.length, 0),
      brandVoiceAlignment: 'High - Content challenges assumptions and reveals uncomfortable truths'
    }
  }
}

async function fetchRecentArticles(settings: z.infer<typeof PreviewRequestSchema>): Promise<NewsArticle[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - settings.daysSinceCreated)

  const { data: articles, error } = await supabase
    .from('source_metadata')
    .select('id, url, title, description, domain, credibility_score, bias_rating, published_time')
    .gte('last_fetched_at', cutoffDate.toISOString())
    .gte('credibility_score', 70) // Only credible sources
    .not('title', 'is', null)
    .not('description', 'is', null)
    .order('credibility_score', { ascending: false })
    .limit(settings.maxArticles * 2) // Get extra for filtering

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return articles || []
}

function isCivicRelevant(text: string): boolean {
  const civicKeywords = [
    'government', 'congress', 'senate', 'house', 'legislature', 'policy', 'law', 'bill',
    'voting', 'election', 'democracy', 'constitution', 'rights', 'freedom', 'justice',
    'federal', 'state', 'local', 'mayor', 'governor', 'president', 'court', 'supreme',
    'regulation', 'bureaucracy', 'administration', 'agency', 'department', 'budget',
    'tax', 'spending', 'public', 'citizen', 'civic', 'political', 'campaign', 'lobby'
  ]
  
  const lowerText = text.toLowerCase()
  return civicKeywords.some(keyword => lowerText.includes(keyword))
}

function generateTemplateTopic(article: NewsArticle, settings: z.infer<typeof PreviewRequestSchema>, index: number): PreviewTopic {
  const topicTemplates = [
    {
      titlePattern: "How {headline} Affects Your Democratic Voice",
      powerDynamics: [
        "Corporate lobbying influences policy more than citizen input",
        "Decisions are made in private meetings before public hearings",
        "Media coverage shapes perception while real negotiations happen behind closed doors"
      ],
      uncomfortableTruths: [
        "Your representatives receive more money from special interests than votes from constituents",
        "The legislative process is designed to favor those who understand it best",
        "Most policy changes happen through bureaucratic rule-making, not legislation"
      ]
    },
    {
      titlePattern: "The Power Structure Behind {headline}",
      powerDynamics: [
        "Revolving door between government and private sector shapes policy",
        "Committee assignments determine which issues get attention",
        "Informal networks of influence matter more than formal processes"
      ],
      uncomfortableTruths: [
        "Politicians depend more on donors than voters for career advancement",
        "Public hearings are often theater - real decisions happen elsewhere",
        "Citizens are kept uninformed about the most important decisions"
      ]
    },
    {
      titlePattern: "What They Don't Want You to Know About {headline}",
      powerDynamics: [
        "Industry insiders write the regulations that govern their own industries",
        "Think tanks funded by corporations provide 'independent' research",
        "Public-private partnerships often privatize profits while socializing costs"
      ],
      uncomfortableTruths: [
        "Complexity is intentional - it keeps citizens from understanding and participating",
        "Information is strategically released to minimize public attention",
        "Your tax dollars fund systems designed to exclude your participation"
      ]
    }
  ]

  const template = topicTemplates[index % topicTemplates.length]
  const headline = article.title.split(' ').slice(-4).join(' ')

  const sampleQuestions: PreviewQuestion[] = [
    {
      id: `preview_q_${index}_1`,
      type: 'multiple_choice',
      difficulty: 'medium',
      text: `Which factor has the MOST influence on policy decisions related to ${headline.toLowerCase()}?`,
      options: [
        'Public opinion polls',
        'Media coverage',
        'Lobbyist meetings and campaign contributions',
        'Congressional hearings'
      ],
      correctAnswer: 2,
      explanation: `While public opinion and media coverage are visible, research shows that lobbyist access and campaign contributions have measurably stronger correlation with policy outcomes. This is the uncomfortable truth about how power actually works.`,
      civicAction: `Look up your representatives' donor lists for this issue at OpenSecrets.org, then contact them with specific questions about their meetings with affected industries.`,
      uncomfortableTruth: 'Money influences policy more than votes in most cases',
      powerDynamicRevealed: 'Corporate interests have systematized access to decision-makers'
    },
    {
      id: `preview_q_${index}_2`,
      type: 'true_false',
      difficulty: 'easy',
      text: `Citizens can meaningfully influence policy on ${headline.toLowerCase()} through normal democratic processes.`,
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: `Normal democratic processes (voting every 2-6 years) are insufficient for ongoing policy influence. Real influence requires strategic engagement with the legislative process, bureaucratic rule-making, and sustained pressure campaigns.`,
      civicAction: `Identify the specific committee and subcommittee handling this issue, then contact committee members directly with evidence-based policy positions.`,
      uncomfortableTruth: 'Democracy requires more than voting to function effectively'
    }
  ]

  return {
    id: `preview_topic_${index}`,
    title: template.titlePattern.replace('{headline}', headline),
    description: `Understanding the power dynamics and hidden decision-making processes behind ${article.title.toLowerCase()}`,
    category: 'Government',
    source: article.domain,
    credibilityScore: article.credibility_score || 75,
    estimatedQuestions: settings.questionsPerTopic,
    difficulty: 'Mixed (30% Easy, 50% Medium, 20% Hard)',
    civicActionSteps: [
      'Research the key decision-makers and their funding sources',
      'Contact relevant committee members with specific policy positions',
      'Join or create coalition with other affected citizens',
      'Attend public hearings and submit formal comments',
      'Track policy implementation and hold officials accountable'
    ],
    uncomfortableTruths: template.uncomfortableTruths,
    powerDynamicsRevealed: template.powerDynamics,
    sampleQuestions
  }
}

async function generateAIPreviewTopic(article: NewsArticle, settings: z.infer<typeof PreviewRequestSchema>, index: number): Promise<PreviewTopic | null> {
  try {
    const prompt = `Generate a CivicSense-style educational topic about this news article:

ARTICLE: ${article.title}
DESCRIPTION: ${article.description}
SOURCE: ${article.domain}

Create a topic that reveals uncomfortable truths about how power actually works. Follow CivicSense brand voice:
- Truth over comfort: Reveal what politicians don't want people to know
- Clarity over politeness: Use direct language about power structures
- Action over passive consumption: Include specific civic action steps
- Evidence over opinion: Reference real power dynamics and influence networks

Generate response in JSON format:
{
  "title": "Topic title that reveals uncomfortable truths",
  "description": "Description focusing on power dynamics",
  "uncomfortableTruths": ["List of 3 uncomfortable truths"],
  "powerDynamicsRevealed": ["List of 3 power dynamics"],
  "civicActionSteps": ["List of 5 specific action steps with contact info"],
  "sampleQuestions": [
    {
      "type": "multiple_choice",
      "text": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1,
      "explanation": "Explanation revealing uncomfortable truths",
      "civicAction": "Specific action citizens can take"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
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

    const content = completion.choices[0].message.content
    if (!content) return null

    const parsed = JSON.parse(content)
    
    return {
      id: `ai_preview_topic_${index}`,
      title: parsed.title,
      description: parsed.description,
      category: 'Government',
      source: article.domain,
      credibilityScore: article.credibility_score || 75,
      estimatedQuestions: settings.questionsPerTopic,
      difficulty: 'AI-Generated Mixed Difficulty',
      civicActionSteps: parsed.civicActionSteps || [],
      uncomfortableTruths: parsed.uncomfortableTruths || [],
      powerDynamicsRevealed: parsed.powerDynamicsRevealed || [],
      sampleQuestions: parsed.sampleQuestions || []
    }

  } catch (error) {
    console.error('Error generating AI preview topic:', error)
    return null
  }
}

function assessCivicRelevance(article: NewsArticle): string {
  const relevanceScore = isCivicRelevant(article.title + ' ' + (article.description || '')) ? 'High' : 'Low'
  const credibilityScore = (article.credibility_score || 0) >= 80 ? 'High' : 'Medium'
  
  return `${relevanceScore} relevance, ${credibilityScore} credibility`
}

function calculateExpectedQualityScore(articles: NewsArticle[]): number {
  const avgCredibility = articles.reduce((sum, article) => sum + (article.credibility_score || 0), 0) / articles.length
  const civicRelevant = articles.filter(article => isCivicRelevant(article.title + ' ' + (article.description || ''))).length
  const relevanceScore = (civicRelevant / articles.length) * 100
  
  return Math.round((avgCredibility + relevanceScore) / 2)
}

function generateRecommendations(settings: z.infer<typeof PreviewRequestSchema>, articles: NewsArticle[]): string[] {
  const recommendations: string[] = []
  
  if (articles.length < 5) {
    recommendations.push('Consider increasing daysSinceCreated to find more articles')
  }
  
  if (settings.questionsPerTopic < 5) {
    recommendations.push('Increase questionsPerTopic to 6+ for comprehensive topic coverage')
  }
  
  const avgCredibility = articles.reduce((sum, a) => sum + (a.credibility_score || 0), 0) / articles.length
  if (avgCredibility < 75) {
    recommendations.push('Source quality is below ideal - consider filtering for higher credibility sources')
  }
  
  if (settings.questionTypeDistribution.multipleChoice < 50) {
    recommendations.push('Multiple choice questions are most effective for civic education - consider increasing proportion')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Settings look good for generating high-quality civic education content')
  }
  
  return recommendations
}

function generateCacheKey(settings: z.infer<typeof PreviewRequestSchema>): string {
  const keyData = {
    maxArticles: settings.maxArticles,
    daysSinceCreated: settings.daysSinceCreated,
    questionsPerTopic: settings.questionsPerTopic,
    includeAIGenerated: settings.includeAIGenerated
  }
  
  return `content_preview_${Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 32)}`
}

async function getCachedPreview(cacheKey: string, userId: string) {
  const { data } = await supabase
    .from('content_preview_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .eq('created_by', userId)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (data) {
    // Update access count
    await supabase
      .from('content_preview_cache')
      .update({ 
        access_count: data.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', data.id)
  }

  return data
}

async function cachePreview(cacheKey: string, preview: any, settings: z.infer<typeof PreviewRequestSchema>) {
  try {
    await supabase
      .from('content_preview_cache')
      .insert({
        cache_key: cacheKey,
        cache_type: 'full_content_preview',
        preview_data: preview,
        generation_settings: settings,
        created_by: settings.userId,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      })
  } catch (error) {
    console.error('Error caching preview:', error)
    // Don't throw - caching failure shouldn't break the preview
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CivicSense Content Preview API',
    version: '1.0.0',
    endpoints: {
      'POST /api/admin/content-preview': 'Generate content preview with sample topics and questions'
    },
    requiredParameters: {
      maxArticles: 'Number of articles to analyze (1-20)',
      daysSinceCreated: 'How many days back to look for articles (0-30)',
      questionsPerTopic: 'Questions to generate per topic (3-12)',
      userId: 'User ID for caching and permissions',
      includeAIGenerated: 'Whether to use AI for realistic preview generation'
    },
    response: {
      statistics: 'Overall generation statistics and quality metrics',
      sampleTopics: 'Array of sample topics with questions and civic actions',
      sampleArticles: 'Preview of articles that would be processed',
      recommendations: 'Suggestions for optimizing generation settings',
      qualityIndicators: 'Expected quality metrics for CivicSense brand compliance'
    }
  })
} 