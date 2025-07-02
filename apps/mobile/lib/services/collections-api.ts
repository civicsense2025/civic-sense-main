import { Collection, UserCollectionProgress } from '../../types/collections'
import { LessonStep } from '../../types/lesson-steps'

// Environment configuration
// NOTE: For React Native/Expo, localhost won't work on devices/simulators
// Use one of these instead:
// - iOS Simulator: Your computer's IP address (e.g., http://192.168.1.100:3000)
// - Android Emulator: http://10.0.2.2:3000 (special alias for host machine)
// - Physical Device: Your computer's IP address on local network
// - Tunnel: Use ngrok or similar (e.g., https://abc123.ngrok.io)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.151:3000'

// Helper function to detect localhost and provide helpful error messages
function validateApiBaseUrl(url: string): { isValid: boolean; message?: string } {
  // Check if URL uses localhost or 127.0.0.1 (which won't work on mobile devices)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return {
      isValid: false,
      message: `
❌ Network Configuration Issue:
API URL is set to "${url}" which won't work on mobile devices.

📱 Solutions:
1. Find your computer's IP address:
   - macOS/Linux: Run 'ifconfig' and look for inet address
   - Windows: Run 'ipconfig' and look for IPv4 address
   
2. Set environment variable in your .env file:
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP_ADDRESS:3000
   
3. For Android Emulator specifically:
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
   
4. Or use a tunnel service like ngrok:
   npx ngrok http 3000
   Then use the https URL provided

🔧 Quick Fix:
Create apps/mobile/.env with:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XXX:3000
(Replace XXX with your actual IP)
      `.trim()
    }
  }
  return { isValid: true }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: boolean;
}

interface CollectionsListResponse {
  collections: Collection[];
  total: number;
}

interface CollectionDetailsResponse {
  collection: Collection;
}

interface CollectionStepsResponse {
  steps: LessonStep[];
  total: number;
  collection: {
    id: string;
    title: string;
  };
}

// Add auth token to requests
async function getAuthHeaders(): Promise<HeadersInit> {
  // This would get the auth token from secure storage
  // For now, we'll implement basic headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // TODO: Add authentication token when available
  // const token = await getStoredAuthToken()
  // if (token) {
  //   headers.Authorization = `Bearer ${token}`
  // }
  
  return headers
}

// Handle API response errors
async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}

/**
 * Educational Content Collections API Service
 * 
 * ⚠️  IMPORTANT: This handles EDUCATIONAL CONTENT collections (courses/lessons)
 * NOT user bookmark collections or user content collections.
 * 
 * Different Collection Types in CivicSense:
 * 1. Educational Collections (this service) - Course-like content created by admins
 * 2. Bookmark Collections - User-created collections for organizing bookmarks  
 * 3. User Content Collections - User annotations and personal organization
 */
class EducationalCollectionsApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      // Validate API base URL and provide helpful error message
      const urlValidation = validateApiBaseUrl(API_BASE_URL)
      if (!urlValidation.isValid) {
        console.error(urlValidation.message)
        throw new Error('Invalid API configuration - see console for details')
      }

      console.log(`📡 Educational Collections API Request: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Educational Collections API Success: ${endpoint}`);
      
      return {
        success: true,
        data: data,
        fallback: data.fallback || false
      };
    } catch (error) {
      console.error(`❌ Educational Collections API Error: ${endpoint}`, error);
      
      // Provide specific error message for network failures
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        const message = `Network Error: Cannot reach ${API_BASE_URL}. See console for configuration help.`
        console.error(validateApiBaseUrl(API_BASE_URL).message || message)
        return {
          success: false,
          error: message
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch list of educational content collections with filtering
   */
  async getEducationalCollections(params?: {
    category?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
  }): Promise<ApiResponse<CollectionsListResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params?.category && params.category !== 'all') {
      // Fix: Use 'category' parameter name instead of 'categories' to match API
      searchParams.append('category', params.category);
    }
    if (params?.difficulty && params.difficulty !== 'all') {
      searchParams.append('difficulty', params.difficulty);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    // Use correct endpoint for collections
    const endpoint = `/api/collections${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<CollectionsListResponse>(endpoint);
  }

  /**
   * Fetch a specific educational collection by slug
   */
  async getEducationalCollectionBySlug(slug: string): Promise<ApiResponse<CollectionDetailsResponse>> {
    return this.makeRequest<CollectionDetailsResponse>(`/api/collections/${slug}`);
  }

  /**
   * Fetch lesson steps for an educational collection
   */
  async getEducationalCollectionSteps(slug: string): Promise<ApiResponse<CollectionStepsResponse>> {
    return this.makeRequest<CollectionStepsResponse>(`/api/collections/${slug}/steps`);
  }

  // Legacy method names for backward compatibility
  async getCollections(params?: any): Promise<ApiResponse<CollectionsListResponse>> {
    console.warn('⚠️  Using deprecated getCollections(). Use getEducationalCollections() instead.');
    return this.getEducationalCollections(params);
  }

  async getCollectionBySlug(slug: string): Promise<ApiResponse<CollectionDetailsResponse>> {
    console.warn('⚠️  Using deprecated getCollectionBySlug(). Use getEducationalCollectionBySlug() instead.');
    return this.getEducationalCollectionBySlug(slug);
  }

  async getCollectionSteps(slug: string): Promise<ApiResponse<CollectionStepsResponse>> {
    console.warn('⚠️  Using deprecated getCollectionSteps(). Use getEducationalCollectionSteps() instead.');
    return this.getEducationalCollectionSteps(slug);
  }

  /**
   * Get user's progress for all steps in a collection
   */
  async getStepsProgress(slug: string): Promise<{
    step_progress: any[]
    collection_progress: any
    total_steps: number
  }> {
    const url = `${API_BASE_URL}/api/collections/${slug}/steps/progress`
    const headers = await getAuthHeaders()
    
    const response = await fetch(url, { 
      headers,
    })
    return handleApiResponse(response)
  }

  /**
   * Get user's overall progress for a collection
   */
  async getCollectionProgress(collectionId: string, userId?: string): Promise<ApiResponse<UserCollectionProgress>> {
    if (!userId) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }
    
    return this.makeRequest<UserCollectionProgress>(`/api/collections/${collectionId}/progress?userId=${userId}`);
  }

  /**
   * Update user's collection progress
   */
  async updateCollectionProgress(
    slug: string,
    progressData: {
      item_id?: string
      action: 'complete' | 'start' | 'view'
      time_spent?: number
      score?: number
      metadata?: any
    }
  ): Promise<any> {
    const url = `${API_BASE_URL}/api/collections/${slug}/progress`
    const headers = await getAuthHeaders()
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(progressData),
    })
    
    return handleApiResponse(response)
  }

  /**
   * Get featured collections (mobile-optimized)
   */
  async getFeaturedCollections(limit = 5): Promise<ApiResponse<CollectionsListResponse>> {
    return this.getEducationalCollections({ limit });
  }

  /**
   * Search collections (mobile-optimized)
   */
  async searchCollections(query: string, filters?: {
    category?: string;
    difficulty?: string;
  }): Promise<ApiResponse<CollectionsListResponse>> {
    return this.getEducationalCollections({
      search: query,
      ...filters
    });
  }

  /**
   * Get collections by category (mobile-optimized)
   */
  async getCollectionsByCategory(category: string): Promise<Collection[]> {
    const result = await this.getEducationalCollections({
      category: category,
      limit: 50
    });
    
    if (result.success && result.data) {
      return result.data.collections;
    }
    return [];
  }

  /**
   * Get collections by difficulty (mobile-optimized)
   */
  async getCollectionsByDifficulty(difficulty: string): Promise<Collection[]> {
    const result = await this.getEducationalCollections({
      difficulty: difficulty,
      limit: 50
    });
    
    if (result.success && result.data) {
      return result.data.collections;
    }
    return [];
  }

  // Update user progress for a collection step
  async updateStepProgress(
    collectionId: string, 
    stepId: string, 
    progress: { completed: boolean; timeSpent?: number; score?: number },
    userId?: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    if (!userId) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    return this.makeRequest<{ success: boolean }>(`/api/collections/${collectionId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        stepId,
        userId,
        ...progress
      })
    });
  }
}

// Export singleton instance with clear naming
export const educationalCollectionsApi = new EducationalCollectionsApiService();
export const collectionsApi = educationalCollectionsApi; // Legacy export
export default educationalCollectionsApi; 