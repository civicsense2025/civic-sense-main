import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { useUIStrings, getLanguageDisplayName } from '../../lib/hooks/useUIStrings';
import { deepLTranslationService, type SupportedLanguage } from '../../lib/translation/deepl-service';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (languageCode: string) => void;
  currentLanguage: string;
}

export function LanguageSelector({
  visible,
  onClose,
  onLanguageSelect,
  currentLanguage,
}: LanguageSelectorProps) {
  const { theme } = useTheme();
  const { uiStrings } = useUIStrings();
  const [availableLanguages] = useState<SupportedLanguage[]>(
    deepLTranslationService.getAvailableLanguages()
  );

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageSelect(languageCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text variant="callout" color="primary">
              {uiStrings.actions.cancel}
            </Text>
          </TouchableOpacity>
          
          <Text variant="title" color="inherit" style={styles.headerTitle}>
            {uiStrings.translation.selectLanguage}
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Subtitle */}
        <View style={styles.subtitle}>
          <Text variant="body" color="secondary" style={styles.subtitleText}>
            {uiStrings.translation.languagePreferenceSaved}
          </Text>
        </View>

        {/* Language List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {availableLanguages.map((language) => {
            const isSelected = language.code === currentLanguage;
            const displayName = getLanguageDisplayName(language.code, currentLanguage);
            
            return (
              <TouchableOpacity
                key={language.code}
                style={styles.languageButton}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.8}
              >
                <Card 
                  style={[
                    styles.languageCard,
                    isSelected && { 
                      borderColor: theme.primary,
                      backgroundColor: theme.primary + '10'
                    }
                  ]} 
                  variant="outlined"
                >
                  <View style={styles.languageRow}>
                    <View style={styles.languageInfo}>
                      <View style={styles.languageHeader}>
                        <Text variant="title2" style={styles.flag}>
                          {language.flag}
                        </Text>
                        <Text 
                          variant="callout" 
                          color="inherit" 
                          style={[
                            styles.languageName,
                            isSelected && { color: theme.primary }
                          ]}
                        >
                          {language.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                            <Text variant="caption" style={styles.selectedText}>
                              ✓
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Show native name if different */}
                      {displayName !== language.name && (
                        <Text variant="footnote" color="secondary" style={styles.nativeName}>
                          {displayName}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="footnote" color="secondary" style={styles.footerText}>
            {uiStrings.translation.dontSeeLanguage}
          </Text>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => {
              // Handle language request - could open email or feedback form
              console.log('Request new language feature tapped');
            }}
            activeOpacity={0.8}
          >
            <Text variant="footnote" color="primary" style={styles.requestText}>
              {uiStrings.translation.requestLanguage}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    minWidth: 60,
  },
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  subtitleText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  languageButton: {
    marginBottom: spacing.sm,
  },
  languageCard: {
    padding: spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageInfo: {
    flex: 1,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  languageName: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  nativeName: {
    fontFamily: fontFamily.text,
    marginLeft: 32, // Align with language name (flag width + margin)
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  requestButton: {
    paddingVertical: spacing.xs,
  },
  requestText: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 