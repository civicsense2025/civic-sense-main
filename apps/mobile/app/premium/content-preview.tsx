import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Share,
  ActivityIndicator,
  Modal,
  Linking,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, typography, fontFamily } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sources: {
    title: string;
    url: string;
    credibility_score: number;
    bias_rating: string;
    author?: string;
    date?: string;
  }[];
  fact_check_status: 'verified' | 'partially_verified' | 'unverified';
  civic_relevance_score: number;
}

interface GeneratedContent {
  topic: string;
  questions: GeneratedQuestion[];
  generated_at: string;
  total_sources: number;
  average_credibility: number;
  fact_check_summary: string;
  generation_metadata?: {
    model_used: string;
    processing_time: number;
    research_depth: number;
    fact_check_passes: number;
    debug_prompt?: string;
    [key: string]: any;
  };
}

// No mock data - all content loaded from AI generation

// Debug component to show the generated prompt
interface DebugPromptSectionProps {
  prompt: string;
  theme: any;
}

const DebugPromptSection: React.FC<DebugPromptSectionProps> = ({ prompt, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

  const handleCopyPrompt = () => {
    // Note: React Native doesn't have built-in clipboard, but this is for debugging
    // In a real implementation, you'd use @react-native-clipboard/clipboard
    console.log('📋 Debug Prompt:', prompt);
    setShowCopyConfirm(true);
    setTimeout(() => setShowCopyConfirm(false), 2000);
  };

  return (
    <Card style={StyleSheet.flatten([styles.debugCard, { borderColor: '#FF6B35' }])} variant="outlined">
      <TouchableOpacity
        style={styles.debugHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.debugHeaderLeft}>
          <Text style={[styles.debugTitle, { color: '#FF6B35' }]}>
            🛠️ Debug: AI Prompt Used
          </Text>
          <Text style={[styles.debugSubtitle, { color: theme.foregroundSecondary }]}>
            {isExpanded ? 'Tap to collapse' : 'Tap to view the full prompt sent to AI'}
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#FF6B35" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.debugContent}>
          <View style={styles.debugActions}>
            <TouchableOpacity
              style={[styles.debugCopyButton, { backgroundColor: '#FF6B35' }]}
              onPress={handleCopyPrompt}
            >
              <Ionicons name="copy" size={14} color="#FFFFFF" />
              <Text style={styles.debugCopyText}>
                {showCopyConfirm ? 'Logged to Console!' : 'Log to Console'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={[styles.debugPromptContainer, { backgroundColor: theme.card }]}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.debugPromptText, { color: theme.foregroundSecondary }]} selectable>
              {prompt}
            </Text>
          </ScrollView>
        </View>
      )}
    </Card>
  );
};

