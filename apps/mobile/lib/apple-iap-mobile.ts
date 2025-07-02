import { Platform } from 'react-native'
import { supabase } from './supabase'
import { debug } from '../../../lib/debug-config'
import { APPLE_IAP_PRODUCTS } from '../../../lib/apple-iap'
import { StoreKitBridge } from './storekit-bridge'

// Types for iOS StoreKit (these match the actual StoreKit types)
export interface SKProduct {
  identifier: string
  localizedTitle: string
  localizedDescription: string
  price: string
  priceLocale: {
    currencyCode: string
    currencySymbol: string
  }
  localizedPrice: string
}

export interface SKPaymentTransaction {
  transactionIdentifier: string
  originalTransactionIdentifier: string
  transactionDate: Date
  productIdentifier: string
  transactionState: 'purchasing' | 'purchased' | 'failed' | 'restored' | 'deferred'
  error?: {
    code: number
    localizedDescription: string
  }
}

export interface SKReceiptRefreshRequest {
  receiptProperties?: Record<string, any>
}

// iOS-specific Apple IAP manager
class AppleIAPMobileService {
  private isInitialized = false
  private products: SKProduct[] = []
  private pendingTransactions: Map<string, (result: any) => void> = new Map()

  /**
   * Initialize Apple IAP (iOS only)
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      debug.log('apple-iap', 'Apple IAP is only available on iOS')
      return false
    }

    try {
      // Check if payments are allowed (not restricted by parental controls)
      const canMakePayments = StoreKitBridge.canMakePayments()
      if (!canMakePayments) {
        debug.error('apple-iap', 'Payments are disabled on this device')
        return false
      }

      // Set up transaction observer
      StoreKitBridge.addTransactionListener(this.handleTransaction.bind(this))

      // Load products
      await this.loadProducts()

      this.isInitialized = true
      debug.log('apple-iap', 'Apple IAP initialized successfully')
      return true

    } catch (error) {
      debug.error('apple-iap', 'Failed to initialize Apple IAP:', error)
      return false
    }
  }

  /**
   * Load available products from App Store
   */
  private async loadProducts(): Promise<void> {
    try {
      const productIds = Object.values(APPLE_IAP_PRODUCTS)
      const products = await StoreKitBridge.getProducts(productIds)
      
      this.products = products
      debug.log('apple-iap', `Loaded ${products.length} products:`, products.map((p: SKProduct) => p.identifier))

    } catch (error) {
      debug.error('apple-iap', 'Failed to load products:', error)
      throw error
    }
  }

  /**
   * Get available products
   */
  getProducts(): SKProduct[] {
    return this.products
  }

