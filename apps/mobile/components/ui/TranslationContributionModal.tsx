import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../atoms/Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

interface TranslationField {
  key: string;
  label: string;
  originalText: string;
  placeholder: string;
  maxLength?: number;
}

interface TranslationContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'question' | 'topic';
  contentId: string;
  fields: TranslationField[];
  targetLanguage: string;
  targetLanguageName: string;
}

export const TranslationContributionModal: React.FC<TranslationContributionModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  fields,
  targetLanguage,
  targetLanguageName,
}) => {
  const { theme } = useTheme();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState<Record<string, string>>({});
  const [suggestionUsed, setSuggestionUsed] = useState<Record<string, boolean>>({});

  // Load DeepL suggestions when modal opens
  useEffect(() => {
    if (isOpen && fields.length > 0) {
      loadDeepLSuggestions();
    }
  }, [isOpen, fields, targetLanguage]);

  const loadDeepLSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const textsToTranslate = fields.map(field => field.originalText);
      
      const response = await fetch('/api/translations/deepl-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage,
          sourceLanguage: 'en'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          const suggestions: Record<string, string> = {};
          fields.forEach((field, index) => {
            if (data.translations[index]) {
              suggestions[field.key] = data.translations[index];
            }
          });
          setAutoSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Failed to load DeepL suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleTranslationChange = (fieldKey: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const useSuggestion = (fieldKey: string) => {
    const suggestion = autoSuggestions[fieldKey];
    if (suggestion) {
      setTranslations(prev => ({
        ...prev,
        [fieldKey]: suggestion
      }));
      setSuggestionUsed(prev => ({
        ...prev,
        [fieldKey]: true
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missingTranslations = fields.filter(field => !translations[field.key]?.trim());
    if (missingTranslations.length > 0) {
      Alert.alert(
        'Missing translations',
        `Please provide translations for: ${missingTranslations.map(f => f.label).join(', ')}`
      );
      return;
    }

    if (!contributorName.trim()) {
      Alert.alert(
        'Name required',
        'Please provide your name so we can credit your contribution'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/translations/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          targetLanguage,
          translations,
          contributor: {
            name: contributorName,
            email: contributorEmail
          },
          metadata: {
            usedDeepLSuggestions: Object.keys(suggestionUsed).filter(key => suggestionUsed[key]),
            hasDeepLSuggestions: Object.keys(autoSuggestions).length > 0
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit translation');
      }

      setIsSubmitted(true);
      Alert.alert(
        'Translation submitted! 🎉',
        'Thank you for helping make CivicSense accessible to more people. We\'ll review your contribution and add it soon.'
      );

    } catch (error) {
      console.error('Translation submission error:', error);
      Alert.alert(
        'Submission failed',
        'Sorry, there was an error submitting your translation. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTranslations({});
    setContributorName('');
    setContributorEmail('');
    setIsSubmitted(false);
    setAutoSuggestions({});
    setSuggestionUsed({});
    onClose();
  };

  if (isSubmitted) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: theme.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.success} />
            </View>
            <Text variant="headline" style={[styles.successTitle, { color: theme.foreground }]}>
              Thank you! 🙏
            </Text>
            <Text variant="body" style={[styles.successDescription, { color: theme.foregroundSecondary }]}>
              Your translation has been submitted for review. We'll add it to CivicSense soon so other {targetLanguageName} speakers can benefit from your contribution.
            </Text>
            <TouchableOpacity
              style={[styles.closeButtonLarge, { backgroundColor: theme.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.foreground} />
          </TouchableOpacity>
          <Text variant="headline" style={[styles.headerTitle, { color: theme.foreground }]}>
            Help Translate to {targetLanguageName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Contributor Info */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="heart" size={16} color={theme.error} />
                <Text variant="callout" style={[styles.sectionTitle, { color: theme.foreground }]}>
                  Contributor Information
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text variant="footnote" style={[styles.label, { color: theme.foregroundSecondary }]}>
                  Your Name *
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.background, 
                    color: theme.foreground,
                    borderColor: theme.border 
                  }]}
                  value={contributorName}
                  onChangeText={setContributorName}
                  placeholder="How should we credit you?"
                  placeholderTextColor={theme.foregroundSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text variant="footnote" style={[styles.label, { color: theme.foregroundSecondary }]}>
                  Email (optional)
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.background, 
                    color: theme.foreground,
                    borderColor: theme.border 
                  }]}
                  value={contributorEmail}
                  onChangeText={setContributorEmail}
                  placeholder="For questions about your translation"
                  placeholderTextColor={theme.foregroundSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Translation Fields */}
            <View style={styles.translationSection}>
              <View style={styles.translationHeader}>
                <Text variant="callout" style={[styles.sectionTitle, { color: theme.foreground }]}>
                  Content to Translate
                </Text>
                {isLoadingSuggestions && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text variant="caption" style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
                      Loading AI suggestions...
                    </Text>
                  </View>
                )}
              </View>

              {fields.map((field) => (
                <View key={field.key} style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <Text variant="footnote" style={[styles.label, { color: theme.foregroundSecondary }]}>
                      {field.label} *
                    </Text>
                    {suggestionUsed[field.key] && (
                      <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="sparkles" size={12} color={theme.primary} />
                        <Text variant="caption" style={[styles.badgeText, { color: theme.primary }]}>
                          AI-assisted
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Original English Text */}
                  <View style={[styles.originalTextBox, { backgroundColor: theme.card }]}>
                    <Text variant="caption" style={[styles.originalLabel, { color: theme.foregroundSecondary }]}>
                      English (original):
                    </Text>
                    <Text variant="body" style={{ color: theme.foreground }}>
                      {field.originalText}
                    </Text>
                  </View>

                  {/* DeepL Suggestion */}
                  {autoSuggestions[field.key] && !translations[field.key] && (
                    <View style={[styles.suggestionBox, { 
                      backgroundColor: theme.primary + '10',
                      borderColor: theme.primary + '30'
                    }]}>
                      <View style={styles.suggestionHeader}>
                        <View style={styles.suggestionLabel}>
                          <Ionicons name="sparkles" size={12} color={theme.primary} />
                          <Text variant="caption" style={[styles.suggestionText, { color: theme.primary }]}>
                            AI Suggestion (DeepL)
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => useSuggestion(field.key)}
                          style={[styles.useButton, { borderColor: theme.primary }]}
                        >
                          <Text variant="caption" style={[styles.useButtonText, { color: theme.primary }]}>
                            Use as starting point
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text variant="body" style={{ color: theme.foreground, marginTop: spacing.xs }}>
                        {autoSuggestions[field.key]}
                      </Text>
                    </View>
                  )}

                  {/* Translation Input */}
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: theme.background, 
                      color: theme.foreground,
                      borderColor: theme.border 
                    }]}
                    value={translations[field.key] || ''}
                    onChangeText={(text) => handleTranslationChange(field.key, text)}
                    placeholder={field.placeholder}
                    placeholderTextColor={theme.foregroundSecondary}
                    multiline
                    maxLength={field.maxLength}
                  />
                  {field.maxLength && (
                    <Text variant="caption" style={[styles.charCount, { color: theme.foregroundSecondary }]}>
                      {(translations[field.key] || '').length}/{field.maxLength}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Guidelines */}
            <View style={[styles.guidelinesBox, { backgroundColor: theme.primary + '10' }]}>
              <Text variant="callout" style={[styles.guidelinesTitle, { color: theme.primary }]}>
                Translation Guidelines
              </Text>
              <View style={styles.guidelinesList}>
                {[
                  'Keep the meaning and tone of the original text',
                  'Use formal language appropriate for civic education',
                  'Maintain any proper nouns (like "Constitution", "Congress")',
                  'Ask yourself: would this help someone understand American government?',
                  'Feel free to use AI suggestions as a starting point, but review and improve them',
                  'Your human expertise is valuable - correct any errors in the AI suggestions'
                ].map((guideline, index) => (
                  <View key={index} style={styles.guidelineItem}>
                    <Text style={[styles.guidelineBullet, { color: theme.primary }]}>•</Text>
                    <Text variant="footnote" style={[styles.guidelineText, { color: theme.primary }]}>
                      {guideline}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={handleClose}
          >
            <Text variant="callout" style={{ color: theme.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, { 
              backgroundColor: theme.primary,
              opacity: isSubmitting ? 0.7 : 1
            }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text variant="callout" style={styles.submitButtonText}>
                Submit Translation
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  translationSection: {
    marginTop: spacing.lg,
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
  },
  fieldContainer: {
    marginBottom: spacing.xl,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  originalTextBox: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  originalLabel: {
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  suggestionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  useButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  useButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: spacing.xs,
    fontSize: 12,
  },
  guidelinesBox: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.lg,
  },
  guidelinesTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  guidelinesList: {
    gap: spacing.xs,
  },
  guidelineItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  guidelineBullet: {
    fontSize: 14,
    fontWeight: '600',
  },
  guidelineText: {
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  closeButtonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    minWidth: 120,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 