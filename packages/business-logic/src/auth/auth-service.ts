// CivicSense Abstract Auth Service
// Shared authentication business logic with platform-specific implementations

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

export abstract class AuthService {
  protected supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Shared business logic
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      await this.clearSession();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  async getCurrentUser(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  }

  // Platform-specific implementations required
  abstract saveSession(session: Session): Promise<void>;
  abstract getSession(): Promise<Session | null>;
  abstract clearSession(): Promise<void>;
  abstract signInWithGoogle(): Promise<AuthResult>;
  abstract signInWithApple?(): Promise<AuthResult>; // Optional for web
} 