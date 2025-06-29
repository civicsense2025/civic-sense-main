/**
 * CivicSense Mobile Image Generator
 * Integrates with the dynamic image generation API for social sharing
 */

// Base URL for the image generation API
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://civicsense.com';

export interface ImageGenerationParams {
  template: 'quiz-thumbnail' | 'instagram-story' | 'instagram-post' | 'twitter-card' | 'facebook-post' | 'linkedin-post';
  title: string;
  description?: string;
  score?: number;
  totalQuestions?: number;
  emoji?: string;
  type?: 'quiz' | 'result' | 'topic' | 'achievement' | 'streak';
  userName?: string;
  badge?: string;
  streakCount?: number;
}

export interface TopicImageParams {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export interface ResultImageParams extends TopicImageParams {
  score: number;
  totalQuestions: number;
  correctAnswers?: number;
  userName?: string;
  completedAt?: string;
}

export interface StreakImageParams {
  streakCount: number;
  currentTopic?: TopicImageParams;
  userName?: string;
}

export interface AchievementImageParams {
  title: string;
  description?: string;
  emoji?: string;
  userName?: string;
  unlockedAt?: string;
}

/**
 * Generates a dynamic image URL for the given parameters
 */
export function generateImageUrl(params: ImageGenerationParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return `${API_BASE_URL}/api/generate-image?${searchParams.toString()}`;
}

/**
 * Generate Instagram Story image for quiz topic sharing
 */
export function generateTopicInstagramStory(topic: TopicImageParams): string {
  return generateImageUrl({
    template: 'instagram-story',
    title: topic.title,
    description: topic.description,
    emoji: topic.emoji,
    type: 'topic',
    badge: topic.isBreaking ? 'Breaking' : topic.isFeatured ? 'Featured' : undefined,
  });
}

/**
 * Generate Instagram Story image for quiz completion
 */
export function generateCompletionInstagramStory(result: ResultImageParams): string {
  return generateImageUrl({
    template: 'instagram-story',
    title: result.title,
    score: result.score,
    totalQuestions: result.totalQuestions,
    emoji: result.emoji,
    type: 'result',
    userName: result.userName,
  });
}

/**
 * Generate Instagram Story image for streak achievement
 */
export function generateStreakInstagramStory(streak: StreakImageParams): string {
  return generateImageUrl({
    template: 'instagram-story',
    title: `${streak.streakCount}-Day Civic Learning Streak!`,
    description: 'Building democratic knowledge one day at a time',
    emoji: '🔥',
    type: 'streak',
    streakCount: streak.streakCount,
    userName: streak.userName,
  });
}

/**
 * Generate Instagram Story image for achievement unlock
 */
export function generateAchievementInstagramStory(achievement: AchievementImageParams): string {
  return generateImageUrl({
    template: 'instagram-story',
    title: achievement.title,
    description: achievement.description,
    emoji: achievement.emoji || '⭐',
    type: 'achievement',
    userName: achievement.userName,
  });
}

/**
 * Generate Instagram Post (square) image
 */
export function generateInstagramPost(params: Omit<ImageGenerationParams, 'template'>): string {
  return generateImageUrl({
    ...params,
    template: 'instagram-post',
  });
}

/**
 * Generate quiz thumbnail for general sharing
 */
export function generateQuizThumbnail(params: Omit<ImageGenerationParams, 'template'>): string {
  return generateImageUrl({
    ...params,
    template: 'quiz-thumbnail',
  });
}

/**
 * Generate a complete set of images for all platforms
 */
export function generateImageSet(params: Omit<ImageGenerationParams, 'template'>) {
  const templates = [
    'quiz-thumbnail',
    'instagram-story', 
    'instagram-post',
    'twitter-card',
    'facebook-post',
    'linkedin-post'
  ] as const;
  
  return templates.reduce((acc, template) => {
    acc[template] = generateImageUrl({ ...params, template });
    return acc;
  }, {} as Record<typeof templates[number], string>);
}

/**
 * Get optimal image dimensions for each template
 */
export const IMAGE_DIMENSIONS = {
  'quiz-thumbnail': { width: 1200, height: 630 },
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-post': { width: 1080, height: 1080 },
  'twitter-card': { width: 1200, height: 675 },
  'facebook-post': { width: 1200, height: 630 },
  'linkedin-post': { width: 1200, height: 627 },
} as const;

/**
 * Check if an image URL is valid (basic validation)
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname === '/api/generate-image' && urlObj.searchParams.has('template');
  } catch {
    return false;
  }
}

/**
 * Generate fallback text when image generation fails
 */
export function generateFallbackText(params: ImageGenerationParams): string {
  switch (params.type) {
    case 'result':
      return `🎉 I scored ${params.score}% on the "${params.title}" quiz!\n\nDiscover how power actually works in America with CivicSense.`;
    
    case 'streak':
      return `🔥 ${params.streakCount}-day civic learning streak!\n\nBuilding democratic knowledge one day at a time with CivicSense.`;
    
    case 'achievement':
      return `⭐ New achievement unlocked: "${params.title}"\n\nDemocracy in action! Keep learning about how power works.`;
    
    default: // 'topic' or 'quiz'
      return `📚 Check out "${params.title}" on CivicSense!\n\n${params.description || 'Discover how power actually works in America.'}\n\nJoin the conversation about democracy and civic engagement.`;
  }
} 