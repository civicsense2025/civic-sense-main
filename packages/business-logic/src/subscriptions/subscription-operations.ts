import { supabase } from '../database/supabase';
import { 
  type UserSubscription, 
  type SubscriptionPlan, 
  type SubscriptionFeature,
  type SubscriptionOperations
} from '@civicsense/types';

class SubscriptionOperationsImpl implements SubscriptionOperations {
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  async upsertSubscription(subscription: UserSubscription): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(subscription, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting subscription:', error);
      throw new Error('Failed to update subscription');
    }

    return data;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select(`
        *,
        features:subscription_features(*)
      `)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return data;
  }

  async getFeaturesByTier(tier: string): Promise<SubscriptionFeature[]> {
    const { data, error } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('tier', tier)
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching features:', error);
      return [];
    }

    return data;
  }

  async hasFeatureAccess(userId: string, featureId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription || subscription.subscription_status !== 'active') {
      return false;
    }

    const features = await this.getFeaturesByTier(subscription.subscription_tier);
    return features.some(f => f.id === featureId && f.enabled);
  }
}

export const subscriptionOperations = new SubscriptionOperationsImpl(); 