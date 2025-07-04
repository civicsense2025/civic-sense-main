/**
 * Optimized Auth Cache Service
 * 
 * Prevents excessive authentication calls by implementing:
 * - Aggressive session caching
 * - Request deduplication 
 * - Debounced session checks
 * - Singleton pattern to prevent multiple instances
 */

import { Session, User } from '@supabase/supabase-js';
import { ensureSupabaseInitialized } from './supabase';

interface CachedAuthData {
  session: Session | null;
  user: User | null;
  timestamp: number;
  expiresAt?: number | undefined;
}

interface AuthCacheConfig {
  /** Cache TTL in milliseconds (default: 30 seconds) */
  cacheTTL: number;
  /** Max retries for failed requests (default: 2) */
  maxRetries: number;
  /** Debounce time for rapid successive calls (default: 100ms) */
  debounceMs: number;
}

class OptimizedAuthCache {
  private cache: CachedAuthData | null = null;
  private pendingRequest: Promise<CachedAuthData> | null = null;
  private debounceTimer: number | null = null;
  private config: AuthCacheConfig;
  private lastRequestTime = 0;
  private requestCount = 0;

  constructor(config: Partial<AuthCacheConfig> = {}) {
    this.config = {
      cacheTTL: 30000, // 30 seconds default cache
      maxRetries: 2,
      debounceMs: 100,
      ...config,
    };
  }

  /**
   * Get cached session or fetch from Supabase with aggressive optimization
   */
  async getSession(): Promise<{ session: Session | null; user: User | null; error: any }> {
    const now = Date.now();
    this.requestCount++;

    // 1. Check if we have valid cached data
    if (this.cache && this.isCacheValid()) {
      return {
        session: this.cache.session,
        user: this.cache.user,
        error: null,
      };
    }

    // 2. Deduplicate concurrent requests
    if (this.pendingRequest) {
      const result = await this.pendingRequest;
      return {
        session: result.session,
        user: result.user,
        error: null,
      };
    }

    // 3. Debounce rapid successive calls
    if (now - this.lastRequestTime < this.config.debounceMs) {
      return new Promise((resolve) => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(async () => {
          const result = await this.getSession();
          resolve(result);
        }, this.config.debounceMs);
      });
    }

    this.lastRequestTime = now;

    // 4. Create deduplication promise
    this.pendingRequest = this.fetchSessionWithRetry();

    try {
      const result = await this.pendingRequest;
      return {
        session: result.session,
        user: result.user,
        error: null,
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error,
      };
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Fetch session with retry logic and caching
   */
  private async fetchSessionWithRetry(retryCount = 0): Promise<CachedAuthData> {
    try {
      // Get singleton instance
      const supabase = await ensureSupabaseInitialized();
      const { data, error } = await supabase.auth.getSession();

      if (error && retryCount < this.config.maxRetries) {
        // Exponential backoff for retries
        const delay = Math.pow(2, retryCount) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchSessionWithRetry(retryCount + 1);
      }

      if (error) {
        throw error;
      }

      const now = Date.now();
      const result: CachedAuthData = {
        session: data.session,
        user: data.session?.user || null,
        timestamp: now,
        expiresAt: data.session?.expires_at ? data.session.expires_at * 1000 : undefined,
      };

      // Cache the result
      this.cache = result;

      return result;
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        const delay = Math.pow(2, retryCount) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchSessionWithRetry(retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;

    const now = Date.now();
    
    // Check TTL expiry
    if (now - this.cache.timestamp > this.config.cacheTTL) {
      return false;
    }

    // Check session expiry if available
    if (this.cache.expiresAt && now > this.cache.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Manually invalidate the cache
   */
  invalidateCache(): void {
    this.cache = null;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Update cache with new session data (for auth state changes)
   */
  updateCache(session: Session | null, user: User | null = null): void {
    const now = Date.now();
    this.cache = {
      session,
      user: user || session?.user || null,
      timestamp: now,
      expiresAt: session?.expires_at ? session.expires_at * 1000 : undefined,
    };
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      isCached: !!this.cache,
      isValid: this.isCacheValid(),
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      cacheTimestamp: this.cache?.timestamp,
      cacheAge: this.cache ? Date.now() - this.cache.timestamp : null,
    };
  }

  /**
   * Configure cache settings
   */
  configure(newConfig: Partial<AuthCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const authCache = new OptimizedAuthCache({
  cacheTTL: 30000, // 30 seconds cache for aggressive optimization
  maxRetries: 2,
  debounceMs: 50, // Very short debounce for rapid calls
});

// Export class for custom instances if needed
export { OptimizedAuthCache };

// Helper functions for auth cache management
export const authCacheHelpers = {
  /**
   * Get session with optimized caching
   */
  getSession: () => authCache.getSession(),

  /**
   * Invalidate cache (use when signing out)
   */
  invalidate: () => authCache.invalidateCache(),

  /**
   * Update cache with new auth data (use in auth state change listeners)
   */
  update: (session: Session | null, user?: User | null) => authCache.updateCache(session, user),

  /**
   * Get cache performance statistics
   */
  getStats: () => authCache.getCacheStats(),

  /**
   * Configure cache behavior
   */
  configure: (config: Partial<AuthCacheConfig>) => authCache.configure(config),
}; 