import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  fetchCategories,
  type StandardCategory,
} from '../../lib/standardized-data-service';
import { SkillsService, type SkillsByCategory } from '../../lib/services/skills-service';
import { UserPreferencesService } from '../../lib/services/user-preferences-service';
import { LearningExportService } from '../../lib/services/learning-export-service';
import { useUIStrings } from '../../lib/hooks/useUIStrings';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProfileFormData {
  fullName: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  website: string;
  country: string;
  stateProvince: string;
  city: string;
}

interface PlatformPreferences {
  learningPace: 'self_paced' | 'structured' | 'intensive';
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  preferredQuizLength: number;
  studyTimePreference: 'morning' | 'afternoon' | 'evening' | 'any_time';
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  achievementNotifications: boolean;
  showExplanations: boolean;
  showDifficultyIndicators: boolean;
  showSources: boolean;
  showAchievements: boolean;
  showStreaks: boolean;
  showLeaderboards: boolean;
  competitiveMode: boolean;
  // Accessibility
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
}

interface CategoryInterest {
  categoryId: string;
  interestLevel: number; // 1-5 scale
  learningGoal?: string;
}

interface SkillPreference {
  skillId: string;
  interestLevel: number; // 1-5 scale
  targetMasteryLevel?: number | undefined;
  learningTimeline?: string | undefined;
}

// ============================================================================
// CUSTOM HEADER COMPONENT
// ============================================================================

