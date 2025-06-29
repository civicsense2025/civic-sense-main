import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Check if AI features are disabled (for Vercel builds)
const AI_DISABLED = process.env.DISABLE_AI_FEATURES === 'true'

// Conditional imports - only load AI modules if features are enabled
let getCivicSenseAssistant: any, askAlex: any, getCivicActions: any, analyzePower: any

if (!AI_DISABLED) {
  try {
    const aiModule = await import('@/lib/ai/civicsense-assistant')
    getCivicSenseAssistant = aiModule.getCivicSenseAssistant
    askAlex = aiModule.askAlex
    getCivicActions = aiModule.getCivicActions
    analyzePower = aiModule.analyzePower
  } catch (error) {
    console.warn('AI modules not available:', error)
  }
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  userId: z.string().optional(),
  guestToken: z.string().optional(),
  sessionId: z.string().optional(),
  mode: z.enum(['chat', 'quick', 'actions', 'analysis']).default('chat')
})

// =============================================================================
// FALLBACK RESPONSES WHEN AI IS DISABLED
// =============================================================================

const AI_DISABLED_RESPONSE = {
  success: false,
  error: 'AI features are currently disabled in this environment',
  fallback: {
    message: "I'm currently unavailable, but you can still explore CivicSense's quiz topics and learn about how power works in government. Check out our quiz library for hands-on civic education!",
    confidence: 0,
    suggestions: [
      "Browse our quiz topics",
      "Learn about constitutional rights",
      "Explore local government functions",
      "Understand voting processes"
    ]
  }
}

// =============================================================================
// MAIN CHAT ENDPOINT
// =============================================================================

export async function POST(request: NextRequest) {
  // Return early if AI features are disabled
  if (AI_DISABLED || !getCivicSenseAssistant) {
    return NextResponse.json(AI_DISABLED_RESPONSE, { status: 503 })
  }

  try {
    const body = await request.json()
    const validatedInput = ChatRequestSchema.parse(body)
    
    const assistant = getCivicSenseAssistant()
    
    // Handle different interaction modes
    switch (validatedInput.mode) {
      case 'quick':
        // Quick question mode - just return the message
        const quickResponse = await askAlex(validatedInput.message, {
          userId: validatedInput.userId,
          sessionId: validatedInput.sessionId || `quick_${Date.now()}`
        })
        return NextResponse.json({
          success: true,
          mode: 'quick',
          response: {
            message: quickResponse,
            confidence: 75
          }
        })
      
      case 'actions':
        // Action-focused mode - extract topic and get actions
        const actions = await getCivicActions(validatedInput.message, 'routine')
        return NextResponse.json({
          success: true,
          mode: 'actions',
          response: {
            message: `Here are specific actions you can take regarding "${validatedInput.message}":`,
            actions,
            confidence: 85
          }
        })
      
      case 'analysis':
        // Power dynamics analysis mode
        const insights = await analyzePower(validatedInput.message)
        return NextResponse.json({
          success: true,
          mode: 'analysis',
          response: {
            message: `Here's the power dynamics analysis for "${validatedInput.message}":`,
            civic_insights: insights,
            confidence: 80
          }
        })
      
      default:
        // Full conversation mode
        const fullResult = await assistant.chat(
          validatedInput.message,
          {
            userId: validatedInput.userId,
            guestToken: validatedInput.guestToken,
            sessionId: validatedInput.sessionId || `chat_${Date.now()}`
          }
        )
        
        if (!fullResult.success) {
          throw new Error(fullResult.error || 'Assistant processing failed')
        }
        
        return NextResponse.json({
          success: true,
          mode: 'chat',
          response: fullResult.data,
          metadata: {
            tools_used: fullResult.data?.toolsUsed || [],
            processing_time: fullResult.metadata?.processingTime || 0,
            confidence: fullResult.data?.confidence || 50,
            civic_insights: fullResult.data?.civicInsights || [],
            action_suggestions: fullResult.data?.actionSuggestions || [],
            follow_up_questions: fullResult.data?.followUpQuestions || []
          }
        })
    }
    
  } catch (error) {
    console.error('Chat endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: AI_DISABLED_RESPONSE.fallback
    }, { status: 500 })
  }
}

