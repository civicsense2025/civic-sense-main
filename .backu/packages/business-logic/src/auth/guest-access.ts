// CivicSense Guest Access Service
// Handles anonymous user access and progress tracking

export interface GuestSession {
  guestToken: string;
  createdAt: Date;
  lastActive: Date;
}

export class GuestAccessService {
  private readonly GUEST_TOKEN_KEY = 'civicsense_guest_token';

  generateGuestToken(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createGuestSession(): Promise<GuestSession> {
    const guestToken = this.generateGuestToken();
    const now = new Date();
    
    const session: GuestSession = {
      guestToken,
      createdAt: now,
      lastActive: now,
    };

    await this.saveGuestSession(session);
    return session;
  }

  async getOrCreateGuestSession(): Promise<GuestSession> {
    const existing = await this.getGuestSession();
    if (existing) {
      // Update last active
      existing.lastActive = new Date();
      await this.saveGuestSession(existing);
      return existing;
    }
    
    return this.createGuestSession();
  }

  // Platform-specific implementations will override these
  protected async saveGuestSession(session: GuestSession): Promise<void> {
    // Default implementation - platforms should override
    console.log('Guest session saved:', session.guestToken);
  }

  protected async getGuestSession(): Promise<GuestSession | null> {
    // Default implementation - platforms should override
    return null;
  }

  async clearGuestSession(): Promise<void> {
    // Platform-specific implementation
  }

  async migrateGuestDataToUser(guestToken: string, userId: string): Promise<void> {
    // Business logic for migrating guest data to authenticated user
    console.log(`Migrating guest data from ${guestToken} to user ${userId}`);
    // This will be implemented to move progress, bookmarks, etc.
  }
} 