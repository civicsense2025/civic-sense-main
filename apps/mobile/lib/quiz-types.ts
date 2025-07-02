export type QuizGameMode = 
  // Solo Modes
  | 'practice'
  | 'assessment'
  | 'npc_battle'
  | 'civics_test_quick'
  | 'civics_test_full'
  | 'daily'
  | 'rapid'
  | 'challenge'
  // Multiplayer Modes
  | 'classic_quiz'
  | 'speed_round'
  | 'matching_challenge'
  | 'debate_mode';

export interface QuizGameMetadata {
  // Common settings
  difficulty_level?: number;
  time_limit_seconds?: number;
  
  // Practice mode settings
  hints_enabled?: boolean;
  explanations_enabled?: boolean;
  show_correct_answers?: boolean;
  
  // Assessment mode settings
  assessment_type?: 'skill_check' | 'placement' | 'certification' | 'civics_test';
  skill_areas?: string[];
  question_count?: number;
  
  // NPC battle settings
  npc_id?: string;
  npc_difficulty?: number;
  
  // Multiplayer settings
  room_id?: string;
  player_count?: number;
  
  // Additional metadata
  platform?: 'web' | 'mobile';
  device_info?: Record<string, any>;
  premium_features?: string[];
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  topic_id: string;
  total_questions: number;
  correct_answers: number | null;
  score: number | null;
  is_completed: boolean | null;
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number | null;
  game_mode: QuizGameMode;
  game_metadata: QuizGameMetadata | null;
} 