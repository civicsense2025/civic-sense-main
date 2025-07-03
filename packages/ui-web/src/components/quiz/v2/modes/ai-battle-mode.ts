import type { GameMode, AIBattleSettings } from './types'
import { toast } from '../../../../components/ui/toast-utils'

export const aiBattleMode: GameMode<AIBattleSettings> = {
  id: 'ai-battle',
  displayName: 'AI Battle',
  description: 'Challenge AI opponents with unique personalities',
  icon: '🤖',
  
  defaultSettings: {
    npcId: 'civic-sage', // Default NPC
    npcDifficulty: 'medium',
    timeLimit: 30,
    powerupsEnabled: true,
    topics: []
  },
  
  validateSettings: (settings) => {
    const errors: string[] = []
    
    if (!settings.npcId) {
      errors.push('An NPC opponent must be selected')
    }
    
    if (settings.topics.length === 0) {
      errors.push('At least one topic must be selected')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  onModeStart: (settings) => {
    // Show NPC introduction
    const npcIntros: Record<string, string> = {
      'civic-sage': "The Civic Sage challenges you! 'Let's see if you truly understand how power works...'",
      'democracy-defender': "Democracy Defender appears! 'Time to test your civic knowledge!'",
      'political-pundit': "Political Pundit smirks. 'Think you know politics? Prove it!'",
      'history-hawk': "History Hawk swoops in! 'Those who don't know history are doomed to repeat it...'"
    }
    
    toast({
      title: "AI Battle Begin! 🤖",
      description: npcIntros[settings.npcId] || "Your AI opponent is ready!",
      className: "bg-purple-500/10 border-purple-500"
    })
  },
  
  onQuestionStart: (question, questionIndex, settings) => {
    // Simulate NPC thinking/trash talk
    if (Math.random() > 0.7) {
      const npcComments = [
        "The AI is analyzing the question...",
        "Your opponent seems confident!",
        "The AI is considering their answer carefully...",
        "Your opponent answered quickly!"
      ]
      
      setTimeout(() => {
        toast({
          title: "🤖 NPC Activity",
          description: npcComments[Math.floor(Math.random() * npcComments.length)],
          className: "bg-purple-500/10 border-purple-500"
        })
      }, 2000)
    }
  },
  
  onAnswerSubmit: (answer, isCorrect, timeSpent, settings) => {
    // Simulate NPC performance based on difficulty
    const npcCorrectChance = {
      easy: 0.6,
      medium: 0.75,
      hard: 0.9,
      adaptive: 0.7 // Adjusts based on player performance
    }
    
    const npcGotItRight = Math.random() < npcCorrectChance[settings.npcDifficulty]
    const npcTime = Math.random() * (settings.timeLimit || 30) * 0.8 // NPC usually faster
    
    // Compare performance
    if (isCorrect && !npcGotItRight) {
      toast({
        title: "You outsmarted the AI! 🎯",
        description: "Your opponent got this one wrong!",
        className: "bg-green-500/10 border-green-500"
      })
    } else if (!isCorrect && npcGotItRight) {
      toast({
        title: "The AI got it right! 🤖",
        description: "Your opponent scored on this question!",
        className: "bg-red-500/10 border-red-500"
      })
    } else if (isCorrect && npcGotItRight && timeSpent < npcTime) {
      toast({
        title: "Speed advantage! ⚡",
        description: "You answered faster than the AI!",
        className: "bg-yellow-500/10 border-yellow-500"
      })
    }
  },
  
  onQuizComplete: (results, settings) => {
    // Calculate NPC score
    const npcScore = Math.floor(Math.random() * 20) + 70 // 70-90%
    const playerWon = results.score > npcScore
    
    if (playerWon) {
      toast({
        title: "Victory! 🏆",
        description: `You defeated the AI with ${results.score}% vs ${npcScore}%!`,
        className: "bg-primary/10 border-primary"
      })
    } else {
      toast({
        title: "Defeated! 💀",
        description: `The AI won with ${npcScore}% vs ${results.score}%. Try again!`,
        variant: "destructive"
      })
    }
  }
}

// Available NPCs
export const availableNPCs = [
  {
    id: 'civic-sage',
    name: 'The Civic Sage',
    description: 'A wise AI that knows every amendment by heart',
    personality: 'Thoughtful and methodical',
    avatar: '🧙'
  },
  {
    id: 'democracy-defender',
    name: 'Democracy Defender',
    description: 'A passionate advocate for democratic values',
    personality: 'Energetic and competitive',
    avatar: '🦸'
  },
  {
    id: 'political-pundit',
    name: 'Political Pundit',
    description: 'A sharp-tongued analyst who never misses',
    personality: 'Sarcastic and quick',
    avatar: '🎙️'
  },
  {
    id: 'history-hawk',
    name: 'History Hawk',
    description: 'Has memorized every historical precedent',
    personality: 'Academic and precise',
    avatar: '🦅'
  }
] 