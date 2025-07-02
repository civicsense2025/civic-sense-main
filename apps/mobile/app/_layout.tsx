import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../lib/theme-context';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/language-context';

// Import expo/fetch polyfill for streaming support globally
import 'expo/fetch';
import { View, Text as RNText, Platform } from 'react-native';
import '../global.css';
import { SplashScreen } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { DataErrorBoundary } from '../components/error-boundaries';
import { LoadingSpinner } from '../components/molecules/LoadingSpinner';
import { AppStateProvider } from './providers/AppStateProvider';
import { NetworkProvider } from './providers/NetworkProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { contentCacheService } from '../lib/content-cache-service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ensureSupabaseInitialized } from '../lib/supabase';
import { refreshService } from '../lib/services/refresh-service';

// New providers for audio and notifications
import { AudioProvider } from '../components/audio/AudioProvider';
import { OneSignalProvider } from '../components/notifications/OneSignalProvider';

// Configure React Query with optimized settings for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Better for mobile
      refetchOnMount: false, // Prevent excessive refetching
      refetchOnReconnect: 'always', // Only refetch on network reconnect
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize RefreshService with QueryClient
refreshService.initialize(queryClient);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Simple constants
const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';
const SPLASH_SHOWN_KEY = 'hasShownSplash';

// Component that uses hooks after providers are initialized
function AppContentWithProviders() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Initialize Supabase singleton FIRST before anything else
        console.log('🔐 Initializing Supabase singleton...');
        await ensureSupabaseInitialized();
        console.log('✅ Supabase singleton ready');

        // Load fonts - Space Mono fonts now available
        console.log('🔤 Loading Space Mono fonts...');
        await Font.loadAsync({
          'SpaceMono-Regular': require('../assets/fonts/Space-Mono/static/SpaceMono-Regular.ttf'),
          'SpaceMono-Bold': require('../assets/fonts/Space-Mono/static/SpaceMono-Bold.ttf'),
          'SpaceMono-Italic': require('../assets/fonts/Space-Mono/static/SpaceMono-Italic.ttf'),
          'SpaceMono-BoldItalic': require('../assets/fonts/Space-Mono/static/SpaceMono-BoldItalic.ttf'),
        });
        console.log('✅ Space Mono fonts loaded successfully');

        // Initialize content cache - this will prefetch all questions and topics
        console.log('🚀 Starting content cache initialization...');
        await contentCacheService.initializeContentCache();
        
        // Pre-populate cache in background
        console.log('📱 App initialization complete');
        
        // Hide splash screen
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('App initialization error:', e);
        // Don't crash the app if cache fails
        setError(e instanceof Error ? e.message : 'App initialization failed');
        // Hide splash screen even on error
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.warn('Could not hide splash screen:', splashError);
        }
      } finally {
        setAppIsReady(true);
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady || !isReady) {
    return <AppLoadingScreen />;
  }

  // Show error state if needed
  if (error) {
    return <AppErrorScreen error={error} />;
  }

  // Show main app with network-aware wrapper
  return <NetworkAwareApp />;
}

// Loading screen component with fallback styling (no theme dependency)
function AppLoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#FFFFFF', 
      justifyContent: 'center', 
      alignItems: 'center'
    }}>
      <LoadingSpinner size="large" />
    </View>
  );
}

// Error screen component with fallback styling (no theme dependency)
function AppErrorScreen({ error }: { error: string }) {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#FFFFFF', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 20,
    }}>
      <RNText style={{ color: '#000000', textAlign: 'center', fontSize: 16 }}>
        Error: {error}
      </RNText>
      <RNText style={{ color: '#666666', textAlign: 'center', fontSize: 14, marginTop: 10 }}>
        Please restart the app
      </RNText>
    </View>
  );
}

function AppContent() {
  // This component just renders the content with providers - no hooks here
  return <AppContentWithProviders />;
}

function NetworkAwareApp() {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(true);

  // Platform-specific network check
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        if (Platform.OS === 'web') {
          // For web, try to fetch from our own domain or just assume connected
          // This avoids CORS issues with external domains
          try {
            // Try to fetch a simple resource from the same origin
            const response = await fetch('/favicon.ico', {
              method: 'HEAD',
              cache: 'no-cache',
            });
            setIsConnected(true);
          } catch {
            // If that fails, assume we're still connected since we're running
            // The user wouldn't be able to load the app without internet anyway
            setIsConnected(true);
          }
        } else {
          // For native platforms, use the original Google connectivity check
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch('https://www.google.com/generate_204', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal as any,
          });
          clearTimeout(timeoutId);
          setIsConnected(response.status === 204);
        }
      } catch (error) {
        // On web, be more lenient with connectivity failures
        if (Platform.OS === 'web') {
          console.log('Web connectivity check failed, assuming connected:', error);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
    };

    checkNetwork();
    
    // Only check periodically on native platforms
    // On web, the initial check is usually sufficient
    if (Platform.OS !== 'web') {
      const interval = setInterval(checkNetwork, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // For web, be more lenient about showing offline state
  // Only show offline state on native platforms or if explicitly disconnected
  if (!isConnected && Platform.OS !== 'web') {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.background, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20,
      }}>
        <RNText style={{ color: theme.foreground, textAlign: 'center', fontSize: 16 }}>
          No Internet Connection
        </RNText>
        <RNText style={{ color: theme.foregroundSecondary, textAlign: 'center', fontSize: 14, marginTop: 10 }}>
          Please check your connection and try again
        </RNText>
      </View>
    );
  }

  return <AuthenticatedStack />;
}

function AuthenticatedStack() {
  const { theme, isDark } = useTheme();
  
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

// Connected provider wrapper that links AuthProvider to ThemeProvider and includes new providers
function ConnectedProviders({ children }: { children: React.ReactNode }) {
  const { setUserId } = useTheme();
  
  return (
    <AuthProvider onUserIdChange={setUserId}>
      <AudioProvider>
        <OneSignalProvider>
          <NetworkProvider>
            <AppStateProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AppStateProvider>
          </NetworkProvider>
        </OneSignalProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DataErrorBoundary 
        context="App Root"
        onError={(error, errorInfo) => {
          console.error('Root Error Boundary caught:', error, errorInfo);
        }}
      >
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ThemeProvider>
              <ConnectedProviders>
                <AppContent />
              </ConnectedProviders>
            </ThemeProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </DataErrorBoundary>
    </GestureHandlerRootView>
  );
} 