import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language definitions with emojis and proper names
export const AVAILABLE_LANGUAGES = [
  { code: 'en', emoji: '🇺🇸', label: 'EN', name: 'English' },
  { code: 'es', emoji: '🇪🇸', label: 'ES', name: 'Español' },
  { code: 'fr', emoji: '🇫🇷', label: 'FR', name: 'Français' },
  { code: 'de', emoji: '🇩🇪', label: 'DE', name: 'Deutsch' },
  { code: 'zh', emoji: '🇨🇳', label: 'ZH', name: '中文' },
  { code: 'ja', emoji: '🇯🇵', label: 'JA', name: '日本語' },
  { code: 'ko', emoji: '🇰🇷', label: 'KO', name: '한국어' },
  { code: 'ar', emoji: '🇸🇦', label: 'AR', name: 'العربية' },
  { code: 'pt', emoji: '🇧🇷', label: 'PT', name: 'Português' },
  { code: 'ru', emoji: '🇷🇺', label: 'RU', name: 'Русский' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

export interface Language {
  code: LanguageCode;
  emoji: string;
  label: string;
  name: string;
}

// Translation dictionary interface
export interface Translations {
  // Common UI
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    done: string;
    next: string;
    back: string;
    close: string;
    ok: string;
  };
  
  // Navigation
  navigation: {
    home: string;
    learn: string;
    quiz: string;
    bookmarks: string;
    saved: string;
    profile: string;
    settings: string;
  };
  
  // Quiz related
  quiz: {
    questions: string;
    question: string;
    startQuiz: string;
    timeLimit: string;
    hints: string;
    explanations: string;
    score: string;
    correct: string;
    incorrect: string;
    continue: string;
    finish: string;
    results: string;
  };
  
  // Game room
  gameRoom: {
    questionsPreview: string;
    settings: string;
    sources: string;
    quizSettings: string;
    showHints: string;
    showExplanations: string;
    getHelpfulClues: string;
    learnWhyAnswersCorrect: string;
    startReview: string;
    readMore: string;
  };
  
  // Profile
  profile: {
    myProfile: string;
    editProfile: string;
    preferences: string;
    progress: string;
    achievements: string;
    signOut: string;
  };
}

// Default English translations
const DEFAULT_TRANSLATIONS: Translations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    close: 'Close',
    ok: 'OK',
  },
  navigation: {
    home: 'Home',
    learn: 'Learn',
    quiz: 'Quiz',
    bookmarks: 'Bookmarks',
    saved: 'Saved',
    profile: 'Profile',
    settings: 'Settings',
  },
  quiz: {
    questions: 'Questions',
    question: 'Question',
    startQuiz: 'Start Quiz',
    timeLimit: 'Time Limit',
    hints: 'Hints',
    explanations: 'Explanations',
    score: 'Score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    continue: 'Continue',
    finish: 'Finish',
    results: 'Results',
  },
  gameRoom: {
    questionsPreview: 'Questions Preview',
    settings: 'Settings',
    sources: 'Sources & References',
    quizSettings: 'Quiz Settings',
    showHints: 'Show Hints',
    showExplanations: 'Show Explanations',
    getHelpfulClues: 'Get helpful clues during quiz',
    learnWhyAnswersCorrect: 'Learn why answers are correct',
    startReview: 'Start Review',
    readMore: 'Read More',
  },
  profile: {
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    preferences: 'Preferences',
    progress: 'Progress',
    achievements: 'Achievements',
    signOut: 'Sign Out',
  },
};

// Spanish translations
const SPANISH_TRANSLATIONS: Translations = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Listo',
    next: 'Siguiente',
    back: 'Atrás',
    close: 'Cerrar',
    ok: 'OK',
  },
  navigation: {
    home: 'Inicio',
    learn: 'Aprender',
    quiz: 'Examen',
    bookmarks: 'Marcadores',
    saved: 'Guardado',
    profile: 'Perfil',
    settings: 'Configuración',
  },
  quiz: {
    questions: 'Preguntas',
    question: 'Pregunta',
    startQuiz: 'Iniciar Examen',
    timeLimit: 'Límite de Tiempo',
    hints: 'Pistas',
    explanations: 'Explicaciones',
    score: 'Puntuación',
    correct: 'Correcto',
    incorrect: 'Incorrecto',
    continue: 'Continuar',
    finish: 'Finalizar',
    results: 'Resultados',
  },
  gameRoom: {
    questionsPreview: 'Vista Previa de Preguntas',
    settings: 'Configuración',
    sources: 'Fuentes y Referencias',
    quizSettings: 'Configuración del Examen',
    showHints: 'Mostrar Pistas',
    showExplanations: 'Mostrar Explicaciones',
    getHelpfulClues: 'Obtener pistas útiles durante el examen',
    learnWhyAnswersCorrect: 'Aprende por qué las respuestas son correctas',
    startReview: 'Iniciar Revisión',
    readMore: 'Leer Más',
  },
  profile: {
    myProfile: 'Mi Perfil',
    editProfile: 'Editar Perfil',
    preferences: 'Preferencias',
    progress: 'Progreso',
    achievements: 'Logros',
    signOut: 'Cerrar Sesión',
  },
};

// Translation dictionary
const TRANSLATION_DICTIONARY: Record<LanguageCode, Translations> = {
  en: DEFAULT_TRANSLATIONS,
  es: SPANISH_TRANSLATIONS,
  // Add other languages as needed - for now using English as fallback
  fr: DEFAULT_TRANSLATIONS,
  de: DEFAULT_TRANSLATIONS,
  zh: DEFAULT_TRANSLATIONS,
  ja: DEFAULT_TRANSLATIONS,
  ko: DEFAULT_TRANSLATIONS,
  ar: DEFAULT_TRANSLATIONS,
  pt: DEFAULT_TRANSLATIONS,
  ru: DEFAULT_TRANSLATIONS,
};

interface LanguageContextType {
  currentLanguage: Language;
  translations: Translations;
  changeLanguage: (languageCode: LanguageCode) => void;
  isTranslating: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(AVAILABLE_LANGUAGES[0]); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language from storage
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguageCode = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguageCode) {
        const savedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === savedLanguageCode);
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        }
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };

  const changeLanguage = async (languageCode: LanguageCode) => {
    const newLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
    if (!newLanguage) return;

    setIsTranslating(true);
    
    try {
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEY, languageCode);
      
      // Update current language
      setCurrentLanguage(newLanguage);
      
      console.log(`🌐 Language changed to ${newLanguage.name} (${newLanguage.code})`);
      
      // Simulate translation loading time for better UX
      setTimeout(() => {
        setIsTranslating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error saving language:', error);
      setIsTranslating(false);
    }
  };

  // Get current translations
  const translations = TRANSLATION_DICTIONARY[currentLanguage.code] || DEFAULT_TRANSLATIONS;

  // Translation helper function - supports nested keys like "common.loading"
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return value || key; // Return key if translation not found
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    translations,
    changeLanguage,
    isTranslating,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper function to get language by code
export function getLanguageByCode(code: LanguageCode): Language | undefined {
  return AVAILABLE_LANGUAGES.find(lang => lang.code === code);
} 