# CivicSense Mobile Setup: Immediate Implementation Guide

## 🚀 Quick Start (30 minutes)

### Prerequisites
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Install EAS CLI for builds
npm install -g eas-cli

# Login to Expo (create account if needed)
npx expo login
```

### Step 1: Create Expo App (5 minutes)
```bash
# From your project root
npx create-expo-app@latest mobile --template blank-typescript

# Navigate to mobile directory
cd mobile

# Install additional dependencies
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install @expo/vector-icons expo-font expo-splash-screen
npx expo install expo-secure-store expo-web-browser expo-auth-session
npx expo install @supabase/supabase-js
```

### Step 2: Configure Expo (10 minutes)
```typescript
// mobile/app.config.ts
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
    backgroundColor: '#3B82F6'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.civicsense.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3B82F6'
    },
    package: 'com.civicsense.app'
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-router',
    'expo-secure-store'
  ],
  experiments: {
    typedRoutes: true
  }
});
```

### Step 3: Setup Supabase Client (10 minutes)
```typescript
// mobile/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Custom storage adapter for Expo SecureStore
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

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Step 4: Environment Variables (2 minutes)
```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Basic App Structure (10 minutes)
```typescript
// mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
        <Stack.Screen name="index" options={{ title: 'CivicSense' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
```

```typescript
// mobile/app/index.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CivicSense Mobile!</Text>
      <Text style={styles.subtitle}>
        Civic education that politicians don't want you to have.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Start Learning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Browse Topics
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
});
```

### Step 6: Test Your Setup (3 minutes)
```bash
# Start the development server
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator  
# - Scan QR code with Expo Go app on your phone
```

## 🔄 Next Steps: Integrate with Existing CivicSense Logic

### Option A: Copy Existing Logic (Quick Start)
```bash
# Copy your existing types and utilities
cp ../lib/database.types.ts ./lib/
cp ../lib/quiz-database.ts ./lib/
cp ../lib/auth.ts ./lib/
```

### Option B: Create Shared Package (Recommended)
```bash
# Create shared package structure
mkdir -p ../packages/shared/{database,auth,quiz,utils}

# Move shared logic to packages
mv ../lib/database.types.ts ../packages/shared/database/
mv ../lib/quiz-database.ts ../packages/shared/quiz/
mv ../lib/auth.ts ../packages/shared/auth/
```

Then update your mobile app to import from shared packages:
```typescript
// mobile/lib/quiz.ts
import { QuizEngine } from '../../packages/shared/quiz/quiz-database';
import { supabase } from './supabase';

export const mobileQuizEngine = new QuizEngine(supabase);
```

## 📱 Essential Mobile Features to Implement Next

### 1. Authentication Screen
```typescript
// mobile/app/auth.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      alert(error.message);
    } else {
      router.replace('/');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In to CivicSense</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### 2. Simple Quiz Screen
```typescript
// mobile/app/quiz.tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

export default function QuizScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    // Load sample questions - replace with your actual query
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(5);

    if (data) {
      setQuestions(data);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    setTimeout(() => {
      if (answerIndex === questions[currentIndex].correct_answer) {
        setScore(score + 1);
      }
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading questions...</Text>
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.score}>
          Score: {score}/{questions.length}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentIndex(0);
            setScore(0);
            setShowResult(false);
            setSelectedAnswer(null);
          }}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.question}>
          {currentQuestion.question_text}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswer === index && styles.selectedOption,
            ]}
            onPress={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 32,
  },
  questionNumber: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  score: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
    color: '#3B82F6',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
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
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## 🎯 Development Workflow

### Daily Development
```bash
# Terminal 1: Run web app
npm run dev

# Terminal 2: Run mobile app  
cd mobile && npx expo start
```

### Testing on Devices
```bash
# Install Expo Go on your phone
# iOS: App Store
# Android: Play Store

# Scan QR code from expo start to test on real device
```

### Building for Production
```bash
# Setup EAS
cd mobile && eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android
```

## 🚨 Common Issues & Solutions

### 1. Environment Variables Not Loading
```typescript
// mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

### 2. Supabase Auth Issues
Make sure your Supabase project allows the mobile app domain in Auth settings.

### 3. TypeScript Errors
```bash
# Install type definitions
npm install --save-dev @types/react @types/react-native
```

## 🎉 Success Checklist

After completing this setup, you should have:
- [ ] Expo app running on simulator/device
- [ ] Supabase connection working
- [ ] Basic authentication flow
- [ ] Simple quiz functionality
- [ ] CivicSense branding and colors

**Next Phase**: Integrate your existing quiz engine, multiplayer features, and progress tracking!

This gets you a working mobile app in 30 minutes that you can immediately start testing and building upon. 