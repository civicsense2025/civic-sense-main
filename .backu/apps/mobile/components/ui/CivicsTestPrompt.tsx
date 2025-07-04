import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CivicsTestPromptProps {
  onStartTest?: () => void;
  hasIncompleteTest?: boolean;
  progressPercentage?: number;
  compact?: boolean;
}

export const CivicsTestPrompt: React.FC<CivicsTestPromptProps> = ({
  onStartTest,
  hasIncompleteTest = false,
  progressPercentage = 0,
  compact = false,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onStartTest) {
      onStartTest();
    } else {
      router.push('/civics-test' as any);
    }
  };

  const getPromptContent = () => {
    if (hasIncompleteTest) {
      return {
        title: 'Continue Your Civics Test',
        subtitle: `${progressPercentage}% complete - Pick up where you left off`,
        buttonText: 'Continue Test',
        icon: 'play-circle',
        gradient: ['#3B82F6', '#1E40AF'], // Blue gradient for continue
      };
    }
    
    return {
      title: 'Test Your Civic Knowledge',
      subtitle: 'Take the comprehensive civics assessment to see how well you understand American democracy',
      buttonText: 'Start Civics Test',
      icon: 'school',
      gradient: ['#059669', '#047857'], // Green gradient for start
    };
  };

  const content = getPromptContent();

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View style={[styles.compactIconContainer, { backgroundColor: content.gradient[0] + '15' }]}>
              <Ionicons name={content.icon as any} size={24} color={content.gradient[0]} />
            </View>
            <View style={styles.compactTextContainer}>
              <Text style={[styles.compactTitle, { color: theme.foreground }]} numberOfLines={1}>
                {content.title}
              </Text>
              <Text style={[styles.compactSubtitle, { color: theme.foregroundSecondary }]} numberOfLines={1}>
                {content.subtitle}
              </Text>
            </View>
          </View>
          
          {hasIncompleteTest && (
            <View style={styles.compactProgress}>
              <View style={[styles.compactProgressBar, { backgroundColor: theme.border + '30' }]}>
                <View
                  style={[
                    styles.compactProgressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: content.gradient[0],
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={theme.foregroundSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.card} activeOpacity={0.9}>
      <LinearGradient
        colors={content.gradient as [string, string]}
        style={styles.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={content.icon as any} size={32} color="#FFFFFF" />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {content.title}
              </Text>
              <Text style={styles.subtitle}>
                {content.subtitle}
              </Text>
            </View>
          </View>

          {hasIncompleteTest && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  Progress
                </Text>
                <Text style={styles.progressValue}>
                  {progressPercentage}% Complete
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          <View style={styles.actionSection}>
            <View style={styles.buttonContainer}>
              <Text style={styles.buttonText}>
                {content.buttonText}
              </Text>
            </View>
            
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }]}>
                <Text style={styles.badgeText}>
                  {hasIncompleteTest ? 'RESUME' : 'FREE'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: spacing.md,
  },
  gradientCard: {
    padding: spacing.lg,
    position: 'relative',
    minHeight: 140,
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.title3,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: typography.footnote.fontSize * 1.4,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  progressValue: {
    ...typography.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  buttonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },

  // Decorative elements
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  compactSubtitle: {
    ...typography.footnote,
  },
  compactProgress: {
    marginTop: spacing.xs,
  },
  compactProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
}); 