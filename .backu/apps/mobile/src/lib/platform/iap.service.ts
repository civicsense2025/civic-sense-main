import * as StoreKit from 'expo-store-kit';
import * as InAppPurchases from 'expo-in-app-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface PurchaseResult {
  success: boolean;
  error?: string;
  purchaseToken?: string;
  productId?: string;
  transactionDate?: number;
}

interface SubscriptionStatus {
  isActive: boolean;
  expiryDate?: Date;
  productId?: string;
  autoRenewing?: boolean;
}

export class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private productIds: string[] = [
    'civicsense.premium.monthly',
    'civicsense.premium.yearly',
    'civicsense.premium.lifetime'
  ];

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await InAppPurchases.connectAsync();
      
      // Set up purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach(purchase => {
            if (!purchase.acknowledged) {
              // Acknowledge the purchase
              this.acknowledgePurchase(purchase);
            }
          });
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync(this.productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.[0]) {
        const purchase = results[0];
        
        // Save purchase info
        await this.savePurchaseInfo(purchase);
        
        return {
          success: true,
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
          transactionDate: purchase.transactionDate
        };
      }
      
      return {
        success: false,
        error: 'Purchase failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        // Process and save restored purchases
        for (const purchase of results) {
          await this.savePurchaseInfo(purchase);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const purchaseInfo = await AsyncStorage.getItem('iap_subscription_info');
      
      if (!purchaseInfo) {
        return { isActive: false };
      }

      const info = JSON.parse(purchaseInfo);
      const now = new Date();
      const expiryDate = new Date(info.expiryDate);

      return {
        isActive: expiryDate > now,
        expiryDate,
        productId: info.productId,
        autoRenewing: info.autoRenewing
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isActive: false };
    }
  }

  private async acknowledgePurchase(purchase: any) {
    try {
      if (Platform.OS === 'ios') {
        await StoreKit.finishTransactionAsync(purchase.originalPurchaseId, true);
      } else {
        await InAppPurchases.acknowledgePurchaseAsync(purchase.purchaseToken);
      }
    } catch (error) {
      console.error('Failed to acknowledge purchase:', error);
    }
  }

  private async savePurchaseInfo(purchase: any) {
    try {
      const purchaseInfo = {
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        transactionDate: purchase.transactionDate,
        expiryDate: this.calculateExpiryDate(purchase),
        autoRenewing: purchase.autoRenewingAndroid || false
      };

      await AsyncStorage.setItem('iap_subscription_info', JSON.stringify(purchaseInfo));
    } catch (error) {
      console.error('Failed to save purchase info:', error);
    }
  }

  private calculateExpiryDate(purchase: any): Date {
    // Default to 1 month from purchase date
    const purchaseDate = new Date(purchase.transactionDate);
    
    switch (purchase.productId) {
      case 'civicsense.premium.monthly':
        return new Date(purchaseDate.setMonth(purchaseDate.getMonth() + 1));
      case 'civicsense.premium.yearly':
        return new Date(purchaseDate.setFullYear(purchaseDate.getFullYear() + 1));
      case 'civicsense.premium.lifetime':
        return new Date(8640000000000000); // Distant future
      default:
        return new Date(purchaseDate.setMonth(purchaseDate.getMonth() + 1));
    }
  }
}

// Export singleton instance
export const iapService = IAPService.getInstance(); 