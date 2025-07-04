import { debug } from '../utils/debug'

export class GuestAccessService {
  private readonly GUEST_TOKEN_KEY = 'guest_token'

  getGuestToken(): string | null {
    try {
      return localStorage.getItem(this.GUEST_TOKEN_KEY)
    } catch (error) {
      debug.warn('guest-access', 'Failed to get guest token:', error)
      return null
    }
  }

  generateGuestToken(): string {
    const token = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`
    try {
      localStorage.setItem(this.GUEST_TOKEN_KEY, token)
    } catch (error) {
      debug.warn('guest-access', 'Failed to save guest token:', error)
    }
    return token
  }

  getOrCreateGuestToken(): string {
    return this.getGuestToken() || this.generateGuestToken()
  }

  clearGuestToken(): void {
    try {
      localStorage.removeItem(this.GUEST_TOKEN_KEY)
    } catch (error) {
      debug.warn('guest-access', 'Failed to clear guest token:', error)
    }
  }
}

export const guestAccessService = new GuestAccessService() 