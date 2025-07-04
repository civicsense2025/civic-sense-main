import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { useUIStrings, getLanguageDisplayName } from '../../lib/hooks/useUIStrings';
import { deepLTranslationService, type SupportedLanguage } from '../../lib/translation/deepl-service';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LanguageSelector } from '../../components/settings/LanguageSelector';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { EnhancedOnboardingService as OnboardingService, type OnboardingStatus } from '../../lib/services/onboarding-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  
  // Hooks with error handling
  const themeResult = useTheme();
  const authResult = useAuth();
  const uiStringsResult = useUIStrings();
  
  // Safely extract values with fallbacks
  const theme = themeResult?.theme || {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    border: '#E5E7EB',
    card: '#F9FAFB',
    foregroundSecondary: '#6B7280',
    foregroundTertiary: '#9CA3AF'
  };
  const isDark = themeResult?.isDark || false;
  const toggleTheme = themeResult?.toggleTheme || (() => {});
  
  const user = authResult?.user;
  const signOut = authResult?.signOut || (() => Promise.resolve());
  
  const currentLanguage = uiStringsResult?.currentLanguage || 'en';
  const uiStrings = uiStringsResult?.uiStrings || {
    settings: {
      title: 'Settings',
      language: 'Language',
      autoTranslateContent: 'Auto-translate content',
      autoTranslateContentDesc: 'Automatically translate quiz questions and lessons',
      preserveCivicTerms: 'Preserve civic terms',
      preserveCivicTermsDesc: 'Keep important civic terms accurate in translations',
      clearTranslationCache: 'Clear translation cache',
      clearTranslationCacheDesc: 'Reset saved translations to get fresh content',
      translationCacheCleared: 'Translation cache cleared successfully',
      translationCacheClearError: 'Failed to clear translation cache',
    },
    translation: {
      selectLanguage: 'Select Language',
      languagePreferenceSaved: 'Your language preference will be saved for future visits',
    },
    status: {
      success: 'Success',
      error: 'Error',
    },
    actions: {
      cancel: 'Cancel',
    },
  };
  const setUILanguage = uiStringsResult?.setUILanguage || (async () => {});
  const isLoadingUIStrings = uiStringsResult?.isLoading || false;
  
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  
  // Translation settings state
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [preserveCivicTerms, setPreserveCivicTerms] = useState(true);
  const [translationQuality, setTranslationQuality] = useState<'standard' | 'high'>('standard');
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeSettings = async () => {
              try {
          // Temporarily disable onboarding check until service is fixed
          // if (user?.id) {
          //   await checkOnboardingStatus();
          // }
          await loadTranslationSettings();
          await loadAvailableLanguages();
        } catch (error) {
          console.error('Error initializing settings:', error);
        } finally {
          setIsInitializing(false);
        }
    };
    
    initializeSettings();
  }, [user?.id]);

  // Temporarily disabled until OnboardingService is fixed
  // const checkOnboardingStatus = async () => {
  //   if (!user?.id) return;
  //   try {
  //     const progress = await OnboardingService.loadProgress(user.id);
  //     if (progress) {
  //       setOnboardingStatus({
  //         isCompleted: false,
  //         currentStep: 1,
  //         totalSteps: 5,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error checking onboarding status:', error);
  //   }
  // };

  const loadTranslationSettings = async () => {
    try {
      const autoTranslate = await AsyncStorage.getItem('auto_translate_enabled');
      const civicTerms = await AsyncStorage.getItem('preserve_civic_terms');
      const quality = await AsyncStorage.getItem('translation_quality');
      
      if (autoTranslate !== null) setAutoTranslateEnabled(JSON.parse(autoTranslate));
      if (civicTerms !== null) setPreserveCivicTerms(JSON.parse(civicTerms));
      if (quality) setTranslationQuality(quality as 'standard' | 'high');
    } catch (error) {
      console.warn('Failed to load translation settings:', error);
    }
  };

  const loadAvailableLanguages = async () => {
    try {
      const languages = deepLTranslationService.getAvailableLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      console.warn('Failed to load available languages:', error);
    }
  };

  const saveTranslationSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key}:`, error);
    }
  };

  const handleLanguageChange = () => {
    setShowLanguageSelector(true);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await setUILanguage(languageCode);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const handleAutoTranslateToggle = (value: boolean) => {
    setAutoTranslateEnabled(value);
    saveTranslationSetting('auto_translate_enabled', value);
  };

  const handleCivicTermsToggle = (value: boolean) => {
    setPreserveCivicTerms(value);
    saveTranslationSetting('preserve_civic_terms', value);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  // Show loading state while initializing
  if (isInitializing || isLoadingUIStrings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ marginTop: spacing.md, color: theme.foregroundSecondary }}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const settingsGroups = [
    {
      title: (uiStrings.settings?.language || 'Language') + ' & Translation',
      items: [
        {
          id: 'ui-language',
          title: uiStrings.settings?.language || 'Language',
          subtitle: `Current: ${getLanguageDisplayName(currentLanguage, currentLanguage)}`,
          type: 'navigation',
          onPress: handleLanguageChange,
        },
        {
          id: 'auto-translate',
          title: uiStrings.settings?.autoTranslateContent || 'Auto-translate content',
          subtitle: uiStrings.settings?.autoTranslateContentDesc || 'Automatically translate quiz questions and lessons',
          type: 'switch',
          value: autoTranslateEnabled,
          onToggle: handleAutoTranslateToggle,
        },
        {
          id: 'preserve-civic-terms',
          title: uiStrings.settings?.preserveCivicTerms || 'Preserve civic terms',
          subtitle: uiStrings.settings?.preserveCivicTermsDesc || 'Keep important civic terms accurate in translations',
          type: 'switch',
          value: preserveCivicTerms,
          onToggle: handleCivicTermsToggle,
        },
        {
          id: 'translation-cache',
          title: uiStrings.settings?.clearTranslationCache || 'Clear translation cache',
          subtitle: uiStrings.settings?.clearTranslationCacheDesc || 'Reset saved translations to get fresh content',
          type: 'action',
          onPress: async () => {
            try {
              await deepLTranslationService.clearCache();
              Alert.alert(
                uiStrings.status?.success || 'Success',
                uiStrings.settings?.translationCacheCleared || 'Translation cache cleared successfully'
              );
            } catch (error) {
              Alert.alert(
                uiStrings.status?.error || 'Error',
                uiStrings.settings?.translationCacheClearError || 'Failed to clear translation cache'
              );
            }
          },
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Toggle between light and dark themes',
          type: 'switch',
          value: isDark,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive quiz reminders and updates',
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'sound',
          title: 'Sound Effects',
          subtitle: 'Play sounds during quizzes',
          type: 'switch',
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          type: 'navigation',
          onPress: () => {
            router.push('/settings/edit-profile' as any);
          },
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Manage your data and privacy preferences',
          type: 'navigation',
          onPress: () => {
            router.push('/settings/privacy' as any);
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & FAQ',
          subtitle: 'Get answers to common questions',
          type: 'navigation',
          onPress: () => {
            router.push('/support/help' as any);
          },
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve CivicSense',
          type: 'navigation',
          onPress: () => {
            router.push('/support/feedback' as any);
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    if (item.type === 'switch') {
      return (
        <Card key={item.id} style={styles.settingCard} variant="outlined">
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text variant="callout" color="inherit" style={styles.settingTitle}>
                {item.title}
              </Text>
              <Text variant="footnote" color="secondary" style={styles.settingSubtitle}>
                {item.subtitle}
              </Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>
      );
    }

    if (item.type === 'navigation' || item.type === 'action') {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.settingButton}
          onPress={item.onPress}
          activeOpacity={0.8}
        >
          <Card style={styles.settingCard} variant="outlined">
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text variant="callout" color="inherit" style={styles.settingTitle}>
                  {item.title}
                </Text>
                <Text variant="footnote" color="secondary" style={styles.settingSubtitle}>
                  {item.subtitle}
                </Text>
              </View>
              {item.type === 'navigation' && (
                <Text variant="title3" color="secondary" style={styles.chevron}>
                  ›
                </Text>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary">
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text variant="title" color="inherit" style={styles.headerTitle}>
            Settings
          </Text>
          <Text variant="body" color="secondary" style={styles.headerSubtitle}>
            Customize your CivicSense experience
          </Text>
        </View>

        {/* Onboarding Prompt */}
        {onboardingStatus && !onboardingStatus.isCompleted && (
          <View style={styles.onboardingPrompt}>
            <TouchableOpacity
              style={styles.onboardingButton}
              onPress={() => router.push('/onboarding' as any)}
              activeOpacity={0.8}
            >
              <Card 
                style={{
                  ...styles.onboardingCard,
                  backgroundColor: theme.primary + '10',
                  borderColor: theme.primary
                }} 
                variant="outlined"
              >
                <View style={styles.onboardingContent}>
                  <View style={styles.onboardingHeader}>
                    <Text variant="callout" weight="600" style={[styles.onboardingTitle, { color: theme.primary }]}>
                      🎯 Complete Your Profile
                    </Text>
                    <View style={[styles.progressBadge, { backgroundColor: theme.primary + '20' }]}>
                      <Text variant="footnote" weight="600" style={{ color: theme.primary }}>
                        {onboardingStatus.currentStep}/{onboardingStatus.totalSteps}
                      </Text>
                    </View>
                  </View>
                  <Text variant="footnote" color="secondary" style={styles.onboardingDescription}>
                    Personalize your learning experience by completing the onboarding process
                  </Text>
                  <View style={styles.onboardingProgress}>
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            backgroundColor: theme.primary,
                            width: `${(onboardingStatus.currentStep / onboardingStatus.totalSteps) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    <Text variant="caption" color="secondary" style={styles.progressText}>
                      {Math.round((onboardingStatus.currentStep / onboardingStatus.totalSteps) * 100)}% complete
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingGroup}>
            <Text variant="title3" color="inherit" style={styles.groupTitle}>
              {group.title}
            </Text>
            <View style={styles.groupItems}>
              {group.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        {user && (
          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Card style={styles.signOutCard} variant="outlined">
                <Text variant="callout" style={[styles.signOutText, { color: '#EF4444' }]}>
                  Sign Out
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '300',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: fontFamily.text,
  },
  settingGroup: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  groupTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  groupItems: {
    gap: spacing.sm,
  },
  settingCard: {
    padding: spacing.md,
  },
  settingButton: {
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },
  chevron: {
    fontFamily: fontFamily.text,
    fontWeight: '300',
  },
  signOutSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  signOutButton: {
    width: '100%',
  },
  signOutCard: {
    padding: spacing.md,
    alignItems: 'center',
    borderColor: '#EF4444',
  },
  signOutText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  onboardingPrompt: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  onboardingButton: {
    width: '100%',
  },
  onboardingCard: {
    padding: spacing.lg,
  },
  onboardingContent: {
    gap: spacing.sm,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  onboardingTitle: {
    fontFamily: fontFamily.text,
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  onboardingDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
  onboardingProgress: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontFamily: fontFamily.text,
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 