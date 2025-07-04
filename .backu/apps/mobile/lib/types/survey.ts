export interface SurveyQuestion {
  id: string;
  type: 'multiple_choice' | 'multiple_select' | 'scale' | 'text' | 'textarea' | 
        'ranking' | 'likert' | 'matrix' | 'slider' | 'date' | 'email' | 'phone' | 
        'number' | 'dropdown' | 'image_choice' | 'file_upload' | 'rating_stars' | 
        'yes_no' | 'statement' | 'contact_info' | 'dynamic_content';
  question: string;
  description?: string;
  required?: boolean;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  max_selections?: number;
  max_rankings?: number;
  matrix_config?: {
    scale: {
      min: number;
      max: number;
      labels: { min: string; max: string };
    };
  };
  dynamic_config?: {
    contentType: 'quiz_question' | 'article' | 'topic' | 'custom';
    contentId?: string;
    apiEndpoint?: string;
    displayFields: string[];
    questionType: 'rating_stars' | 'scale' | 'text' | 'multiple_choice';
    questionPrompt: string;
    scaleConfig?: {
      min: number;
      max: number;
      labels: { min: string; max: string };
    };
  };
  conditional_logic?: {
    show_if: string;
    show_when: string | string[];
  };
  display_order?: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  created_at: string;
  status: 'draft' | 'active' | 'closed';
  allow_anonymous: boolean;
  allow_partial_responses: boolean;
  estimated_time?: number;
  post_completion_config?: {
    enabled: boolean;
    type: 'redirect' | 'content' | 'recommendations' | 'learning_path' | 'mixed';
    redirect_url?: string;
    redirect_delay?: number;
    title?: string;
    message?: string;
    show_recommendations?: boolean;
    show_learning_goals?: boolean;
    show_related_content?: boolean;
    custom_content?: string;
    cta_text?: string;
    cta_url?: string;
    show_stats?: boolean;
  };
}

export interface SurveyResponse {
  question_id: string;
  answer: string | string[] | number | Record<string, any>;
  answered_at: string;
}

export interface SurveyIncentive {
  id: string;
  survey_id: string;
  title: string;
  description?: string;
  incentive_types: ('raffle' | 'credits' | 'premium_access' | 'discount')[];
  enabled: boolean;
  completion_required: boolean;
  authenticated_only: boolean;
  max_rewards?: number;
  rewards_given: number;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  show_on_completion: boolean;
  raffle_config?: RaffleConfig;
  credits_config?: CreditsConfig;
  premium_config?: PremiumConfig;
  discount_config?: DiscountConfig;
}

export interface RaffleConfig {
  prize: string;
  prize_value?: string;
  total_winners: number;
  draw_date: string;
  description?: string;
}

export interface CreditsConfig {
  amount: number;
  currency: string;
  description?: string;
  expires_days?: number;
}

export interface PremiumConfig {
  tier: string;
  duration_months?: number;
  description?: string;
  features?: string[];
}

export interface DiscountConfig {
  percentage?: number;
  fixed_amount?: number;
  currency: string;
  description?: string;
  applies_to: string[];
  valid_days: number;
}

export interface RewardFulfillment {
  id: string;
  survey_response_id: string;
  survey_incentive_id: string;
  user_id?: string;
  guest_token?: string;
  fulfillment_type: string;
  fulfillment_data: any;
  fulfilled_at: string;
  expires_at?: string;
}

export interface IncentiveDisplayProps {
  incentive: SurveyIncentive;
  showDetails?: boolean;
  showClaimButton?: boolean;
  onClaim?: () => void;
  className?: string;
}

export interface ClaimSurveyRewardsResponse {
  success: boolean;
  messages: string[];
  raffle_entries: RaffleEntry[];
  credits_awarded: UserCredit[];
  discount_codes: DiscountCode[];
  premium_access_granted?: PremiumAccess;
  error?: string;
}

export interface RaffleEntry {
  id: string;
  ticket_code: string;
  entry_number: number;
}

export interface UserCredit {
  amount: number;
  currency: string;
  expires_at?: string;
}

export interface DiscountCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  currency: string;
  valid_until?: string;
}

export interface PremiumAccess {
  type: string;
  duration_months?: number;
  expires_at?: string;
} 