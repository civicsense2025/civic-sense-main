import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../atoms/Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import useUIStrings from '../../lib/hooks/useUIStrings';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

/**
 * Example Component: LocalizedComponent
 * 
 * This component demonstrates best practices for integrating the UI strings system
 * into CivicSense components. Use this as a reference for converting existing 
 * components and creating new ones.
 * 
 * Key principles:
 * 1. Import and use the useUIStrings hook
 * 2. Replace all hardcoded user-facing text with uiStrings references
 * 3. Use consistent language switching throughout the app
 * 4. Provide accessible labels using UI strings
 * 5. Handle alerts and confirmations with localized text
 */

interface LocalizedComponentProps {
  title?: string;
  showLanguageSelector?: boolean;
  onLanguageChange?: (languageCode: string) => void;
}

export const LocalizedComponent: React.FC<LocalizedComponentProps> = ({
  title,
  showLanguageSelector = true,
  onLanguageChange,
}) => {
  const { theme } = useTheme();
  const { uiStrings, currentLanguage, setUILanguage } = useUIStrings();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Example of using UI strings for dynamic content
  const getWelcomeMessage = () => {
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 12) {
      return `${uiStrings.actions.continue} - Good morning!`; // You'd add morning/afternoon strings
    } else if (timeOfDay < 18) {
      return `${uiStrings.actions.continue} - Good afternoon!`;
    } else {
      return `${uiStrings.actions.continue} - Good evening!`;
    }
  };

  // Example of localized alert handling
  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      Alert.alert(
        uiStrings.accessibility.removeBookmark,
        'Are you sure you want to remove this bookmark?', // You'd add this to UI strings
        [
          {
            text: uiStrings.actions.cancel,
            style: 'cancel'
          },
          {
            text: uiStrings.actions.delete,
            style: 'destructive',
            onPress: () => {
              setIsBookmarked(false);
              Alert.alert(
                uiStrings.status.success,
                'Bookmark removed successfully' // You'd add this to UI strings
              );
            }
          }
        ]
      );
    } else {
      setIsBookmarked(true);
      Alert.alert(
        uiStrings.status.success,
        'Topic bookmarked successfully!' // You'd add this to UI strings
      );
    }
  };

  // Example of language switching
  const handleLanguageSwitch = (languageCode: string) => {
    Alert.alert(
      uiStrings.translation.selectLanguage,
      `Switch to ${languageCode.toUpperCase()}?`, // You'd improve this with language names
      [
        { text: uiStrings.actions.cancel, style: 'cancel' },
        {
          text: uiStrings.actions.confirm,
          onPress: () => {
            setUILanguage(languageCode);
            onLanguageChange?.(languageCode);
            Alert.alert(
              uiStrings.status.success,
              uiStrings.translation.languagePreferenceSaved
            );
          }
        }
      ]
    );
  };

  // Example of loading state with UI strings
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(uiStrings.status.success, uiStrings.status.completed);
    } catch (error) {
      Alert.alert(
        uiStrings.status.error,
        uiStrings.errors.networkError
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with localized title */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          {title || uiStrings.navigation.home}
        </Text>
        {showLanguageSelector && (
          <TouchableOpacity
            style={[styles.languageButton, { backgroundColor: theme.card }]}
            onPress={() => {
              // Show language selection - this would open a modal
              Alert.alert(
                uiStrings.translation.selectLanguage,
                'Choose your language', // You'd add this to UI strings
                [
                  { text: 'English', onPress: () => handleLanguageSwitch('en') },
                  { text: 'Español', onPress: () => handleLanguageSwitch('es') },
                  { text: uiStrings.actions.cancel, style: 'cancel' }
                ]
              );
            }}
            accessibilityLabel={uiStrings.accessibility.languageSelector}
          >
            <Ionicons name="language" size={20} color={theme.primary} />
            <Text style={[styles.languageText, { color: theme.foreground }]}>
              {currentLanguage.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Welcome section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            {getWelcomeMessage()}
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.foregroundSecondary }]}>
            This component demonstrates how to integrate UI strings throughout your app.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleBookmarkToggle}
            accessibilityLabel={
              isBookmarked 
                ? uiStrings.accessibility.removeBookmark
                : uiStrings.accessibility.bookmark
            }
          >
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.actionButtonText}>
              {isBookmarked ? uiStrings.topic.removeBookmark : uiStrings.topic.bookmark}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleRefresh}
            disabled={isLoading}
            accessibilityLabel={uiStrings.actions.refresh}
          >
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonTextSecondary, { color: theme.primary }]}>
              {isLoading ? uiStrings.status.loading : uiStrings.actions.refresh}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status section */}
        <View style={[styles.statusSection, { backgroundColor: theme.primary + '10' }]}>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.statusText, { color: theme.foreground }]}>
              {uiStrings.status.online}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="language" size={16} color={theme.primary} />
            <Text style={[styles.statusText, { color: theme.foreground }]}>
              {uiStrings.languages.english} {/* You'd improve this to show current language name */}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="time" size={16} color={theme.foregroundSecondary} />
            <Text style={[styles.statusText, { color: theme.foreground }]}>
              {uiStrings.time.now}
            </Text>
          </View>
        </View>

        {/* Best practices info */}
        <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.primary }]}>
            🌍 UI Strings Integration Best Practices
          </Text>
          <View style={styles.practicesList}>
            {[
              'Import useUIStrings hook at the top',
              'Replace ALL user-facing text with uiStrings references',
              'Use proper accessibility labels from UI strings',
              'Handle alerts and confirmations with localized text',
              'Provide context for dynamic content',
              'Test with different languages to ensure layout works'
            ].map((practice, index) => (
              <View key={index} style={styles.practiceItem}>
                <Text style={[styles.practiceBullet, { color: theme.primary }]}>•</Text>
                <Text style={[styles.practiceText, { color: theme.foregroundSecondary }]}>
                  {practice}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.display,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonTextSecondary: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  practicesList: {
    gap: spacing.sm,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  practiceBullet: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 1,
  },
  practiceText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
}); 