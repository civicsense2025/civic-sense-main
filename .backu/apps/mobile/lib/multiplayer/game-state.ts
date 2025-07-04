import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { QuestionResponseService, type QuestionResponseData } from '../services/question-response-service';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  isOnline: boolean;
  joinedAt: string;
  lastSeen: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic_id: string;
  time_limit?: number;
}

export interface GameState {
  gameId: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  players: Player[];
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion?: Question;
  timeRemaining: number;
  answers: PlayerAnswer[]; // Track all player answers
  settings: {
    maxPlayers: number;
    minPlayers: number;
    questionCount: number;
    timePerQuestion: number;
    difficultyLevel: 'easy' | 'medium' | 'hard';
    gameMode: 'single' | 'multiplayer' | 'practice';
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PlayerAction {
  type: 'join' | 'leave' | 'ready' | 'answer';
  payload: any;
  playerId?: string;
  timestamp: number;
}

export interface GameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'question_changed' | 'game_ended';
  data: any;
  timestamp: number;
}

export interface PlayerAnswer {
  playerId: string;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface PresenceStatus {
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  currentQuestion?: number;
}

export class MultiplayerGameState {
  private gameChannel: RealtimeChannel | null = null;
  private gameState: GameState;
  private userId: string;
  private lastUpdateTime = 0;
  private UPDATE_THROTTLE = 100; // 100ms throttle
  private gameUpdateCallbacks = new Set<(update: Partial<GameState>) => void>();
  private playerActionCallbacks = new Set<(action: PlayerAction) => void>();
  private presenceChangeCallbacks = new Set<(presence: any) => void>();

  constructor(gameId: string, userId: string) {
    this.userId = userId;
    this.gameState = {
      gameId,
      status: 'waiting',
      players: [],
      questions: [],
      currentQuestionIndex: 0,
      timeRemaining: 0,
      answers: [], // Initialize answers array
      settings: {
        maxPlayers: 6,
        minPlayers: 2,
        questionCount: 10,
        timePerQuestion: 30,
        difficultyLevel: 'medium',
        gameMode: 'multiplayer',
      },
      createdAt: new Date().toISOString(),
    };

    this.setupRealtimeChannel();
  }

  private setupRealtimeChannel(): void {
    try {
      this.gameChannel = supabase
        .channel(`game_${this.gameState.gameId}`)
        .on('broadcast', { event: 'player_action' }, (payload) => {
          this.handlePlayerAction(payload.payload as PlayerAction);
        })
        .on('broadcast', { event: 'game_update' }, (payload) => {
          this.handleGameUpdate(payload.payload as GameUpdate);
        })
        .subscribe();

      console.log('🔄 Game state real-time channel active');
    } catch (error) {
      console.error('Error setting up real-time channel:', error);
    }
  }

  // Throttled state updates to prevent spam
  broadcastGameUpdate(update: Partial<GameState>): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_THROTTLE) {
      return;
    }

    this.lastUpdateTime = now;
    this.gameChannel?.send({
      type: 'broadcast',
      event: 'game_update',
      payload: {
        ...update,
        timestamp: now,
        playerId: this.userId
      }
    });
  }

  // Immediate actions (button presses, answers)
  broadcastPlayerAction(action: Omit<PlayerAction, 'timestamp' | 'playerId'>): void {
    const fullAction: PlayerAction = {
      ...action,
      playerId: this.userId,
      timestamp: Date.now()
    };

    this.gameChannel?.send({
      type: 'broadcast',
      event: 'player_action',
      payload: fullAction
    });
  }

  // Track player presence
  updatePresence(status: PresenceStatus): void {
    this.gameChannel?.track({
      user_id: this.userId,
      status: status.status,
      last_seen: status.lastSeen,
      current_question: status.currentQuestion
    });
  }

