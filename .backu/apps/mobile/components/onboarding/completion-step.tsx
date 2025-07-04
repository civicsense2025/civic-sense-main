import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native'
import { StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EnhancedOnboardingService, type PersonalizedQuiz } from '../../lib/services/onboarding-service'

interface CompletionStepProps {
  onComplete: (data: any) => void
  onboardingState: any
  userId: string
}

export function CompletionStep({ onComplete, onboardingState, userId }: CompletionStepProps) {
  const [personalizedQuizzes, setPersonalizedQuizzes] = useState<PersonalizedQuiz[]>([])
  const [loading, setLoading] = useState(true)

  // Animation values
  const checkmarkScale = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const contentSlideY = useRef(new Animated.Value(50)).current
  const quizCardsAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchPersonalizedQuizzes()
    startCelebrationAnimation()
  }, [])

  const fetchPersonalizedQuizzes = async () => {
    try {
      setLoading(true)
      
      // Get personalized quizzes - simplified call since the RPC function 
      // will determine personalization based on user's onboarding data
      const quizzes = await EnhancedOnboardingService.getPersonalizedQuizzes(
        userId,
        3 // limit to 3 recommendations
      )

      setPersonalizedQuizzes(quizzes)
    } catch (error) {
      console.error('Error fetching personalized quizzes:', error)
      // Continue with empty quizzes - don't block completion
    } finally {
      setLoading(false)
    }
  }

  const startCelebrationAnimation = () => {
    // Sequence of celebration animations
    Animated.sequence([
      // Checkmark appears with bounce
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      // Title fades in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start()

    // Content slides up simultaneously with title
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentSlideY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(quizCardsAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start()
    }, 300)
  }

  const handleStartLearning = () => {
    // Complete onboarding and navigate to main app
    onComplete({
      onboarding_completed: true,
      recommended_quizzes: personalizedQuizzes,
      completion_timestamp: new Date().toISOString()
    })
  }

  const handleTakeAssessment = () => {
    // Complete onboarding but indicate user wants to take assessment first
    onComplete({
      onboarding_completed: true,
      take_assessment: true,
      recommended_quizzes: personalizedQuizzes,
      completion_timestamp: new Date().toISOString()
    })
  }

  const handleQuizSelect = (quiz: PersonalizedQuiz) => {
    // Complete onboarding and go directly to selected quiz
    onComplete({
      onboarding_completed: true,
      start_quiz_id: quiz.topic_id,
      recommended_quizzes: personalizedQuizzes,
      completion_timestamp: new Date().toISOString()
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Celebration Section */}
      <View style={styles.celebrationSection}>
        <Animated.View 
          style={[
            styles.checkmarkContainer,
            { transform: [{ scale: checkmarkScale }] }
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={styles.congratsTitle}>🎉 You're All Set!</Text>
          <Text style={styles.congratsSubtitle}>
            Your personalized civic learning experience is ready to go
          </Text>
        </Animated.View>
      </View>

      {/* Onboarding Summary */}
      <Animated.View 
        style={[
          styles.summarySection,
          { transform: [{ translateY: contentSlideY }] }
        ]}
      >
        <Text style={styles.summaryTitle}>Your Learning Profile</Text>
        
        <View style={styles.summaryCard}>
          {/* Selected Categories */}
          {onboardingState.categories?.categories && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Interested Topics</Text>
              <View style={styles.categoryTags}>
                {onboardingState.categories.categories.slice(0, 3).map((category: any) => (
                  <View key={category.id} style={styles.categoryTag}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={styles.categoryTagText}>{category.name}</Text>
                  </View>
                ))}
                {onboardingState.categories.categories.length > 3 && (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      +{onboardingState.categories.categories.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Skills Count */}
          {onboardingState.skills?.skills?.length > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Skills to Develop</Text>
              <Text style={styles.summaryValue}>
                {onboardingState.skills.skills.length} skill{onboardingState.skills.skills.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          )}

          {/* Preferences */}
          {onboardingState.preferences && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Learning Style</Text>
              <Text style={styles.summaryValue}>
                {onboardingState.preferences.learningStyle === 'mixed' ? 'Mixed content' :
                 onboardingState.preferences.learningStyle === 'visual' ? 'Visual learner' :
                 'Reading focused'} • {onboardingState.preferences.difficulty} difficulty
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* What's Next Section */}
      <Animated.View 
        style={[
          styles.nextStepsSection,
          { opacity: quizCardsAnimation }
        ]}
      >
        <Text style={styles.nextStepsTitle}>
          🚀 Ready to Start Learning?
        </Text>
        <Text style={styles.nextStepsSubtitle}>
          Here are some ways to begin your civic education journey:
        </Text>

        <View style={styles.nextStepsCards}>
          {/* Start with Quizzes */}
          <TouchableOpacity 
            style={styles.nextStepCard}
            onPress={handleStartLearning}
            activeOpacity={0.8}
          >
            <View style={styles.nextStepCardContent}>
              <Ionicons name="play-circle" size={32} color="#3B82F6" />
              <Text style={styles.nextStepCardTitle}>Start Learning</Text>
              <Text style={styles.nextStepCardDescription}>
                Jump into quizzes based on your interests
              </Text>
            </View>
          </TouchableOpacity>

          {/* Take Assessment */}
          <TouchableOpacity 
            style={styles.nextStepCard}
            onPress={handleTakeAssessment}
            activeOpacity={0.8}
          >
            <View style={styles.nextStepCardContent}>
              <Ionicons name="analytics" size={32} color="#10B981" />
              <Text style={styles.nextStepCardTitle}>Take Assessment</Text>
              <Text style={styles.nextStepCardDescription}>
                Test your civic knowledge first (optional)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Personalized Recommendations */}
      {personalizedQuizzes.length > 0 && (
        <Animated.View 
          style={[
            styles.recommendationsSection,
            { opacity: quizCardsAnimation }
          ]}
        >
          <Text style={styles.recommendationsTitle}>
            🎯 Recommended for You
          </Text>
          <Text style={styles.recommendationsSubtitle}>
            Based on your interests, here are some great starting points:
          </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding your perfect quizzes...</Text>
          </View>
        ) : personalizedQuizzes.length > 0 ? (
          <View style={styles.quizGrid}>
            {personalizedQuizzes.map((quiz, index) => (
              <Animated.View
                key={quiz.topic_id}
                style={[
                  styles.quizCard,
                  {
                    transform: [{
                      translateY: quizCardsAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30 * (index + 1), 0],
                      }),
                    }],
                    opacity: quizCardsAnimation,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.quizCardContent}
                  onPress={() => handleQuizSelect(quiz)}
                  activeOpacity={0.8}
                >
                  <View style={styles.quizHeader}>
                    <Text style={styles.quizEmoji}>{quiz.emoji}</Text>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.questionCountText}>{quiz.question_count} Q's</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.quizTitle}>{quiz.topic_title}</Text>
                  <Text style={styles.quizDescription} numberOfLines={2}>
                    {quiz.description}
                  </Text>
                  
                  <View style={styles.quizMeta}>
                    <Text style={styles.quizCategory}>{quiz.category_name}</Text>
                    <View style={styles.relevanceScore}>
                      <Text style={styles.relevanceText}>
                        {Math.round(quiz.relevance_score * 100)}% match
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.noQuizzesContainer}>
            <Text style={styles.noQuizzesText}>
              Great! You're ready to explore all available quizzes.
            </Text>
          </View>
        )}
      </Animated.View>)}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.startLearningButton}
          onPress={handleStartLearning}
          activeOpacity={0.8}
        >
          <Text style={styles.startLearningButtonText}>
            🚀 Start Learning
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can always change your preferences in settings later!
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFBFF',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  celebrationSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  checkmark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryItem: {
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  assessmentResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assessmentDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  assessmentMeta: {
    fontSize: 14,
    color: '#64748B',
  },
  recommendationsSection: {
    marginBottom: 32,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  quizGrid: {
    gap: 16,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quizCardContent: {
    padding: 20,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizEmoji: {
    fontSize: 32,
  },
  questionCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  relevanceScore: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  relevanceText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noQuizzesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noQuizzesText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 16,
  },
  startLearningButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startLearningButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextStepsSection: {
    marginBottom: 32,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  nextStepsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  nextStepsCards: {
    flexDirection: 'row',
    gap: 12,
  },
  nextStepCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nextStepCardContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  },
  nextStepCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  nextStepCardDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
}) 