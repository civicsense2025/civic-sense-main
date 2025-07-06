import type { AuthError, Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Types
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
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null; cancelled?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<DbProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  loginWithToken: (credentials: { access_token: string; refresh_token: string }) => Promise<void>;
  onUserIdChange: (userId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Secure storage helpers
const storeAuthState = async (key: string, value: any) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error storing auth state:', error);
  }
};

const getAuthState = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } else {
      const value = await SecureStore.getItemAsync(key);
      return value ? JSON.parse(value) : null;
    }
  } catch (error) {
    console.error('Error retrieving auth state:', error);
    return null;
  }
};

const removeAuthState = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error removing auth state:', error);
  }
};

interface AuthProviderProps {
  children: React.ReactNode;
  onUserIdChange?: (userId: string | null) => void;
}

export function AuthProvider({ children, onUserIdChange = () => {} }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mounted = useRef(true);

  // Single auth initialization using Supabase singleton
  useEffect(() => {
    let authSubscription: any;
    
    console.log('🔐 Initializing authentication...');

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setError('Failed to load session');
          setLoading(false);
          return;
        }

        // Handle initial session
        if (initialSession?.user) {
          console.log('✅ [AUTH] INITIAL_SESSION -', initialSession.user.id.slice(0, 8) + '...');
          setSession(initialSession);
          setUser(initialSession.user);
          onUserIdChange(initialSession.user.id);
          // Fetch profile without dependency loop
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', initialSession.user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error('Profile fetch error:', error);
            } else if (data) {
              setProfile(data);
              await storeAuthState('user_profile', data);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
          }
        } else {
          console.log('ℹ️ [AUTH] NO_INITIAL_SESSION');
        }

        // Set up auth state listener
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 [AUTH]', event, session?.user?.id ? `- ${session.user.id.slice(0, 8)}...` : '');
          
          if (!mounted.current) return;

          setSession(session);
          
          if (session?.user) {
            setUser(session.user);
            onUserIdChange(session.user.id);
            setError(null);
            
            // Fetch profile for new sessions
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              try {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (error && error.code !== 'PGRST116') {
                  console.error('Profile fetch error:', error);
                } else if (data) {
                  setProfile(data);
                  await storeAuthState('user_profile', data);
                }
              } catch (error) {
                console.error('Profile fetch error:', error);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
            onUserIdChange(null);
            await removeAuthState('user_profile');
          }
          
          setLoading(false);
        });

        setLoading(false);
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted.current = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Auth methods
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const signUpOptions = fullName 
        ? { email, password, options: { data: { full_name: fullName } } }
        : { email, password };
      
      const { error } = await supabase.auth.signUp(signUpOptions);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
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
      const { error } = await supabase.auth.signOut();
      if (!error) {
        await removeAuthState('user_profile');
      }
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<DbProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile after update
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Profile fetch error:', fetchError);
        } else if (data) {
          setProfile(data);
          await storeAuthState('user_profile', data);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error);
        } else if (data) {
          setProfile(data);
          await storeAuthState('user_profile', data);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      }
    }
  }, [user]);

  const loginWithToken = useCallback(async (credentials: { access_token: string; refresh_token: string }) => {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with token:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    loginWithToken,
    onUserIdChange,
  }), [
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    loginWithToken,
    onUserIdChange,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 