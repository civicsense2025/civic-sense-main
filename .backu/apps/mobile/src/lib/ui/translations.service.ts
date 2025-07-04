// CivicSense Mobile Translations Service
// Mobile-specific translation handling

import { AsyncStorageService } from '../storage/async-storage.service';
import { SecureStorageService } from '../storage/secure-storage.service';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { uiStrings } from './ui-strings';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    source: string;
  };
}

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  domain?: string;
}

interface TranslationResult {
  translation: string;
  confidence: number;
  source: string;
  alternatives?: string[];
}

interface TranslationFile {
  locale: string;
  url: string;
  version: string;
}

export class TranslationsService {
  private static instance: TranslationsService;
  private cache: AsyncStorageService;
  private secureStorage: SecureStorageService;
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of cached translations
  private translationFiles: Map<string, TranslationFile> = new Map();
  private cacheDir = `${FileSystem.cacheDirectory}translations/`;

  private constructor() {
    this.cache = new AsyncStorageService('civicsense_translations_');
    this.secureStorage = new SecureStorageService();
    this.ensureCacheDirectory();
  }

  static getInstance(): TranslationsService {
    if (!TranslationsService.instance) {
      TranslationsService.instance = new TranslationsService();
    }
    return TranslationsService.instance;
  }

  private async ensureCacheDirectory() {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
    }
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    try {
      // Check cache first
      const cached = await this.getCachedTranslation(request);
      if (cached) {
        return {
          translation: cached.translation,
          confidence: 1,
          source: cached.source,
        };
      }

      // Get API key from secure storage
      const apiKey = await this.getTranslationApiKey();
      if (!apiKey) {
        throw new Error('Translation API key not found');
      }

      // Call translation API
      const result = await this.callTranslationApi(request, apiKey);

      // Cache the result
      await this.cacheTranslation(request, result);

      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    try {
      const results: TranslationResult[] = [];
      const uncachedRequests: TranslationRequest[] = [];
      const cachePromises: Promise<TranslationResult | null>[] = [];

      // Check cache for all requests
      for (const request of requests) {
        cachePromises.push(this.getCachedTranslation(request));
      }

      const cachedResults = await Promise.all(cachePromises);

      // Separate cached and uncached requests
      requests.forEach((request, index) => {
        const cached = cachedResults[index];
        if (cached) {
          results.push({
            translation: cached.translation,
            confidence: 1,
            source: cached.source,
          });
        } else {
          uncachedRequests.push(request);
        }
      });

      if (uncachedRequests.length > 0) {
        // Get API key
        const apiKey = await this.getTranslationApiKey();
        if (!apiKey) {
          throw new Error('Translation API key not found');
        }

        // Call API for remaining translations
        const apiResults = await this.callTranslationApiBatch(uncachedRequests, apiKey);

        // Cache results
        await Promise.all(
          apiResults.map((result, index) =>
            this.cacheTranslation(uncachedRequests[index], result)
          )
        );

        results.push(...apiResults);
      }

      return results;
    } catch (error) {
      console.error('Batch translation failed:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  private async getCachedTranslation(request: TranslationRequest): Promise<{ translation: string; source: string } | null> {
    const cacheKey = this.getCacheKey(request);
    const cached = await this.cache.get<TranslationCache[string]>(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        translation: cached.translation,
        source: cached.source,
      };
    }

    return null;
  }

  private async cacheTranslation(request: TranslationRequest, result: TranslationResult): Promise<void> {
    const cacheKey = this.getCacheKey(request);
    const cacheEntry = {
      translation: result.translation,
      timestamp: Date.now(),
      source: result.source,
    };

    await this.cache.set(cacheKey, cacheEntry);

    // Cleanup old cache entries if needed
    await this.cleanupCache();
  }

  private async cleanupCache(): Promise<void> {
    const keys = await this.cache.getAllKeys();
    if (keys.length > this.MAX_CACHE_SIZE) {
      // Get all cache entries with timestamps
      const entries = await Promise.all(
        keys.map(async key => {
          const entry = await this.cache.get<TranslationCache[string]>(key);
          return { key, timestamp: entry?.timestamp || 0 };
        })
      );

      // Sort by timestamp and remove oldest entries
      const toRemove = entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, entries.length - this.MAX_CACHE_SIZE)
        .map(entry => entry.key);

      await this.cache.removeMultiple(toRemove);
    }
  }

  private getCacheKey(request: TranslationRequest): string {
    return `${request.sourceLanguage}_${request.targetLanguage}_${request.text}`;
  }

  private async getTranslationApiKey(): Promise<string | null> {
    return this.secureStorage.get<string>('translation_api_key');
  }

  private async callTranslationApi(request: TranslationRequest, apiKey: string): Promise<TranslationResult> {
    // In a real app, this would call your translation API
    // This is a mock implementation
    return {
      translation: `[Translated] ${request.text}`,
      confidence: 0.95,
      source: 'mock-api',
    };
  }

  private async callTranslationApiBatch(requests: TranslationRequest[], apiKey: string): Promise<TranslationResult[]> {
    // In a real app, this would batch call your translation API
    // This is a mock implementation
    return requests.map(request => ({
      translation: `[Translated] ${request.text}`,
      confidence: 0.95,
      source: 'mock-api',
    }));
  }

  // Load bundled translations
  async loadBundledTranslations(locale: string) {
    try {
      // Load from assets
      const module = require(`../../../assets/translations/${locale}.json`);
      const translations = Asset.fromModule(module);
      
      if (translations) {
        const content = await FileSystem.readAsStringAsync(translations.uri);
        const parsedContent = JSON.parse(content);
        uiStrings.addTranslations({ [locale]: parsedContent });
        return true;
      }
    } catch (error) {
      console.warn(`Failed to load bundled translations for ${locale}:`, error);
      return false;
    }
  }

  // Download remote translations
  async downloadTranslations(locale: string, url: string, version: string) {
    try {
      const cachedPath = `${this.cacheDir}${locale}_${version}.json`;
      
      // Check if we already have this version cached
      const cacheInfo = await FileSystem.getInfoAsync(cachedPath);
      if (cacheInfo.exists) {
        const content = await FileSystem.readAsStringAsync(cachedPath);
        const translations = JSON.parse(content);
        uiStrings.addTranslations({ [locale]: translations });
        return true;
      }

      // Download new translations
      const { status } = await FileSystem.downloadAsync(url, cachedPath);
      
      if (status === 200) {
        const content = await FileSystem.readAsStringAsync(cachedPath);
        const translations = JSON.parse(content);
        uiStrings.addTranslations({ [locale]: translations });
        
        // Update translation file info
        this.translationFiles.set(locale, { locale, url, version });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to download translations for ${locale}:`, error);
      return false;
    }
  }

  // Get info about available translations
  getAvailableTranslations(): TranslationFile[] {
    return Array.from(this.translationFiles.values());
  }
}

// Export singleton instance
export const translationsService = TranslationsService.getInstance(); 