import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, AVAILABLE_LANGUAGES, type LanguageCode } from '../../lib/language-context';
import { useTheme } from '../../lib/theme-context';
import { spacing, borderRadius, typography } from '../../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

interface LanguageSwitcherProps {
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outline' | 'ghost' | 'solid';
}

export function LanguageSwitcher({
  style,
  showLabel = true,
  size = 'medium',
  variant = 'outline',
}: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage, isTranslating } = useLanguage();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    changeLanguage(languageCode);
    setIsDropdownOpen(false);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 60 },
          text: { fontSize: 12 },
          emoji: { fontSize: 14 },
        };
      case 'large':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 10, minWidth: 100 },
          text: { fontSize: 16 },
          emoji: { fontSize: 18 },
        };
      default: // medium
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6, minWidth: 80 },
          text: { fontSize: 14 },
          emoji: { fontSize: 16 },
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'solid':
        return {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          borderWidth: 1,
        };
      default: // outline
        return {
          backgroundColor: theme.background,
          borderColor: theme.border,
          borderWidth: 1,
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'solid') return theme.primaryForeground;
    return theme.foreground;
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <>
      {/* Language Switcher Button */}
      <TouchableOpacity
        style={[
          styles.languageSwitcher,
          sizeStyles.container,
          variantStyles,
          {
            borderRadius: borderRadius.md,
          },
          isTranslating && styles.translating,
          style,
        ]}
        onPress={() => setIsDropdownOpen(true)}
        activeOpacity={0.7}
        disabled={isTranslating}
      >
        <View style={styles.buttonContent}>
          <Text style={[styles.emoji, { fontSize: sizeStyles.emoji.fontSize }]}>
            {currentLanguage.emoji}
          </Text>
          {showLabel && (
            <Text
              style={[
                styles.label,
                { fontSize: sizeStyles.text.fontSize, color: getTextColor() },
              ]}
            >
              {currentLanguage.label}
            </Text>
          )}
          {isTranslating ? (
            <View style={styles.loadingSpinner}>
              <Ionicons
                name="refresh"
                size={size === 'small' ? 12 : size === 'large' ? 16 : 14}
                color={getTextColor()}
              />
            </View>
          ) : (
            <Ionicons
              name="chevron-down"
              size={size === 'small' ? 12 : size === 'large' ? 16 : 14}
              color={getTextColor()}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                Select Language
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsDropdownOpen(false)}
              >
                <Ionicons name="close" size={24} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {AVAILABLE_LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor:
                        currentLanguage.code === language.code
                          ? theme.primary + '15'
                          : 'transparent',
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageEmoji}>{language.emoji}</Text>
                    <View style={styles.languageText}>
                      <Text style={[styles.languageName, { color: theme.foreground }]}>
                        {language.name}
                      </Text>
                      <Text style={[styles.languageCode, { color: theme.foregroundSecondary }]}>
                        {language.label}
                      </Text>
                    </View>
                  </View>
                  {currentLanguage.code === language.code && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  languageSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingSpinner: {
    // Simple loading indicator - could be enhanced with animation
  },
  translating: {
    opacity: 0.7,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.xs,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageCode: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default LanguageSwitcher; 