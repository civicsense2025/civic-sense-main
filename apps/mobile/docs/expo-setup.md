# CivicSense Mobile App: Expo Setup Plan

## 🎯 Strategic Overview

Transform CivicSense into a cross-platform civic education platform by adding native mobile capabilities while maintaining your existing Next.js web app and shared business logic.

## 📁 Proposed Monorepo Structure

```
civic-sense-main/
├── apps/
│   ├── web/                    # Existing Next.js app (moved)
│   └── mobile/                 # New Expo app
├── packages/
│   ├── shared/                 # Shared business logic
│   │   ├── database/          # Supabase client & types
│   │   ├── auth/              # Authentication logic
│   │   ├── quiz/              # Quiz engine & logic
│   │   ├── multiplayer/       # Multiplayer functionality
│   │   └── utils/             # Utility functions
│   ├── ui-web/                # Web-specific UI components
│   ├── ui-mobile/             # Mobile-specific UI components
│   └── ui-shared/             # Platform-agnostic components
├── supabase/                  # Database migrations & config
└── scripts/                   # Build & deployment scripts
```

## 🚀 Phase 1: Setup & Foundation (Week 1-2)

### Step 1: Initialize Expo App
```bash
# Create Expo app with TypeScript
npx create-expo-app@latest apps/mobile --template blank-typescript

# Navigate to mobile app
cd apps/mobile

# Install essential dependencies
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install @expo/vector-icons expo-font expo-splash-screen
npx expo install expo-secure-store expo-web-browser expo-auth-session
```

### Step 2: Configure Expo for CivicSense
```typescript
// apps/mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CivicSense',
  slug: 'civicsense',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.civicsense.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.civicsense.app'
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          newArchEnabled: true
        },
        android: {
          newArchEnabled: true
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
});
```

### Step 3: Setup Shared Packages Structure
```bash
# Create shared packages
mkdir -p packages/shared/{database,auth,quiz,multiplayer,utils}
mkdir -p packages/ui-{web,mobile,shared}

# Initialize package.json files for each package
```

## 🔧 Phase 2: Shared Business Logic (Week 2-3)

### Supabase Mobile Configuration
```typescript
// packages/shared/database/client.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from './types';

// Custom storage for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Disable for mobile
      },
    }
  );
};
```

### Shared Authentication Provider
```typescript
// packages/shared/auth/auth-provider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createSupabaseClient } from '../database/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    // Implementation for OAuth with expo-auth-session
    // This requires additional setup for each provider
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithOAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Shared Quiz Engine
```typescript
// packages/shared/quiz/quiz-engine.ts
import { createSupabaseClient } from '../database/client';
import type { Database } from '../database/types';

export class SharedQuizEngine {
  private supabase = createSupabaseClient();

  async getQuizQuestions(topicId: string) {
    const { data, error } = await this.supabase
      .from('quiz_questions')
      .select('*')
      .eq('topic_id', topicId)
      .limit(10);

    if (error) throw error;
    return data;
  }

  async submitQuizAttempt(attempt: {
    user_id?: string;
    guest_token?: string;
    topic_id: string;
    score: number;
    answers: any[];
  }) {
    const { data, error } = await this.supabase
      .from('user_quiz_attempts')
      .insert(attempt)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Add other quiz-related methods...
}
```

## 📱 Phase 3: Mobile UI Components (Week 3-4)

### React Native Design System
```typescript
// packages/ui-mobile/src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#3B82F6', // CivicSense Authority Blue
  },
  secondary: {
    backgroundColor: '#F3F4F6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#3B82F6',
  },
});
```

### Mobile-Specific Quiz Component
```typescript
// packages/ui-mobile/src/components/QuizQuestion.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuizQuestionProps {
  question: string;
  options: string[];
  selectedAnswer?: number;
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  options,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswer === index && styles.selectedOption,
            ]}
            onPress={() => onSelectAnswer(index)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <View style={styles.optionIndicator}>
              <Text style={styles.optionLetter}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text style={[
              styles.optionText,
              selectedAnswer === index && styles.selectedOptionText,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1F2937',
    fontWeight: '500',
  },
});
```

## 🔄 Phase 4: App Structure & Navigation (Week 4-5)

### Expo Router Setup
```typescript
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@civicsense/shared/auth';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/[topicId]" options={{ title: 'Quiz' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
```

### Tab Navigation
```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="multiplayer"
        options={{
          title: 'Multiplayer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## 🛠 Phase 5: Development Workflow (Week 5-6)

### Package.json Scripts
```json
{
  "scripts": {
    "dev:web": "cd apps/web && npm run dev",
    "dev:mobile": "cd apps/mobile && npx expo start",
    "build:web": "cd apps/web && npm run build",
    "build:mobile:ios": "cd apps/mobile && eas build --platform ios",
    "build:mobile:android": "cd apps/mobile && eas build --platform android",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "type-check": "tsc --noEmit"
  }
}
```

### EAS Build Configuration
```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## 🚀 Phase 6: Key Features Implementation (Week 6-8)

### Priority Features for Mobile:
1. **Offline Quiz Capability** - Cache questions locally
2. **Push Notifications** - Quiz reminders and multiplayer invites
3. **Biometric Authentication** - Face ID / Fingerprint login
4. **Dark Mode Support** - Consistent with web app
5. **Accessibility** - Screen reader support, high contrast
6. **Deep Linking** - Share quiz results, multiplayer rooms

### Performance Optimizations:
- Image optimization with `expo-image`
- Bundle splitting for large features
- Lazy loading of quiz content
- Background sync for progress

## 📊 Success Metrics & Timeline

### Week 1-2: Foundation ✅
- [ ] Expo app initialized
- [ ] Shared packages structure
- [ ] Supabase mobile client configured

### Week 3-4: Core Features ✅
- [ ] Authentication flow
- [ ] Basic quiz functionality
- [ ] Mobile UI components

### Week 5-6: Polish & Testing ✅
- [ ] Navigation complete
- [ ] Offline capabilities
- [ ] Performance optimization

### Week 7-8: Launch Preparation ✅
- [ ] App store assets
- [ ] Beta testing
- [ ] Production deployment

## 🔧 Technical Considerations

### Code Sharing Strategy:
- **100% Shared**: Database types, API calls, business logic
- **Platform-Specific**: UI components, navigation, native features
- **Adapted**: Authentication (OAuth differences), storage (SecureStore vs localStorage)

### Build & Deployment:
- **Web**: Continue with Vercel
- **Mobile**: Use EAS Build for iOS/Android
- **CI/CD**: GitHub Actions for both platforms

This plan leverages your existing robust architecture while adding native mobile capabilities. The shared business logic approach means you'll maintain feature parity between web and mobile with minimal duplication.

Ready to start with Phase 1? I can help you implement any specific part of this plan!