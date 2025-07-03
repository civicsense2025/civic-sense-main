export interface User {
  id: string
  email?: string
  role?: 'user' | 'admin'
  subscription?: {
    status?: 'active' | 'trialing' | 'canceled' | 'expired'
    plan?: 'free' | 'premium' | 'pro' | 'lifetime'
  }
} 