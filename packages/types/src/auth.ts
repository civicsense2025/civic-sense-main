// Auth state types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}



export interface UserMetadata {
  createdAt: string;
  lastLoginAt: string;
}

// Auth providers
export type AuthProvider = 
  | 'email'
  | 'google'
  | 'apple'
  | 'facebook'
  | 'anonymous';

// Auth methods
export interface AuthMethods {
  signIn: (provider: AuthProvider, credentials?: any) => Promise<void>;
  signOut: () => Promise<void>;
  linkProvider: (provider: AuthProvider) => Promise<void>;
}

// Guest access
export interface GuestSession {
  id: string;
  token: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface GuestUser {
  id: string
  isGuest: true
  token: string
  createdAt: Date
}

export interface AuthUser {
  id: string
  email: string
  isGuest: false
  role?: string
  metadata?: Record<string, any>
}

export type User = GuestUser | AuthUser

export interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
} 