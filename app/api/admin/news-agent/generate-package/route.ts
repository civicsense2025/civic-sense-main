/**
 * News Content Package Generator API Route
 * 
 * This route generates comprehensive civic education content packages from breaking news events.
 * It creates question_topics, questions, skills, glossary_terms, events, and public_figures
 * that align with CivicSense's mission of revealing uncomfortable truths about power.
 * 
 * The generator follows CivicSense's brand voice: truth over comfort, clarity over politeness,
 * action over passive consumption, evidence over opinion, and systems thinking over surface solutions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import {
    DB_TABLES,
    type DbQuestionTopicsInsert,
    type DbQuestionsInsert,
    type DbSkillsInsert,
    type DbGlossaryTermsInsert,
    type DbEventsInsert,
    type DbPublicFiguresInsert
  } from '@/lib/database-constants'

// Content packages table name (not in DB_TABLES yet)
const CONTENT_PACKAGES_TABLE = 'content_packages'

// Validation schema
const GeneratePackageSchema = z.object({
  headline: z.string().min(10).max(500),
  sourceUrl: z.string().url(),
  contentTypes: z.object({
    questions: z.boolean().default(true),
    skills: z.boolean().default(true), 
    glossary: z.boolean().default(true),
    events: z.boolean().default(true),
    publicFigures: z.boolean().default(true)
  }).default({
    questions: true,
    skills: true,
    glossary: true, 
    events: true,
    publicFigures: true
  }),
  provider: z.enum(['openai', 'anthropic']).default('anthropic'),
  qualityThreshold: z.number().min(50).max(100).default(70)
})

interface NewsEvent {
  id: string
  headline: string
  source_url: string
  civic_relevance_score: number
}

interface GeneratedContent {
  questionTopic?: {
    topicId: string
    title: string
    description: string
    emoji: string
    category: string
    whyThisMatters: string
  }
  questions?: Array<{
    text: string
    type: 'multiple_choice' | 'true_false' | 'short_answer'
    difficulty: 'easy' | 'medium' | 'hard'
    options: string[]
    correctAnswer: number | string
    explanation: string
    uncomfortableTruth: string
    civicAction: string
  }>
  skills?: Array<{
    name: string
    description: string
    category: string
    difficultyLevel: number
    practicalApplications: string[]
    learningObjectives: string[]
    assessmentCriteria: string[]
  }>
  glossaryTerms?: Array<{
    term: string
    definition: string
    category: string
    examples: string[]
    uncomfortableTruth: string
    powerDynamics: string[]
    actionSteps: string[]
  }>
  events?: Array<{
    title: string
    description: string
    date: string
    significance: number
    category: string
    whyThisMatters: string
    policyAreas: string[]
  }>
  publicFigures?: Array<{
    name: string
    title: string
    organization: string
    role: string
    politicalAffiliation: string
    keyPositions: string[]
    relevanceToTopic: string
    powerLevel: number
  }>
}

class ContentPackageGenerator {
  constructor(private supabase: any, private provider: 'openai' | 'anthropic' = 'anthropic') {}

  async generateContentPackage(
    newsEvent: NewsEvent, 
    contentTypes: z.infer<typeof GeneratePackageSchema>['contentTypes'],
    qualityThreshold: number
  ): Promise<{ packageId: string; content: GeneratedContent; qualityScores: any }> {
    console.log(`🤖 Generating content package for: ${newsEvent.headline}`)
    
    // Generate all content types in parallel
    const [
      questionContent,
      skillsContent, 
      glossaryContent,
      eventsContent,
      publicFiguresContent
    ] = await Promise.all([
      contentTypes.questions ? this.generateQuestions(newsEvent) : Promise.resolve(null),
      contentTypes.skills ? this.generateSkills(newsEvent) : Promise.resolve(null),
      contentTypes.glossary ? this.generateGlossaryTerms(newsEvent) : Promise.resolve(null),
      contentTypes.events ? this.generateEvents(newsEvent) : Promise.resolve(null),
      contentTypes.publicFigures ? this.generatePublicFigures(newsEvent) : Promise.resolve(null)
    ])

    // Combine all generated content
    const content: GeneratedContent = {
      ...(questionContent && { 
        questionTopic: questionContent.topic,
        questions: questionContent.questions 
      }),
      ...(skillsContent && { skills: skillsContent }),
      ...(glossaryContent && { glossaryTerms: glossaryContent }),
      ...(eventsContent && { events: eventsContent }),
      ...(publicFiguresContent && { publicFigures: publicFiguresContent })
    }

    // Check for potential duplications before saving
    const duplicationWarnings = await this.checkForDuplications(content)
    if (duplicationWarnings.length > 0) {
      console.warn(`⚠️ Found ${duplicationWarnings.length} potential duplications for content package`)
      // Log warnings for review
      for (const warning of duplicationWarnings) {
        console.warn(`- ${warning.content_type}: ${warning.recommendation}`)
      }
    }

    // Calculate quality scores
    const qualityScores = this.assessContentQuality(content)
    
    // Create content package record
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await this.supabase
      .from(CONTENT_PACKAGES_TABLE)
      .insert({
        id: packageId,
        news_event_id: newsEvent.id,
        news_headline: newsEvent.headline,
        generated_content: content,
        quality_scores: qualityScores,
        status: qualityScores.overall >= qualityThreshold ? 'review' : 'draft'
      })

    return { packageId, content, qualityScores }
  }

  async publishContent(packageId: string, content: GeneratedContent): Promise<{
    published: { [key: string]: string[] }
    errors: string[]
  }> {
    const published: { [key: string]: string[] } = {}
    const errors: string[] = []

    try {
      // Publish to existing database tables using proper types
      
      // 1. Question Topic and Questions -> question_topics & questions tables
      if (content.questionTopic && content.questions) {
        try {
          // Insert topic using proper type
          const topicData: DbQuestionTopicsInsert = {
            topic_id: content.questionTopic.topicId,
            topic_title: content.questionTopic.title,
            description: content.questionTopic.description,
            why_this_matters: content.questionTopic.whyThisMatters,
            emoji: content.questionTopic.emoji,
            categories: [content.questionTopic.category],
            is_active: true,
            is_featured: false,
            is_breaking: true,
            date: new Date().toISOString().split('T')[0]
          }

          const { error: topicError } = await this.supabase
            .from(DB_TABLES.QUESTION_TOPICS)
            .insert(topicData)

          if (topicError) throw new Error(`Topic insertion failed: ${topicError.message}`)

          // Insert questions using proper type
          const questionInserts: DbQuestionsInsert[] = content.questions.map((q, index) => ({
            topic_id: content.questionTopic!.topicId,
            question_number: index + 1,
            question_type: q.type,
            category: content.questionTopic!.category,
            question: q.text,
            ...(q.type === 'multiple_choice' && {
              option_a: q.options[0],
              option_b: q.options[1], 
              option_c: q.options[2],
              option_d: q.options[3]
            }),
            correct_answer: q.type === 'multiple_choice' 
              ? ['a', 'b', 'c', 'd'][q.correctAnswer as number]
              : q.correctAnswer.toString(),
            explanation: q.explanation,
            hint: q.civicAction,
            tags: ['news-generated', 'breaking'],
            sources: [{ name: 'Generated from news', url: '' }],
            difficulty_level: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
            is_active: true
          }))

          const { error: questionsError } = await this.supabase
            .from(DB_TABLES.QUESTIONS)
            .insert(questionInserts)

          if (questionsError) throw new Error(`Questions insertion failed: ${questionsError.message}`)
          
          published.questions = [content.questionTopic.topicId]
          console.log(`✅ Published topic ${content.questionTopic.topicId} with ${content.questions.length} questions`)
        } catch (error) {
          errors.push(`Questions publication failed: ${error}`)
        }
      }

      // 2. Skills -> skills table  
      if (content.skills) {
        try {
          const skillInserts = content.skills.map(skill => ({
            category_id: skill.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            skill_name: skill.name,
            description: skill.description,
            difficulty_level: skill.difficultyLevel,
            is_active: true
          }))

          const { error: skillsError } = await this.supabase
            .from(DB_TABLES.SKILLS)
            .insert(skillInserts)

          if (skillsError) throw new Error(`Skills insertion failed: ${skillsError.message}`)
          
          published.skills = content.skills.map(s => s.name)
          console.log(`✅ Published ${content.skills.length} skills`)
        } catch (error) {
          errors.push(`Skills publication failed: ${error}`)
        }
      }

      // 3. Glossary Terms -> glossary_terms table
      if (content.glossaryTerms) {
        try {
          const glossaryInserts: DbGlossaryTermsInsert[] = content.glossaryTerms.map(term => ({
            term: term.term,
            definition: term.definition,
            category: term.category,
            examples: term.examples,
            uncomfortable_truth: term.uncomfortableTruth,
            power_dynamics: term.powerDynamics,
            action_steps: term.actionSteps,
            ai_generated: true
          }))

          const { error: glossaryError } = await this.supabase
            .from(DB_TABLES.GLOSSARY_TERMS)
            .insert(glossaryInserts)

          if (glossaryError) throw new Error(`Glossary insertion failed: ${glossaryError.message}`)
          
          published.glossary = content.glossaryTerms.map(t => t.term)
          console.log(`✅ Published ${content.glossaryTerms.length} glossary terms`)
        } catch (error) {
          errors.push(`Glossary publication failed: ${error}`)
        }
      }

      // 4. Events -> events table (existing table with new fields)
      if (content.events) {
        try {
          const eventInserts = content.events.map(event => ({
            date: event.date,
            topic_id: `news_${Date.now()}`,
            topic_title: event.title,
            why_this_matters: event.whyThisMatters,
            civic_relevance_score: 85,
            content_package_id: packageId,
            source_type: 'news_generated'
          }))

          const { error: eventsError } = await this.supabase
            .from(DB_TABLES.EVENTS)
            .insert(eventInserts)

          if (eventsError) throw new Error(`Events insertion failed: ${eventsError.message}`)
          
          published.events = content.events.map(e => e.title)
          console.log(`✅ Published ${content.events.length} events`)
        } catch (error) {
          errors.push(`Events publication failed: ${error}`)
        }
      }

      // 5. Public Figures -> public_figures table
      if (content.publicFigures) {
        try {
          const figureInserts = content.publicFigures.map(figure => ({
            slug: figure.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            full_name: figure.name,
            title: figure.title,
            bio: `${figure.title} at ${figure.organization}. ${figure.relevanceToTopic}`
          }))

          const { error: figuresError } = await this.supabase
            .from(DB_TABLES.PUBLIC_FIGURES)
            .insert(figureInserts)

          if (figuresError) throw new Error(`Public figures insertion failed: ${figuresError.message}`)
          
          published.publicFigures = content.publicFigures.map(f => f.name)
          console.log(`✅ Published ${content.publicFigures.length} public figures`)
        } catch (error) {
          errors.push(`Public figures publication failed: ${error}`)
        }
      }

      return { published, errors }
    } catch (error) {
      console.error('❌ Content publication failed:', error)
      return { published, errors: [...errors, `General publication error: ${error}`] }
    }
  }

  // Mock AI generation methods (replace with actual AI calls)
  private async generateQuestions(newsEvent: NewsEvent) {
    // This would be replaced with actual AI generation
    return {
      topic: {
        topicId: `news_${Date.now()}`,
        title: `Understanding: ${newsEvent.headline}`,
        description: `Civic education questions about recent developments in ${newsEvent.headline}`,
        emoji: '📰',
        category: 'current_events',
        whyThisMatters: 'This recent development impacts how our democracy functions and your rights as a citizen.'
      },
      questions: [
        {
          text: `What are the key civic implications of: ${newsEvent.headline}?`,
          type: 'multiple_choice' as const,
          difficulty: 'medium' as const,
          options: [
            'This primarily affects federal policy',
            'This impacts local government decisions', 
            'This changes how citizens can participate',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'Major civic developments typically have multi-level impacts on democracy.',
          uncomfortableTruth: 'Many citizens remain unaware of how these decisions directly affect their daily lives.',
          civicAction: 'Contact your representatives to understand their position on this issue.'
        }
      ]
    }
  }

  private async generateSkills(newsEvent: NewsEvent) {
    return [{
      name: 'News Analysis and Civic Engagement',
      description: 'Learn to analyze news for civic relevance and take appropriate action',
      category: 'civic_analysis',
      difficultyLevel: 2,
      practicalApplications: [
        'Evaluate news sources for bias and credibility',
        'Identify opportunities for civic participation',
        'Connect local issues to broader policy implications'
      ],
      learningObjectives: [
        'Analyze news critically for civic impact',
        'Identify actionable civic responses',
        'Understand connections between news and democracy'
      ],
      assessmentCriteria: [
        'Can identify key civic actors in news stories',
        'Can propose specific civic actions based on news',
        'Demonstrates understanding of democratic processes'
      ]
    }]
  }

  private async generateGlossaryTerms(newsEvent: NewsEvent) {
    return [{
      term: 'Civic Relevance',
      definition: 'The degree to which a news event or policy decision directly impacts citizens\' rights, responsibilities, or ability to participate in democracy',
      category: 'civic_concepts',
      examples: [
        'Changes to voting procedures have high civic relevance',
        'Celebrity gossip typically has low civic relevance'
      ],
      uncomfortableTruth: 'Many high-civic-relevance stories receive less media coverage than sensational but civically irrelevant news',
      powerDynamics: [
        'Media outlets may downplay stories that challenge powerful interests',
        'Citizens often lack tools to identify truly important civic news'
      ],
      actionSteps: [
        'Seek out local government meeting agendas',
        'Follow policy-focused news sources',
        'Join community organizations that track local issues'
      ]
    }]
  }

  private async generateEvents(newsEvent: NewsEvent) {
    return [{
      title: newsEvent.headline,
      description: `A significant civic development that impacts democratic participation and citizen rights`,
      date: new Date().toISOString().split('T')[0],
      significance: 8,
      category: 'governance',
      whyThisMatters: 'This event demonstrates how power operates in our democratic system and creates opportunities for citizen engagement',
      policyAreas: ['governance', 'civic_participation']
    }]
  }

  private async generatePublicFigures(newsEvent: NewsEvent) {
    return [{
      name: 'Key Decision Maker',
      title: 'Government Official',
      organization: 'Government Agency',
      role: 'Policy Decision Maker',
      politicalAffiliation: 'Nonpartisan',
      keyPositions: [
        'Supports transparent governance',
        'Advocates for citizen participation'
      ],
      relevanceToTopic: 'Central figure in the policy decisions discussed in this news event',
      powerLevel: 7
    }]
  }

  private async checkForDuplications(content: GeneratedContent): Promise<Array<{
    content_type: string
    recommendation: string
    similarity_score: number
  }>> {
    const warnings: Array<{
      content_type: string
      recommendation: string
      similarity_score: number
    }> = []

    try {
      // Check each content type for duplications
      if (content.questionTopic) {
        const response = await fetch('/api/admin/content-relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_duplication',
            content: {
              type: 'question_topic',
              title: content.questionTopic.title,
              content: content.questionTopic.description,
              categories: [content.questionTopic.category]
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.warnings && result.warnings.length > 0) {
            warnings.push(...result.warnings.map((w: any) => ({
              content_type: 'question_topic',
              recommendation: w.recommendation,
              similarity_score: w.similarity_score
            })))
          }
        }
      }

      // Check glossary terms
      if (content.glossaryTerms) {
        for (const term of content.glossaryTerms) {
          const response = await fetch('/api/admin/content-relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check_duplication',
              content: {
                type: 'glossary_term',
                title: term.term,
                content: term.definition,
                categories: [term.category]
              }
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.warnings && result.warnings.length > 0) {
              warnings.push(...result.warnings.map((w: any) => ({
                content_type: 'glossary_term',
                recommendation: w.recommendation,
                similarity_score: w.similarity_score
              })))
            }
          }
        }
      }

    } catch (error) {
      console.warn('Duplication check failed:', error)
    }

    return warnings
  }

  private assessContentQuality(content: GeneratedContent): any {
    // Simplified quality assessment - would be more sophisticated in practice
    let totalItems = 0
    let qualitySum = 0

    if (content.questions) {
      totalItems += content.questions.length
      qualitySum += content.questions.length * 85 // Mock quality score
    }
    
    if (content.skills) {
      totalItems += content.skills.length  
      qualitySum += content.skills.length * 80
    }

    if (content.glossaryTerms) {
      totalItems += content.glossaryTerms.length
      qualitySum += content.glossaryTerms.length * 90
    }

    if (content.events) {
      totalItems += content.events.length
      qualitySum += content.events.length * 75
    }

    if (content.publicFigures) {
      totalItems += content.publicFigures.length
      qualitySum += content.publicFigures.length * 70
    }

    const overall = totalItems > 0 ? Math.round(qualitySum / totalItems) : 0

    return {
      overall,
      brandVoiceCompliance: overall + 5,
      factualAccuracy: overall - 5, 
      civicActionability: overall + 10,
      itemsGenerated: totalItems
    }
  }
}

// Load configuration from API
async function loadAgentConfig() {
  try {
    const supabase = await createClient()
    const { data: configData } = await supabase
      .from('news_agent_config')
      .select('config')
      .single()
    
    return configData?.config || {
      isActive: false,
      monitoringIntervalMinutes: 30,
      minCivicRelevanceScore: 70,
      maxEventsPerCycle: 10,
      contentGeneration: {
        generateQuestions: true,
        generateSkills: true,
        generateGlossaryTerms: true,
        generateEvents: true,
        generatePublicFigures: true
      },
      databaseTargets: {
        saveToContentPackages: true,
        saveToContentTables: true,
        targetTables: {
          question_topics: true,
          questions: true,
          skills: true,
          glossary_terms: true,
          events: true,
          public_figures: true
        },
        customTableMappings: {},
        schemaConfig: {
          schemaName: 'public',
          useCustomFieldMappings: false,
          customFieldMappings: {}
        }
      },
      qualityControl: {
        publishAsActive: true,
        validateSchema: true,
        requireMinimumFields: true
      }
    }
  } catch (error) {
    console.warn('Failed to load config from database, using defaults:', error)
    return {
      isActive: false,
      monitoringIntervalMinutes: 30,
      minCivicRelevanceScore: 70,
      maxEventsPerCycle: 10,
      contentGeneration: {
        generateQuestions: true,
        generateSkills: true,
        generateGlossaryTerms: true,
        generateEvents: true,
        generatePublicFigures: true
      },
      databaseTargets: {
        saveToContentPackages: true,
        saveToContentTables: true,
        targetTables: {
          question_topics: true,
          questions: true,
          skills: true,
          glossary_terms: true,
          events: true,
          public_figures: true
        },
        customTableMappings: {},
        schemaConfig: {
          schemaName: 'public',
          useCustomFieldMappings: false,
          customFieldMappings: {}
        }
      },
      qualityControl: {
        publishAsActive: true,
        validateSchema: true,
        requireMinimumFields: true
      }
    }
  }
}

/**
 * POST /api/admin/news-agent/generate-package
 * Generate content package from news event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load configuration
    const config = await loadAgentConfig()
    
    // Get request body (may include specific config overrides)
    const body = await request.json().catch(() => ({}))
    const requestConfig = body.config || config

    console.log('🎯 Starting manual content generation with config:', {
      generateQuestions: requestConfig.contentGeneration?.generateQuestions,
      generateSkills: requestConfig.contentGeneration?.generateSkills,
      saveToContentPackages: requestConfig.databaseTargets?.saveToContentPackages,
      saveToContentTables: requestConfig.databaseTargets?.saveToContentTables,
      targetTables: requestConfig.databaseTargets?.targetTables
    })

    // Find recent articles that haven't been processed
    const { data: articles, error: articlesError } = await supabase
      .from('source_metadata')
      .select('*')
      .is('ai_generated', null) // Not yet processed by AI
      .gte('published_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('published_date', { ascending: false })
      .limit(requestConfig.maxEventsPerCycle || 10)

    if (articlesError) {
      console.error('❌ Error fetching articles:', articlesError)
      return NextResponse.json({
        error: 'Failed to fetch articles',
        details: articlesError.message
      }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new articles found for processing',
        processed: 0
      })
    }

    console.log(`📰 Found ${articles.length} articles for processing`)

    // Initialize content generator
    const generator = new ContentPackageGenerator(supabase, 'anthropic')

    let processed = 0
    let generated = 0
    const results = []

    // Process each article
    for (const article of articles) {
      try {
        console.log(`🔍 Processing article: ${article.title}`)

        // Create a proper news event for the existing generator
        const newsEvent = {
          id: article.id,
          headline: article.title || '',
          content: article.content || article.description || '',
          source: article.source || article.domain || 'Unknown',
          source_url: article.url || '',
          published_date: article.published_date || new Date().toISOString(),
          civic_relevance_score: 85 // Default score since we're processing manually
        }

        // Generate content package using existing method signature
        const result = await generator.generateContentPackage(
          newsEvent,
          {
            questions: true,
            skills: true,
            glossary: true,
            events: true,
            publicFigures: true
          },
          70 // Quality threshold
        )

        console.log(`✅ Generated content package: ${result.packageId}`)
        generated++
        results.push({
          articleId: article.id,
          packageId: result.packageId,
          qualityScores: result.qualityScores,
          status: 'generated'
        })

        // Mark article as processed
        await supabase
          .from('source_metadata')
          .update({ ai_generated: true })
          .eq('id', article.id)

        processed++

      } catch (error) {
        console.error(`❌ Error processing article ${article.id}:`, error)
        results.push({
          articleId: article.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        processed++
      }
    }

    console.log(`🎉 Content generation complete: ${generated}/${processed} packages generated`)

    return NextResponse.json({
      success: true,
      message: `Content generation completed: ${generated}/${processed} packages generated`,
      processed,
      generated,
      results,
      configuration: {
        targetTables: requestConfig.databaseTargets?.targetTables,
        saveToContentPackages: requestConfig.databaseTargets?.saveToContentPackages,
        saveToContentTables: requestConfig.databaseTargets?.saveToContentTables
      }
    })

  } catch (error) {
    console.error('❌ Content generation error:', error)
    return NextResponse.json({
      error: 'Content generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/news-agent/generate-package
 * Get recent content packages and generation statistics
 */
