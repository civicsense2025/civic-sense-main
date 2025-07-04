import { supabase } from '../supabase';
import type { 
  Survey, 
  SurveyQuestion, 
  SurveyResponse,
  SurveyIncentive,
  ClaimSurveyRewardsResponse 
} from '../types/survey';

export class SurveyService {
  /**
   * Fetch active surveys for the user
   */
  static async getActiveSurveys(userId?: string): Promise<Survey[]> {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          survey_questions (
            id,
            type,
            question,
            description,
            required,
            options,
            scale_min,
            scale_max,
            scale_labels,
            max_selections,
            matrix_config,
            dynamic_config,
            conditional_logic,
            display_order
          ),
          survey_incentives (*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out completed surveys if user is authenticated
      if (userId && data) {
        const { data: completedSurveys } = await supabase
          .from('survey_responses')
          .select('survey_id')
          .eq('user_id', userId)
          .eq('status', 'completed');

        const completedIds = completedSurveys?.map(r => r.survey_id) || [];
        return data.filter(survey => !completedIds.includes(survey.id));
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching surveys:', error);
      return [];
    }
  }

  /**
   * Get a specific survey by ID
   */
  static async getSurveyById(surveyId: string): Promise<Survey | null> {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          survey_questions (
            id,
            type,
            question,
            description,
            required,
            options,
            scale_min,
            scale_max,
            scale_labels,
            max_selections,
            matrix_config,
            dynamic_config,
            conditional_logic,
            display_order
          ),
          survey_incentives (*)
        `)
        .eq('id', surveyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching survey:', error);
      return null;
    }
  }

  /**
   * Save survey response
   */
  static async saveSurveyResponse(
    surveyId: string,
    responses: SurveyResponse[],
    userId?: string,
    guestToken?: string
  ): Promise<{ success: boolean; responseId?: string }> {
    try {
      // Create survey response record
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          user_id: userId,
          guest_token: guestToken,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Save individual question responses
      const questionResponses = responses.map(r => ({
        survey_response_id: responseData.id,
        question_id: r.question_id,
        answer: r.answer,
        answered_at: r.answered_at || new Date().toISOString()
      }));

      const { error: answersError } = await supabase
        .from('survey_question_responses')
        .insert(questionResponses);

      if (answersError) throw answersError;

      return { success: true, responseId: responseData.id };
    } catch (error) {
      console.error('Error saving survey response:', error);
      return { success: false };
    }
  }

  /**
   * Save partial survey progress
   */
  static async savePartialResponse(
    surveyId: string,
    responses: SurveyResponse[],
    currentQuestionIndex: number,
    userId?: string,
    guestToken?: string
  ): Promise<boolean> {
    try {
      // Check if partial response already exists
      let responseId: string;
      
      const query = userId 
        ? supabase.from('survey_responses').select('id').eq('survey_id', surveyId).eq('user_id', userId).eq('status', 'in_progress')
        : supabase.from('survey_responses').select('id').eq('survey_id', surveyId).eq('guest_token', guestToken).eq('status', 'in_progress');

      const { data: existing } = await query.single();

      if (existing) {
        responseId = existing.id;
        
        // Update existing response
        const { error: updateError } = await supabase
          .from('survey_responses')
          .update({
            current_question_index: currentQuestionIndex,
            updated_at: new Date().toISOString()
          })
          .eq('id', responseId);

        if (updateError) throw updateError;

        // Delete existing question responses
        await supabase
          .from('survey_question_responses')
          .delete()
          .eq('survey_response_id', responseId);
      } else {
        // Create new partial response
        const { data: newResponse, error: createError } = await supabase
          .from('survey_responses')
          .insert({
            survey_id: surveyId,
            user_id: userId,
            guest_token: guestToken,
            status: 'in_progress',
            current_question_index: currentQuestionIndex
          })
          .select()
          .single();

        if (createError) throw createError;
        responseId = newResponse.id;
      }

      // Save question responses
      const questionResponses = responses.map(r => ({
        survey_response_id: responseId,
        question_id: r.question_id,
        answer: r.answer,
        answered_at: r.answered_at || new Date().toISOString()
      }));

      const { error: answersError } = await supabase
        .from('survey_question_responses')
        .insert(questionResponses);

      if (answersError) throw answersError;

      return true;
    } catch (error) {
      console.error('Error saving partial response:', error);
      return false;
    }
  }

  /**
   * Load partial survey response
   */
  static async loadPartialResponse(
    surveyId: string,
    userId?: string,
    guestToken?: string
  ): Promise<{ responses: SurveyResponse[]; currentQuestionIndex: number } | null> {
    try {
      const query = userId 
        ? supabase.from('survey_responses').select('id, current_question_index').eq('survey_id', surveyId).eq('user_id', userId).eq('status', 'in_progress')
        : supabase.from('survey_responses').select('id, current_question_index').eq('survey_id', surveyId).eq('guest_token', guestToken).eq('status', 'in_progress');

      const { data: response, error } = await query.single();

      if (error || !response) return null;

      // Load question responses
      const { data: questionResponses } = await supabase
        .from('survey_question_responses')
        .select('*')
        .eq('survey_response_id', response.id);

      const responses: SurveyResponse[] = questionResponses?.map(qr => ({
        question_id: qr.question_id,
        answer: qr.answer,
        answered_at: qr.answered_at
      })) || [];

      return {
        responses,
        currentQuestionIndex: response.current_question_index || 0
      };
    } catch (error) {
      console.error('Error loading partial response:', error);
      return null;
    }
  }

  /**
   * Get survey incentive details
   */
  static async getSurveyIncentive(surveyId: string): Promise<SurveyIncentive | null> {
    try {
      const { data, error } = await supabase
        .from('survey_incentives')
        .select('*')
        .eq('survey_id', surveyId)
        .eq('enabled', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching survey incentive:', error);
      return null;
    }
  }

  /**
   * Claim survey rewards
   */
  static async claimSurveyRewards(
    surveyResponseId: string,
    userId?: string,
    guestToken?: string
  ): Promise<ClaimSurveyRewardsResponse> {
    try {
      const { data, error } = await supabase.rpc('claim_survey_rewards', {
        p_survey_response_id: surveyResponseId,
        p_user_id: userId,
        p_guest_token: guestToken
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error claiming survey rewards:', error);
      return {
        success: false,
        messages: ['Failed to claim rewards'],
        raffle_entries: [],
        credits_awarded: [],
        discount_codes: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get unclaimed rewards for user
   */
  static async getUnclaimedRewards(
    userId?: string,
    guestToken?: string
  ): Promise<any[]> {
    try {
      const query = userId
        ? supabase.from('reward_fulfillments').select('*').eq('user_id', userId).is('claimed_at', null)
        : supabase.from('reward_fulfillments').select('*').eq('guest_token', guestToken).is('claimed_at', null);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unclaimed rewards:', error);
      return [];
    }
  }
} 