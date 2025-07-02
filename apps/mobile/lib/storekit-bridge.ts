import { Platform, NativeModules, NativeEventEmitter } from 'react-native'

// Native module interface for iOS StoreKit
interface StoreKitNativeModule {
  // Product management
  getProductsFromAppStore(productIds: string[]): Promise<any[]>
  
  // Purchase flow
  requestPayment(productId: string): Promise<any>
  finishTransaction(transactionId: string): Promise<void>
  
  // Receipt management
  getReceiptData(): Promise<string>
  refreshReceipt(): Promise<string>
  
  // Restore purchases
  restorePurchases(): Promise<any[]>
  
  // Transaction validation
  validateReceipt(receiptData: string, environment: 'sandbox' | 'production'): Promise<any>
  
  // Observer methods
  addTransactionObserver(): void
  removeTransactionObserver(): void
}

// Type definitions for StoreKit objects
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

// Mock implementation for development and Android
const MockStoreKit: StoreKitNativeModule = {
  async getProductsFromAppStore(productIds: string[]) {
    console.log('[MOCK StoreKit] Getting products:', productIds)
    return productIds.map(id => ({
      identifier: id,
      localizedTitle: `Mock Product ${id}`,
      localizedDescription: `Mock description for ${id}`,
      price: '4.99',
      priceLocale: {
        currencyCode: 'USD',
        currencySymbol: '$'
      },
      localizedPrice: '$4.99'
    }))
  },

  async requestPayment(productId: string) {
    console.log('[MOCK StoreKit] Requesting payment for:', productId)
    // Simulate a successful purchase
    return {
      transactionIdentifier: 'mock_txn_' + Date.now(),
      originalTransactionIdentifier: 'mock_original_' + Date.now(),
      transactionDate: new Date(),
      productIdentifier: productId,
      transactionState: 'purchased'
    }
  },

  async finishTransaction(transactionId: string) {
    console.log('[MOCK StoreKit] Finishing transaction:', transactionId)
  },

  async getReceiptData() {
    console.log('[MOCK StoreKit] Getting receipt data')
    return 'mock_receipt_data_' + Date.now()
  },

  async refreshReceipt() {
    console.log('[MOCK StoreKit] Refreshing receipt')
    return 'mock_refreshed_receipt_' + Date.now()
  },

  async restorePurchases() {
    console.log('[MOCK StoreKit] Restoring purchases')
    return []
  },

  async validateReceipt(receiptData: string, environment: 'sandbox' | 'production') {
    console.log('[MOCK StoreKit] Validating receipt:', { receiptData: receiptData.substring(0, 20), environment })
    return {
      status: 0,
      receipt: {
        receipt_type: environment,
        bundle_id: 'com.civicsense.app',
        application_version: '1.0.0'
      }
    }
  },

  addTransactionObserver() {
    console.log('[MOCK StoreKit] Adding transaction observer')
  },

  removeTransactionObserver() {
    console.log('[MOCK StoreKit] Removing transaction observer')
  }
}

// Get the native module (iOS only) or use mock
const StoreKitModule: StoreKitNativeModule = Platform.OS === 'ios' 
  ? (NativeModules.CivicSenseStoreKit || MockStoreKit)
  : MockStoreKit

// Event emitter for transaction updates
let storeKitEmitter: NativeEventEmitter | null = null
if (Platform.OS === 'ios' && StoreKitModule !== MockStoreKit) {
  storeKitEmitter = new NativeEventEmitter(NativeModules.CivicSenseStoreKit)
}

export class StoreKitBridge {
  private static transactionListeners: Set<(transaction: SKPaymentTransaction) => void> = new Set()
  private static isObserving = false

