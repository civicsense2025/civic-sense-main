import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import type { JSX } from 'react';
import type { AuthService, AuthResult, Session } from './auth-service';
import type { UserPermissions } from './permission-checker';
import { PermissionChecker } from './permission-checker';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  session: Session | null;
  loading: boolean;
  permissions: UserPermissions;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  authService: AuthService;
}

export function AuthProvider({ children, authService }: AuthProviderProps): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(new PermissionChecker().getUserPermissions('guest'));

  const checkAuth = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Get current session
        const currentSession = await authService.getSession();
        if (currentSession) {
          setSession(currentSession);
          // Update permissions based on user role
          const permChecker = new PermissionChecker();
          setPermissions(permChecker.getUserPermissions(result.user.role || 'user'));
        }
      } else {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setPermissions(new PermissionChecker().getUserPermissions('guest'));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setPermissions(new PermissionChecker().getUserPermissions('guest'));
    } finally {
      setLoading(false);
    }
  }, [authService]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if (result.success) {
      await checkAuth();
    }
    return result;
  };

  const signOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setPermissions(new PermissionChecker().getUserPermissions('guest'));
    }
    return result;
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  const value = {
    isAuthenticated,
    user,
    session,
    loading,
    permissions,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 