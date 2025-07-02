import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../lib/theme-context';
import { mobileAudioService } from '../../lib/audio/audio-service';
import { deepLTranslationService, type SupportedLanguage } from '../../lib/translation/deepl-service';

export interface ContentSection {
  id: string;
  label: string;
  content: string;
  emoji?: string;
}

export interface PageTranslationControlsProps {
  isVisible: boolean;
  onClose: () => void;
  contentSections: ContentSection[];
  currentLanguage?: string; // Allow parent to control the selected language
  onTranslationStart?: (language: string) => void;
  onTranslationComplete?: (language: string) => void;
  onAudioStart?: (sectionId: string, language: string) => void;
}

// Fallback language list if service isn't available
const FALLBACK_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export function PageTranslationControls({
  isVisible,
  onClose,
  contentSections,
  currentLanguage,
  onTranslationStart,
  onTranslationComplete,
  onAudioStart
}: PageTranslationControlsProps) {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<string, Record<string, string>>>({});
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>(FALLBACK_LANGUAGES);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyReading, setCurrentlyReading] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  
  // Animation values
  const slideAnim = useState(() => new Animated.Value(0))[0];

  // Check network connectivity
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const checkConnectivity = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        setIsConnected(netInfo.isConnected ?? false);

        unsubscribe = NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected ?? false);
        });
      } catch (error) {
        console.warn('Network check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnectivity();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Sync internal language state with parent-controlled language
  useEffect(() => {
    if (currentLanguage && currentLanguage !== selectedLanguage) {
      console.log(`🌍 PageTranslationControls syncing language from parent: ${currentLanguage}`);
      setSelectedLanguage(currentLanguage);
      
      // Update translation state based on new language
      if (currentLanguage !== 'en') {
        setTranslationEnabled(true);
      } else {
        setTranslationEnabled(false);
        setTranslatedContent({});
      }
    }
  }, [currentLanguage, selectedLanguage]);

  // Initialize services and load status
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setServiceError(null);
        
        // Initialize audio service first
        try {
          await mobileAudioService.initialize();
          console.log('✅ Audio service initialized');
        } catch (audioError) {
          console.warn('⚠️ Audio service initialization failed:', audioError);
          setServiceError('Audio service not available');
        }
        
        // Initialize translation service
        try {
          await deepLTranslationService.initialize();
          console.log('✅ Translation service initialized');
        } catch (translationError) {
          console.warn('⚠️ Translation service initialization failed:', translationError);
          // Don't set error - we have fallbacks
        }
        
        // Try to get languages from audio service first
        try {
          const serviceLanguages = mobileAudioService.getAvailableLanguages();
          if (serviceLanguages && serviceLanguages.length > 0) {
            setAvailableLanguages(serviceLanguages);
          }
        } catch (error) {
          console.warn('⚠️ Failed to get service languages, using fallbacks:', error);
        }

        // Get current translation status
        try {
          const status = mobileAudioService.getTranslationStatus();
          setSelectedLanguage(status.currentLanguage || 'en');
          setTranslationEnabled(status.isEnabled);
        } catch (error) {
          console.warn('⚠️ Failed to get translation status:', error);
          setSelectedLanguage('en');
          setTranslationEnabled(false);
        }
        
      } catch (error) {
        console.error('Failed to initialize translation services:', error);
        setServiceError('Services partially unavailable');
        // Continue with fallback languages
      }
    };

    if (isVisible) {
      initializeServices();
      // Animate in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  // Clean up text for audio (remove HTML tags and code characters)
  const cleanTextForAudio = (text: string): string => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-zA-Z0-9]+;/g, ' ') // Remove HTML entities
      .replace(/[{}[\]()]/g, ' ') // Remove brackets and braces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Handle language selection with robust error handling
  const handleLanguageSelect = useCallback(async (languageCode: string) => {
    if (languageCode === selectedLanguage) return;

    try {
      setIsTranslating(true);
      setServiceError(null);
      onTranslationStart?.(languageCode);

      // Update audio service if available
      try {
        await mobileAudioService.setTranslationLanguage(languageCode);
        await mobileAudioService.toggleTranslation(languageCode !== 'en');
      } catch (error) {
        console.warn('⚠️ Audio service language change failed, continuing with local translation:', error);
      }

      // Translate content sections directly if not English
      if (languageCode !== 'en') {
        try {
          await translateContentSections(languageCode);
          setTranslationEnabled(true);
        } catch (translationError) {
          console.warn('⚠️ Content translation failed:', translationError);
          if (!isConnected) {
            setServiceError('Translation requires internet connection');
          } else {
            setServiceError('Translation service unavailable');
          }
          // Continue with original content
          setTranslationEnabled(false);
        }
      } else {
        setTranslatedContent({});
        setTranslationEnabled(false);
      }

      setSelectedLanguage(languageCode);
      onTranslationComplete?.(languageCode);

    } catch (error) {
      console.error('Language selection failed:', error);
      setServiceError('Failed to change language');
      Alert.alert(
        'Language Selection Error', 
        'Failed to change language. The app will continue in the previous language.'
      );
    } finally {
      setIsTranslating(false);
    }
  }, [selectedLanguage, contentSections, onTranslationStart, onTranslationComplete, isConnected]);

  // Translate content sections with robust error handling
  const translateContentSections = async (targetLanguage: string) => {
    if (targetLanguage === 'en' || !contentSections.length) return;

    try {
      const newTranslatedContent: Record<string, Record<string, string>> = {};

      for (const section of contentSections) {
        if (!section.content.trim()) continue;

        try {
          let translatedText: string;
          
          if (!isConnected) {
            // Offline fallback - indicate that translation is not available
            translatedText = `[${targetLanguage.toUpperCase()} - Offline] ${section.content}`;
          } else {
            try {
              // Try deepL service with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
              
              translatedText = await deepLTranslationService.translateText(
                section.content,
                targetLanguage,
                {
                  preserveCivicTerms: true,
                  formality: 'default',
                  context: `Civic education content: ${section.label}`
                }
              );
              
              clearTimeout(timeoutId);
            } catch (deepLError) {
              console.warn('⚠️ DeepL translation failed, using simple fallback:', deepLError);
              // Simple fallback that doesn't require network
              translatedText = section.content; // Keep original content
            }
          }

          if (!newTranslatedContent[targetLanguage]) {
            newTranslatedContent[targetLanguage] = {};
          }
          newTranslatedContent[targetLanguage][section.id] = translatedText;

        } catch (error) {
          console.warn(`⚠️ Failed to translate section ${section.id}:`, error);
          // Keep original content if translation fails
          if (!newTranslatedContent[targetLanguage]) {
            newTranslatedContent[targetLanguage] = {};
          }
          newTranslatedContent[targetLanguage][section.id] = section.content;
        }
      }

      setTranslatedContent(prev => ({
        ...prev,
        ...newTranslatedContent
      }));

    } catch (error) {
      console.error('⚠️ Failed to translate content sections:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Handle audio playback with comprehensive error handling
  const handlePlaySection = useCallback(async (section: ContentSection) => {
    try {
      setCurrentlyReading(section.id);
      setServiceError(null);

      const isTranslated = selectedLanguage !== 'en' && translationEnabled;
      const contentToPlay = isTranslated 
        ? translatedContent[selectedLanguage]?.[section.id] || section.content
        : section.content;

      const cleanedContent = cleanTextForAudio(contentToPlay);

      // Try audio service with proper error handling
      try {
        // Check if service is available before attempting to use it
        if (!mobileAudioService) {
          throw new Error('Audio service not available');
        }

        await mobileAudioService.speakText(cleanedContent, {
          skipTranslation: isTranslated // Skip service translation if we already translated
        });

        onAudioStart?.(section.id, selectedLanguage);

      } catch (audioError: any) {
        console.warn('⚠️ Audio service failed:', audioError);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Text-to-speech is not available on this device.';
        
        if (audioError.message?.includes('Network request failed')) {
          errorMessage = 'Audio requires internet connection. Please check your connection and try again.';
          setServiceError('Audio requires internet connection');
        } else if (audioError.message?.includes('Translation')) {
          errorMessage = 'Translation failed. Audio will play in English.';
          setServiceError('Translation service temporarily unavailable');
          
          // Try playing in English as fallback
          try {
            await mobileAudioService.speakText(cleanTextForAudio(section.content), {
              skipTranslation: true
            });
            onAudioStart?.(section.id, 'en');
            return; // Success with fallback
          } catch (fallbackError) {
            console.warn('⚠️ Fallback audio also failed:', fallbackError);
          }
        }
        
        Alert.alert('Audio Unavailable', errorMessage);
      }

    } catch (error) {
      console.error('⚠️ Failed to play section audio:', error);
      setServiceError('Audio playback failed');
      Alert.alert('Audio Error', 'Failed to play audio. Please try again.');
    } finally {
      setCurrentlyReading(null);
    }
  }, [selectedLanguage, translationEnabled, translatedContent, onAudioStart]);

  // Get display content for section
  const getSectionContent = (section: ContentSection): string => {
    const isTranslated = selectedLanguage !== 'en' && translationEnabled;
    if (!isTranslated) return section.content;
    
    return translatedContent[selectedLanguage]?.[section.id] || section.content;
  };

  // Get language info
  const getLanguageInfo = (code: string) => {
    return availableLanguages.find((lang: SupportedLanguage) => lang.code === code);
  };

  const currentLanguageInfo = getLanguageInfo(selectedLanguage);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.background },
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
                {
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.headerContent}>
              <Ionicons name="globe-outline" size={20} color={theme.primary} />
              <Text style={[styles.title, { color: theme.foreground }]}>Page Translation</Text>
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={24} color={theme.foregroundSecondary} />
            </TouchableOpacity>
          </View>

          {/* Error/Status Banner */}
          {(serviceError || !isConnected) && (
            <View style={[styles.statusBanner, { 
              backgroundColor: !isConnected ? theme.error + '20' : theme.warning + '20' 
            }]}>
              <Ionicons 
                name={!isConnected ? "wifi-outline" : "warning-outline"} 
                size={16} 
                color={!isConnected ? theme.error : theme.warning} 
              />
              <Text style={[styles.statusBannerText, { 
                color: !isConnected ? theme.error : theme.warning 
              }]}>
                {!isConnected ? 'No internet connection - Limited functionality' : serviceError}
              </Text>
            </View>
          )}

          {/* Main Content */}
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Translation Status */}
            <View style={[styles.statusSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Translation Status</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.foregroundSecondary }]}>Available:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: isConnected && !serviceError ? theme.success || '#059669' : theme.warning }
                ]}>
                  {isConnected && !serviceError ? '✓ Yes' : '⚠ Limited'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.foregroundSecondary }]}>Language:</Text>
                <Text style={[styles.statusValue, { color: theme.foreground }]}>
                  {currentLanguageInfo?.name || selectedLanguage}
                </Text>
              </View>
            </View>

            {/* Language Selection */}
            <View style={[styles.languageSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Select Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.languageGrid}>
                  {availableLanguages.map((language: SupportedLanguage) => {
                    const hasTranslation = selectedLanguage === 'en' || translatedContent[language.code];
                    const isDisabled = !isConnected && language.code !== 'en' && language.code !== selectedLanguage;
                    
                    return (
                      <TouchableOpacity
                        key={language.code}
                        style={[
                          styles.languageOption,
                          { backgroundColor: theme.card, borderColor: theme.border },
                          selectedLanguage === language.code && { 
                            borderColor: theme.primary, 
                            backgroundColor: theme.primary + '20' 
                          },
                          isDisabled && { opacity: 0.5 }
                        ]}
                        onPress={() => handleLanguageSelect(language.code)}
                        disabled={isTranslating || isDisabled}
                      >
                        <Text style={styles.languageFlag}>{language.flag}</Text>
                        <Text style={[
                          styles.languageName,
                          { color: theme.foregroundSecondary },
                          selectedLanguage === language.code && { color: theme.primary }
                        ]}>
                          {language.name}
                        </Text>
                        {isDisabled && (
                          <Text style={[styles.languageDisabled, { color: theme.error }]}>
                            Requires internet
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
                              
              {isTranslating && (
                <View style={[styles.translatingIndicator, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.translatingText, { color: theme.primary }]}>
                    Translating page content...
                  </Text>
                </View>
              )}
            </View>

            {/* Listen to Content */}
            <View style={styles.audioSection}>
              <View style={styles.audioHeader}>
                <Ionicons name="headset-outline" size={16} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Listen to Content</Text>
              </View>
              <Text style={[styles.audioDescription, { color: theme.foregroundSecondary }]}>
                Choose a section to listen to in your selected language:
              </Text>

              {contentSections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.contentSection, 
                    { backgroundColor: theme.card },
                    currentlyReading === section.id && { borderColor: theme.primary, borderWidth: 2 }
                  ]}
                  onPress={() => handlePlaySection(section)}
                  disabled={currentlyReading === section.id}
                >
                  <View style={styles.contentHeader}>
                    <Text style={styles.contentEmoji}>{section.emoji || '📚'}</Text>
                    <View style={styles.contentInfo}>
                      <Text style={[styles.contentLabel, { color: theme.foreground }]}>{section.label}</Text>
                      <Text style={[styles.contentPreview, { color: theme.foregroundSecondary }]} numberOfLines={2}>
                        {cleanTextForAudio(getSectionContent(section))}
                      </Text>
                    </View>
                    {currentlyReading === section.id ? (
                      <Ionicons name="volume-high" size={16} color={theme.primary} />
                    ) : (
                      <Ionicons name="play-circle-outline" size={16} color={theme.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    maxHeight: '85%',
    minHeight: 400,
    width: '92%',
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  closeButton: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  statusSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  statusLabel: {
    fontSize: 12,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  languageSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  languageOption: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 60,
  },
  languageFlag: {
    fontSize: 16,
    marginBottom: 2,
  },
  languageName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  languageDisabled: {
    fontSize: 8,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  translatingIndicator: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 6,
    alignItems: 'center',
  },
  translatingText: {
    fontSize: 12,
    color: '#6096BA',
    fontWeight: '500',
  },
  audioSection: {
    paddingVertical: 16,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  audioDescription: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 12,
  },
  contentSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  contentEmoji: {
    fontSize: 16,
  },
  contentInfo: {
    flex: 1,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  contentPreview: {
    fontSize: 10,
    color: '#4A4A4A',
    lineHeight: 14,
  },
}); 