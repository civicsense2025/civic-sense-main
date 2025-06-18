import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, Clock, Crown, Zap, Timer, Bot, User } from 'lucide-react'
import type { MultiplayerPlayer, MultiplayerQuestionResponse } from '@/lib/multiplayer'

interface PlayerPanelProps {
  players: MultiplayerPlayer[]
  currentPlayerId: string
  questionResponses?: MultiplayerQuestionResponse[]
  showAnswerStatus?: boolean
  gamePhase: 'waiting' | 'active' | 'between_questions' | 'completed'
  className?: string
}

interface PlayerStatus {
  hasAnswered: boolean
  isCorrect?: boolean
  responseTime?: number
  isReady: boolean
}

// NPC personality info mapping
const NPC_INFO: Record<string, { name: string; role: string; skillLevel: string; emoji: string }> = {
  'civic_scholar': {
    name: 'Dr. Martinez',
    role: 'Political Science PhD',
    skillLevel: 'Advanced',
    emoji: '👨🏽‍🎓'
  },
  'news_junkie': {
    name: 'Sam',
    role: 'News Enthusiast',
    skillLevel: 'Intermediate',
    emoji: '👩🏻‍💻'
  },
  'curious_newcomer': {
    name: 'Riley',
    role: 'Civic Newcomer',
    skillLevel: 'Beginner',
    emoji: '🧑🏾‍🎓'
  },
  'young_voter': {
    name: 'Alex',
    role: 'First-Time Voter',
    skillLevel: 'Beginner',
    emoji: '👨🏻‍💼'
  },
  'local_activist': {
    name: 'Jordan',
    role: 'Community Organizer',
    skillLevel: 'Intermediate',
    emoji: '👩🏿‍🏫'
  },
  'retired_teacher': {
    name: 'Ms. Chen',
    role: 'Civics Teacher',
    skillLevel: 'Intermediate',
    emoji: '👩🏻‍🏫'
  }
}

export function PlayerPanel({
  players,
  currentPlayerId,
  questionResponses = [],
  showAnswerStatus = false,
  gamePhase,
  className
}: PlayerPanelProps) {
  const getPlayerStatus = (playerId: string): PlayerStatus => {
    const response = questionResponses.find(r => r.player_id === playerId)
    const player = players.find(p => p.id === playerId)
    
    return {
      hasAnswered: !!response,
      isCorrect: response?.is_correct,
      responseTime: response?.response_time_seconds,
      isReady: player?.is_ready ?? false
    }
  }

  const getNPCInfo = (player: MultiplayerPlayer) => {
    if (!player.guest_token?.startsWith('npc_')) return null
    
    const npcId = player.guest_token.replace('npc_', '')
    return NPC_INFO[npcId] || {
      name: player.player_name,
      role: 'AI Assistant',
      skillLevel: 'Intermediate',
      emoji: player.player_emoji
    }
  }

  const getStatusIcon = (status: PlayerStatus) => {
    if (gamePhase === 'waiting') {
      return status.isReady ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Clock className="h-4 w-4 text-amber-500" />
      )
    }

    if (showAnswerStatus) {
      if (!status.hasAnswered) {
        return <Timer className="h-4 w-4 text-amber-500 animate-pulse" />
      }
      
      return status.isCorrect ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <div className="h-4 w-4 rounded-full bg-red-500" />
      )
    }

    return null
  }

  const getStatusText = (status: PlayerStatus, isNPC: boolean) => {
    if (gamePhase === 'waiting') {
      return status.isReady ? 'Ready' : 'Not Ready'
    }

    if (showAnswerStatus) {
      if (!status.hasAnswered) {
        return isNPC ? 'Thinking...' : 'Answering...'
      }
      
      const correctText = status.isCorrect ? 'Correct' : 'Incorrect'
      return status.responseTime ? `${correctText} (${status.responseTime}s)` : correctText
    }

    return 'Waiting'
  }

  const getCardBorder = (player: MultiplayerPlayer, status: PlayerStatus) => {
    if (player.id === currentPlayerId) {
      return 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
    }

    if (showAnswerStatus && status.hasAnswered) {
      return status.isCorrect 
        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
        : 'border-red-500 bg-red-50 dark:bg-red-950/20'
    }

    if (gamePhase === 'waiting') {
      return status.isReady 
        ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
        : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
    }

    return 'border-slate-200 dark:border-slate-700'
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {players.map((player) => {
          const status = getPlayerStatus(player.id)
          const isNPC = player.guest_token?.startsWith('npc_') ?? false
          const npcInfo = getNPCInfo(player)
          const isCurrentPlayer = player.id === currentPlayerId

          return (
            <Card
              key={player.id}
              className={cn(
                "flex-shrink-0 w-36 transition-all duration-200 border-2",
                getCardBorder(player, status)
              )}
            >
              <div className="p-2">
                                  <div className="flex items-center gap-2 mb-1">
                  {/* Player Avatar */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                      {npcInfo?.emoji || player.player_emoji}
                    </div>
                    
                    {/* NPC Badge */}
                    {isNPC && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="h-2 w-2 text-white" />
                      </div>
                    )}
                    
                    {/* Host Crown */}
                    {player.is_host && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-1 flex justify-end">
                    {getStatusIcon(status)}
                  </div>
                </div>

                {/* Player Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h3 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {npcInfo?.name || player.player_name}
                    </h3>
                    
                    {isCurrentPlayer && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        You
                      </Badge>
                    )}
                    
                    {isNPC && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        AI
                      </Badge>
                    )}
                    
                    {player.is_host && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Host
                      </Badge>
                    )}
                  </div>

                  {/* NPC Role & Skill Level */}
                  {isNPC && npcInfo && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="truncate">{npcInfo.role}</div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{npcInfo.skillLevel}</span>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {getStatusText(status, isNPC)}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 