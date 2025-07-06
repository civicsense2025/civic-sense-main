import { NextRequest, NextResponse } from 'next/server'
import { enhancedNPCService } from '@/lib/enhanced-npc-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | null

    // Get all NPCs from the service
    const allNPCs = await enhancedNPCService.getAllNPCs()

    if (!difficulty) {
      return NextResponse.json({
        success: true,
        npcs: allNPCs
      })
    }

    // Map difficulty to skill level
    const targetSkillLevels = (() => {
      switch (difficulty) {
        case 'easy':
          return ['beginner', 'Beginner']
        case 'medium':
          return ['intermediate', 'Intermediate']
        case 'hard':
          return ['expert', 'Expert', 'advanced', 'Advanced']
        default:
          return ['intermediate', 'Intermediate']
      }
    })()

    // Filter NPCs by difficulty and take up to 6
    const filteredNPCs = allNPCs
      .filter(npc => targetSkillLevels.includes(npc.skillLevel))
      .slice(0, 6)

    // If no exact matches, take any NPCs
    const finalNPCs = filteredNPCs.length === 0 ? allNPCs.slice(0, 6) : filteredNPCs

    return NextResponse.json({
      success: true,
      npcs: finalNPCs,
      filtered: filteredNPCs.length > 0
    })

  } catch (error) {
    console.error('Error fetching NPCs:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch NPCs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 