export async function GET() {
  try {
    const supabaseClient = await createClient()

    // Try to get content packages first
    let packages: any[] = []
    let statistics = {
      total: 0,
      published: 0,
      inReview: 0,
      rejected: 0,
      averageQuality: 0
    }

    // Try content_packages table first
    try {
      const { data: contentPackages } = await supabaseClient
        .from('content_packages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (contentPackages && contentPackages.length > 0) {
        packages = contentPackages
        console.log(`📦 Found ${packages.length} content packages`)
      }
    } catch (error) {
      console.log('📦 Content packages table not available, checking question_topics...')
      
      // Fallback to question_topics for recently generated content
      const { data: recentTopics } = await supabaseClient
        .from('question_topics')
        .select('topic_id, topic_title, created_at, is_active, ai_generated')
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (recentTopics && recentTopics.length > 0) {
        packages = recentTopics.map(topic => ({
          id: topic.topic_id,
          news_headline: topic.topic_title,
          status: topic.is_active ? 'published' : 'draft',
          quality_scores: { overall: 75 },
          created_at: topic.created_at
        }))
        console.log(`📦 Found ${packages.length} AI-generated topics as packages`)
      }
    }

    // Calculate statistics from packages
    if (packages.length > 0) {
      statistics = {
        total: packages.length,
        published: packages.filter(p => p.status === 'published').length,
        inReview: packages.filter(p => p.status === 'review').length,
        rejected: packages.filter(p => p.status === 'rejected').length,
        averageQuality: packages.length 
          ? Math.round(packages.reduce((sum, p) => sum + (p.quality_scores?.overall || 75), 0) / packages.length)
          : 0
      }
    }

    console.log(`📊 Content package statistics:`, statistics)

    return NextResponse.json({
      success: true,
      data: {
        packages: packages || [],
        statistics
      }
    })

  } catch (error) {
    console.error('Error getting content packages:', error)
    return NextResponse.json(
      { error: 'Failed to get content packages' },
      { status: 500 }
    )
  }
} 