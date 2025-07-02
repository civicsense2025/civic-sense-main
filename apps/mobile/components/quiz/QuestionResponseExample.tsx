import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { 
  QuestionResponseService, 
  useQuestionResponse, 
  type QuestionResponseData 
} from '../../lib/services/question-response-service';

// ============================================================================
// EXAMPLE USAGE COMPONENT
// ============================================================================

interface ExampleQuestionProps {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  assessmentType?: 'quiz' | 'practice' | 'civics_test' | 'daily_challenge';
  collectionId?: string;
  topicId?: string;
}

export const QuestionResponseExample: React.FC<ExampleQuestionProps> = ({
  questionId,
  questionText,
  options,
  correctAnswerIndex,
  assessmentType = 'quiz',
  collectionId,
  topicId
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { recordResponse } = useQuestionResponse();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnswerSelect = (answer: string, index: number) => {
    if (selectedAnswer) return; // Already answered
    
    setSelectedAnswer(answer);
    handleSubmitAnswer(answer, index);
  };

  const handleSubmitAnswer = async (answer: string, answerIndex: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save your progress');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const responseTimeMs = Date.now() - startTime;
      const isCorrect = answerIndex === correctAnswerIndex;
      
      // Prepare response data with all tracking information
      const responseData: QuestionResponseData = {
        questionId,
        selectedAnswer: answer,
        isCorrect,
        responseTimeMs,
        assessmentType,
        collectionId,
        topicId,
        confidenceLevel: 4, // Could come from UI slider
        wasReview: false, // Could be determined by context
        
        // Optional feedback (could be collected via modal)
        feedback: {
          clarityRating: 5,
          feedbackType: 'excellent',
          feedbackText: 'Great question about civic knowledge!'
        }
      };

      console.log('📝 Submitting question response:', responseData);
      
      // Record the response using our service
      const result = await recordResponse(user.id, responseData);
      
      setResult(result);
      
      if (result.success) {
        Alert.alert(
          isCorrect ? '✅ Correct!' : '❌ Incorrect',
          `${isCorrect ? 'Well done!' : 'Keep learning!'}\n\n` +
          `Response time: ${(responseTimeMs / 1000).toFixed(1)}s\n` +
          `Mastery level: ${result.masteryLevel}%\n` +
          `Next review: ${result.nextReviewDate?.toLocaleDateString() || 'N/A'}`,
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save response');
      }
      
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      Alert.alert('Error', 'Failed to save your response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.questionText, { color: theme.foreground }]}>
        {questionText}
      </Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = index === correctAnswerIndex;
          const showResult = selectedAnswer !== null;
          
                     let buttonStyle = [styles.optionButton, { borderColor: theme.border }] as any;
           let textStyle = [styles.optionText, { color: theme.foreground }] as any;
           
           if (showResult) {
             if (isSelected && isCorrect) {
               buttonStyle = [...buttonStyle, styles.correctAnswer];
               textStyle = [...textStyle, styles.correctText];
             } else if (isSelected && !isCorrect) {
               buttonStyle = [...buttonStyle, styles.incorrectAnswer];
               textStyle = [...textStyle, styles.incorrectText];
             } else if (!isSelected && isCorrect) {
               buttonStyle = [...buttonStyle, styles.correctAnswer];
               textStyle = [...textStyle, styles.correctText];
             }
           }
          
          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleAnswerSelect(option, index)}
              disabled={selectedAnswer !== null || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrect && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {showResult && isSelected && !isCorrect && (
                <Text style={styles.crossmark}>✗</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {isSubmitting && (
        <Text style={[styles.statusText, { color: theme.foregroundSecondary }]}>
          Saving your response...
        </Text>
      )}
      
      {result && (
        <View style={[styles.resultContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.resultTitle, { color: theme.foreground }]}>
            Response Recorded!
          </Text>
          <Text style={[styles.resultText, { color: theme.foregroundSecondary }]}>
            • Mastery Level: {result.masteryLevel}%
          </Text>
          <Text style={[styles.resultText, { color: theme.foregroundSecondary }]}>
            • Next Review: {result.nextReviewDate?.toLocaleDateString() || 'N/A'}
          </Text>
          {result.shouldShowFeedback && (
            <Text style={[styles.celebrationText, { color: theme.primary }]}>
              🎉 Excellent mastery! You're becoming harder to manipulate!
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================================================
// USAGE WITH CLASS COMPONENT (Alternative)
// ============================================================================

export class QuestionResponseClassExample extends React.Component<ExampleQuestionProps> {
  state = {
    selectedAnswer: null as string | null,
    startTime: Date.now(),
    isSubmitting: false,
    result: null as any
  };

  handleSubmitAnswer = async (answer: string, answerIndex: number, userId: string) => {
    this.setState({ isSubmitting: true });
    
    try {
      const responseTimeMs = Date.now() - this.state.startTime;
      const isCorrect = answerIndex === this.props.correctAnswerIndex;
      
      const responseData: QuestionResponseData = {
        questionId: this.props.questionId,
        selectedAnswer: answer,
        isCorrect,
        responseTimeMs,
        assessmentType: this.props.assessmentType || 'quiz',
        collectionId: this.props.collectionId,
        topicId: this.props.topicId,
        confidenceLevel: 3,
        wasReview: false
      };

      // Direct service call (not using hook)
      const result = await QuestionResponseService.recordQuestionResponse(userId, responseData);
      
      this.setState({ result });
      
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  render() {
    // Implementation similar to functional component...
    return (
      <View>
        <Text>Class component implementation...</Text>
      </View>
    );
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  correctAnswer: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  incorrectAnswer: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  correctText: {
    color: '#059669',
    fontWeight: '600',
  },
  incorrectText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  checkmark: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold',
  },
  crossmark: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default QuestionResponseExample; 