import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'

// Import step components
import { WelcomeStep } from '../../components/onboarding/welcome-step'
import { CategorySelectionStep } from '../../components/onboarding/category-selection-step'
import { SkillSelectionStep } from '../../components/onboarding/skill-selection-step'
import { PreferencesStep } from '../../components/onboarding/preferences-step'

// Import onboarding service directly (no more dynamic loading)
import { EnhancedOnboardingService } from '../../lib/services/onboarding-service'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingData {
  welcome?: any
  categories?: any[]
  skills?: any[]
  preferences?: any
}

export default function OnboardingFlow() {
  const { user } = useAuth()

  // ✅ ONBOARDING DISABLED - Auto-skip to main app
  useEffect(() => {
    console.log('🚀 Onboarding disabled - redirecting to main app')
    
    // Always redirect to main app immediately
    const redirectToMainApp = async () => {
      try {
        // Mark onboarding as complete for the user if they're logged in
        if (user?.id) {
          await EnhancedOnboardingService.markOnboardingComplete(user.id)
          console.log('✅ Onboarding marked as complete for user:', user.id)
        }
      } catch (error) {
        console.warn('⚠️ Could not mark onboarding complete, but continuing anyway:', error)
      }
      
      // Navigate to main app
      router.replace('/(tabs)')
    }

    redirectToMainApp()
  }, [user?.id])

  // Show a simple loading screen while redirecting
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Setting up your experience...</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
}) 