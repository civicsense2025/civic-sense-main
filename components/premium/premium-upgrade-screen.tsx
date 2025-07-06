"use client"

import React, { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { STRIPE_CONFIG } from '@/lib/premium'
import { appleIAPMobile } from '@/apps/mobile/lib/apple-iap-mobile'
import { APPLE_IAP_PRODUCTS } from '@/lib/apple-iap'
import type { SKProduct } from '@/apps/mobile/lib/apple-iap-mobile'

interface PremiumUpgradeScreenProps {
  onClose?: () => void
  showCloseButton?: boolean
}

export function PremiumUpgradeScreen({ 
  onClose, 
  showCloseButton = true 
}: PremiumUpgradeScreenProps) {
  const { user } = useAuth()
  const { subscription, isPremium, refreshSubscription } = usePremium()
  
  // State management
  const [isLoading, setIsLoading] = useState(false)
  const [appleProducts, setAppleProducts] = useState<SKProduct[]>([])
  const [isAppleIAPAvailable, setIsAppleIAPAvailable] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'lifetime'>('lifetime')

  // Initialize Apple IAP on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      initializeAppleIAP()
    }
  }, [])

  const initializeAppleIAP = async () => {
    try {
      const initialized = await appleIAPMobile.initialize()
      if (initialized) {
        const products = appleIAPMobile.getProducts()
        setAppleProducts(products)
        setIsAppleIAPAvailable(true)
      }
    } catch (error) {
      console.error('Failed to initialize Apple IAP:', error)
    }
  }

  // Get pricing information
  const getApplePrice = (productId: string): string => {
    const product = appleProducts.find(p => p.identifier === productId)
    return product?.localizedPrice || 'Loading...'
  }

  const getStripePrice = (plan: 'yearly' | 'lifetime'): string => {
    if (plan === 'yearly') {
      return '$25.00'
    }
    return '$50.00' // Lifetime
  }

  const getPlatformSpecificPrice = (plan: 'yearly' | 'lifetime'): string => {
    if (Platform.OS === 'ios' && isAppleIAPAvailable) {
      if (plan === 'lifetime') {
        return getApplePrice(APPLE_IAP_PRODUCTS.LIFETIME_PREMIUM)
      }
      // For yearly, we might need to implement yearly IAP product
      return getStripePrice(plan)
    }
    return getStripePrice(plan)
  }

  // Handle purchase
  const handlePurchase = async (plan: 'yearly' | 'lifetime') => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to upgrade to premium.')
      return
    }

    setIsLoading(true)

    try {
      // Use Apple IAP for iOS lifetime purchases
      if (Platform.OS === 'ios' && isAppleIAPAvailable && plan === 'lifetime') {
        await handleAppleIAPPurchase()
      } else {
        await handleStripePurchase(plan)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      Alert.alert(
        'Purchase Failed', 
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleIAPPurchase = async () => {
    try {
      const result = await appleIAPMobile.purchaseProduct(APPLE_IAP_PRODUCTS.LIFETIME_PREMIUM)
      
      if (result.success) {
        Alert.alert(
          'Purchase Successful!', 
          'You now have lifetime access to CivicSense Premium. Build your civic knowledge and strengthen democracy!',
          [
            {
              text: 'Start Learning',
              onPress: () => {
                refreshSubscription()
                onClose?.()
              }
            }
          ]
        )
      } else {
        throw new Error(result.error || 'Purchase failed')
      }
    } catch (error) {
      throw error
    }
  }

  const handleStripePurchase = async (plan: 'yearly' | 'lifetime') => {
    try {
      // Import Stripe operations
      const { stripeOperations } = await import('@/lib/premium')
      
      const priceId = plan === 'yearly' 
        ? STRIPE_CONFIG.priceIds.premium_yearly
        : STRIPE_CONFIG.priceIds.premium_lifetime

      const { sessionId, error } = await stripeOperations.createCheckoutSession(
        user!.id,
        priceId,
        `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        window.location.href
      )

      if (error) {
        throw new Error(error)
      }

      if (sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await import('@stripe/stripe-js').then(m => 
          m.loadStripe(STRIPE_CONFIG.publishableKey)
        )
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios' || !isAppleIAPAvailable) {
      Alert.alert('Restore Purchases', 'Purchase restoration is only available on iOS devices.')
      return
    }

    setIsLoading(true)

    try {
      const result = await appleIAPMobile.restorePurchases()
      
      if (result.success && result.restoredProducts && result.restoredProducts.length > 0) {
        Alert.alert(
          'Purchases Restored!', 
          `Successfully restored ${result.restoredProducts.length} purchase(s). Your premium access has been activated.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                refreshSubscription()
                onClose?.()
              }
            }
          ]
        )
      } else {
        Alert.alert(
          'No Purchases Found', 
          'We couldn\'t find any previous purchases to restore. If you believe this is an error, please contact support.'
        )
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed', 
        error instanceof Error ? error.message : 'Failed to restore purchases. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show upgrade screen if user already has premium
  if (isPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You're All Set! 🎉</Text>
        <Text style={styles.description}>
          You already have CivicSense Premium. Continue building your civic knowledge and strengthening democracy!
        </Text>
        {showCloseButton && (
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.buttonText}>Continue Learning</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {showCloseButton && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.subtitle}>
        Unlock the full power of civic education
      </Text>

      {/* Feature List */}
      <View style={styles.featuresContainer}>
        {STRIPE_CONFIG.plans.premium.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Plan Selection */}
      <View style={styles.plansContainer}>
        {/* Yearly Plan */}
        <TouchableOpacity 
          style={[
            styles.planOption,
            selectedPlan === 'yearly' && styles.selectedPlan
          ]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Premium Yearly</Text>
            <Text style={styles.planPrice}>{getPlatformSpecificPrice('yearly')}</Text>
          </View>
          <Text style={styles.planDescription}>
            Full access to civic education features, renewed annually
          </Text>
        </TouchableOpacity>

        {/* Lifetime Plan */}
        <TouchableOpacity 
          style={[
            styles.planOption,
            styles.lifetimePlan,
            selectedPlan === 'lifetime' && styles.selectedPlan
          ]}
          onPress={() => setSelectedPlan('lifetime')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Premium Lifetime</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>{getPlatformSpecificPrice('lifetime')}</Text>
              <Text style={styles.bestValue}>BEST VALUE</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>
            One-time payment for lifetime access to all premium features
          </Text>
        </TouchableOpacity>
      </View>

      {/* Purchase Button */}
      <TouchableOpacity 
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={() => handlePurchase(selectedPlan)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {Platform.OS === 'ios' && isAppleIAPAvailable && selectedPlan === 'lifetime'
              ? 'Purchase with App Store'
              : `Get Premium ${selectedPlan === 'yearly' ? 'Yearly' : 'Lifetime'}`
            }
          </Text>
        )}
      </TouchableOpacity>

      {/* Restore Purchases Button (iOS only) */}
      {Platform.OS === 'ios' && isAppleIAPAvailable && (
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isLoading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      )}

      {/* Payment Method Info */}
      <Text style={styles.paymentInfo}>
        {Platform.OS === 'ios' && isAppleIAPAvailable
          ? 'Secure payment processed by Apple. Lifetime purchases use App Store, yearly plans use our secure payment system.'
          : 'Secure payment processed by Stripe. Cancel anytime.'
        }
      </Text>

      {/* Democratic Mission Statement */}
      <View style={styles.missionContainer}>
        <Text style={styles.missionText}>
          Every premium subscription strengthens democratic participation. 
          Your investment helps us create civic education that politicians don't want people to have.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FDFCF9',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E4057',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E4057',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    color: '#E0A63E',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#2E4057',
    flex: 1,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planOption: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  lifetimePlan: {
    borderColor: '#E0A63E',
    backgroundColor: '#FFF5D9',
  },
  selectedPlan: {
    borderColor: '#E0A63E',
    backgroundColor: '#FFF5D9',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E4057',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0A63E',
  },
  bestValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E0A63E',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#E0A63E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#6096BA',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  paymentInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  missionContainer: {
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6096BA',
  },
  missionText: {
    fontSize: 14,
    color: '#2E4057',
    lineHeight: 20,
    fontStyle: 'italic',
  },
})

export default PremiumUpgradeScreen 