  /**
   * Get specific product by ID
   */
  getProduct(productId: string): SKProduct | null {
    return this.products.find(p => p.identifier === productId) || null
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const product = this.getProduct(productId)
      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      debug.log('apple-iap', `Starting purchase for product: ${productId}`)

      // Create payment and add to queue
      const transaction = await StoreKitBridge.requestPayment(productId)
      
      return new Promise((resolve) => {
        this.pendingTransactions.set(transaction.transactionIdentifier, resolve)
      })

    } catch (error) {
      debug.error('apple-iap', 'Purchase failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Purchase failed' }
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<{ success: boolean; error?: string; restoredProducts?: string[] }> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      debug.log('apple-iap', 'Starting purchase restoration')

      // Get app receipt
      const receiptData = await StoreKitBridge.getReceiptData()
      if (!receiptData) {
        // Refresh receipt if not available
        await StoreKitBridge.refreshReceipt()
        const newReceiptData = await StoreKitBridge.getReceiptData()
        if (!newReceiptData) {
          return { success: false, error: 'Unable to get receipt data' }
        }
      }

      // Validate with our server
      const result = await this.validateReceiptWithServer(receiptData)
      
      return result

    } catch (error) {
      debug.error('apple-iap', 'Restore purchases failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Restore failed' }
    }
  }

  /**
   * Handle transaction updates from StoreKit
   */
  private async handleTransaction(transaction: SKPaymentTransaction): Promise<void> {
    debug.log('apple-iap', `Transaction update: ${transaction.transactionState}`, {
      transactionId: transaction.transactionIdentifier,
      productId: transaction.productIdentifier
    })

    switch (transaction.transactionState) {
      case 'purchased':
        await this.handlePurchasedTransaction(transaction)
        break
      
      case 'restored':
        await this.handleRestoredTransaction(transaction)
        break
      
      case 'failed':
        await this.handleFailedTransaction(transaction)
        break
      
      case 'purchasing':
        // Transaction is being processed
        break
      
      case 'deferred':
        // Transaction is deferred (e.g., Ask to Buy)
        break
    }
  }

  /**
   * Handle successful purchase
   */
  private async handlePurchasedTransaction(transaction: SKPaymentTransaction): Promise<void> {
    try {
      // Get receipt data
      const receiptData = await StoreKitBridge.getReceiptData()
      
      if (!receiptData) {
        throw new Error('Unable to get receipt data')
      }

      // Validate with our server
      const result = await this.validatePurchaseWithServer(
        receiptData,
        transaction.productIdentifier
      )

      // Finish transaction
      await StoreKitBridge.finishTransaction(transaction.transactionIdentifier)

      // Resolve pending promise
      const resolver = this.pendingTransactions.get(transaction.transactionIdentifier)
      if (resolver) {
        resolver({ success: result.success, error: result.error })
        this.pendingTransactions.delete(transaction.transactionIdentifier)
      }

      debug.log('apple-iap', 'Purchase completed successfully')

    } catch (error) {
      debug.error('apple-iap', 'Error handling purchased transaction:', error)
      
      const resolver = this.pendingTransactions.get(transaction.transactionIdentifier)
      if (resolver) {
        resolver({ success: false, error: error instanceof Error ? error.message : 'Validation failed' })
        this.pendingTransactions.delete(transaction.transactionIdentifier)
      }
    }
  }

  /**
   * Handle restored transaction
   */
  private async handleRestoredTransaction(transaction: SKPaymentTransaction): Promise<void> {
    // Similar to purchased, but for restore flow
    await this.handlePurchasedTransaction(transaction)
  }

  /**
   * Handle failed transaction
   */
  private async handleFailedTransaction(transaction: SKPaymentTransaction): Promise<void> {
    // Finish the failed transaction
    await StoreKitBridge.finishTransaction(transaction.transactionIdentifier)

    // Resolve pending promise with error
    const resolver = this.pendingTransactions.get(transaction.transactionIdentifier)
    if (resolver) {
      const errorMessage = transaction.error?.localizedDescription || 'Transaction failed'
      resolver({ success: false, error: errorMessage })
      this.pendingTransactions.delete(transaction.transactionIdentifier)
    }

    debug.log('apple-iap', 'Transaction failed:', transaction.error)
  }

  /**
   * Validate purchase with our server
   */
  private async validatePurchaseWithServer(
    receiptData: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/apple-iap/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          receiptData,
          productId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Validation failed')
      }

      return { success: true }

    } catch (error) {
      debug.error('apple-iap', 'Server validation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      }
    }
  }

  /**
   * Validate receipt for restore purchases
   */
  private async validateReceiptWithServer(
    receiptData: string
  ): Promise<{ success: boolean; error?: string; restoredProducts?: string[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/apple-iap/validate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          receiptData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Restore failed')
      }

      return { 
        success: true, 
        restoredProducts: result.restoredProducts || [] 
      }

    } catch (error) {
      debug.error('apple-iap', 'Server restore validation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      }
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      StoreKitBridge.cleanup()
      this.isInitialized = false
      this.products = []
      this.pendingTransactions.clear()
    } catch (error) {
      debug.error('apple-iap', 'Cleanup failed:', error)
    }
  }
}

// Export singleton instance
export const appleIAPMobile = new AppleIAPMobileService() 