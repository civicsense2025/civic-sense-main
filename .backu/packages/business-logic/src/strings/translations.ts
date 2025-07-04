import { SupportedLanguage, TranslationService } from '@civicsense/types';
import { UIStrings } from '@civicsense/types';

// Default translations object
export const translations = {
  en: {
    // English translations
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      save: 'Save',
      // ... add other common strings
    }
  },
  es: {
    // Spanish translations
    common: {
      ok: 'Aceptar',
      cancel: 'Cancelar',
      save: 'Guardar',
      // ... add other common strings
    }
  }
};

export class TranslationsServiceImpl implements TranslationService {
  private locale: SupportedLanguage = 'en';
  private strings: Record<string, string> = {};

  constructor() {
    // Load initial strings
    this.loadStrings('en');
  }

  getLocale(): SupportedLanguage {
    return this.locale;
  }

  async setLocale(locale: SupportedLanguage): Promise<void> {
    this.locale = locale;
    await this.loadStrings(locale);
  }

  translate(key: string, params?: Record<string, any>): string {
    const value = this.strings[key] || key;
    if (!params) return value;

    return value.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key]?.toString() || `{${key}}`;
    });
  }

  private async loadStrings(locale: SupportedLanguage): Promise<void> {
    try {
      this.strings = translations[locale]?.common || translations.en.common;
    } catch (error) {
      console.error(`Failed to load strings for locale ${locale}:`, error);
      // Fallback to English
      if (locale !== 'en') {
        await this.loadStrings('en');
      }
    }
  }
}

export const translationsService = new TranslationsServiceImpl(); 