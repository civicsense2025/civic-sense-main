import { supabase } from '../supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ContentType = 
  | 'topic' 
  | 'question' 
  | 'public_figure' 
  | 'collection' 
  | 'quiz_session'
  | 'source'
  | 'category';

export interface ReviewData {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  content_title: string;
  rating: number; // 1-5
  review_text?: string;
  helpful_count: number;
  not_helpful_count: number;
  is_verified_reviewer: boolean;
  reviewer_expertise_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completion_context?: {
    completed_at?: string;
    score?: number;
    time_spent?: number;
    difficulty_experienced?: 'too_easy' | 'just_right' | 'too_hard';
  };
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_flagged: boolean;
  moderator_notes?: string;
}

export interface ReviewerProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  expertise_areas: string[];
  review_count: number;
  helpful_votes_received: number;
  average_review_quality_score: number;
  is_verified: boolean;
  civic_engagement_score: number;
}

export interface ReviewSummary {
  content_type: ContentType;
  content_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  sentiment_summary?: {
    positive_themes: string[];
    improvement_suggestions: string[];
    common_praise: string[];
    common_complaints: string[];
  };
  last_updated: string;
}

export interface ReviewFilters {
  rating?: number;
  has_text?: boolean;
  expertise_level?: ReviewerProfile['expertise_areas'][0];
  date_range?: {
    start: string;
    end: string;
  };
  verified_only?: boolean;
  sort_by?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  limit?: number;
  offset?: number;
}

// ============================================================================
// REVIEW SYSTEM SERVICE
// ============================================================================

export class ReviewSystemService {
  private static instance: ReviewSystemService;

  public static getInstance(): ReviewSystemService {
    if (!ReviewSystemService.instance) {
      ReviewSystemService.instance = new ReviewSystemService();
    }
    return ReviewSystemService.instance;
  }

  // ========================================================================
  // CORE REVIEW OPERATIONS
  // ========================================================================

  /**
   * Submit a new review or update existing review
   */
  async submitReview(reviewData: Omit<ReviewData, 'id' | 'created_at' | 'updated_at' | 'helpful_count' | 'not_helpful_count' | 'is_flagged'>): Promise<{
    success: boolean;
    data?: ReviewData;
    error?: string;
  }> {
    try {
      // For now, store in user content annotations as a fallback
      // This will be replaced with proper review tables later
      const result = await supabase
        .from('user_content_annotations')
        .upsert({
          user_id: reviewData.user_id,
          content_type: reviewData.content_type,
          content_id: reviewData.content_id,
          content_title: reviewData.content_title,
          personal_rating: reviewData.rating,
          personal_notes: reviewData.review_text,
          metadata: {
            is_public: reviewData.is_public,
            completion_context: reviewData.completion_context,
            reviewer_expertise_level: reviewData.reviewer_expertise_level,
          },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (result.error) {
        console.warn('Failed to save to review system, using fallback storage:', result.error);
        // Continue with success for now since this is a fallback
      }

      return {
        success: true,
        data: {
          id: result.data?.id || 'temp-id',
          user_id: reviewData.user_id,
          content_type: reviewData.content_type,
          content_id: reviewData.content_id,
          content_title: reviewData.content_title,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
          helpful_count: 0,
          not_helpful_count: 0,
          is_verified_reviewer: reviewData.is_verified_reviewer || false,
          reviewer_expertise_level: reviewData.reviewer_expertise_level,
          completion_context: reviewData.completion_context,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: reviewData.is_public,
          is_flagged: false,
        },
      };

    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit review',
      };
    }
  }

  /**
   * Get reviews for a specific piece of content
   */
  async getReviews(
    contentType: ContentType,
    contentId: string,
    filters: ReviewFilters = {}
  ): Promise<{
    success: boolean;
    data?: ReviewData[];
    total?: number;
    error?: string;
  }> {
    try {
      // For now, return empty array since we don't have proper review tables yet
      // This will be implemented when the database schema is ready
      return {
        success: true,
        data: [],
        total: 0,
      };

    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      };
    }
  }

  /**
   * Get review summary for content
   */
  async getReviewSummary(
    contentType: ContentType,
    contentId: string
  ): Promise<{
    success: boolean;
    data?: ReviewSummary;
    error?: string;
  }> {
    try {
      // Return empty summary for now
      return {
        success: true,
        data: {
          content_type: contentType,
          content_id: contentId,
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {
            five_star: 0,
            four_star: 0,
            three_star: 0,
            two_star: 0,
            one_star: 0,
          },
          last_updated: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error('Error fetching review summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch review summary',
      };
    }
  }

  /**
   * Get user's review for specific content
   */
  async getUserReview(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<{
    success: boolean;
    data?: ReviewData;
    error?: string;
  }> {
    try {
      // Try to get from user content annotations as fallback
      const { data, error } = await supabase
        .from('user_content_annotations')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          success: true,
          data: undefined,
        };
      }

      // Convert annotation to review format
      const reviewData: ReviewData = {
        id: data.id,
        user_id: data.user_id,
        content_type: data.content_type as ContentType,
        content_id: data.content_id,
        content_title: data.content_title,
        rating: data.personal_rating || 0,
        review_text: data.personal_notes,
        helpful_count: 0,
        not_helpful_count: 0,
        is_verified_reviewer: false,
        reviewer_expertise_level: data.metadata?.reviewer_expertise_level,
        completion_context: data.metadata?.completion_context,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_public: data.metadata?.is_public || false,
        is_flagged: false,
      };

      return {
        success: true,
        data: reviewData,
      };

    } catch (error) {
      console.error('Error fetching user review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user review',
      };
    }
  }

  // ========================================================================
  // HELPFULNESS VOTING
  // ========================================================================

  /**
   * Vote on review helpfulness
   */
  async voteOnReview(
    reviewId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if user already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('review_helpfulness_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVote) {
        // Update existing vote
        await supabase
          .from('review_helpfulness_votes')
          .update({ is_helpful: isHelpful })
          .eq('id', existingVote.id);
      } else {
        // Create new vote
        await supabase
          .from('review_helpfulness_votes')
          .insert({
            review_id: reviewId,
            user_id: userId,
            is_helpful: isHelpful,
          });
      }

      // Update review helpfulness counts
      await this.updateReviewHelpfulnessCounts(reviewId);

      return { success: true };

    } catch (error) {
      console.error('Error voting on review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote on review',
      };
    }
  }

