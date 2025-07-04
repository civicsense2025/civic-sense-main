import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Text as RNText,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../atoms/Text';
import { useTheme } from '../../lib/theme-context';
import { useUIStrings } from '../../lib/hooks/useUIStrings';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TranslationScannerOverlayProps {
  isVisible: boolean;
  targetLanguage: string;
  targetLanguageName: string;
  onComplete: () => void;
}

export function TranslationScannerOverlay({
  isVisible,
  targetLanguage,
  targetLanguageName,
  onComplete,
}: TranslationScannerOverlayProps) {
  const { theme } = useTheme();
  const { uiStrings } = useUIStrings();

  // Animation values - use lazy initialization to avoid render-time updates
  const [animationValues] = useState(() => ({
    fadeValue: new Animated.Value(0),
    scaleValue: new Animated.Value(0.8),
    textSwirl1: new Animated.Value(0),
    textSwirl2: new Animated.Value(0),
    textSwirl3: new Animated.Value(0),
    progressValue: new Animated.Value(0),
  }));
  
  const { fadeValue, scaleValue, textSwirl1, textSwirl2, textSwirl3, progressValue } = animationValues;

  // Sample text that will be "translated"
  const sampleTexts = [
    { original: 'Democracy in Action', translated: getDemoTranslation('Democracy in Action', targetLanguage) },
    { original: 'Understanding Power', translated: getDemoTranslation('Understanding Power', targetLanguage) },
    { original: 'Civic Engagement', translated: getDemoTranslation('Civic Engagement', targetLanguage) },
  ];

  // Helper function to get demo translations
  function getDemoTranslation(text: string, lang: string): string {
    const translations: Record<string, Record<string, string>> = {
      'Democracy in Action': {
        es: 'Democracia en Acción',
        zh: '民主行动',
        hi: 'कार्यरत लोकतंत्र',
        ar: 'الديمقراطية في العمل',
        fr: 'Démocratie en Action',
        de: 'Demokratie in Aktion',
        pt: 'Democracia em Ação',
        ru: 'Демократия в действии',
        ja: '実践する民主主義',
        ko: '실천하는 민주주의',
        it: 'Democrazia in Azione',
        vi: 'Dân chủ trong Hành động',
      },
      'Understanding Power': {
        es: 'Entendiendo el Poder',
        zh: '理解权力',
        hi: 'शक्ति को समझना',
        ar: 'فهم السلطة',
        fr: 'Comprendre le Pouvoir',
        de: 'Macht verstehen',
        pt: 'Entendendo o Poder',
        ru: 'Понимание власти',
        ja: '権力を理解する',
        ko: '권력 이해하기',
        it: 'Comprendere il Potere',
        vi: 'Hiểu về Quyền lực',
      },
      'Civic Engagement': {
        es: 'Participación Cívica',
        zh: '公民参与',
        hi: 'नागरिक सहभागिता',
        ar: 'المشاركة المدنية',
        fr: 'Engagement Civique',
        de: 'Bürgerliches Engagement',
        pt: 'Engajamento Cívico',
        ru: 'Гражданское участие',
        ja: '市民参加',
        ko: '시민 참여',
        it: 'Impegno Civico',
        vi: 'Tham gia Công dân',
      },
    };

    return translations[text]?.[lang] || text;
  }

  useEffect(() => {
    if (!isVisible) return;

    // Reset animations
    fadeValue.setValue(0);
    scaleValue.setValue(0.8);
    textSwirl1.setValue(0);
    textSwirl2.setValue(0);
    textSwirl3.setValue(0);
    progressValue.setValue(0);

    // Start the text transformation sequence (2.5 seconds total)
    startTextTransformation();
  }, [isVisible]);

  const startTextTransformation = () => {
    // Entry animation (300ms)
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start text swirling animations in sequence (1.8 seconds total)
      startTextSwirls();
    });
  };

  const startTextSwirls = () => {
    // Stagger the text animations for a wave effect
    const createTextAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        // Swirl out animation (400ms)
        Animated.timing(animValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        // Brief pause (100ms)
        Animated.delay(100),
        // Swirl in animation (400ms)
        Animated.timing(animValue, {
          toValue: 2,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]);
    };

    // Progress bar animation
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Staggered text animations
    Animated.parallel([
      createTextAnimation(textSwirl1, 0),
      createTextAnimation(textSwirl2, 200),
      createTextAnimation(textSwirl3, 400),
    ]).start(() => {
      // Exit animation (400ms)
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      }, 200);
    });
  };

  // Create transform values for text swirling
  const createTextTransform = (animValue: Animated.Value) => {
    const rotateZ = animValue.interpolate({
      inputRange: [0, 0.5, 1, 1.5, 2],
      outputRange: ['0deg', '180deg', '360deg', '0deg', '0deg'],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 0.5, 1, 1.5, 2],
      outputRange: [1, 0.3, 0, 0.3, 1],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.4, 0.6, 1, 1.4, 1.6, 2],
      outputRange: [1, 1, 0, 0, 0, 1, 1],
    });

    return { transform: [{ rotate: rotateZ }, { scale }], opacity };
  };

  // Get current text based on animation progress
  const getCurrentText = (animValue: Animated.Value, index: number) => {
    const [currentPhase, setCurrentPhase] = useState(0);
    
    React.useEffect(() => {
      const listener = animValue.addListener(({ value }) => {
        if (value < 1) {
          setCurrentPhase(0); // Original text
        } else {
          setCurrentPhase(1); // Translated text
        }
      });

      return () => animValue.removeListener(listener);
    }, [animValue]);

    return currentPhase === 0 ? sampleTexts[index]?.original : sampleTexts[index]?.translated;
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        {/* Soft gradient background */}
        <LinearGradient
          colors={[
            theme.background + 'F0',
            theme.primary + '20',
            theme.background + 'F0'
          ]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Main content container */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.languageIndicator, { backgroundColor: theme.primary }]}>
              <Text style={styles.languageFrom}>EN</Text>
              <Text style={styles.languageArrow}>→</Text>
              <Text style={styles.languageTo}>{targetLanguage.toUpperCase()}</Text>
            </View>
            <Text style={[styles.title, { color: theme.foreground }]}>
              Translating to {targetLanguageName}
            </Text>
          </View>

          {/* Text transformation area */}
          <View style={styles.textArea}>
            {sampleTexts.map((textPair, index) => {
              const animValue = index === 0 ? textSwirl1 : index === 1 ? textSwirl2 : textSwirl3;
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.textContainer,
                    createTextTransform(animValue),
                  ]}
                >
                  <TextSwapComponent
                    animValue={animValue}
                    originalText={textPair.original}
                    translatedText={textPair.translated}
                    theme={theme}
                  />
                </Animated.View>
              );
            })}
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: progressValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.foregroundSecondary }]}>
              Transforming content...
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Component to handle text swapping
const TextSwapComponent: React.FC<{
  animValue: Animated.Value;
  originalText: string;
  translatedText: string;
  theme: any;
}> = ({ animValue, originalText, translatedText, theme }) => {
  const [showTranslated, setShowTranslated] = useState(false);

  React.useEffect(() => {
    const listener = animValue.addListener(({ value }) => {
      setShowTranslated(value >= 1);
    });

    return () => animValue.removeListener(listener);
  }, [animValue]);

  return (
    <Text style={[styles.sampleText, { color: showTranslated ? theme.primary : theme.foreground }]}>
      {showTranslated ? translatedText : originalText}
    </Text>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  languageFrom: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceMono-Bold',
  },
  languageArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginHorizontal: 8,
  },
  languageTo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceMono-Bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sampleText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'HelveticaNeue',
  },
  progressSection: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 