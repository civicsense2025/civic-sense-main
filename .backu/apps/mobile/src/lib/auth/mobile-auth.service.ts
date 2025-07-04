// CivicSense Mobile Auth Service
// Mobile-specific authentication implementation

import * as SecureStore from 'expo-secure-store';
import { AuthService, type AuthResult, type Session } from '@civicsense/business-logic/auth';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as LocalAuthentication from 'expo-local-authentication';

export class MobileAuthService extends AuthService {
  // Platform-specific session storage
  async saveSession(session: Session): Promise<void> {
    await SecureStore.setItemAsync('auth-session', JSON.stringify(session));
  }

  async getSession(): Promise<Session | null> {
    const stored = await SecureStore.getItemAsync('auth-session');
    return stored ? JSON.parse(stored) : null;
  }

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync('auth-session');
  }

  // Mobile-specific Google OAuth
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      });

      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { data, error } = await this.supabase.auth.signInWithIdToken({
          provider: 'google',
          token: result.authentication?.idToken || '',
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session) {
          await this.saveSession(data.session);
        }

        return {
          success: true,
          user: data.user,
          session: data.session,
        };
      }

      return {
        success: false,
        error: 'Google sign in was cancelled or failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign in failed',
      };
    }
  }

  // Mobile-specific Apple Sign In (iOS only)
  async signInWithApple(): Promise<AuthResult> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      // On iOS, we'll use the native Apple authentication
      // This will be implemented when we add the expo-apple-authentication package
      throw new Error('Apple Sign In not yet implemented');

    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Apple sign in was cancelled' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Apple sign in failed',
      };
    }
  }

  // Helper method to check if biometric auth is available
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  }

  // Helper method for biometric authentication
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use passcode',
      });
      return result.success;
    } catch {
      return false;
    }
  }
} 