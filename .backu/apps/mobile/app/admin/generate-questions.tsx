import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { UGCContentGenerator } from '../../lib/ai/ugc-content-generator';
// Simple theme colors for the admin page
const theme = {
  colors: {
    primary: '#3B82F6',
    background: '#FFFFFF',
    text: '#020617',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
  }
};

interface GeneratedQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty_level: number;
  tags: string[];
  sources: Array<{ url: string; title: string; type: string }>;
  category: string;
}

export default function AdminGenerateQuestions() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Form fields
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [currentEventContext, setCurrentEventContext] = useState('');
  
  // Generated content
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  
  // Check if user is admin
  useEffect(() => {
    checkAdminStatus();
  }, [user]);
  
  const checkAdminStatus = async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { p_user_id: user.id });
      
      if (error) {
        console.error('Error checking admin status:', error);
        Alert.alert('Error', 'Failed to verify admin status');
        router.replace('/');
        return;
      }
      
      if (!data) {
        Alert.alert('Access Denied', 'This page is restricted to administrators only.');
        router.replace('/');
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };
  
  const generateQuestions = async () => {
    if (!topicTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter a topic title');
      return;
    }
    
    setGenerating(true);
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
    
    try {
      const generator = new UGCContentGenerator();
      
      // Prepare the topic with current event context
      const fullTopic = currentEventContext 
        ? `${topicTitle} - Current context: ${currentEventContext}`
        : topicTitle;
      
      const result = await generator.process({
        topic: fullTopic,
        questionCount: parseInt(questionCount) || 5,
        isPremium: true,
        onProgress: (phase, message) => {
          console.log(`${phase}: ${message}`);
        },
      });
      
      if (result.data?.questions && result.data.questions.length > 0) {
        const mappedQuestions: GeneratedQuestion[] = result.data.questions.map(q => ({
          question: q.question,
          option_a: q.options[0] || '',
          option_b: q.options[1] || '',
          option_c: q.options[2] || '',
          option_d: q.options[3] || '',
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty_level: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3,
          tags: [],
          sources: q.sources.map(s => ({ 
            url: s.url, 
            title: s.title, 
            type: s.bias_rating || 'general' 
          })),
          category: 'Power & Institutions',
        }));
        setGeneratedQuestions(mappedQuestions);
        // Select all by default
        setSelectedQuestions(new Set(mappedQuestions.map((_, index: number) => index)));
      } else {
        Alert.alert('Generation Failed', 'No questions were generated. Please try again.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const toggleQuestionSelection = (index: number) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedQuestions(newSelection);
  };
  
  const saveToDatabase = async () => {
    if (selectedQuestions.size === 0) {
      Alert.alert('No Selection', 'Please select at least one question to save');
      return;
    }
    
    const questionsToSave = generatedQuestions.filter((_, index) => 
      selectedQuestions.has(index)
    );
    
    setLoading(true);
    
    try {
      // First, create the topic if it doesn't exist
      const { data: existingTopic, error: topicCheckError } = await supabase
        .from('question_topics')
        .select('topic_id')
        .eq('topic_title', topicTitle)
        .single();
      
      let topicId;
      
      if (!existingTopic) {
        // Create new topic
        const { data: newTopic, error: topicError } = await supabase
          .from('question_topics')
          .insert({
            topic_title: topicTitle,
            description: topicDescription || topicTitle,
            emoji: '🏛️', // Default emoji
            is_active: true,
            is_featured: true,
            why_this_matters: `Understanding ${topicTitle} is crucial for democratic participation and informed citizenship.`,
          })
          .select('topic_id')
          .single();
        
        if (topicError) {
          throw new Error(`Failed to create topic: ${topicError.message}`);
        }
        
        topicId = newTopic.topic_id;
      } else {
        topicId = existingTopic.topic_id;
      }
      
      // Prepare questions for insertion
      const questionsData = questionsToSave.map((q, index) => ({
        topic_id: topicId,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        tags: q.tags,
        sources: q.sources,
        category: q.category,
        question_number: (index + 1).toString(),
        question_type: 'multiple_choice',
        is_active: true,
        fact_check_status: 'pending',
        hint: `Think about ${q.category.toLowerCase()} and recent developments.`,
      }));
      
      // Insert questions
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData);
      
      if (questionsError) {
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }
      
      Alert.alert(
        'Success!', 
        `Successfully saved ${questionsToSave.length} questions to the database.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save questions to database';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const renderQuestion = ({ item, index }: { item: GeneratedQuestion; index: number }) => {
    const isSelected = selectedQuestions.has(index);
    
    return (
      <TouchableOpacity
        style={[styles.questionCard, isSelected && styles.selectedCard]}
        onPress={() => toggleQuestionSelection(index)}
      >
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
        
        <Text style={styles.questionText}>{item.question}</Text>
        
        <View style={styles.options}>
          <Text style={[styles.option, item.correct_answer === 'a' && styles.correctOption]}>
            A) {item.option_a}
          </Text>
          <Text style={[styles.option, item.correct_answer === 'b' && styles.correctOption]}>
            B) {item.option_b}
          </Text>
          <Text style={[styles.option, item.correct_answer === 'c' && styles.correctOption]}>
            C) {item.option_c}
          </Text>
          <Text style={[styles.option, item.correct_answer === 'd' && styles.correctOption]}>
            D) {item.option_d}
          </Text>
        </View>
        
        <Text style={styles.explanationLabel}>Explanation:</Text>
        <Text style={styles.explanation}>{item.explanation}</Text>
        
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Difficulty: {item.difficulty_level} | Category: {item.category}
          </Text>
          <Text style={styles.sourcesText}>
            {item.sources.length} sources
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Verifying admin access...</Text>
      </View>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate Quiz Questions</Text>
          <Text style={styles.subtitle}>Admin Tool - Direct Database Generation</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic Title *</Text>
            <TextInput
              style={styles.input}
              value={topicTitle}
              onChangeText={setTopicTitle}
              placeholder="e.g., RFK Jr grilled over transparency"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={topicDescription}
              onChangeText={setTopicDescription}
              placeholder="Brief description for context..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Event Context</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentEventContext}
              onChangeText={setCurrentEventContext}
              placeholder="e.g., Senate hearings on December 15, 2024..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Questions</Text>
            <TextInput
              style={styles.input}
              value={questionCount}
              onChangeText={setQuestionCount}
              placeholder="5"
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.buttonDisabled]}
            onPress={generateQuestions}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Generate Questions</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {generatedQuestions.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Generated Questions ({selectedQuestions.size}/{generatedQuestions.length} selected)
              </Text>
              <TouchableOpacity
                style={[styles.saveButton, selectedQuestions.size === 0 && styles.buttonDisabled]}
                onPress={saveToDatabase}
                disabled={selectedQuestions.size === 0}
              >
                <Text style={styles.buttonText}>Save Selected</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.questionsList}>
              {generatedQuestions.map((item, index) => (
                <View key={index}>
                  {renderQuestion({ item, index })}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
    paddingTop: 0,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedCard: {
    borderColor: theme.colors.primary,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  options: {
    marginBottom: 16,
  },
  option: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
    paddingLeft: 8,
  },
  correctOption: {
    fontWeight: '600',
    color: theme.colors.success,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  explanation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sourcesText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
}); 