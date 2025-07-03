// CivicSense Multiplayer Types
// Multiplayer game-related type definitions

import type { QuizQuestion, QuizAnswer } from './quiz';
import type { User } from './user';

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  gameMode: GameMode;
  status: RoomStatus;
  players: Player[];
  settings: GameSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
}

export type GameMode = 'classic' | 'elimination' | 'speed' | 'team' | 'practice';

export type RoomStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'abandoned';

export interface Player {
  userId: string;
  user: User;
  status: PlayerStatus;
  score: number;
  answers: QuizAnswer[];
  joinedAt: Date;
  team?: string;
  isHost: boolean;
  isReady: boolean;
}

export type PlayerStatus = 'active' | 'inactive' | 'eliminated' | 'spectating';

export interface GameSettings {
  questionCount: number;
  timePerQuestion: number;
  showLeaderboard: boolean;
  allowLateJoin: boolean;
  teamMode: boolean;
  difficultyLevel: 'mixed' | 'easy' | 'medium' | 'hard';
  topics: string[];
  eliminationRules?: EliminationRules;
  speedRules?: SpeedRules;
}

export interface EliminationRules {
  eliminateAfterWrong: number;
  eliminateLastPlace: boolean;
  eliminationInterval: number;
}

export interface SpeedRules {
  bonusPoints: boolean;
  penaltyPoints: boolean;
  timeBonus: number;
}

export interface GameState {
  roomId: string;
  currentQuestion?: QuizQuestion;
  questionIndex: number;
  timeRemaining: number;
  phase: GamePhase;
  scores: PlayerScore[];
  teams?: TeamScore[];
}

export type GamePhase = 'lobby' | 'countdown' | 'question' | 'answer_reveal' | 'leaderboard' | 'final';

export interface PlayerScore {
  userId: string;
  score: number;
  correctAnswers: number;
  averageTime: number;
  streak: number;
}

export interface TeamScore {
  teamId: string;
  name: string;
  score: number;
  players: string[];
} 