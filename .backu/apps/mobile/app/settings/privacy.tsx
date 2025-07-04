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
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { AppHeader } from '../../components/ui/AppHeader';
import { Button } from '../../components/Button';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showProgressToOthers: boolean;
  showAchievements: boolean;
  allowFriendRequests: boolean;
  shareDataForResearch: boolean;
  emailNotifications: {
    newsletters: boolean;
    productUpdates: boolean;
    communityDigest: boolean;
  };
  dataSharing: {
    analytics: boolean;
    crashReports: boolean;
    performanceData: boolean;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  // ============================================================================
  // STATE
  // ============================================================================

  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showProgressToOthers: true,
    showAchievements: true,
    allowFriendRequests: true,
    shareDataForResearch: false,
    emailNotifications: {
      newsletters: true,
      productUpdates: true,
      communityDigest: false,
    },
    dataSharing: {
      analytics: true,
      crashReports: true,
      performanceData: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadPrivacySettings();
  }, [user?.id]);

  useEffect(() => {
    // Check if settings have changed
    if (originalSettings) {
      const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(hasChanged);
    }
  }, [settings, originalSettings]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadPrivacySettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load from secure storage first
      const savedSettings = await SecureStore.getItemAsync('privacy_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setOriginalSettings(parsed);
      } else {
        // Load from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('privacy_settings')
          .eq('user_id', user.id)
          .single();

        if (data?.privacy_settings) {
          setSettings(data.privacy_settings);
          setOriginalSettings(data.privacy_settings);
          // Cache in secure storage
          await SecureStore.setItemAsync('privacy_settings', JSON.stringify(data.privacy_settings));
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!user?.id || !hasChanges) return;

    setSaving(true);
    try {
      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_settings: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Save to secure storage
      await SecureStore.setItemAsync('privacy_settings', JSON.stringify(settings));

      setOriginalSettings(settings);
      Alert.alert(
        'Privacy Settings Updated',
        'Your privacy preferences have been saved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive', 
            onPress: () => {
              if (originalSettings) {
                setSettings(originalSettings);
              }
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <
    K extends keyof PrivacySettings,
    NK extends keyof PrivacySettings[K]
  >(
    parentKey: K,
    nestedKey: NK,
    value: PrivacySettings[K][NK]
  ) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [nestedKey]: value,
      },
    }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Proceed', style: 'destructive', onPress: deleteAccount }
              ]
            );
          }
        }
      ]
    );
  };

  const deleteAccount = async () => {
    // Implementation would go here
    Alert.alert('Account deletion is not implemented in demo mode');
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your CivicSense data. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: exportUserData }
      ]
    );
  };

  const exportUserData = async () => {
    // Implementation would go here
    Alert.alert('Data Export', 'Your data export has been initiated. You\'ll receive an email when it\'s ready.');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader 
          title="Privacy Settings"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader 
        title="Privacy Settings"
        showBack
        onBack={handleCancel}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Profile Visibility */}
        <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
          <View style={styles.sectionHeader}>
            <Text variant="callout" weight="600">Profile Visibility</Text>
            <Text variant="footnote" color="secondary">
              Control who can see your profile and progress
            </Text>
          </View>

          <View style={styles.radioGroup}>
            {['public', 'friends', 'private'].map((visibility) => (
              <TouchableOpacity
                key={visibility}
                style={styles.radioOption}
                onPress={() => updateSetting('profileVisibility', visibility as any)}
              >
                <View style={styles.radioButton}>
                  {settings.profileVisibility === visibility && (
                    <View style={[styles.radioButtonInner, { backgroundColor: theme.primary }]} />
                  )}
                </View>
                <View style={styles.radioContent}>
                  <Text variant="body" weight={settings.profileVisibility === visibility ? '600' : '400'}>
                    {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {visibility === 'public' && 'Anyone can view your profile'}
                    {visibility === 'friends' && 'Only friends can view your profile'}
                    {visibility === 'private' && 'Nobody can view your profile'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchSection}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateSetting('showProgressToOthers', !settings.showProgressToOthers)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Show Learning Progress</Text>
                <Text variant="caption" color="secondary">
                  Let others see your quiz scores and streaks
                </Text>
              </View>
              <Switch
                value={settings.showProgressToOthers}
                onValueChange={(value) => updateSetting('showProgressToOthers', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.showProgressToOthers ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateSetting('showAchievements', !settings.showAchievements)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Display Achievements</Text>
                <Text variant="caption" color="secondary">
                  Show your badges and milestones on your profile
                </Text>
              </View>
              <Switch
                value={settings.showAchievements}
                onValueChange={(value) => updateSetting('showAchievements', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.showAchievements ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateSetting('allowFriendRequests', !settings.allowFriendRequests)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Allow Friend Requests</Text>
                <Text variant="caption" color="secondary">
                  Let other users send you friend requests
                </Text>
              </View>
              <Switch
                value={settings.allowFriendRequests}
                onValueChange={(value) => updateSetting('allowFriendRequests', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.allowFriendRequests ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Email Preferences */}
        <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
          <View style={styles.sectionHeader}>
            <Text variant="callout" weight="600">Email Preferences</Text>
            <Text variant="footnote" color="secondary">
              Manage your email communication settings
            </Text>
          </View>

          <View style={styles.switchSection}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateNestedSetting('emailNotifications', 'newsletters', !settings.emailNotifications.newsletters)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Newsletters</Text>
                <Text variant="caption" color="secondary">
                  Receive our monthly civic education newsletter
                </Text>
              </View>
              <Switch
                value={settings.emailNotifications.newsletters}
                onValueChange={(value) => updateNestedSetting('emailNotifications', 'newsletters', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.emailNotifications.newsletters ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateNestedSetting('emailNotifications', 'productUpdates', !settings.emailNotifications.productUpdates)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Product Updates</Text>
                <Text variant="caption" color="secondary">
                  Get notified about new features and improvements
                </Text>
              </View>
              <Switch
                value={settings.emailNotifications.productUpdates}
                onValueChange={(value) => updateNestedSetting('emailNotifications', 'productUpdates', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.emailNotifications.productUpdates ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateNestedSetting('emailNotifications', 'communityDigest', !settings.emailNotifications.communityDigest)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Community Digest</Text>
                <Text variant="caption" color="secondary">
                  Weekly summary of community activity
                </Text>
              </View>
              <Switch
                value={settings.emailNotifications.communityDigest}
                onValueChange={(value) => updateNestedSetting('emailNotifications', 'communityDigest', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.emailNotifications.communityDigest ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Data Sharing */}
        <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
          <View style={styles.sectionHeader}>
            <Text variant="callout" weight="600">Data & Analytics</Text>
            <Text variant="footnote" color="secondary">
              Help us improve CivicSense with anonymous data
            </Text>
          </View>

          <View style={styles.switchSection}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateSetting('shareDataForResearch', !settings.shareDataForResearch)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Contribute to Research</Text>
                <Text variant="caption" color="secondary">
                  Share anonymized learning data for civic education research
                </Text>
              </View>
              <Switch
                value={settings.shareDataForResearch}
                onValueChange={(value) => updateSetting('shareDataForResearch', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.shareDataForResearch ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateNestedSetting('dataSharing', 'analytics', !settings.dataSharing.analytics)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Usage Analytics</Text>
                <Text variant="caption" color="secondary">
                  Help us understand how you use the app
                </Text>
              </View>
              <Switch
                value={settings.dataSharing.analytics}
                onValueChange={(value) => updateNestedSetting('dataSharing', 'analytics', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.dataSharing.analytics ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => updateNestedSetting('dataSharing', 'crashReports', !settings.dataSharing.crashReports)}
            >
              <View style={styles.switchContent}>
                <Text variant="body">Crash Reports</Text>
                <Text variant="caption" color="secondary">
                  Automatically send crash reports to help us fix issues
                </Text>
              </View>
              <Switch
                value={settings.dataSharing.crashReports}
                onValueChange={(value) => updateNestedSetting('dataSharing', 'crashReports', value)}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={settings.dataSharing.crashReports ? theme.primary : '#f4f3f4'}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Data Management */}
        <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
          <View style={styles.sectionHeader}>
            <Text variant="callout" weight="600">Data Management</Text>
            <Text variant="footnote" color="secondary">
              Control your personal data
            </Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Text variant="body" style={{ color: theme.primary }}>
              Export My Data
            </Text>
            <Text style={[styles.chevron, { color: theme.primary }]}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
            <Text variant="body" style={{ color: '#EF4444' }}>
              Delete Account
            </Text>
            <Text style={[styles.chevron, { color: '#EF4444' }]}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <View style={styles.buttonContainer}>
            <Button
              title={saving ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              variant="primary"
              style={styles.saveButton}
              disabled={saving}
              loading={saving}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },

  // Radio Group
  radioGroup: {
    marginTop: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioContent: {
    flex: 1,
  },

  // Switch Section
  switchSection: {
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },

  // Other
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  saveButton: {
    width: '100%',
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
}); 