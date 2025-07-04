import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/Button';
import { spacing, typography, borderRadius } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { resetPassword, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      Alert.alert('Reset Failed', error.message);
    } else {
      setEmailSent(true);
    }
  };

  const isFormLoading = loading || isLoading;

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successContainer}>
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={[styles.successIcon, { backgroundColor: theme.successLight }]}>
              <Text style={styles.successEmoji}>✉️</Text>
            </View>
            <Text style={[styles.successTitle, { color: theme.foreground }]}>
              Check Your Email
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.foregroundSecondary }]}>
              We sent a password reset link to
            </Text>
            <Text style={[styles.emailText, { color: theme.primary }]}>
              {email}
            </Text>
          </View>

          {/* Instructions */}
          <Card variant="outlined" style={styles.instructionsCard}>
            <Text style={[styles.instructionsTitle, { color: theme.foreground }]}>
              What's next?
            </Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={[styles.instructionText, { color: theme.foregroundSecondary }]}>
                  Check your email inbox (and spam folder)
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={[styles.instructionText, { color: theme.foregroundSecondary }]}>
                  Click the "Reset Password" link in the email
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={[styles.instructionText, { color: theme.foregroundSecondary }]}>
                  Create a new password and sign in
                </Text>
              </View>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.successActions}>
            <Button
              title="Resend Email"
              onPress={() => {
                setEmailSent(false);
                handleResetPassword();
              }}
              variant="outline"
              size="large"
              style={styles.resendButton}
            />
            
            <Button
              title="Back to Sign In"
              onPress={() => router.replace('/auth/login')}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isFormLoading}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>
                ← Back
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: theme.foreground }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Reset Form */}
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
                      backgroundColor: theme.input,
                      borderColor: theme.inputBorder,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter your email address"
                  placeholderTextColor={theme.foregroundSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  editable={!isFormLoading}
                />
              </View>

              {/* Reset Button */}
              <Button
                title={isFormLoading ? 'Sending...' : 'Send Reset Link'}
                onPress={handleResetPassword}
                variant="primary"
                size="large"
                style={styles.resetButton}
                disabled={isFormLoading}
              />

              {/* Help Text */}
              <Text style={[styles.helpText, { color: theme.foregroundSecondary }]}>
                Remember your password?{' '}
                <TouchableOpacity
                  onPress={() => router.replace('/auth/login')}
                  disabled={isFormLoading}
                >
                  <Text style={[styles.helpLink, { color: theme.primary }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Text>
            </View>
          </Card>

          {/* Security Note */}
          <Card variant="outlined" style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={[styles.securityTitle, { color: theme.foreground }]}>
                Security Note
              </Text>
            </View>
            <Text style={[styles.securityText, { color: theme.foregroundSecondary }]}>
              For your security, password reset links expire after 1 hour. 
              If you don't see the email, check your spam folder or try again.
            </Text>
          </Card>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    ...typography.body,
    fontWeight: '500',
  },
  title: {
    ...typography.title1,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
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
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...typography.body,
  },
  resetButton: {
    marginTop: spacing.md,
  },
  helpText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpLink: {
    fontWeight: '500',
  },
  securityCard: {
    marginBottom: spacing.xl,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  securityTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  securityText: {
    ...typography.caption,
    lineHeight: 20,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successEmoji: {
    fontSize: 32,
  },
  successTitle: {
    ...typography.title1,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailText: {
    ...typography.body,
    fontWeight: '600',
  },
  instructionsCard: {
    marginBottom: spacing['3xl'],
  },
  instructionsTitle: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  instructionsList: {
    gap: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.md,
    fontSize: 14,
  },
  instructionText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  successActions: {
    gap: spacing.md,
  },
  resendButton: {
    marginBottom: spacing.sm,
  },
}); 