export default function ContentPreviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ 
    topic: string; 
    questionCount: string; 
    draftId?: string;
    collectionId?: string;
  }>();
  
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
  const [showSources, setShowSources] = useState<{ [key: string]: boolean }>({});
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  
  // Source drawer state
  const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
  const [selectedSources, setSelectedSources] = useState<any[]>([]);
  const [selectedQuestionTitle, setSelectedQuestionTitle] = useState<string>('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadGeneratedContent();
  }, []);

  const loadGeneratedContent = async () => {
    try {
      setLoading(true);
      
      // Prioritize collectionId over draftId for the new flow
      const contentId = params.collectionId || params.draftId;
      const isCollection = !!params.collectionId;
      
      if (contentId && user?.id) {
        console.log(`📖 Loading content from ${isCollection ? 'collection' : 'generation'}:`, contentId);
        
        if (isCollection) {
          // Load from collections table and get the associated generation
          const { data: collection, error: collectionError } = await supabase
            .from('custom_content_collections')
            .select('*, ai_generation_id')
            .eq('id', contentId)
            .eq('owner_id', user.id)
            .single();
          
          if (collectionError) {
            console.error('❌ Error loading collection:', collectionError);
            throw new Error('Failed to load collection data');
          }
          
          setCollectionId(collection.id);
          
          // Load the actual content from the generation
          if (collection.ai_generation_id) {
            const { data: generationData, error: generationError } = await supabase
              .from('custom_content_generations')
              .select('*')
              .eq('id', collection.ai_generation_id)
              .single();
            
            if (generationError || !generationData?.content) {
              console.error('❌ Error loading generation content:', generationError);
              throw new Error('Content data is missing or corrupted');
            }
            
            setContent(generationData.content);
            console.log('✅ Content loaded from collection');
          } else {
            throw new Error('Collection has no associated content generation');
          }
          
          // Load user engagement data
          await loadUserEngagement(collection.id);
          
        } else {
          // Legacy: Load from custom_content_generations table
          const { data: draftData, error } = await supabase
            .from('custom_content_generations')
            .select('*')
            .eq('id', contentId)
            .single();
          
          if (error) {
            console.error('❌ Error loading content:', error);
            throw new Error('Failed to load content - generation not found');
          } else if (draftData?.content) {
            console.log('✅ Content loaded from generation');
            setContent(draftData.content);
            
            // Check if this has an associated collection
            const { data: collection, error: collectionError } = await supabase
              .from('custom_content_collections')
              .select('id, status')
              .eq('ai_generation_id', contentId)
              .eq('owner_id', user.id)
              .single();
            
            if (collection) {
              setCollectionId(collection.id);
              console.log('📊 Found associated collection:', collection.id);
              
              // Load user engagement data
              await loadUserEngagement(collection.id);
            }
          } else {
            console.warn('⚠️ Generation found but no content data');
            throw new Error('Content data is missing or corrupted');
          }
        }
      } else {
        // No content ID - this shouldn't happen in normal flow
        console.error('❌ No content identifier provided');
        throw new Error('No content identifier provided. Please generate content first.');
      }
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (error) {
      console.error('❌ Error loading generated content:', error);
      Alert.alert(
        'Loading Error', 
        'Failed to load your generated content. This might be because:\n\n• The content generation is still in progress\n• The content failed to save properly\n• There was a network issue\n\nPlease try generating new content.',
        [
          { text: 'Go Back', onPress: () => router.back() },
          { text: 'Generate New', onPress: () => router.replace('/premium/create-content') },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserEngagement = async (collectionId: string) => {
    if (!user?.id) return;
    
    try {
      const { data: engagement, error } = await supabase
        .from('collection_engagement')
        .select('rating, has_liked, has_saved')
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)
        .single();
      
      if (engagement) {
        setUserRating(engagement.rating);
      }
    } catch (error) {
      console.log('No existing engagement data found');
    }
  };

  const handleRating = async (rating: number) => {
    if (!collectionId || !user?.id) return;
    
    setIsRating(true);
    try {
      const { error } = await supabase
        .from('collection_engagement')
        .upsert({
          collection_id: collectionId,
          user_id: user.id,
          rating: rating,
          rated_at: new Date().toISOString(),
        }, {
          onConflict: 'collection_id,user_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      setUserRating(rating);
      console.log('✅ Rating saved:', rating);
    } catch (error) {
      console.error('❌ Error saving rating:', error);
      // Try updating instead if upsert fails
      try {
        const { error: updateError } = await supabase
          .from('collection_engagement')
          .update({
            rating: rating,
            rated_at: new Date().toISOString(),
          })
          .eq('collection_id', collectionId)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
        
        setUserRating(rating);
        console.log('✅ Rating updated:', rating);
      } catch (updateError) {
        console.error('❌ Error updating rating:', updateError);
        Alert.alert('Error', 'Failed to save rating. Please try again.');
      }
    } finally {
      setIsRating(false);
    }
  };

  const toggleSources = (questionId: string) => {
    setShowSources(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const openSourceDrawer = (sources: any[], questionTitle: string) => {
    setSelectedSources(sources);
    setSelectedQuestionTitle(questionTitle);
    setSourceDrawerVisible(true);
    
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSourceDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSourceDrawerVisible(false);
      setSelectedSources([]);
      setSelectedQuestionTitle('');
    });
  };

  const openSourceUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const handlePublishQuiz = async () => {
    if (!content || !user) return;
    
    try {
      Alert.alert(
        'Publish Quiz',
        'Your custom quiz will be saved and made available to play. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Publish',
            onPress: async () => {
              try {
                console.log('📝 Publishing quiz...');
                
                // Simply update the existing collection to published
                if (collectionId) {
                  const { error: updateError } = await supabase
                    .from('custom_content_collections')
                    .update({ 
                      status: 'published',
                      published_at: new Date().toISOString(),
                      visibility: 'private', // Ensure it's accessible to the user
                    })
                    .eq('id', collectionId)
                    .eq('owner_id', user.id);
                  
                  if (updateError) {
                    console.error('❌ Error updating collection:', updateError);
                    throw updateError;
                  }
                  
                  console.log('✅ Collection published successfully');
                } else {
                  // This shouldn't happen in the new flow, but handle legacy cases
                  console.warn('⚠️ No collection ID found, creating new collection');
                  
                  const { data: newCollection, error: collectionError } = await supabase
                    .from('custom_content_collections')
                    .insert({
                      title: content.topic,
                      description: `AI-generated quiz with ${content.questions.length} questions`,
                      owner_id: user.id,
                      created_by: user.id,
                      created_by_ai: true,
                      ai_generation_id: params.draftId || null,
                      creation_method: 'ai_generated',
                      question_count: content.questions.length,
                      visibility: 'private',
                      status: 'published',
                      published_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();
                  
                  if (collectionError) {
                    console.error('❌ Error creating collection:', collectionError);
                    throw collectionError;
                  }
                  
                  setCollectionId(newCollection.id);
                  
                  // Create collection items from questions
                  const collectionItems = content.questions.map((question, index) => ({
                    collection_id: newCollection.id,
                    custom_question_data: question,
                    position: index + 1,
                    added_by: user.id,
                  }));
                  
                  const { error: itemsError } = await supabase
                    .from('custom_collection_items')
                    .insert(collectionItems);
                  
                  if (itemsError) {
                    console.error('❌ Error creating collection items:', itemsError);
                    // Don't fail the publish for items error
                  }
                }
                
                Alert.alert(
                  'Quiz Published! 🎉',
                  'Your custom quiz has been published and is now available in your Saved tab.',
                  [
                    { text: 'View in Saved', onPress: () => router.push('/(tabs)/saved' as any) },
                    { text: 'Create Another', onPress: () => router.replace('/premium/create-content' as any) },
                  ]
                );
              } catch (error) {
                console.error('❌ Error publishing quiz:', error);
                Alert.alert('Error', 'Failed to publish quiz. Please try again.');
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error publishing quiz:', error);
      Alert.alert('Error', 'Failed to publish quiz. Please try again.');
    }
  };

  const handleShareQuiz = async () => {
    if (!content || !collectionId) return;
    
    try {
      // Create a share link if collection is published
      const { data: collection } = await supabase
        .from('custom_content_collections')
        .select('status, visibility')
        .eq('id', collectionId)
        .single();
      
      if (collection?.status !== 'published') {
        Alert.alert(
          'Publish First',
          'You need to publish your quiz before sharing it.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Create or get existing share code
      const { data: existingShare } = await supabase
        .from('collection_shares')
        .select('share_code')
        .eq('collection_id', collectionId)
        .eq('shared_by', user!.id)
        .eq('share_type', 'social')
        .is('revoked_at', null)
        .single();
      
      let shareCode = existingShare?.share_code;
      
      if (!shareCode) {
        const { data: newShare, error: shareError } = await supabase
          .from('collection_shares')
          .insert({
            collection_id: collectionId,
            shared_by: user!.id,
            share_type: 'social',
            allow_remix: false,
            allow_download: false,
            require_login: false,
          })
          .select('share_code')
          .single();
        
        if (shareError) {
          console.error('❌ Error creating share:', shareError);
          throw shareError;
        }
        
        shareCode = newShare.share_code;
      }
      
      const shareUrl = `https://civicsense.com/quiz/${shareCode}`;
      const shareMessage = `🧠 Check out this custom CivicSense quiz I created!\n\nTopic: ${content.topic}\n\n✅ ${content.questions.length} fact-checked questions\n📚 ${content.total_sources} verified sources\n🎯 ${content.average_credibility}% average credibility\n\n${shareUrl}\n\nGenerated with CivicSense Pro - AI-powered civic education that reveals how power actually works.`;
      
      await Share.share({
        message: shareMessage,
        title: `Custom Civic Quiz: ${content.topic}`,
        url: shareUrl,
      });
      
      // Track share analytics
      await supabase
        .from('collection_analytics_events')
        .insert({
          collection_id: collectionId,
          user_id: user?.id,
          event_type: 'share',
          event_data: { share_type: 'native', platform: 'mobile' },
        });
        
    } catch (error) {
      console.error('Error sharing quiz:', error);
      Alert.alert('Error', 'Failed to share quiz. Please try again.');
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 70) return '#F97316';
    return '#EF4444';
  };

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'center': return '#2563EB';
      case 'lean_left':
      case 'lean_right': return '#F59E0B';
      case 'left':
      case 'right': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getFactCheckIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'partially_verified': return '⚠️';
      case 'unverified': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Generating Content', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Finalizing your custom quiz...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Content Preview', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.foreground }]}>
            Failed to load generated content
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Preview Quiz',
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleShareQuiz}
              style={styles.headerButton}
            >
              <Ionicons name="share-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Stats */}
          <LinearGradient
            colors={[theme.primary + '10', theme.background]}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>🎯</Text>
              <Text style={[styles.headerTitle, { color: theme.foreground }]}>
                Your Custom Quiz is Ready!
              </Text>
              <Text style={[styles.topicTitle, { color: theme.primary }]} numberOfLines={2}>
                {content.topic}
              </Text>
              
              {/* Quality Metrics */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{content.questions.length}</Text>
                  <Text style={[styles.metricLabel, { color: theme.foregroundSecondary }]}>Questions</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: getCredibilityColor(content.average_credibility) }]}>
                    {content.average_credibility}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.foregroundSecondary }]}>Credibility</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{content.total_sources}</Text>
                  <Text style={[styles.metricLabel, { color: theme.foregroundSecondary }]}>Sources</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Rating Section */}
          {collectionId && (
            <Card style={styles.ratingCard} variant="outlined">
              <Text style={[styles.ratingTitle, { color: theme.foreground }]}>
                ⭐ Rate this Quiz
              </Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(star)}
                    disabled={isRating}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={userRating && star <= userRating ? "star" : "star-outline"}
                      size={28}
                      color={userRating && star <= userRating ? "#F59E0B" : theme.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {userRating && (
                <Text style={[styles.ratingText, { color: theme.foregroundSecondary }]}>
                  You rated this {userRating} star{userRating !== 1 ? 's' : ''}
                </Text>
              )}
              {isRating && (
                <View style={styles.ratingLoader}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.ratingLoaderText, { color: theme.foregroundSecondary }]}>
                    Saving your rating...
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Fact Check Summary */}
          <Card style={styles.summaryCard} variant="outlined">
            <Text style={[styles.summaryTitle, { color: theme.foreground }]}>
              🔍 Fact-Check Summary
            </Text>
            <Text style={[styles.summaryText, { color: theme.foregroundSecondary }]}>
              {content.fact_check_summary}
            </Text>
          </Card>

          {/* Debug Section (Development/Debug Mode) */}
          {__DEV__ && content.generation_metadata?.debug_prompt && (
            <DebugPromptSection 
              prompt={content.generation_metadata.debug_prompt}
              theme={theme}
            />
          )}

          {/* Questions Preview */}
          <View style={styles.questionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              📝 Generated Questions
            </Text>
            
            {content.questions.map((question, index) => (
              <Card key={question.id} style={styles.questionCard} variant="outlined">
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={[styles.questionNumberText, { color: theme.primary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.questionMeta}>
                    <Text style={styles.factCheckIcon}>
                      {getFactCheckIcon(question.fact_check_status)}
                    </Text>
                    <View style={styles.difficultyBadge}>
                      <Text style={[styles.difficultyText, { color: theme.foregroundSecondary }]}>
                        {question.difficulty}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={[styles.questionText, { color: theme.foreground }]}>
                  {question.question}
                </Text>
                
                {/* Answer Options */}
                <View style={styles.optionsContainer}>
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = option === question.correct_answer;
                    return (
                      <View 
                        key={optionIndex}
                        style={[
                          styles.optionItem,
                          { 
                            backgroundColor: isCorrect ? theme.primary + '10' : theme.background,
                            borderColor: isCorrect ? theme.primary : theme.border,
                          }
                        ]}
                      >
                        <Text style={[styles.optionLetter, { color: theme.foregroundSecondary }]}>
                          {String.fromCharCode(65 + optionIndex)}
                        </Text>
                        <Text style={[styles.optionText, { color: theme.foreground }]}>
                          {option}
                        </Text>
                        {isCorrect && (
                          <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                        )}
                      </View>
                    );
                  })}
                </View>
                
                {/* Explanation */}
                <View style={[styles.explanationContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.explanationTitle, { color: theme.foreground }]}>
                    💡 Explanation
                  </Text>
                  <Text style={[styles.explanationText, { color: theme.foregroundSecondary }]}>
                    {question.explanation}
                  </Text>
                </View>
                
                {/* Sources Button - Now opens drawer */}
                {question.sources && question.sources.length > 0 ? (
                  <TouchableOpacity
                    style={[styles.sourcesButton, { backgroundColor: theme.primary }]}
                    onPress={() => openSourceDrawer(question.sources, question.question)}
                  >
                    <Ionicons name="library" size={16} color="#FFFFFF" />
                    <Text style={styles.sourcesButtonText}>
                      View Sources ({question.sources.length})
                    </Text>
                    <Ionicons name="open" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.noSourcesButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name="alert-circle" size={16} color={theme.foregroundSecondary} />
                    <Text style={[styles.noSourcesText, { color: theme.foregroundSecondary }]}>
                      No sources available
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                Edit Topic
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handlePublishQuiz}
            >
              <Text style={styles.primaryButtonText}>
                Publish Quiz
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Source Drawer Modal */}
      <Modal
        visible={sourceDrawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSourceDrawer}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            activeOpacity={1}
            onPress={closeSourceDrawer}
          />
          
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
                transform: [
                  {
                    translateY: drawerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Drawer Handle */}
            <View style={[styles.drawerHandle, { backgroundColor: theme.border }]} />
            
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderLeft}>
                <Ionicons name="library" size={24} color={theme.primary} />
                <Text style={[styles.drawerTitle, { color: theme.foreground }]}>
                  Sources & References
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeSourceDrawer}
                style={[styles.drawerCloseButton, { backgroundColor: theme.card }]}
              >
                <Ionicons name="close" size={20} color={theme.foreground} />
              </TouchableOpacity>
            </View>

            {/* Question Context */}
            <View style={[styles.questionContext, { backgroundColor: theme.card }]}>
              <Text style={[styles.contextLabel, { color: theme.foregroundSecondary }]}>
                Question:
              </Text>
              <Text style={[styles.contextText, { color: theme.foreground }]} numberOfLines={3}>
                {selectedQuestionTitle}
              </Text>
            </View>
            
            {/* Sources List */}
            <ScrollView style={styles.drawerScrollView} showsVerticalScrollIndicator={false}>
              {selectedSources.map((source, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.drawerSourceItem, { borderColor: theme.border }]}
                  onPress={() => openSourceUrl(source.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.drawerSourceHeader}>
                    <View style={styles.drawerSourceLeft}>
                      <Text style={[styles.drawerSourceTitle, { color: theme.foreground }]}>
                        {source.title}
                      </Text>
                      <Text style={[styles.drawerSourceUrl, { color: theme.primary }]}>
                        {source.url}
                      </Text>
                      {source.author && (
                        <Text style={[styles.drawerSourceMeta, { color: theme.foregroundSecondary }]}>
                          By {source.author} • {source.date}
                        </Text>
                      )}
                      {source.excerpt && (
                        <Text style={[styles.drawerSourceExcerpt, { color: theme.foregroundSecondary }]}>
                          "{source.excerpt}"
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.drawerSourceRight}>
                      <View style={[styles.credibilityBadge, { backgroundColor: getCredibilityColor(source.credibility_score) }]}>
                        <Text style={styles.credibilityText}>{source.credibility_score}%</Text>
                      </View>
                      <View style={[styles.biasBadge, { backgroundColor: getBiasColor(source.bias_rating) }]}>
                        <Text style={styles.biasText}>{source.bias_rating.replace('_', ' ')}</Text>
                      </View>
                      <Ionicons name="open-outline" size={16} color={theme.primary} style={{ marginTop: spacing.xs }} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {selectedSources.length === 0 && (
                <View style={styles.noSources}>
                  <Text style={[styles.noSourcesText, { color: theme.foregroundSecondary }]}>
                    No sources available for this question.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.title3,
    textAlign: 'center',
  },
  headerButton: {
    padding: spacing.xs,
  },

  // Header
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  topicTitle: {
    ...typography.title3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.title2,
    fontWeight: '700',
    fontSize: 24,
  },
  metricLabel: {
    ...typography.footnote,
    marginTop: spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  // Summary
  summaryCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  summaryText: {
    ...typography.footnote,
    lineHeight: 20,
  },

  // Rating
  ratingCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  ratingTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingText: {
    ...typography.footnote,
    marginBottom: spacing.sm,
  },
  ratingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingLoaderText: {
    ...typography.footnote,
  },

  // Questions
  questionsSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  questionCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    ...typography.callout,
    fontWeight: '700',
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  factCheckIcon: {
    fontSize: 16,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  difficultyText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
  },
  questionText: {
    ...typography.callout,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  // Options
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  optionLetter: {
    ...typography.footnote,
    fontWeight: '600',
    width: 20,
  },
  optionText: {
    ...typography.footnote,
    flex: 1,
    lineHeight: 18,
  },

  // Explanation
  explanationContainer: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  explanationTitle: {
    ...typography.footnote,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  explanationText: {
    ...typography.footnote,
    lineHeight: 18,
  },

  // Sources
  sourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sourcesButtonText: {
    ...typography.footnote,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  noSourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  noSourcesText: {
    ...typography.footnote,
    fontWeight: '500',
  },
  sourcesList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  sourceItem: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  sourceTitle: {
    ...typography.footnote,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 16,
  },
  sourceMetrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  credibilityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  credibilityText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 9,
  },
  biasBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  biasText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 9,
  },
  sourceUrl: {
    ...typography.caption1,
    fontSize: 10,
    marginBottom: spacing.xs,
  },
  sourceAuthor: {
    ...typography.caption1,
    fontSize: 10,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  primaryButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...typography.callout,
    fontWeight: '600',
  },

  // Source Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  drawerTitle: {
    ...typography.title3,
    fontWeight: '600',
  },
  drawerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContext: {
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  contextLabel: {
    ...typography.caption1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  contextText: {
    ...typography.footnote,
    lineHeight: 18,
  },
  drawerScrollView: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  drawerSourceItem: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  drawerSourceHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  drawerSourceLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  drawerSourceRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  drawerSourceTitle: {
    ...typography.callout,
    fontWeight: '600',
    lineHeight: 20,
  },
  drawerSourceUrl: {
    ...typography.footnote,
    fontWeight: '500',
  },
  drawerSourceMeta: {
    ...typography.caption1,
  },
  drawerSourceExcerpt: {
    ...typography.footnote,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  noSources: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  // Debug Section
  debugCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  debugHeaderLeft: {
    flex: 1,
  },
  debugTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  debugSubtitle: {
    ...typography.footnote,
  },
  debugContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  debugActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  debugCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    gap: spacing.xs,
  },
  debugCopyText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  debugPromptContainer: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: spacing.sm,
  },
  debugPromptText: {
    ...typography.caption1,
    lineHeight: 16,
    fontFamily: fontFamily.mono || 'monospace',
  },
}); 