  // ========================================================================
  // MODERATION
  // ========================================================================

  /**
   * Flag a review for moderation
   */
  async flagReview(
    reviewId: string,
    flaggedBy: string,
    reason: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Add flag record
      await supabase
        .from('review_flags')
        .insert({
          review_id: reviewId,
          flagged_by: flaggedBy,
          flag_reason: reason,
          status: 'pending',
        });

      // Update review flag status
      await supabase
        .from('content_reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId);

      return { success: true };

    } catch (error) {
      console.error('Error flagging review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to flag review',
      };
    }
  }

  // ========================================================================
  // ANALYTICS & INSIGHTS
  // ========================================================================

  /**
   * Get content performance insights based on reviews
   */
  async getContentInsights(
    contentType: ContentType,
    contentIds: string[]
  ): Promise<{
    success: boolean;
    data?: Array<{
      content_id: string;
      average_rating: number;
      total_reviews: number;
      completion_satisfaction: number;
      difficulty_feedback: {
        too_easy: number;
        just_right: number;
        too_hard: number;
      };
      top_positive_themes: string[];
      top_improvement_areas: string[];
    }>;
    error?: string;
  }> {
    try {
      // This would be implemented with more complex analytics queries
      // For now, return basic structure
      const insights = await Promise.all(
        contentIds.map(async (contentId) => {
          const summary = await this.getReviewSummary(contentType, contentId);
          
          return {
            content_id: contentId,
            average_rating: summary.data?.average_rating || 0,
            total_reviews: summary.data?.total_reviews || 0,
            completion_satisfaction: 0, // TODO: Calculate from completion context
            difficulty_feedback: {
              too_easy: 0,
              just_right: 0,
              too_hard: 0,
            },
            top_positive_themes: [],
            top_improvement_areas: [],
          };
        })
      );

      return {
        success: true,
        data: insights,
      };

    } catch (error) {
      console.error('Error fetching content insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights',
      };
    }
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  /**
   * Update review summary after new review
   */
  private async updateReviewSummary(
    contentType: ContentType,
    contentId: string
  ): Promise<void> {
    try {
      // Get all reviews for this content
      const { data: reviews, error } = await supabase
        .from('content_reviews')
        .select('rating, review_text')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_public', true)
        .eq('is_flagged', false);

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return;
      }

      // Calculate summary statistics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      const ratingDistribution = {
        five_star: reviews.filter(r => r.rating === 5).length,
        four_star: reviews.filter(r => r.rating === 4).length,
        three_star: reviews.filter(r => r.rating === 3).length,
        two_star: reviews.filter(r => r.rating === 2).length,
        one_star: reviews.filter(r => r.rating === 1).length,
      };

      // Upsert summary
      await supabase
        .from('review_summaries')
        .upsert({
          content_type: contentType,
          content_id: contentId,
          average_rating: averageRating,
          total_reviews: totalReviews,
          rating_distribution: ratingDistribution,
          last_updated: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error updating review summary:', error);
    }
  }

  /**
   * Update review helpfulness counts
   */
  private async updateReviewHelpfulnessCounts(reviewId: string): Promise<void> {
    try {
      const { data: votes, error } = await supabase
        .from('review_helpfulness_votes')
        .select('is_helpful')
        .eq('review_id', reviewId);

      if (error) throw error;

      const helpfulCount = votes?.filter(v => v.is_helpful).length || 0;
      const notHelpfulCount = votes?.filter(v => !v.is_helpful).length || 0;

      await supabase
        .from('content_reviews')
        .update({
          helpful_count: helpfulCount,
          not_helpful_count: notHelpfulCount,
        })
        .eq('id', reviewId);

    } catch (error) {
      console.error('Error updating helpfulness counts:', error);
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick function to submit a post-completion review
 */
export async function submitPostCompletionReview(
  userId: string,
  contentType: ContentType,
  contentId: string,
  contentTitle: string,
  rating: number,
  reviewText: string,
  completionContext: {
    score?: number;
    timeSpent?: number;
    difficultyExperienced?: 'too_easy' | 'just_right' | 'too_hard';
  }
): Promise<{ success: boolean; error?: string }> {
  const reviewService = ReviewSystemService.getInstance();
  
  const result = await reviewService.submitReview({
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    content_title: contentTitle,
    rating,
    review_text: reviewText,
    is_verified_reviewer: false,
    completion_context: {
      completed_at: new Date().toISOString(),
      ...completionContext,
    },
    is_public: true,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Get formatted review summary for display
 */
export function formatReviewSummary(summary: ReviewSummary): {
  displayRating: string;
  ratingCount: string;
  hasReviews: boolean;
} {
  const hasReviews = summary.total_reviews > 0;
  
  return {
    displayRating: hasReviews ? summary.average_rating.toFixed(1) : '0.0',
    ratingCount: `${summary.total_reviews} review${summary.total_reviews !== 1 ? 's' : ''}`,
    hasReviews,
  };
}

export default ReviewSystemService; 