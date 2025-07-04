import React, { useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// INTERFACES
// ============================================================================

interface FeedbackCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface FeedbackForm {
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  includeDeviceInfo: boolean;
}

// ============================================================================
// DATA
// ============================================================================

const feedbackCategories: FeedbackCategory[] = [
  {
    id: 'bug',
    label: 'Bug Report',
    icon: '🐛',
    description: 'Something isn\'t working properly',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    icon: '💡',
    description: 'Suggest a new feature or improvement',
  },
  {
    id: 'content',
    label: 'Content Feedback',
    icon: '📝',
    description: 'Feedback about quiz questions or topics',
  },
  {
    id: 'ui',
    label: 'Design & Usability',
    icon: '🎨',
    description: 'Suggestions about the app\'s design',
  },
  {
    id: 'performance',
    label: 'Performance Issue',
    icon: '⚡',
    description: 'The app is slow or unresponsive',
  },
  {
    id: 'other',
    label: 'Other',
    icon: '💬',
    description: 'General feedback or comments',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedbackScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  // ============================================================================
  // STATE
  // ============================================================================

  const [form, setForm] = useState<FeedbackForm>({
    category: '',
    subject: '',
    message: '',
    rating: null,
    includeDeviceInfo: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_MESSAGE_LENGTH = 1000;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCategorySelect = (categoryId: string) => {
    setForm(prev => ({ ...prev, category: categoryId }));
  };

  const handleRatingSelect = (rating: number) => {
    setForm(prev => ({ ...prev, rating: rating === prev.rating ? null : rating }));
  };

  const handleInputChange = (field: keyof FeedbackForm, value: any) => {
    if (field === 'message') {
      setCharacterCount(value.length);
      if (value.length > MAX_MESSAGE_LENGTH) {
        return;
      }
    }
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getDeviceInfo = async () => {
  const deviceInfo = {
    brand: 'Unknown',
    model: 'Unknown',
    os: Platform.OS,
    osVersion: Platform.Version.toString(),
    appVersion: '1.0.0',
    buildVersion: '1',
  };
  return deviceInfo;
};

  const validateForm = (): boolean => {
    if (!form.category) {
      Alert.alert('Missing Information', 'Please select a feedback category');
      return false;
    }
    if (!form.subject.trim()) {
      Alert.alert('Missing Information', 'Please enter a subject');
      return false;
    }
    if (!form.message.trim()) {
      Alert.alert('Missing Information', 'Please enter your feedback message');
      return false;
    }
    if (form.message.length < 10) {
      Alert.alert('Too Short', 'Please provide more detailed feedback (at least 10 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Prepare feedback data
      const feedbackData = {
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        user_name: profile?.full_name || 'Anonymous User',
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        rating: form.rating,
        device_info: form.includeDeviceInfo ? await getDeviceInfo() : null,
        app_state: {
          theme: 'default',
          authenticated: !!user,
        },
        created_at: new Date().toISOString(),
      };

      // Submit to database
      const { error } = await supabase
        .from('feedback')
        .insert(feedbackData);

      if (error) throw error;

      // Show success message
      Alert.alert(
        'Thank You! 🎉',
        'Your feedback has been submitted successfully. We appreciate you taking the time to help us improve CivicSense!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setForm({
        category: '',
        subject: '',
        message: '',
        rating: null,
        includeDeviceInfo: true,
      });
      setCharacterCount(0);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Submission Failed',
        'We couldn\'t submit your feedback right now. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.subject || form.message) {
      Alert.alert(
        'Discard Feedback?',
        'Are you sure you want to discard your feedback?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { 
            text: 'Discard', 
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
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.customHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={theme.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              Send Feedback
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
              Help us improve CivicSense
            </Text>
          </View>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Rating Section */}
          <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
            <Text variant="callout" weight="600" style={styles.sectionTitle}>
              How's your experience?
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRatingSelect(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.star}>
                    {form.rating && form.rating >= star ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.rating && (
              <Text variant="footnote" color="secondary" style={styles.ratingText}>
                {form.rating === 1 && 'We\'re sorry to hear that 😔'}
                {form.rating === 2 && 'We\'ll work to improve 🛠️'}
                {form.rating === 3 && 'Thanks for the feedback 👍'}
                {form.rating === 4 && 'Glad you\'re enjoying it! 😊'}
                {form.rating === 5 && 'Awesome! Thanks so much! 🎉'}
              </Text>
            )}
          </Card>

          {/* Category Selection */}
          <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
            <Text variant="callout" weight="600" style={styles.sectionTitle}>
              What's your feedback about?
            </Text>
            <View style={styles.categoryGrid}>
              {feedbackCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    form.category === category.id && styles.categoryItemActive,
                    form.category === category.id && { borderColor: theme.primary }
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text variant="caption" weight={form.category === category.id ? '600' : '400'} 
                        style={styles.categoryLabel}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.category && (
              <Text variant="footnote" color="secondary" style={styles.categoryDescription}>
                {feedbackCategories.find(c => c.id === form.category)?.description}
              </Text>
            )}
          </Card>

          {/* Feedback Form */}
          <Card style={[styles.card, { backgroundColor: theme.card }]} variant="outlined">
            {/* Subject Field */}
            <View style={styles.fieldContainer}>
              <Text variant="footnote" weight="600" style={styles.fieldLabel}>
                Subject *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={form.subject}
                onChangeText={(text) => handleInputChange('subject', text)}
                placeholder="Brief summary of your feedback"
                placeholderTextColor={theme.foregroundTertiary}
                returnKeyType="next"
                maxLength={100}
              />
            </View>

            {/* Message Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Text variant="footnote" weight="600" style={styles.fieldLabel}>
                  Your Feedback *
                </Text>
                <Text variant="caption" color="secondary">
                  {characterCount}/{MAX_MESSAGE_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border 
                }]}
                value={form.message}
                onChangeText={(text) => handleInputChange('message', text)}
                placeholder="Please share your thoughts, suggestions, or describe the issue you're experiencing..."
                placeholderTextColor={theme.foregroundTertiary}
                multiline
                numberOfLines={6}
                maxLength={MAX_MESSAGE_LENGTH}
                textAlignVertical="top"
              />
            </View>

            {/* Device Info Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('includeDeviceInfo', !form.includeDeviceInfo)}
            >
              <View style={styles.toggleContent}>
                <Text variant="body">Include device information</Text>
                <Text variant="caption" color="secondary">
                  Helps us debug technical issues
                </Text>
              </View>
              <View style={[styles.checkbox, form.includeDeviceInfo && styles.checkboxActive]}>
                {form.includeDeviceInfo && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </Card>

          {/* User Info Notice */}
          {user && (
            <View style={styles.noticeContainer}>
              <Text variant="caption" color="secondary" style={styles.noticeText}>
                Your feedback will be submitted as {profile?.full_name || user.email}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              style={styles.button}
              disabled={submitting}
            />
            <Button
              title={submitting ? "Submitting..." : "Submit Feedback"}
              onPress={handleSubmit}
              variant="primary"
              style={styles.button}
              disabled={submitting || !form.category || !form.subject || !form.message}
              loading={submitting}
            />
          </View>

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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Custom Header
  customHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fontFamily.text,
    marginTop: 2,
  },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.md,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  star: {
    fontSize: 32,
  },
  ratingText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  categoryItemActive: {
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  categoryDescription: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Notice
  noticeContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  noticeText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
  },

  bottomSpacer: {
    height: spacing.xl * 2,
  },
}); 