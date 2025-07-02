import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { spacing } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface ChallengePromptProps {
  title?: string | undefined;
  description: string;
  primaryButtonText: string;
  primaryButtonIcon?: keyof typeof Ionicons.glyphMap | undefined;
  onPrimaryPress: () => void;
  primaryButtonDisabled?: boolean;
  secondaryButtonText?: string | undefined;
  onSecondaryPress?: (() => void) | undefined;
  variant?: 'game' | 'topic';
}

export const ChallengePrompt: React.FC<ChallengePromptProps> = ({
  title = "Ready for the challenge? 🚀",
  description,
  primaryButtonText,
  primaryButtonIcon = "rocket",
  onPrimaryPress,
  primaryButtonDisabled = false,
  secondaryButtonText,
  onSecondaryPress,
  variant = 'game',
}) => {
  const { theme } = useTheme();
  
  const containerStyle = variant === 'game' 
    ? [styles.gameVariant, { 
        backgroundColor: `${theme.primary}08`,
        borderColor: `${theme.primary}20` 
      }]
    : [styles.topicVariant, { 
        backgroundColor: theme.background,
        borderColor: theme.primary 
      }];
  
  return (
    <View style={[styles.container, ...containerStyle]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: theme.foregroundSecondary }]}>
          {description}
        </Text>
        
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onPrimaryPress}
          disabled={primaryButtonDisabled}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.primaryButtonText}>
              {primaryButtonText}
            </Text>
            <Ionicons name={primaryButtonIcon} size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {secondaryButtonText && onSecondaryPress && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={onSecondaryPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              {secondaryButtonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
  },
  gameVariant: {
    borderStyle: 'dashed',
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  topicVariant: {
    borderStyle: 'dashed',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'HelveticaNeue',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 26,
  },
  description: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: 'SpaceMono-Bold',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    fontWeight: '500',
  },
}); 