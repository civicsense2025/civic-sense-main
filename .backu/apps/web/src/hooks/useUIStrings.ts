import { useState, useCallback } from 'react';
import { uiStrings, UIStringPath, getString, formatString, defaultStrings } from '@civicsense/business-logic/strings/ui-strings';
import { translations } from '@civicsense/business-logic/strings';

export function useUIStrings() {
  // Get user's language preference from localStorage or browser
  const [language] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('language') || navigator.language.split('-')[0] || 'en';
  });

  // Get strings for user's language, fallback to English
  const [currentStrings] = useState<UIStrings>(() => {
    const langStrings = translations[language];
    return langStrings || defaultStrings;
  });

  const t = useCallback((path: UIStringPath, vars?: Record<string, string | number>): string => {
    const str = getString(path, currentStrings);
    return vars ? formatString(str, vars) : str;
  }, [currentStrings]);

  return { t, language };
} 