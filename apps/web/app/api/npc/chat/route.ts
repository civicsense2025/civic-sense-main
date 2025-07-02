import { NextRequest, NextResponse } from 'next/server'
import { enhancedNPCService, type NPCConversationContext } from '@civicsense/shared/lib/enhanced-npc-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { npcId, triggerType, roomId } = body
    if (!npcId || !triggerType) {
      return NextResponse.json(
        { error: 'Missing required fields: npcId, triggerType' },
        { status: 400 }
      )
    }

    // Build conversation context from request body
    const context: NPCConversationContext = {
      npcId,
      triggerType,
      playerId: body.playerId,
      roomId: body.roomId,
      userMood: body.userMood,
      conversationHistory: body.conversationHistory,
      quizContext: body.quizContext
    }

    // Generate NPC response using OpenAI
    const response = await enhancedNPCService.generateNPCMessage(context)

    // Record the conversation if we have room context
    if (roomId && body.playerId) {
      await enhancedNPCService.recordConversation(
        npcId,
        roomId,
        body.playerId,
        response.message,
        context
      )
    }

    return NextResponse.json({
      success: true,
      response
    })

  } catch (error) {
    console.error('Error generating NPC chat:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate NPC response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 