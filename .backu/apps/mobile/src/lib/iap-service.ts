import { supabase } from './supabase'
import { type UserSubscription, type PaymentProvider } from '@civicsense/types'
import { subscriptionOperations } from '@civicsense/business-logic/subscriptions'
import { debug } from './debug-config'

// Apple IAP Product IDs (configure these in App Store Connect)
export const APPLE_IAP_PRODUCTS = {
  LIFETIME_PREMIUM: 'civicsense_lifetime_premium',
  // Add other IAP products as needed
} as const

export type AppleIAPProduct = keyof typeof APPLE_IAP_PRODUCTS

// Apple receipt validation types
interface AppleReceiptValidationRequest {
  'receipt-data': string
  password?: string // App-specific shared secret
  'exclude-old-transactions'?: boolean
}

interface AppleReceiptValidationResponse {
  status: number
  receipt?: AppleReceipt
  'latest_receipt_info'?: AppleTransaction[]
  'pending_renewal_info'?: ApplePendingRenewal[]
  environment: 'Sandbox' | 'Production'
}

interface AppleReceipt {
  receipt_type: 'ProductionSandbox' | 'Production'
  bundle_id: string
  application_version: string
  in_app: AppleTransaction[]
}

interface AppleTransaction {
  quantity: string
  product_id: string
  transaction_id: string
  original_transaction_id: string
  purchase_date: string
  purchase_date_ms: string
  original_purchase_date: string
  original_purchase_date_ms: string
  expires_date?: string
  expires_date_ms?: string
  web_order_line_item_id?: string
  is_trial_period?: string
  is_in_intro_offer_period?: string
}

interface ApplePendingRenewal {
  product_id: string
  original_transaction_id: string
  auto_renew_product_id: string
  auto_renew_status: string
}

// Store Apple IAP transactions
interface AppleIAPTransaction {
  id: string
  user_id: string
  product_id: string
  transaction_id: string
  original_transaction_id: string
  purchase_date: string
  receipt_data: string
  validation_status: 'valid' | 'invalid' | 'pending'
  environment: 'sandbox' | 'production'
  created_at: string
  updated_at: string
}

export class AppleIAPService {
  private static readonly APPLE_VALIDATION_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt'
  private static readonly APPLE_VALIDATION_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt'
  
