import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { topicOperations, questionOperations, type DbQuestionTopic, type DbQuestion } from '@/lib/database'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GeneratedQuestion {
  questionNumber: number
  questionType: 'Multiple Choice' | 'True or False' | 'Short Answer' | 'Matching' | 'Fill in Blank' | 'Ordering'
  difficultyLevel: 'Recall' | 'Comprehension' | 'Analysis' | 'Evaluation'
  category: string
  question: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer: string
  hint: string
  explanation: string
  tags: string[]
  sources: Array<{name: string, url: string}>
  matchingPairs?: Array<{ left: string; right: string }>
  fillInBlanks?: Array<{ text: string; answer: string }>
  orderingItems?: Array<{ id: string; content: string; correctOrder: number }>
}

interface GeneratedQuiz {
  topic: string
  issue: string
  description: string
  questions: GeneratedQuestion[]
  metadata?: {
    generated_at: string
    source_article: any
    generation_method: string
    ai_model: string
    validation_status: string
  }
}

interface SaveQuizRequest {
  quiz: GeneratedQuiz
  user_id?: string
}

// Map question types to database format
function mapQuestionTypeToDb(type: string): string {
  const typeMap: Record<string, string> = {
    'Multiple Choice': 'multiple_choice',
    'True or False': 'true_false',
    'Short Answer': 'short_answer',
    'Matching': 'matching',
    'Fill in Blank': 'fill_in_blank',
    'Ordering': 'ordering'
  }
  return typeMap[type] || 'multiple_choice'
}

// Map difficulty levels to numbers
function mapDifficultyToNumber(difficulty: string): number {
  const difficultyMap: Record<string, number> = {
    'Recall': 1,
    'Comprehension': 2,
    'Analysis': 3,
    'Evaluation': 4
  }
  return difficultyMap[difficulty] || 2
}

// Generate topic ID from title
function generateTopicId(title: string): string {
  const year = new Date().getFullYear()
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
  
  return `${slug}_${year}`
}

// Get category emoji
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'Government': '🏛️',
    'Elections': '🗳️',
    'Economy': '💰',
    'Foreign Policy': '🌐',
    'Justice': '⚖️',
    'Civil Rights': '✊',
    'Environment': '🌱',
    'Local Issues': '🏙️',
    'Constitutional Law': '📜',
    'National Security': '🛡️',
    'Public Policy': '📋',
    'Historical Precedent': '📚',
    'Civic Action': '🤝',
    'Electoral Systems': '📊',
    'Legislative Process': '🏛️',
    'Judicial Review': '⚖️',
    'Policy Analysis': '🔍',
    'Civic Participation': '🗣️',
    'Media Literacy': '📰'
  }
  return emojiMap[category] || '📚'
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveQuizRequest = await request.json()
    const { quiz, user_id } = body

    // Validate request
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid quiz data: missing quiz or questions' },
        { status: 400 }
      )
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate unique topic ID
    const topicId = generateTopicId(quiz.topic)
    
    // Check if topic already exists
    const existingTopic = await topicOperations.getById(topicId)
    if (existingTopic) {
      return NextResponse.json(
        { error: `Topic with ID "${topicId}" already exists` },
        { status: 409 }
      )
    }

    // Get primary categories from questions
    const categories = Array.from(new Set(quiz.questions.map(q => q.category)))
    
    // Create why_this_matters content
    const whyThisMatters = `<ul><li><strong>Civic Education:</strong> ${quiz.description}</li><li><strong>Current Events:</strong> Understanding this news event helps citizens stay informed about government actions and their consequences</li><li><strong>Democratic Participation:</strong> Knowledge of current affairs enables more effective civic engagement and voting decisions</li><li><strong>Media Literacy:</strong> Analyzing news events builds critical thinking skills for evaluating information sources</li></ul>`

    // Prepare topic data
    const topicData: Omit<DbQuestionTopic, 'id' | 'created_at' | 'updated_at'> = {
      topic_id: topicId,
      topic_title: quiz.topic,
      description: quiz.description,
      why_this_matters: whyThisMatters,
      emoji: getCategoryEmoji(categories[0] || 'Government'),
      date: new Date().toISOString().split('T')[0],
      day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      categories: categories as any, // Cast to Json type
      is_active: true,
      is_breaking: false
    }

    // Create topic
    const createdTopic = await topicOperations.create(topicData)
    console.log('Created topic:', createdTopic.topic_id)

    // Prepare questions data
    const questionsData: Array<Omit<DbQuestion, 'id' | 'created_at' | 'updated_at'>> = quiz.questions.map(q => ({
      topic_id: topicId,
      question_number: q.questionNumber,
      question_type: mapQuestionTypeToDb(q.questionType),
      category: q.category,
      question: q.question,
      option_a: q.optionA || null,
      option_b: q.optionB || null,
      option_c: q.optionC || null,
      option_d: q.optionD || null,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      explanation: q.explanation,
      tags: q.tags as any, // Cast to Json type
      sources: q.sources as any, // Cast to Json type
      difficulty_level: mapDifficultyToNumber(q.difficultyLevel),
      is_active: true,
      // Required fields for DbQuestion
      fact_check_status: null,
      fact_check_notes: null,
      last_fact_check: null,
      // Interactive question type data
      matching_pairs: q.matchingPairs as any || null,
      fill_in_blanks: q.fillInBlanks as any || null,
      ordering_items: q.orderingItems as any || null
    }))

    // Create questions in batches
    const createdQuestions = await questionOperations.createMany(questionsData)
    console.log(`Created ${createdQuestions.length} questions`)

    // Log successful creation
    console.log('Quiz saved successfully:', {
      topicId,
      questionCount: createdQuestions.length,
      categories,
      generatedAt: quiz.metadata?.generated_at,
      aiModel: quiz.metadata?.ai_model
    })

    return NextResponse.json({
      success: true,
      data: {
        topic_id: topicId,
        topic_title: quiz.topic,
        question_count: createdQuestions.length,
        categories,
        created_at: createdTopic.created_at
      },
      message: `Quiz "${quiz.topic}" saved successfully with ${createdQuestions.length} questions`
    })

  } catch (error) {
    console.error('Save quiz error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to save quiz to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CivicSense Admin Save Quiz API',
    version: '1.0.0',
    endpoints: {
      'POST /api/admin/save-quiz': 'Save generated quiz to database'
    },
    requirements: {
      authentication: 'User ID required',
      permissions: 'Admin or content creator access',
      data: 'Valid GeneratedQuiz object with questions array'
    },
    response_format: {
      success: 'Boolean indicating operation success',
      data: 'Created topic and question metadata',
      message: 'Human-readable success message'
    }
  })
} 