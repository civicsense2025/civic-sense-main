// CivicSense Mobile UI Strings
// Mobile-specific UI text and localization

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@civicsense/business-logic/strings/translations';
import type { UIStringPath } from '@civicsense/types';
import type { SupportedLanguage } from '@civicsense/types';

// Initialize i18n instance
const i18n = new I18n(translations);

// Set the locale from device settings
i18n.locale = Localization.locale;
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export function getString(path: UIStringPath, params?: Record<string, string>): string {
  return i18n.t(path, params);
}

export function formatString(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(new RegExp(`{${key}}`, 'g'), value),
    template
  );
}

export function setLocale(locale: string): void {
  i18n.locale = locale;
}

export function getLocale(): string {
  return i18n.locale;
}

export function loadTranslations(locale: string, strings: Record<string, any>): void {
  i18n.store(strings);
  i18n.locale = locale;
}

export class MobileUIStrings {
  private currentLocale: SupportedLanguage = 'en';

  constructor() {
    this.initializeLocale();
  }

  private async initializeLocale() {
    try {
      const storedLocale = await AsyncStorage.getItem('user-locale');
      if (storedLocale) {
        this.setLocale(storedLocale as SupportedLanguage);
      } else {
        // Use device locale or fall back to English
        const deviceLocale = Localization.getLocales()[0]?.languageCode;
        this.setLocale((deviceLocale || 'en') as SupportedLanguage);
      }
    } catch (error) {
      console.warn('Failed to initialize locale:', error);
    }
  }

  async setLocale(locale: SupportedLanguage) {
    try {
      this.currentLocale = locale;
      i18n.locale = locale;
      await AsyncStorage.setItem('user-locale', locale);
    } catch (error) {
      console.warn('Failed to set locale:', error);
    }
  }

  getLocale(): SupportedLanguage {
    return this.currentLocale;
  }

  getUIString(key: string, params?: Record<string, any>): string {
    return i18n.t(key, params);
  }
}

// Export singleton instance
export const uiStrings = new MobileUIStrings();

// Export helper hook for components
export function useUIString(key: string, params?: Record<string, any>): string {
  return uiStrings.getUIString(key, params);
} 