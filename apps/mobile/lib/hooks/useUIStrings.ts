// Hook for managing UI strings in different languages
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uiStrings, type UIStrings } from '../ui-strings';
import { uiStringsES } from '../ui-strings-es';
import { uiStringsZH } from '../ui-strings-zh';
import { uiStringsFR } from '../ui-strings-fr';
import { uiStringsDE } from '../ui-strings-de';
import { uiStringsPT } from '../ui-strings-pt';
import { uiStringsVI } from '../ui-strings-vi';
import { uiStringsAR } from '../ui-strings-ar';
import { uiStringsRU } from '../ui-strings-ru';
import { uiStringsJA } from '../ui-strings-ja';
import { uiStringsKO } from '../ui-strings-ko';
import { uiStringsIT } from '../ui-strings-it';

// Language mapping
const UI_STRINGS_MAP: Record<string, UIStrings> = {
  'en': uiStrings,
  'es': uiStringsES,
  'zh': uiStringsZH,
  'vi': uiStringsVI,
  'ar': uiStringsAR,
  'fr': uiStringsFR,
  'de': uiStringsDE,
  'pt': uiStringsPT,
  'ru': uiStringsRU,
  'ja': uiStringsJA,
  'ko': uiStringsKO,
  'it': uiStringsIT,
};

const UI_LANGUAGE_STORAGE_KEY = 'civic_ui_language';

interface UILanguageState {
  currentLanguage: string;
  uiStrings: UIStrings;
  setUILanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

export function useUIStrings(): UILanguageState {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [currentUIStrings, setCurrentUIStrings] = useState<UIStrings>(uiStrings);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved UI language preference
  useEffect(() => {
    const loadUILanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
        if (savedLanguage && UI_STRINGS_MAP[savedLanguage]) {
          setCurrentLanguage(savedLanguage);
          setCurrentUIStrings(UI_STRINGS_MAP[savedLanguage]);
        }
      } catch (error) {
        console.warn('Failed to load UI language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUILanguage();
  }, []);

  // Set UI language and persist preference
  const setUILanguage = useCallback(async (language: string) => {
    try {
      // Validate language is supported
      if (!UI_STRINGS_MAP[language]) {
        console.warn(`UI language ${language} not supported, falling back to English`);
        language = 'en';
      }

      setCurrentLanguage(language);
      setCurrentUIStrings(UI_STRINGS_MAP[language]);
      
      // Persist the preference
      await AsyncStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
      
      console.log(`✅ UI language set to: ${language}`);
    } catch (error) {
      console.error('Failed to set UI language:', error);
    }
  }, []);

  return {
    currentLanguage,
    uiStrings: currentUIStrings,
    setUILanguage,
    isLoading,
  };
}

// Helper function to get UI strings for a specific language without state
export function getUIStringsForLanguage(language: string): UIStrings {
  return UI_STRINGS_MAP[language] || uiStrings;
}

// Get full language name from code
export function getLanguageDisplayName(languageCode: string, uiLanguage: string = 'en'): string {
  const strings = getUIStringsForLanguage(uiLanguage);
  
  const languageMap: Record<string, keyof typeof strings.languages> = {
    'en': 'english',
    'es': 'spanish',
    'zh': 'chinese',
    'vi': 'vietnamese',
    'ar': 'arabic',
    'hi': 'hindi',
    'fr': 'french',
    'de': 'german',
    'pt': 'portuguese',
    'ru': 'russian',
    'ja': 'japanese',
    'ko': 'korean',
    'it': 'italian',
  };

  const key = languageMap[languageCode];
  return key ? strings.languages[key] : languageCode.toUpperCase();
}

export default useUIStrings; 