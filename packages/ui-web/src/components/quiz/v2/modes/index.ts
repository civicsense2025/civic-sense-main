// Simple Game Mode System for Quiz Engine V2
// No complex registries or circular dependencies

// Export all modes
export { standardMode } from './standard-mode'
export { aiBattleMode } from './ai-battle-mode'
export { pvpMode } from './pvp-mode'

// Export types
export type { 
  GameMode, 
  GameModeId,
  StandardModeSettings,
  AIBattleSettings,
  PVPSettings,
  ModeState,
  MultiTopicQuizSession
} from './types'

// Import modes for the registry
import { standardMode } from './standard-mode'
import { aiBattleMode } from './ai-battle-mode'
import { pvpMode } from './pvp-mode'
import type { GameMode } from './types'

// Simple mode registry - just 3 core modes with customizable settings
export const gameModes: Record<string, GameMode> = {
  'standard': standardMode,
  'ai-battle': aiBattleMode,
  'pvp': pvpMode
}

// Helper to get a mode by ID
export function getGameMode(modeId: string): GameMode | undefined {
  return gameModes[modeId]
}

// List of all available modes
export const availableModes = Object.values(gameModes)

// Get modes for UI display
export function getModesForDisplay() {
  return Object.entries(gameModes).map(([id, mode]) => ({
    id,
    displayName: mode.displayName,
    description: mode.description,
    icon: mode.icon,
    defaultSettings: mode.defaultSettings
  }))
} 