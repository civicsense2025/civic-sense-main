import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { Card } from '../../../components/ui/Card';
import { spacing, borderRadius } from '../../../lib/theme';
import { AssessmentEngine, type AssessmentQuestion, type AssessmentSession } from '../../../lib/services/assessment-engine';
import { ResultIcon } from '../../../components/atoms/ResultIcon';
import { AutoAdvanceLoader } from '../../../components/ui/AutoAdvanceLoader';
import { 
  EnhancedAssessmentProgressStorage, 
  type AssessmentProgress 
} from '../../../lib/enhanced-progress-storage';
import { AssessmentCleanupService } from '../../../lib/services/assessment-cleanup-service';
import { CivicsTestCooldownService } from '../../../lib/services/civics-test-cooldown-service';

export default function AssessmentSessionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ 
    id: string; 
    type?: 'civics_test' | 'skill_assessment' | 'placement_test';
  }>();
  
  const assessmentId = params.id;
  const assessmentType = params.type || 'civics_test';
  
  // State
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wrongAnswers, setWrongAnswers] = useState<Record<string, { question: AssessmentQuestion; userAnswer: string; correctAnswer: string }>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAutoAdvance, setShowAutoAdvance] = useState(false);
  const [progressTracker, setProgressTracker] = useState<EnhancedAssessmentProgressStorage | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState<AssessmentProgress | null>(null);
  
  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());

  // Initialize assessment
  useEffect(() => {
    initializeAssessment();
  }, []);

  // Cleanup progress tracking on unmount
  useEffect(() => {
    return () => {
      if (progressTracker) {
        progressTracker.stopProgressTracking();
      }
    };
  }, [progressTracker]);

  const initializeAssessment = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        Alert.alert('Authentication Required', 'Please sign in to take the assessment.');
        router.back();
        return;
      }

      // Check for cooldown period first (for civics test)
      if (assessmentType === 'civics_test') {
        const cooldownStatus = await CivicsTestCooldownService.checkCooldownStatus(user.id);
        
        if (cooldownStatus.isInCooldown) {
          const timeRemaining = CivicsTestCooldownService.formatTimeRemaining(
            cooldownStatus.daysRemaining,
            cooldownStatus.hoursRemaining
          );
          
          Alert.alert(
            'Test Unavailable',
            `You completed the civics test recently and must wait ${timeRemaining} before retaking it. This waiting period helps reinforce your learning.${cooldownStatus.lastScore ? `\n\nYour last score: ${cooldownStatus.lastScore}%` : ''}`,
            [
              {
                text: 'View Wrong Answers',
                onPress: async () => {
                  // Navigate to wrong answers review if available
                  const reviewData = await CivicsTestCooldownService.getWrongAnswersForReview(user.id);
                  if (reviewData.canReview && reviewData.wrongAnswers) {
                    // TODO: Navigate to wrong answers review screen
                    Alert.alert('Review Available', 'Wrong answers review will be implemented in the next update.');
                  } else {
                    Alert.alert('No Review Available', 'No wrong answers to review at this time.');
                  }
                }
              },
              {
                text: 'OK',
                style: 'cancel',
                onPress: () => router.back()
              }
            ]
          );
          return;
        }
      }

      // Check for existing progress
      const existingProgress = await EnhancedAssessmentProgressStorage.loadProgress(assessmentId);
      
      if (existingProgress) {
        // Resume existing assessment
        console.log('📖 Resuming existing assessment progress');
        
        Alert.alert(
          'Resume Assessment?',
          `You have an incomplete assessment with ${existingProgress.metadata.questionsAnswered}/${existingProgress.metadata.totalQuestions} questions answered. Would you like to continue where you left off?`,
          [
            {
              text: 'Start Over',
              style: 'destructive',
              onPress: () => startOverWithCleanup(),
            },
            {
              text: 'Resume',
              style: 'default',
              onPress: () => resumeAssessment(existingProgress),
            },
          ]
        );
        return;
      }

      // Start new assessment
      await startNewAssessment();
    } catch (error) {
      console.error('❌ Error initializing assessment:', error);
      Alert.alert('Error', 'Failed to initialize assessment. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startOverWithCleanup = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Authentication Required', 'Please sign in to continue.');
        return;
      }

      console.log('🧹 Starting assessment cleanup before fresh start...');

      // Clean up previous assessment data
      const cleanupResult = await AssessmentCleanupService.cleanupCivicsTestData(user.id);

      if (cleanupResult.success) {
        console.log('✅ Assessment cleanup completed successfully');
      } else {
        console.warn('⚠️ Assessment cleanup had issues:', cleanupResult.error);
        // Continue anyway - we'll still start fresh
      }

      // Start new assessment after cleanup
      await startNewAssessment();
    } catch (error) {
      console.error('❌ Error during start over with cleanup:', error);
      Alert.alert('Error', 'Failed to start over. Please try again.');
    }
  };

  const startNewAssessment = async () => {
    try {
      // Load questions based on assessment type
      let questionsResponse;
      if (assessmentType === 'civics_test' || assessmentId === 'civics-comprehensive-test') {
        questionsResponse = await AssessmentEngine.loadCivicsTestQuestions({
          limit: 50,
          randomize: true
        });
      } else {
        throw new Error('Assessment type not supported yet');
      }

      if (questionsResponse.error || !questionsResponse.data) {
        throw new Error(questionsResponse.error?.message || 'Failed to load questions');
      }

      setQuestions(questionsResponse.data);

      // Create session
      const sessionResponse = await AssessmentEngine.createAssessmentSession(
        user!.id,
        assessmentType,
        questionsResponse.data
      );

      if (sessionResponse.error || !sessionResponse.data) {
        throw new Error(sessionResponse.error?.message || 'Failed to create session');
      }

      setSession(sessionResponse.data);

      // Initialize progress tracking
      const initialProgress = await EnhancedAssessmentProgressStorage.createInitialProgress(
        sessionResponse.data,
        questionsResponse.data
      );

      setAssessmentProgress(initialProgress);

      // Start automatic progress tracking
      const tracker = EnhancedAssessmentProgressStorage.startProgressTracking(
        sessionResponse.data.id,
        initialProgress,
        (success) => {
          if (!success) {
            console.warn('⚠️ Failed to save assessment progress');
          }
        }
      );

      setProgressTracker(tracker);
      
      console.log('✅ Assessment initialized successfully');
    } catch (error) {
      console.error('❌ Error starting new assessment:', error);
      throw error;
    }
  };

  const resumeAssessment = async (existingProgress: AssessmentProgress) => {
    try {
      setQuestions(existingProgress.questionsData);
      setCurrentQuestionIndex(existingProgress.currentQuestionIndex);
      setAnswers(existingProgress.answers);
      setAssessmentProgress(existingProgress);

      // Restore wrong answers from progress metadata
      if (existingProgress.metadata && existingProgress.metadata.wrongAnswers) {
        setWrongAnswers(existingProgress.metadata.wrongAnswers);
        console.log(`📖 Restored ${Object.keys(existingProgress.metadata.wrongAnswers).length} wrong answers`);
      }

      // Create session object from progress
      const resumedSession: AssessmentSession = {
        id: existingProgress.sessionId,
        user_id: existingProgress.userId!,
        assessment_type: existingProgress.assessmentType,
        questions: existingProgress.questionsData,
        current_question_index: existingProgress.currentQuestionIndex,
        answers: existingProgress.answers,
        started_at: existingProgress.startedAt,
      };

      setSession(resumedSession);

      // Resume progress tracking
      const tracker = EnhancedAssessmentProgressStorage.startProgressTracking(
        existingProgress.sessionId,
        existingProgress,
        (success) => {
          if (!success) {
            console.warn('⚠️ Failed to save assessment progress');
          }
        }
      );

      setProgressTracker(tracker);

      console.log('✅ Assessment resumed successfully');
    } catch (error) {
      console.error('❌ Error resuming assessment:', error);
      Alert.alert('Error', 'Failed to resume assessment. Starting over.');
      await startNewAssessment();
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || isSubmitting) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !session || isSubmitting) return;

    setIsSubmitting(true);
    questionStartTimeRef.current = Date.now();

    try {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) {
        console.error('❌ No current question available');
        return;
      }
      
      const questionResponseTime = (Date.now() - questionStartTimeRef.current) / 1000;
      const totalTimeSpent = (Date.now() - startTimeRef.current) / 1000;

      // Update answers
      const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
      setAnswers(newAnswers);

      // Track wrong answers for review later
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;
      if (!isCorrect) {
        const newWrongAnswers = {
          ...wrongAnswers,
          [currentQuestion.id]: {
            question: currentQuestion,
            userAnswer: selectedAnswer,
            correctAnswer: currentQuestion.correct_answer
          }
        };
        setWrongAnswers(newWrongAnswers);
        console.log(`❌ Wrong answer tracked for question ${currentQuestion.id}`);
      }

      // Update progress storage
      if (assessmentProgress) {
        const success = await EnhancedAssessmentProgressStorage.updateProgress(
          session.id,
          currentQuestion.id,
          selectedAnswer,
          currentQuestionIndex,
          totalTimeSpent
        );

        if (success) {
          // Update local progress state
          const updatedProgress = {
            ...assessmentProgress,
            currentQuestionIndex,
            answers: newAnswers,
            timeSpent: totalTimeSpent,
            lastSavedAt: new Date(),
            metadata: {
              ...assessmentProgress.metadata,
              questionsAnswered: Object.keys(newAnswers).length,
              wrongAnswers: wrongAnswers,
            },
          };
          setAssessmentProgress(updatedProgress);
        }
      }

      // Submit answer to assessment engine
      const submitResponse = await AssessmentEngine.submitAnswer(
        session.id,
        currentQuestion.id,
        selectedAnswer
      );

      if (submitResponse.error) {
        console.warn('⚠️ Failed to submit answer to database:', submitResponse.error);
        // Continue anyway - local progress is saved
      }

      // Show result
      setShowResult(true);

      // Show auto-advance loader (10 seconds)
      setShowAutoAdvance(true);

    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex >= questions.length - 1) {
      // Assessment complete
      await handleAssessmentComplete();
      return;
    }

    // Reset for next question
    setSelectedAnswer(null);
    setShowResult(false);
    setShowAutoAdvance(false);
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    questionStartTimeRef.current = Date.now();

    // Update progress storage with new question index (without corrupting answers)
    if (assessmentProgress && session) {
      // Update the local progress state without calling updateProgress 
      // (which would add empty keys to answers object)
      const updatedProgress = {
        ...assessmentProgress,
        currentQuestionIndex: nextIndex,
        timeSpent: (Date.now() - startTimeRef.current) / 1000,
        lastSavedAt: new Date(),
      };
      setAssessmentProgress(updatedProgress);
      
      // Save to storage directly without modifying answers
      const storageKey = `@assessment_progress_${session.id}`;
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedProgress));
        console.log(`📊 Updated question index to ${nextIndex} without corrupting answers`);
      } catch (error) {
        console.warn('⚠️ Failed to save position update:', error);
      }
    }
  };

  const handleAssessmentComplete = async () => {
    try {
      if (!session) return;

      // Complete the assessment
      const completionResponse = await AssessmentEngine.completeAssessment(
        session.id,
        questions,
        answers
      );

      if (completionResponse.error) {
        console.error('❌ Error completing assessment:', completionResponse.error);
        Alert.alert('Error', 'Failed to complete assessment. Please try again.');
        return;
      }

      // Store results for the results screen
      const results = completionResponse.data;
      if (results) {
        // Record completion and start cooldown for civics test
        if (assessmentType === 'civics_test' && user?.id) {
          try {
            const cooldownResult = await CivicsTestCooldownService.recordCompletion({
              userId: user.id,
              sessionId: session.id,
              score: results.percentage,
              wrongAnswers: wrongAnswers
            });

            if (cooldownResult.success) {
              console.log(`🕐 Civics test cooldown started until: ${cooldownResult.cooldownExpiresAt}`);
            } else {
              console.warn('⚠️ Failed to start cooldown:', cooldownResult.error);
            }
          } catch (cooldownError) {
            console.error('❌ Error starting cooldown:', cooldownError);
          }
        }

        // Store results in AsyncStorage for the results screen to pick up
        try {
          const resultsData = {
            results,
            questions,
            answers,
            wrongAnswers, // Include wrong answers for potential review
            timeSpent: (Date.now() - startTimeRef.current) / 1000,
            sessionId: session.id,
            completedAt: new Date().toISOString(),
            hasWrongAnswers: Object.keys(wrongAnswers).length > 0
          };
          
          await AsyncStorage.setItem('latest_assessment_results', JSON.stringify(resultsData));
        } catch (storageError) {
          console.warn('⚠️ Failed to store results for display:', storageError);
        }
      }

      // Clear progress storage since assessment is complete
      await EnhancedAssessmentProgressStorage.clearProgress(session.id, 'completed');

      // Stop progress tracking
      if (progressTracker) {
        progressTracker.stopProgressTracking();
      }

      console.log('✅ Assessment completed successfully');

      // Navigate to results with success message
      router.replace('/assessment-results' as any);
    } catch (error) {
      console.error('❌ Error completing assessment:', error);
      Alert.alert('Error', 'Failed to complete assessment. Please try again.');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  // Progress should be based on questions actually answered, not current index
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Loading Assessment...', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading your civics assessment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Assessment Error', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text variant="body" color="secondary">
            No questions available. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{ 
          title: `Question ${currentQuestionIndex + 1} of ${questions.length}`,
          headerShown: true 
        }} 
      />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { backgroundColor: theme.primary, width: `${progress}%` }
            ]} 
          />
        </View>
        <Text variant="caption" color="secondary" style={styles.progressText}>
          {Math.round(progress)}% Complete • {Object.keys(answers).length} answered
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.questionContainer}>
        <Card style={[styles.questionCard, { backgroundColor: theme.card }] as any}>
          <Text variant="title2" weight="600" style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correct_answer;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    { borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: `${theme.primary}10` },
                    showResult && isCorrect && { borderColor: '#059669', backgroundColor: '#05966910' },
                    showResult && isSelected && !isCorrect && { borderColor: '#DC2626', backgroundColor: '#DC262610' }
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  <View style={styles.optionContent}>
                    <Text variant="callout" style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text variant="body" style={styles.optionText}>
                      {option}
                    </Text>
                    {showResult && (isCorrect || (isSelected && !isCorrect)) && (
                      <ResultIcon
                        isCorrect={isCorrect}
                        size={24}
                        style={styles.resultIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Button */}
          {!showResult && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: selectedAnswer ? theme.primary : theme.border,
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={handleSubmitAnswer}
              disabled={!selectedAnswer || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text variant="callout" weight="600" style={styles.submitButtonText}>
                  Submit Answer
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Explanation */}
          {showResult && currentQuestion.explanation && (
            (() => {
              const explanationStyle = {
                ...styles.explanationCard,
                backgroundColor: theme.background,
              };
              return (
                <View style={explanationStyle}>
                  <Text variant="callout" weight="600" style={styles.explanationTitle}>
                    Explanation
                  </Text>
                  <Text variant="body" style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              );
            })()
          )}

          {/* Auto-Advance Loader or Next Button */}
          {showResult && showAutoAdvance && (
            <AutoAdvanceLoader
              onComplete={handleNextQuestion}
              onSkip={handleNextQuestion}
              duration={10}
              message={currentQuestionIndex >= questions.length - 1 ? 'Completing assessment...' : 'Next question loading...'}
              compact={false}
            />
          )}
          
          {showResult && !showAutoAdvance && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.primary }]}
              onPress={handleNextQuestion}
            >
              <Text variant="callout" weight="600" style={styles.nextButtonText}>
                {currentQuestionIndex >= questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    padding: spacing.lg,
  },
  questionCard: {
    padding: spacing.lg,
  },
  questionText: {
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionLetter: {
    width: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    lineHeight: 20,
  },
  resultIcon: {
    marginLeft: spacing.xs,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  explanationCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  explanationTitle: {
    marginBottom: spacing.xs,
  },
  explanationText: {
    lineHeight: 20,
  },
  nextButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
}); 