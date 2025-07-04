import { contentCacheService } from './content-cache-service';
import { 
  StandardTopic, 
  StandardQuestion, 
  StandardCategory 
} from './standardized-data-service';

/**
 * Cached Data Wrapper
 * 
 * This provides a simple interface to access cached data for common operations.
 * It acts as a drop-in replacement for direct API calls, automatically falling
 * back to network requests if cache misses occur.
 */

export class CachedDataWrapper {
  private static instance: CachedDataWrapper;

  static getInstance(): CachedDataWrapper {
    if (!this.instance) {
      this.instance = new CachedDataWrapper();
    }
    return this.instance;
  }

  // ============================================================================
  // CATEGORY OPERATIONS
  // ============================================================================

  async getCategories(): Promise<StandardCategory[]> {
    console.log('📂 Getting categories (cache-first)');
    return contentCacheService.getAllCategories();
  }

  // ============================================================================
  // TOPIC OPERATIONS
  // ============================================================================

  async getAllTopics(): Promise<StandardTopic[]> {
    console.log('📚 Getting all topics (cache-first)');
    return contentCacheService.getAllTopics();
  }

  async getTopicsForCategory(categoryId: string): Promise<StandardTopic[]> {
    console.log(`📚 Getting topics for category ${categoryId} (cache-first)`);
    return contentCacheService.getTopicsForCategory(categoryId);
  }

  // ============================================================================
  // QUESTION OPERATIONS
  // ============================================================================

  async getAllQuestions(): Promise<StandardQuestion[]> {
    console.log('❓ Getting all questions (cache-first)');
    return contentCacheService.getAllQuestions();
  }

  async getQuestionsForTopic(topicId: string): Promise<StandardQuestion[]> {
    console.log(`❓ Getting questions for topic ${topicId} (cache-first)`);
    return contentCacheService.getQuestionsForTopic(topicId);
  }

  async getRandomQuestionsForTopic(
    topicId: string, 
    limit: number = 10
  ): Promise<StandardQuestion[]> {
    const allQuestions = await this.getQuestionsForTopic(topicId);
    
    // Shuffle array and take first 'limit' items
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async getCacheStats() {
    return contentCacheService.getCacheStats();
  }

  async clearCache() {
    console.log('🗑️ Clearing content cache');
    return contentCacheService.clearContentCache();
  }

  async refreshCache() {
    console.log('🔄 Refreshing content cache');
    await this.clearCache();
    return contentCacheService.initializeContentCache();
  }

  // ============================================================================
  // CONVENIENCE METHODS FOR COMMON UI PATTERNS
  // ============================================================================

  async getCategoriesWithTopicCounts(): Promise<Array<StandardCategory & { topicCount: number }>> {
    const [categories, allTopics] = await Promise.all([
      this.getCategories(),
      this.getAllTopics()
    ]);

    return categories.map(category => {
      const topicCount = allTopics.filter(topic => 
        topic.categories.includes(category.id)
      ).length;

      return {
        ...category,
        topicCount
      };
    });
  }

  async getTopicsWithQuestionCounts(): Promise<Array<StandardTopic & { questionCount: number }>> {
    const [topics, allQuestions] = await Promise.all([
      this.getAllTopics(),
      this.getAllQuestions()
    ]);

    return topics.map(topic => {
      const questionCount = allQuestions.filter(q => q.topic_id === topic.topic_id).length;

      return {
        ...topic,
        questionCount
      };
    });
  }

  async searchQuestions(searchTerm: string): Promise<StandardQuestion[]> {
    const allQuestions = await this.getAllQuestions();
    const lowerSearch = searchTerm.toLowerCase();

    return allQuestions.filter(question => 
      question.question.toLowerCase().includes(lowerSearch) ||
      question.explanation?.toLowerCase().includes(lowerSearch) ||
      question.options.some(option => option.toLowerCase().includes(lowerSearch))
    );
  }

  async getQuestionsByDifficulty(
    difficulty: number, 
    limit?: number
  ): Promise<StandardQuestion[]> {
    const allQuestions = await this.getAllQuestions();
    const filtered = allQuestions.filter(q => q.difficulty_level === difficulty);
    
    return limit ? filtered.slice(0, limit) : filtered;
  }
}

// Export singleton instance
export const cachedData = CachedDataWrapper.getInstance();

// Export convenience functions for easy import
export const {
  getCategories,
  getAllTopics,
  getTopicsForCategory,
  getAllQuestions,
  getQuestionsForTopic,
  getRandomQuestionsForTopic,
  getCacheStats,
  clearCache,
  refreshCache,
  getCategoriesWithTopicCounts,
  getTopicsWithQuestionCounts,
  searchQuestions,
  getQuestionsByDifficulty
} = cachedData; 