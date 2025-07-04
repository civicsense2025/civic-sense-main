import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { ensureSupabaseInitialized } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Simplified profile type
interface DbProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  country: string | null;
  state_province: string | null;
  city: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: DbProfile | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null; cancelled?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<DbProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Prevent multiple initializations and race conditions
  const initializeRef = useRef(false);
  const isMountedRef = useRef(true);

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (initializeRef.current) return; // Prevent multiple initializations
      initializeRef.current = true;

      try {
        console.log('🔐 Initializing improved auth context...');
        const supabase = await ensureSupabaseInitialized();

        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error.message);
        } else if (initialSession?.user) {
          console.log('✅ Initial session found for:', initialSession.user.email);
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            // Load profile asynchronously
            loadUserProfile(initialSession.user.id);
          }
        } else {
          console.log('👤 No initial session found');
        }

        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`🔄 Auth event: ${event}`);
            
            if (!mounted) return;

            if (session?.user) {
              setSession(session);
              setUser(session.user);
              
              if (event === 'SIGNED_IN') {
                console.log('✅ User signed in:', session.user.email);
                loadUserProfile(session.user.id);
              }
            } else {
              console.log('🚪 User signed out or session ended');
              setSession(null);
              setUser(null);
              setProfile(null);
            }
          }
        );

        // Mark as initialized
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Auth initialization timeout');
        setInitialized(true);
        setLoading(false);
      }
    }, 10000);

    initializeAuth().then((cleanup) => {
      if (cleanup) {
        return cleanup;
      }
    });

    return () => {
      mounted = false;
      isMountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('📋 Loading user profile for:', userId);
      const supabase = await ensureSupabaseInitialized();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error.message);
        return;
      }

      if (isMountedRef.current && data) {
        console.log('✅ Profile loaded successfully');
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error);
    }
  }, []);

  // Auth methods
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = await ensureSupabaseInitialized();
      const options = fullName 
        ? { email, password, options: { data: { full_name: fullName } } }
        : { email, password };
      
      const { error } = await supabase.auth.signUp(options);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = await ensureSupabaseInitialized();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const supabase = await ensureSupabaseInitialized();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
        return { error };
      } else {
        // For mobile, use the custom Google OAuth service
        const { GoogleOAuthService } = await import('./services/google-oauth');
        const result = await GoogleOAuthService.signInWithGoogle();
        
        if (result.success) {
          return { error: null };
        } else if (result.cancelled) {
          return { error: null, cancelled: true };
        } else {
          return { 
            error: { 
              message: result.error || 'Google sign-in failed',
              name: 'GoogleOAuthError',
              stack: ''
            } as AuthError 
          };
        }
      }
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = await ensureSupabaseInitialized();
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const supabase = await ensureSupabaseInitialized();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<DbProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const supabase = await ensureSupabaseInitialized();
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await loadUserProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, loadUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }, [user, loadUserProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 