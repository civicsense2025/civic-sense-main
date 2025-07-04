import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  Dimensions,
  ScrollView,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';

import { Text } from '../../components/atoms/Text';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { StandardizedDataService } from '../../lib/standardized-data-service';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useUIStrings from '../../lib/hooks/useUIStrings';
import { CrossPlatformPagerView, type PagerViewRef } from '../../components/ui/CrossPlatformPagerView';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useLanguage, AVAILABLE_LANGUAGES, type LanguageCode } from '../../lib/language-context';
import { deepLTranslationService } from '../../lib/translation/deepl-service';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GSAP-like timing functions for react-native-reanimated
const GSAPTiming = {
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeIn: Easing.bezier(0.42, 0, 1, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  back: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  elastic: Easing.elastic(1.2),
};

const standardDataService = new StandardizedDataService();
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Topic {
  id: string;
  topic_id: string;
  topic_title: string;
  description: string;
  emoji?: string;
  question_count?: number;
  why_this_matters?: string;
  categories?: string[];
  created_at?: string;
}

interface QuestionPreview {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface SourceInfo {
  id: string;
  title: string;
  url?: string;
  description?: string;
  credibility_score?: number;
  publication_date?: string;
  source_type?: 'government' | 'academic' | 'news' | 'legal' | 'other';
}

interface GameSettings {
  questionCount: number;
  timePerQuestion: number;
  enableHints: boolean;
  enableExplanations: boolean;
  hardMode: boolean;
}

// Default game settings with placeholders
const DEFAULT_GAME_SETTINGS: GameSettings = {
  questionCount: 0, // 0 = placeholder state
  timePerQuestion: 0, // 0 = placeholder state  
  enableHints: true,
  enableExplanations: true,
  hardMode: false,
};

// Storage key for persisting settings
const GAME_SETTINGS_STORAGE_KEY = 'civicsense_quiz_settings';

export default function GameRoomScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  
  // Hooks with error handling and fallbacks
  const themeResult = useTheme();
  const authResult = useAuth();
  const uiStringsResult = useUIStrings();
  const languageResult = useLanguage();
  const router = useRouter();
  
  // Safely extract values with fallbacks
  const theme = themeResult?.theme || {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    border: '#E5E7EB',
    card: '#F9FAFB',
    foregroundSecondary: '#6B7280',
    foregroundTertiary: '#9CA3AF'
  };
  
  const user = authResult?.user;
  
  // Build a robust uiStrings object that always has defaults
  const defaultUIStrings = {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
    },
    gameRoom: {
      quizSettings: 'Quiz Settings',
      timeLimit: 'Time Limit',
      noTimeLimit: 'No Time Limit',
      hardMode: 'Hard Mode',
      hardModeDescription: '15s per question, no hints',
      showHints: 'Show Hints',
      showExplanations: 'Show Explanations',
      questionsPreview: 'Questions Preview',
      sources: 'Sources',
    },
    quiz: {
      questions: 'Questions',
      startQuiz: 'Start Quiz',
    },
  } as const;

  const uiStrings = {
    ...defaultUIStrings,
    ...(uiStringsResult?.uiStrings || {}),
    common: {
      ...defaultUIStrings.common,
      ...(uiStringsResult?.uiStrings?.common || {}),
    },
    gameRoom: {
      ...defaultUIStrings.gameRoom,
      ...(uiStringsResult?.uiStrings?.gameRoom || {}),
    },
    quiz: {
      ...defaultUIStrings.quiz,
      ...(uiStringsResult?.uiStrings?.quiz || {}),
    },
  };
  
  const setUILanguage = uiStringsResult?.setUILanguage || (() => {});
  
  const currentLanguage = languageResult?.currentLanguage || { code: 'en', name: 'English' };
  const changeLanguage = languageResult?.changeLanguage || (() => {});
  const t = languageResult?.t || ((key: string) => key);

  // Enhanced language change handler that syncs both systems
  const handleLanguageChange = useCallback(async (languageCode: LanguageCode) => {
    try {
      // Update both content language and UI language simultaneously
      await Promise.all([
        changeLanguage(languageCode), // Content language
        setUILanguage(languageCode), // UI language
      ]);
      
      console.log(`🌐 Synchronized both content and UI languages to: ${languageCode}`);
    } catch (error) {
      console.error('Error synchronizing languages:', error);
    }
  }, [changeLanguage, setUILanguage]);

  // State
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuestionPreview[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Start on settings page
  const [showTimeLimitDropdown, setShowTimeLimitDropdown] = useState(false);
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTopic, setTranslatedTopic] = useState<Topic | null>(null);
  const [translatedQuestions, setTranslatedQuestions] = useState<QuestionPreview[]>([]);
  const [translatedSources, setTranslatedSources] = useState<SourceInfo[]>([]);
  
  // Game settings with localStorage persistence
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  // PagerView ref
  const pagerRef = useRef<PagerViewRef>(null);

  // GSAP-like animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  
  // Simplified button animation
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  const loadQuestions = async (topicId: string): Promise<QuestionPreview[]> => {
    try {
      console.log(`🔍 Loading questions for topic: ${topicId}`);
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(10); // Show more questions in preview

      if (error) {
        console.error('Database error loading questions:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} questions for topic ${topicId}`);

      if (!data || data.length === 0) {
        console.warn(`⚠️ No questions found for topic ${topicId}`);
        return [];
      }

      return data.map((q: any): QuestionPreview => ({
        id: q.id,
        question_text: q.question || q.text || q.question_text || 'Question text not available',
        options: Array.isArray(q.options) ? q.options : 
                 typeof q.options === 'string' ? JSON.parse(q.options) : 
                 ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct_answer: q.correct_answer || 0,
        explanation: q.explanation || 'No explanation available',
        difficulty: q.difficulty || 'medium',
      }));
    } catch (error) {
      console.error('Error loading questions:', error);
      return [];
    }
  };

  const loadSources = async (topicId: string): Promise<SourceInfo[]> => {
    try {
      console.log(`🔍 Loading sources for topic: ${topicId}`);
      
      // Get sources from questions for this topic
      const { data, error } = await supabase
        .from('questions')
        .select('sources')
        .eq('topic_id', topicId)
        .eq('is_active', true);

      if (error) {
        console.error('Database error loading sources:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} questions with sources for topic ${topicId}`);

      if (!data || data.length === 0) {
        console.warn(`⚠️ No questions with sources found for topic ${topicId}`);
        return [];
      }

      // Flatten and deduplicate sources
      const allSources: SourceInfo[] = [];
      
      data.forEach((questionData, questionIndex) => {
        if (questionData.sources) {
          let sources: any[] = [];
          
          // Handle different source formats
          if (Array.isArray(questionData.sources)) {
            sources = questionData.sources;
          } else if (typeof questionData.sources === 'string') {
            try {
              sources = JSON.parse(questionData.sources);
            } catch (e) {
              console.warn(`Failed to parse sources JSON for question ${questionIndex}:`, questionData.sources);
              return;
            }
          } else if (typeof questionData.sources === 'object') {
            sources = [questionData.sources];
          }

          // Add sources to the collection, avoiding duplicates
          sources.forEach((source, sourceIndex) => {
            if (source && source.url && !allSources.find(s => s.url === source.url)) {
              allSources.push({
                id: `${questionIndex}-${sourceIndex}`,
                title: source.title || source.name || 'Untitled Source',
                url: source.url,
                description: source.description || source.summary || undefined,
                credibility_score: source.credibility_score || source.credibility || 85,
                publication_date: source.publication_date || source.date || undefined,
                source_type: source.source_type || source.type || 'other',
              });
            }
          });
        }
      });

      console.log(`✅ Processed ${allSources.length} unique sources for topic ${topicId}`);
      return allSources;
    } catch (error) {
      console.error('Error loading sources:', error);
      return [];
    }
  };

  // Function to translate content when language changes
  const translateContent = async (
    originalTopic: Topic | null, 
    originalQuestions: QuestionPreview[], 
    originalSources: SourceInfo[],
    targetLanguage: string
  ) => {
    if (!originalTopic || targetLanguage === 'en') {
      // If English or no topic, use original content
      setTranslatedTopic(originalTopic);
      setTranslatedQuestions(originalQuestions);
      setTranslatedSources(originalSources);
      return;
    }

    try {
      setIsTranslating(true);
      console.log(`🌐 Translating content to ${targetLanguage}...`);

      // Translate topic
      const translatedTopicData: Topic = { ...originalTopic };
      if (originalTopic.topic_title) {
        try {
          translatedTopicData.topic_title = await deepLTranslationService.translateText(
            originalTopic.topic_title, 
            targetLanguage,
            { preserveCivicTerms: true }
          );
        } catch (error) {
          console.warn('Failed to translate topic title:', error);
        }
      }
      
      if (originalTopic.description) {
        try {
          translatedTopicData.description = await deepLTranslationService.translateText(
            originalTopic.description, 
            targetLanguage,
            { preserveCivicTerms: true }
          );
        } catch (error) {
          console.warn('Failed to translate topic description:', error);
        }
      }

      if (originalTopic.why_this_matters) {
        try {
          translatedTopicData.why_this_matters = await deepLTranslationService.translateText(
            originalTopic.why_this_matters, 
            targetLanguage,
            { preserveCivicTerms: true }
          );
        } catch (error) {
          console.warn('Failed to translate why_this_matters:', error);
        }
      }

      // Translate questions
      const translatedQuestionsData: QuestionPreview[] = [];
      for (const question of originalQuestions) {
        const translatedQuestion: QuestionPreview = { ...question };
        
        try {
          // Translate question text
          if (question.question_text) {
            translatedQuestion.question_text = await deepLTranslationService.translateText(
              question.question_text, 
              targetLanguage,
              { preserveCivicTerms: true }
            );
          }

          // Translate options
          if (question.options && question.options.length > 0) {
            const translatedOptions: string[] = [];
            for (const option of question.options) {
              try {
                translatedOptions.push(
                  await deepLTranslationService.translateText(option, targetLanguage, { preserveCivicTerms: true })
                );
              } catch (error) {
                console.warn('Failed to translate option:', error);
                translatedOptions.push(option); // Fallback to original
              }
            }
            translatedQuestion.options = translatedOptions;
          }

          // Translate explanation
          if (question.explanation) {
            translatedQuestion.explanation = await deepLTranslationService.translateText(
              question.explanation, 
              targetLanguage,
              { preserveCivicTerms: true }
            );
          }
        } catch (error) {
          console.warn('Failed to translate question:', error);
        }

        translatedQuestionsData.push(translatedQuestion);
      }

      // Translate sources
      const translatedSourcesData: SourceInfo[] = [];
      for (const source of originalSources) {
        const translatedSource: SourceInfo = { ...source };
        
        try {
          if (source.title) {
            translatedSource.title = await deepLTranslationService.translateText(
              source.title, 
              targetLanguage,
              { preserveCivicTerms: true }
            );
          }

          if (source.description) {
            translatedSource.description = await deepLTranslationService.translateText(
              source.description, 
              targetLanguage,
              { preserveCivicTerms: true }
            );
          }
        } catch (error) {
          console.warn('Failed to translate source:', error);
        }

        translatedSourcesData.push(translatedSource);
      }

      // Update translated state
      setTranslatedTopic(translatedTopicData);
      setTranslatedQuestions(translatedQuestionsData);
      setTranslatedSources(translatedSourcesData);

      console.log(`✅ Content translation complete for ${targetLanguage}`);
    } catch (error) {
      console.error('Error translating content:', error);
      // Fallback to original content
      setTranslatedTopic(originalTopic);
      setTranslatedQuestions(originalQuestions);
      setTranslatedSources(originalSources);
    } finally {
      setIsTranslating(false);
    }
  };

  const loadTopic = async () => {
    if (!topicId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [topicResponse, questionsResponse, sourcesResponse] = await Promise.all([
        standardDataService.fetchTopicById(topicId),
        loadQuestions(topicId),
        loadSources(topicId)
      ]);
      
      if (topicResponse.error) {
        throw new Error(topicResponse.error.message);
      }

      if (topicResponse.data) {
        const topicData: Topic = {
          id: topicResponse.data.id || '',
          topic_id: topicResponse.data.topic_id || topicId,
          topic_title: topicResponse.data.title || topicResponse.data.topic_title || '',
          description: topicResponse.data.description || '',
          emoji: topicResponse.data.emoji,
          question_count: topicResponse.data.question_count,
          why_this_matters: topicResponse.data.why_this_matters,
          categories: topicResponse.data.categories || [],
          created_at: topicResponse.data.created_at,
        };
        
        setTopic(topicData);
        setQuestions(questionsResponse);
        setSources(sourcesResponse);
      } else {
        throw new Error('Topic not found');
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      Alert.alert('Error', 'Failed to load topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // GSAP-like ripple animation function
  // Simple button press animation
  const handleButtonPress = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  }, []);

  // GSAP-like sparkle animation function
  // Removed complex sparkle animation that was causing performance issues

  useEffect(() => {
    let animationTimeout: number;
    
    loadTopic();
    
    // GSAP-like entrance animation with spring physics
    fadeAnim.value = withTiming(1, { duration: 600, easing: GSAPTiming.easeOut });
    slideAnim.value = withSpring(0, { 
      damping: 20, 
      stiffness: 90, 
      mass: 1,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
    scaleAnim.value = withSpring(1, { 
      damping: 15, 
      stiffness: 120,
      mass: 1,
    });

    // Start button animations after entrance with GSAP-like delay
    animationTimeout = setTimeout(() => {
      // Simple button ready state - no complex animations
      buttonOpacity.value = withTiming(1, { duration: 300 });
    }, 800);

    // Cleanup function to prevent memory leaks
    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Effect to handle language changes and trigger content translation
  useEffect(() => {
    if (topic && questions.length > 0 && currentLanguage.code) {
      console.log(`🌐 Language changed to ${currentLanguage.name}, translating content...`);
      translateContent(topic, questions, sources, currentLanguage.code);
    }
  }, [currentLanguage.code, topic, questions, sources]);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    loadSavedSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettingsToStorage();
  }, [gameSettings]);

  const loadSavedSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(GAME_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as GameSettings;
        setGameSettings(parsedSettings);
        console.log('🎮 Loaded saved quiz settings:', parsedSettings);
      }
    } catch (error) {
      console.error('❌ Error loading saved settings:', error);
    }
  };

  const saveSettingsToStorage = async () => {
    try {
      await AsyncStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(gameSettings));
      console.log('💾 Saved quiz settings to storage:', gameSettings);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  const startGame = async () => {
    if (!topic) return;

    try {
      // Validate that required settings are selected
      if (gameSettings.questionCount === 0) {
        Alert.alert('Settings Required', 'Please select the number of questions before starting.');
        return;
      }
      
      if (gameSettings.timePerQuestion === 0 && !gameSettings.hardMode) {
        Alert.alert('Settings Required', 'Please select a time limit before starting.');
        return;
      }

      // Save settings to localStorage
      await saveSettingsToStorage();
      
      // Use default time for hard mode if not set
      const finalTimePerQuestion = gameSettings.hardMode ? 15 : gameSettings.timePerQuestion;

      const params = new URLSearchParams({
        mode: 'practice',
        timeLimit: finalTimePerQuestion.toString(),
        showExplanations: gameSettings.enableExplanations.toString(),
        questionCount: gameSettings.questionCount.toString(),
        hints: gameSettings.enableHints.toString(),
        topicTitle: topic.topic_title,
      });

      router.push(`/quiz-session/${topicId}/play?${params.toString()}` as any);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const handleBackToHome = () => {
    router.push('/(tabs)/' as any);
  };

  const onPageSelected = (e: any) => {
    const newIndex = e.nativeEvent.position;
    console.log('Page selected via swipe:', newIndex);
    setCurrentPageIndex(newIndex);
  };

  const handleTabPress = (index: number) => {
    console.log('Tab pressed:', index, 'Current page:', currentPageIndex);
    if (index !== currentPageIndex) {
      setCurrentPageIndex(index);
      pagerRef.current?.setPageWithoutAnimation(index);
    }
  };

  const handleHardModeToggle = (enabled: boolean) => {
    if (enabled) {
      // Hard mode: 15s per question, no hints, no explanations
      setGameSettings(prev => ({
        ...prev,
        hardMode: true,
        timePerQuestion: 15,
        enableHints: false,
        enableExplanations: false,
      }));
    } else {
      // Normal mode: restore defaults
      setGameSettings(prev => ({
        ...prev,
        hardMode: false,
        timePerQuestion: 30,
        enableHints: true,
        enableExplanations: true,
      }));
    }
  };

  const getTimeLimitOptions = () => {
    return [
      { value: 0, label: uiStrings.gameRoom.noTimeLimit },
      { value: 15, label: '15s' },
      { value: 30, label: '30s' },
      { value: 45, label: '45s' },
      { value: 60, label: '60s' },
      { value: 90, label: '90s' },
    ];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Animated styles with GSAP-like interpolation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [
        { translateY: slideAnim.value },
        { scale: scaleAnim.value }
      ],
    };
  });

  // Use translated content or original content
  const displayTopic = translatedTopic || topic;
  const displayQuestions = translatedQuestions.length > 0 ? translatedQuestions : questions;
  const displaySources = translatedSources.length > 0 ? translatedSources : sources;

  // Simplified Questions Preview - like continue test pattern
  const QuestionsPreviewPage = () => (
    <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.pageContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('gameRoom.questionsPreview')}</Text>
          <Text style={styles.pageSubtitle}>
            {isTranslating ? 'Translating questions...' : 'Get ready to test your knowledge'}
          </Text>
        </View>

        {displayQuestions.length > 0 ? (
          <View style={styles.questionsContainer}>
            {/* Show first 3 questions in simple format */}
            {displayQuestions.slice(0, 3).map((question, index) => (
              <View key={question.id} style={[styles.simpleQuestionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.simpleQuestionHeader}>
                  <View style={[styles.simpleQuestionNumber, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.simpleQuestionNumberText, { color: theme.primary }]}>{index + 1}</Text>
                  </View>
                  <Text 
                    style={[styles.simpleQuestionText, { color: theme.foreground }]} 
                    numberOfLines={2}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={`Question ${index + 1}: ${question.question_text}`}
                    accessibilityHint="This is a preview of a quiz question"
                  >
                    {question.question_text}
              </Text>
                </View>
                {question.difficulty && (
                  <View style={[styles.simpleDifficultyBadge, { backgroundColor: theme.border }]}>
                    <Text style={[styles.simpleDifficultyText, { color: theme.foregroundSecondary }]}>
                      {question.difficulty}
              </Text>
            </View>
                )}
              </View>
            ))}

            {/* Show "& X more" if there are additional questions */}
            {displayQuestions.length > 3 && (
              <View style={[styles.moreQuestionsCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                <Text style={[styles.moreQuestionsText, { color: theme.primary }]}>
                  & {displayQuestions.length - 3} more questions
                </Text>
                <Text style={[styles.moreQuestionsSubtext, { color: theme.foregroundSecondary }]}>
                  Ready to challenge yourself?
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🤔</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.foreground }]}>
              Questions Loading...
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.foregroundSecondary }]}>
              We're preparing the questions for this topic
                </Text>
              </View>
        )}
            </View>
    </ScrollView>
  );

  // Simplified Sources Page - using compact source pattern
  const SourcesPage = () => (
    <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.pageContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('gameRoom.sources')}</Text>
          <Text style={styles.pageSubtitle}>
            {isTranslating ? 'Translating sources...' : 'Trusted sources behind this content'}
                </Text>
        </View>
              
        {displaySources.length > 0 ? (
          <View style={styles.sourcesContainer}>
            {/* Show first 3 sources in simple format */}
            {displaySources.slice(0, 3).map((source, index) => (
              <TouchableOpacity
                key={source.id} 
                style={[styles.simpleSourceCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => source.url && Linking.openURL(source.url)}
                activeOpacity={0.7}
              >
                <View style={styles.simpleSourceHeader}>
                  <View style={[styles.simpleSourceIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={styles.simpleSourceEmoji}>
                      {source.source_type === 'government' ? '🏛️' :
                       source.source_type === 'academic' ? '🎓' :
                       source.source_type === 'legal' ? '⚖️' :
                       source.source_type === 'news' ? '📰' : '📄'}
                </Text>
            </View>
                  <View style={styles.simpleSourceContent}>
                    <Text style={[styles.simpleSourceTitle, { color: theme.foreground }]} numberOfLines={2}>
                      {source.title}
            </Text>
                    <Text style={[styles.simpleSourceType, { color: theme.foregroundSecondary }]}>
                      {source.source_type || 'Reference'} {source.credibility_score && `• ${source.credibility_score}% credible`}
            </Text>
          </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.foregroundSecondary} />
        </View>
              </TouchableOpacity>
            ))}

            {/* Show "& X more" if there are additional sources */}
            {displaySources.length > 3 && (
              <View style={[styles.moreSourcesCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                <Text style={[styles.moreSourcesText, { color: theme.primary }]}>
                  & {displaySources.length - 3} more sources
                  </Text>
                <Text style={[styles.moreSourcesSubtext, { color: theme.foregroundSecondary }]}>
                  All sources meet our credibility standards
                    </Text>
                  </View>
            )}
                </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={[styles.emptyStateTitle, { color: theme.foreground }]}>
              Sources Loading...
                </Text>
            <Text style={[styles.emptyStateText, { color: theme.foregroundSecondary }]}>
              We're gathering the references for this topic
                    </Text>
                  </View>
                )}
              </View>
    </ScrollView>
  );

  // Simple button animation style
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // Custom LanguageSwitcher component that syncs both language systems
  const CustomLanguageSwitcher = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLanguageSelect = async (languageCode: LanguageCode) => {
      await handleLanguageChange(languageCode);
      setIsDropdownOpen(false);
    };

    return (
      <>
        {/* Language Switcher Button */}
        <TouchableOpacity
          style={[
            {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: 1,
              paddingHorizontal: 8,
              paddingVertical: 4,
              minWidth: 60,
              borderRadius: borderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
            (isTranslating || languageResult?.isTranslating) && { opacity: 0.7 },
          ]}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.7}
          disabled={isTranslating || languageResult?.isTranslating}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <Text style={{ fontSize: 14 }}>
              {currentLanguage.emoji}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#FFFFFF',
                fontWeight: '600',
              }}
            >
              {currentLanguage.label}
            </Text>
            {(isTranslating || languageResult?.isTranslating) ? (
              <Ionicons
                name="refresh"
                size={12}
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="chevron-down"
                size={12}
                color="#FFFFFF"
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Language Selection Modal */}
        {isDropdownOpen && (
          <Modal
            visible={isDropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsDropdownOpen(false)}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              activeOpacity={1}
              onPress={() => setIsDropdownOpen(false)}
            >
              <View style={{
                width: SCREEN_WIDTH * 0.85,
                maxWidth: 400,
                maxHeight: '70%',
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                backgroundColor: theme.background,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                  paddingBottom: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.foreground,
                  }}>
                    Select Language
                  </Text>
                  <TouchableOpacity
                    style={{ padding: spacing.xs }}
                    onPress={() => setIsDropdownOpen(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.foregroundSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {AVAILABLE_LANGUAGES.map((language) => (
                    <TouchableOpacity
                      key={language.code}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        marginBottom: spacing.xs,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: 'transparent',
                        backgroundColor: currentLanguage.code === language.code
                          ? theme.primary + '15'
                          : 'transparent',
                      }}
                      onPress={() => handleLanguageSelect(language.code)}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                      }}>
                        <Text style={{
                          fontSize: 24,
                          marginRight: spacing.md,
                        }}>
                          {language.emoji}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.foreground,
                          }}>
                            {language.name}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            marginTop: 2,
                            color: theme.foregroundSecondary,
                          }}>
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
        )}
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#2563EB' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>
            {uiStrings.common.loading}
              </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Back Button and Language Switcher */}
          <View style={styles.headerRow}>
              <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToHome}
              >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            
            <CustomLanguageSwitcher />
              </View>
              
          {/* Topic Info - moved up */}
          <View style={styles.topicSection}>
            <Text style={styles.topicEmoji}>{displayTopic?.emoji || '📚'}</Text>
            <Text style={styles.topicTitle}>
              {isTranslating ? `${displayTopic?.topic_title || 'Loading...'} 🌐` : displayTopic?.topic_title || 'Loading...'}
                </Text>
            <Text style={styles.topicDate}>
              {formatDate(displayTopic?.created_at)}
                </Text>
              </View>
              
          {/* Swipeable Content - moved up where page indicators were */}
          <CrossPlatformPagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={1}
            onPageSelected={onPageSelected}
            orientation="horizontal"
            offscreenPageLimit={1}
          >
            {/* Page 1: Questions Preview */}
            <View key="questions" style={styles.pageWrapper}>
              <QuestionsPreviewPage />
              </View>
              
            {/* Page 2: Settings (Current Content) */}
            <View key="settings" style={styles.pageWrapper}>
              <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.content, animatedStyle]}>
                  {/* Quiz Settings Card */}
                  <View style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                <Text style={styles.settingsTitle}>{uiStrings.gameRoom.quizSettings}</Text>
              </View>
              
              {/* Question Count and Time Limit - 2 Column Layout */}
              <View style={styles.twoColumnRow}>
                {/* Question Count Dropdown */}
                <View style={styles.columnContainer}>
                  <Text style={styles.settingLabel}>{uiStrings.quiz.questions}</Text>
            <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowQuestionDropdown(!showQuestionDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.dropdownText,
                      ...(gameSettings.questionCount === 0 ? [styles.dropdownPlaceholder] : [])
                    ]}>
                      {gameSettings.questionCount === 0 
                        ? 'Select count' 
                        : `${gameSettings.questionCount} ${uiStrings.quiz.questions}`
                      }
              </Text>
              <Ionicons 
                      name={showQuestionDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="rgba(255, 255, 255, 0.7)" 
              />
            </TouchableOpacity>
            
                  {showQuestionDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[5, 10, 15, 20].map((count) => (
            <TouchableOpacity 
                          key={count}
                          style={[
                            styles.dropdownOption,
                            gameSettings.questionCount === count && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            setGameSettings(prev => ({ ...prev, questionCount: count }));
                            setShowQuestionDropdown(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                             styles.dropdownOptionText,
                             gameSettings.questionCount === count ? styles.dropdownOptionTextSelected : {}
                           ]}>
                             {count} {uiStrings.quiz.questions}
              </Text>
                          {gameSettings.questionCount === count && (
                            <Ionicons name="checkmark" size={16} color="#2563EB" />
                          )}
            </TouchableOpacity>
                      ))}
                    </View>
                  )}
          </View>
          
                {/* Time Limit Dropdown */}
                <View style={styles.columnContainer}>
                  <Text style={styles.settingLabel}>{uiStrings.gameRoom.timeLimit}</Text>
                <TouchableOpacity
                  style={[
                      styles.dropdown,
                      gameSettings.hardMode && styles.dropdownDisabled
                    ]}
                    onPress={() => !gameSettings.hardMode && setShowTimeLimitDropdown(!showTimeLimitDropdown)}
                    activeOpacity={gameSettings.hardMode ? 1 : 0.8}
                    disabled={gameSettings.hardMode}
                  >
                    <Text style={[
                      styles.dropdownText,
                      ...(gameSettings.timePerQuestion === 0 && !gameSettings.hardMode ? [styles.dropdownPlaceholder] : []),
                      ...(gameSettings.hardMode ? [styles.dropdownTextDisabled] : [])
                    ]}>
                      {gameSettings.hardMode 
                        ? '15s (Hard Mode)'
                        : gameSettings.timePerQuestion === 0 
                          ? 'Select time'
                          : `${gameSettings.timePerQuestion}s`
                      }
                  </Text>
                    {!gameSettings.hardMode && (
                      <Ionicons 
                        name={showTimeLimitDropdown ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="rgba(255, 255, 255, 0.7)" 
                      />
                    )}
                </TouchableOpacity>
                
                  {showTimeLimitDropdown && !gameSettings.hardMode && (
                    <View style={styles.dropdownMenu}>
                      {getTimeLimitOptions().map((option) => (
                <TouchableOpacity
                          key={option.value}
                  style={[
                            styles.dropdownOption,
                            gameSettings.timePerQuestion === option.value && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            setGameSettings(prev => ({ ...prev, timePerQuestion: option.value }));
                            setShowTimeLimitDropdown(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                             styles.dropdownOptionText,
                             gameSettings.timePerQuestion === option.value ? styles.dropdownOptionTextSelected : {}
                           ]}>
                             {option.label}
                  </Text>
                          {gameSettings.timePerQuestion === option.value && (
                            <Ionicons name="checkmark" size={16} color="#2563EB" />
                          )}
                </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>
            </View>

              {/* Hard Mode Section */}
              <View style={styles.settingRow}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>🔥 {uiStrings.gameRoom.hardMode}</Text>
                    <Text style={styles.toggleDescription}>
                      {uiStrings.gameRoom.hardModeDescription}
              </Text>
                  </View>
                  <Switch
                    value={gameSettings.hardMode}
                    onValueChange={handleHardModeToggle}
                    trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#EF4444' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Checkbox Options - Simplified */}
              <View style={styles.checkboxGroup}>
                {/* Hints Checkbox */}
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setGameSettings(prev => ({ ...prev, enableHints: !prev.enableHints }))}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkboxBox,
                      gameSettings.enableHints && styles.checkboxBoxChecked
                    ]}>
                      {gameSettings.enableHints && (
                        <Ionicons name="checkmark" size={14} color="#2563EB" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{uiStrings.gameRoom.showHints}</Text>
                  </TouchableOpacity>
                </View>

                {/* Explanations Checkbox */}
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setGameSettings(prev => ({ ...prev, enableExplanations: !prev.enableExplanations }))}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkboxBox,
                      gameSettings.enableExplanations && styles.checkboxBoxChecked
                    ]}>
                      {gameSettings.enableExplanations && (
                        <Ionicons name="checkmark" size={14} color="#2563EB" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{uiStrings.gameRoom.showExplanations}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Start Button with Simple Animation */}
            <View style={styles.actionSection}>
              <View style={styles.buttonContainer}>
                {/* Simple Animated Button */}
                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => {
                      handleButtonPress();
                      startGame();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                    <Text style={styles.startButtonText}>{uiStrings.quiz.startQuiz}</Text>
                  </TouchableOpacity>
                </Animated.View>
            </View>

              <Text style={styles.estimatedTime}>
                {gameSettings.questionCount === 0 ? 'Select settings to start' : 
                 `${gameSettings.questionCount} ${uiStrings.quiz.questions} • ${
                   gameSettings.hardMode ? 
                     `~${Math.ceil((gameSettings.questionCount * 15) / 60)} min` :
                   gameSettings.timePerQuestion === 0 ? uiStrings.gameRoom.noTimeLimit : 
                   `~${Math.ceil((gameSettings.questionCount * gameSettings.timePerQuestion) / 60)} min`
                 }`
                }
                  </Text>
                </View>
                </Animated.View>
              </ScrollView>
              </View>
              
            {/* Page 3: Sources */}
            <View key="sources" style={styles.pageWrapper}>
              <SourcesPage />
                </View>
          </CrossPlatformPagerView>

          {/* Dot Navigation - positioned at bottom of all pages */}
          <View style={styles.dotNavigation}>
            {[0, 1, 2].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  currentPageIndex === index && styles.dotActive
                ]}
                onPress={() => handleTabPress(index)}
              />
            ))}
              </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
  },
  backButton: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    justifyContent: 'space-between',
  },
  topicSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  topicEmoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  topicDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    lineHeight: 20,
  },
  settingRow: {
    marginBottom: spacing.xl,
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  // Compact chip styles for time limits
  compactChipGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  compactChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactChipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  compactChipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  compactChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  toggleGroup: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontFamily: fontFamily.mono,
    lineHeight: 18,
  },
  toggleDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    fontFamily: fontFamily.mono,
  },
  actionSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl * 2,
    paddingBottom: spacing.xl, // Extra padding above dot navigation
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 240,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 0,
  },
  startButton: {
    backgroundColor: '#2E4057',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl * 1.5,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 240,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: spacing.sm,
    fontFamily: fontFamily.mono,
  },
  estimatedTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
  },

  // Header Styles - updated for right-aligned language switcher
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    zIndex: 10,
  },
  languageSwitcher: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },

  // PagerView Styles - moved page indicators to bottom as dots
  pagerView: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },

  // Dot Navigation Styles - new
  dotNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  // Page Container Styles
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 3, // Extra bottom padding for dot navigation
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fontFamily.mono,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Questions Styles
  questionsContainer: {
    gap: spacing.lg,
  },
  questionCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.mono,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },

  // Simplified Questions Styles
  simpleQuestionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  simpleQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  simpleQuestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  simpleQuestionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  simpleQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
    fontFamily: fontFamily.mono,
  },
  simpleDifficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  simpleDifficultyText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
    textTransform: 'capitalize',
  },
  moreQuestionsCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  moreQuestionsText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    marginBottom: spacing.xs,
  },
  moreQuestionsSubtext: {
    fontSize: 13,
    fontFamily: fontFamily.mono,
  },

  // Sources Styles
  sourcesContainer: {
    gap: spacing.lg,
  },
  sourceCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sourceTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTypeEmoji: {
    fontSize: 20,
  },
  credibilityScore: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  credibilityText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  sourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
  },
  sourceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
    fontFamily: fontFamily.mono,
  },
  sourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceUrl: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },

  // Simplified Sources Styles
  simpleSourceCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  simpleSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  simpleSourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleSourceEmoji: {
    fontSize: 16,
  },
  simpleSourceContent: {
    flex: 1,
  },
  simpleSourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: spacing.xs,
    fontFamily: fontFamily.mono,
  },
  simpleSourceType: {
    fontSize: 12,
    fontFamily: fontFamily.mono,
    textTransform: 'capitalize',
  },
  moreSourcesCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  moreSourcesText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
    marginBottom: spacing.xs,
  },
  moreSourcesSubtext: {
    fontSize: 13,
    fontFamily: fontFamily.mono,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.mono,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
  },

  // Dropdown Styles
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: spacing.sm,
  },
  dropdownText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    zIndex: 1000,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },
  dropdownOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  checkboxGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  checkboxBoxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  },

  // New styles for improved layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  columnContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  dropdownDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
}); 