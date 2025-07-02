import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { useUIStrings } from '../../hooks/useUIStrings';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, borderRadius, responsiveFontSizes } from '../../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingWelcomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { getString } = useUIStrings();

  const handleGetStarted = () => {
    router.push('/onboarding/interests');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text variant="callout" color="secondary">{getString('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Content */}
        <View style={styles.welcomeContent}>
          <Text style={[styles.welcomeEmoji, { color: theme.primary }]}>
            🎉
          </Text>
          
          <Text variant="title1" color="inherit" style={styles.welcomeTitle}>
            {getString('onboarding.welcome')}
          </Text>
          
          <Text variant="body" color="secondary" style={styles.welcomeSubtitle}>
            {getString('onboarding.welcomeSubtitle')}
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <Card style={styles.featureCard} variant="outlined">
              <Text style={styles.featureIcon}>🧠</Text>
              <Text variant="callout" color="inherit" style={styles.featureTitle}>
                {getString('onboarding.personalizedLearning')}
              </Text>
              <Text variant="footnote" color="secondary" style={styles.featureDescription}>
                {getString('onboarding.personalizedLearningDesc')}
              </Text>
            </Card>

            <Card style={styles.featureCard} variant="outlined">
              <Text style={styles.featureIcon}>📊</Text>
              <Text variant="callout" color="inherit" style={styles.featureTitle}>
                {getString('onboarding.trackProgress')}
              </Text>
              <Text variant="footnote" color="secondary" style={styles.featureDescription}>
                {getString('onboarding.trackProgressDesc')}
              </Text>
            </Card>

            <Card style={styles.featureCard} variant="outlined">
              <Text style={styles.featureIcon}>👥</Text>
              <Text variant="callout" color="inherit" style={styles.featureTitle}>
                {getString('onboarding.learnTogether')}
              </Text>
              <Text variant="footnote" color="secondary" style={styles.featureDescription}>
                {getString('onboarding.learnTogetherDesc')}
              </Text>
            </Card>

            <Card style={styles.featureCard} variant="outlined">
              <Text style={styles.featureIcon}>🏆</Text>
              <Text variant="callout" color="inherit" style={styles.featureTitle}>
                {getString('onboarding.earnAchievements')}
              </Text>
              <Text variant="footnote" color="secondary" style={styles.featureDescription}>
                {getString('onboarding.earnAchievementsDesc')}
              </Text>
            </Card>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={getString('onboarding.getStarted')}
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          />
          
          <TouchableOpacity
            style={styles.skipTextButton}
            onPress={handleSkip}
          >
            <Text variant="callout" color="secondary">
              {getString('onboarding.exploreOnOwn')}
            </Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'flex-end',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  skipButton: {
    padding: spacing.sm,
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeEmoji: {
    fontSize: responsiveFontSizes.emojiExtraLarge,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: responsiveFontSizes.emojiSmall,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    textAlign: 'center',
    lineHeight: 16,
  },
  actions: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  getStartedButton: {
    width: '100%',
  },
  skipTextButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
}); 