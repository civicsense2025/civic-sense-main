import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@civicsense/shared/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// NPC Battle mode state
interface NPCBattleModeState {
  npcCharacter: NPCCharacter
  playerHealth: number
  npcHealth: number
  powerUpsUsed: PowerUp[]
  battlePhase: 'preparation' | 'battle' | 'victory' | 'defeat'
  currentAttack?: BattleAttack
  battleLog: BattleEvent[]
}

interface NPCCharacter {
  name: string
  avatar: string
  personality: 'aggressive' | 'defensive' | 'balanced'
  specialties: string[]
  catchphrases: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

interface PowerUp {
  id: string
  name: string
  description: string
  effect: 'extra_time' | 'hint' | 'double_damage' | 'health_boost'
  used: boolean
}

interface BattleAttack {
  type: 'correct_answer' | 'incorrect_answer' | 'time_penalty' | 'power_up'
  damage: number
  source: 'player' | 'npc'
  timestamp: number
}

interface BattleEvent {
  type: 'attack' | 'defense' | 'power_up' | 'trash_talk'
  source: 'player' | 'npc'
  message: string
  timestamp: number
}

// NPC characters for different civic topics
const NPC_CHARACTERS: Record<string, NPCCharacter> = {
  politician: {
    name: 'Senator Slick',
    avatar: '🎩',
    personality: 'aggressive',
    specialties: ['Constitutional Law', 'Campaign Finance', 'Legislative Process'],
    catchphrases: [
      'You clearly don\'t understand how Washington works!',
      'That\'s not how politics really operates, kid.',
      'I\'ve been in Congress longer than you\'ve been alive!',
      'Money talks, and you\'re clearly not listening.'
    ],
    difficulty: 'medium'
  },
  bureaucrat: {
    name: 'Director Red-Tape',
    avatar: '📋',
    personality: 'defensive',
    specialties: ['Federal Agencies', 'Regulatory Process', 'Administrative Law'],
    catchphrases: [
      'Have you read the 500-page manual on this?',
      'That requires approval from seventeen different committees.',
      'We\'ve always done it this way for a reason.',
      'I need to see your Form 27-B in triplicate.'
    ],
    difficulty: 'hard'
  },
  lobbyist: {
    name: 'Corporate Kate',
    avatar: '💼',
    personality: 'balanced',
    specialties: ['Corporate Influence', 'Interest Groups', 'Political Money'],
    catchphrases: [
      'Our industry experts disagree with that assessment.',
      'Think of the economic implications!',
      'We have data that suggests otherwise.',
      'That would create unnecessary regulatory burden.'
    ],
    difficulty: 'easy'
  }
}

// NPC Battle quiz mode - gamified civic education with AI opponents
export const npcBattleModePlugin: GameModePlugin<NPCBattleModeState> = createGameModePlugin({
  mode: 'npc_battle',
  displayName: 'NPC Battle',
  description: 'Face off against AI political figures who don\'t want you to learn the truth!',
  category: 'special',
  requiresPremium: true, // Premium feature
  config: {
    mode: 'npc_battle',
    settings: DEFAULT_MODE_CONFIGS.npc_battle
  },
  
  // Initialize NPC battle state
  getInitialState: (): NPCBattleModeState => {
    // Select NPC based on topic or random
    const npcKeys = Object.keys(NPC_CHARACTERS)
    const randomNPC = NPC_CHARACTERS[npcKeys[Math.floor(Math.random() * npcKeys.length)]]
    
    return {
      npcCharacter: randomNPC,
      playerHealth: 100,
      npcHealth: 100,
      powerUpsUsed: [],
      battlePhase: 'preparation',
      battleLog: [{
        type: 'trash_talk',
        source: 'npc',
        message: randomNPC.catchphrases[0],
        timestamp: Date.now()
      }]
    }
  },
  
  // NPC battle state reducer
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'START_MODE':
        return { ...state, battlePhase: 'battle' }
        
      case 'ANSWER_SUBMIT':
        const { answer } = action.payload
        const isCorrect = answer.isCorrect
        
        // Calculate damage based on answer correctness and speed
        const baseDamage = isCorrect ? 25 : 0
        const speedBonus = answer.timeSpent < 30 ? 10 : 0
        const playerDamage = baseDamage + speedBonus
        
        // NPC counterattack if player was wrong or slow
        const npcDamage = !isCorrect ? 20 : (answer.timeSpent > 45 ? 15 : 0)
        
        const newPlayerHealth = Math.max(0, state.playerHealth - npcDamage)
        const newNPCHealth = Math.max(0, state.npcHealth - playerDamage)
        
        // Create battle events
        const events: BattleEvent[] = [...state.battleLog]
        
        if (playerDamage > 0) {
          events.push({
            type: 'attack',
            source: 'player',
            message: `You dealt ${playerDamage} damage with your civic knowledge!`,
            timestamp: Date.now()
          })
        }
        
        if (npcDamage > 0) {
          const npcTrashTalk = state.npcCharacter.catchphrases[
            Math.floor(Math.random() * state.npcCharacter.catchphrases.length)
          ]
          events.push({
            type: 'attack',
            source: 'npc',
            message: `${state.npcCharacter.name}: ${npcTrashTalk} (-${npcDamage} HP)`,
            timestamp: Date.now()
          })
        }
        
        // Determine battle phase
        let battlePhase = state.battlePhase
        if (newNPCHealth <= 0) {
          battlePhase = 'victory'
          events.push({
            type: 'trash_talk',
            source: 'npc',
            message: 'Impossible! You actually know how power works!',
            timestamp: Date.now()
          })
        } else if (newPlayerHealth <= 0) {
          battlePhase = 'defeat'
          events.push({
            type: 'trash_talk',
            source: 'npc',
            message: 'That\'s what happens when you challenge the establishment!',
            timestamp: Date.now()
          })
        }
        
        return {
          ...state,
          playerHealth: newPlayerHealth,
          npcHealth: newNPCHealth,
          battlePhase,
          battleLog: events,
          currentAttack: {
            type: isCorrect ? 'correct_answer' : 'incorrect_answer',
            damage: playerDamage,
            source: 'player',
            timestamp: Date.now()
          }
        }
        
      case 'USE_POWERUP':
        const powerup = action.payload.powerup
        let healthBoost = 0
        
        if (powerup === 'health_boost') {
          healthBoost = 25
        }
        
        return {
          ...state,
          playerHealth: Math.min(100, state.playerHealth + healthBoost),
          powerUpsUsed: [...state.powerUpsUsed, {
            id: powerup,
            name: powerup,
            description: `Used ${powerup}`,
            effect: powerup as 'extra_time' | 'hint' | 'double_damage' | 'health_boost',
            used: true
          }],
          battleLog: [...state.battleLog, {
            type: 'power_up',
            source: 'player',
            message: `Used power-up: ${powerup}!`,
            timestamp: Date.now()
          }]
        }
        
      default:
        return state
    }
  },
  
