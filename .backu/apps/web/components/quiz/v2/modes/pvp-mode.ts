import type { GameMode, PVPSettings } from './types'
import { toast } from '@civicsense/business-logic/utils'

export const pvpMode: GameMode<PVPSettings> = {
  id: 'pvp',
  displayName: 'PVP Mode',
  description: 'Compete against other players in real-time',
  icon: '⚔️',
  
  defaultSettings: {
    roomSize: 4,
    timeLimit: 30,
    chatEnabled: true,
    spectatorMode: false,
    topics: [],
    isPrivate: false
  },
  
  validateSettings: (settings) => {
    const errors: string[] = []
    
    if (settings.roomSize < 2 || settings.roomSize > 8) {
      errors.push('Room size must be between 2-8 players')
    }
    
    if (settings.topics.length === 0) {
      errors.push('At least one topic must be selected')
    }
    
    if (settings.isPrivate && !settings.roomCode) {
      errors.push('Private rooms require a room code')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  onModeStart: (settings) => {
    toast({
      title: "Multiplayer Battle! ⚔️",
      description: `Waiting for ${settings.roomSize} players to join...`,
      className: "bg-blue-500/10 border-blue-500"
    })
    
    // In real implementation, this would connect to multiplayer server
    console.log('🎮 Initializing PVP mode:', {
      roomSize: settings.roomSize,
      isPrivate: settings.isPrivate,
      roomCode: settings.roomCode,
      topics: settings.topics
    })
  },
  
  onQuestionStart: (question, questionIndex, settings) => {
    // Show other players' progress
    toast({
      title: "Question " + (questionIndex + 1),
      description: "All players are answering...",
      className: "bg-blue-500/10 border-blue-500"
    })
  },
  
  onAnswerSubmit: (answer, isCorrect, timeSpent, settings) => {
    // In real implementation, this would send answer to server
    const position = Math.floor(Math.random() * settings.roomSize) + 1
    
    if (position === 1) {
      toast({
        title: "First to answer! 🥇",
        description: isCorrect ? "And you got it right!" : "But it was incorrect...",
        className: isCorrect ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
      })
    } else {
      toast({
        title: `Position #${position}`,
        description: `${settings.roomSize - position} players were faster!`,
        className: "bg-yellow-500/10 border-yellow-500"
      })
    }
  },
  
  onQuizComplete: (results, settings) => {
    // Simulate final rankings
    const playerRank = Math.floor(Math.random() * settings.roomSize) + 1
    
    const rankEmojis: Record<number, string> = {
      1: '🥇',
      2: '🥈',
      3: '🥉'
    }
    
    if (playerRank <= 3) {
      toast({
        title: `${rankEmojis[playerRank]} Rank #${playerRank}!`,
        description: `You finished in the top 3 with ${results.score}%!`,
        className: "bg-primary/10 border-primary"
      })
    } else {
      toast({
        title: `Rank #${playerRank}`,
        description: `Keep practicing to climb the leaderboard!`,
        className: "bg-muted/10 border-muted"
      })
    }
  }
}

// Helper functions for PVP mode
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const pvpRoomSizes = [
  { value: 2, label: '1v1 Duel', icon: '🤺' },
  { value: 4, label: '4 Player', icon: '👥' },
  { value: 6, label: '6 Player', icon: '👥👥' },
  { value: 8, label: '8 Player Max', icon: '👥👥👥👥' }
] 