/**
 * Translation Animation Overlay - CivicSense Mobile
 * 
 * A delightful animation overlay that displays during language switches
 * to prevent UI jumpiness and provide smooth transitions between languages.
 * Features cute animations, progress indicators, and language-specific visuals.
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useLocalizedFormatting from '../../lib/hooks/useLocalizedFormatting'

interface TranslationAnimationOverlayProps {
  isVisible: boolean
  targetLanguage: string
  targetLanguageName: string
  progress: number // 0-100
  onComplete?: () => void
  estimatedDuration?: number // in milliseconds
}

interface LanguageAnimationConfig {
  emoji: string
  colors: string[]
  textDirection: 'ltr' | 'rtl'
  culturalElement: string
  progressText: string
  loadingMessages: string[]
}

// Language-specific animation configurations
const LANGUAGE_CONFIGS: Record<string, LanguageAnimationConfig> = {
  en: {
    emoji: '🇺🇸',
    colors: ['#1e40af', '#3b82f6', '#60a5fa'],
    textDirection: 'ltr',
    culturalElement: '🗽',
    progressText: 'Translating...',
    loadingMessages: [
      'Switching to English...',
      'Loading civic content...',
      'Almost ready!'
    ]
  },
  es: {
    emoji: '🇪🇸',
    colors: ['#dc2626', '#ef4444', '#f87171'],
    textDirection: 'ltr',
    culturalElement: '💃',
    progressText: 'Traduciendo...',
    loadingMessages: [
      'Cambiando a español...',
      'Cargando contenido cívico...',
      '¡Casi listo!'
    ]
  },
  fr: {
    emoji: '🇫🇷',
    colors: ['#1e40af', '#ffffff', '#dc2626'],
    textDirection: 'ltr',
    culturalElement: '🗼',
    progressText: 'Traduction en cours...',
    loadingMessages: [
      'Passage au français...',
      'Chargement du contenu civique...',
      'Presque prêt !'
    ]
  },
  de: {
    emoji: '🇩🇪',
    colors: ['#000000', '#dc2626', '#facc15'],
    textDirection: 'ltr',
    culturalElement: '🏰',
    progressText: 'Übersetzen...',
    loadingMessages: [
      'Wechsel zu Deutsch...',
      'Lade Bildungsinhalte...',
      'Fast fertig!'
    ]
  },
  ar: {
    emoji: '🇸🇦',
    colors: ['#059669', '#ffffff', '#000000'],
    textDirection: 'rtl',
    culturalElement: '🕌',
    progressText: 'جاري الترجمة...',
    loadingMessages: [
      'التبديل إلى العربية...',
      'تحميل المحتوى المدني...',
      'تقريباً جاهز!'
    ]
  },
  zh: {
    emoji: '🇨🇳',
    colors: ['#dc2626', '#facc15'],
    textDirection: 'ltr',
    culturalElement: '🏮',
    progressText: '翻译中...',
    loadingMessages: [
      '切换到中文...',
      '加载公民内容...',
      '马上就好！'
    ]
  },
  ja: {
    emoji: '🇯🇵',
    colors: ['#dc2626', '#ffffff'],
    textDirection: 'ltr',
    culturalElement: '🌸',
    progressText: '翻訳中...',
    loadingMessages: [
      '日本語に切り替え中...',
      '市民コンテンツを読み込み中...',
      'もうすぐ完了！'
    ]
  },
  ko: {
    emoji: '🇰🇷',
    colors: ['#dc2626', '#1e40af', '#ffffff'],
    textDirection: 'ltr',
    culturalElement: '🏯',
    progressText: '번역 중...',
    loadingMessages: [
      '한국어로 전환 중...',
      '시민 콘텐츠 로딩 중...',
      '거의 완료!'
    ]
  },
  pt: {
    emoji: '🇵🇹',
    colors: ['#059669', '#dc2626', '#facc15'],
    textDirection: 'ltr',
    culturalElement: '⚽',
    progressText: 'Traduzindo...',
    loadingMessages: [
      'Mudando para português...',
      'Carregando conteúdo cívico...',
      'Quase pronto!'
    ]
  },
  ru: {
    emoji: '🇷🇺',
    colors: ['#ffffff', '#1e40af', '#dc2626'],
    textDirection: 'ltr',
    culturalElement: '🏛️',
    progressText: 'Перевод...',
    loadingMessages: [
      'Переключение на русский...',
      'Загрузка гражданского контента...',
      'Почти готово!'
    ]
  },
  it: {
    emoji: '🇮🇹',
    colors: ['#059669', '#ffffff', '#dc2626'],
    textDirection: 'ltr',
    culturalElement: '🍝',
    progressText: 'Traduzione...',
    loadingMessages: [
      'Passaggio all\'italiano...',
      'Caricamento contenuto civico...',
      'Quasi pronto!'
    ]
  }
}

export function TranslationAnimationOverlay({
  isVisible,
  targetLanguage,
  targetLanguageName,
  progress,
  onComplete,
  estimatedDuration = 2000
}: TranslationAnimationOverlayProps) {
  const { uiStrings } = useLocalizedFormatting()
  const insets = useSafeAreaInsets()
  const [messageIndex, setMessageIndex] = useState(0)
  const [bounceAnim] = useState(new Animated.Value(0))
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0))
  const [rotateAnim] = useState(new Animated.Value(0))
  const [progressAnim] = useState(new Animated.Value(0))

  // Get language config with fallback
  const config = LANGUAGE_CONFIGS[targetLanguage] || LANGUAGE_CONFIGS.en

  // Animation effects
  useEffect(() => {
    if (isVisible) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()

      // Continuous bounce animation for emoji
      const bounceSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
      bounceSequence.start()

      // Gentle rotation for cultural element
      const rotateSequence = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      rotateSequence.start()

      return () => {
        bounceSequence.stop()
        rotateSequence.stop()
      }
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.()
      })
    }
  }, [isVisible])

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [progress])

  // Cycle through loading messages
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % config.loadingMessages.length)
    }, estimatedDuration / config.loadingMessages.length)

    return () => clearInterval(interval)
  }, [isVisible, config.loadingMessages.length, estimatedDuration])

  if (!isVisible) return null

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  })

  const rotateTransform = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View
      style={[
        styles.overlay,
        { 
          paddingTop: insets.top,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />
      
      <LinearGradient
        colors={[config.colors[0], config.colors[config.colors.length - 1], 'rgba(255,255,255,0.9)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Main Language Emoji with Bounce */}
        <Animated.View
          style={[
            styles.emojiContainer,
            {
              transform: [
                { translateY: bounceTransform },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.mainEmoji}>{config.emoji}</Text>
        </Animated.View>

        {/* Cultural Element with Rotation */}
        <Animated.View
          style={[
            styles.culturalElement,
            {
              transform: [{ rotate: rotateTransform }]
            }
          ]}
        >
          <Text style={styles.culturalEmoji}>{config.culturalElement}</Text>
        </Animated.View>

        {/* Language Name */}
        <View style={styles.languageInfo}>
          <Text style={[
            styles.languageName,
            { writingDirection: config.textDirection }
          ]}>
            {targetLanguageName}
          </Text>
          <Text style={[
            styles.progressText,
            { writingDirection: config.textDirection }
          ]}>
            {config.progressText}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: config.colors[0],
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        </View>

        {/* Loading Messages */}
        <View style={styles.messageContainer}>
          <Animated.Text
            key={messageIndex}
            style={[
              styles.loadingMessage,
              { 
                writingDirection: config.textDirection,
                opacity: fadeAnim
              }
            ]}
          >
            {config.loadingMessages[messageIndex]}
          </Animated.Text>
        </View>

        {/* Floating Particles Animation */}
        <FloatingParticles colors={config.colors} />
      </View>
    </Animated.View>
  )
}

// Floating particles for extra visual appeal
function FloatingParticles({ colors }: { colors: string[] }) {
  const particles = Array.from({ length: 6 }, (_, i) => i)
  
  return (
    <View style={styles.particlesContainer}>
      {particles.map((particle, index) => (
        <FloatingParticle
          key={particle}
          color={colors[index % colors.length]}
          delay={index * 200}
          size={Math.random() * 4 + 2}
        />
      ))}
    </View>
  )
}

function FloatingParticle({ 
  color, 
  delay, 
  size 
}: { 
  color: string
  delay: number
  size: number 
}) {
  const [translateY] = useState(new Animated.Value(0))
  const [opacity] = useState(new Animated.Value(0))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 3000 + Math.random() * 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    
    animation.start()
    return () => animation.stop()
  }, [delay])

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          opacity,
          transform: [{ translateY }],
          left: `${Math.random() * 80 + 10}%`,
        }
      ]}
    />
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: '80%',
  },
  emojiContainer: {
    marginBottom: 20,
  },
  mainEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  culturalElement: {
    position: 'absolute',
    top: -20,
    right: -10,
  },
  culturalEmoji: {
    fontSize: 32,
    opacity: 0.7,
  },
  languageInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  languageName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  messageContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessage: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
    textAlign: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.6,
  },
})

export default TranslationAnimationOverlay 