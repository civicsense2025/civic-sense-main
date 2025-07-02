import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth-context';
import { supabase } from '../supabase';

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier: 'free' | 'premium' | 'pro';
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_end_date: string | null;
  payment_provider: string | null;
  external_subscription_id: string | null;
  last_payment_date: string | null;
  next_billing_date: string | null;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime' | null;
  amount_cents: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsePremiumReturn {
  // Subscription state
  subscription: UserSubscription | null;
  isLoading: boolean;
  
  // Premium access checks
  isActive: boolean;
  isPremium: boolean;
  isPro: boolean;
  hasGenerationAccess: boolean;
  
  // Subscription utilities
  daysUntilExpiry: number | null;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  debugDatabaseConnection: () => Promise<void>; // Debug function
}

// Cache to prevent duplicate requests with loading state tracking
const subscriptionCache: Map<string, { 
  subscription: UserSubscription | null; 
  timestamp: number;
  isLoading?: boolean;
}> = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Prevent multiple simultaneous loads for the same user
const loadingPromises: Map<string, PromiseLike<any>> = new Map();

export function usePremium(): UsePremiumReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  // Load data only when user ID changes - with proper deduplication
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user?.id) {
        if (isMounted) {
          setSubscription(null);
          setIsLoading(false);
          setHasDataLoaded(true);
        }
        return;
      }

      // Check cache first - only use cache if we have loaded data at least once
      const cached = subscriptionCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL && hasDataLoaded) {
        console.log('💾 Using cached subscription data for user:', user.id);
        if (isMounted) {
          setSubscription(cached.subscription);
          setIsLoading(false);
        }
        return;
      }

      // Check if already loading to prevent duplicate requests
      if (loadingPromises.has(user.id)) {
        console.log('⏳ Already loading subscription for user:', user.id);
        try {
          const result = await loadingPromises.get(user.id);
          if (isMounted) {
            setSubscription(result);
            setIsLoading(false);
            setHasDataLoaded(true);
          }
        } catch (error) {
          console.error('❌ Error waiting for existing load:', error);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        console.log('🔍 Loading subscription data for user:', user.id);

        // Enhanced debugging - first check if table exists and has data
        console.log('🔍 Debug: Testing raw query without single()...');
        const { data: rawData, error: rawError, count } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
        
        console.log('🔍 Debug: Raw query results:', {
          count,
          rawDataLength: rawData?.length,
          rawError: rawError?.message,
          rawErrorCode: rawError?.code,
          rawData: rawData?.[0] ? {
            id: rawData[0].id,
            user_id: rawData[0].user_id,
            subscription_tier: rawData[0].subscription_tier,
            subscription_status: rawData[0].subscription_status,
          } : 'No data found'
        });

        // Create loading promise to prevent duplicates
        const loadPromise = supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .then(result => {
            console.log('🔍 Debug: Single query promise result:', {
              hasData: !!result.data,
              hasError: !!result.error,
              errorCode: result.error?.code,
              errorMessage: result.error?.message,
            });
            return result.data;
          });

        loadingPromises.set(user.id, loadPromise);

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        console.log('🔍 Debug: Final single query results:', {
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : 'No data',
          hasError: !!error,
          errorCode: error?.code,
          errorMessage: error?.message,
        });

        if (!isMounted) return;

        let finalSubscription: UserSubscription | null = null;

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('👤 No subscription found - user on free tier');
            finalSubscription = null;
          } else {
            console.error('❌ Error loading subscription:', error);
            finalSubscription = null;
          }
        } else if (data) {
          console.log('✅ Subscription loaded:', {
            tier: data.subscription_tier,
            status: data.subscription_status,
            billing_cycle: data.billing_cycle,
          });
          finalSubscription = data as UserSubscription;
        } else {
          console.log('👤 No subscription data returned - user on free tier');
          finalSubscription = null;
        }

        // Update cache with reliable data
        subscriptionCache.set(user.id, {
          subscription: finalSubscription,
          timestamp: Date.now(),
        });

        if (isMounted) {
          setSubscription(finalSubscription);
          setHasDataLoaded(true);
        }

      } catch (error) {
        console.error('❌ Error in loadSubscriptionData:', error);
        if (isMounted) {
          setSubscription(null);
          setHasDataLoaded(true);
        }
      } finally {
        // Clean up loading promise
        loadingPromises.delete(user.id);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user?.id

  // Calculate subscription utilities
  const isActive = subscription?.subscription_status === 'active' || false;
  const isPremium = Boolean(subscription && ['premium', 'pro'].includes(subscription.subscription_tier) && isActive);
  const isPro = Boolean(subscription?.subscription_tier === 'pro' && isActive);
  const hasGenerationAccess = isPremium; // Premium users have generation access

  const daysUntilExpiry = subscription?.subscription_end_date 
    ? Math.ceil((new Date(subscription.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Actions - Fixed to avoid dependency cycles and use same deduplication logic
  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return;
    
    // Clear cache and loading promises to force fresh load
    subscriptionCache.delete(user.id);
    loadingPromises.delete(user.id);
    
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing subscription data for user:', user.id);

      // Debug refresh query as well
      console.log('🔍 Debug: Refresh raw query test...');
      const { data: refreshRawData, error: refreshRawError, count: refreshCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      console.log('🔍 Debug: Refresh raw query results:', {
        count: refreshCount,
        rawDataLength: refreshRawData?.length,
        rawError: refreshRawError?.message,
        rawData: refreshRawData?.[0] ? {
          id: refreshRawData[0].id,
          user_id: refreshRawData[0].user_id,
          subscription_tier: refreshRawData[0].subscription_tier,
          subscription_status: refreshRawData[0].subscription_status,
        } : 'No data found'
      });

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔍 Debug: Refresh single query results:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
      });

      let finalSubscription: UserSubscription | null = null;

              if (error) {
          if (error.code === 'PGRST116') {
            console.log('👤 No subscription found - user on free tier');
            finalSubscription = null;
          } else {
            console.error('❌ Error refreshing subscription:', error);
            finalSubscription = null;
          }
        } else if (data) {
          console.log('✅ Subscription refreshed:', {
            tier: data.subscription_tier,
            status: data.subscription_status,
            billing_cycle: data.billing_cycle,
          });
          finalSubscription = data as UserSubscription;
        } else {
          console.log('👤 No subscription data returned during refresh - user on free tier');
          finalSubscription = null;
        }

      // Update cache with reliable data
      subscriptionCache.set(user.id, {
        subscription: finalSubscription,
        timestamp: Date.now(),
      });

      setSubscription(finalSubscription);
      setHasDataLoaded(true);

    } catch (error) {
      console.error('❌ Error in refreshSubscription:', error);
      setSubscription(null);
      setHasDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Debug logging - only log when data has actually loaded to prevent stale closure logs
  useEffect(() => {
    if (user?.id && hasDataLoaded && !isLoading) {
      console.log('🔍 Premium access status:', {
        userId: user.id,
        hasSubscription: !!subscription,
        tier: subscription?.subscription_tier,
        status: subscription?.subscription_status,
        isActive,
        isPremium,
        isPro,
        hasGenerationAccess,
        daysUntilExpiry,
      });
    }
  }, [user?.id, subscription, isActive, isPremium, isPro, hasGenerationAccess, daysUntilExpiry, hasDataLoaded, isLoading]);

  // Debug function for manual testing
  const debugDatabaseConnection = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID for debug test');
      return;
    }
    
    console.log('🧪 Manual database debug test starting...');
    
    try {
      // Test 1: Basic table access
      console.log('🧪 Test 1: Basic table access');
      const { data: allData, error: allError, count: allCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' });
      
      console.log('🧪 All subscriptions:', {
        count: allCount,
        error: allError?.message,
        sampleData: allData?.[0]
      });
      
      // Test 2: Specific user query
      console.log('🧪 Test 2: Specific user query for:', user.id);
      const { data: userData, error: userError, count: userCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      console.log('🧪 User-specific query:', {
        count: userCount,
        error: userError?.message,
        data: userData
      });
      
      // Test 3: Check auth state
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🧪 Current auth state:', {
        userId: authUser?.id,
        email: authUser?.email,
        error: authError?.message,
        matchesContext: authUser?.id === user.id
      });
      
    } catch (error) {
      console.error('🧪 Debug test failed:', error);
    }
  }, [user?.id]);

  return {
    // Subscription state
    subscription,
    isLoading,
    
    // Premium access checks
    isActive,
    isPremium,
    isPro,
    hasGenerationAccess,
    
    // Subscription utilities
    daysUntilExpiry,
    
    // Actions
    refreshSubscription,
    debugDatabaseConnection, // Add debug function
  };
} 