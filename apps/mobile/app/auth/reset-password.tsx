import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { spacing, borderRadius, typography } from '../../lib/theme';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid session for password reset
    if (user) {
      setIsValidSession(true);
    } else {
      // Redirect back to login if no valid session
      Alert.alert(
        'Invalid Session',
        'Your password reset session has expired. Please request a new password reset.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/forgot-password'),
          },
        ]
      );
    }
  }, [user]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success!',
        'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Password update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.foreground }]}>
            Validating session...
          </Text>
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.foreground }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
              Enter your new password below
            </Text>
          </View>

          {/* Form */}
          <Card style={styles.formCard} variant="elevated">
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  New Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.border,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.foregroundMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.input,
                      borderColor: theme.border,
                      color: theme.foreground,
                    },
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.foregroundMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                <Text style={[styles.updateButtonText, { color: theme.foreground }]}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={[styles.securityText, { color: theme.foregroundMuted }]}>
              🔒 Your password will be encrypted and stored securely
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    fontWeight: '500',
  },
  header: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  title: {
    ...typography.titleLarge,
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
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.callout,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 44,
  },
  updateButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  updateButtonText: {
    ...typography.callout,
    fontWeight: '600',
  },
  securityNote: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  securityText: {
    ...typography.caption1,
    textAlign: 'center',
  },
}); 