  // Lifecycle hooks with NPC battle logic
  onModeStart: async (context) => {
    console.log('⚔️ Starting NPC Battle Mode!')
    
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        battle_mode: 'npc_battle',
        opponent: context.modeState?.npcCharacter?.name || 'Unknown NPC',
        civic_combat_enabled: true,
        power_structure_challenge: true
      }
    })
    
    // Show battle introduction
    context.actions.showModal(
      <div className="text-center p-6">
        <div className="text-6xl mb-4">{context.modeState?.npcCharacter?.avatar}</div>
        <h2 className="text-2xl font-bold mb-2">
          Prepare to battle {context.modeState?.npcCharacter?.name}!
        </h2>
        <p className="text-muted-foreground mb-4">
          This political figure doesn't want you to learn the truth. 
          Prove them wrong with your civic knowledge!
        </p>
        <p className="text-sm text-warning">
          🎯 Answer correctly and quickly to deal damage
          <br />
          💔 Wrong answers and slow responses let them attack you
        </p>
      </div>
    )
  },
  
  onAnswerSubmit: async (answer, context) => {
    // NPC battle allows all answers but processes them for battle mechanics
    console.log('⚔️ NPC Battle: Processing answer for combat...')
    return true
  },
  
  onQuestionComplete: async (question, answer, context) => {
    const battleState = context.modeState as NPCBattleModeState
    
    // Check for battle end conditions
    if (battleState.battlePhase === 'victory') {
      context.actions.showToast(
        'Victory! You defeated the establishment with civic knowledge!',
        'success'
      )
    } else if (battleState.battlePhase === 'defeat') {
      context.actions.showToast(
        'Defeated! Time to study more about how power really works.',
        'error'
      )
    }
  },
  
  onModeComplete: async (results, context) => {
    const battleState = context.modeState as NPCBattleModeState
    const isVictory = battleState.battlePhase === 'victory'
    
    console.log('🏆 NPC Battle completed!', {
      victory: isVictory,
      score: results.score,
      opponent: battleState.npcCharacter.name,
      powerUpsUsed: battleState.powerUpsUsed.length
    })
    
    // Bonus score for victory
    const battleBonus = isVictory ? 20 : 0
    const finalScore = Math.min(100, results.score + battleBonus)
    
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        battle_result: isVictory ? 'victory' : 'defeat',
        final_battle_score: finalScore,
        npc_defeated: isVictory,
        civic_combat_mastery: isVictory && results.score >= 80
      }
    })
  },
  
  // Custom rendering for NPC battle interface
  renderInterface: (context) => {
    const battleState = context.modeState as NPCBattleModeState
    
    return (
      <div className="npc-battle-interface bg-gradient-to-r from-red-900/20 to-blue-900/20 p-4 rounded-lg border">
        {/* Battle Status */}
        <div className="flex justify-between items-center mb-4">
          {/* Player Health */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">You</div>
            <div className="w-24 bg-gray-300 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all" 
                style={{ width: `${battleState.playerHealth}%` }}
              />
            </div>
            <div className="text-xs">{battleState.playerHealth}/100 HP</div>
          </div>
          
          {/* VS Indicator */}
          <div className="text-2xl font-bold">⚔️</div>
          
          {/* NPC Health */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">{battleState.npcCharacter.name}</div>
            <div className="w-24 bg-gray-300 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all" 
                style={{ width: `${battleState.npcHealth}%` }}
              />
            </div>
            <div className="text-xs">{battleState.npcHealth}/100 HP</div>
          </div>
        </div>
        
        {/* Battle Log */}
        <div className="bg-black/20 rounded p-3 h-24 overflow-y-auto">
          <div className="text-xs space-y-1">
            {battleState.battleLog.slice(-3).map((event, index) => (
              <div key={index} className={`
                ${event.source === 'player' ? 'text-blue-300' : 'text-red-300'}
              `}>
                {event.message}
              </div>
            ))}
          </div>
        </div>
        
        {/* NPC Character Display */}
        <div className="flex items-center justify-center mt-4 p-3 bg-black/10 rounded">
          <div className="text-4xl mr-3">{battleState.npcCharacter.avatar}</div>
          <div className="text-sm">
            <div className="font-semibold">{battleState.npcCharacter.name}</div>
            <div className="text-muted-foreground capitalize">
              {battleState.npcCharacter.personality} • {battleState.npcCharacter.difficulty}
            </div>
          </div>
        </div>
      </div>
    )
  },
  
  // Custom results rendering
  renderResults: (results, context) => {
    const battleState = context.modeState as NPCBattleModeState
    const isVictory = battleState.battlePhase === 'victory'
    
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">
          {isVictory ? '🏆' : '💀'}
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${
          isVictory ? 'text-green-600' : 'text-red-600'
        }`}>
          {isVictory ? 'VICTORY!' : 'DEFEAT!'}
        </h2>
        <p className="mb-4">
          {isVictory 
            ? `You defeated ${battleState.npcCharacter.name} with your civic knowledge!`
            : `${battleState.npcCharacter.name} proved that you still have more to learn.`
          }
        </p>
        <div className="bg-muted p-4 rounded-lg">
          <div>Final Score: {results.score}%</div>
          <div>Power-ups Used: {battleState.powerUpsUsed.length}</div>
          <div>Battle Rating: {isVictory ? 'Democratic Champion' : 'Aspiring Citizen'}</div>
        </div>
      </div>
    )
  },
  
  // Custom time limits based on battle pressure
  getTimeLimit: (question, context) => {
    const battleState = context.modeState as NPCBattleModeState
    const baseLimit = context.modeSettings.timeLimit || 30
    
    // Time pressure increases as NPC gets more damaged (desperate)
    const npcDesperation = (100 - battleState.npcHealth) / 100
    const pressureReduction = Math.floor(baseLimit * npcDesperation * 0.3)
    
    return Math.max(15, baseLimit - pressureReduction)
  },
  
  // Battle-specific analytics
  getAnalyticsData: (context) => {
    const battleState = context.modeState as NPCBattleModeState
    
    return {
      mode: 'npc_battle',
      opponent: battleState.npcCharacter.name,
      battle_result: battleState.battlePhase,
      power_ups_used: battleState.powerUpsUsed.length,
      final_player_health: battleState.playerHealth,
      civic_combat_engagement: true,
      establishment_challenged: true
    }
  }
})

// Register the NPC battle mode plugin
import { gameModeRegistry } from './types'
gameModeRegistry.register(npcBattleModePlugin) 