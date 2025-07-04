import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useAuth } from '../../lib/auth-context'
import { PersonalizationService, type QuizPersonalization } from '../../lib/services'
import { useTheme } from '../../lib/theme-context'
import { Card } from '../ui/Card'
import { spacing, borderRadius, fontFamily } from '../../lib/theme'

interface PersonalizedQuizLoaderProps {
  onQuizReady: (settings: QuizPersonalization) => void
  onSkipPersonalization?: () => void
}

export function PersonalizedQuizLoader({ 
  onQuizReady, 
  onSkipPersonalization 
}: PersonalizedQuizLoaderProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [personalization, setPersonalization] = useState<QuizPersonalization | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadPersonalization()
    }
  }, [user?.id])

  const loadPersonalization = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Get personalized quiz settings
      const settings = await PersonalizationService.getQuizPersonalization(user.id)
      setPersonalization(settings)

      // Auto-proceed after showing the personalization
      setTimeout(() => {
        onQuizReady(settings)
      }, 1500)
    } catch (err) {
      console.error('Error loading personalization:', err)
      setError('Could not load your preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipPersonalization = () => {
    const defaultSettings: QuizPersonalization = {
      preferredCategories: [],
      preferredSkills: [],
      difficulty: 2,
      questionCount: 10,
      showExplanations: true,
      showSources: true,
    }
    onQuizReady(defaultSettings)
    onSkipPersonalization?.()
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Card style={{ ...styles.card, backgroundColor: theme.card }} variant="outlined">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foreground }]}>
            Personalizing your quiz experience...
          </Text>
        </Card>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Card style={{ ...styles.card, backgroundColor: theme.card }} variant="outlined">
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSkipPersonalization}
          >
            <Text style={styles.buttonText}>Continue without personalization</Text>
          </TouchableOpacity>
        </Card>
      </View>
    )
  }

  if (personalization) {
    return (
      <View style={styles.container}>
        <Card style={{ ...styles.card, backgroundColor: theme.card }} variant="outlined">
          <Text style={[styles.title, { color: theme.foreground }]}>
            🎯 Quiz Personalized!
          </Text>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.foregroundSecondary }]}>
                Difficulty:
              </Text>
              <Text style={[styles.detailValue, { color: theme.foreground }]}>
                {personalization.difficulty === 1 ? 'Beginner' : 
                 personalization.difficulty === 2 ? 'Intermediate' : 'Advanced'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.foregroundSecondary }]}>
                Questions:
              </Text>
              <Text style={[styles.detailValue, { color: theme.foreground }]}>
                {personalization.questionCount}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.foregroundSecondary }]}>
                Focus areas:
              </Text>
              <Text style={[styles.detailValue, { color: theme.foreground }]}>
                {personalization.preferredCategories.length > 0 
                  ? `${personalization.preferredCategories.length} selected`
                  : 'All categories'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
            Starting your personalized quiz...
          </Text>
        </Card>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.text,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.display,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.text,
    marginTop: spacing.md,
  },
  details: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: fontFamily.text,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
}) 