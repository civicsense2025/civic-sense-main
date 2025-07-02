// Re-export UI Strings from the mobile implementation
export type { UIStrings, UIStringTranslations } from './ui-strings';
export { uiStrings as default } from './ui-strings';

// Language-specific exports
export { uiStringsAR } from './ui-strings-ar';
export { uiStringsDE } from './ui-strings-de';
export { uiStringsES } from './ui-strings-es';
export { uiStringsFR } from './ui-strings-fr';
export { uiStringsIT } from './ui-strings-it';

// Utility functions
export * from './ui-strings-utils';

// Default English strings
export { uiStrings } from './ui-strings';

// Language map for easy access
export const languageStrings = {
  en: () => import('./ui-strings').then(m => m.uiStrings),
  ar: () => import('./ui-strings-ar').then(m => m.uiStringsAR),
  de: () => import('./ui-strings-de').then(m => m.uiStringsDE),
  es: () => import('./ui-strings-es').then(m => m.uiStringsES),
  fr: () => import('./ui-strings-fr').then(m => m.uiStringsFR),
  it: () => import('./ui-strings-it').then(m => m.uiStringsIT),
  ja: () => import('./ui-strings-ja').then(m => m.default),
  ko: () => import('./ui-strings-ko').then(m => m.default),
  pt: () => import('./ui-strings-pt').then(m => m.default),
  ru: () => import('./ui-strings-ru').then(m => m.default),
  vi: () => import('./ui-strings-vi').then(m => m.default),
  zh: () => import('./ui-strings-zh').then(m => m.default),
};

// Language codes and names
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
] as const;

export type SupportedLanguageCode = typeof supportedLanguages[number]['code']; 