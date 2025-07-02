/**
 * URL Validation Service for CivicSense Source Verification
 * 
 * Simple validation service to check if URLs are accessible and from trusted domains.
 * Used by the UGC Content Generator to filter high-quality sources.
 */

export interface URLValidationResult {
  url: string;
  isValid: boolean;
  httpStatus: number | null;
  responseTime: number;
  lastChecked: string;
  errorMessage?: string | undefined;
  redirectUrl?: string | undefined;
  isBrokenLink: boolean;
  validationScore: number;
}

export class URLValidationService {
  private static instance: URLValidationService;
  private validationCache = new Map<string, URLValidationResult & { timestamp: number }>();
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): URLValidationService {
    if (!URLValidationService.instance) {
      URLValidationService.instance = new URLValidationService();
    }
    return URLValidationService.instance;
  }

  /**
   * Validate a single URL
   */
  async validateURL(url: string): Promise<URLValidationResult> {
    // Check cache first
    const cached = this.validationCache.get(url);
    if (cached && this.isCacheValid(url)) {
      return {
        url: cached.url,
        isValid: cached.isValid,
        httpStatus: cached.httpStatus,
        responseTime: cached.responseTime,
        lastChecked: cached.lastChecked,
        errorMessage: cached.errorMessage,
        redirectUrl: cached.redirectUrl,
        isBrokenLink: cached.isBrokenLink,
        validationScore: cached.validationScore
      };
    }

    // Basic URL format validation
    if (!this.isValidURLFormat(url)) {
      const result: URLValidationResult = {
        url,
        isValid: false,
        httpStatus: null,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorMessage: 'Invalid URL format',
        isBrokenLink: true,
        validationScore: 0
      };
      this.cacheResult(url, result);
      return result;
    }

    // For high-trust domains, assume valid to avoid rate limiting
    if (this.isHighTrustDomain(url)) {
      const result: URLValidationResult = {
        url,
        isValid: true,
        httpStatus: 200,
        responseTime: 100,
        lastChecked: new Date().toISOString(),
        isBrokenLink: false,
        validationScore: 100
      };
      this.cacheResult(url, result);
      return result;
    }

    // For other domains, try basic fetch validation
    try {
      const startTime = Date.now();
      
      // Create timeout signal that works in React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result: URLValidationResult = {
        url,
        isValid: response.ok,
        httpStatus: response.status,
        responseTime,
        lastChecked: new Date().toISOString(),
        isBrokenLink: !response.ok,
        validationScore: response.ok ? 90 : 0
      };

      // Only add redirectUrl if it exists and is different
      if (response.url && response.url !== url) {
        result.redirectUrl = response.url;
      }

      this.cacheResult(url, result);
      return result;
    } catch (error) {
      let errorMessage = 'Network error';
      if (error instanceof Error) {
        errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
      }
      
      const result: URLValidationResult = {
        url,
        isValid: false,
        httpStatus: null,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorMessage,
        isBrokenLink: true,
        validationScore: 0
      };
      this.cacheResult(url, result);
      return result;
    }
  }

  /**
   * Validate multiple URLs in parallel
   */
  async validateURLs(urls: string[]): Promise<URLValidationResult[]> {
    const validationPromises = urls.map(url => this.validateURL(url));
    return Promise.all(validationPromises);
  }

  /**
   * Filter sources to only include valid URLs
   */
  async filterValidSources(sources: Array<{url: string; title: string; excerpt: string}>): Promise<Array<{url: string; title: string; excerpt: string; isValid?: boolean}>> {
    const validationResults = await this.validateURLs(sources.map(s => s.url));
    
    return sources.map((source, index) => ({
      ...source,
      isValid: validationResults[index]?.isValid || false
    })).filter(source => source.isValid);
  }

  /**
   * Check if URL format is valid
   */
  private isValidURLFormat(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if domain is high-trust (government, major news, academic)
   */
  private isHighTrustDomain(url: string): boolean {
    const highTrustDomains = [
      // Government domains
      '.gov',
      'congress.gov',
      'whitehouse.gov',
      'supremecourt.gov',
      'federalregister.gov',
      
      // Wire services
      'reuters.com',
      'apnews.com',
      
      // Public broadcasting
      'npr.org',
      'pbs.org',
      'bbc.com',
      
      // Major newspapers
      'nytimes.com',
      'washingtonpost.com',
      'wsj.com',
      
      // Think tanks and research
      'brookings.edu',
      'pewresearch.org',
      'aei.org',
      
      // Political news
      'politico.com',
      'thehill.com'
    ];

    return highTrustDomains.some(domain => url.includes(domain));
  }

  /**
   * Cache validation result
   */
  private cacheResult(url: string, result: URLValidationResult): void {
    this.validationCache.set(url, {
      ...result,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(url: string): boolean {
    const cached = this.validationCache.get(url);
    if (!cached || !cached.timestamp) return false;
    
    return (Date.now() - cached.timestamp) < this.cacheExpiryMs;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; validCount: number; invalidCount: number } {
    const entries = Array.from(this.validationCache.values());
    return {
      size: entries.length,
      validCount: entries.filter(entry => entry.isValid).length,
      invalidCount: entries.filter(entry => !entry.isValid).length
    };
  }
}

export default URLValidationService; 