  private handleGameUpdate(payload: any): void {
    const update = payload.payload;
    if (update.playerId === this.userId) {
      // Ignore our own updates to prevent loops
      return;
    }

    // Merge update into game state
    this.gameState = { ...this.gameState, ...update };
    
    // Notify listeners
    this.gameUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in game update callback:', error);
      }
    });
  }

  private handlePlayerAction(payload: any): void {
    const action: PlayerAction = payload.payload;
    
    // Update local state based on action
    switch (action.type) {
      case 'answer':
        this.handlePlayerAnswer(action);
        break;
      case 'ready':
        this.handlePlayerReady(action);
        break;
      case 'join':
        this.handlePlayerJoinAction(action);
        break;
      case 'leave':
        this.handlePlayerLeaveAction(action);
        break;
    }

    // Notify listeners
    this.playerActionCallbacks.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in player action callback:', error);
      }
    });
  }

  private handlePlayerAnswer(action: PlayerAction): void {
    if (!action.playerId) return; // Guard against undefined playerId
    
    const answerData = action.payload;
    const answer: PlayerAnswer = {
      playerId: action.playerId,
      answer: answerData.answer,
      timeSpent: answerData.timeSpent,
      isCorrect: answerData.isCorrect,
      timestamp: action.timestamp
    };

    // Add to answers if not already present
    const existingAnswer = this.gameState.answers.find(
      (a: PlayerAnswer) => a.playerId === action.playerId && 
      a.timestamp === action.timestamp
    );

    if (!existingAnswer) {
      this.gameState.answers.push(answer);
    }

    // Update player score
    if (answer.isCorrect) {
      const player = this.gameState.players.find(p => p.id === action.playerId);
      if (player) {
        player.score += 1;
      }
    }
  }

  private handlePlayerReady(action: PlayerAction): void {
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (player) {
      player.isReady = action.payload.isReady;
    }
  }

  private handlePlayerJoinAction(action: PlayerAction): void {
    if (!action.playerId) return; // Guard against undefined playerId
    
    const playerData = action.payload;
    const existingPlayer = this.gameState.players.find(p => p.id === action.playerId);
    
    if (!existingPlayer) {
      const newPlayer: Player = {
        id: action.playerId,
        name: playerData.name,
        isHost: playerData.isHost || false,
        isReady: false,
        score: 0,
        isOnline: true,
        joinedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };
      this.gameState.players.push(newPlayer);
    }
  }

  private handlePlayerLeaveAction(action: PlayerAction): void {
    this.gameState.players = this.gameState.players.filter(p => p.id !== action.playerId);
  }

  private handlePresenceSync(): void {
    if (!this.gameChannel) return; // Guard against null channel
    
    const state = this.gameChannel.presenceState();
    
    // Update player online status based on presence
    this.gameState.players.forEach(player => {
      const presenceKey = Object.keys(state).find(key => key === player.id);
      player.isOnline = !!presenceKey;
      
      if (presenceKey && state[presenceKey]?.[0]) {
        const presenceData = state[presenceKey][0] as any;
        player.lastSeen = presenceData.last_seen || player.lastSeen;
      }
    });

    this.presenceChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in presence change callback:', error);
      }
    });
  }

  private handlePlayerJoin(newPresences: any[]): void {
    newPresences.forEach(presence => {
      const player = this.gameState.players.find(p => p.id === presence.user_id);
      if (player) {
        player.isOnline = true;
        player.lastSeen = presence.last_seen || new Date().toISOString();
      }
    });

    this.presenceChangeCallbacks.forEach(callback => {
      try {
        callback({ type: 'join', presences: newPresences });
      } catch (error) {
        console.error('Error in player join callback:', error);
      }
    });
  }

  private handlePlayerLeave(leftPresences: any[]): void {
    leftPresences.forEach(presence => {
      const player = this.gameState.players.find(p => p.id === presence.user_id);
      if (player) {
        player.isOnline = false;
        player.lastSeen = new Date().toISOString();
      }
    });

    this.presenceChangeCallbacks.forEach(callback => {
      try {
        callback({ type: 'leave', presences: leftPresences });
      } catch (error) {
        console.error('Error in player leave callback:', error);
      }
    });
  }

  // Event subscription methods
  onGameUpdate(callback: (update: Partial<GameState>) => void): () => void {
    this.gameUpdateCallbacks.add(callback);
    return () => this.gameUpdateCallbacks.delete(callback);
  }

  onPlayerAction(callback: (action: PlayerAction) => void): () => void {
    this.playerActionCallbacks.add(callback);
    return () => this.playerActionCallbacks.delete(callback);
  }

  onPresenceChange(callback: (presence: any) => void): () => void {
    this.presenceChangeCallbacks.add(callback);
    return () => this.presenceChangeCallbacks.delete(callback);
  }

  // Public getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getCurrentPlayer(): Player | undefined {
    return this.gameState.players.find(p => p.id === this.userId);
  }

  isHost(): boolean {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer?.isHost || false;
  }

  canStartGame(): boolean {
    const readyPlayers = this.gameState.players.filter(p => p.isReady || p.isHost);
    return (
      this.gameState.status === 'waiting' &&
      this.gameState.players.length >= this.gameState.settings.minPlayers &&
      readyPlayers.length === this.gameState.players.length
    );
  }

  // Game control methods
  async startGame(): Promise<void> {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game - conditions not met');
    }

    // Load questions for the game
    try {
      await this.loadQuestions();
      
      const gameUpdate: Partial<GameState> = {
        status: 'starting',
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        currentQuestion: this.gameState.questions[0],
        timeRemaining: this.gameState.settings.timePerQuestion
      };

      this.gameState = { ...this.gameState, ...gameUpdate };
      this.broadcastGameUpdate(gameUpdate);

      // Start the game after a brief delay
      setTimeout(() => {
        const startUpdate: Partial<GameState> = {
          status: 'in_progress'
        };
        this.gameState = { ...this.gameState, ...startUpdate };
        this.broadcastGameUpdate(startUpdate);
      }, 3000);

    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  private async loadQuestions(): Promise<void> {
    try {
      // In a real implementation, this would load questions from the database
      // For now, create sample questions
      const sampleQuestions: Question[] = [
        {
          id: 'q1',
          text: 'What are the three branches of the U.S. government?',
          options: [
            'Executive, Legislative, Judicial',
            'Federal, State, Local',
            'Senate, House, Court',
            'President, Congress, Military'
          ],
          correctAnswer: 'Executive, Legislative, Judicial',
          explanation: 'The three branches ensure separation of powers and checks and balances.',
          difficulty: 'easy',
          topic_id: 'government',
          time_limit: 30,
        },
        {
          id: 'q2',
          text: 'How many amendments are in the Bill of Rights?',
          options: ['8', '10', '12', '15'],
          correctAnswer: '10',
          explanation: 'The first 10 amendments to the Constitution make up the Bill of Rights.',
          difficulty: 'medium',
          topic_id: 'constitution',
          time_limit: 25,
        },
        // Add more questions as needed
      ];

      this.gameState.questions = sampleQuestions.slice(0, this.gameState.settings.questionCount);
      console.log(`📚 Loaded ${this.gameState.questions.length} questions for game`);
    } catch (error) {
      console.error('Error loading questions:', error);
      throw error;
    }
  }

  async submitAnswer(answer: string, confidenceLevel: number = 3): Promise<void> {
    if (this.gameState.status !== 'in_progress') return;

    const currentQuestion = this.gameState.questions[this.gameState.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeSpent = this.gameState.settings.timePerQuestion - this.gameState.timeRemaining;

    // Update local score immediately for responsive UI
    if (isCorrect) {
      const currentPlayer = this.getCurrentPlayer();
      if (currentPlayer) {
        currentPlayer.score += 1;
      }
    }

    // Record the response using QuestionResponseService
    let masteryLevel: number | undefined;
    try {
      const responseData: QuestionResponseData = {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        isCorrect,
        responseTimeMs: timeSpent * 1000, // Convert to milliseconds
        assessmentType: 'quiz',
        topicId: currentQuestion.topic_id,
        confidenceLevel,
        wasReview: false
      };

      const result = await QuestionResponseService.recordQuestionResponse(this.userId, responseData);
      
      if (result.success) {
        masteryLevel = result.masteryLevel;
        console.log('✅ Multiplayer answer recorded:', {
          masteryLevel: result.masteryLevel,
          nextReviewDate: result.nextReviewDate
        });
      } else {
        console.error('❌ Failed to record multiplayer answer:', result.error);
      }
    } catch (error) {
      console.error('❌ Error recording multiplayer answer:', error);
      // Don't block the game flow for tracking failures
    }

    // Broadcast the answer
    this.broadcastPlayerAction({
      type: 'answer',
      payload: {
        answer,
        timeSpent,
        isCorrect,
        questionId: currentQuestion.id,
        masteryData: masteryLevel // Include mastery data for other players
      }
    });
  }

  nextQuestion(): void {
    if (!this.isHost()) return;

    const nextIndex = this.gameState.currentQuestionIndex + 1;
    
    if (nextIndex >= this.gameState.questions.length) {
      // Game completed
      const gameUpdate: Partial<GameState> = {
        status: 'completed'
      };
      this.gameState = { ...this.gameState, ...gameUpdate };
      this.broadcastGameUpdate(gameUpdate);
    } else {
      // Next question
      const gameUpdate: Partial<GameState> = {
        currentQuestionIndex: nextIndex,
        currentQuestion: this.gameState.questions[nextIndex],
        timeRemaining: this.gameState.settings.timePerQuestion,
        answers: [] // Clear answers for new question
      };
      this.gameState = { ...this.gameState, ...gameUpdate };
      this.broadcastGameUpdate(gameUpdate);
    }
  }

  cleanup(): void {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
      this.gameChannel = null;
    }

    this.gameUpdateCallbacks.clear();
    this.playerActionCallbacks.clear();
    this.presenceChangeCallbacks.clear();

    console.log('🧹 Game state manager cleaned up');
  }
} 