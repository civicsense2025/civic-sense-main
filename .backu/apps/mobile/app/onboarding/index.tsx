import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { OnboardingService } from '../../lib/services';
import { supabase } from '../../lib/supabase';
import { DB_TABLES } from '../../lib/database-constants';
import { useTheme } from '../../lib/theme-context';
import { MaterialIcons } from '@expo/vector-icons';

// Basic components
import { Text } from '../../components/atoms/Text';
import { Button } from '../../components/Button';
import { Card } from '../../components/ui/Card';

interface OnboardingData {
  categories: string[];
  skills: string[];
  preferences: {
    learningPace: 'self_paced' | 'structured' | 'intensive';
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive';
    dailyGoal: number;
    reminderTime?: string;
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: 'welcome', title: 'Welcome to CivicSense' },
    { id: 'categories', title: 'Choose Your Interests' },
    { id: 'completion', title: 'All Set!' }
  ];

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const status = await OnboardingService.checkOnboardingStatus(user.id);
      if (status.isCompleted) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Save onboarding completion
      const { error } = await supabase
        .from(DB_TABLES.USER_ONBOARDING_STATE)
        .upsert({
          user_id: user.id,
          current_step: steps.length,
          completed_steps: steps.map(s => s.id),
          is_complete: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to complete onboarding. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepContent}>
              <MaterialIcons name="how-to-vote" size={64} color={theme.primary} />
              <Text variant="title1" style={styles.stepTitle}>
                Welcome to CivicSense
              </Text>
              <Text variant="body" color="secondary" style={styles.stepDescription}>
                Your journey to becoming a more informed citizen starts here. 
                Let's get you set up with personalized civic education content.
              </Text>
            </View>
          </Card>
        );
      
      case 1:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepContent}>
              <MaterialIcons name="category" size={64} color={theme.primary} />
              <Text variant="title1" style={styles.stepTitle}>
                Choose Your Interests
              </Text>
              <Text variant="body" color="secondary" style={styles.stepDescription}>
                We'll customize your learning experience based on the civic topics 
                that interest you most. Don't worry - you can change these later.
              </Text>
              
              <View style={styles.interestButtons}>
                <TouchableOpacity style={[styles.interestButton, { borderColor: theme.border }]}>
                  <Text>🏛️ Government</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.interestButton, { borderColor: theme.border }]}>
                  <Text>⚖️ Rights & Law</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.interestButton, { borderColor: theme.border }]}>
                  <Text>🗳️ Elections</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.interestButton, { borderColor: theme.border }]}>
                  <Text>💰 Economics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        );
      
      case 2:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepContent}>
              <MaterialIcons name="check-circle" size={64} color={theme.success} />
              <Text variant="title1" style={styles.stepTitle}>
                You're All Set!
              </Text>
              <Text variant="body" color="secondary" style={styles.stepDescription}>
                Welcome to CivicSense! You're now ready to start your civic education 
                journey. Let's begin with your personalized learning experience.
              </Text>
            </View>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={StyleSheet.flatten([styles.progressBar, { backgroundColor: theme.border }])}>
            <View 
              style={StyleSheet.flatten([
                styles.progressFill, 
                { 
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: theme.primary
                }
              ])} 
            />
          </View>
          <Text variant="caption" color="secondary" style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.navButton}
            />
          )}
          
          <Button
            title={currentStep === steps.length - 1 ? (isLoading ? "Setting up..." : "Get Started") : "Next"}
            onPress={handleNext}
            variant="primary"
            style={StyleSheet.flatten([styles.navButton, styles.nextButton])}
            disabled={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  stepCard: {
    padding: 24,
    marginBottom: 20,
  },
  stepContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  stepTitle: {
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  interestButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 20,
  },
  interestButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  nextButton: {
    // Additional styling for primary button if needed
  },
}); 