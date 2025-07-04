import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './theme';
import { UserPreferencesService, type UserPreferences } from './services/user-preferences-service';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  userPreferences: UserPreferences | null;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  refreshPreferences: () => Promise<void>;
  setUserId: (userId: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@civicsense_theme_mode';

// Apply user preferences to base theme
function applyUserPreferencesToTheme(baseTheme: Theme, preferences: UserPreferences | null): Theme {
  if (!preferences) return baseTheme;

  // TODO: Implement theme modifications based on user preferences
  // For now, return base theme until we implement the theme modification system
  // Future: Apply fontSize scaling, high contrast colors, etc.
  
  return baseTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Get base theme
  const baseTheme = isDark ? darkTheme : lightTheme;
  
  // Apply user preferences to theme
  const theme = applyUserPreferencesToTheme(baseTheme as Theme, userPreferences);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Load user preferences when user ID changes
  useEffect(() => {
    if (currentUserId) {
      loadUserPreferences(currentUserId);
    } else {
      setUserPreferences(null);
    }
  }, [currentUserId]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const preferences = await UserPreferencesService.getUserPreferences(userId);
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const refreshPreferences = async () => {
    if (currentUserId) {
      await loadUserPreferences(currentUserId);
    }
  };

  const setUserId = (userId: string | null) => {
    setCurrentUserId(userId);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeMode, 
        isDark, 
        userPreferences,
        setThemeMode, 
        toggleTheme,
        refreshPreferences,
        setUserId
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.warn('⚠️ useTheme called outside ThemeProvider, using fallback theme');
    // Return a fallback theme instead of throwing to prevent crashes
    return {
      theme: lightTheme as Theme,
      themeMode: 'light' as ThemeMode,
      isDark: false,
      userPreferences: null,
      setThemeMode: () => {
        console.warn('⚠️ setThemeMode called outside ThemeProvider');
      },
      toggleTheme: () => {
        console.warn('⚠️ toggleTheme called outside ThemeProvider');
      },
      refreshPreferences: async () => {
        console.warn('⚠️ refreshPreferences called outside ThemeProvider');
      },
      setUserId: () => {
        console.warn('⚠️ setUserId called outside ThemeProvider');
      },
    };
  }
  return context;
} 