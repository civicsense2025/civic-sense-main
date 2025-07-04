import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native'
import { StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { DB_TABLES, DB_COLUMNS } from '../../lib/database-constants'
import { Ionicons } from '@expo/vector-icons'

interface CivicAssessmentProps {
  onComplete?: (data: any) => void
  onSkip?: (reason: string) => void
  userId: string
  autoStart?: boolean
}

interface AssessmentQuestion {
  id: string
  question_text: string
  options: string[]
  correct_answer: number
  category_id?: string
  difficulty_level?: number
  skill_area?: string
}

interface AssessmentResult {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number
}

type AssessmentType = 'quick' | 'comprehensive' | null

export function CivicAssessment({ 
  onComplete, 
  onSkip, 
  userId,
  autoStart = false
}: CivicAssessmentProps) {
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(autoStart ? 'quick' : null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [assessmentStartTime, setAssessmentStartTime] = useState<number | null>(null)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    if (autoStart && assessmentType) {
      loadAssessmentQuestions(assessmentType)
    }
  }, [autoStart, assessmentType])

  const loadAssessmentQuestions = async (type: AssessmentType) => {
    if (!type) return

    setLoading(true)
    try {
      const questionLimit = type === 'quick' ? 25 : 150
      
      // Create fallback questions since database might not be ready
      const fallbackQuestions: AssessmentQuestion[] = [
        {
          id: 'fallback-1',
          question_text: 'Which amendment to the U.S. Constitution guarantees freedom of speech?',
          options: ['First Amendment', 'Second Amendment', 'Fourth Amendment', 'Fifth Amendment'],
          correct_answer: 0,
          difficulty_level: 2,
          skill_area: 'Constitutional Rights'
        },
        {
          id: 'fallback-2',
          question_text: 'How many senators does each U.S. state have?',
          options: ['1', '2', '3', 'It varies by population'],
          correct_answer: 1,
          difficulty_level: 1,
          skill_area: 'Government Structure'
        },
        {
          id: 'fallback-3',
          question_text: 'What is the term length for a U.S. House of Representatives member?',
          options: ['2 years', '4 years', '6 years', '8 years'],
          correct_answer: 0,
          difficulty_level: 2,
          skill_area: 'Elections'
        }
      ]

      try {
        // Try to get questions from user_assessment_questions table
        const { data: questionsData, error } = await supabase
          .from('user_assessment_questions')
          .select(`
            id,
            question_text,
            options,
            correct_answer_index,
            category_id,
            difficulty_level,
            skill_area
          `)
          .eq('is_active', true)
          .order('difficulty_level', { ascending: true })
          .limit(questionLimit)

        if (error) {
          console.error('Database error, using fallback questions:', error)
          throw error
        }

        if (questionsData && questionsData.length > 0) {
          const transformedQuestions: AssessmentQuestion[] = questionsData.map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: q.correct_answer_index || 0,
            category_id: q.category_id,
            difficulty_level: q.difficulty_level,
            skill_area: q.skill_area
          }))
          setQuestions(transformedQuestions)
        } else {
          throw new Error('No questions found in database')
        }
      } catch (err) {
        console.warn('Using fallback questions:', err)
        // Use fallback questions and randomize/repeat them to reach the target count
        let questionSet = [...fallbackQuestions]
        while (questionSet.length < Math.min(questionLimit, 25)) {
          questionSet = [...questionSet, ...fallbackQuestions]
        }
        setQuestions(questionSet.slice(0, questionLimit))
      }

      setAssessmentStartTime(Date.now())
      setQuestionStartTime(Date.now())
    } catch (error) {
      console.error('Error in loadAssessmentQuestions:', error)
      Alert.alert('Error', 'Failed to load assessment questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssessmentTypeSelection = (type: AssessmentType) => {
    setAssessmentType(type)
    loadAssessmentQuestions(type)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert('Please select an answer', 'Choose an option to continue.')
      return
    }

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) {
      Alert.alert('Error', 'Question data is missing. Please try again.')
      return
    }

    const timeSpent = Date.now() - questionStartTime
    
    const result: AssessmentResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect: selectedAnswer === currentQuestion.correct_answer,
      timeSpent
    }

    const newAnswers = [...answers, result]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setQuestionStartTime(Date.now())
    } else {
      // Assessment complete
      completeAssessment(newAnswers)
    }
  }

  const completeAssessment = async (finalAnswers: AssessmentResult[]) => {
    const correctAnswers = finalAnswers.filter(answer => answer.isCorrect).length
    const totalQuestions = questions.length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const totalTimeSpent = Date.now() - (assessmentStartTime || Date.now())

    const assessmentResults = {
      assessmentType,
      score,
      correctAnswers,
      totalQuestions,
      timeSpent: totalTimeSpent,
      level_achieved: score >= 80 ? 'advanced' : score >= 60 ? 'intermediate' : 'beginner',
      questions,
      answers: finalAnswers
    }

    setResults(assessmentResults)

    try {
      // Save assessment attempt to user_assessment_attempts table
      const { error: attemptError } = await supabase
        .from('user_assessment_attempts')
        .insert({
          user_id: userId,
          assessment_type: assessmentType,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          score_percentage: score,
          time_spent_seconds: Math.round(totalTimeSpent / 1000),
          started_at: new Date(assessmentStartTime || Date.now()).toISOString(),
          completed_at: new Date().toISOString(),
          questions_data: questions,
          answers_data: finalAnswers
        })

      if (attemptError) {
        console.error('Error saving assessment attempt:', attemptError)
      }

    } catch (error) {
      console.error('Error saving assessment results:', error)
    }

    // Complete with results
    if (onComplete) {
      onComplete(assessmentResults)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip('assessment_skipped')
    }
  }

  const handleRetake = () => {
    setAssessmentType(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers([])
    setSelectedAnswer(null)
    setResults(null)
  }

  // Results screen
  if (results) {
    const { score, correctAnswers, totalQuestions, level_achieved } = results
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.resultsHeader}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{score}%</Text>
            </View>
            <Text style={styles.resultsTitle}>Assessment Complete!</Text>
            <Text style={styles.resultsSubtitle}>
              You got {correctAnswers} out of {totalQuestions} questions correct
            </Text>
          </View>

          <View style={styles.levelCard}>
            <Text style={styles.levelTitle}>Your Civic Knowledge Level</Text>
            <Text style={[
              styles.levelText, 
              level_achieved === 'advanced' ? styles.levelAdvanced :
              level_achieved === 'intermediate' ? styles.levelIntermediate :
              styles.levelBeginner
            ]}>
              {level_achieved.charAt(0).toUpperCase() + level_achieved.slice(1)}
            </Text>
            <Text style={styles.levelDescription}>
              {level_achieved === 'advanced' 
                ? 'Excellent! You have strong civic knowledge.' 
                : level_achieved === 'intermediate'
                ? 'Good foundation! Continue learning to deepen your understanding.'
                : 'Great start! Focus on building your civic knowledge foundation.'}
            </Text>
          </View>

          <View style={styles.resultsActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>Take Again</Text>
            </TouchableOpacity>
            
            {onComplete && (
              <TouchableOpacity style={styles.continueButton} onPress={() => onComplete!(results)}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading assessment...</Text>
        </View>
      </View>
    )
  }

  // Assessment type selection screen
  if (!assessmentType) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.introHeader}>
            <Ionicons name="school-outline" size={64} color="#3B82F6" />
            <Text style={styles.title}>Civic Knowledge Assessment</Text>
            <Text style={styles.subtitle}>
              Discover your civic knowledge level and get personalized learning recommendations.
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Quick Assessment Option */}
            <TouchableOpacity 
              style={styles.assessmentOption}
              onPress={() => handleAssessmentTypeSelection('quick')}
            >
              <View style={styles.optionHeader}>
                <Ionicons name="flash-outline" size={24} color="#10B981" />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Quick Assessment</Text>
                  <Text style={styles.optionBadge}>25 questions</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                A focused evaluation covering essential civic concepts. Perfect for a quick knowledge check.
              </Text>
              <View style={styles.optionMeta}>
                <Text style={styles.optionTime}>⏱️ About 10-15 minutes</Text>
                <Text style={styles.optionAccuracy}>📊 Good accuracy</Text>
              </View>
            </TouchableOpacity>

            {/* Comprehensive Assessment Option */}
            <TouchableOpacity 
              style={styles.assessmentOption}
              onPress={() => handleAssessmentTypeSelection('comprehensive')}
            >
              <View style={styles.optionHeader}>
                <Ionicons name="library-outline" size={24} color="#8B5CF6" />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Comprehensive Assessment</Text>
                  <Text style={[styles.optionBadge, styles.optionBadgeComprehensive]}>150 questions</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                An in-depth evaluation across all civic knowledge areas for the most accurate results and personalized recommendations.
              </Text>
              <View style={styles.optionMeta}>
                <Text style={styles.optionTime}>⏱️ About 45-60 minutes</Text>
                <Text style={styles.optionAccuracy}>📊 Highest accuracy</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            {onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    )
  }

  // Assessment questions screen
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available. Please try again.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setAssessmentType(null)}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Question data is missing. Please try again.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setAssessmentType(null)}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Progress Header */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.assessmentTypeIndicator}>
            {assessmentType === 'quick' ? 'Quick Assessment' : 'Comprehensive Assessment'}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
          
          {/* Skill Area Badge */}
          {currentQuestion.skill_area && (
            <Text style={styles.skillArea}>{currentQuestion.skill_area}</Text>
          )}
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.answerOption,
                selectedAnswer === index && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <View style={styles.optionIndicator}>
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.answerText,
                selectedAnswer === index && styles.selectedAnswerText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !selectedAnswer && styles.disabledButton]}
            onPress={handleNextQuestion}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  assessmentOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionBadge: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  optionBadgeComprehensive: {
    backgroundColor: '#8B5CF6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  optionTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionAccuracy: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionInfo: {
    flexDirection: 'column',
  },
  optionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  assessmentTypeIndicator: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 28,
    marginBottom: 8,
  },
  skillArea: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  selectedAnswerText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  navigationContainer: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  introHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    backgroundColor: '#E5E7EB',
    borderRadius: 100,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
     levelText: {
     fontSize: 16,
     color: '#1F2937',
     fontWeight: '600',
     marginBottom: 8,
   },
   levelAdvanced: {
     color: '#059669',
   },
   levelIntermediate: {
     color: '#D97706',
   },
   levelBeginner: {
     color: '#DC2626',
   },
   levelDescription: {
     fontSize: 14,
     color: '#6B7280',
     textAlign: 'center',
   },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}) 