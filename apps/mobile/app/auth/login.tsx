import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, typography, borderRadius } from '../../lib/theme';

// Google logo for sign in button
const GOOGLE_LOGO = 'https://developers.google.com/static/identity/images/g-logo.png';

// Check if in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signIn, signInWithGoogle, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setGoogleLoading(false);

    if (cancelled) {
      // User cancelled the Google sign-in flow
      console.log('Google sign-in was cancelled by the user');
      return;
    }

    if (error) {
      Alert.alert('Google Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const isFormLoading = loading || isLoading;
  const isGoogleLoading = loading || googleLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.primary }]}>
              🏛️ CivicSense
            </Text>
            <Text style={[styles.title, { color: theme.foreground }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
              Sign in to continue your civic education journey
            </Text>
          </View>

          {/* Login Form */}
          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input + '08',
                      borderColor: theme.inputBorder + '20',
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.foregroundSecondary + '80'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isFormLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input + '08',
                      borderColor: theme.inputBorder + '20',
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.foregroundSecondary + '80'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isFormLoading}
                />
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/auth/forgot-password')}
                disabled={isFormLoading}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <Button
                title={isFormLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleSignIn}
                variant="primary"
                size="large"
                style={styles.signInButton}
                disabled={isFormLoading}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.foregroundSecondary }]}>
                  or continue with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              {/* Google Sign In */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color={theme.foreground} />
                ) : (
                  <>
                    <Image source={{ uri: GOOGLE_LOGO }} style={styles.googleLogo} />
                    <Text style={[styles.googleText, { color: theme.foreground }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: theme.foregroundSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity disabled={isFormLoading}>
                <Text style={[styles.signUpLink, { color: theme.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Test Tools (Development Only) */}
          {isDevelopment && (
            <View style={styles.devToolsContainer}>
              <Text style={[styles.devToolsTitle, { color: theme.foregroundSecondary }]}>
                Development Tools
              </Text>
              <Link href="/auth/test-google-auth" asChild>
                <TouchableOpacity 
                  style={[styles.devButton, { backgroundColor: theme.foregroundSecondary + '22' }]}
                  disabled={isFormLoading}
                >
                  <Text style={[styles.devButtonText, { color: theme.foreground }]}>
                    Test Google OAuth
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/auth/debug-auth" asChild>
                <TouchableOpacity 
                  style={[styles.devButton, { backgroundColor: theme.foregroundSecondary + '22' }]}
                  disabled={isFormLoading}
                >
                  <Text style={[styles.devButtonText, { color: theme.foreground }]}>
                    Debug Auth & CSS
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    ...typography['3xl'],
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.sm,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    ...typography.base,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotPasswordText: {
    ...typography.sm,
    fontWeight: '500',
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
  },
  dividerText: {
    ...typography.xs,
    paddingHorizontal: spacing.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    gap: spacing.xs,
  },
  googleLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  googleText: {
    ...typography.sm,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  signUpText: {
    ...typography.sm,
  },
  signUpLink: {
    ...typography.sm,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    ...typography.base,
    fontWeight: '500',
  },
  devToolsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  devToolsTitle: {
    ...typography.sm,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  devButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  devButtonText: {
    ...typography.sm,
    fontWeight: '500',
  },
}); 