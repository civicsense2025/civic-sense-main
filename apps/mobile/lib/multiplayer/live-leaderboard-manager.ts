import { supabase } from '../supabase';
import { realtimeManager } from '../realtime-manager';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  isNPC: boolean;
  responseTime: number;
  accuracy: number;
  consecutiveCorrect: number;
  totalAnswered: number;
  powerUps?: string[];
  achievements?: string[];
  lastActivity: string;
}

export interface LiveLeaderboard {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  lastUpdated: string;
  gamePhase: 'waiting' | 'in_progress' | 'completed';
  topScore: number;
  averageScore: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  speedBonus: number;
  accuracyBonus: number;
  streakBonus: number;
  participationBonus: number;
  total: number;
}

// ============================================================================
// LIVE LEADERBOARD MANAGER
// ============================================================================

export class LiveLeaderboardManager {
  private roomId: string;
  private leaderboard: LiveLeaderboard;
  private scoreHistory: Map<string, number[]> = new Map();
  private updateCallbacks: Set<(leaderboard: LiveLeaderboard) => void> = new Set();
  private realtimeSubscription: any = null;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.leaderboard = {
      entries: [],
      totalPlayers: 0,
      lastUpdated: new Date().toISOString(),
      gamePhase: 'waiting',
      topScore: 0,
      averageScore: 0,
    };
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  async initialize(players: any[]): Promise<void> {
    try {
      console.log('🏆 Initializing live leaderboard for room:', this.roomId);

      // Create initial leaderboard entries
      this.leaderboard.entries = players.map((player, index) => ({
        playerId: player.id,
        playerName: player.name,
        score: 0,
        rank: index + 1,
        isNPC: player.isNPC || false,
        responseTime: 0,
        accuracy: 0,
        consecutiveCorrect: 0,
        totalAnswered: 0,
        powerUps: [],
        achievements: [],
        lastActivity: new Date().toISOString(),
      }));

      this.leaderboard.totalPlayers = players.length;
      this.leaderboard.gamePhase = 'waiting';

      // Set up real-time subscriptions
      await this.setupRealtimeSubscription();

      // Initialize score history for each player
      players.forEach(player => {
        this.scoreHistory.set(player.id, []);
      });

      console.log(`✅ Leaderboard initialized with ${players.length} players`);
    } catch (error) {
      console.error('Error initializing leaderboard:', error);
      throw error;
    }
  }

