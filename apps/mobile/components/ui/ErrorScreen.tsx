import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius } from '../../lib/theme';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorScreenProps {
  /** Error type for customized messaging */
  errorType?: 'network' | 'notFound' | 'database' | 'permission' | 'generic';
  /** Custom error message (optional) */
  message?: string;
  /** Custom title (optional) */
  title?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Show back button */
  showBackButton?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Show bottom navigation fallback */
  showBottomNavFallback?: boolean;
  /** Additional context for debugging (only in dev) */
  debugInfo?: any;
}

interface ErrorConfig {
  emoji: string;
  title: string;
  message: string;
  actions: {
    retry?: boolean;
    back?: boolean;
    home?: boolean;
  };
}

// ============================================================================
// ERROR CONFIGURATIONS
// ============================================================================

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  network: {
    emoji: '📡',
    title: "Can't Connect Right Now",
    message: "We're having trouble connecting to our servers. Check your internet connection and try again.",
    actions: { retry: true, back: true }
  },
  notFound: {
    emoji: '🔍',
    title: "Content Not Found",
    message: "The content you're looking for isn't available right now. It might have been moved or removed.",
    actions: { back: true, home: true }
  },
  database: {
    emoji: '🔧',
    title: "Something Went Wrong",
    message: "We're experiencing technical difficulties. Our team has been notified and is working on a fix.",
    actions: { retry: true, back: true, home: true }
  },
  permission: {
    emoji: '🔒',
    title: "Access Restricted",
    message: "You don't have permission to view this content. Sign in or check your account status.",
    actions: { back: true, home: true }
  },
  generic: {
    emoji: '⚠️',
    title: "Oops! Something Happened",
    message: "We encountered an unexpected problem. Don't worry – your progress is saved. Try again in a moment.",
    actions: { retry: true, back: true }
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  errorType = 'generic',
  message,
  title,
  showRetry = true,
  onRetry,
  showBackButton = true,
  onBack,
  showBottomNavFallback = true,
  debugInfo
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  // Get error configuration - ensure it exists
  const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.generic;
  
  // Use custom message/title if provided
  const displayTitle = title || config?.title || 'Error';
  const displayMessage = message || config?.message || 'Something went wrong';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - refresh the current route
      router.replace('/(tabs)/' as any);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/');
    }
  };

  const handleGoHome = () => {
    router.push('/(tabs)/');
  };

  const handleGoToQuiz = () => {
    router.push('/(tabs)/quiz');
  };

  const handleGoToDiscover = () => {
    router.push('/(tabs)/discover');
  };

  // ============================================================================
  // STYLES
  // ============================================================================

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    errorCard: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      padding: spacing.xl,
      marginBottom: spacing.lg,
    },
    emoji: {
      fontSize: 64,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.foreground,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    message: {
      fontSize: 16,
      color: theme.foregroundSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    actionsContainer: {
      width: '100%',
      gap: spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    primaryButtonText: {
      color: theme.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryButtonText: {
      color: theme.foreground,
      fontSize: 16,
      fontWeight: '500',
    },
    navigationCard: {
      width: '100%',
      maxWidth: 400,
      padding: spacing.lg,
    },
    navigationTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.foreground,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    navigationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    navigationButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      minWidth: 80,
    },
    navigationButtonText: {
      color: theme.foreground,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 4,
    },
    debugCard: {
      width: '100%',
      maxWidth: 400,
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: theme.muted,
    },
    debugTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.foregroundSecondary,
      marginBottom: spacing.sm,
    },
    debugText: {
      fontSize: 10,
      color: theme.foregroundSecondary,
      fontFamily: 'monospace',
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Error Card */}
        <Card style={styles.errorCard} variant="outlined">
          <Text style={styles.emoji}>{config?.emoji || '⚠️'}</Text>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.message}>{displayMessage}</Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {showRetry && config?.actions.retry && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={theme.foreground} />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {showBackButton && config?.actions.back && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color={theme.foreground} />
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            )}

            {config?.actions.home && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoHome}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={18} color={theme.foreground} />
                <Text style={styles.secondaryButtonText}>Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Navigation Fallback */}
        {showBottomNavFallback && (
          <Card style={styles.navigationCard} variant="outlined">
            <Text style={styles.navigationTitle}>🧭 Where would you like to go?</Text>
            <View style={styles.navigationGrid}>
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleGoHome}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={24} color={theme.primary} />
                <Text style={styles.navigationButtonText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleGoToQuiz}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle" size={24} color={theme.primary} />
                <Text style={styles.navigationButtonText}>Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={handleGoToDiscover}
                activeOpacity={0.8}
              >
                <Ionicons name="compass" size={24} color={theme.primary} />
                <Text style={styles.navigationButtonText}>Discover</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Debug Info (Development Only) */}
        {__DEV__ && debugInfo && (
          <Card style={styles.debugCard} variant="outlined">
            <Text style={styles.debugTitle}>Debug Information</Text>
            <Text style={styles.debugText}>
              {typeof debugInfo === 'string' ? debugInfo : JSON.stringify(debugInfo, null, 2)}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const NetworkErrorScreen: React.FC<Omit<ErrorScreenProps, 'errorType'>> = (props) => (
  <ErrorScreen {...props} errorType="network" />
);

export const NotFoundErrorScreen: React.FC<Omit<ErrorScreenProps, 'errorType'>> = (props) => (
  <ErrorScreen {...props} errorType="notFound" />
);

export const DatabaseErrorScreen: React.FC<Omit<ErrorScreenProps, 'errorType'>> = (props) => (
  <ErrorScreen {...props} errorType="database" />
);

export const PermissionErrorScreen: React.FC<Omit<ErrorScreenProps, 'errorType'>> = (props) => (
  <ErrorScreen {...props} errorType="permission" />
); 