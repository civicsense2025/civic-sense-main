import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { spacing, typography, borderRadius } from '../../lib/theme';
import { Card } from '../../components/ui/Card';

export default function TestGoogleAuthScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signInWithGoogle, user, profile, loading } = useAuth();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
    details?: any;
  } | null>(null);

  const handleGoogleSignIn = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const { error, cancelled } = await signInWithGoogle();
      
      if (cancelled) {
        setTestResult({
          success: false,
          message: 'Sign in was cancelled by the user',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (error) {
        setTestResult({
          success: false,
          message: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          details: error,
        });
      } else {
        setTestResult({
          success: true,
          message: 'Google sign in successful!',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Exception: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: err,
      });
    } finally {
      setTestLoading(false);
    }
  };

  const renderProfile = () => {
    if (!profile) return null;
    return (
      <View>
        <Text>Profile:</Text>
        <Text>ID: {profile.id}</Text>
        <Text>Name: {profile.full_name || 'Not set'}</Text>
        <Text>Email: {profile.email || 'Not set'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>
            Google OAuth Test
          </Text>
          <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
            Test your Google OAuth configuration
          </Text>
        </View>

        {/* Test Controls */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.foreground }]}>
              Test Google Sign In
            </Text>
            <Text style={[styles.cardDescription, { color: theme.foregroundSecondary }]}>
              Press the button below to test Google Sign In. This will attempt to authenticate with Google using your current configuration.
            </Text>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleGoogleSignIn}
              disabled={testLoading || loading}
            >
              {testLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Test Google Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Current Auth State */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.foreground }]}>
              Current Auth State
            </Text>
            <Text style={[styles.label, { color: theme.foreground }]}>
              Signed In: <Text style={{ fontWeight: 'normal' }}>{user ? 'Yes' : 'No'}</Text>
            </Text>
            {user && (
              <>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  User ID: <Text style={{ fontWeight: 'normal' }}>{user.id}</Text>
                </Text>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Email: <Text style={{ fontWeight: 'normal' }}>{user.email}</Text>
                </Text>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Auth Provider: <Text style={{ fontWeight: 'normal' }}>{user.app_metadata?.provider || 'N/A'}</Text>
                </Text>
              </>
            )}
            {renderProfile()}
          </View>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card 
            variant="elevated" 
            style={{
              ...styles.card,
              ...(testResult.success 
                ? { borderColor: theme.success, borderWidth: 1 } 
                : { borderColor: theme.error, borderWidth: 1 })
            }}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: testResult.success ? theme.success : theme.error }]}>
                {testResult.success ? 'Success' : 'Error'}
              </Text>
              <Text style={[styles.message, { color: theme.foreground }]}>
                {testResult.message}
              </Text>
              <Text style={[styles.timestamp, { color: theme.foregroundSecondary }]}>
                {new Date(testResult.timestamp).toLocaleString()}
              </Text>
              {testResult.details && (
                <View style={styles.detailsContainer}>
                  <Text style={[styles.detailsTitle, { color: theme.foreground }]}>Details:</Text>
                  <Text style={[styles.details, { color: theme.foregroundSecondary }]}>
                    {JSON.stringify(testResult.details, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Navigation */}
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.foreground }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.titleLarge,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.title2,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  cardDescription: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    height: 50,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  timestamp: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.md,
  },
  detailsTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  details: {
    ...typography.body,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...typography.body,
    fontWeight: '500',
  },
}); 