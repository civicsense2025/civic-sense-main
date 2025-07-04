import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { spacing } from '../../lib/theme';

interface QuizErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface QuizErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackToHome?: boolean;
}

/**
 * Specialized error boundary for quiz-related components
 * Provides quiz-specific error handling and recovery options
 */
export class QuizErrorBoundary extends Component<QuizErrorBoundaryProps, QuizErrorBoundaryState> {
  constructor(props: QuizErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<QuizErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    console.error('[QuizErrorBoundary] Quiz error caught:', error);
    console.error('Quiz error details:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Log quiz-specific error details
    this.logQuizError(error, errorInfo);
  }

  logQuizError = (error: Error, errorInfo: ErrorInfo) => {
    // Extract quiz-specific context from error stack
    const isQuizDataError = error.stack?.includes('quiz') || error.stack?.includes('question');
    const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
    const isDatabaseError = error.message.includes('supabase') || error.message.includes('database');

    console.log('[QuizErrorBoundary] Error Classification:', {
      isQuizDataError,
      isNetworkError,
      isDatabaseError,
      errorType: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // This needs to be handled differently since class components can't use hooks
    Alert.alert(
      'Return to Home',
      'Would you like to return to the home screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Home', onPress: () => {
          // Reload the app by setting a flag that parent components can watch
          this.setState({ hasError: false });
          // Parent component should handle navigation
        }}
      ]
    );
  };

  getQuizErrorMessage = (): string => {
    const { error } = this.state;
    
    if (!error) return 'An unknown quiz error occurred';

    // Quiz data loading errors
    if (error.message.includes('quiz') || error.message.includes('question')) {
      return 'There was a problem loading the quiz questions. This might be a temporary issue.';
    }

    // Session errors
    if (error.message.includes('session')) {
      return 'Your quiz session encountered an issue. Your progress may not have been saved.';
    }

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to the quiz service. Please check your internet connection.';
    }

    // Database errors
    if (error.message.includes('supabase') || error.message.includes('database')) {
      return 'There was a problem connecting to our quiz database. Please try again.';
    }

    return 'The quiz encountered an unexpected error. Please try again.';
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallbackToHome = true } = this.props;

    if (hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.errorContainer} variant="outlined">
              <View style={styles.errorContent}>
                <Text variant="title2" color="destructive" style={styles.errorTitle}>
                  Quiz Error
                </Text>
                
                <Text variant="body" color="secondary" style={styles.errorMessage}>
                  {this.getQuizErrorMessage()}
                </Text>

                <View style={styles.actionButtons}>
                  <Button
                    title="Try Again"
                    onPress={this.handleRetry}
                    variant="primary"
                    style={styles.actionButton}
                  />
                  
                  {fallbackToHome && (
                    <Button
                      title="Go Home"
                      onPress={this.handleGoHome}
                      variant="outline"
                      style={styles.actionButton}
                    />
                  )}
                </View>

                <Text variant="caption" color="secondary" style={styles.helpText}>
                  If this problem persists, please restart the app or contact support.
                </Text>
              </View>
            </Card>
          </View>
        </SafeAreaView>
      );
    }

    return children;
  }
}

// Higher-order component version for easier use with functional components
export const withQuizErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<QuizErrorBoundaryProps, 'children'>
) => {
  return (props: P) => (
    <QuizErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </QuizErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    padding: spacing.xl,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    minWidth: 100,
    flex: 1,
  },
  helpText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
}); 