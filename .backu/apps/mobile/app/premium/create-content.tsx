import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { usePremium } from '../../lib/hooks/usePremium';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { NewsTicker } from '../../components/ui/NewsTicker';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { PremiumDebugPanel } from '../../components/debug/PremiumDebugPanel';
import { DatabaseDebugger } from '../../components/debug/DatabaseDebugger';
import { spacing, borderRadius, typography, fontFamily } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { contentGenerationService } from '../../lib/services/content-generation';
import { getUGCGenerator, UGCInput } from '../../lib/ai/ugc-content-generator';
import { setAuthenticatedSupabaseClient } from '../../lib/ai/base-ai-tool';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Realistic, complete example queries that demonstrate best practices
const EXAMPLE_QUERIES = [
  "Why did my city council approve that controversial apartment complex despite neighborhood opposition?",
  "How does gerrymandering in my district affect the power of my vote?", 
  "What's really behind my school board's decision to change the curriculum?",
  "Why do some counties get more federal disaster relief money than others?",
  "How do pharmaceutical companies influence FDA drug approval decisions?",
  "What happens when my state attorney general challenges federal regulations?",
  "Why does my mayor have so much power over police department budgets?",
  "How do tech companies lobby Congress to avoid antitrust enforcement?",
  "What's the real story behind my state's redistricting process?",
  "Why do some Supreme Court cases get more media attention than others?"
];

// Generation steps - simplified without streaming
const GENERATION_STEPS = [
  {
    id: 'research',
    title: 'Researching',
    subtitle: 'Gathering verified sources and recent developments',
    icon: '🔍',
  },
  {
    id: 'analysis',
    title: 'Analyzing',
    subtitle: 'Processing complexity and identifying key concepts',
    icon: '🧠',
  },
  {
    id: 'questions',
    title: 'Creating Questions',
    subtitle: 'Building fact-checked questions with verified sources',
    icon: '✨',
  },
  {
    id: 'verification',
    title: 'Fact-Checking',
    subtitle: 'Cross-referencing with trusted sources',
    icon: '✅',
  },
  {
    id: 'finalizing',
    title: 'Finalizing',
    subtitle: 'Preparing your custom quiz',
    icon: '🎯',
  },
];

interface GenerationStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

// Remove streaming-related interfaces since we're not using streaming anymore

