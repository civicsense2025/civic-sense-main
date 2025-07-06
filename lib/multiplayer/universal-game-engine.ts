import { supabase } from '../supabase';
import { MultiplayerGameState, Player, GameState } from './game-state';
import { NPCService, NPCPersonality, NPCGamePlayer } from './npc-service';

// ============================================================================
// UNIVERSAL GAME ENGINE FOR CIVICSENSE
// ============================================================================

export interface GameConfiguration {
  mode: 'single' | 'multiplayer';
  topicId: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timePerQuestion: number;
  userId: string;
  roomId?: string; // For multiplayer mode
  allowNPCs?: boolean; // Whether to allow NPCs in multiplayer
  maxNPCs?: number; // Maximum number of NPCs (default: 2)
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
  translations?: {
    question?: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } };
    explanation?: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } };
    [key: string]: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } } | undefined;
  };
}

export interface GameSession {
  id: string;
  configuration: GameConfiguration;
  state: GameState;
  startedAt: string;
  completedAt?: string;
  finalScore?: number;
}

export interface SinglePlayerResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  accuracy: number;
  topicMastery: number;
  achievements: string[];
}

export interface MultiplayerResult {
  playerRank: number;
  totalPlayers: number;
  score: number;
  accuracy: number;
  achievements: string[];
  leaderboard: Array<{
    playerId: string;
    playerName: string;
    score: number;
    rank: number;
  }>;
}

export interface GameResult {
  score: number;
  accuracy: number;
  timeSpent: number;
  achievements: string[];
}

// ============================================================================
// UNIVERSAL GAME ENGINE
// ============================================================================

export class UniversalGameEngine {
  private configuration: GameConfiguration;
  private gameSession: GameSession;
  private gameState: MultiplayerGameState | null = null;
  private npcService: NPCService;
  private activeNPCs: Map<string, NPCGamePlayer> = new Map();
  private currentQuestionIndex: number = 0;
  private answers: Array<{ questionId: string; answer: string; isCorrect: boolean; timeSpent: number }> = [];
  private startTime: number = 0;
  private score: number = 0;
  private questionTimer: ReturnType<typeof setTimeout> | null = null;

  // Event callbacks
  private questionChangeCallbacks: Set<(question: Question, index: number) => void> = new Set();
  private scoreUpdateCallbacks: Set<(score: number) => void> = new Set();
  private gameCompleteCallbacks: Set<(result: SinglePlayerResult | MultiplayerResult) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private npcChatCallbacks: Set<(npcId: string, message: string) => void> = new Set();

