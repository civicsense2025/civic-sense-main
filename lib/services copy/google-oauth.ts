import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// Complete the auth session for proper mobile integration
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
  };
}

export class GoogleOAuthService {
  private static readonly GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  private static readonly GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  private static readonly GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  /**
   * Get the appropriate client ID for the current platform
   */
  private static getClientId(): string {
    if (Platform.OS === 'ios' && this.GOOGLE_IOS_CLIENT_ID) {
      return this.GOOGLE_IOS_CLIENT_ID;
    }
    if (Platform.OS === 'android' && this.GOOGLE_ANDROID_CLIENT_ID) {
      return this.GOOGLE_ANDROID_CLIENT_ID;
    }
    if (this.GOOGLE_CLIENT_ID) {
      return this.GOOGLE_CLIENT_ID;
    }
    throw new Error('Google Client ID not configured for this platform');
  }

  /**
   * Configure the auth request for Google OAuth
   */
  private static createAuthRequest() {
    const clientId = this.getClientId();
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'civicsense',
      path: 'auth',
    });

    console.log('🔗 Google OAuth redirect URI:', redirectUri);

    return new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      extraParams: {
        access_type: 'offline', // To get refresh token
        prompt: 'consent',      // To ensure we get a refresh token
      },
    });
  }

  /**
   * Sign in with Google using expo-auth-session
   */
  static async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      console.log('🚀 Starting Google OAuth flow...');

      // Create auth request
      const request = this.createAuthRequest();
      
      // Make the request
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      console.log('📱 Google auth result type:', result.type);

      if (result.type === 'success') {
        console.log('✅ Google OAuth successful, exchanging code for tokens...');
        
        // Ensure we have the required code parameter
        if (!result.params?.code) {
          return {
            success: false,
            error: 'No authorization code received from Google'
          };
        }
        
        // Exchange authorization code for tokens
        const tokenResult = await this.exchangeCodeForTokens(
          result.params.code,
          request.redirectUri
        );

        if (tokenResult.success && tokenResult.tokens) {
          // Exchange Google tokens for Supabase session
          const supabaseResult = await this.authenticateWithSupabase(tokenResult.tokens);
          
          if (supabaseResult.success) {
            console.log('✅ Successfully authenticated with Supabase via Google');
            return { success: true };
          } else {
            return {
              success: false,
              error: supabaseResult.error || 'Failed to authenticate with Supabase'
            };
          }
        } else {
          return {
            success: false,
            error: tokenResult.error || 'Failed to exchange code for tokens'
          };
        }
      } else if (result.type === 'cancel') {
        console.log('🚫 Google OAuth cancelled by user');
        return { success: false, cancelled: true };
      } else {
        console.error('❌ Google OAuth failed:', result);
        return {
          success: false,
          error: result.type === 'error' && result.error?.message ? result.error.message : 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private static async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<GoogleAuthResult & { tokens?: any }> {
    try {
      const clientId = this.getClientId();
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokens = await tokenResponse.json();

      if (tokenResponse.ok && tokens.access_token) {
        console.log('✅ Successfully exchanged code for tokens');
        return {
          success: true,
          tokens: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          }
        };
      } else {
        console.error('❌ Token exchange failed:', tokens);
        return {
          success: false,
          error: tokens.error_description || 'Failed to exchange authorization code'
        };
      }
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  /**
   * Authenticate with Supabase using Google tokens
   */
  private static async authenticateWithSupabase(tokens: any): Promise<GoogleAuthResult> {
    try {
      // Use the ID token to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.id_token,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return { 
          success: false, 
          error: error.message || 'Authentication failed' 
        };
      }

      return { 
        success: true
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Get user info from Google using access token
   */
  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to get user info from Google');
      }
    } catch (error) {
      console.error('❌ Error getting Google user info:', error);
      throw error;
    }
  }
} 