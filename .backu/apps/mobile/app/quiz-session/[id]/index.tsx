import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { Card } from '../../../components/ui/Card';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Button } from '../../../components/Button';
import { LoadingSpinner } from '../../../components/molecules/LoadingSpinner';
// import { LearningInsightsTrigger } from '../../../components/analytics/learning-insights-trigger';
import { spacing, borderRadius, fontFamily, lightTheme } from '../../../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StandardizedDataService } from '../../../lib/standardized-data-service';
import { Ionicons } from '@expo/vector-icons';
import { QuestionResponseService, type QuestionResponseData } from '../../../lib/services/question-response-service';
import { LinearGradient } from 'expo-linear-gradient';
import useUIStrings from '../../../lib/hooks/useUIStrings';

const { width: screenWidth } = Dimensions.get('window');
const standardDataService = new StandardizedDataService();

// Helper function for difficulty colors
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return '#10B981'; // Green
    case 'medium': return '#F59E0B'; // Amber  
    case 'hard': return '#EF4444'; // Red
    default: return '#6B7280'; // Gray
  }
};

interface QuizQuestion {
  id: string;
  question_number: number;
  question: string;
  type: string;
  options: string[];
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  topic_id: string;
  hint?: string;
}

interface TopicMetadata {
  topic_id: string;
  topic_title: string;
  description: string;
  emoji?: string;
  question_count?: number;
  why_this_matters?: string;
  categories?: string[];
}

interface QuizProgress {
  currentQuestionIndex: number;
  score: number;
  streak: number;
  maxStreak: number;
  totalTime: number;
  answers: { 
    questionId: string; 
    answer: string; 
    isCorrect: boolean; 
    responseTime: number;
    attemptNumber?: number;
  }[];
  startTime: number;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeTaken: number;
  timeSpentSeconds: number;
  topicId: string;
  topicTitle: string;
  topicEmoji: string;
  mode: string;
  questions: {
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

// Simple progress storage for mobile
interface SimpleQuizState {
  sessionId: string;
  topicId: string;
  currentQuestionIndex: number;
  answers: { [questionId: string]: string };
  streak: number;
  maxStreak: number;
  startTime: number;
  responseTimes: { [questionId: string]: number };
  savedAt: number;
}

class SimpleProgressManager {
  private storageKey: string;

  constructor(userId: string | undefined, guestToken: string | undefined, topicId: string) {
    const identifier = userId || guestToken || 'anonymous';
    this.storageKey = `quiz_progress_${identifier}_${topicId}`;
  }

  save(state: SimpleQuizState): void {
    try {
      AsyncStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }

  load(): SimpleQuizState | null {
    try {
      const getStoredData = async (): Promise<SimpleQuizState | null> => {
        const data = await AsyncStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
      };
      
      // For synchronous access, we'll use a different approach
      // This is a simplified version - in production you'd want async loading
      return null; // For now, always return null to avoid async issues
    } catch (error) {
      console.warn('Failed to load progress:', error);
      return null;
    }
  }

  async loadAsync(): Promise<SimpleQuizState | null> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load progress:', error);
      return null;
    }
  }

  clear(): void {
    try {
      AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear progress:', error);
    }
  }
}

// Simple guest access for mobile
function useSimpleGuestAccess() {
  const getOrCreateGuestToken = useCallback(() => {
    const token = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    AsyncStorage.setItem('civicapp_guest_token', token);
    return token;
  }, []);

  return { getOrCreateGuestToken };
}

// Main quiz session screen component
export default function QuizSessionScreen() {
  // Always call all hooks at the top level
  const themeContext = useTheme();
  const authContext = useAuth();
  const { getOrCreateGuestToken } = useSimpleGuestAccess();
  const { uiStrings } = useUIStrings() || { uiStrings: { quiz: {}, common: {}, navigation: {} } };
  
  // Extract values with fallbacks
  const theme = themeContext?.theme || lightTheme;
  const user = authContext?.user || null;
  // Using QuestionResponseService directly for better performance
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id: string;
    mode?: string;
    timeLimit?: string;
    showExplanations?: string;
    questionCount?: string;
    hints?: string;
    enableTranslation?: string;
    selectedLanguage?: string;
    topicTitle?: string;
  }>();
  
