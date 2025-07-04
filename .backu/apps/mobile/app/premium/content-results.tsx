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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { PremiumDebugPanel } from '../../components/debug/PremiumDebugPanel';
import { DatabaseDebugger } from '../../components/debug/DatabaseDebugger';
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
    excerpt?: string;
  }[];
  fact_check_status: 'verified' | 'partially_verified' | 'unverified';
  civic_relevance_score: number;
  uncomfortable_truths?: string[];
  power_dynamics?: string[];
  action_steps?: string[];
}

interface GeneratedContent {
  topic_id: string;
  topic: string;
  description?: string;
  questions: GeneratedQuestion[];
  generated_at: string;
  total_sources: number;
  average_credibility: number;
  fact_check_summary: string;
  generation_metadata: {
    model_used: string;
    processing_time: number;
    research_depth: number;
    fact_check_passes: number;
  };
  user_id?: string;
  is_preview: boolean;
}

// Helper functions for source styling
const getCredibilityColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // Green
  if (score >= 60) return '#F59E0B'; // Orange
  return '#EF4444'; // Red
};

const getBiasColor = (rating: string): string => {
  switch (rating.toLowerCase()) {
    case 'left':
    case 'left-center':
      return '#3B82F6'; // Blue
    case 'right':
    case 'right-center':
      return '#EF4444'; // Red
    case 'center':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

export default function ContentResultsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ 
    topic: string; 
    questionCount: string; 
    draftId: string;
  }>();
  
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadGeneratedContent();
  }, []);

  const loadGeneratedContent = async () => {
    try {
      setLoading(true);
      
      if (params.draftId && user?.id) {
        const { data: draftData, error } = await supabase
          .from('custom_content_generations')
          .select('*')
          .eq('id', params.draftId)
          .single();
        
        if (error) throw new Error('Failed to load generated content');
        
        if (draftData?.content) {
          setContent(draftData.content);
        } else {
          throw new Error('Content data is missing');
        }
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load generated content.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!content || !user?.id) return;
    
    try {
      setPublishing(true);
      
      // Check if collection already exists for this generation
      const { data: existingCollection, error: checkError } = await supabase
        .from('custom_content_collections')
        .select('id, status')
        .eq('ai_generation_id', params.draftId)
        .eq('owner_id', user.id)
        .single();

      let collection;
      
      if (existingCollection) {
        // Update existing collection
        const { data: updatedCollection, error: updateError } = await supabase
          .from('custom_content_collections')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            question_count: content.questions.length,
          })
          .eq('id', existingCollection.id)
          .select('id')
          .single();
        
        if (updateError) throw updateError;
        collection = updatedCollection;
      } else {
        // Create new collection
        const { data: newCollection, error: collectionError } = await supabase
          .from('custom_content_collections')
          .insert({
            title: content.topic,
            description: content.description || `AI-generated quiz with ${content.questions.length} questions`,
            owner_id: user.id,
            created_by: user.id,
            created_by_ai: true,
            ai_generation_id: params.draftId,
            creation_method: 'ai_generated',
            question_count: content.questions.length,
            visibility: 'private',
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (collectionError) throw collectionError;
        collection = newCollection;
      }
      
      // Only create collection items if this is a new collection
      if (!existingCollection) {
        const collectionItems = content.questions.map((question, index) => ({
          collection_id: collection.id,
          custom_question_data: question,
          position: index + 1,
          added_by: user.id,
        }));
        
        const { error: itemsError } = await supabase
          .from('custom_collection_items')
          .insert(collectionItems);
        
        if (itemsError) {
          console.error('Error creating collection items:', itemsError);
          // Don't fail the whole process for items error
        }
      }
      
      await supabase
        .from('custom_content_generations')
        .update({ status: 'published' })
        .eq('id', params.draftId);
      
      Alert.alert('Quiz Published! 🎉', 'Your quiz is ready to play.');
      router.push('/(tabs)/saved' as any);
    } catch (error) {
      console.error('Error publishing:', error);
      Alert.alert('Error', 'Failed to publish quiz.');
    } finally {
      setPublishing(false);
    }
  };

  const formatPublishDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'today';
      } else if (diffInDays === 1) {
        return 'yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      return 'recently';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          title: 'Generation Results',
          headerShown: true,
          headerStyle: { 
            backgroundColor: theme.background,
          },
          headerTintColor: theme.foreground,
          headerTitleStyle: { 
            color: theme.foreground,
            fontFamily: fontFamily.mono,
            fontWeight: '400',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.headerBackText, { color: theme.primary }]}>‹</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🎉</Text>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              Your Quiz is Ready!
            </Text>
            <Text style={[styles.topicTitle, { color: theme.primary }]}>
              {content.topic}
            </Text>
            
            {/* Publication Date */}
            <Text style={[styles.topicDate, { color: theme.foregroundSecondary }]}>
              Generated {formatPublishDate(content.generated_at)}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>📝</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {content.questions.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>Questions</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>⭐</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {content.average_credibility}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>Credibility</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>📚</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {content.total_sources}
              </Text>
              <Text style={[styles.statLabel, { color: theme.foregroundSecondary }]}>Sources</Text>
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              🔍 Generation Summary
            </Text>
            <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.summaryText, { color: theme.foregroundSecondary }]}>
                {content.fact_check_summary}
              </Text>
            </View>
          </View>

          {/* Sources Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              📚 Sources Used ({content.total_sources})
            </Text>
            <Text style={[styles.sourcesDescription, { color: theme.foregroundSecondary }]}>
              Questions generated from these verified sources:
            </Text>
            
            <View style={styles.sourcesList}>
              {content.questions.slice(0, 5).map((question, questionIndex) => (
                question.sources.slice(0, 2).map((source, sourceIndex) => (
                  <View key={`${questionIndex}-${sourceIndex}`} style={[styles.sourceItem, { 
                    borderLeftColor: theme.primary,
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }]}>
                    <View style={styles.sourceHeader}>
                      <Text style={[styles.sourceTitle, { color: theme.foreground }]} numberOfLines={2}>
                        {source.title}
                      </Text>
                      <View style={[styles.credibilityBadge, { backgroundColor: getCredibilityColor(source.credibility_score) }]}>
                        <Text style={styles.credibilityText}>
                          {source.credibility_score}%
                        </Text>
                      </View>
                    </View>
                    
                    {source.author && (
                      <Text style={[styles.sourceAuthor, { color: theme.foregroundSecondary }]}>
                        By {source.author}
                      </Text>
                    )}
                    
                    {source.excerpt && (
                      <Text style={[styles.sourceExcerpt, { color: theme.foregroundSecondary }]} numberOfLines={2}>
                        "{source.excerpt}"
                      </Text>
                    )}
                    
                    <View style={styles.sourceFooter}>
                      <Text style={[styles.sourceBias, { color: getBiasColor(source.bias_rating) }]}>
                        {source.bias_rating}
                      </Text>
                      {source.date && (
                        <Text style={[styles.sourceDate, { color: theme.foregroundSecondary }]}>
                          {new Date(source.date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )).slice(0, 8)}
              
              {content.total_sources > 8 && (
                <Text style={[styles.sourcesMore, { color: theme.foregroundSecondary }]}>
                  + {content.total_sources - 8} more sources used across all questions
                </Text>
              )}
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => router.push({
                pathname: '/premium/content-preview',
                params: { topic: params.topic, questionCount: params.questionCount, draftId: params.draftId }
              } as any)}
            >
              <Ionicons name="eye-outline" size={20} color={theme.foregroundSecondary} />
              <Text style={[styles.secondaryButtonText, { color: theme.foregroundSecondary }]}>
                Preview Quiz
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handlePublishQuiz}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Publish Quiz</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      {/* Debug Panel - Fixed to Bottom */}
      {__DEV__ && (
        <View style={[styles.debugContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.debugToggle}
            onPress={() => setDebugExpanded(!debugExpanded)}
          >
            <Text style={[styles.debugToggleText, { color: theme.foregroundSecondary }]}>
              🔧 Debug Tools
            </Text>
            <Ionicons 
              name={debugExpanded ? "chevron-down" : "chevron-up"} 
              size={16} 
              color={theme.foregroundSecondary} 
            />
          </TouchableOpacity>
          
          {debugExpanded && (
            <ScrollView 
              style={styles.debugContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <PremiumDebugPanel />
              <DatabaseDebugger />
            </ScrollView>
          )}
        </View>
      )}
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
    gap: spacing.lg,
  },
  loadingText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
  },
  headerButton: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  headerBackText: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerEmoji: {
    fontSize: 64,
    lineHeight: 72,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 34,
    textAlign: 'center',
  },
  topicTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  topicDate: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  statValue: {
    fontFamily: fontFamily.mono,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  
  // Summary Card
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  summaryText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Sources Section
  sourcesDescription: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sourcesList: {
    gap: spacing.md,
  },
  sourceItem: {
    padding: spacing.md,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sourceTitle: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  credibilityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  credibilityText: {
    fontFamily: fontFamily.mono,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
  sourceAuthor: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  sourceExcerpt: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  sourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceBias: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  sourceDate: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
  },
  sourcesMore: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  
  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
  },
  primaryButton: {},
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  primaryButtonText: {
    fontFamily: fontFamily.text,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  bottomSpacer: {
    height: spacing.xl,
  },
  
  // Debug Panel - Fixed to Bottom
  debugContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    maxHeight: '25%',
  },
  debugToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
  },
  debugToggleText: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  debugContent: {
    padding: spacing.sm,
    gap: spacing.sm,
    maxHeight: 180,
    overflow: 'hidden',
  },
}); 