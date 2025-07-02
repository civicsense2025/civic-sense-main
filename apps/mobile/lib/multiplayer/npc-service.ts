import { supabase } from '../supabase';

// ============================================================================
// COMPREHENSIVE NPC SERVICE FOR CIVICSENSE
// Integrates with all NPC-related database tables
// ============================================================================

export interface NPCPersonality {
  id: string;
  npc_code: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  personality_type: string;
  emoji: string;
  byline: string | null;
  description: string | null;
  background_story: string | null;
  age_range: string | null;
  profession: string | null;
  location: string | null;
  political_engagement_level: string | null;
  communication_style: string | null;
  encouragement_style: string;
  base_accuracy_min: number;
  base_accuracy_max: number;
  base_skill_level: string;
  response_time_min: number;
  response_time_max: number;
  chattiness_level: number;
  humor_level: number;
  confidence_level: number;
  consistency_factor: number;
  adaptation_rate: number;
  max_skill_drift: number;
  learning_enabled: boolean;
  learning_motivation: string | null;
  preferred_topics: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DERIVED INTERFACES (keeping backward compatibility)
// ============================================================================

export interface NPCPersonalityCompat {
  id: string;
  name: string;
  personality_type: 'academic' | 'civic' | 'competitive' | 'democratic' | 'analytical' | 'collaborative';
  avatar_emoji: string;
  base_accuracy: number;
  response_time_range: [number, number]; // [min_ms, max_ms]
  chattiness_level: number; // 0-1
  learning_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NPCSpecialization {
  npc_id: string;
  category_id: string;
  proficiency_level: number; // 0-1
  confidence_modifier: number; // -0.2 to +0.2
}

export interface NPCChatTemplate {
  id: string;
  npc_id: string;
  context_type: 'greeting' | 'correct_answer' | 'incorrect_answer' | 'encouragement' | 'celebration' | 'analysis';
  template_text: string;
  variables: string[]; // Variables that can be replaced in the template
  weight: number; // For random selection
}

export interface NPCLearningProgression {
  npc_id: string;
  topic_id: string;
  category_id: string;
  sessions_played: number;
  accuracy_improvement: number;
  speed_improvement: number;
  confidence_level: number;
  last_updated: string;
}

export interface NPCGamePlayer {
  id: string;
  npc_id: string;
  room_id: string;
  player_name: string;
  current_accuracy: number;
  current_response_time: number;
  is_active: boolean;
  joined_at: string;
}

export interface NPCQuestionResponse {
  id: string;
  npc_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  response_time_seconds: number;
  confidence_level: number;
  reasoning?: string;
  answered_at: string;
}

export interface NPCChatMessage {
  message: string;
  context_type: string;
  confidence: number;
  personality_traits: string[];
}

// ============================================================================
// NPC SERVICE CLASS
// ============================================================================

export class NPCService {
  private static instance: NPCService;
  private personalityCache = new Map<string, NPCPersonality>();
  private templateCache = new Map<string, NPCChatTemplate[]>();
  private specializationCache = new Map<string, NPCSpecialization[]>();

  static getInstance(): NPCService {
    if (!NPCService.instance) {
      NPCService.instance = new NPCService();
    }
    return NPCService.instance;
  }

  // ============================================================================
  // PERSONALITY MANAGEMENT
  // ============================================================================

