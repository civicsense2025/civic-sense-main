import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { Button } from '../Button';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface DataErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  context?: string; // e.g., "Quiz Data", "User Progress", etc.
  showDetails?: boolean;
}

/**
 * Error Boundary specifically designed for data fetching components
 * Provides retry functionality and context-aware error messages
 */
export class DataErrorBoundary extends Component<DataErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context } = this.props;
    
    // Log error with context
    console.error(`[DataErrorBoundary${context ? ` - ${context}` : ''}] Error caught:`, error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Report to crash analytics in production
    if (!__DEV__) {
      this.reportErrorToCrashService(error, errorInfo, context);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportErrorToCrashService = (error: Error, errorInfo: ErrorInfo, context?: string) => {
    try {
      // Prepare error data for crash reporting
      const crashData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: context || 'Unknown',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
        // Add any additional app context
        errorBoundary: 'DataErrorBoundary',
        errorType: 'React Component Error',
      };

      // In a real implementation, you would integrate with:
      // - Sentry: Sentry.captureException(error, { extra: crashData });
      // - Bugsnag: Bugsnag.notify(error, event => { event.addMetadata('context', crashData); });
      // - Firebase Crashlytics: crashlytics().recordError(error);
      
      // For now, log to console in a structured way that external services can pick up
      console.error('[CRASH_REPORT]', JSON.stringify(crashData, null, 2));
      
      // You could also send to your own analytics endpoint
      // this.sendToAnalyticsEndpoint(crashData);
      
    } catch (reportError) {
      // Fail silently - don't let crash reporting crash the app
      console.error('Failed to report crash:', reportError);
    }
  };

  private sendToAnalyticsEndpoint = async (crashData: any) => {
    try {
      // Example implementation for custom analytics endpoint
      await fetch('/api/crash-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crashData),
      });
    } catch (error) {
      // Fail silently
      console.debug('Failed to send crash report to analytics endpoint:', error);
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached for ${this.props.context || 'component'}`);
      return;
    }

    console.log(`Retrying ${this.props.context || 'component'} (attempt ${retryCount + 1}/${maxRetries})`);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  getErrorMessage = (): string => {
    const { error } = this.state;
    const { context } = this.props;

    if (!error) return 'An unknown error occurred';

    // Network-related errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to load')) {
      return `Unable to load ${context || 'data'}. Please check your internet connection.`;
    }

    // Database/API errors
    if (error.message.includes('supabase') || error.message.includes('database') || error.message.includes('API')) {
      return `There was a problem connecting to our servers. Please try again.`;
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return `Loading ${context || 'data'} is taking longer than expected. Please try again.`;
    }

    // Permission/Auth errors
    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return 'You may need to log in again to access this content.';
    }

    // Default user-friendly message
    return `Unable to load ${context || 'content'}. Please try again.`;
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, context, showDetails = false } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI - using functional component wrapper for theme access
      return (
        <ErrorDisplay
          error={error}
          context={context || undefined}
          showDetails={showDetails}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          getErrorMessage={this.getErrorMessage}
        />
      );
    }

    return children;
  }
}

// Functional component for theme-aware error display
interface ErrorDisplayProps {
  error: Error | null;
  context: string | undefined;
  showDetails: boolean;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
  getErrorMessage: () => string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  context,
  showDetails,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  getErrorMessage,
}) => {
  // Use hardcoded theme to avoid dependency on theme provider
  // This ensures the error boundary works even if theme provider fails
  const theme = {
    background: '#FFFFFF',
    foreground: '#000000',
    card: '#F8F9FA',
    destructive: '#EF4444',
    muted: '#F3F4F6',
    border: '#E5E7EB',
    foregroundSecondary: '#6B7280',
  };

  const styles = StyleSheet.create({
    errorContainer: {
      margin: spacing.lg,
      padding: spacing.lg,
      borderColor: theme.destructive,
      backgroundColor: theme.destructive + '10', // 10% opacity
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
    errorDetails: {
      width: '100%',
      backgroundColor: theme.muted,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    errorDetailsTitle: {
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    errorDetailsText: {
      fontFamily: fontFamily.mono,
      fontSize: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    retryButton: {
      minWidth: 120,
    },
    resetButton: {
      minWidth: 120,
    },
    maxRetriesText: {
      textAlign: 'center',
      fontStyle: 'italic',
      opacity: 0.7,
    },
  });

  return (
    <Card style={styles.errorContainer} variant="outlined">
      <View style={styles.errorContent}>
        <Text variant="title3" style={[styles.errorTitle, { color: theme.destructive }]}>
          {context ? `${context} Error` : 'Something went wrong'}
        </Text>
        
        <Text variant="body" style={[styles.errorMessage, { color: theme.foregroundSecondary }]}>
          {getErrorMessage()}
        </Text>

        {showDetails && error && (
          <View style={styles.errorDetails}>
            <Text variant="caption" style={[styles.errorDetailsTitle, { color: theme.foregroundSecondary }]}>
              Technical Details:
            </Text>
            <Text variant="caption" style={[styles.errorDetailsText, { color: theme.foregroundSecondary }]}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {retryCount < maxRetries ? (
            <Button
              title={`Try Again${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`}
              onPress={onRetry}
              variant="primary"
              style={styles.retryButton}
            />
          ) : (
            <Button
              title="Reset"
              onPress={onReset}
              variant="outline"
              style={styles.resetButton}
            />
          )}
        </View>

        {retryCount >= maxRetries && (
          <Text variant="caption" style={[styles.maxRetriesText, { color: theme.foregroundSecondary }]}>
            If this problem persists, please restart the app or check your internet connection.
          </Text>
        )}
      </View>
    </Card>
  );
};

// Remove old styles since they're now in the functional component
// const styles = StyleSheet.create({
//   ... removed old styles
// }); 