  constructor(configuration: GameConfiguration) {
    this.configuration = configuration;
    this.npcService = NPCService.getInstance();
    this.gameSession = {
      id: this.generateSessionId(),
      configuration,
      state: this.initializeGameState(),
      startedAt: new Date().toISOString(),
    };

    console.log(`🎮 Universal Game Engine initialized for ${configuration.mode} mode`);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeGameState(): GameState {
    return {
      gameId: this.gameSession.id,
      status: 'waiting',
      players: [],
      questions: [],
      currentQuestionIndex: 0,
      timeRemaining: this.configuration.timePerQuestion,
      settings: {
        maxPlayers: this.configuration.mode === 'single' ? 1 : 6,
        minPlayers: this.configuration.mode === 'single' ? 1 : 2,
        questionCount: this.configuration.questionCount,
        timePerQuestion: this.configuration.timePerQuestion,
        difficultyLevel: this.configuration.difficultyLevel,
        gameMode: this.configuration.mode,
      },
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // GAME LIFECYCLE
  // ============================================================================

  async startGame(): Promise<void> {
    try {
      console.log(`🚀 Starting ${this.configuration.mode} game`);
      this.startTime = Date.now();

      // Initialize based on mode
      if (this.configuration.mode === 'multiplayer') {
        await this.initializeMultiplayerMode();
      } else {
        await this.initializeSinglePlayerMode();
      }

      // Load questions
      await this.loadQuestions();

      // Add NPCs if configured for multiplayer
      if (this.configuration.mode === 'multiplayer' && this.configuration.allowNPCs) {
        await this.addNPCsToGame();
      }

      // Start the first question
      await this.startQuestion(0);

      console.log('✅ Game started successfully');
    } catch (error) {
      console.error('Error starting game:', error);
      this.emitError(error as Error);
      throw error;
    }
  }

  private async initializeSinglePlayerMode(): Promise<void> {
    console.log('👤 Initializing single player mode');
    
    // Create player object for single player
    const player: Player = {
      id: this.configuration.userId,
      name: 'Player', // Would get from user profile
      isHost: true,
      isReady: true,
      score: 0,
      isOnline: true,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    this.gameSession.state.players = [player];
    this.gameSession.state.status = 'in_progress';
  }

  private async initializeMultiplayerMode(): Promise<void> {
    console.log('👥 Initializing multiplayer mode');
    
    if (!this.configuration.roomId) {
      throw new Error('Room ID required for multiplayer mode');
    }

    // Initialize multiplayer game state
    this.gameState = new MultiplayerGameState(this.configuration.roomId, this.configuration.userId);
    
    // Set up multiplayer event handlers
    this.gameState.onGameUpdate((update) => {
      this.handleMultiplayerUpdate(update);
    });

    this.gameState.onPlayerAction((action) => {
      this.handleMultiplayerAction(action);
    });
  }

  // ============================================================================
  // NPC MANAGEMENT
  // ============================================================================

  private async addNPCsToGame(): Promise<void> {
    if (!this.configuration.roomId) return;

    const maxNPCs = this.configuration.maxNPCs || 2;
    const currentPlayerCount = this.gameSession.state.players.length;
    const maxPlayers = this.gameSession.state.settings.maxPlayers;
    
    // Don't add NPCs if we're at capacity
    if (currentPlayerCount >= maxPlayers) return;

    // Add NPCs to fill the game (but not exceed max)
    const npcsToAdd = Math.min(maxNPCs, maxPlayers - currentPlayerCount);
    
    console.log(`🤖 Adding ${npcsToAdd} NPCs to game`);

    for (let i = 0; i < npcsToAdd; i++) {
      await this.addSingleNPC();
    }
  }

  private async addSingleNPC(): Promise<void> {
    try {
      // Get existing NPC IDs to avoid duplicates
      const existingNPCIds = Array.from(this.activeNPCs.values()).map(npc => npc.npc_id);
      
      // Get a random personality that's not already in the game
      const personality = await this.npcService.getRandomPersonality(
        this.configuration.topicId,
        undefined, // We'd need to get category from topic
        existingNPCIds
      );

      if (!personality) {
        console.warn('Could not get NPC personality');
        return;
      }

      // Add NPC to the game
      const npcPlayer = await this.npcService.addNPCToGame(
        this.configuration.roomId!,
        personality.id,
        personality.display_name
      );

      if (!npcPlayer) {
        console.warn('Could not add NPC to game');
        return;
      }

      // Track the NPC locally
      this.activeNPCs.set(npcPlayer.id, npcPlayer);

      // Add NPC as a player to the game state
      const npcAsPlayer: Player = {
        id: npcPlayer.id,
        name: npcPlayer.player_name,
        isHost: false,
        isReady: true, // NPCs are always ready
        score: 0,
        isOnline: true,
        joinedAt: npcPlayer.joined_at,
        lastSeen: new Date().toISOString(),
      };

      this.gameSession.state.players.push(npcAsPlayer);

      console.log(`✅ Added NPC: ${personality.display_name} (${personality.personality_type})`);

      // Generate greeting message if chatty
      if (personality.chattiness_level > 0.5) {
        setTimeout(() => {
          this.generateNPCChatMessage(npcPlayer.id, 'greeting');
        }, Math.random() * 3000 + 1000);
      }

    } catch (error) {
      console.error('Error adding NPC:', error);
    }
  }

  private async generateNPCChatMessage(npcPlayerId: string, contextType: string): Promise<void> {
    try {
      const npcPlayer = this.activeNPCs.get(npcPlayerId);
      if (!npcPlayer) return;

      const chatMessage = await this.npcService.generateChatMessage(
        npcPlayer.npc_id,
        contextType
      );

      if (chatMessage) {
        this.npcChatCallbacks.forEach(callback => {
          try {
            callback(npcPlayerId, chatMessage.message);
          } catch (error) {
            console.error('Error in NPC chat callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error generating NPC chat:', error);
    }
  }

  // ============================================================================
  // QUESTION MANAGEMENT
  // ============================================================================

  private async loadQuestions(): Promise<void> {
    try {
      console.log(`📚 Loading questions for topic: ${this.configuration.topicId}`);

      // Load questions from database
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', this.configuration.topicId)
        .eq('is_active', true)
        .limit(this.configuration.questionCount);

      if (error) throw error;

      if (!questions || questions.length === 0) {
        throw new Error('No questions found for the selected topic');
      }

      // Shuffle questions and convert to game format
      const shuffledQuestions = this.shuffleArray([...questions])
        .slice(0, this.configuration.questionCount)
        .map((q, index): Question => ({
          id: q.id,
          text: q.question_text,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation || undefined,
          difficulty: (q.difficulty || this.configuration.difficultyLevel) as 'easy' | 'medium' | 'hard',
          topic_id: q.topic_id,
          time_limit: q.time_limit || this.configuration.timePerQuestion,
        }));

      this.gameSession.state.questions = shuffledQuestions;
      console.log(`✅ Loaded ${shuffledQuestions.length} questions`);
    } catch (error) {
      console.error('Error loading questions:', error);
      throw error;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Ensure both indices are valid
      const itemI = shuffled[i];
      const itemJ = shuffled[j];
      if (itemI !== undefined && itemJ !== undefined) {
        shuffled[i] = itemJ;
        shuffled[j] = itemI;
      }
    }
    return shuffled;
  }

  private async startQuestion(questionIndex: number): Promise<void> {
    if (questionIndex >= this.gameSession.state.questions.length) {
      await this.endGame();
      return;
    }

    this.currentQuestionIndex = questionIndex;
    this.gameSession.state.currentQuestionIndex = questionIndex;
    
    const currentQuestion = this.gameSession.state.questions[questionIndex];
    if (currentQuestion) {
      this.gameSession.state.currentQuestion = currentQuestion;
      this.gameSession.state.timeRemaining = this.configuration.timePerQuestion;

      console.log(`❓ Starting question ${questionIndex + 1}/${this.gameSession.state.questions.length}`);
      
      // Notify listeners
      this.questionChangeCallbacks.forEach(callback => {
        try {
          callback(currentQuestion, questionIndex);
        } catch (error) {
          console.error('Error in question change callback:', error);
        }
      });

      // Start question timer
      this.startQuestionTimer();

      // Schedule NPC answers for multiplayer
      if (this.configuration.mode === 'multiplayer') {
        this.scheduleNPCAnswers(currentQuestion);
      }
    }
  }

  private async scheduleNPCAnswers(question: Question): Promise<void> {
    for (const [npcPlayerId, npcPlayer] of this.activeNPCs) {
      // Generate answer for this NPC
      const response = await this.npcService.generateAnswer(
        npcPlayer.npc_id,
        question.id,
        question,
        this.configuration.topicId
      );

      if (response) {
        // Schedule the answer at the NPC's response time
        setTimeout(() => {
          this.handleNPCAnswer(npcPlayerId, response.answer, response.confidence);
        }, response.responseTime);
      }
    }
  }

  private async handleNPCAnswer(npcPlayerId: string, answer: string, confidence: number): Promise<void> {
    const npcPlayer = this.activeNPCs.get(npcPlayerId);
    if (!npcPlayer) return;

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;

    // Update NPC score
    const player = this.gameSession.state.players.find(p => p.id === npcPlayerId);
    if (player && isCorrect) {
      const questionScore = this.calculateQuestionScore(currentQuestion.difficulty, 0);
      player.score += questionScore;
    }

    console.log(`🤖 NPC ${npcPlayer.player_name} answered ${isCorrect ? 'correctly' : 'incorrectly'}`);

    // Generate chat message based on result
    if (Math.random() < 0.3) { // 30% chance to chat
      const contextType = isCorrect ? 'correct_answer' : 'incorrect_answer';
      setTimeout(() => {
        this.generateNPCChatMessage(npcPlayerId, contextType);
      }, 1000 + Math.random() * 2000);
    }
  }

  private startQuestionTimer(): void {
    const timeLimit = this.configuration.timePerQuestion * 1000; // Convert to ms
    
    this.questionTimer = setTimeout(() => {
      // Auto-advance to next question when time runs out
      this.nextQuestion();
    }, timeLimit);
  }

  async submitAnswer(answer: string): Promise<{ isCorrect: boolean; explanation?: string }> {
    const currentQuestion = this.gameSession.state.questions[this.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question available');
    }

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeSpent = this.configuration.timePerQuestion - this.gameSession.state.timeRemaining;

    // Record the answer
    this.answers.push({
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent,
    });

    // Update score
    if (isCorrect) {
      const player = this.gameSession.state.players.find(p => p.id === this.configuration.userId);
      if (player) {
        const questionScore = this.calculateQuestionScore(currentQuestion.difficulty, timeSpent);
        player.score += questionScore;
        this.emitScoreUpdate(player.score);
      }
    }

    console.log(`📝 Answer submitted: ${isCorrect ? 'correct' : 'incorrect'}`);

    // For multiplayer, broadcast the answer
    if (this.configuration.mode === 'multiplayer' && this.gameState) {
      this.gameState.submitAnswer(answer);
    }

    return {
      isCorrect,
      ...(currentQuestion.explanation && { explanation: currentQuestion.explanation }),
    };
  }

  private calculateQuestionScore(difficulty: 'easy' | 'medium' | 'hard', timeSpent: number): number {
    const basePoints = {
      easy: 10,
      medium: 15,
      hard: 20,
    };

    const base = basePoints[difficulty] || 10;
    
    // Time bonus (faster answers get more points)
    const timeBonus = Math.max(0, (this.configuration.timePerQuestion - timeSpent) / this.configuration.timePerQuestion * 0.5);
    
    return Math.round(base * (1 + timeBonus));
  }

  private async nextQuestion(): Promise<void> {
    // Clear current timer
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }

    const nextIndex = this.currentQuestionIndex + 1;
    
    if (nextIndex >= this.gameSession.state.questions.length) {
      await this.endGame();
    } else {
      await this.startQuestion(nextIndex);
    }
  }

  // ============================================================================
  // GAME COMPLETION
  // ============================================================================

  private async endGame(): Promise<void> {
    console.log('🏁 Game ending');
    
    // Clear timer
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }

    this.gameSession.completedAt = new Date().toISOString();
    this.gameSession.state.status = 'completed';
    
    // Remove NPCs from game
    await this.cleanupNPCs();

    // Calculate results based on mode
    if (this.configuration.mode === 'single') {
      const result = await this.calculateSinglePlayerResult();
      await this.saveSinglePlayerResult(result);
      this.emitGameComplete(result);
    } else {
      const result = await this.calculateMultiplayerResult();
      this.emitGameComplete(result);
    }
  }

  private async cleanupNPCs(): Promise<void> {
    if (!this.configuration.roomId) return;

    for (const [npcPlayerId, npcPlayer] of this.activeNPCs) {
      await this.npcService.removeNPCFromGame(this.configuration.roomId, npcPlayer.npc_id);
    }
    
    this.activeNPCs.clear();
  }

  private async calculateSinglePlayerResult(): Promise<SinglePlayerResult> {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const totalQuestions = this.answers.length;
    const totalTimeSpent = Date.now() - this.startTime;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const score = this.gameSession.state.players.find(p => p.id === this.configuration.userId)?.score || 0;

    // Calculate topic mastery based on performance
    const topicMastery = this.calculateTopicMastery(accuracy, this.configuration.difficultyLevel);

    // Calculate achievements
    const achievements = this.calculateAchievements(accuracy, score, totalTimeSpent);

    return {
      score,
      totalQuestions,
      correctAnswers,
      timeSpent: Math.round(totalTimeSpent / 1000), // Convert to seconds
      accuracy: Math.round(accuracy),
      topicMastery,
      achievements,
    };
  }

  private async calculateMultiplayerResult(): Promise<MultiplayerResult> {
    // This would integrate with the multiplayer leaderboard
    const player = this.gameSession.state.players.find(p => p.id === this.configuration.userId);
    
    // Sort players by score for ranking
    const sortedPlayers = [...this.gameSession.state.players].sort((a, b) => b.score - a.score);
    const playerRank = sortedPlayers.findIndex(p => p.id === this.configuration.userId) + 1;

    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const totalQuestions = this.answers.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      playerRank,
      totalPlayers: this.gameSession.state.players.length,
      score: player?.score || 0,
      accuracy,
      achievements: this.calculateAchievements(accuracy, player?.score || 0, Date.now() - this.startTime),
      leaderboard: sortedPlayers.map((p, index) => ({
        playerId: p.id,
        playerName: p.name,
        score: p.score,
        rank: index + 1,
      })),
    };
  }

  private calculateTopicMastery(accuracy: number, difficulty: string): number {
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
    };

    const multiplier = difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0;
    const mastery = (accuracy / 100) * multiplier * 100;
    
    return Math.min(100, Math.round(mastery));
  }

  private calculateAchievements(accuracy: number, score: number, timeSpent: number): string[] {
    const achievements: string[] = [];

    // Perfect score
    if (accuracy === 100) {
      achievements.push('perfect_score');
    }

    // High accuracy
    if (accuracy >= 90) {
      achievements.push('high_achiever');
    }

    // Speed demon (completed quickly)
    const avgTimePerQuestion = timeSpent / this.configuration.questionCount;
    if (avgTimePerQuestion < this.configuration.timePerQuestion * 0.7) {
      achievements.push('speed_demon');
    }

    // Topic specialist (high score on hard difficulty)
    if (this.configuration.difficultyLevel === 'hard' && accuracy >= 80) {
      achievements.push('topic_specialist');
    }

    // Multiplayer specific achievements
    if (this.configuration.mode === 'multiplayer') {
      const humanPlayers = this.gameSession.state.players.filter(p => !this.activeNPCs.has(p.id));
      if (humanPlayers.length > 1) {
        const sortedHumans = humanPlayers.sort((a, b) => b.score - a.score);
        const userRank = sortedHumans.findIndex(p => p.id === this.configuration.userId) + 1;
        
        if (userRank === 1) {
          achievements.push('multiplayer_champion');
        }
        
        if (humanPlayers.length >= 4 && userRank <= 3) {
          achievements.push('top_competitor');
        }
      }
    }

    return achievements;
  }

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  private async saveSinglePlayerResult(result: SinglePlayerResult): Promise<void> {
    try {
      // Save to user progress
      await supabase.from('user_progress').insert({
        user_id: this.configuration.userId,
        topic_id: this.configuration.topicId,
        score: result.score,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers,
        accuracy: result.accuracy,
        time_spent: result.timeSpent,
        difficulty_level: this.configuration.difficultyLevel,
        is_completed: true,
        completed_at: new Date().toISOString(),
        session_id: this.gameSession.id,
      });

      // Save individual answers for analytics
      if (this.answers.length > 0) {
        const answerRecords = this.answers.map(answer => ({
          user_id: this.configuration.userId,
          topic_id: this.configuration.topicId,
          question_id: answer.questionId,
          selected_answer: answer.answer,
          is_correct: answer.isCorrect,
          time_spent: answer.timeSpent,
          session_id: this.gameSession.id,
          created_at: new Date().toISOString(),
        }));

        await supabase.from('user_question_attempts').insert(answerRecords);
      }

      console.log('💾 Single player result saved');
    } catch (error) {
      console.error('Error saving single player result:', error);
    }
  }

  // ============================================================================
  // MULTIPLAYER HANDLERS
  // ============================================================================

  private handleMultiplayerUpdate(update: Partial<GameState>): void {
    // Update local game session with multiplayer changes
    this.gameSession.state = { ...this.gameSession.state, ...update };
    
    // Handle specific multiplayer events
    if (update.status === 'completed') {
      this.endGame();
    }
  }

  private handleMultiplayerAction(action: any): void {
    // Handle actions from other players
    console.log('🎮 Multiplayer action received:', action.type);
  }

  // ============================================================================
  // EVENT EMITTERS
  // ============================================================================

  private emitScoreUpdate(score: number): void {
    this.scoreUpdateCallbacks.forEach(callback => {
      try {
        callback(score);
      } catch (error) {
        console.error('Error in score update callback:', error);
      }
    });
  }

  private emitGameComplete(result: SinglePlayerResult | MultiplayerResult): void {
    this.gameCompleteCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in game complete callback:', error);
      }
    });
  }

  private emitError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  onQuestionChange(callback: (question: Question, index: number) => void): () => void {
    this.questionChangeCallbacks.add(callback);
    return () => this.questionChangeCallbacks.delete(callback);
  }

  onScoreUpdate(callback: (score: number) => void): () => void {
    this.scoreUpdateCallbacks.add(callback);
    return () => this.scoreUpdateCallbacks.delete(callback);
  }

  onGameComplete(callback: (result: SinglePlayerResult | MultiplayerResult) => void): () => void {
    this.gameCompleteCallbacks.add(callback);
    return () => this.gameCompleteCallbacks.delete(callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onNPCChat(callback: (npcId: string, message: string) => void): () => void {
    this.npcChatCallbacks.add(callback);
    return () => this.npcChatCallbacks.delete(callback);
  }

  getGameSession(): GameSession {
    return { ...this.gameSession };
  }

  getCurrentQuestion(): Question | null {
    const question = this.gameSession.state.questions[this.currentQuestionIndex];
    if (!question) return null;
    
    const result: Question = {
      id: question.id,
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      topic_id: question.topic_id,
    };
    
    if (question.explanation !== undefined) {
      result.explanation = question.explanation;
    }
    
    if (question.time_limit !== undefined) {
      result.time_limit = question.time_limit;
    }
    
    return result;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const current = this.currentQuestionIndex + 1;
    const total = this.gameSession.state.questions.length;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return { current, total, percentage };
  }

  getActiveNPCs(): NPCGamePlayer[] {
    return Array.from(this.activeNPCs.values());
  }

  async addNPCManually(personalityType?: string): Promise<boolean> {
    if (this.configuration.mode !== 'multiplayer' || !this.configuration.roomId) {
      return false;
    }

    const currentPlayerCount = this.gameSession.state.players.length;
    const maxPlayers = this.gameSession.state.settings.maxPlayers;
    
    if (currentPlayerCount >= maxPlayers) {
      return false; // Room is full
    }

    await this.addSingleNPC();
    return true;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  cleanup(): void {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }

    if (this.gameState) {
      this.gameState.cleanup();
    }

    this.questionChangeCallbacks.clear();
    this.scoreUpdateCallbacks.clear();
    this.gameCompleteCallbacks.clear();
    this.errorCallbacks.clear();
    this.npcChatCallbacks.clear();

    console.log('🧹 Universal Game Engine cleaned up');
  }
} 