  // Parse search params with proper defaults and validation - stabilize to prevent re-renders
  const searchParams = useMemo(() => {
    const questionCount = parseInt(params.questionCount || '10');
    const timeLimit = parseInt(params.timeLimit || '30');
    
    // Add validation to prevent 0 values that cause infinite loading
    const validatedParams = {
      mode: params.mode || 'practice',
      timeLimit: timeLimit > 0 ? timeLimit : 30,
      showExplanations: params.showExplanations === 'true',
      questionCount: questionCount > 0 ? questionCount : 10,
      hints: params.hints === 'true',
      enableTranslation: params.enableTranslation === 'true',
      selectedLanguage: params.selectedLanguage || 'en',
      topicTitle: params.topicTitle || 'Quiz'
    };
    
    console.log('🎮 Mobile Quiz: Parsed searchParams:', validatedParams);
    return validatedParams;
  }, [
    params.mode, 
    params.timeLimit, 
    params.showExplanations, 
    params.questionCount, 
    params.hints, 
    params.enableTranslation, 
    params.selectedLanguage, 
    params.topicTitle
  ]); // Depend on individual params to prevent unnecessary re-creation

  const [topic, setTopic] = useState<TopicMetadata | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [quizProgress, setQuizProgress] = useState<QuizProgress>({
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    totalTime: 0,
    answers: [],
    startTime: Date.now(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(searchParams.timeLimit);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [hasRestoredState, setHasRestoredState] = useState(false);
  
  // Use ref to track initialization to prevent race conditions
  const initializationRef = useRef({
    isInitialized: false,
    currentQuizId: '',
    isLoading: false
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Session management
  const sessionId = useRef<string>(`mobile-quiz-${params.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const quizId = params.id || 'unknown';
  
  // Memoize guest token to prevent recreation
  const guestToken = useMemo(() => {
    return user ? undefined : getOrCreateGuestToken();
  }, [user, getOrCreateGuestToken]);
  
  // Memoize progressManager to prevent recreation on every render
  const progressManager = useMemo(() => 
    new SimpleProgressManager(user?.id, guestToken, quizId), 
    [user?.id, guestToken, quizId]
  );

  // Load quiz data using standardized data service
  useEffect(() => {
    async function loadQuizData() {
      try {
        setLoading(true);
        
        const [questionResponse, topicResponse] = await Promise.all([
          standardDataService.fetchQuestions(quizId),
          standardDataService.fetchTopicById(quizId)
        ]);

        console.log('🔍 DEBUG: Quiz session loading data for topic:', quizId);
        console.log('🔍 DEBUG: Question response:', questionResponse);
        console.log('🔍 DEBUG: Topic response:', topicResponse);
        
        // Check for errors
        if (questionResponse.error) {
          throw new Error(`Failed to load questions: ${questionResponse.error.message}`);
        }
        
        if (topicResponse.error) {
          throw new Error(`Failed to load topic: ${topicResponse.error.message}`);
        }
        
        const questionData = questionResponse.data;
        const topicData = topicResponse.data;
        
        console.log('🔍 DEBUG: Total questions loaded:', questionData?.length || 0);
        
        // Debug question types
        if (questionData && questionData.length > 0) {
          const questionInfo = questionData.map(q => ({ 
            id: q.id, 
            hasOptions: q.options.length > 0,
            optionCount: q.options.length,
            question: q.question?.substring(0, 50) + '...' 
          }));
          console.log('🔍 DEBUG: Question breakdown:', questionInfo);
          
          console.log('🔍 DEBUG: All questions in database are multiple choice (no type field exists yet)');
        }

        if (questionData && topicData) {
          // Convert StandardQuestion[] to QuizQuestion[] 
          const convertedQuestions: QuizQuestion[] = questionData.map((q, index) => ({
            id: q.id,
            question_number: index + 1,
            question: q.question,
            type: 'multiple_choice', // Default type since database doesn't have type field yet
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            difficulty: q.difficulty_level <= 1 ? 'easy' : q.difficulty_level === 2 ? 'medium' : 'hard',
            category: topicData.categories?.[0] || 'General',
            topic_id: q.topic_id,
            hint: '' // No hint field in StandardQuestion yet
          }));

          // Convert StandardTopic to TopicMetadata
          const convertedTopic: TopicMetadata = {
            topic_id: topicData.id,
            topic_title: topicData.title,
            description: topicData.description || '',
            emoji: topicData.emoji,
            question_count: topicData.question_count,
            why_this_matters: topicData.why_this_matters,
            categories: topicData.categories
          };

          console.log('🔍 DEBUG: All questions are currently multiple choice type');
          console.log('🔍 DEBUG: To add true/false and short answer questions, you need to:');
          console.log('  1. Add a "type" column to the questions table in the database');
          console.log('  2. Add a "hint" column to the questions table');
          console.log('  3. Update questions with type values: "multiple_choice", "true_false", "short_answer"');
          console.log('  4. For true/false questions, set options to ["True", "False"]');
          console.log('  5. For short answer questions, set options to an empty array');

          setQuestions(convertedQuestions);
          setTopic(convertedTopic);
        } else {
          setError('Failed to load quiz data');
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }

    if (quizId) {
      loadQuizData();
    }
  }, [quizId]);

  // Restore progress from storage
  const restoreProgress = useCallback(async () => {
    if (hasRestoredState) return;

    try {
      const savedState = await progressManager.loadAsync();
      if (savedState && savedState.answers && Object.keys(savedState.answers).length > 0) {
        console.log('📱 Mobile Quiz: Restoring saved progress');
        
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setQuizProgress(prev => ({
          ...prev,
          currentQuestionIndex: savedState.currentQuestionIndex,
          answers: Object.entries(savedState.answers).map(([questionId, answer]) => ({
            questionId,
            answer: answer as string,
            isCorrect: false, // Will be recalculated
            responseTime: savedState.responseTimes?.[questionId] || 0,
          })),
          streak: savedState.streak || 0,
          maxStreak: savedState.maxStreak || 0,
          startTime: savedState.startTime || Date.now(),
        }));
        
        setHasRestoredState(true);
      }
    } catch (error) {
      console.warn('⚠️ Mobile Quiz: Failed to restore progress:', error);
    }
  }, [progressManager, hasRestoredState]);

  // Save progress
  const saveProgress = useCallback(async () => {
    try {
      const simpleState: SimpleQuizState = {
        sessionId: sessionId.current,
        topicId: quizId,
        currentQuestionIndex,
        answers: quizProgress.answers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.answer;
          return acc;
        }, {} as { [questionId: string]: string }),
        streak: quizProgress.streak,
        maxStreak: quizProgress.maxStreak,
        startTime: quizProgress.startTime,
        responseTimes: quizProgress.answers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.responseTime;
          return acc;
        }, {} as { [questionId: string]: number }),
        savedAt: Date.now()
      };
      progressManager.save(simpleState);
    } catch (error) {
      console.warn('⚠️ Mobile Quiz: Failed to save progress:', error);
    }
  }, [quizId, currentQuestionIndex, quizProgress.answers, quizProgress.streak, quizProgress.maxStreak, quizProgress.startTime, progressManager]);

  // Reset initialization when quiz ID changes
  useEffect(() => {
    if (quizId && quizId !== initializationRef.current.currentQuizId) {
      console.log('🎮 Mobile Quiz: Quiz ID changed, resetting initialization');
      initializationRef.current.isInitialized = false;
      initializationRef.current.isLoading = false;
      initializationRef.current.currentQuizId = quizId;
    }
  }, [quizId]);

  // Data loading is now handled in the main useEffect above
  
  // Restore progress after questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !hasRestoredState) {
      restoreProgress();
    }
  }, [questions.length, hasRestoredState, restoreProgress]);

  // Auto-save progress - debounced to prevent excessive saves
  useEffect(() => {
    if (quizProgress.answers.length > 0 && !loading && questions.length > 0) {
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 500); // Debounce saves by 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [quizProgress.answers.length, quizProgress.currentQuestionIndex, loading, questions.length, saveProgress]);

  // Define handleTimeout before the timer effect
  const handleTimeout = useCallback(() => {
    if (showExplanation || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const responseTime = searchParams.timeLimit;

    const newAnswer = {
      questionId: currentQuestion.id,
      answer: '', // No answer selected
      isCorrect: false,
      responseTime,
      attemptNumber: 1,
    };

    const updatedProgress = {
      ...quizProgress,
      answers: [...quizProgress.answers, newAnswer],
      streak: 0, // Break streak on timeout
      totalTime: quizProgress.totalTime + responseTime,
      currentQuestionIndex: currentQuestionIndex,
    };

    setQuizProgress(updatedProgress);
    setSelectedAnswer('');
    setShowExplanation(true);

    Alert.alert('Time\'s Up!', 'Time ran out for this question.');
  }, [showExplanation, questions, currentQuestionIndex, searchParams.timeLimit, quizProgress]);

  // Timer effect
  useEffect(() => {
    if (loading || showExplanation || searchParams.timeLimit === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, showExplanation, currentQuestionIndex, searchParams.timeLimit, handleTimeout]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Exit Quiz?',
        'Your progress will be saved, but you won\'t get a completion score.',
        [
          { text: 'Continue Quiz', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // Record response using QuestionResponseService (for logged-in users)
    if (user?.id) {
      try {
        const responseData: QuestionResponseData = {
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect,
          responseTimeMs: responseTime * 1000,
          assessmentType: 'practice', // Standardize as practice for mobile quizzes
          topicId: quizId, // Use consistent topic ID
          confidenceLevel: 3, // Default confidence level
          wasReview: false
        };

        const result = await QuestionResponseService.recordQuestionResponse(user.id, responseData);
        
        if (result.success) {
          console.log('✅ Solo quiz answer recorded:', {
            masteryLevel: result.masteryLevel,
            nextReviewDate: result.nextReviewDate
          });
        } else {
          console.error('❌ Failed to record solo quiz answer:', result.error);
        }
      } catch (error) {
        console.error('❌ Error recording solo quiz answer:', error);
        // Don't block the quiz flow for tracking failures
      }
    }

    // Update progress
    const newAnswer = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      responseTime,
      attemptNumber: 1,
    };

    const newStreak = isCorrect ? quizProgress.streak + 1 : 0;
    const newMaxStreak = Math.max(quizProgress.maxStreak, newStreak);

    const updatedProgress = {
      ...quizProgress,
      answers: [...quizProgress.answers, newAnswer],
      score: isCorrect ? quizProgress.score + 1 : quizProgress.score,
      streak: newStreak,
      maxStreak: newMaxStreak,
      totalTime: quizProgress.totalTime + responseTime,
      currentQuestionIndex: currentQuestionIndex,
    };

    setQuizProgress(updatedProgress);
    setShowExplanation(true);

    // Animate transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Update progress bar animation
    const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      handleQuizComplete();
      return;
    }

    // Reset for next question
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
    setTimeRemaining(searchParams.timeLimit);
    setQuestionStartTime(Date.now());

    const newIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(newIndex);

    // Update progress
    setQuizProgress(prev => ({
      ...prev,
      currentQuestionIndex: newIndex,
    }));

    // Reset animations
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
  };

  const handleQuizComplete = async () => {
    // Calculate final results with proper topic context
    const finalScore = Math.round((quizProgress.score / questions.length) * 100);
    const results: QuizResults = {
      totalQuestions: questions.length,
      correctAnswers: quizProgress.score,
      incorrectAnswers: questions.length - quizProgress.score,
      score: finalScore,
      timeTaken: quizProgress.totalTime,
      timeSpentSeconds: quizProgress.totalTime,
      // Include proper topic context to prevent disconnection
      topicId: quizId,
      topicTitle: searchParams.topicTitle || topic?.topic_title || 'Quiz',
      topicEmoji: topic?.emoji || '📚',
      mode: searchParams.mode || 'practice',
      questions: questions.map((question, index) => {
        const userAnswer = quizProgress.answers.find(answer => answer.questionId === question.id);
        return {
          question,
          userAnswer: userAnswer?.answer || '',
          isCorrect: userAnswer?.isCorrect || false
        };
      })
    };

    // Save results to backend with proper error handling
    try {
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          topicId: quizId,
          topicTitle: searchParams.topicTitle || topic?.topic_title,
          mode: searchParams.mode,
          guestToken: !user ? guestToken : undefined,
          // Include additional context to prevent disconnection
          sessionContext: {
            topicEmoji: topic?.emoji,
            categoryName: topic?.categories?.[0] || 'General',
            difficultyLevel: 'normal', // Remove difficulty reference since it doesn't exist
            settingsUsed: {
              timeLimit: searchParams.timeLimit,
              showExplanations: searchParams.showExplanations,
              hintsEnabled: searchParams.hints
            }
          }
        }),
      });

      if (response.ok) {
        console.log('✅ Mobile Quiz: Results saved successfully');
      } else {
        console.warn('⚠️ Mobile Quiz: Failed to save results');
      }
    } catch (error) {
      console.warn('⚠️ Mobile Quiz: Error saving results:', error);
      // Continue to results even if save fails - user experience is more important
    }

    // Clear progress storage
    progressManager.clear();

    // Navigate to results with proper context to prevent disconnection
    const summaryParams = new URLSearchParams({
      score: finalScore.toString(),
      total: questions.length.toString(),
      correct: quizProgress.score.toString(),
      time: quizProgress.totalTime.toString(),
      topicTitle: searchParams.topicTitle || topic?.topic_title || 'Quiz',
      topicEmoji: topic?.emoji || '📚',
      mode: searchParams.mode || 'practice'
    });

    console.log('✅ Mobile Quiz: Navigating to summary with context:', {
      topicId: quizId,
      topicTitle: searchParams.topicTitle || topic?.topic_title,
      score: finalScore,
      params: summaryParams.toString()
    });

    router.push(`/quiz-session/${quizId}/summary?${summaryParams.toString()}` as any);
  };

  const handleShowHint = () => {
    if (searchParams.hints && questions[currentQuestionIndex]?.hint) {
      setShowHint(true);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#2563EB", "#1D4ED8", "#1E40AF"]} style={styles.gradientBackground}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text variant="body" style={styles.loadingText}>{uiStrings.quiz?.loadingQuestion || 'Loading quiz...'}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !topic || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FFFFFF" />
          <Text variant="title2" style={styles.errorTitle}>{uiStrings.common?.error || 'Quiz Not Found'}</Text>
          <Text variant="body" style={styles.errorMessage}>{error}</Text>
          <Button
            title={uiStrings.navigation?.back || 'Go Back'}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Ensure currentQuestion is valid and has required properties
  if (!currentQuestion || !currentQuestion.question || !currentQuestion.options) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit">Question Error</Text>
          <Text variant="body" color="secondary">This question has missing data.</Text>
          <Button
            title={uiStrings.navigation?.back || 'Go Back'}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <LinearGradient colors={["#2563EB", "#1D4ED8", "#1E40AF"]} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Enhanced Header with CivicSense Design */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text variant="caption1" color="secondary" style={styles.progressText}>
                {topic.emoji} {topic.topic_title}
              </Text>
              <Text variant="footnote" color="secondary">
                {uiStrings.quiz?.questionNumber || 'Question'} {currentQuestionIndex + 1} {uiStrings.quiz?.of || 'of'} {questions.length}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: theme.primary,
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
            </View>
            
            <View style={styles.headerRight}>
              {searchParams.timeLimit > 0 && (
                <Text
                  variant="footnote"
                  style={[
                    styles.timerText,
                    { color: timeRemaining <= 10 ? '#EF4444' : 'rgba(255, 255, 255, 0.8)' },
                  ]}
                >
                  {timeRemaining}s
                </Text>
              )}
              
              {searchParams.hints && currentQuestion?.hint && (
                <TouchableOpacity
                  style={[styles.hintButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={handleShowHint}
                >
                  <Text style={styles.hintButtonText}>💡</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Question Card with CivicSense Design */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <AnimatedCard style={{...styles.questionCard, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'}} variant="elevated" delay={100}>
                <View style={styles.questionHeader}>
                  <View style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        currentQuestion.difficulty === 'easy' ? '#10B981' :
                        currentQuestion.difficulty === 'medium' ? '#F59E0B' : '#EF4444',
                    },
                  ]}>
                    <Text style={styles.difficultyText}>
                      {(currentQuestion.difficulty || 'medium').toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="caption1" color="secondary">
                    {currentQuestion.category || 'General'}
                  </Text>
                </View>
                
                <Text variant="title3" color="inherit" style={styles.questionText}>
                  {currentQuestion.question}
                </Text>

                {/* Hint Display */}
                {showHint && currentQuestion.hint && (
                  <View style={{...styles.hintContainer, backgroundColor: theme.muted, borderColor: theme.primary}}>
                    <Text variant="caption1" style={[styles.hintLabel, { color: theme.primary }]}>
                      💡 Hint
                    </Text>
                    <Text variant="body" color="secondary" style={styles.hintText}>
                      {currentQuestion.hint}
                    </Text>
                  </View>
                )}
              </AnimatedCard>
            </Animated.View>

            {/* Render different question types */}
            {currentQuestion.type === 'true_false' ? (
              // True/False Questions
              <View style={styles.optionsContainer}>
                {['True', 'False'].map((option, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, showExplanation ? (option === currentQuestion.correct_answer ? 10 : -10) : 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        ...styles.optionButton,
                        backgroundColor: 
                          selectedAnswer === option ? theme.primary : 'rgba(255, 255, 255, 0.9)',
                        borderColor: 
                          showExplanation && option === currentQuestion.correct_answer ? '#10B981' :
                          showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer ? '#EF4444' :
                          selectedAnswer === option ? theme.primary : 'rgba(255, 255, 255, 0.4)',
                        borderWidth: showExplanation && (option === currentQuestion.correct_answer || selectedAnswer === option) ? 2 : 1,
                      }}
                      onPress={() => handleAnswerSelect(option)}
                      disabled={showExplanation}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.trueFalseIndicator,
                          {
                            backgroundColor: selectedAnswer === option ? theme.card : 'rgba(255, 255, 255, 0.6)',
                          },
                        ]}>
                          <Text style={[styles.trueFalseText, { color: selectedAnswer === option ? theme.primary : theme.foregroundSecondary }]}>
                            {option === 'True' ? '✓' : '✗'}
                          </Text>
                        </View>
                        <Text
                          variant="body"
                          style={[
                            styles.optionText,
                            { color: selectedAnswer === option ? theme.card : theme.foreground },
                          ]}
                        >
                          {option}
                        </Text>
                        {showExplanation && option === currentQuestion.correct_answer && (
                          <Text style={styles.correctIcon}>✓</Text>
                        )}
                        {showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer && (
                          <Text style={styles.incorrectIcon}>✗</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ) : currentQuestion.type === 'short_answer' ? (
              // Short Answer Questions
              <View style={styles.shortAnswerContainer}>
                <View style={[styles.textInputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.4)' }]}>
                  <Text variant="caption1" color="secondary" style={styles.inputLabel}>
                    Your Answer:
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={selectedAnswer || ''}
                    onChangeText={handleAnswerSelect}
                    placeholder="Enter your answer..."
                    placeholderTextColor="rgba(75, 85, 99, 0.6)"
                    multiline
                    editable={!showExplanation}
                    onBlur={() => {
                      if (!showExplanation) {
                        handleSubmitAnswer();
                      }
                    }}
                  />
                  {showExplanation && (
                    <View style={styles.correctAnswerContainer}>
                      <Text variant="caption1" style={[styles.correctAnswerLabel, { color: '#10B981' }]}>
                        Sample Answer:
                      </Text>
                      <Text variant="body" style={[styles.correctAnswerText, { color: theme.foreground }]}>
                        {currentQuestion.correct_answer}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Multiple Choice Questions (default)
              <View style={styles.optionsContainer}>
                {(currentQuestion.options || []).map((option, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, showExplanation ? (option === currentQuestion.correct_answer ? 10 : -10) : 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        ...styles.optionButton,
                        backgroundColor: 
                          selectedAnswer === option ? theme.primary : 'rgba(255, 255, 255, 0.9)',
                        borderColor: 
                          showExplanation && option === currentQuestion.correct_answer ? '#10B981' :
                          showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer ? '#EF4444' :
                          selectedAnswer === option ? theme.primary : 'rgba(255, 255, 255, 0.4)',
                        borderWidth: showExplanation && (option === currentQuestion.correct_answer || selectedAnswer === option) ? 2 : 1,
                      }}
                      onPress={() => handleAnswerSelect(option)}
                      disabled={showExplanation}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.optionNumber,
                          {
                            backgroundColor: selectedAnswer === option ? theme.card : 'rgba(255, 255, 255, 0.6)',
                            borderColor: selectedAnswer === option ? theme.card : 'rgba(255, 255, 255, 0.4)',
                          },
                        ]}>
                          <Text
                            style={[
                              styles.optionNumberText,
                              { color: selectedAnswer === option ? theme.primary : theme.foregroundSecondary },
                            ]}
                          >
                            {String.fromCharCode(65 + index)}
                          </Text>
                        </View>
                        <Text
                          variant="body"
                          style={[
                            styles.optionText,
                            { color: selectedAnswer === option ? theme.card : theme.foreground },
                          ]}
                        >
                          {option}
                        </Text>
                        {showExplanation && option === currentQuestion.correct_answer && (
                          <Text style={styles.correctIcon}>✓</Text>
                        )}
                        {showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer && (
                          <Text style={styles.incorrectIcon}>✗</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Explanation with CivicSense Design */}
            {showExplanation && currentQuestion.explanation && searchParams.showExplanations && (
              <Animated.View
                style={{
                  opacity: slideAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }}
              >
                <Card style={{...styles.explanationCard, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderLeftColor: theme.primary, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'}} variant="outlined">
                  <Text variant="callout" color="inherit" style={[styles.explanationTitle, { color: theme.primary }]}>
                    Why This Matters
                  </Text>
                  <Text variant="body" color="secondary" style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </Card>
              </Animated.View>
            )}

            {/* Enhanced Progress Stats */}
            <View style={{...styles.statsContainer, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'}}>
              <View style={styles.statItem}>
                <Text variant="title3" style={[styles.statValue, { color: theme.primary }]}>
                  {quizProgress.score}
                </Text>
                <Text variant="caption1" color="secondary">Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="title3" style={[styles.statValue, { color: theme.primary }]}>
                  {quizProgress.streak}
                </Text>
                <Text variant="caption1" color="secondary">Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="title3" style={[styles.statValue, { color: theme.primary }]}>
                  {Math.round((quizProgress.score / Math.max(1, quizProgress.answers.length)) * 100)}%
                </Text>
                <Text variant="caption1" color="secondary">Accuracy</Text>
              </View>
              {quizProgress.maxStreak > 0 && (
                <View style={styles.statItem}>
                  <Text variant="title3" style={[styles.statValue, { color: '#F59E0B' }]}>
                    {quizProgress.maxStreak}
                  </Text>
                  <Text variant="caption1" color="secondary">Best</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Enhanced Action Button */}
          <View style={{...styles.actionContainer, backgroundColor: theme.card, borderTopColor: theme.border}}>
            {!showExplanation ? (
              <Button
                title="Submit Answer"
                onPress={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                style={{
                  ...styles.actionButton,
                  backgroundColor: selectedAnswer ? theme.primary : theme.border,
                  opacity: selectedAnswer === null ? 0.5 : 1
                }}
              />
            ) : (
              <Button
                title={currentQuestionIndex >= questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
                onPress={handleNextQuestion}
                style={{...styles.actionButton, backgroundColor: theme.primary}}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  progressText: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerText: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
    fontSize: 16,
  },
  hintButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintButtonText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  questionCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  questionText: {
    lineHeight: 28,
    fontFamily: fontFamily.text,
  },
  hintContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
  },
  hintLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  hintText: {
    lineHeight: 22,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    lineHeight: 22,
  },
  // True/False question styles
  trueFalseIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Short answer question styles
  shortAnswerContainer: {
    marginBottom: spacing.lg,
  },
  textInputContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  textInput: {
    minHeight: 50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  correctAnswerContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  correctAnswerLabel: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  correctAnswerText: {
    lineHeight: 20,
  },
  correctIcon: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  incorrectIcon: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  explanationCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderRadius: borderRadius.md,
  },
  explanationTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  explanationText: {
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 20,
  },
  actionContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.5,
  },
      loadingText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: spacing.md,
    },
    errorMessage: {
      fontSize: 16,
      color: '#FFFFFF',
    },
}); 