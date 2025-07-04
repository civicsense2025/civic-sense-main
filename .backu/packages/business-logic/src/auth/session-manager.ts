// CivicSense Session Manager
// Cross-platform session management

export interface UserSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userRole: 'user' | 'admin' | 'moderator';
}

export class SessionManager {
  async validateSession(session: UserSession): Promise<boolean> {
    if (!session.accessToken || !session.userId) {
      return false;
    }

    // Check if session has expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      return false;
    }

    return true;
  }

  async refreshSession(refreshToken: string): Promise<UserSession | null> {
    // Business logic for refreshing session
    // Platform-specific implementations will handle the actual refresh
    console.log('Refreshing session with token:', refreshToken);
    return null;
  }

  async getSessionData(userId: string): Promise<any> {
    // Get additional session data like user role, permissions, etc.
    return {
      userId,
      role: 'user',
      permissions: ['read', 'quiz'],
    };
  }

  isSessionExpired(session: UserSession): boolean {
    return session.expiresAt ? new Date() > session.expiresAt : false;
  }

  shouldRefreshSession(session: UserSession): boolean {
    if (!session.expiresAt) return false;
    
    // Refresh if session expires within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return (session.expiresAt.getTime() - Date.now()) < fiveMinutes;
  }
} 