import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing } from '../../lib/theme';

export default function OnboardingCompleteScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleGetStarted = () => {
    // Mark onboarding as complete and redirect to main app
    router.replace('/(tabs)/' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Success Content */}
        <View style={styles.successContent}>
          <Text style={styles.successEmoji}>
            🎯
          </Text>
          
          <Text variant="title1" color="inherit" style={styles.successTitle}>
            You're all set!
          </Text>
          
          <Text variant="body" color="secondary" style={styles.successSubtitle}>
            Your personalized civic learning experience is ready. Let's start exploring democracy together!
          </Text>

          {/* Next Steps */}
          <View style={styles.nextStepsSection}>
            <Text variant="headline" color="inherit" style={styles.nextStepsTitle}>
              What's next?
            </Text>
            
            <View style={styles.stepsList}>
              <Card style={styles.stepCard} variant="outlined">
                <View style={styles.stepContent}>
                  <Text style={styles.stepIcon}>📚</Text>
                  <View style={styles.stepText}>
                    <Text variant="callout" color="inherit">Take your first quiz</Text>
                    <Text variant="footnote" color="secondary">Start with topics you selected</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.stepCard} variant="outlined">
                <View style={styles.stepContent}>
                  <Text style={styles.stepIcon}>🏆</Text>
                  <View style={styles.stepText}>
                    <Text variant="callout" color="inherit">Earn achievements</Text>
                    <Text variant="footnote" color="secondary">Track your civic knowledge growth</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.stepCard} variant="outlined">
                <View style={styles.stepContent}>
                  <Text style={styles.stepIcon}>👥</Text>
                  <View style={styles.stepText}>
                    <Text variant="callout" color="inherit">Challenge friends</Text>
                    <Text variant="footnote" color="secondary">Compete in multiplayer quizzes</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </View>

        {/* Action */}
        <View style={styles.actions}>
          <Button
            title="Start Learning"
            onPress={handleGetStarted}
            style={styles.startButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  nextStepsSection: {
    width: '100%',
  },
  nextStepsTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepCard: {
    padding: spacing.md,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepText: {
    flex: 1,
  },
  actions: {
    paddingBottom: spacing.lg,
  },
  startButton: {
    width: '100%',
  },
}); 