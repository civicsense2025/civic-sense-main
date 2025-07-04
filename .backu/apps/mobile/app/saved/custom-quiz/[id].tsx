import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { Card } from '../../../components/ui/Card';
import { spacing, borderRadius, typography, fontFamily } from '../../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

interface CustomQuiz {
  id: string;
  user_id: string;
  topic: string;
  description?: string;
  question_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'published';
  questions: any[];
  created_at: string;
  updated_at: string;
}

export default function CustomQuizViewer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<CustomQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log('🎯 CustomQuizViewer mounted with params:', { id, userId: user?.id });
    if (id && user?.id) {
      loadQuiz();
    }
  }, [id, user?.id]);

  const handleEdit = () => {
    console.log('🎯 Edit button pressed for quiz:', id);
    
    Alert.alert(
      'Edit Quiz',
      'What would you like to do with this quiz?',
      [
        {
          text: 'Edit Questions',
          onPress: () => {
            console.log('🎯 Navigating to edit questions for quiz:', id);
            // TODO: Navigate to quiz editor
            Alert.alert('Coming Soon', 'Question editing functionality will be available soon!');
          }
        },
        {
          text: 'Edit Details',
          onPress: () => {
            console.log('🎯 Editing quiz details for:', id);
            // TODO: Show modal or navigate to details editor
            Alert.alert('Coming Soon', 'Details editing functionality will be available soon!');
          }
        },
        {
          text: quiz?.status === 'draft' ? 'Publish Quiz' : 'Unpublish Quiz',
          onPress: () => {
            console.log('🎯 Toggling publish status for quiz:', id);
            handleTogglePublishStatus();
          }
        },
        {
          text: 'Delete Quiz',
          style: 'destructive',
          onPress: () => {
            console.log('🎯 Deleting quiz:', id);
            handleDeleteQuiz();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleTogglePublishStatus = async () => {
    if (!quiz) return;

    const newStatus = quiz.status === 'draft' ? 'published' : 'draft';
    
    Alert.alert(
      `${newStatus === 'published' ? 'Publish' : 'Unpublish'} Quiz?`,
      `Are you sure you want to ${newStatus === 'published' ? 'publish' : 'unpublish'} this quiz?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus === 'published' ? 'Publish' : 'Unpublish',
          style: newStatus === 'published' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('custom_content_generations')
                .update({ 
                  status: newStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', user?.id);

              if (error) throw error;

              // Update local state
              setQuiz(prev => prev ? { ...prev, status: newStatus as 'draft' | 'published' } : null);
              
              Alert.alert(
                'Success',
                `Quiz ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`
              );
            } catch (error) {
              console.error('Error updating quiz status:', error);
              Alert.alert('Error', 'Failed to update quiz status. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;

    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to permanently delete "${quiz.topic}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('custom_content_generations')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id);

              if (error) throw error;

              Alert.alert(
                'Quiz Deleted',
                'Your quiz has been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to saved screen
                      router.back();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting quiz:', error);
              Alert.alert('Error', 'Failed to delete quiz. Please try again.');
            }
          }
        }
      ]
    );
  };

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_content_generations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setQuiz({
          id: data.id,
          user_id: data.user_id,
          topic: data.topic,
          description: data.description,
          question_count: data.question_count,
          difficulty: data.difficulty || 'medium',
          status: data.status || 'draft',
          questions: data.questions || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
        <Stack.Screen 
          options={{
            title: 'Loading...',
            headerShown: true,
            headerStyle: { 
              backgroundColor: theme.background,
            },
            headerTintColor: theme.foreground,
            headerTitleStyle: { 
              color: theme.foreground,
              fontFamily: 'SpaceMono-Regular',
              fontWeight: '400',
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 8, paddingRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={StyleSheet.flatten([styles.loadingText, { color: theme.foregroundSecondary }])}>
            Loading quiz...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
        <Stack.Screen 
          options={{
            title: 'Quiz Not Found',
            headerShown: true,
            headerStyle: { 
              backgroundColor: theme.background,
            },
            headerTintColor: theme.foreground,
            headerTitleStyle: { 
              color: theme.foreground,
              fontFamily: 'SpaceMono-Regular',
              fontWeight: '400',
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 8, paddingRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={StyleSheet.flatten([styles.errorText, { color: theme.foreground }])}>
            Quiz not found
          </Text>
          <TouchableOpacity
            style={StyleSheet.flatten([styles.backButton, { backgroundColor: theme.primary }])}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <Stack.Screen 
        options={{
          title: loading ? 'Custom Quiz' : (quiz?.topic && quiz.topic.length > 20 ? quiz.topic.substring(0, 20) + '...' : quiz?.topic || 'Custom Quiz'),
          headerShown: true,
          headerStyle: { 
            backgroundColor: theme.background,
          },
          headerTintColor: theme.foreground,
          headerTitleStyle: { 
            color: theme.foreground,
            fontFamily: 'SpaceMono-Regular',
            fontWeight: '400',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 8, paddingRight: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={{ fontSize: 24, color: theme.primary, fontWeight: '600' }}>‹</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="Edit quiz"
            >
              <Ionicons name="create-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quiz Info */}
        <Card style={StyleSheet.flatten([styles.infoCard, { backgroundColor: theme.card }])}>
          <View style={styles.infoHeader}>
            <Text style={StyleSheet.flatten([styles.infoTitle, { color: theme.foreground }])}>
              Quiz Information
            </Text>
            <View style={StyleSheet.flatten([
              styles.statusBadge,
              { backgroundColor: quiz.status === 'published' ? '#10B981' : '#F59E0B' }
            ])}>
              <Text style={StyleSheet.flatten([styles.statusText, { color: '#FFFFFF' }])}>
                {quiz.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoContent}>
            <Text style={StyleSheet.flatten([styles.description, { color: theme.foregroundSecondary }])}>
              {quiz.description || 'No description provided'}
            </Text>
            
            <View style={styles.metaRow}>
              <Text style={StyleSheet.flatten([styles.metaLabel, { color: theme.foregroundSecondary }])}>
                Questions:
              </Text>
              <Text style={StyleSheet.flatten([styles.metaValue, { color: theme.foreground }])}>
                {quiz.questions.length}
              </Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={StyleSheet.flatten([styles.metaLabel, { color: theme.foregroundSecondary }])}>
                Difficulty:
              </Text>
              <Text style={StyleSheet.flatten([styles.metaValue, { color: theme.foreground }])}>
                {quiz.difficulty}
              </Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={StyleSheet.flatten([styles.metaLabel, { color: theme.foregroundSecondary }])}>
                Created:
              </Text>
              <Text style={StyleSheet.flatten([styles.metaValue, { color: theme.foreground }])}>
                {new Date(quiz.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Questions */}
        <Card style={StyleSheet.flatten([styles.questionsCard, { backgroundColor: theme.card }])}>
          <Text style={StyleSheet.flatten([styles.sectionTitle, { color: theme.foreground }])}>
            Questions ({quiz.questions.length})
          </Text>
          
          {quiz.questions.map((question, index) => (
            <View key={question.id || index} style={StyleSheet.flatten([
              styles.questionCard,
              { backgroundColor: theme.background, borderColor: theme.border }
            ])}>
              <View style={styles.questionHeader}>
                <Text style={StyleSheet.flatten([styles.questionNumber, { color: theme.primary }])}>
                  Q{index + 1}
                </Text>
              </View>
              
              <Text style={StyleSheet.flatten([styles.questionText, { color: theme.foreground }])}>
                {question.question || 'Question text not available'}
              </Text>
              
              {question.options && Array.isArray(question.options) && (
                <View style={styles.optionsContainer}>
                  {question.options.map((option: string, optionIndex: number) => (
                    <View
                      key={optionIndex}
                      style={StyleSheet.flatten([
                        styles.option,
                        {
                          backgroundColor: optionIndex === question.correct_answer 
                            ? theme.primary + '20' 
                            : theme.card,
                          borderColor: optionIndex === question.correct_answer 
                            ? theme.primary 
                            : theme.border,
                        },
                      ])}
                    >
                      <Text style={StyleSheet.flatten([styles.optionText, { color: theme.foreground }])}>
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </Text>
                      {optionIndex === question.correct_answer && (
                        <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              {question.explanation && (
                <View style={StyleSheet.flatten([
                  styles.explanationContainer,
                  { backgroundColor: theme.primary + '10' }
                ])}>
                  <Text style={StyleSheet.flatten([styles.explanationLabel, { color: theme.primary }])}>
                    Explanation:
                  </Text>
                  <Text style={StyleSheet.flatten([styles.explanationText, { color: theme.foreground }])}>
                    {question.explanation}
                  </Text>
                </View>
              )}
              
              {question.sources && Array.isArray(question.sources) && question.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={StyleSheet.flatten([styles.sourcesLabel, { color: theme.foregroundSecondary }])}>
                    Sources:
                  </Text>
                  {question.sources.map((source: any, sourceIndex: number) => (
                    <Text key={sourceIndex} style={StyleSheet.flatten([styles.sourceText, { color: theme.foregroundSecondary }])}>
                      • {typeof source === 'string' ? source : source?.title || source?.url || 'Source'}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card>

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    fontFamily: fontFamily.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    fontFamily: fontFamily.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.mono,
  },
  scrollView: {
    flex: 1,
    paddingTop: 20, // Reduced since we're using Stack.Screen header
  },
  editButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  
  // Info Card
  infoCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.title3,
    fontWeight: '600',
    fontFamily: fontFamily.display,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  statusText: {
    ...typography.caption1,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  infoContent: {
    gap: spacing.sm,
  },
  description: {
    ...typography.body,
    fontFamily: fontFamily.text,
    lineHeight: typography.body.lineHeight * 1.4,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
  },
  metaValue: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  
  // Questions Card
  questionsCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.lg,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionNumber: {
    ...typography.callout,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  },
  questionText: {
    ...typography.body,
    fontFamily: fontFamily.text,
    lineHeight: typography.body.lineHeight * 1.4,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  optionText: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    flex: 1,
  },
  explanationContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  explanationLabel: {
    ...typography.footnote,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  explanationText: {
    ...typography.footnote,
    fontFamily: fontFamily.text,
    lineHeight: typography.footnote.lineHeight * 1.3,
  },
  sourcesContainer: {
    gap: spacing.xs,
  },
  sourcesLabel: {
    ...typography.caption1,
    fontWeight: '600',
    fontFamily: fontFamily.display,
    marginBottom: spacing.xs,
  },
  sourceText: {
    ...typography.caption1,
    fontFamily: fontFamily.text,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: spacing.xl * 2,
  },
}); 