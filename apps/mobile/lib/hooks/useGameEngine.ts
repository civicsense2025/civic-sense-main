import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  UniversalGameEngine, 
  GameConfiguration, 
  Question, 
  SinglePlayerResult, 
  MultiplayerResult 
} from '../multiplayer/universal-game-engine';

// ============================================================================
// TYPES
// ============================================================================

export interface GameState {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error';
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  timeRemaining: number;
  progress: number;
  error: string | null;
}

export interface GameActions {
  startGame: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<{ isCorrect: boolean; explanation?: string }>;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  retryGame: () => Promise<void>;
}

export interface GameCallbacks {
  onQuestionChange?: (question: Question, index: number) => void;
  onScoreUpdate?: (score: number) => void;
  onGameComplete?: (result: SinglePlayerResult | MultiplayerResult) => void;
  onError?: (error: Error) => void;
  onNPCChat?: (npcId: string, message: string) => void;
}

// ============================================================================
// MAIN GAME ENGINE HOOK
// ============================================================================

export function useGameEngine(
  configuration: GameConfiguration,
  callbacks?: GameCallbacks
) {
  const engineRef = useRef<UniversalGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    score: 0,
    timeRemaining: 0,
    progress: 0,
    error: null,
  });

  // Initialize engine
  useEffect(() => {
    try {
      engineRef.current = new UniversalGameEngine(configuration);
      setGameState(prev => ({ ...prev, status: 'ready', error: null }));
      
      // Set up callbacks
      setupEngineCallbacks();
      
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
      setGameState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to initialize game'
      }));
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, [configuration.topicId, configuration.mode, configuration.roomId]);

  const setupEngineCallbacks = useCallback(() => {
    if (!engineRef.current) return;

    // Question change handler
    const unsubscribeQuestion = engineRef.current.onQuestionChange((question, index) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: question,
        questionIndex: index,
        progress: engineRef.current?.getProgress().percentage || 0,
      }));
      callbacks?.onQuestionChange?.(question, index);
    });

    // Score update handler
    const unsubscribeScore = engineRef.current.onScoreUpdate((score) => {
      setGameState(prev => ({ ...prev, score }));
      callbacks?.onScoreUpdate?.(score);
    });

    // Game complete handler
    const unsubscribeComplete = engineRef.current.onGameComplete((result) => {
      setGameState(prev => ({ ...prev, status: 'completed' }));
      callbacks?.onGameComplete?.(result);
    });

    // Error handler
    const unsubscribeError = engineRef.current.onError((error) => {
      setGameState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message 
      }));
      callbacks?.onError?.(error);
    });

    // NPC chat handler (for multiplayer)
    const unsubscribeNPCChat = engineRef.current.onNPCChat((npcId, message) => {
      callbacks?.onNPCChat?.(npcId, message);
    });

    // Cleanup function
    return () => {
      unsubscribeQuestion();
      unsubscribeScore();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribeNPCChat();
    };
  }, [callbacks]);

  // Game actions
  const startGame = useCallback(async () => {
    if (!engineRef.current) return;

    try {
      setGameState(prev => ({ ...prev, status: 'loading' }));
      await engineRef.current.startGame();
      
      const progress = engineRef.current.getProgress();
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        totalQuestions: progress.total,
        error: null,
      }));
    } catch (error) {
      setGameState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start game',
      }));
    }
  }, []);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!engineRef.current) {
      throw new Error('Game engine not initialized');
    }

    try {
      const result = await engineRef.current.submitAnswer(answer);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      setGameState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  const endGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cleanup();
    }
    setGameState(prev => ({ ...prev, status: 'completed' }));
  }, []);

  const retryGame = useCallback(async () => {
    if (engineRef.current) {
      engineRef.current.cleanup();
    }

    try {
      engineRef.current = new UniversalGameEngine(configuration);
      setGameState({
        status: 'ready',
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        score: 0,
        timeRemaining: 0,
        progress: 0,
        error: null,
      });
      
      setupEngineCallbacks();
      await startGame();
    } catch (error) {
      setGameState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to retry game',
      }));
    }
  }, [configuration, startGame, setupEngineCallbacks]);

  // Additional utilities
  const getActiveNPCs = useCallback(() => {
    return engineRef.current?.getActiveNPCs() || [];
  }, []);

  const addNPCManually = useCallback(async () => {
    if (!engineRef.current) return false;
    return await engineRef.current.addNPCManually();
  }, []);

  const actions: GameActions = {
    startGame,
    submitAnswer,
    pauseGame,
    resumeGame,
    endGame,
    retryGame,
  };

  return {
    gameState,
    actions,
    engine: engineRef.current,
    getActiveNPCs,
    addNPCManually,
  };
}

