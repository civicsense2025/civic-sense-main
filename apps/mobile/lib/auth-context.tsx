import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { ensureSupabaseInitialized } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authCacheHelpers } from './optimized-auth-cache';

// Use a simple profile type since we're having database type issues
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

// Buffer shim for URL parsing (required for React Native)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
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
  // Add callback for when user ID changes so ThemeProvider can react
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

// Helper function to safely store auth state
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

// Helper function to safely retrieve auth state
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

// Helper function to safely remove auth state
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
  children: ReactNode;
  onUserIdChange?: (userId: string | null) => void;
}

export function AuthProvider({ children, onUserIdChange = () => {} }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent memory leaks and race conditions
  const isMountedRef = useRef(true);
  const profileFetchRef = useRef<Promise<void> | null>(null);
  const authListenerRef = useRef<any>(null);
  const initializingRef = useRef(false);

  // Notify parent components when user ID changes
  const notifyUserIdChange = useCallback((userId: string | null) => {
    if (onUserIdChange) {
      onUserIdChange(userId);
    }
  }, [onUserIdChange]);

  // Memoized profile fetcher with deduplication
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    
    // Deduplicate concurrent profile fetches
    if (profileFetchRef.current) {
      return profileFetchRef.current;
    }

    profileFetchRef.current = (async () => {
      try {
        console.log('📋 Fetching user profile for:', userId);
        const supabase = await ensureSupabaseInitialized();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          return;
        }

        if (isMountedRef.current) {
          console.log('✅ Profile loaded successfully');
          setProfile(data);
          await storeAuthState('user_profile', data);
        }
      } catch (error) {
        console.error('❌ Error in fetchProfile:', error);
      } finally {
        profileFetchRef.current = null;
      }
    })();

    return profileFetchRef.current;
  }, []);

  // Optimized initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session first
        const supabase = await ensureSupabaseInitialized();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setError('Failed to load session');
            setUser(null);
            notifyUserIdChange(null);
            setLoading(false);
          }
          return;
        }

        if (sessionData?.session?.user) {
          // User is logged in, get their profile
          const { data: userData, error: userError } = await supabase.auth.getUser();
         
         if (userError) {
           console.error('User fetch error:', userError);
           if (mounted) {
             setError('Failed to load user data');
             setUser(null);
             notifyUserIdChange(null);
             setLoading(false);
           }
           return;
         }

         if (userData?.user && mounted) {
           setUser(userData.user);
           notifyUserIdChange(userData.user.id);
           setError(null);
         }
       } else if (mounted) {
         // No session
         setUser(null);
         notifyUserIdChange(null);
       }

       if (mounted) {
         setLoading(false);
       }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError('Authentication failed');
          setUser(null);
          notifyUserIdChange(null);
          setLoading(false);
        }
      }
    };

    const setupAuth = async () => {
      await initializeAuth();

      // Listen for auth changes
      const supabaseInstance = await ensureSupabaseInitialized();
      const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange(
        async (event: string, session: any) => {
          // Use centralized debug logging instead of direct console.log
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AUTH] ${event}${session?.user?.id ? ` - ${session.user.id}` : ''}`);
          }
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              notifyUserIdChange(session.user.id);
              setError(null);
            } else {
              setUser(null);
              notifyUserIdChange(null);
            }
            setLoading(false);
          }
        }
      );

      return subscription;
    };

    let subscription: any;
    setupAuth().then((sub) => {
      subscription = sub;
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [notifyUserIdChange]);

  // Memoized auth methods
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = await ensureSupabaseInitialized();
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
        // For web, use the standard OAuth flow
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
      if (!error) {
        // Clear auth cache and stored profile
        authCacheHelpers.invalidate();
        await removeAuthState('user_profile');
      }
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

      await fetchUserProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const loginWithToken = useCallback(async (credentials: { access_token: string; refresh_token: string }) => {
    try {
      const supabase = await ensureSupabaseInitialized();
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

  // Memoize the context value to prevent unnecessary re-renders
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