  /**
   * Validate Apple receipt with Apple's servers
   */
  static async validateReceipt(
    receiptData: string,
    isProduction: boolean = true
  ): Promise<AppleReceiptValidationResponse> {
    const url = isProduction 
      ? this.APPLE_VALIDATION_URL_PRODUCTION 
      : this.APPLE_VALIDATION_URL_SANDBOX

    const requestBody: AppleReceiptValidationRequest = {
      'receipt-data': receiptData,
      password: process.env.APPLE_SHARED_SECRET,
      'exclude-old-transactions': true
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Apple validation failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!this.isValidReceiptResponse(data)) {
        throw new Error('Invalid receipt response format')
      }

      // If production validation fails with sandbox receipt, try sandbox
      if (data.status === 21007 && isProduction) {
        debug.log('apple-iap', 'Production validation failed, trying sandbox')
        return this.validateReceipt(receiptData, false)
      }

      return data
    } catch (error) {
      debug.error('apple-iap', 'Receipt validation failed:', error)
      throw new Error('Failed to validate receipt with Apple')
    }
  }

  private static isValidReceiptResponse(data: unknown): data is AppleReceiptValidationResponse {
    if (!data || typeof data !== 'object') return false
    const response = data as Partial<AppleReceiptValidationResponse>
    return typeof response.status === 'number' && 
           (response.environment === 'Sandbox' || response.environment === 'Production')
  }

  /**
   * Process Apple IAP purchase and grant access
   */
  static async processPurchase(
    userId: string,
    receiptData: string,
    productId: string
  ): Promise<{ success: boolean; error?: string; subscription?: UserSubscription }> {
    try {
      debug.log('apple-iap', `Processing Apple IAP purchase for user ${userId}, product: ${productId}`)

      // Validate receipt with Apple
      const validationResult = await this.validateReceipt(receiptData)
      
      if (validationResult.status !== 0) {
        debug.error('apple-iap', 'Receipt validation failed:', validationResult)
        return { 
          success: false, 
          error: `Apple receipt validation failed with status: ${validationResult.status}` 
        }
      }

      // Find the transaction for our product
      const transactions = validationResult.receipt?.in_app || []
      const relevantTransaction = transactions.find(t => t.product_id === productId)
      
      if (!relevantTransaction) {
        return { 
          success: false, 
          error: 'Product not found in receipt' 
        }
      }

      // Store the transaction in our database
      await this.storeTransaction(userId, relevantTransaction, receiptData, validationResult.environment)

      // Grant the appropriate access based on product
      const subscription = await this.grantProductAccess(userId, productId, relevantTransaction)

      if (!subscription) {
        return { 
          success: false, 
          error: 'Failed to grant product access' 
        }
      }

      debug.log('apple-iap', `Successfully processed Apple IAP purchase: ${productId} for user ${userId}`)
      
      return { 
        success: true, 
        subscription 
      }

    } catch (error) {
      debug.error('apple-iap', 'Error processing Apple IAP purchase:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Store Apple IAP transaction in database
   */
  private static async storeTransaction(
    userId: string,
    transaction: AppleTransaction,
    receiptData: string,
    environment: 'Sandbox' | 'Production'
  ): Promise<void> {
    const { error } = await supabase
      .from('apple_iap_transactions')
      .upsert({
        user_id: userId,
        product_id: transaction.product_id,
        transaction_id: transaction.transaction_id,
        original_transaction_id: transaction.original_transaction_id,
        purchase_date: new Date(parseInt(transaction.purchase_date_ms)).toISOString(),
        receipt_data: receiptData,
        validation_status: 'valid',
        environment: environment.toLowerCase(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'transaction_id'
      })

    if (error) {
      debug.error('apple-iap', 'Error storing Apple IAP transaction:', error)
      throw new Error('Failed to store transaction')
    }
  }

  /**
   * Grant access based on Apple IAP product
   */
  private static async grantProductAccess(
    userId: string,
    productId: string,
    transaction: AppleTransaction
  ): Promise<UserSubscription | null> {
    switch (productId) {
      case APPLE_IAP_PRODUCTS.LIFETIME_PREMIUM:
        return this.grantLifetimePremium(userId, transaction)
      
      default:
        debug.error('apple-iap', `Unknown product ID: ${productId}`)
        return null
    }
  }

  /**
   * Grant lifetime premium access
   */
  private static async grantLifetimePremium(
    userId: string,
    transaction: AppleTransaction
  ): Promise<UserSubscription | null> {
    const subscription: Omit<UserSubscription, 'id'> = {
      user_id: userId,
      subscription_tier: 'premium',
      subscription_status: 'active',
      subscription_start_date: new Date(parseInt(transaction.purchase_date_ms)).toISOString(),
      subscription_end_date: null, // Lifetime = no end date
      trial_end_date: null,
      payment_provider: 'apple_iap' as PaymentProvider,
      external_subscription_id: transaction.original_transaction_id,
      last_payment_date: new Date(parseInt(transaction.purchase_date_ms)).toISOString(),
      next_billing_date: null, // Lifetime = no next billing
      billing_cycle: 'lifetime',
      amount_cents: null, // Amount handled by Apple
      currency: null,
      updated_at: new Date().toISOString()
    }

    return await subscriptionOperations.upsertSubscription(subscription)
  }

  /**
   * Restore purchases for a user (called when app starts or user clicks restore)
   */
  static async restorePurchases(
    userId: string,
    receiptData: string
  ): Promise<{ success: boolean; restoredProducts: string[]; error?: string }> {
    try {
      debug.log('apple-iap', `Restoring purchases for user ${userId}`)

      const validationResult = await this.validateReceipt(receiptData)
      
      if (validationResult.status !== 0) {
        return { 
          success: false, 
          restoredProducts: [],
          error: `Receipt validation failed with status: ${validationResult.status}` 
        }
      }

      const transactions = validationResult.receipt?.in_app || []
      const restoredProducts: string[] = []

      // Process each valid transaction
      for (const transaction of transactions) {
        if (Object.values(APPLE_IAP_PRODUCTS).includes(transaction.product_id as any)) {
          await this.storeTransaction(userId, transaction, receiptData, validationResult.environment)
          await this.grantProductAccess(userId, transaction.product_id, transaction)
          restoredProducts.push(transaction.product_id)
        }
      }

      debug.log('apple-iap', `Restored ${restoredProducts.length} products for user ${userId}`)

      return { 
        success: true, 
        restoredProducts 
      }

    } catch (error) {
      debug.error('apple-iap', 'Error restoring purchases:', error)
      return { 
        success: false, 
        restoredProducts: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if user has valid Apple IAP subscription
   */
  static async hasValidAppleSubscription(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('apple_iap_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('validation_status', 'valid')
      .order('purchase_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      debug.log('apple-iap', `No Apple IAP transaction found for user ${userId}, product ${productId}`)
      return false
    }

    return !!data
  }
} 