  /**
   * Initialize StoreKit bridge and start observing transactions
   */
  static initialize(): void {
    if (Platform.OS !== 'ios') {
      console.log('[StoreKit] Not on iOS, using mock implementation')
      return
    }

    if (!this.isObserving) {
      StoreKitModule.addTransactionObserver()
      this.isObserving = true

      // Listen for transaction updates
      if (storeKitEmitter) {
        storeKitEmitter.addListener('StoreKitTransactionUpdate', (transaction: SKPaymentTransaction) => {
          this.transactionListeners.forEach(listener => listener(transaction))
        })
      }

      console.log('[StoreKit] Initialized and observing transactions')
    }
  }

  /**
   * Cleanup StoreKit bridge
   */
  static cleanup(): void {
    if (this.isObserving) {
      StoreKitModule.removeTransactionObserver()
      this.isObserving = false

      if (storeKitEmitter) {
        storeKitEmitter.removeAllListeners('StoreKitTransactionUpdate')
      }

      this.transactionListeners.clear()
      console.log('[StoreKit] Cleaned up')
    }
  }

  /**
   * Add listener for transaction updates
   */
  static addTransactionListener(listener: (transaction: SKPaymentTransaction) => void): () => void {
    this.transactionListeners.add(listener)
    
    return () => {
      this.transactionListeners.delete(listener)
    }
  }

  /**
   * Get available products from App Store
   */
  static async getProducts(productIds: string[]): Promise<SKProduct[]> {
    try {
      const products = await StoreKitModule.getProductsFromAppStore(productIds)
      return products
    } catch (error) {
      console.error('[StoreKit] Error getting products:', error)
      throw error
    }
  }

  /**
   * Request payment for a product
   */
  static async requestPayment(productId: string): Promise<SKPaymentTransaction> {
    try {
      const transaction = await StoreKitModule.requestPayment(productId)
      return transaction
    } catch (error) {
      console.error('[StoreKit] Error requesting payment:', error)
      throw error
    }
  }

  /**
   * Finish a transaction (mark as complete)
   */
  static async finishTransaction(transactionId: string): Promise<void> {
    try {
      await StoreKitModule.finishTransaction(transactionId)
    } catch (error) {
      console.error('[StoreKit] Error finishing transaction:', error)
      throw error
    }
  }

  /**
   * Get receipt data for validation
   */
  static async getReceiptData(): Promise<string> {
    try {
      const receiptData = await StoreKitModule.getReceiptData()
      return receiptData
    } catch (error) {
      console.error('[StoreKit] Error getting receipt data:', error)
      throw error
    }
  }

  /**
   * Refresh receipt data
   */
  static async refreshReceipt(request?: SKReceiptRefreshRequest): Promise<string> {
    try {
      const receiptData = await StoreKitModule.refreshReceipt()
      return receiptData
    } catch (error) {
      console.error('[StoreKit] Error refreshing receipt:', error)
      throw error
    }
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases(): Promise<SKPaymentTransaction[]> {
    try {
      const transactions = await StoreKitModule.restorePurchases()
      return transactions
    } catch (error) {
      console.error('[StoreKit] Error restoring purchases:', error)
      throw error
    }
  }

  /**
   * Validate receipt with Apple servers
   */
  static async validateReceipt(
    receiptData: string, 
    environment: 'sandbox' | 'production' = 'production'
  ): Promise<any> {
    try {
      const validationResult = await StoreKitModule.validateReceipt(receiptData, environment)
      return validationResult
    } catch (error) {
      console.error('[StoreKit] Error validating receipt:', error)
      throw error
    }
  }

  /**
   * Check if payments are allowed on this device
   */
  static canMakePayments(): boolean {
    if (Platform.OS !== 'ios') return false
    
    // This would normally call SKPaymentQueue.canMakePayments()
    // For now, return true as a default
    return true
  }

  /**
   * Get localized price for a product
   */
  static getLocalizedPrice(product: SKProduct): string {
    return product.localizedPrice || `${product.priceLocale.currencySymbol}${product.price}`
  }
}

// Export the bridge and types
export default StoreKitBridge
export { StoreKitModule } 