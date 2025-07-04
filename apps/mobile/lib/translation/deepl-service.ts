// Mobile-compatible translation service for CivicSense
// Uses DeepL API directly for mobile translation
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
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

// DeepL language code mapping
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  'en': 'EN-US',
  'es': 'ES',
  'fr': 'FR', 
  'de': 'DE',
  'it': 'IT',
  'pt': 'PT-PT',
  'ru': 'RU',
  'ja': 'JA',
  'ko': 'KO',
  'zh': 'ZH',
  'ar': 'AR',
  'hi': 'HI',
  'tr': 'TR',
  'pl': 'PL',
  'nl': 'NL',
  'sv': 'SV',
  'da': 'DA',
  'no': 'NB',
  'fi': 'FI',
  'el': 'EL',
  'cs': 'CS',
  'sk': 'SK',
  'sl': 'SL',
  'et': 'ET',
  'lv': 'LV',
  'lt': 'LT',
  'bg': 'BG',
  'ro': 'RO',
  'hu': 'HU',
  'uk': 'UK',
  'id': 'ID',
  'vi': 'VI'
} as const;

// DeepL API currently supports a limited set of target languages. If we attempt
// to translate into a language that is not (yet) supported the API will return
// HTTP 400. To avoid unnecessary network calls & noisy error logs we maintain
// an allow-list of officially supported target codes (as of 2025-06). If the
// desired language is not on this list we immediately fall back to the civic
// glossary approach instead of contacting DeepL.

const SUPPORTED_DEEPL_TARGET_LANGS: Set<string> = new Set([
  // Main European languages (short codes)
  'BG', 'CS', 'DA', 'DE', 'EL', 'EN-GB', 'EN-US', 'ES', 'ET', 'FI', 'FR', 'HU',
  'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NL', 'PL', 'PT-PT', 'PT-BR', 'RO', 'RU',
  'SK', 'SL', 'SV', 'TR', 'UK', 'ZH'
]);

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

interface CivicTranslationOptions {
  preserveCivicTerms?: boolean;
  formality?: 'default' | 'more' | 'less' | 'prefer_more' | 'prefer_less';
  context?: string;
}

type CivicTermsGlossary = {
  [key: string]: {
    [lang: string]: string;
  };
};

interface DeepLTranslation {
  text: string;
  detected_source_language?: string;
}

interface DeepLResponse {
  translations: DeepLTranslation[];
}

class MobileTranslationService {
  private static instance: MobileTranslationService;
  private cache: TranslationCache = {};
  private isInitialized = false;
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CACHE_KEY = 'civic_translation_cache';
  private readonly DEEPL_API_KEY = process.env.EXPO_PUBLIC_DEEPL_API_KEY;

