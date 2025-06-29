import * as deepl from 'deepl-node';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages for CivicSense civic education
export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
];

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

interface CivicTranslationOptions {
  preserveCivicTerms?: boolean;
  formality?: 'default' | 'more' | 'less';
  context?: string;
}

class DeepLTranslationService {
  private static instance: DeepLTranslationService;
  private translator: deepl.Translator | null = null;
  private cache: TranslationCache = {};
  private isInitialized = false;
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CACHE_KEY = 'civic_translation_cache';

  // Civic-specific terms that should be preserved or handled specially
  private readonly CIVIC_TERMS_GLOSSARY = {
    'Constitution': {
      es: 'Constitución',
      fr: 'Constitution',
      de: 'Verfassung',
      it: 'Costituzione',
      pt: 'Constituição',
      zh: '宪法',
      ja: '憲法',
      ko: '헌법',
      ru: 'Конституция',
      ar: 'الدستور',
      pl: 'Konstytucja',
      nl: 'Grondwet',
    },
    'First Amendment': {
      es: 'Primera Enmienda',
      fr: 'Premier Amendement',
      de: 'Erste Verfassungsänderung',
      it: 'Primo Emendamento',
      pt: 'Primeira Emenda',
      zh: '第一修正案',
      ja: '修正第1条',
      ko: '수정 제1조',
      ru: 'Первая поправка',
      ar: 'التعديل الأول',
      pl: 'Pierwsza Poprawka',
      nl: 'Eerste Amendement',
    },
    'Congress': {
      es: 'Congreso',
      fr: 'Congrès',
      de: 'Kongress',
      it: 'Congresso',
      pt: 'Congresso',
      zh: '国会',
      ja: '議会',
      ko: '의회',
      ru: 'Конгресс',
      ar: 'الكونغرس',
      pl: 'Kongres',
      nl: 'Congres',
    },
    'Supreme Court': {
      es: 'Corte Suprema',
      fr: 'Cour suprême',
      de: 'Oberster Gerichtshof',
      it: 'Corte Suprema',
      pt: 'Supremo Tribunal',
      zh: '最高法院',
      ja: '最高裁判所',
      ko: '대법원',
      ru: 'Верховный суд',
      ar: 'المحكمة العليا',
      pl: 'Sąd Najwyższy',
      nl: 'Hooggerechtshof',
    },
    'voting rights': {
      es: 'derechos de voto',
      fr: 'droits de vote',
      de: 'Wahlrechte',
      it: 'diritti di voto',
      pt: 'direitos de voto',
      zh: '投票权',
      ja: '選挙権',
      ko: '선거권',
      ru: 'избирательные права',
      ar: 'حقوق التصويت',
      pl: 'prawa wyborcze',
      nl: 'stemrechten',
    },
  };

  static getInstance(): DeepLTranslationService {
    if (!DeepLTranslationService.instance) {
      DeepLTranslationService.instance = new DeepLTranslationService();
    }
    return DeepLTranslationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🌍 Initializing DeepL Translation Service...');
      
      // Get API key from environment or config
      const apiKey = process.env.EXPO_PUBLIC_DEEPL_API_KEY || process.env.DEEPL_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️ DeepL API key not found. Translation will use fallback methods.');
        this.isInitialized = true;
        return;
      }

      // Initialize DeepL translator
      this.translator = new deepl.Translator(apiKey);
      
      // Load cached translations
      await this.loadCache();
      