// ============================================================================
// SPECIALIZED HOOKS FOR DIFFERENT GAME MODES
// ============================================================================

/**
 * Hook for single-player quiz games
 */
export function useSinglePlayerGame(
  topicId: string,
  options: {
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    timePerQuestion?: number;
  } = {},
  callbacks?: Omit<GameCallbacks, 'onNPCChat'>
) {
  const configuration: GameConfiguration = {
    mode: 'single',
    topicId,
    difficultyLevel: options.difficulty || 'medium',
    questionCount: options.questionCount || 10,
    timePerQuestion: options.timePerQuestion || 30,
    userId: 'current-user', // Would come from auth context
  };

  const { gameState, actions, engine } = useGameEngine(configuration, callbacks);

  return {
    gameState,
    actions,
    engine,
    // Single-player specific utilities
    isReady: gameState.status === 'ready',
    isPlaying: gameState.status === 'playing',
    isCompleted: gameState.status === 'completed',
    hasError: gameState.status === 'error',
  };
}

/**
 * Hook for multiplayer quiz games with NPCs
 */
export function useMultiplayerGame(
  topicId: string,
  roomId: string,
  options: {
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    timePerQuestion?: number;
    allowNPCs?: boolean;
    maxNPCs?: number;
  } = {},
  callbacks?: GameCallbacks
) {
  const configuration: GameConfiguration = {
    mode: 'multiplayer',
    topicId,
    roomId,
    difficultyLevel: options.difficulty || 'medium',
    questionCount: options.questionCount || 10,
    timePerQuestion: options.timePerQuestion || 30,
    userId: 'current-user', // Would come from auth context
    allowNPCs: options.allowNPCs ?? true,
    maxNPCs: options.maxNPCs || 2,
  };

  const { gameState, actions, engine, getActiveNPCs, addNPCManually } = useGameEngine(
    configuration, 
    callbacks
  );

  return {
    gameState,
    actions,
    engine,
    getActiveNPCs,
    addNPCManually,
    // Multiplayer specific utilities
    isWaitingForPlayers: gameState.status === 'ready',
    isInGame: gameState.status === 'playing',
    isGameComplete: gameState.status === 'completed',
    hasError: gameState.status === 'error',
  };
}

/**
 * Hook for practice mode (unlimited time, immediate feedback)
 */
export function usePracticeMode(
  topicId: string,
  options: {
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
  } = {},
  callbacks?: Omit<GameCallbacks, 'onNPCChat'>
) {
  const configuration: GameConfiguration = {
    mode: 'single',
    topicId,
    difficultyLevel: options.difficulty || 'medium',
    questionCount: options.questionCount || 20,
    timePerQuestion: 300, // 5 minutes per question (effectively unlimited)
    userId: 'current-user',
  };

  const { gameState, actions, engine } = useGameEngine(configuration, callbacks);

  // Override some actions for practice mode
  const practiceActions = {
    ...actions,
    // In practice mode, we might want to allow going back to previous questions
    goToPreviousQuestion: () => {
      // Implementation would depend on engine capabilities
      console.log('Going to previous question (practice mode)');
    },
    skipQuestion: () => {
      // Allow skipping questions in practice mode
      console.log('Skipping question (practice mode)');
    },
  };

  return {
    gameState,
    actions: practiceActions,
    engine,
    // Practice mode specific utilities
    isPracticeMode: true,
    canSkipQuestions: true,
    hasUnlimitedTime: true,
  };
}

/**
 * Hook for competitive tournament games
 */
export function useTournamentGame(
  topicId: string,
  tournamentId: string,
  options: {
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    timePerQuestion?: number;
  } = {},
  callbacks?: GameCallbacks
) {
  const configuration: GameConfiguration = {
    mode: 'multiplayer',
    topicId,
    roomId: `tournament_${tournamentId}`,
    difficultyLevel: options.difficulty || 'hard',
    questionCount: options.questionCount || 15,
    timePerQuestion: options.timePerQuestion || 20,
    userId: 'current-user',
    allowNPCs: false, // No NPCs in competitive tournaments
  };

  const { gameState, actions, engine } = useGameEngine(configuration, callbacks);

  return {
    gameState,
    actions,
    engine,
    // Tournament specific utilities
    isTournamentMode: true,
    isCompetitive: true,
    tournamentId,
  };
}

export default useGameEngine; 