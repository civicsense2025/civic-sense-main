import { useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { X, Trophy, Medal, Crown, Bot, Zap, Clock } from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import type { MultiplayerPlayer, MultiplayerQuestionResponse } from '@civicsense/shared/lib/multiplayer'

interface MultiplayerLeaderboardProps {
  players: MultiplayerPlayer[]
  responses: MultiplayerQuestionResponse[]
  currentPlayerId: string
  onClose: () => void
}

interface PlayerScore {
  playerId: string
  playerName: string
  playerEmoji: string
  isNPC: boolean
  isHost: boolean
  isCurrentPlayer: boolean
  correctAnswers: number
  totalAnswers: number
  accuracy: number
  totalScore: number
  averageResponseTime: number
  rank: number
}

export function Leaderboard({
  players,
  responses,
  currentPlayerId,
  onClose
}: MultiplayerLeaderboardProps) {
  const leaderboard = useMemo(() => {
    const playerScores: PlayerScore[] = players.map(player => {
      const playerResponses = responses.filter(r => r.player_id === player.id)
      const correctAnswers = playerResponses.filter(r => r.is_correct).length
      const totalAnswers = playerResponses.length
      const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      
      // Calculate total score (100 points per correct answer)
      const totalScore = correctAnswers * 100
      
      // Calculate average response time
      const averageResponseTime = totalAnswers > 0 
        ? playerResponses.reduce((sum, r) => sum + (r.response_time_ms || 0) / 1000, 0) / totalAnswers
        : 0

      return {
        playerId: player.id,
        playerName: player.player_name,
        playerEmoji: player.player_emoji || '🎮',
        isNPC: player.guest_token?.startsWith('npc_') ?? false,
        isHost: player.is_host ?? false,
        isCurrentPlayer: player.id === currentPlayerId,
        correctAnswers,
        totalAnswers,
        accuracy,
        totalScore,
        averageResponseTime,
        rank: 0 // Will be set below
      }
    })

    // Sort by score (descending), then by accuracy, then by response time (ascending)
    playerScores.sort((a, b) => {
      if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore
      if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy
      return a.averageResponseTime - b.averageResponseTime
    })

    // Assign ranks
    playerScores.forEach((player, index) => {
      player.rank = index + 1
    })

    return playerScores
  }, [players, responses, currentPlayerId])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-slate-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 3:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Leaderboard</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {players.length} players
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {leaderboard.map((player, index) => (
            <div
              key={player.playerId}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all",
                player.isCurrentPlayer 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                player.rank <= 3 && "ring-2 ring-offset-2",
                player.rank === 1 && "ring-yellow-200 dark:ring-yellow-800",
                player.rank === 2 && "ring-gray-200 dark:ring-gray-700",
                player.rank === 3 && "ring-amber-200 dark:ring-amber-800"
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12">
                {getRankIcon(player.rank)}
              </div>

              {/* Player Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg">
                    {player.playerEmoji}
                  </div>
                  {player.isNPC && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {player.isHost && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {player.playerName}
                    </h3>
                    {player.isCurrentPlayer && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                    {player.isNPC && (
                      <Badge variant="secondary" className="text-xs">
                        AI
                      </Badge>
                    )}
                    {player.isHost && (
                      <Badge variant="outline" className="text-xs">
                        Host
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span>{player.totalScore} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{player.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{player.averageResponseTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="text-right">
                <div className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  getRankBadgeColor(player.rank)
                )}>
                  #{player.rank}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {player.correctAnswers}/{player.totalAnswers} correct
                </div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scores yet. Start answering questions!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 