  // Civic-specific terms that should be preserved or handled specially
  private readonly CIVIC_TERMS_GLOSSARY: CivicTermsGlossary = {
    'Constitution': {
      es: 'Constitución',
      it: 'Costituzione',
      zh: '宪法',
      vi: 'Hiến pháp',
      ar: 'الدستور',
      hi: 'संविधान',
      fr: 'Constitution',
      de: 'Verfassung',
      pt: 'Constituição',
      ru: 'Конституция',
      ja: '憲法',
      ko: '헌법',
    },
    'First Amendment': {
      es: 'Primera Enmienda',
      it: 'Primo Emendamento',
      zh: '第一修正案',
      vi: 'Tu chính án đầu tiên',
      ar: 'التعديل الأول',
      hi: 'प्रथम संशोधन',
      fr: 'Premier Amendement',
      de: 'Erste Änderung',
      pt: 'Primeira Emenda',
      ru: 'Первая поправка',
      ja: '修正第1条',
      ko: '수정 제1조',
    },
    'Congress': {
      es: 'Congreso',
      it: 'Congresso',
      zh: '国会',
      vi: 'Quốc hội',
      ar: 'الكونغرس',
      hi: 'कांग्रेस',
      fr: 'Congrès',
      de: 'Kongress',
      pt: 'Congresso',
      ru: 'Конгресс',
      ja: '議会',
      ko: '의회',
    },
    'Supreme Court': {
      es: 'Corte Suprema',
      it: 'Corte Suprema',
      zh: '最高法院',
      vi: 'Tòa án Tối cao',
      ar: 'المحكمة العليا',
      hi: 'सर्वोच्च न्यायालय',
      fr: 'Cour suprême',
      de: 'Oberster Gerichtshof',
      pt: 'Supremo Tribunal',
      ru: 'Верховный суд',
      ja: '最高裁判所',
      ko: '대법원',
    },
    'voting rights': {
      es: 'derechos de voto',
      it: 'diritti di voto',
      zh: '投票权',
      vi: 'quyền bầu cử',
      ar: 'حقوق التصويت',
      hi: 'मतदान अधिकार',
      fr: 'droits de vote',
      de: 'Wahlrechte',
      pt: 'direitos de voto',
      ru: 'избирательные права',
      ja: '選挙権',
      ko: '투표권',
    },
    'democracy': {
      es: 'democracia',
      it: 'democrazia',
      zh: '民主',
      vi: 'dân chủ',
      ar: 'الديمقراطية',
      hi: 'लोकतंत्र',
      fr: 'démocratie',
      de: 'Demokratie',
      pt: 'democracia',
      ru: 'демократия',
      ja: '民主主義',
      ko: '민주주의',
    },
    'government': {
      es: 'gobierno',
      it: 'governo',
      zh: '政府',
      vi: 'chính phủ',
      ar: 'الحكومة',
      hi: 'सरकार',
      fr: 'gouvernement',
      de: 'Regierung',
      pt: 'governo',
      ru: 'правительство',
      ja: '政府',
      ko: '정부',
    },
    'President': {
      es: 'Presidente',
      it: 'Presidente',
      zh: '总统',
      vi: 'Tổng thống',
      ar: 'الرئيس',
      hi: 'राष्ट्रपति',
      fr: 'Président',
      de: 'Präsident',
      pt: 'Presidente',
      ru: 'Президент',
      ja: '大統領',
      ko: '대통령',
    },
    'Senate': {
      es: 'Senado',
      it: 'Senato',
      zh: '参议院',
      vi: 'Thượng viện',
      ar: 'مجلس الشيوخ',
      hi: 'सीनेट',
      fr: 'Sénat',
      de: 'Senat',
      pt: 'Senado',
      ru: 'Сенат',
      ja: '上院',
      ko: '상원',
    },
    'House of Representatives': {
      es: 'Cámara de Representantes',
      it: 'Camera dei Rappresentanti',
      zh: '众议院',
      vi: 'Hạ viện',
      ar: 'مجلس النواب',
      hi: 'प्रतिनिधि सभा',
      fr: 'Chambre des représentants',
      de: 'Repräsentantenhaus',
      pt: 'Câmara dos Representantes',
      ru: 'Палата представителей',
      ja: '下院',
      ko: '하원',
    },
  };

  static getInstance(): MobileTranslationService {
    if (!MobileTranslationService.instance) {
      MobileTranslationService.instance = new MobileTranslationService();
    }
    return MobileTranslationService.instance;
  }

  private constructor() {
    // Private constructor to enforce singleton
  }

  async initialize(): Promise<void> {
    try {
      console.log('🌍 Initializing Mobile Translation Service...');
      
      // Load cached translations
      await this.loadCache();
      
      this.isInitialized = true;
      console.log('✅ Mobile Translation Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize translation service:', error);
      this.isInitialized = true; // Still mark as initialized to use fallback
    }
  }

  /**
   * Map language code to DeepL format
   */
  private mapLanguageCode(code: string): string {
    return DEEPL_LANGUAGE_MAP[code.toLowerCase()] || code.toUpperCase();
  }