export default function CreateContentScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const premiumData = usePremium();
  
  // Destructure with explicit null checks
  const {
    isPremium = false,
    hasGenerationAccess = false,
    isLoading: premiumLoading = true,
    subscription = null
  } = premiumData || {};
  
  // Extract tier and status from subscription
  const tier = subscription?.subscription_tier || null;
  const status = subscription?.subscription_status || null;
  
  // Form state
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [realTimeProgress, setRealTimeProgress] = useState<string>('');
  const [sourcesFound, setSourcesFound] = useState<Array<{url: string; title: string; excerpt: string}>>([]);
  const [factCheckProgress, setFactCheckProgress] = useState<Record<number, string>>({});
  
  // Remove streaming state since we're not using streaming
  
  // Advanced settings (simplified)
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedModel, setSelectedModel] = useState<{
    provider: 'openai' | 'anthropic';
    model: string;
    displayName: string;
  }>({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet'
  });

  // Available AI models
  const availableModels = [
    {
      provider: 'anthropic' as const,
      model: 'claude-sonnet-4-20250514',
      displayName: 'Claude Sonnet 4',
      description: 'Latest and most capable model'
    },
    {
      provider: 'anthropic' as const,
      model: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Fast and reliable'
    },
    {
      provider: 'openai' as const,
      model: 'gpt-4o',
      displayName: 'GPT-4o',
      description: 'OpenAI\'s most capable model'
    },
    {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      description: 'Faster and more affordable'
    }
  ];
  
  // UI state
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [loadingUsageData, setLoadingUsageData] = useState(true);
  const [showExamples, setShowExamples] = useState(true);
  
  // Animation refs
  const exampleAnim = useRef(new Animated.Value(0)).current;
  const generationAnim = useRef(new Animated.Value(0)).current;
  const stepProgressAnim = useRef(new Animated.Value(0)).current;
  const pulsingAnim = useRef(new Animated.Value(1)).current;
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastDebugRef = useRef<string | null>(null);

  // Enhanced auth and generation access check
  const isAuthReady = !premiumLoading && !loadingUsageData;
  const hasPremiumAccess = hasGenerationAccess && tier === 'pro' && status === 'active';
  const hasFreeTrial = generationCount === 0 && !hasPremiumAccess;
  
  // More explicit canGenerate logic
  const canGenerate = isAuthReady && (hasPremiumAccess || hasFreeTrial);
  
  // Debug logging for auth state (throttled to prevent spam)
  useEffect(() => {
    const debugInfo = {
      isAuthReady,
      premiumLoading,
      loadingUsageData,
      hasGenerationAccess,
      tier,
      status,
      hasPremiumAccess,
      generationCount,
      hasFreeTrial,
      canGenerate,
      userId: user?.id
    };
    
    // Only log when values actually change
    const debugKey = JSON.stringify(debugInfo);
    if (!lastDebugRef.current || lastDebugRef.current !== debugKey) {
      console.log('🔍 Auth Check Debug:', debugInfo);
      lastDebugRef.current = debugKey;
    }
  }, [isAuthReady, premiumLoading, loadingUsageData, hasGenerationAccess, tier, status, hasPremiumAccess, generationCount, hasFreeTrial, canGenerate, user?.id]);

  // Animated example queries - fix the animation to properly rotate
  useEffect(() => {
    if (!showExamples) return;
    
    const animateExamples = () => {
      if (!isMountedRef.current) return;
      
      // First animate out the current text
      Animated.timing(exampleAnim, {
        toValue: -20, // Smaller movement to stay within bounds
        duration: 400,
        useNativeDriver: true,
      }).start((finished) => {
        if (finished && isMountedRef.current) {
          // Change the text while it's hidden
          setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
          
          // Reset position and animate in the new text
          exampleAnim.setValue(20); // Start from below, smaller value
          Animated.timing(exampleAnim, {
            toValue: 0, // Move to normal position
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      });
    };

    const interval = setInterval(animateExamples, 4000); // Slightly longer to read
    return () => clearInterval(interval);
  }, [showExamples, exampleAnim]);

  const handleInputFocus = () => {
    setShowExamples(false);
    // Clear any existing example animation
    exampleAnim.setValue(0);
  };

  const handleInputBlur = () => {
    // Only show examples again if input is empty
    if (!topic.trim()) {
      setShowExamples(true);
    }
  };

  const handleExampleSelect = () => {
    const selectedQuery = EXAMPLE_QUERIES[currentExampleIndex];
    if (selectedQuery) {
      setTopic(selectedQuery);
      setShowExamples(false);
      inputRef.current?.focus();
    }
  };

  // Load user's generation count
  useEffect(() => {
    const loadGenerationCount = async () => {
      if (!user || !user.id) {
        setLoadingUsageData(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('custom_content_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading generation count:', error);
          setGenerationCount(0);
        } else {
          setGenerationCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading generation count:', error);
        setGenerationCount(0);
      } finally {
        setLoadingUsageData(false);
      }
    };

    loadGenerationCount();
  }, [user]);

  // Show upgrade prompt only after first generation for non-premium users
  useEffect(() => {
    // Only show upgrade prompt if auth is ready and user has used their free preview
    if (isAuthReady && !hasPremiumAccess && generationCount > 0) {
      console.log('🚫 Showing upgrade prompt - user has used free preview');
      Alert.alert(
        'Upgrade to Continue',
        'You\'ve used your free preview! Upgrade to CivicSense Pro to create unlimited custom content.',
        [
          { text: 'Maybe Later', onPress: () => router.back() },
          { text: 'Upgrade to Pro', onPress: () => router.push('/premium/upgrade' as any) },
        ]
      );
    }
  }, [isAuthReady, hasPremiumAccess, generationCount]);

  // Component mount/unmount tracking and Supabase client initialization
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initialize the authenticated Supabase client for AI tools
    setAuthenticatedSupabaseClient(supabase);
    console.log('🔗 Authenticated Supabase client set for AI tools');
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Pulsing animation for activity indicator
  useEffect(() => {
    if (realTimeProgress && isGenerating) {
      const startPulsing = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulsingAnim, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulsingAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      startPulsing();
    } else {
      pulsingAnim.setValue(1);
    }
  }, [realTimeProgress, isGenerating]);

  // Auth timeout protection - prevent indefinite loading
  useEffect(() => {
    if (!isAuthReady) {
      const timeout = setTimeout(() => {
        if (!isAuthReady && isMountedRef.current) {
          console.warn('⏰ Auth timeout - clearing loading state');
          setLoadingUsageData(false);
          // Force a premium refresh if still loading
          if (premiumLoading && premiumData?.refreshSubscription) {
            premiumData.refreshSubscription();
          }
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isAuthReady, premiumLoading, premiumData]);

  const generateWithContent = async (collectionId?: string) => {
    setIsGenerating(true);
    setCurrentStepIndex(0);
    let generatedContent: any = null;
    
    try {
      console.log('🚀 Starting content generation...');
      
      // Animate to show generation UI
      Animated.timing(generationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Validate API keys with detailed debugging
      const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      
      // DEBUG: Log API key status
      console.log('🔑 API Key Debug:', {
        openaiKey: openaiKey ? `Available (${openaiKey.substring(0, 8)}...)` : 'Missing',
        anthropicKey: anthropicKey ? `Available (${anthropicKey.substring(0, 8)}...)` : 'Missing',
        openaiLength: openaiKey?.length || 0,
        anthropicLength: anthropicKey?.length || 0,
      });
      
      if (!openaiKey && !anthropicKey) {
        console.error('❌ No API keys found - this will cause fallback to mock content');
        Alert.alert(
          'Setup Required',
          'AI content generation requires API keys to be configured. You\'re seeing fallback content because:\n\n• EXPO_PUBLIC_OPENAI_API_KEY: Missing\n• EXPO_PUBLIC_ANTHROPIC_API_KEY: Missing\n\nPlease check your .env file.',
          [{ text: 'OK' }]
        );
        throw new Error('No AI API keys configured. Check your .env file for EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_ANTHROPIC_API_KEY.');
      }

      // Debug user authentication state
      console.log('🔍 Auth Debug - User Info:', {
        userId: user?.id,
        userEmail: user?.email,
        isAuthenticated: !!user,
        hasGenerationAccess: hasPremiumAccess
      });

      // Ensure user is still authenticated before proceeding
      if (!user?.id) {
        console.error('❌ User not authenticated at generation start');
        Alert.alert(
          'Authentication Required',
          'Please sign in to generate content.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Check Supabase auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Supabase Session:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionExpiry: session?.expires_at,
        error: sessionError
      });

      // Verify user matches session
      if (!session?.user?.id || user.id !== session.user.id) {
        console.error('❌ User ID mismatch between context and session');
        Alert.alert(
          'Authentication Issue',
          'Your session appears to be out of sync. Please refresh the app and try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      // Process each step with realistic timing
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        const currentStep = GENERATION_STEPS[i];
        if (!currentStep) continue;
        
        if (!isMountedRef.current) break; // Exit loop if unmounted
        
        setCurrentStepIndex(i);
        
        // Animate progress bar
        Animated.timing(stepProgressAnim, {
          toValue: (i + 1) / GENERATION_STEPS.length,
          duration: 300,
          useNativeDriver: false,
        }).start();
        
        // Handle each step
        if (i === 0) {
          // Research step - validate API keys and setup
          setRealTimeProgress('Preparing content generation with verified sources...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (i === 1) {
          // Analysis step
          setRealTimeProgress('Analyzing topic complexity and civic relevance...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (i === 2) {
          // Questions step - actual generation happens here
          setRealTimeProgress('Generating high-quality questions with verified sources...');
          
          // Reset state
          setSourcesFound([]);
          setFactCheckProgress({});
          
          // Configure UGC input for high-quality, sourced content
          const ugcInput: UGCInput = {
            topic: topic.trim(),
            questionCount: questionCount,
            difficulty: 'normal',
            includeLocalContext: false,
            includeBiasAnalysis: true, // Enable bias analysis for better content
            includeActionSteps: true,
            customComplexity: hasPremiumAccess ? 'nuanced' : 'standard', // Use higher complexity for premium users
            userId: user?.id,
            isPremium: hasPremiumAccess,
            
            // Progress callbacks for real-time updates
            onProgress: (phase: string, message: string, data?: any) => {
              if (!isMountedRef.current) return;
              console.log(`📊 ${phase}: ${message}`);
              setRealTimeProgress(message);
            },
            
            onSourceFound: (source: {url: string; title: string; excerpt: string}) => {
              if (!isMountedRef.current) return;
              console.log(`📚 Source found: ${source.title}`);
              setSourcesFound(prev => [...prev, source]);
            },
            
            onFactCheckUpdate: (questionIndex: number, status: string, details?: string) => {
              if (!isMountedRef.current) return;
              console.log(`✅ Question ${questionIndex + 1}: ${status}`);
              setFactCheckProgress(prev => ({
                ...prev,
                [questionIndex]: status
              }));
            },
          };
          
          console.log('📝 Starting content generation with UGC generator...');
          
          // Use the UGC generator with user-selected model
          const ugcGenerator = getUGCGenerator({
            provider: selectedModel.provider,
            model: selectedModel.model,
          });
          
          const result = await ugcGenerator.process(ugcInput);
          
          if (!result.success || !result.data) {
            console.error('❌ Content generation failed:', result.error);
            throw new Error(result.error || 'Content generation failed - please try again');
          }
          
          generatedContent = result.data;
          
          // DEBUG: Check if we got real AI content or fallback content
          const isRealContent = generatedContent.questions?.some((q: any) => 
            !q.question.includes('[DEPRECATED]') &&
            !q.question.includes('Sample question') &&
            !q.question.includes('Option A') &&
            q.sources && q.sources.length > 0
          );
          
          console.log('🎯 Content Generation Result:', {
            success: true,
            topicId: generatedContent.topic_id,
            questionCount: generatedContent.questions?.length || 0,
            totalSources: generatedContent.total_sources || 0,
            averageCredibility: generatedContent.average_credibility || 0,
            modelUsed: generatedContent.generation_metadata?.model_used || 'unknown',
            isRealContent: isRealContent,
            contentType: isRealContent ? '✅ Real AI Content' : '❌ Mock/Fallback Content',
          });
          
          // Show alert if we got fallback content
          if (!isRealContent) {
            console.warn('⚠️ Generated content appears to be fallback/mock content');
            Alert.alert(
              'Content Quality Notice',
              'The generated content appears to be using fallback data instead of real AI generation. This typically happens when:\n\n• API keys are missing or invalid\n• AI service is temporarily unavailable\n• Network connectivity issues\n\nThe content will still work, but may not be as personalized.',
              [{ text: 'Continue', style: 'default' }]
            );
          }
          
          console.log('✅ Content generation completed:', generatedContent.topic_id);
          
          await new Promise(resolve => setTimeout(resolve, 3000)); // Longer for generation
        } else if (i === 3) {
          // Verification step
          if (!generatedContent || !generatedContent.questions || generatedContent.questions.length === 0) {
            throw new Error('No valid content generated. Please try again with a different topic.');
          }
          
          setRealTimeProgress(`Fact-checking ${generatedContent.questions.length} questions...`);
          console.log(`✅ Generated ${generatedContent.questions.length} questions`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (i === 4) {
          // Finalizing step - save to database
          setRealTimeProgress('Saving your custom quiz...');
          
          if (!generatedContent.topic_id) {
            generatedContent.topic_id = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          }
          
          // The UGC generator already saved to database, so we just need to update the collection if provided
          if (collectionId && generatedContent.questions && generatedContent.topic_id) {
            try {
              // Update collection status and metadata
              await supabase
                .from('custom_content_collections')
                .update({
                  status: 'draft',
                  ai_generation_id: generatedContent.topic_id,
                  question_count: generatedContent.questions.length,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', collectionId);

              // Create collection items from questions
              const collectionItems = generatedContent.questions.map((question: any, index: number) => ({
                collection_id: collectionId,
                custom_question_data: question,
                position: index + 1,
                added_by: user?.id || 'guest',
              }));

              await supabase
                .from('custom_collection_items')
                .insert(collectionItems);

              // Track analytics event
              await supabase
                .from('collection_analytics_events')
                .insert({
                  collection_id: collectionId,
                  user_id: user?.id,
                  event_type: 'generation_complete',
                  event_data: {
                    question_count: generatedContent.questions.length,
                    topic: generatedContent.topic,
                    model: generatedContent.generation_metadata?.model_used,
                    is_premium: hasPremiumAccess,
                    ai_generation_id: generatedContent.topic_id,
                  },
                });

              console.log('✅ Collection updated with generated content');
            } catch (error) {
              console.error('❌ Error updating collection:', error);
              // Don't fail the whole process for collection update errors
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('🎉 Content generation completed successfully');
      
      // Check if component is still mounted before navigation
      if (!isMountedRef.current) {
        console.warn('⚠️ Component unmounted during generation, skipping navigation');
        return;
      }
      
      // Navigate to results screen with generated content
      const draftId = generatedContent.topic_id || `temp_${Date.now()}`;
      console.log('🎉 Navigating to results with:', {
        topic: topic,
        questionCount: generatedContent.questions?.length || questionCount,
        draftId: draftId,
      });
      
      setTimeout(() => {
        if (isMountedRef.current) {
          router.push({
            pathname: '/premium/content-results',
            params: {
              topic: topic.trim(),
              questionCount: String(generatedContent.questions?.length || questionCount),
              draftId: draftId,
            }
          } as any);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      
      // Only show alert if component is still mounted
      if (isMountedRef.current) {
        Alert.alert(
          'Generation Failed',
          `We encountered an issue generating your content: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a different topic.`,
          [
            { text: 'Try Again', onPress: () => setIsGenerating(false) },
            { text: 'Go Back', onPress: () => router.back() },
          ]
        );
      }
    } finally {
      // Always reset generating state if component is mounted
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  // Simple validation - just check for basic content
  const validateTopic = (topicText: string): boolean => {
    const trimmed = topicText.trim();
    
    // Very basic validation
    if (trimmed.length < 3) return false; // Allow even keywords
    if (trimmed.length > 200) return false;
    
    // Only block truly empty or spam content
    const spamPhrases = ['test', 'hello world', 'random'];
    const lowerTopic = trimmed.toLowerCase();
    
    return !spamPhrases.includes(lowerTopic);
  };

  const canSubmit = topic.trim().length > 0 && validateTopic(topic) && canGenerate && !isGenerating;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Create Quiz',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Header */}


          {/* News Inspiration Section */}
          {!isGenerating && (
            <View style={styles.newsInspirationSection}>
              <View style={styles.newsInspirationHeader}>
                <Text style={[styles.newsInspirationTitle, { color: theme.foreground }]}>
                  📰 Get Inspired by Current Events
                </Text>
                <Text style={[styles.newsInspirationSubtitle, { color: theme.foregroundSecondary }]}>
                  Tap any story to create a quiz about it
                </Text>
              </View>
              <NewsTicker
                compact={true}
                titleLineLimit={2}
                maxArticles={15}
                onArticleClick={(article) => {
                  // Format date for better readability
                  const formatArticleDate = (dateString: string): string => {
                    try {
                      const date = new Date(dateString);
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      if (date.toDateString() === today.toDateString()) {
                        return 'today';
                      } else if (date.toDateString() === yesterday.toDateString()) {
                        return 'yesterday';
                      } else {
                        return date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                        });
                      }
                    } catch {
                      return 'recently';
                    }
                  };

                  // Create a rich, contextual topic that includes source, date, and content
                  const formattedDate = formatArticleDate(article.publishedAt);
                  const sourceName = article.source.name;
                  
                  // Build comprehensive topic with context
                  let topic = `${article.title}`;
                  
                  // Add source and date context
                  topic += ` (${sourceName}, ${formattedDate})`;
                  
                  // Add description context if available and different from title
                  if (article.description && 
                      article.description.length > 0 && 
                      !article.title.includes(article.description.substring(0, 50))) {
                    const shortDescription = article.description.length > 100 
                      ? article.description.substring(0, 100) + '...'
                      : article.description;
                    topic += `\n\nContext: ${shortDescription}`;
                  }

                  console.log('📰 Article clicked for quiz creation:', {
                    title: article.title,
                    source: sourceName,
                    date: formattedDate,
                    hasDescription: !!article.description,
                    topicLength: topic.length
                  });

                  setTopic(topic);
                  setShowExamples(false);
                  
                  // Focus the input to show the user what happened
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 100);
                }}
              />
            </View>
          )}

          {/* Generation in progress */}
          {isGenerating && (
            <Animated.View style={[styles.generationContainer, { opacity: generationAnim }]}>
              <Card style={{...styles.generationCard, backgroundColor: theme.card}}>
                {/* Vertical Stepper */}
                <View style={styles.verticalStepper}>
                  {GENERATION_STEPS.map((step, index) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={[
                        styles.stepIndicator,
                        {
                          backgroundColor: index < currentStepIndex 
                            ? theme.primary 
                            : index === currentStepIndex 
                            ? theme.primary 
                            : theme.border,
                        }
                      ]}>
                        <Text style={[
                          styles.stepIcon,
                          {
                            color: index <= currentStepIndex ? '#FFFFFF' : theme.foregroundSecondary
                          }
                        ]}>
                          {index < currentStepIndex ? '✓' : step.icon}
                        </Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[
                          styles.stepTitle,
                          { 
                            color: index <= currentStepIndex ? theme.foreground : theme.foregroundSecondary,
                            fontWeight: index === currentStepIndex ? '600' : '400'
                          }
                        ]}>
                          {step.title}
                        </Text>
                        <Text style={[
                          styles.stepSubtitle,
                          { color: theme.foregroundSecondary }
                        ]}>
                          {step.subtitle}
                        </Text>
                      </View>
                      {index < GENERATION_STEPS.length - 1 && (
                        <View style={[
                          styles.stepConnector,
                          { backgroundColor: index < currentStepIndex ? theme.primary : theme.border }
                        ]} />
                      )}
                    </View>
                  ))}
                </View>
                
                {/* Progress Bar */}
                <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      { 
                        backgroundColor: theme.primary,
                        width: stepProgressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                </View>
                
                {/* Real-time Progress */}
                {realTimeProgress && (
                  <Animated.View style={[styles.realTimeProgress, { opacity: pulsingAnim }]}>
                    <Text style={[styles.realTimeText, { color: theme.foregroundSecondary }]}>
                      {realTimeProgress}
                    </Text>
                  </Animated.View>
                )}
                
                {/* Sources Found */}
                {sourcesFound.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <Text style={[styles.sourcesTitle, { color: theme.foreground }]}>
                      📚 Sources Found ({sourcesFound.length})
                    </Text>
                    {sourcesFound.slice(0, 3).map((source, index) => (
                      <Text key={index} style={[styles.sourceItem, { color: theme.foregroundSecondary }]}>
                        • {source.title}
                      </Text>
                    ))}
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Input Form */}
          {!isGenerating && (
            <Card style={{...styles.inputCard, backgroundColor: theme.card}}>
              {/* Example queries */}
              {showExamples && (
                <TouchableOpacity
                  style={styles.exampleContainer}
                  onPress={handleExampleSelect}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.exampleLabel, { color: theme.foregroundSecondary }]}>
                    Example question:
                  </Text>
                  <Animated.View style={{ transform: [{ translateY: exampleAnim }] }}>
                    <Text style={[styles.exampleText, { color: theme.primary }]}>
                      "{EXAMPLE_QUERIES[currentExampleIndex]}"
                    </Text>
                  </Animated.View>
                  <Text style={[styles.exampleHint, { color: theme.foregroundSecondary }]}>
                    Tap to use this example
                  </Text>
                </TouchableOpacity>
              )}

              {/* Topic Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.foreground }]}>
                  What topic would you like to create a quiz about?
                </Text>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.textInput,
                    {
                      color: theme.foreground,
                      backgroundColor: theme.background,
                      borderColor: validateTopic(topic) ? theme.primary : theme.border,
                    },
                  ]}
                  value={topic}
                  onChangeText={(text) => {
                    console.log('📝 TextInput onChangeText called with:', text);
                    setTopic(text);
                  }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Enter any topic or keywords (e.g., climate change, healthcare, voting rights)..."
                  placeholderTextColor={theme.foregroundSecondary}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                  editable={true}
                  selectTextOnFocus={true}
                  returnKeyType="default"
                  blurOnSubmit={false}
                  accessible={true}
                  accessibilityLabel="Enter your civic topic or question"
                  accessibilityHint="Type your question about politics, government, or civic topics here"
                />
                
                {/* Character count and validation */}
                <View style={styles.inputFooter}>
                  <Text style={[styles.characterCount, { color: theme.foregroundSecondary }]}>
                    {topic.length}/200
                  </Text>
                  {topic.length > 0 && !validateTopic(topic) && (
                    <Text style={[styles.validationError, { color: '#EF4444' }]}>
                      Please enter at least 3 characters
                    </Text>
                  )}
                </View>
              </View>

              {/* AI Model Selector */}
              <View style={styles.settingsContainer}>
                <Text style={[styles.settingsLabel, { color: theme.foreground }]}>
                  AI Model
                </Text>
                <View style={styles.modelGrid}>
                  {availableModels.map((model) => (
                    <TouchableOpacity
                      key={model.model}
                      style={[
                        styles.modelButton,
                        {
                          backgroundColor: selectedModel.model === model.model ? theme.primary : theme.border,
                          borderColor: selectedModel.model === model.model ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedModel(model)}
                    >
                      <Text
                        style={[
                          styles.modelButtonTitle,
                          {
                            color: selectedModel.model === model.model ? '#FFFFFF' : theme.foreground,
                          },
                        ]}
                      >
                        {model.displayName}
                      </Text>
                      <Text
                        style={[
                          styles.modelButtonDescription,
                          {
                            color: selectedModel.model === model.model ? '#FFFFFF' : theme.foregroundSecondary,
                          },
                        ]}
                      >
                        {model.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Question Count Selector */}
              <View style={styles.settingsContainer}>
                <Text style={[styles.settingsLabel, { color: theme.foreground }]}>
                  Number of Questions
                </Text>
                <View style={styles.questionCountContainer}>
                  {[5, 10, 15].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.countButton,
                        {
                          backgroundColor: questionCount === count ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setQuestionCount(count)}
                    >
                      <Text
                        style={[
                          styles.countButtonText,
                          {
                            color: questionCount === count ? '#FFFFFF' : theme.foreground,
                          },
                        ]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  {
                    backgroundColor: canSubmit ? theme.primary : theme.border,
                    opacity: canSubmit ? 1 : 0.6,
                  },
                ]}
                onPress={() => generateWithContent()}
                disabled={!canSubmit}
              >
                <Text style={[styles.generateButtonText, { color: '#FFFFFF' }]}>
                  Generate {questionCount} Questions with {selectedModel.displayName}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Access info */}
              {!hasPremiumAccess && (
                <View style={styles.accessInfo}>
                  <Text style={[styles.accessInfoText, { color: theme.foregroundSecondary }]}>
                    {hasFreeTrial 
                      ? '🎉 Free preview - try your first custom quiz!' 
                      : '⭐ Upgrade to Pro for unlimited content generation'
                    }
                  </Text>
                </View>
              )}
            </Card>
          )}
        </ScrollView>
        
        {/* Bottom Debug Footer - only in development */}
        {__DEV__ && (
          <ScrollView 
            style={[styles.debugFooter, { backgroundColor: theme.card, borderTopColor: theme.border }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <PremiumDebugPanel />
            <DatabaseDebugger />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerGradient: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: SCREEN_WIDTH - 64,
  },
  generationContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  generationCard: {
    padding: 24,
    gap: 24,
  },
  verticalStepper: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 16,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    zIndex: 2,
  },
  stepIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    bottom: -16,
    zIndex: 1,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  realTimeProgress: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  realTimeText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sourcesContainer: {
    gap: 8,
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceItem: {
    fontSize: 12,
    paddingLeft: 12,
  },
  inputCard: {
    margin: 24,
    padding: 24,
    gap: 24,
  },
  exampleContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  exampleHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    lineHeight: 22,
    zIndex: 1,
    elevation: 1, // Android elevation
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 12,
  },
  validationError: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  settingsContainer: {
    gap: 12,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionCountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  countButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modelGrid: {
    gap: 12,
  },
  modelButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 4,
  },
  modelButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelButtonDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accessInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  accessInfoText: {
    fontSize: 12,
    textAlign: 'center',
  },
  newsInspirationSection: {
    padding: 24,
    gap: 24,
  },
  newsInspirationHeader: {
    alignItems: 'center',
    gap: 8,
  },
  newsInspirationTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  newsInspirationSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  debugFooter: {
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: '#F5F5F5',
    gap: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
}); 