  private async setupRealtimeSubscription(): Promise<void> {
    try {
      this.realtimeSubscription = supabase
        .channel(`leaderboard_${this.roomId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'multiplayer_quiz_attempts',
          filter: `room_id=eq.${this.roomId}`
        }, (payload) => {
          this.handleRealtimeUpdate(payload);
        })
        .subscribe();

      console.log('🔄 Real-time leaderboard subscription active');
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }

  private handleRealtimeUpdate(payload: any): void {
    console.log('📊 Leaderboard real-time update:', payload);
    // Process real-time updates and refresh leaderboard
    this.broadcastUpdate();
  }

  // ============================================================================
  // SCORE MANAGEMENT
  // ============================================================================

  async updateScores(players: any[]): Promise<void> {
    try {
      const updatedEntries: LeaderboardEntry[] = [];

      for (const player of players) {
        const entry: LeaderboardEntry = {
          playerId: player.id,
          playerName: player.name,
          score: player.score || 0,
          rank: 0, // Will be calculated after sorting
          isNPC: player.isNPC || false,
          responseTime: player.averageResponseTime || 0,
          accuracy: this.calculateAccuracy(player),
          consecutiveCorrect: player.consecutiveCorrect || 0,
          totalAnswered: player.totalAnswered || 0,
          powerUps: player.powerUps || [],
          achievements: this.calculateAchievements(player),
          lastActivity: new Date().toISOString(),
        };

        // Track score history
        const history = this.scoreHistory.get(player.id) || [];
        history.push(entry.score);
        this.scoreHistory.set(player.id, history);

        updatedEntries.push(entry);
      }

      // Sort by score (descending) and assign ranks
      updatedEntries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.responseTime !== b.responseTime) return a.responseTime - b.responseTime;
        return a.playerName.localeCompare(b.playerName);
      });

      // Assign ranks with tie handling
      let currentRank = 1;
      for (let i = 0; i < updatedEntries.length; i++) {
        if (i > 0 && updatedEntries[i].score < updatedEntries[i - 1].score) {
          currentRank = i + 1;
        }
        updatedEntries[i].rank = currentRank;
      }

      // Update leaderboard
      this.leaderboard.entries = updatedEntries;
      this.leaderboard.totalPlayers = updatedEntries.length;
      this.leaderboard.lastUpdated = new Date().toISOString();
      this.leaderboard.topScore = updatedEntries.length > 0 ? updatedEntries[0].score : 0;
      this.leaderboard.averageScore = this.calculateAverageScore(updatedEntries);

      // Broadcast update to all subscribers
      this.broadcastUpdate();

      console.log('📊 Leaderboard updated:', {
        totalPlayers: this.leaderboard.totalPlayers,
        topScore: this.leaderboard.topScore,
        averageScore: this.leaderboard.averageScore,
      });

    } catch (error) {
      console.error('Error updating leaderboard scores:', error);
    }
  }

  private calculateAccuracy(player: any): number {
    if (!player.totalAnswered || player.totalAnswered === 0) return 0;
    const correctAnswers = player.correctAnswers || 0;
    return Math.round((correctAnswers / player.totalAnswered) * 100);
  }

  private calculateAchievements(player: any): string[] {
    const achievements: string[] = [];

    // Perfect Score Achievement
    if (player.accuracy === 100 && player.totalAnswered >= 5) {
      achievements.push('perfect_score');
    }

    // Speed Demon Achievement
    if (player.averageResponseTime < 3000 && player.totalAnswered >= 3) {
      achievements.push('speed_demon');
    }

    // Streak Master Achievement
    if (player.consecutiveCorrect >= 5) {
      achievements.push('streak_master');
    }

    // Comeback King Achievement
    const history = this.scoreHistory.get(player.id) || [];
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const isImproving = recent.every((score, index) => 
        index === 0 || score > recent[index - 1]
      );
      if (isImproving) {
        achievements.push('comeback_king');
      }
    }

    return achievements;
  }

  private calculateAverageScore(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;
    const totalScore = entries.reduce((sum, entry) => sum + entry.score, 0);
    return Math.round(totalScore / entries.length);
  }

  // ============================================================================
  // SCORE CALCULATION SYSTEM
  // ============================================================================

  calculateQuestionScore(
    isCorrect: boolean,
    responseTime: number,
    questionDifficulty: 'easy' | 'medium' | 'hard',
    consecutiveCorrect: number,
    totalQuestions: number
  ): ScoreBreakdown {
    const basePoints = {
      easy: 10,
      medium: 15,
      hard: 20,
    };

    const breakdown: ScoreBreakdown = {
      baseScore: 0,
      speedBonus: 0,
      accuracyBonus: 0,
      streakBonus: 0,
      participationBonus: 5, // Base participation points
      total: 0,
    };

    if (!isCorrect) {
      breakdown.total = breakdown.participationBonus;
      return breakdown;
    }

    // Base score for correct answer
    breakdown.baseScore = basePoints[questionDifficulty];

    // Speed bonus (max 50% of base score)
    const maxResponseTime = 30000; // 30 seconds
    const speedFactor = Math.max(0, (maxResponseTime - responseTime) / maxResponseTime);
    breakdown.speedBonus = Math.round(breakdown.baseScore * 0.5 * speedFactor);

    // Accuracy bonus for perfect answers
    breakdown.accuracyBonus = Math.round(breakdown.baseScore * 0.2);

    // Streak bonus (increases with consecutive correct answers)
    if (consecutiveCorrect >= 3) {
      const streakMultiplier = Math.min(2.0, 1 + (consecutiveCorrect - 2) * 0.1);
      breakdown.streakBonus = Math.round(breakdown.baseScore * (streakMultiplier - 1));
    }

    // Calculate total
    breakdown.total = 
      breakdown.baseScore + 
      breakdown.speedBonus + 
      breakdown.accuracyBonus + 
      breakdown.streakBonus + 
      breakdown.participationBonus;

    return breakdown;
  }

  // ============================================================================
  // REAL-TIME FEATURES
  // ============================================================================

  async addPowerUp(playerId: string, powerUpType: string): Promise<void> {
    const entry = this.leaderboard.entries.find(e => e.playerId === playerId);
    if (entry) {
      entry.powerUps = entry.powerUps || [];
      entry.powerUps.push(powerUpType);
      entry.lastActivity = new Date().toISOString();
      this.broadcastUpdate();
    }
  }

  async usePowerUp(playerId: string, powerUpType: string): Promise<boolean> {
    const entry = this.leaderboard.entries.find(e => e.playerId === playerId);
    if (entry && entry.powerUps) {
      const index = entry.powerUps.indexOf(powerUpType);
      if (index > -1) {
        entry.powerUps.splice(index, 1);
        entry.lastActivity = new Date().toISOString();
        this.broadcastUpdate();
        return true;
      }
    }
    return false;
  }

  // ============================================================================
  // FINAL RESULTS
  // ============================================================================

  async getFinalResults(): Promise<LiveLeaderboard> {
    try {
      // Mark game phase as completed
      this.leaderboard.gamePhase = 'completed';
      this.leaderboard.lastUpdated = new Date().toISOString();

      // Save final results to database
      await this.saveFinalResultsToDatabase();

      // Calculate final achievements and statistics
      await this.calculateFinalAchievements();

      console.log('🏁 Final leaderboard results calculated');
      return { ...this.leaderboard };
    } catch (error) {
      console.error('Error getting final results:', error);
      return this.leaderboard;
    }
  }

  private async saveFinalResultsToDatabase(): Promise<void> {
    try {
      const leaderboardData = {
        room_id: this.roomId,
        final_standings: this.leaderboard.entries,
        total_players: this.leaderboard.totalPlayers,
        top_score: this.leaderboard.topScore,
        average_score: this.leaderboard.averageScore,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('multiplayer_leaderboards')
        .insert(leaderboardData);

      if (error) throw error;

      console.log('💾 Final leaderboard saved to database');
    } catch (error) {
      console.error('Error saving final results:', error);
    }
  }

  private async calculateFinalAchievements(): Promise<void> {
    // Award final achievements based on performance
    for (const entry of this.leaderboard.entries) {
      // Tournament Winner
      if (entry.rank === 1 && this.leaderboard.totalPlayers >= 3) {
        entry.achievements = entry.achievements || [];
        if (!entry.achievements.includes('tournament_winner')) {
          entry.achievements.push('tournament_winner');
        }
      }

      // Participation Award
      if (entry.totalAnswered >= this.leaderboard.entries.length * 0.8) {
        entry.achievements = entry.achievements || [];
        if (!entry.achievements.includes('active_participant')) {
          entry.achievements.push('active_participant');
        }
      }

      // Underdog Victory (NPC beating humans, or low-ranked player improving)
      if (entry.isNPC && entry.rank <= 3 && this.leaderboard.totalPlayers >= 5) {
        entry.achievements = entry.achievements || [];
        if (!entry.achievements.includes('ai_excellence')) {
          entry.achievements.push('ai_excellence');
        }
      }
    }
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  onLeaderboardUpdate(callback: (leaderboard: LiveLeaderboard) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Send current state immediately
    callback({ ...this.leaderboard });
    
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  private broadcastUpdate(): void {
    const leaderboardCopy = { ...this.leaderboard };
    this.updateCallbacks.forEach(callback => {
      try {
        callback(leaderboardCopy);
      } catch (error) {
        console.error('Error in leaderboard update callback:', error);
      }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getCurrentLeaderboard(): LiveLeaderboard {
    return { ...this.leaderboard };
  }

  getPlayerRank(playerId: string): number {
    const entry = this.leaderboard.entries.find(e => e.playerId === playerId);
    return entry?.rank || 0;
  }

  getPlayerEntry(playerId: string): LeaderboardEntry | null {
    const entry = this.leaderboard.entries.find(e => e.playerId === playerId);
    return entry ? { ...entry } : null;
  }

  getTopPlayers(count: number = 3): LeaderboardEntry[] {
    return this.leaderboard.entries.slice(0, count).map(entry => ({ ...entry }));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  cleanup(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
    
    this.updateCallbacks.clear();
    this.scoreHistory.clear();
    
    console.log('🧹 Live leaderboard manager cleaned up');
  }
} 