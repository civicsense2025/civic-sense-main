// Game Mode Plugin Registry
// This file demonstrates how the extensible quiz system works

import { gameModeRegistry } from './types'
import { standardModePlugin } from './standard-mode'
import { npcBattleModePlugin } from './npc-battle-mode'
import { practiceModePlugin } from './practice-mode'
import { assessmentModePlugin } from './assessment-mode'
import { multiplayerModePlugin } from './multiplayer-mode'

// Import new game modes for Phase 2 - Temporarily commented to fix infinite loop
// import { flashcardModePlugin } from './flashcard-mode'
// import { scenarioModePlugin } from './scenario-mode'  // REMOVED - was causing infinite loops
// import { speedRoundModePlugin } from './speed-round-mode'
// import { debateModePlugin } from './debate-mode'

// Track initialization to prevent multiple calls
let isInitialized = false

/**
 * Register all available game mode plugins
 * This is called once when the application starts
 */
export function initializeGameModes() {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('🎮 Game modes already initialized, skipping...')
    return
  }
  
  console.log('🎮 Initializing CivicSense Game Mode Plugins...')
  
  // Clear registry first to avoid duplicate registrations
  gameModeRegistry['modes'] = new Map()
  
  // Register core modes only for now
  gameModeRegistry.register(standardModePlugin)
  gameModeRegistry.register(npcBattleModePlugin)
  gameModeRegistry.register(practiceModePlugin)
  gameModeRegistry.register(assessmentModePlugin)
  gameModeRegistry.register(multiplayerModePlugin)
  
  // Register new Phase 2 modes - Temporarily disabled
  // gameModeRegistry.register(flashcardModePlugin)
  // Scenario mode removed due to infinite loop issues
  // gameModeRegistry.register(speedRoundModePlugin)
  // gameModeRegistry.register(debateModePlugin)
  
  const registeredModes = gameModeRegistry.getAll()
  console.log(`✅ Registered ${registeredModes.length} game mode plugins:`)
  
  registeredModes.forEach((plugin) => {
    console.log(`   - ${plugin.displayName} (${plugin.mode}) - ${plugin.category}`)
  })
  
  // Validate all registered modes align with database constraints
  const databaseCompatibleModes = [
    'standard', 'practice', 'assessment', 'multiplayer_casual', 
    'multiplayer_ranked', 'tournament', 'team_vs_team', 
    'speed_round', 'debate_mode'
  ]
  
  registeredModes.forEach(plugin => {
    const mode = plugin.mode
    if (plugin && plugin.category !== 'special' && !databaseCompatibleModes.includes(mode)) {
      console.warn(`⚠️  Mode "${mode}" may not be compatible with database constraint`)
    }
  })
  
  // Mark as initialized
  isInitialized = true
}

/**
 * Ensure game modes are initialized (safe to call multiple times)
 */
export function ensureGameModesInitialized() {
  if (isInitialized) {
    console.log('🎮 Game modes already initialized, skipping')
    return
  }
  
  console.log('🎮 Initializing CivicSense game modes...')
  
  try {
    // Register core game modes (stable)
    gameModeRegistry.register(standardModePlugin)
    gameModeRegistry.register(practiceModePlugin)
    gameModeRegistry.register(assessmentModePlugin)
    gameModeRegistry.register(npcBattleModePlugin)
    gameModeRegistry.register(multiplayerModePlugin)
    
    // Register Phase 2 modes (when ready)
    // gameModeRegistry.register(flashcardModePlugin)
    // Scenario mode removed due to infinite loop issues
    // gameModeRegistry.register(speedRoundModePlugin)
    // gameModeRegistry.register(debateModePlugin)
    
    isInitialized = true
    console.log('✅ Game modes initialized successfully:', gameModeRegistry.getAll().map((m: any) => m.mode))
  } catch (error) {
    console.error('❌ Failed to initialize game modes:', error)
  }
}

// Export plugin registry for external use
export { gameModeRegistry }

// DO NOT auto-initialize here - let components initialize when needed
// This prevents infinite loops and multiple registrations

/**
 * Get available modes for a specific user context
 */
export function getAvailableModes(isAuthenticated: boolean, isPremium: boolean) {
  ensureGameModesInitialized() // Ensure initialized before use
  return gameModeRegistry.getAccessible(isAuthenticated, isPremium)
}

/**
 * Get modes by category for UI organization
 */
export function getModesByCategory() {
  ensureGameModesInitialized() // Ensure initialized before use
  return {
    solo: gameModeRegistry.getByCategory('solo'),
    multiplayer: gameModeRegistry.getByCategory('multiplayer'),
    assessment: gameModeRegistry.getByCategory('assessment'),
    special: gameModeRegistry.getByCategory('special')
  }
}

/**
 * Example of how to create a new mode plugin (for documentation)
 * This shows the pattern - actual implementation would be in separate files
 */
export function createCustomModeExample() {
  console.log(`
🔧 To create a new game mode plugin:

1. Define your mode interfaces:
   interface MyModeState { ... }
   
2. Create the plugin using createGameModePlugin():
   const myModePlugin = createGameModePlugin({
     mode: 'practice', // Use valid QuizGameMode
     displayName: 'Practice Mode',
     description: 'Learn without pressure',
     category: 'solo',
     
     // Custom lifecycle hooks
     onModeStart: async (context) => { ... },
     onAnswerSubmit: async (answer, context) => { ... },
     calculateScore: (answers, questions) => { ... },
     
     // Custom rendering (optional)
     renderInterface: (context) => <CustomUI />,
     renderResults: (results, context) => <CustomResults />
   })
   
3. Register the plugin:
   gameModeRegistry.register(myModePlugin)
   
✅ See standard-mode.tsx and npc-battle-mode.tsx for complete examples!
  `)
}

// Export types for external use
export type { GameModePlugin, QuizEngineContext, QuizEngineActions } from './types' 