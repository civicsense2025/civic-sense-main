import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { LoadingSpinner } from '../molecules/LoadingSpinner';
import { spacing } from '../../lib/theme';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  context?: string;
}

/**
 * Simplified error boundary for async operations that handles loading and error states
 * Use this for wrapping components that manage their own async state
 */
export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
  loadingMessage = 'Loading...',
  context,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text variant="body" color="secondary" style={styles.loadingText}>
          {loadingMessage}
        </Text>
      </View>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <Card style={styles.errorContainer} variant="outlined">
        <View style={styles.errorContent}>
          <Text variant="headline" color="destructive" style={styles.errorTitle}>
            {context ? `${context} Error` : 'Something went wrong'}
          </Text>
          
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {errorMessage || 'An unexpected error occurred'}
          </Text>

          {onRetry && (
            <Button
              title="Try Again"
              onPress={onRetry}
              variant="primary"
              style={styles.retryButton}
            />
          )}
        </View>
      </Card>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    minWidth: 120,
  },
}); 