      // Test connection with a simple request
      try {
        await this.translator.getUsage();
        console.log('✅ DeepL Translation Service initialized successfully');
      } catch (error) {
        console.warn('⚠️ DeepL API connection test failed:', error);
      }
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize DeepL service:', error);
      this.isInitialized = true; // Still mark as initialized to use fallback
    }
  }

  /**
   * Translate civic education text with DeepL
   */
  async translateText(
    text: string,
    targetLanguage: string,
    options: CivicTranslationOptions = {}
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Return original text if translating to English or if no translator available
      if (targetLanguage === 'en' || targetLanguage === 'en-US') {
        return text;
      }

      // Check cache first
      const cacheKey = this.getCacheKey(text, targetLanguage, options);
      const cached = this.getCachedTranslation(cacheKey);
      if (cached) {
        console.log('📄 Using cached translation');
        return cached;
      }

      let translatedText = text;

      if (this.translator) {
        // Use DeepL for translation
        translatedText = await this.translateWithDeepL(text, targetLanguage, options);
      } else {
        // Fallback to civic terms glossary if available
        translatedText = this.translateWithGlossary(text, targetLanguage);
      }

      // Apply civic-specific post-processing
      if (options.preserveCivicTerms) {
        translatedText = this.applyCivicTermsCorrection(translatedText, targetLanguage);
      }

      // Cache the translation
      this.cacheTranslation(cacheKey, translatedText);
      
      return translatedText;

    } catch (error) {
      console.error('Translation failed:', error);
      
      // Fallback to civic terms glossary
      const fallbackTranslation = this.translateWithGlossary(text, targetLanguage);
      if (fallbackTranslation !== text) {
        return fallbackTranslation;
      }
      
      // If all else fails, return original text
      return text;
    }
  }

  /**
   * Translate with DeepL API
   */
  private async translateWithDeepL(
    text: string,
    targetLanguage: string,
    options: CivicTranslationOptions
  ): Promise<string> {
    if (!this.translator) {
      throw new Error('DeepL translator not initialized');
    }

    // Map our language codes to DeepL's format
    const deepLTargetLang = this.mapToDeepLLanguageCode(targetLanguage);
    
    const translateOptions: any = {
      sourceLang: 'en' as const,
    };

    // Add formality if supported for the target language
    if (options.formality && this.supportsFormality(deepLTargetLang)) {
      translateOptions.formality = options.formality;
    }

    // Add context for civic education content
    if (options.context) {
      translateOptions.context = options.context;
    }

    const result = await this.translator.translateText(
      text, 
      'en', 
      deepLTargetLang as any, // DeepL types are strict, but we've mapped correctly
      translateOptions
    );
    
    return Array.isArray(result) ? result[0].text : result.text;
  }

  /**
   * Fallback translation using civic terms glossary
   */
  private translateWithGlossary(text: string, targetLanguage: string): string {
    let translatedText = text;
    
    // Replace civic terms with their translations
    for (const [englishTerm, translations] of Object.entries(this.CIVIC_TERMS_GLOSSARY)) {
      const targetTranslation = translations[targetLanguage as keyof typeof translations];
      if (targetTranslation) {
        const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
        translatedText = translatedText.replace(regex, targetTranslation);
      }
    }
    
    return translatedText;
  }

  /**
   * Apply civic-specific term corrections to maintain accuracy
   */
  private applyCivicTermsCorrection(text: string, targetLanguage: string): string {
    // This method ensures that important civic terms are translated correctly
    // even if DeepL might have used different terminology
    return this.translateWithGlossary(text, targetLanguage);
  }

  /**
   * Map language codes to DeepL format
   */
  private mapToDeepLLanguageCode(languageCode: string): string {
    const mapping: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt-PT',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko',
      'ru': 'ru',
      'ar': 'ar',
      'pl': 'pl',
      'nl': 'nl',
    };
    
    return mapping[languageCode] || languageCode;
  }

  /**
   * Check if language supports formality
   */
  private supportsFormality(languageCode: string): boolean {
    const formalityLanguages = ['de', 'fr', 'it', 'es', 'nl', 'pl', 'pt-PT', 'ru', 'ja'];
    return formalityLanguages.includes(languageCode);
  }

  /**
   * Get cached translation
   */
  private getCachedTranslation(cacheKey: string): string | null {
    const cached = this.cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.translation;
    }
    return null;
  }

  /**
   * Cache translation
   */
  private cacheTranslation(cacheKey: string, translation: string): void {
    this.cache[cacheKey] = {
      translation,
      timestamp: Date.now(),
    };
    
    // Save to persistent storage (async, don't wait)
    this.saveCache().catch(error => 
      console.warn('Failed to save translation cache:', error)
    );
  }

  /**
   * Generate cache key
   */
  private getCacheKey(text: string, targetLanguage: string, options: CivicTranslationOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${text}_${targetLanguage}_${optionsStr}`;
  }

  /**
   * Load cache from storage
   */
  private async loadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        
        // Clean up expired entries
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
          if (now - this.cache[key].timestamp > this.CACHE_DURATION) {
            delete this.cache[key];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
      this.cache = {};
    }
  }

  /**
   * Save cache to storage
   */
  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }

  /**
   * Get available languages for UI
   */
  getAvailableLanguages(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get translation service status
   */
  getStatus(): {
    isInitialized: boolean;
    hasApiKey: boolean;
    cacheSize: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!this.translator,
      cacheSize: Object.keys(this.cache).length,
    };
  }

  /**
   * Clear translation cache
   */
  async clearCache(): Promise<void> {
    this.cache = {};
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear translation cache:', error);
    }
  }

  /**
   * Get usage information (if DeepL is available)
   */
  async getUsage(): Promise<any | null> {
    if (!this.translator) {
      return null;
    }
    
    try {
      const usage = await this.translator.getUsage();
      return usage;
    } catch (error) {
      console.warn('Failed to get DeepL usage:', error);
      return null;
    }
  }
}

// Export singleton instance
export const deepLTranslationService = DeepLTranslationService.getInstance(); 