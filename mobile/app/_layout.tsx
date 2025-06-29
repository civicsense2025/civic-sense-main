import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// CivicSense providers
import { AuthProvider } from '../components/auth/AuthProvider';
import { OneSignalProvider } from './notifications/OneSignalProvider';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AudioProvider } from '../components/audio/AudioProvider';

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AudioProvider>
                <OneSignalProvider>
                  <StatusBar style="auto" />
                  <Stack
                    screenOptions={{
                      headerStyle: {
                        backgroundColor: '#E0A63E', // CivicSense primary color
                      },
                      headerTintColor: '#ffffff',
                      headerTitleStyle: {
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="quiz" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                    <Stack.Screen name="settings" options={{ title: 'Settings' }} />
                  </Stack>
                </OneSignalProvider>
              </AudioProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 