  /**
   * Translate civic education text using DeepL API directly
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

      // Return original text if translating to English
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

      try {
        // Use DeepL API directly
        if (this.DEEPL_API_KEY) {
          translatedText = await this.translateWithDeepL(text, targetLanguage, options);
          console.log('✅ DeepL translation successful');
        } else {
          console.warn('⚠️ DeepL API key not configured, using fallback');
          throw new Error('DeepL API key not configured');
        }
      } catch (error) {
        console.warn('⚠️ DeepL translation failed, using civic terms fallback:', error);
        // Fallback to civic terms glossary
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
   * Translate using DeepL API directly
   */
  private async translateWithDeepL(
    text: string,
    targetLanguage: string,
    options: CivicTranslationOptions
  ): Promise<string> {
    if (!this.DEEPL_API_KEY) {
      throw new Error('DeepL API key not configured');
    }

    const deeplTargetLang = this.mapLanguageCode(targetLanguage);
    
    // Guard: skip API call if DeepL does not support this language yet
    if (!SUPPORTED_DEEPL_TARGET_LANGS.has(deeplTargetLang)) {
      console.warn(`⚠️ DeepL target language '${deeplTargetLang}' not supported by current API – using glossary fallback.`);
      throw new Error('Unsupported target language');
    }

    // Prepare JSON payload for DeepL API (as per documentation)
    const requestBody = {
      text: [text], // DeepL expects an array of strings
      target_lang: deeplTargetLang,
      preserve_formatting: true,
      split_sentences: '1'
    };
    
    if (options.formality && options.formality !== 'default') {
      (requestBody as any).formality = options.formality;
    }

    // Use DeepL Free API endpoint (most mobile apps will use free tier)
    const baseUrl = this.DEEPL_API_KEY.endsWith(':fx') 
      ? 'https://api-free.deepl.com' 
      : 'https://api.deepl.com';

    console.log(`🌐 Calling DeepL API: ${text.substring(0, 50)}... -> ${deeplTargetLang}`);
    console.log(`🌐 Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ DeepL API error: ${response.status} - ${errorText}`);
      console.error(`❌ Request details:`, {
        url: `${baseUrl}/v2/translate`,
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.DEEPL_API_KEY?.substring(0, 10)}...`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody, null, 2)
      });
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as DeepLResponse;
    
    if (!result.translations || !Array.isArray(result.translations) || result.translations.length === 0) {
      throw new Error('Invalid response from DeepL API');
    }

    return result.translations[0].text;
  }

  /**
   * Fallback translation using civic terms glossary
   */
  private translateWithGlossary(text: string, targetLanguage: string): string {
    console.log(`📚 Using glossary translation for ${targetLanguage}:`, text.substring(0, 100) + '...');
    
    let translatedText = text;
    let replacementCount = 0;
    
    // Replace civic terms with their translations
    for (const [englishTerm, translations] of Object.entries(this.CIVIC_TERMS_GLOSSARY)) {
      const targetTranslation = translations[targetLanguage];
      if (targetTranslation) {
        const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
        const beforeReplace = translatedText;
        translatedText = translatedText.replace(regex, targetTranslation);
        if (translatedText !== beforeReplace) {
          replacementCount++;
          console.log(`📚 Replaced "${englishTerm}" with "${targetTranslation}"`);
        }
      }
    }
    
    console.log(`📚 Glossary translation complete: ${replacementCount} terms replaced`);
    
    return translatedText;
  }

  /**
   * Apply civic-specific term corrections to maintain accuracy
   */
  private applyCivicTermsCorrection(text: string, targetLanguage: string): string {
    // This method ensures that important civic terms are translated correctly
    return this.translateWithGlossary(text, targetLanguage);
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
    hasApiAccess: boolean;
    cacheSize: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasApiAccess: !!this.DEEPL_API_KEY,
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
}

// Export singleton instance
export const deepLTranslationService = MobileTranslationService.getInstance(); 