interface CustomHeaderProps {
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

// Helper function to format enum values for display
const formatEnumValueForDisplay = (value: string): string => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ hasChanges, saving, onSave, onCancel }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={[styles.headerButtonText, { color: theme.foregroundSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          Edit Profile
        </Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { 
              backgroundColor: hasChanges ? theme.primary : theme.border,
              opacity: saving ? 0.7 : 1 
            }
          ]}
          onPress={onSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              { color: hasChanges ? '#FFFFFF' : theme.foregroundTertiary }
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {hasChanges && !saving && (
        <View style={[styles.changesIndicator, { backgroundColor: theme.primary }]}>
          <View style={styles.changesIndicatorDot} />
          <Text style={styles.changesIndicatorText}>
            You have unsaved changes
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditProfileScreen() {
  const router = useRouter();
  
  // Hooks with error handling and fallbacks
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
  
  const user = authResult?.user;
  const profile = authResult?.profile;
  const updateProfile = authResult?.updateProfile || (async () => ({ error: null }));
  
  // Safe getString function with fallbacks
  const getString = (key: string): string => {
    const fallbackStrings: Record<string, string> = {
      'errors.error': 'Error',
      'settings.fullNameRequired': 'Full name is required',
      'settings.profileUpdated': 'Profile Updated',
      'settings.profileUpdatedMessage': 'Your profile has been updated successfully.',
      'settings.great': 'Great!',
      'settings.discardChanges': 'Discard Changes',
      'settings.discardChangesMessage': 'You have unsaved changes. Are you sure you want to discard them?',
      'settings.keepEditing': 'Keep Editing',
      'settings.discard': 'Discard'
    };
    
    try {
      // Use fallback strings since getString is not available on UILanguageState
      return fallbackStrings[key] || key;
    } catch (error) {
      console.warn('getString error for key:', key, error);
      return fallbackStrings[key] || key;
    }
  };

  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    avatarUrl: null,
    bio: '',
    location: '',
    website: '',
    country: '',
    stateProvince: '',
    city: '',
  });
  const [originalData, setOriginalData] = useState<ProfileFormData>({
    fullName: '',
    avatarUrl: null,
    bio: '',
    location: '',
    website: '',
    country: '',
    stateProvince: '',
    city: '',
  });
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [platformPrefs, setPlatformPrefs] = useState<PlatformPreferences>({
    learningPace: 'structured',
    preferredDifficulty: 'medium',
    preferredQuizLength: 10,
    studyTimePreference: 'any_time',
    showExplanations: true,
    showDifficultyIndicators: true,
    showSources: true,
    showAchievements: true,
    showStreaks: true,
    showLeaderboards: true,
    competitiveMode: false,
    dailyReminder: true,
    weeklySummary: true,
    pushNotifications: true,
    achievementNotifications: true,
    emailNotifications: true,
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
  });
  const [categoryInterests, setCategoryInterests] = useState<CategoryInterest[]>([]);
  const [skillPreferences, setSkillPreferences] = useState<SkillPreference[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadProfileData();
  }, [profile]);

  useEffect(() => {
    const hasChanged = Object.keys(formData).some(
      key => formData[key as keyof ProfileFormData] !== originalData[key as keyof ProfileFormData]
    );
    setHasChanges(hasChanged);
  }, [formData, originalData, platformPrefs, categoryInterests]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProfileData = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      const profileData = {
        fullName: profile.full_name || '',
        avatarUrl: profile.avatar_url || null,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        country: profile.country || '',
        stateProvince: profile.state_province || '',
        city: profile.city || '',
      };

      // Load categories for interests
      const categoriesResponse = await fetchCategories({ useCache: true });
      if (!categoriesResponse.error && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      // Load platform preferences
      if (user?.id) {
        const { data: platformPrefsData } = await supabase
          .from('user_platform_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (platformPrefsData) {
          setPlatformPrefs({
            learningPace: (platformPrefsData.learning_pace as any) || 'structured',
            preferredDifficulty: (platformPrefsData.preferred_difficulty as any) || 'medium',
            preferredQuizLength: platformPrefsData.preferred_quiz_length || 10,
            studyTimePreference: platformPrefsData.study_time_preference as any || 'any_time',
            showExplanations: platformPrefsData.show_explanations ?? true,
            showDifficultyIndicators: platformPrefsData.show_difficulty_indicators ?? true,
            showSources: platformPrefsData.show_sources ?? true,
            showAchievements: platformPrefsData.show_achievements ?? true,
            showStreaks: platformPrefsData.show_streaks ?? true,
            showLeaderboards: platformPrefsData.show_leaderboards ?? true,
            competitiveMode: platformPrefsData.competitive_mode ?? false,
            dailyReminder: platformPrefsData.daily_reminder ?? true,
            weeklySummary: platformPrefsData.weekly_summary ?? true,
            pushNotifications: platformPrefsData.push_notifications ?? true,
            achievementNotifications: platformPrefsData.achievement_notifications ?? true,
            emailNotifications: platformPrefsData.email_notifications ?? true,
            fontSize: platformPrefsData.font_size as any || 'medium',
            highContrast: platformPrefsData.high_contrast ?? false,
            reducedMotion: platformPrefsData.reduced_motion ?? false,
            screenReaderMode: platformPrefsData.screen_reader_mode ?? false,
          });
        }

        // Load category interests
        const { data: categoryPrefsData } = await supabase
          .from('user_category_preferences')
          .select('*')
          .eq('user_id', user.id);

        if (categoryPrefsData) {
          setCategoryInterests(categoryPrefsData.map(pref => ({
            categoryId: pref.category_id,
            interestLevel: pref.interest_level || 3,
            learningGoal: pref.learning_goal || undefined,
          })));
        }

        // Load skills and skill preferences
        setLoadingSkills(true);
        try {
          const skillsData = await SkillsService.getSkillsByCategory(user.id);
          setSkillsByCategory(skillsData);
          
          // Load user skill preferences
          const skillPrefsData = await SkillsService.getUserSkillPreferences(user.id);
          if (skillPrefsData) {
            setSkillPreferences(skillPrefsData.map(pref => ({
              skillId: pref.skill_id,
              interestLevel: pref.interest_level || 0,
              targetMasteryLevel: pref.target_mastery_level ? parseInt(pref.target_mastery_level) : undefined,
              learningTimeline: pref.learning_timeline || undefined,
            })));
          }
        } catch (error) {
          console.error('Error loading skills:', error);
        } finally {
          setLoadingSkills(false);
        }
      }

      setFormData(profileData);
      setOriginalData(profileData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePrefChange = useCallback((field: keyof PlatformPreferences, value: any) => {
    setPlatformPrefs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCategoryInterestChange = useCallback((categoryId: string, interestLevel: number) => {
    setCategoryInterests(prev => {
      const existing = prev.find(c => c.categoryId === categoryId);
      if (existing) {
        return prev.map(c => 
          c.categoryId === categoryId ? { ...c, interestLevel } : c
        );
      } else {
        return [...prev, { categoryId, interestLevel }];
      }
    });
  }, []);

  const handleSkillInterestChange = useCallback((skillId: string, interestLevel: number) => {
    setSkillPreferences(prev => {
      const existing = prev.find(s => s.skillId === skillId);
      if (existing) {
        return prev.map(s => 
          s.skillId === skillId ? { ...s, interestLevel } : s
        );
      } else {
        return [...prev, { skillId, interestLevel }];
      }
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.fullName.trim()) {
      Alert.alert(getString('errors.error'), getString('settings.fullNameRequired'));
      return;
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await updateProfile({
        full_name: formData.fullName.trim(),
        avatar_url: formData.avatarUrl,
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        country: formData.country.trim(),
        state_province: formData.stateProvince.trim(),
        city: formData.city.trim(),
      });

      if (profileError) throw profileError;

      // Update platform preferences using the new split preference system
      // Map new preference values to legacy values expected by the service
      const mappedPrefs = {
        ...platformPrefs,
        learningPace: platformPrefs.learningPace,
        preferredDifficulty: platformPrefs.preferredDifficulty,
        studyTimePreference: platformPrefs.studyTimePreference,
      };
      
      const prefsSuccess = await UserPreferencesService.saveUserPreferences(user.id, mappedPrefs);
      if (!prefsSuccess) {
        throw new Error('Failed to save user preferences');
      }

      // Update category interests
      if (categoryInterests.length > 0) {
        // Delete existing preferences first
        await supabase
          .from('user_category_preferences')
          .delete()
          .eq('user_id', user.id);

        // Insert new preferences
        const { error: categoryError } = await supabase
          .from('user_category_preferences')
          .insert(
            categoryInterests.map(interest => ({
              user_id: user.id,
              category_id: interest.categoryId,
              interest_level: interest.interestLevel,
              learning_goal: interest.learningGoal,
            }))
          );

        if (categoryError) throw categoryError;
      }

      // Update skill preferences
      if (skillPreferences.length > 0) {
        const skillPrefsToSave = skillPreferences
          .filter(pref => pref.targetMasteryLevel !== undefined || pref.learningTimeline !== undefined)
          .map(pref => {
            const saveData: {
              skill_id: string;
              interest_level: number;
              target_mastery_level?: number;
              learning_timeline?: string;
            } = {
              skill_id: pref.skillId,
              interest_level: pref.interestLevel,
            };
            
            if (pref.targetMasteryLevel !== undefined) {
              saveData.target_mastery_level = pref.targetMasteryLevel;
            }
            if (pref.learningTimeline !== undefined) {
              saveData.learning_timeline = pref.learningTimeline;
            }
            
            return saveData;
          });
        
        const saveResult = await SkillsService.saveUserSkillPreferences(user.id, skillPrefsToSave);
        if (!saveResult) {
          console.error('Failed to save skill preferences');
        }
      }

      setOriginalData({ ...formData });

      Alert.alert(
        getString('settings.profileUpdated'),
        getString('settings.profileUpdatedMessage'),
        [{ text: getString('settings.great'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        getString('settings.discardChanges'),
        getString('settings.discardChangesMessage'),
        [
          { text: getString('settings.keepEditing'), style: 'cancel' },
          { 
            text: getString('settings.discard'), 
            style: 'destructive', 
            onPress: () => router.back() 
          }
        ]
      );
    } else {
      router.back();
    }
  };

  // ============================================================================
  // AVATAR HANDLING
  // ============================================================================

  const handleAvatarPick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your avatar.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const formDataForUpload = new FormData();
      const filename = `avatar-${user.id}-${Date.now()}.jpg`;
      
      // @ts-ignore - FormData append accepts blob
      formDataForUpload.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, formDataForUpload);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));

      if (profile?.avatar_url) {
        const urlParts = profile.avatar_url.split('/');
        const oldFilename = urlParts[urlParts.length - 1];
        if (oldFilename) {
          await supabase.storage.from('avatars').remove([oldFilename]);
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getUserInitials = () => {
    const name = formData.fullName || profile?.full_name || '';
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      const firstName = names[0];
      const lastName = names[1];
      if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
        return firstName.charAt(0) + lastName.charAt(0);
      }
    }
    const firstNameOnly = names[0];
    return firstNameOnly?.charAt(0) || 'U';
  };

  const handleExportAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      Alert.alert(
        '📊 Exporting CivicSense Analytics',
        'Generating your comprehensive learning analytics report with CivicSense branding and mission. This includes all your progress, insights, and achievements...',
        [{ text: 'Continue', style: 'default' }]
      );

      const result = await LearningExportService.exportToPDF(user.id);
      
      if (result.success && result.uri) {
        Alert.alert(
          '🎉 Analytics Report Ready!',
          'Your branded CivicSense learning analytics report has been generated successfully. The report includes your democratic education progress, civic engagement insights, and achievements with our full branding.',
          [
            {
              text: 'Save & Keep Private',
              style: 'cancel',
            },
            {
              text: 'Share Report',
              onPress: () => LearningExportService.sharePDF(result.uri!),
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Export Failed', 
          result.error || 'Unable to generate your analytics report. Please ensure you have completed some quizzes and try again.',
          [
            { text: 'Retry Export', onPress: handleExportAnalytics },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Analytics export error:', error);
      Alert.alert(
        'Export Error',
        'Failed to generate your learning analytics report. This might be due to insufficient learning data or a temporary issue. Please ensure you have completed some civic quizzes and try again.',
        [
          { text: 'Retry', onPress: handleExportAnalytics },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ marginTop: spacing.sm, color: theme.foregroundSecondary }}>
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <CustomHeader
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPick}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              {formData.avatarUrl ? (
                <Image
                  source={{ uri: formData.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                  <Text variant="title1" style={styles.avatarText}>
                    {getUserInitials()}
                  </Text>
                </View>
              )}
              
              <View style={styles.avatarOverlay}>
                {uploadingAvatar ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.changeAvatarText}>Change</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            
            <Text variant="footnote" color="secondary" style={styles.avatarHint}>
              Tap to change your profile picture
            </Text>
          </View>

          {/* Basic Profile Information */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={[styles.sectionTitle, { color: theme.foreground }]}>
              Basic Information
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                Full Name *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                placeholder="Enter your full name"
                placeholderTextColor={theme.foregroundTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                Bio
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.foregroundTertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                Location
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="City, State"
                placeholderTextColor={theme.foregroundTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                Website
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.website}
                onChangeText={(text) => handleInputChange('website', text)}
                placeholder="https://example.com"
                placeholderTextColor={theme.foregroundTertiary}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </Card>

          {/* Geographic Information for Civic Personalization */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.foreground }])}>
              Location & Civic Personalization
            </Text>
            <Text variant="footnote" color="secondary" style={styles.sectionSubtitle}>
              Help us personalize civic content for your region
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                Country
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.country}
                onChangeText={(text) => handleInputChange('country', text)}
                placeholder="United States"
                placeholderTextColor={theme.foregroundTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                State / Province
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.stateProvince}
                onChangeText={(text) => handleInputChange('stateProvince', text)}
                placeholder="California, Ontario, etc."
                placeholderTextColor={theme.foregroundTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={[styles.fieldLabel, { color: theme.foreground }]}>
                City
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="San Francisco, Toronto, etc."
                placeholderTextColor={theme.foregroundTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
              <Text variant="caption" style={[styles.infoText, { color: theme.foregroundSecondary }]}>
                This information helps us show you relevant local representatives, voting information, and civic opportunities in your area.
              </Text>
            </View>
          </Card>

          {/* Learning Preferences */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={[styles.sectionTitle, { color: theme.foreground }]}>
              Learning Preferences
            </Text>
            
            <View style={styles.preferencesGrid}>
              <View style={styles.preferenceRow}>
                <Text variant="body" style={{ color: theme.foreground }}>Learning Pace</Text>
                <View style={styles.segmentedControl}>
                  {(['self_paced', 'structured', 'intensive'] as const).map((pace) => (
                    <TouchableOpacity
                      key={pace}
                      style={[
                        styles.segmentButton,
                        { 
                          backgroundColor: platformPrefs.learningPace === pace ? theme.primary : theme.border + '20',
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => handlePrefChange('learningPace', pace)}
                    >
                      <Text style={[
                        styles.segmentText,
                        { color: platformPrefs.learningPace === pace ? '#FFFFFF' : theme.foregroundSecondary }
                      ]}>
                        {formatEnumValueForDisplay(pace)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.preferenceRow}>
                <Text variant="body" style={{ color: theme.foreground }}>Difficulty Level</Text>
                <View style={styles.segmentedControl}>
                  {(['easy', 'medium', 'hard', 'adaptive'] as const).map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      style={[
                        styles.segmentButton,
                        { 
                          backgroundColor: platformPrefs.preferredDifficulty === difficulty ? theme.primary : theme.border + '20',
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => handlePrefChange('preferredDifficulty', difficulty)}
                    >
                      <Text style={[
                        styles.segmentText,
                        { color: platformPrefs.preferredDifficulty === difficulty ? '#FFFFFF' : theme.foregroundSecondary }
                      ]}>
                        {formatEnumValueForDisplay(difficulty)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.preferenceRow}>
                <Text variant="body" style={{ color: theme.foreground }}>Study Time</Text>
                <View style={styles.segmentedControl}>
                  {(['morning', 'afternoon', 'evening', 'any_time'] as const).map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.segmentButton,
                        platformPrefs.studyTimePreference === time && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                      onPress={() => setPlatformPrefs(prev => ({
                        ...prev,
                        studyTimePreference: time
                      }))}
                    >
                      <Text
                        variant="caption"
                        style={[
                          { color: theme.foreground },
                          ...(platformPrefs.studyTimePreference === time ? [{
                            color: theme.background,
                          }] : []),
                        ]}
                      >
                        {formatEnumValueForDisplay(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text variant="body" style={{ color: theme.foreground }}>Show Explanations</Text>
                  <Text variant="caption" color="secondary">
                    Display detailed explanations after each question
                  </Text>
                </View>
                <Switch
                  value={platformPrefs.showExplanations}
                  onValueChange={(value) => handlePrefChange('showExplanations', value)}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={platformPrefs.showExplanations ? theme.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text variant="body" style={{ color: theme.foreground }}>Daily Reminders</Text>
                  <Text variant="caption" color="secondary">
                    Get notified to keep your learning streak
                  </Text>
                </View>
                <Switch
                  value={platformPrefs.dailyReminder}
                  onValueChange={(value) => handlePrefChange('dailyReminder', value)}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={platformPrefs.dailyReminder ? theme.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text variant="body" style={{ color: theme.foreground }}>Show Progress & Streaks</Text>
                  <Text variant="caption" color="secondary">
                    Display your learning progress and streaks
                  </Text>
                </View>
                <Switch
                  value={platformPrefs.showStreaks}
                  onValueChange={(value) => handlePrefChange('showStreaks', value)}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={platformPrefs.showStreaks ? theme.primary : '#f4f3f4'}
                />
              </View>
            </View>
          </Card>

          {/* Topic Interests */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.foreground }])}>
              Topic Interests
            </Text>
            <Text variant="footnote" color="secondary" style={styles.sectionSubtitle}>
              Choose topics you're most interested in learning about
            </Text>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                const interest = categoryInterests.find(c => c.categoryId === category.id);
                const interestLevel = interest?.interestLevel || 0;
                
                return (
                  <View key={category.id} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryEmoji}>{category.emoji || '📚'}</Text>
                      <Text variant="callout" weight="600" style={[styles.categoryName, { color: theme.foreground }]}>
                        {category.name}
                      </Text>
                    </View>
                    
                    <View style={styles.interestSlider}>
                      <Text variant="caption" color="secondary">Interest Level</Text>
                      <View style={styles.interestButtons}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <TouchableOpacity
                            key={level}
                            style={[
                              styles.interestButton,
                              { 
                                backgroundColor: interestLevel >= level ? theme.primary : theme.border + '30',
                                borderColor: theme.border 
                              }
                            ]}
                            onPress={() => handleCategoryInterestChange(category.id, level)}
                          >
                            <Text style={[
                              styles.interestButtonText,
                              { color: interestLevel >= level ? '#FFFFFF' : theme.foregroundSecondary }
                            ]}>
                              {level}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Skills and Expertise */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={[styles.sectionTitle, { color: theme.foreground }]}>
              Skills & Expertise
            </Text>
            <Text variant="footnote" color="secondary" style={styles.sectionSubtitle}>
              Select skills you want to develop or already have expertise in
            </Text>
            
            {loadingSkills ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <View style={styles.skillsContainer}>
                {skillsByCategory.map((categoryGroup) => (
                  <View key={categoryGroup.categoryId} style={styles.skillCategorySection}>
                    <Text variant="callout" weight="600" style={[styles.skillCategoryName, { color: theme.foreground }]}>
                      {categoryGroup.categoryName}
                    </Text>
                    
                    <View style={styles.skillsGrid}>
                      {categoryGroup.skills.map((skill) => {
                        const preference = skillPreferences.find(p => p.skillId === skill.id);
                        const interestLevel = preference?.interestLevel || 0;
                        
                        return (
                          <View key={skill.id} style={styles.skillItem}>
                            <View style={styles.skillHeader}>
                              {skill.emoji && <Text style={styles.skillEmoji}>{skill.emoji}</Text>}
                              <Text variant="footnote" weight="500" style={[styles.skillName, { color: theme.foreground }]}>
                                {skill.skill_name}
                              </Text>
                            </View>
                            
                            <View style={styles.skillInterestButtons}>
                              {[1, 2, 3, 4, 5].map((level) => (
                                <TouchableOpacity
                                  key={level}
                                  style={[
                                    styles.skillInterestButton,
                                    { 
                                      backgroundColor: interestLevel >= level ? theme.primary : theme.border + '30',
                                      borderColor: theme.border 
                                    }
                                  ]}
                                  onPress={() => handleSkillInterestChange(skill.id, level)}
                                >
                                  <Text style={[
                                    styles.skillInterestButtonText,
                                    { color: interestLevel >= level ? '#FFFFFF' : theme.foregroundSecondary }
                                  ]}>
                                    {level}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Accessibility Options */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={[styles.sectionTitle, { color: theme.foreground }]}>
              Accessibility & Display
            </Text>
            
            <View style={styles.preferencesGrid}>
              <View style={styles.preferenceRow}>
                <Text variant="body" style={{ color: theme.foreground }}>Font Size</Text>
                <View style={styles.segmentedControl}>
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.segmentButton,
                        { 
                          backgroundColor: platformPrefs.fontSize === size ? theme.primary : theme.border + '20',
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => handlePrefChange('fontSize', size)}
                    >
                      <Text style={[
                        styles.segmentText,
                        { color: platformPrefs.fontSize === size ? '#FFFFFF' : theme.foregroundSecondary }
                      ]}>
                        {formatEnumValueForDisplay(size)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text variant="body" style={{ color: theme.foreground }}>High Contrast</Text>
                  <Text variant="caption" color="secondary">
                    Improve readability with higher contrast
                  </Text>
                </View>
                <Switch
                  value={platformPrefs.highContrast}
                  onValueChange={(value) => handlePrefChange('highContrast', value)}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={platformPrefs.highContrast ? theme.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text variant="body" style={{ color: theme.foreground }}>Reduced Motion</Text>
                  <Text variant="caption" color="secondary">
                    Minimize animations and transitions
                  </Text>
                </View>
                <Switch
                  value={platformPrefs.reducedMotion}
                  onValueChange={(value) => handlePrefChange('reducedMotion', value)}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={platformPrefs.reducedMotion ? theme.primary : '#f4f3f4'}
                />
              </View>
            </View>
          </Card>

          {/* Data & Analytics Export */}
          <Card style={StyleSheet.flatten([styles.formCard, { backgroundColor: theme.card }])} variant="outlined">
            <Text variant="headline" weight="600" style={[styles.sectionTitle, { color: theme.foreground }]}>
              Data & Analytics
            </Text>
            
            <TouchableOpacity 
              style={[styles.exportButton, { borderColor: theme.border }]}
              onPress={handleExportAnalytics}
              disabled={loading}
            >
              <View style={styles.exportButtonContent}>
                <View style={[styles.exportIconContainer, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={styles.exportIcon}>📊</Text>
                </View>
                <View style={styles.exportTextContainer}>
                  <Text variant="callout" weight="600" style={[styles.exportTitle, { color: theme.foreground }]}>
                    Export Learning Analytics
                  </Text>
                  <Text variant="footnote" style={[styles.exportDescription, { color: theme.foregroundSecondary }]}>
                    Generate a comprehensive CivicSense branded report with your civic learning progress, insights, and achievements
                  </Text>
                </View>
                <View style={styles.exportArrow}>
                  <Text style={[styles.arrowText, { color: theme.foregroundSecondary }]}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            
            <View style={styles.dataInfo}>
              <Text variant="callout" weight="600" style={[styles.dataInfoTitle, { color: theme.foreground }]}>
                Your Learning Data
              </Text>
              <Text variant="footnote" style={[styles.dataInfoText, { color: theme.foregroundSecondary }]}>
                Your progress includes quiz scores, study time, topic mastery, and civic engagement metrics. 
                All data is used to generate personalized insights that help you become a more informed democratic participant.
              </Text>
            </View>
          </Card>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  
  // Header Styles
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  headerButton: {
    padding: spacing.xs,
    minWidth: 60,
  },
  headerButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    fontWeight: '400',
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    fontWeight: '600',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  changesIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  changesIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.text,
  },

  // Content Styles
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  changeAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarHint: {
    fontFamily: fontFamily.text,
  },

  // Form
  formCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  textArea: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Preferences
  preferencesGrid: {
    gap: spacing.lg,
  },
  preferenceRow: {
    gap: spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    gap: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  segmentText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },

  // Categories
  categoriesGrid: {
    gap: spacing.md,
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontFamily: fontFamily.text,
  },
  interestSlider: {
    gap: spacing.xs,
  },
  interestButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  interestButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF8FF',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.text,
    lineHeight: 16,
  },

  // Skills
  skillsContainer: {
    gap: spacing.lg,
  },
  skillCategorySection: {
    marginBottom: spacing.lg,
  },
  skillCategoryName: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.sm,
  },
  skillsGrid: {
    gap: spacing.sm,
  },
  skillItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  skillEmoji: {
    fontSize: 16,
  },
  skillName: {
    fontFamily: fontFamily.text,
    flex: 1,
  },
  skillInterestButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  skillInterestButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillInterestButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },

  // Export Analytics Styles
  exportButton: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportIcon: {
    fontSize: 24,
  },
  exportTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  exportTitle: {
    fontFamily: fontFamily.text,
  },
  exportDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
  exportArrow: {
    paddingHorizontal: spacing.xs,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '300',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  dataInfo: {
    gap: spacing.xs,
  },
  dataInfoTitle: {
    fontFamily: fontFamily.text,
  },
  dataInfoText: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
  },
}); 