  async getPersonality(npcId: string): Promise<NPCPersonality | null> {
    // Check cache first
    if (this.personalityCache.has(npcId)) {
      return this.personalityCache.get(npcId)!;
    }

    try {
      const { data, error } = await supabase
        .from('npc_personalities')
        .select('*')
        .eq('id', npcId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const personality: NPCPersonality = data;
      this.personalityCache.set(npcId, personality);
      return personality;
    } catch (error) {
      console.error('Error fetching NPC personality:', error);
      return null;
    }
  }

  async getPersonalityByCode(npcCode: string): Promise<NPCPersonality | null> {
    try {
      const { data, error } = await supabase
        .from('npc_personalities')
        .select('*')
        .eq('npc_code', npcCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const personality: NPCPersonality = data;
      this.personalityCache.set(personality.id, personality);
      return personality;
    } catch (error) {
      console.error('Error fetching NPC personality by code:', error);
      return null;
    }
  }

  async getRandomPersonality(
    topicId?: string, 
    categoryId?: string,
    excludeIds: string[] = []
  ): Promise<NPCPersonality | null> {
    try {
      let query = supabase
        .from('npc_personalities')
        .select('*')
        .eq('is_active', true);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // If we have a category, prefer NPCs with specialization in that area
      if (categoryId) {
        const { data: specializedNPCs } = await supabase
          .from('npc_category_specializations')
          .select('npc_id')
          .eq('category_id', categoryId)
          .gte('proficiency_level', 0.6);

        if (specializedNPCs && specializedNPCs.length > 0) {
          const npcIds = specializedNPCs.map(s => s.npc_id);
          query = query.in('id', npcIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        return await this.createDefaultNPC();
      }

      // Randomly select one
      const randomIndex = Math.floor(Math.random() * data.length);
      const selected = data[randomIndex];

      return selected;
    } catch (error) {
      console.error('Error getting random personality:', error);
      return await this.createDefaultNPC();
    }
  }

  async getAllActivePersonalities(): Promise<NPCPersonality[]> {
    try {
      const { data, error } = await supabase
        .from('npc_personalities')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active personalities:', error);
      return [];
    }
  }

  // Convert database personality to backward-compatible format
  toCompatPersonality(npc: NPCPersonality): NPCPersonalityCompat {
    return {
      id: npc.id,
      name: npc.display_name,
      personality_type: this.mapPersonalityType(npc.personality_type),
      avatar_emoji: npc.emoji,
      base_accuracy: (npc.base_accuracy_min + npc.base_accuracy_max) / 2,
      response_time_range: [npc.response_time_min, npc.response_time_max],
      chattiness_level: npc.chattiness_level,
      learning_enabled: npc.learning_enabled,
      is_active: npc.is_active,
      created_at: npc.created_at,
      updated_at: npc.updated_at,
    };
  }

  private mapPersonalityType(dbType: string): 'academic' | 'civic' | 'competitive' | 'democratic' | 'analytical' | 'collaborative' {
    const mappings: Record<string, 'academic' | 'civic' | 'competitive' | 'democratic' | 'analytical' | 'collaborative'> = {
      'academic': 'academic',
      'scholarly': 'academic',
      'civic': 'civic',
      'community': 'civic',
      'competitive': 'competitive',
      'challenger': 'competitive',
      'democratic': 'democratic',
      'balanced': 'democratic',
      'analytical': 'analytical',
      'data_driven': 'analytical',
      'collaborative': 'collaborative',
      'team_player': 'collaborative',
    };
    
    return mappings[dbType.toLowerCase()] || 'civic';
  }

  private async createDefaultNPC(): Promise<NPCPersonality> {
    const defaultPersonality: NPCPersonality = {
      id: `default_${Date.now()}`,
      npc_code: `DEFAULT_${Date.now()}`,
      display_name: 'Civic Bot',
      first_name: 'Civic',
      last_name: 'Bot',
      personality_type: 'civic',
      emoji: '🤖',
      byline: 'Your friendly civics companion',
      description: 'A helpful AI that loves civics education',
      background_story: null,
      age_range: null,
      profession: 'AI Assistant',
      location: null,
      political_engagement_level: 'moderate',
      communication_style: 'friendly',
      encouragement_style: 'supportive',
      base_accuracy_min: 0.65,
      base_accuracy_max: 0.85,
      base_skill_level: 'intermediate',
      response_time_min: 2000,
      response_time_max: 6000,
      chattiness_level: 0.5,
      humor_level: 0.3,
      confidence_level: 0.7,
      consistency_factor: 0.8,
      adaptation_rate: 0.1,
      max_skill_drift: 0.2,
      learning_enabled: true,
      learning_motivation: 'helpful',
      preferred_topics: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return defaultPersonality;
  }

  // ============================================================================
  // GAME INTEGRATION
  // ============================================================================

  async addNPCToGame(
    roomId: string, 
    npcId: string, 
    playerName?: string
  ): Promise<NPCGamePlayer | null> {
    try {
      const personality = await this.getPersonality(npcId);
      if (!personality) return null;

      const npcPlayer = {
        npc_id: npcId,
        room_id: roomId,
        player_name: playerName || personality.display_name,
        current_accuracy: (personality.base_accuracy_min + personality.base_accuracy_max) / 2,
        current_response_time: (personality.response_time_min + personality.response_time_max) / 2,
        is_active: true,
        joined_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('multiplayer_npc_players')
        .insert(npcPlayer)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        npc_id: data.npc_id,
        room_id: data.room_id,
        player_name: data.player_name,
        current_accuracy: data.current_accuracy,
        current_response_time: data.current_response_time,
        is_active: data.is_active,
        joined_at: data.joined_at,
      };
    } catch (error) {
      console.error('Error adding NPC to game:', error);
      return null;
    }
  }

  async removeNPCFromGame(roomId: string, npcId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('multiplayer_npc_players')
        .update({ is_active: false })
        .eq('room_id', roomId)
        .eq('npc_id', npcId);

      return !error;
    } catch (error) {
      console.error('Error removing NPC from game:', error);
      return false;
    }
  }

  // ============================================================================
  // ANSWER GENERATION
  // ============================================================================

  async generateAnswer(
    npcId: string, 
    questionId: string, 
    question: any,
    topicId?: string,
    categoryId?: string
  ): Promise<{ answer: string; confidence: number; responseTime: number } | null> {
    try {
      const personality = await this.getPersonality(npcId);
      if (!personality) return null;

      // Get current accuracy including learning progression
      const currentAccuracy = await this.getCurrentAccuracy(npcId, topicId, categoryId);
      
      // Calculate if answer should be correct
      const isCorrect = Math.random() < currentAccuracy;
      
      // Select answer
      const answer = isCorrect 
        ? question.correctAnswer || question.correct_answer
        : this.selectWrongAnswer(question);

      // Calculate response time with some randomness
      const [minTime, maxTime] = [personality.response_time_min, personality.response_time_max];
      const responseTime = Math.random() * (maxTime - minTime) + minTime;

      // Calculate confidence (correct answers have higher confidence)
      const confidence = isCorrect 
        ? 0.7 + (Math.random() * 0.3) 
        : 0.3 + (Math.random() * 0.4);

      // Record the response for learning
      await this.recordQuestionResponse(npcId, questionId, answer, isCorrect, responseTime, confidence);

      // Update learning progression
      if (personality.learning_enabled && topicId) {
        await this.updateLearningProgression(npcId, topicId, categoryId, isCorrect, responseTime);
      }

      return {
        answer,
        confidence,
        responseTime,
      };
    } catch (error) {
      console.error('Error generating NPC answer:', error);
      return null;
    }
  }

  private selectWrongAnswer(question: any): string {
    const options = question.options || [];
    const correctAnswer = question.correctAnswer || question.correct_answer;
    
    // Filter out the correct answer
    const wrongOptions = options.filter((option: string) => option !== correctAnswer);
    
    if (wrongOptions.length === 0) {
      return options[0] || 'No answer';
    }

    // Randomly select from wrong options
    return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }

  // ============================================================================
  // CHAT GENERATION
  // ============================================================================

  async generateChatMessage(
    npcId: string, 
    contextType: string,
    variables: Record<string, string> = {}
  ): Promise<NPCChatMessage | null> {
    try {
      const personality = await this.getPersonality(npcId);
      if (!personality) return null;

      // Get chat templates for this personality type
      const templates = await this.getChatTemplates(personality.personality_type, contextType);
      
      if (templates.length === 0) {
        return this.generateDefaultMessage(personality, contextType);
      }

      // Weight-based random selection
      const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
      let randomWeight = Math.random() * totalWeight;
      
      let selectedTemplate: NPCChatTemplate | null = null;
      for (const template of templates) {
        randomWeight -= template.weight;
        if (randomWeight <= 0) {
          selectedTemplate = template;
          break;
        }
      }

      if (!selectedTemplate && templates.length > 0) {
        selectedTemplate = templates[0] || null;
      }

      if (!selectedTemplate) {
        return this.generateDefaultMessage(personality, contextType);
      }

      // Replace variables in template
      let message = selectedTemplate.template_text;
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }

      return {
        message,
        context_type: contextType,
        confidence: 0.8,
        personality_traits: [personality.personality_type],
      };
    } catch (error) {
      console.error('Error generating chat message:', error);
      return null;
    }
  }

  private async getChatTemplates(
    personalityType: string, 
    contextType: string
  ): Promise<NPCChatTemplate[]> {
    const cacheKey = `${personalityType}_${contextType}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase
        .from('npc_chat_templates')
        .select('*')
        .eq('npc_personality_type', personalityType)
        .eq('context_type', contextType)
        .order('weight', { ascending: false });

      if (error) throw error;

      const templates: NPCChatTemplate[] = (data || []).map(t => ({
        id: t.id,
        npc_id: t.npc_id,
        context_type: t.context_type,
        template_text: t.template_text,
        variables: t.variables || [],
        weight: t.weight || 1,
      }));

      this.templateCache.set(cacheKey, templates);
      return templates;
    } catch (error) {
      console.error('Error fetching chat templates:', error);
      return [];
    }
  }

  private generateDefaultMessage(personality: NPCPersonality, contextType: string): NPCChatMessage {
    const defaultMessages = {
      greeting: ["Hello everyone!", "Ready to learn!", "Let's do this!"],
      correct_answer: ["Great job!", "Excellent!", "Well done!"],
      incorrect_answer: ["Good try!", "Close one!", "Keep going!"],
      encouragement: ["You've got this!", "Don't give up!", "Learning is a journey!"],
      celebration: ["Amazing work!", "Fantastic!", "Outstanding!"],
      analysis: ["Interesting perspective", "Let me think about that", "Good observation"],
    };

    const messages = defaultMessages[contextType as keyof typeof defaultMessages] || defaultMessages.greeting;
    const message = messages[Math.floor(Math.random() * messages.length)] || 'Hello!';

    return {
      message,
      context_type: contextType,
      confidence: 0.6,
      personality_traits: [personality.personality_type],
    };
  }

  // ============================================================================
  // LEARNING & ANALYTICS
  // ============================================================================

  private async getCurrentAccuracy(
    npcId: string, 
    topicId?: string,
    categoryId?: string
  ): Promise<number> {
    try {
      const personality = await this.getPersonality(npcId);
      if (!personality) return 0.5;

      let accuracy = (personality.base_accuracy_min + personality.base_accuracy_max) / 2;

      // Apply learning progression if available
      if (topicId) {
        const { data: progression } = await supabase
          .from('npc_learning_progression')
          .select('accuracy_improvement')
          .eq('npc_id', npcId)
          .eq('topic_id', topicId)
          .single();

        if (progression) {
          accuracy += progression.accuracy_improvement;
        }
      }

      // Apply specialization bonus if available
      if (categoryId) {
        const specializations = await this.getSpecializations(npcId);
        const specialization = specializations.find(s => s.category_id === categoryId);
        if (specialization) {
          accuracy += specialization.confidence_modifier;
        }
      }

      // Clamp between 0.2 and 0.95
      return Math.max(0.2, Math.min(0.95, accuracy));
    } catch (error) {
      console.error('Error getting current accuracy:', error);
      return 0.5;
    }
  }

  private async getSpecializations(npcId: string): Promise<NPCSpecialization[]> {
    if (this.specializationCache.has(npcId)) {
      return this.specializationCache.get(npcId)!;
    }

    try {
      const { data, error } = await supabase
        .from('npc_category_specializations')
        .select('*')
        .eq('npc_id', npcId);

      if (error) throw error;

      const specializations: NPCSpecialization[] = (data || []).map(s => ({
        npc_id: s.npc_id,
        category_id: s.category_id,
        proficiency_level: s.proficiency_level,
        confidence_modifier: s.confidence_modifier,
      }));

      this.specializationCache.set(npcId, specializations);
      return specializations;
    } catch (error) {
      console.error('Error fetching specializations:', error);
      return [];
    }
  }

  private async recordQuestionResponse(
    npcId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    responseTime: number,
    confidence: number
  ): Promise<void> {
    try {
      await supabase.from('npc_question_responses').insert({
        npc_id: npcId,
        question_id: questionId,
        selected_answer: answer || null,
        is_correct: isCorrect,
        response_time_seconds: responseTime / 1000,
        confidence_level: confidence,
        answered_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording question response:', error);
    }
  }

  private async updateLearningProgression(
    npcId: string,
    topicId: string,
    categoryId?: string,
    isCorrect?: boolean,
    responseTime?: number
  ): Promise<void> {
    try {
      // Get existing progression
      const { data: existing } = await supabase
        .from('npc_learning_progression')
        .select('*')
        .eq('npc_id', npcId)
        .eq('topic_id', topicId)
        .single();

      if (existing) {
        // Update existing progression
        const updates: any = {
          sessions_played: existing.sessions_played + 1,
          last_updated: new Date().toISOString(),
        };

        if (isCorrect !== undefined) {
          // Small accuracy improvement for correct answers
          const improvement = isCorrect ? 0.01 : -0.005;
          updates.accuracy_improvement = Math.max(-0.2, Math.min(0.3, existing.accuracy_improvement + improvement));
        }

        if (responseTime !== undefined) {
          // Track speed improvement (negative = faster)
          const speedChange = responseTime < existing.sessions_played * 3000 ? 0.01 : -0.005;
          updates.speed_improvement = Math.max(-0.3, Math.min(0.2, existing.speed_improvement + speedChange));
        }

        await supabase
          .from('npc_learning_progression')
          .update(updates)
          .eq('npc_id', npcId)
          .eq('topic_id', topicId);
      } else {
        // Create new progression
        await supabase.from('npc_learning_progression').insert({
          npc_id: npcId,
          topic_id: topicId,
          category_id: categoryId || '',
          sessions_played: 1,
          accuracy_improvement: isCorrect ? 0.01 : 0,
          speed_improvement: 0,
          confidence_level: 0.5,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating learning progression:', error);
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getAnalytics(roomId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('npc_vs_human_analytics')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  clearCache(): void {
    this.personalityCache.clear();
    this.templateCache.clear();
    this.specializationCache.clear();
  }
} 