// =============================================================================
// GET ENDPOINT FOR HEALTH CHECK
// =============================================================================

export async function GET(request: NextRequest) {
  // Return early if AI features are disabled
  if (AI_DISABLED || !askAlex) {
    return NextResponse.json({
      success: false,
      service: 'CivicSense Assistant (Disabled)',
      status: 'disabled',
      reason: 'AI features disabled in this environment',
      fallback_available: true
    })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const healthCheck = searchParams.get('health')
    
    if (healthCheck === 'true') {
      return NextResponse.json({
        success: true,
        service: 'CivicSense Assistant (Alex)',
        status: 'operational',
        personality_traits: [
          'Direct and honest - calls BS when seeing it',
          'Passionate about empowering citizens',
          'Skeptical of official narratives',
          'Solution-oriented with actionable steps',
          'Uses "we" language for solidarity'
        ],
        capabilities: [
          'Civic education chat',
          'Power dynamics analysis',
          'Action recommendations',
          'Fact checking and bias analysis',
          'Legislative analysis',
          'User behavior insights'
        ],
        ai_tools_integrated: [
          'UserBehaviorAnalyzerAI',
          'CivicActionGeneratorAI', 
          'PowerDynamicsAnalyzerAI',
          'EnhancedKeyTakeawaysWrapper',
          'CivicSenseBillAnalyzer',
          'EnhancedBiasAnalyzer',
          'MLThemeDetectorAI',
          'UnifiedAIOrchestrator'
        ]
      })
    }
    
    // Simple test interaction
    const testMessage = searchParams.get('test') || 'Hello Alex'
    const response = await askAlex(testMessage, { sessionId: `test_${Date.now()}` })
    
    return NextResponse.json({
      success: true,
      test_interaction: {
        user_message: testMessage,
        alex_response: response
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 })
  }
}

// =============================================================================
// USAGE EXAMPLES FOR FRONTEND
// =============================================================================

/*
USAGE EXAMPLES:

1. Full Conversation Mode:
POST /api/assistant/chat
{
  "message": "Help me understand why my rent keeps going up",
  "userId": "user_123",
  "mode": "chat"
}

2. Quick Answer Mode:
POST /api/assistant/chat
{
  "message": "What is gerrymandering?",
  "mode": "quick"
}

3. Action-Focused Mode:
POST /api/assistant/chat
{
  "message": "healthcare reform",
  "userId": "user_123", 
  "mode": "actions"
}

4. Power Analysis Mode:
POST /api/assistant/chat
{
  "message": "Supreme Court ethics rules",
  "mode": "analysis"
}

5. Health Check:
GET /api/assistant/chat?health=true

6. Test Interaction:
GET /api/assistant/chat?test=How does lobbying work?

RESPONSE FORMAT:
{
  "success": true,
  "mode": "chat",
  "response": {
    "message": "Here's what they don't want you to know about rent increases...",
    "actions": [
      {
        "type": "contact_official",
        "title": "Call Your City Council",
        "description": "Contact council about rent control policies",
        "urgency": "high",
        "timeRequired": "15 minutes",
        "contactInfo": {
          "name": "Council Member Jane Smith",
          "phone": "(555) 123-4567"
        }
      }
    ],
    "civic_insights": [
      {
        "type": "uncomfortable_truth",
        "content": "Real estate developers donated $2.3M to your city council last year",
        "impact": "local",
        "confidence": 95
      }
    ],
    "tools_used": ["PowerDynamicsAnalyzerAI", "CivicActionGeneratorAI"],
    "confidence": 88
  }
}
*/ 