import { NextRequest, NextResponse } from 'next/server'
import { getPersonalityManager, type CivicPersonality, type PersonalityMatch } from '@/lib/ai/personality-manager'
import { z } from 'zod'

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
// MAIN PERSONALITY CHAT ENDPOINT
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedInput = PersonalityChatRequestSchema.parse(body)
    const personalityManager = getPersonalityManager()

    switch (validatedInput.mode) {
      case 'auto': {
        // Auto-select best personality for the topic
        const match = await personalityManager.findBestPersonalityMatch(
          validatedInput.topic || validatedInput.message
        )

        if (!match) {
          return NextResponse.json({
            success: false,
            error: 'No relevant personality found for this topic'
          }, { status: 404 })
        }

        const response = personalityManager.generatePersonalityResponse(
          match.personality,
          validatedInput.message,
          `Based on your question about "${validatedInput.message}", here's what I've learned:`,
          { relevanceScore: match.relevanceScore, expertise: match.expertiseAreas }
        )

        return NextResponse.json({
          success: true,
          mode: 'auto',
          response: {
            message: response,
            personality: {
              name: match.personality.display_name,
              emoji: match.personality.emoji,
              expertise: match.personality.preferred_topics,
              background: match.personality.byline
            },
            matchInfo: {
              relevanceScore: match.relevanceScore,
              matchReasons: match.matchReasons,
              expertiseAreas: match.expertiseAreas
            }
          }
        })
      }

      case 'specific': {
        // Use a specific personality
        if (!validatedInput.personalityCode) {
          return NextResponse.json({
            success: false,
            error: 'Personality code required for specific mode'
          }, { status: 400 })
        }

        const personality = await personalityManager.getPersonality(validatedInput.personalityCode)
        if (!personality) {
          return NextResponse.json({
            success: false,
            error: 'Personality not found'
          }, { status: 404 })
        }

        const response = personalityManager.generatePersonalityResponse(
          personality,
          validatedInput.message,
          `Here's my perspective on "${validatedInput.message}":`,
          { directRequest: true }
        )

        return NextResponse.json({
          success: true,
          mode: 'specific',
          response: {
            message: response,
            personality: {
              name: personality.display_name,
              emoji: personality.emoji,
              expertise: personality.preferred_topics,
              background: personality.byline,
              profession: personality.profession
            }
          }
        })
      }

      case 'panel': {
        // Get multiple expert perspectives
        const experts = await personalityManager.getExpertPanel(
          validatedInput.topic || validatedInput.message,
          validatedInput.maxExperts
        )

        if (experts.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No relevant experts found for this topic'
          }, { status: 404 })
        }

        const panelResponses = experts.map(expert => ({
          personality: {
            name: expert.personality.display_name,
            emoji: expert.personality.emoji,
            profession: expert.personality.profession,
            background: expert.personality.byline,
            expertise: expert.personality.preferred_topics
          },
          response: personalityManager.generatePersonalityResponse(
            expert.personality,
            validatedInput.message,
            `From my experience, here's what you need to know about "${validatedInput.message}":`,
            { panelDiscussion: true, expertiseAreas: expert.expertiseAreas }
          ),
          relevanceScore: expert.relevanceScore,
          matchReasons: expert.matchReasons
        }))

        return NextResponse.json({
          success: true,
          mode: 'panel',
          response: {
            message: `I've consulted with ${experts.length} experts on this topic:`,
            panelResponses,
            synthesis: generatePanelSynthesis(panelResponses, validatedInput.message)
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid mode specified'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Personality chat error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// =============================================================================
// GET ENDPOINT - LIST AVAILABLE PERSONALITIES
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profession = searchParams.get('profession')
    const skillLevel = searchParams.get('skill_level')
    const topic = searchParams.get('topic')

    const personalityManager = getPersonalityManager()
    
    let personalities: CivicPersonality[]
    
    if (profession || skillLevel || topic) {
      // Search with criteria
      personalities = await personalityManager.searchPersonalities({
        profession: profession || undefined,
        skill_level: skillLevel || undefined,
        topics: topic ? [topic] : undefined
      })
    } else {
      // Get all personalities
      personalities = await personalityManager.getAllPersonalities()
    }

    // Transform for frontend consumption
    const personalityList = personalities.map(p => ({
      npc_code: p.npc_code,
      name: p.display_name,
      emoji: p.emoji,
      profession: p.profession,
      expertise: p.preferred_topics,
      background: p.byline,
      skill_level: p.base_skill_level,
      communication_style: p.communication_style,
      political_engagement: p.political_engagement_level
    }))

    return NextResponse.json({
      success: true,
      personalities: personalityList,
      total: personalityList.length
    })

  } catch (error) {
    console.error('Error fetching personalities:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch personalities'
    }, { status: 500 })
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generatePanelSynthesis(
  panelResponses: any[],
  originalMessage: string
): string {
  const expertNames = panelResponses.map(r => r.personality.name).join(', ')
  
  return `
**Expert Panel Summary:**

Our experts (${expertNames}) have provided their perspectives on "${originalMessage}". 

**Key Themes:**
${panelResponses.map((r, i) => `${i + 1}. ${r.personality.profession} perspective: ${r.matchReasons[0] || 'Professional insight'}`).join('\n')}

**Action Steps:**
The panel suggests focusing on understanding this issue from multiple angles, as each expert brings unique insights based on their professional experience and expertise.

**Next Steps:**
Consider which expert's perspective resonates most with your current needs, and feel free to ask follow-up questions to any specific expert.
  `.trim()
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