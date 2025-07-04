export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'past_due';
export type PaymentProvider = 'stripe' | 'apple_iap' | 'google_iap' | 'manual';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

export interface UserSubscription {
  user_id: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_start_date: string;
  subscription_end_date: string | null;
  trial_end_date: string | null;
  payment_provider: PaymentProvider;
  external_subscription_id: string | null;
  last_payment_date: string | null;
  next_billing_date: string | null;
  billing_cycle: BillingCycle;
  amount_cents: number | null;
  currency: string | null;
  updated_at: string;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  enabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  price_cents: number;
  currency: string;
  billing_cycle: BillingCycle;
  features: SubscriptionFeature[];
  trial_days?: number;
  is_default?: boolean;
}

export interface SubscriptionOperations {
  getCurrentSubscription(userId: string): Promise<UserSubscription | null>;
  upsertSubscription(subscription: UserSubscription): Promise<UserSubscription>;
  cancelSubscription(userId: string): Promise<void>;
  getAvailablePlans(): Promise<SubscriptionPlan[]>;
  getFeaturesByTier(tier: SubscriptionTier): Promise<SubscriptionFeature[]>;
  hasFeatureAccess(userId: string, featureId: string): Promise<boolean>;
} 