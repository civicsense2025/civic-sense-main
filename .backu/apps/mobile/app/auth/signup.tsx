import React, { useState, useEffect } from 'react';
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
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, typography, borderRadius } from '../../lib/theme';
import { GuestTokenService } from '../../lib/services/guest-token-service';
import { Ionicons } from '@expo/vector-icons';

// Google logo for sign in button
const GOOGLE_LOGO = 'https://developers.google.com/static/identity/images/g-logo.png';

export default function SignUpScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Progress preservation state
  const [preserveProgress, setPreserveProgress] = useState(false);
  const [guestProgressInfo, setGuestProgressInfo] = useState<any>(null);

  useEffect(() => {
    checkForProgressPreservation();
  }, []);

  const checkForProgressPreservation = async () => {
    if (params.preserveProgress === 'true') {
      setPreserveProgress(true);
      
      try {
        const analytics = await GuestTokenService.getGuestAnalytics();
        setGuestProgressInfo(analytics);
        console.log('📊 Guest analytics loaded for signup:', analytics);
      } catch (error) {
        console.error('❌ Error loading guest analytics:', error);
      }
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName.trim() || undefined);
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Check Your Email',
        'We sent you a confirmation link. Please check your email and click the link to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setGoogleLoading(false);

    if (cancelled) {
      // User cancelled the Google sign-up flow
      console.log('Google sign-up was cancelled by the user');
      return;
    }

    if (error) {
      Alert.alert('Google Sign Up Failed', error.message);
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
              Join thousands learning about democracy and civic engagement
            </Text>
          </View>

          {/* Progress Preservation Banner */}
          {preserveProgress && guestProgressInfo && (
            <Card variant="elevated" style={StyleSheet.flatten([styles.progressBanner, { backgroundColor: theme.primary + '10' }])}>
              <View style={styles.progressBannerContent}>
                <View style={styles.progressIcon}>
                  <Ionicons name="trophy" size={24} color={theme.primary} />
                </View>
                <View style={styles.progressText}>
                  <Text style={[styles.progressTitle, { color: theme.foreground }]}>
                    Save Your Civic Progress
                  </Text>
                  <Text style={[styles.progressDescription, { color: theme.foregroundSecondary }]}>
                    You've been learning for {guestProgressInfo.daysSinceFirstVisit} days with {guestProgressInfo.totalSessions} sessions. 
                    Sign up to save your civic learning journey forever!
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Sign Up Form */}
          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.form}>
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Full Name <Text style={[styles.optional, { color: theme.foregroundSecondary }]}>(optional)</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.inputBorder,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.foregroundSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isFormLoading}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Email Address <Text style={[styles.required, { color: theme.error }]}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.inputBorder,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.foregroundSecondary}
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
                  Password <Text style={[styles.required, { color: theme.error }]}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.inputBorder,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor={theme.foregroundSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isFormLoading}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Confirm Password <Text style={[styles.required, { color: theme.error }]}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.inputBorder,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.foregroundSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isFormLoading}
                />
              </View>

              {/* Terms and Privacy */}
              <Text style={[styles.termsText, { color: theme.foregroundSecondary }]}>
                By creating an account, you agree to our{' '}
                <Text style={[styles.termsLink, { color: theme.primary }]}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.termsLink, { color: theme.primary }]}>
                  Privacy Policy
                </Text>
              </Text>

              {/* Sign Up Button */}
              <Button
                title={isFormLoading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSignUp}
                variant="primary"
                size="large"
                style={styles.signUpButton}
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

              {/* Google Sign Up */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleGoogleSignUp}
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

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: theme.foregroundSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity disabled={isFormLoading}>
                <Text style={[styles.signInLink, { color: theme.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    ...typography.titleLarge,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    fontWeight: '500',
  },
  required: {
    fontWeight: 'bold',
  },
  optional: {
    ...typography.caption,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.body,
  },
  termsText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    ...typography.caption,
    fontWeight: '500',
  },
  signUpButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  googleLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  googleText: {
    ...typography.body,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  signInText: {
    ...typography.body,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Progress preservation banner styles
  progressBanner: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  progressBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  progressIcon: {
    marginRight: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 