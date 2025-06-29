import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Check if AI features are disabled (for Vercel builds)
const AI_DISABLED = process.env.DISABLE_AI_FEATURES === 'true'

// Conditional imports - only load AI modules if features are enabled
let getPersonalityManager: any

if (!AI_DISABLED) {
  try {
    const personalityModule = await import('@/lib/ai/personality-manager')
    getPersonalityManager = personalityModule.getPersonalityManager
  } catch (error) {
    console.warn('Personality AI modules not available:', error)
  }
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PersonalityChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  topic: z.string().optional(),
  personalityCode: z.string().optional(), // Specific personality to use
  mode: z.enum(['auto', 'specific', 'panel']).default('auto'),
  maxExperts: z.number().min(1).max(5).default(3),
  userId: z.string().optional(),
  sessionId: z.string().optional()
})

// =============================================================================
// FALLBACK RESPONSES WHEN AI IS DISABLED
// =============================================================================

const AI_DISABLED_RESPONSE = {
  success: false,
  error: 'Personality AI features are currently disabled in this environment',
  fallback: {
    message: "The expert panel feature is currently unavailable, but you can still explore CivicSense's comprehensive quiz topics to learn from different civic perspectives!",
    experts: [],
    confidence: 0,
    suggestions: [
      "Take quizzes on constitutional law",
      "Learn about local government structures", 
      "Explore voting rights and processes",
      "Study checks and balances"
    ]
  }
}

// =============================================================================
// MAIN PERSONALITY CHAT ENDPOINT
// =============================================================================

export async function POST(request: NextRequest) {
  // Return early if AI features are disabled
  if (AI_DISABLED || !getPersonalityManager) {
    return NextResponse.json(AI_DISABLED_RESPONSE, { status: 503 })
  }

  try {
    const body = await request.json()
    const validatedInput = PersonalityChatRequestSchema.parse(body)
    
    const personalityManager = getPersonalityManager()
    
    // Handle different modes
    switch (validatedInput.mode) {
      case 'specific':
        // Use a specific personality
        if (!validatedInput.personalityCode) {
          return NextResponse.json({
            success: false,
            error: 'Personality code required for specific mode'
          }, { status: 400 })
        }
        
        const specificResult = await personalityManager.chatWithPersonality(
          validatedInput.personalityCode,
          validatedInput.message,
          {
            topic: validatedInput.topic,
            userId: validatedInput.userId,
            sessionId: validatedInput.sessionId || `specific_${Date.now()}`
          }
        )
        
        return NextResponse.json({
          success: true,
          mode: 'specific',
          response: specificResult
        })
      
      case 'panel':
        // Expert panel discussion
        const panelResult = await personalityManager.getExpertPanel(
          validatedInput.message,
          {
            topic: validatedInput.topic,
            maxExperts: validatedInput.maxExperts,
            userId: validatedInput.userId,
            sessionId: validatedInput.sessionId || `panel_${Date.now()}`
          }
        )
        
        return NextResponse.json({
          success: true,
          mode: 'panel',
          response: panelResult
        })
      
      default:
        // Auto mode - find best personality match
        const autoResult = await personalityManager.autoMatchAndChat(
          validatedInput.message,
          {
            topic: validatedInput.topic,
            userId: validatedInput.userId,
            sessionId: validatedInput.sessionId || `auto_${Date.now()}`
          }
        )
        
        return NextResponse.json({
          success: true,
          mode: 'auto',
          response: autoResult
        })
    }
    
  } catch (error) {
    console.error('Personality chat error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: AI_DISABLED_RESPONSE.fallback
    }, { status: 500 })
  }
}

// =============================================================================
// GET ENDPOINT FOR AVAILABLE PERSONALITIES
// =============================================================================

export async function GET(request: NextRequest) {
  // Return early if AI features are disabled
  if (AI_DISABLED || !getPersonalityManager) {
    return NextResponse.json({
      success: false,
      error: 'Personality features disabled',
      available_personalities: [],
      fallback_message: 'Expert personalities are not available in this environment. Please use the main quiz interface for civic education.'
    })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const topic = searchParams.get('topic')
    
    const personalityManager = getPersonalityManager()
    
    if (topic) {
      // Get personalities best suited for a specific topic
      const matches = await personalityManager.findPersonalitiesForTopic(topic)
      return NextResponse.json({
        success: true,
        topic,
        personality_matches: matches
      })
    }
    
    if (category) {
      // Get personalities by category
      const personalities = await personalityManager.getPersonalitiesByCategory(category)
      return NextResponse.json({
        success: true,
        category,
        personalities
      })
    }
    
    // Get all available personalities
    const allPersonalities = await personalityManager.getAllPersonalities()
    return NextResponse.json({
      success: true,
      personalities: allPersonalities,
      total_count: allPersonalities.length
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch personalities'
    }, { status: 500 })
  }
}

// =============================================================================
// DEMO ENDPOINT FOR TESTING
// =============================================================================

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    endpoints: {
      POST: 'Chat with civic personalities',
      GET: 'List available personalities'
    },
    modes: {
      auto: 'Automatically select best personality for topic',
      specific: 'Use a specific personality by code',
      panel: 'Get multiple expert perspectives'
    },
    example_personalities: [
      'maya_college - College student learning civics',
      'james_veteran - Army veteran focused on civic duty',
      'michael_lawyer - Civil rights attorney',
      'anna_journalist - Investigative reporter',
      'carlos_activist - Community organizer'
    ]
  })
} 