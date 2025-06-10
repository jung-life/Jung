import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Type definitions for IAP
interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
}

interface IAPSubscription extends IAPProduct {
  subscriptionPeriod: string;
}

interface IAPPurchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseToken?: string;
  originalTransactionId?: string;
  purchaseStateAndroid?: number;
}

interface IAPPurchaseError {
  code: string;
  message: string;
  userInfo?: any;
}

// Safe import of react-native-iap with fallback for development
let RNIap: any = null;
let isIAPAvailable = false;

try {
  const iapModule = require('react-native-iap');
  RNIap = iapModule.default || iapModule;
  isIAPAvailable = true;
  console.log('✅ react-native-iap loaded successfully');
} catch (error: any) {
  console.warn('⚠️ react-native-iap not available:', error?.message || 'Unknown error');
  // Create mock objects for development
  RNIap = {
    initConnection: () => Promise.resolve(true),
    getProducts: () => Promise.resolve([]),
    getSubscriptions: () => Promise.resolve([]),
    requestSubscription: () => Promise.reject(new Error('IAP not available in development')),
    requestPurchase: () => Promise.reject(new Error('IAP not available in development')),
    getAvailablePurchases: () => Promise.resolve([]),
    endConnection: () => Promise.resolve(),
    flushFailedPurchasesCachedAsPendingAndroid: () => Promise.resolve(),
    clearTransactionIOS: () => Promise.resolve(),
    acknowledgePurchaseAndroid: () => Promise.resolve(),
    finishTransaction: () => Promise.resolve(),
    purchaseErrorListener: () => ({ remove: () => {} }),
    purchaseUpdatedListener: () => ({ remove: () => {} }),
    PurchaseStateAndroid: { PURCHASED: 1 },
  };
}

// Product IDs for your app
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.jung.premium.monthly',
  YEARLY: 'com.jung.premium.yearly', 
  WEEKLY: 'com.jung.premium.weekly',
  // Test product for development
  TEST: 'jungprosub'
};

export const CONSUMABLE_PRODUCTS = {
  PREMIUM_SESSIONS: 'com.jung.sessions.premium',
  UNLOCK_AVATARS: 'com.jung.avatars.unlock',
  // Test product for development
  TEST: 'Jung_Pro_Test' 
};

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  expirationDate: Date | null;
  isInGracePeriod: boolean;
  isInTrialPeriod: boolean;
}

class InAppPurchaseService {
  private isInitialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private availableProducts: IAPProduct[] = [];
  private availableSubscriptions: IAPSubscription[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!isIAPAvailable || !RNIap?.initConnection) {
        console.warn('⚠️ IAP not available - running in development mode');
        this.isInitialized = true;
        return;
      }

      const result = await RNIap.initConnection();
      console.log('✅ IAP Connection result:', result);
      
      if (Platform.OS === 'android') {
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      } else {
        await RNIap.clearTransactionIOS();
      }

      this.setupPurchaseListeners();
      await this.loadProducts();
      this.isInitialized = true;
    } catch (error: any) {
      console.warn('⚠️ IAP not available:', error?.message || error);
      // Always continue in development mode, IAP is expected to be unavailable
      if (__DEV__ || error?.message?.includes('E_IAP_NOT_AVAILABLE')) {
        console.log('📱 Running in development mode - IAP simulation active');
        this.isInitialized = true;
      } else {
        console.error('❌ Failed to initialize IAP in production:', error);
        throw error;
      }
    }
  }

  private setupPurchaseListeners(): void {
    if (!isIAPAvailable) return;

    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: IAPPurchase) => {
        console.log('Purchase updated:', purchase);
        
        try {
          if (purchase.purchaseStateAndroid === RNIap.PurchaseStateAndroid?.PURCHASED || 
              Platform.OS === 'ios') {
            await this.handleSuccessfulPurchase(purchase);
          }
        } catch (error) {
          console.error('Error handling purchase:', error);
        }
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: IAPPurchaseError) => {
        console.error('Purchase error:', error);
        this.handlePurchaseError(error);
      }
    );
  }

  private async loadProducts(): Promise<void> {
    if (!isIAPAvailable) return;

    try {
      const products = await RNIap.getProducts({ skus: Object.values(CONSUMABLE_PRODUCTS) });
      const subscriptions = await RNIap.getSubscriptions({ skus: Object.values(SUBSCRIPTION_PRODUCTS) });
      
      this.availableProducts = products;
      this.availableSubscriptions = subscriptions;
      
      console.log('Available products:', products);
      console.log('Available subscriptions:', subscriptions);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  private async handleSuccessfulPurchase(purchase: IAPPurchase): Promise<void> {
    try {
      // Store purchase info locally
      await AsyncStorage.setItem('lastPurchase', JSON.stringify(purchase));
      
      // Verify purchase with your backend (recommended)
      await this.verifyPurchaseWithBackend(purchase);
      
      // Acknowledge purchase
      if (Platform.OS === 'android' && purchase.purchaseToken) {
        await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
      } else {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      }
      
      // Update subscription status
      await this.updateSubscriptionStatus();
      
      Alert.alert(
        'Purchase Successful',
        'Thank you for your purchase! Premium features are now unlocked.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling successful purchase:', error);
    }
  }

  private async verifyPurchaseWithBackend(purchase: IAPPurchase): Promise<void> {
    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          receipt: purchase.transactionReceipt,
          productId: purchase.productId,
          platform: Platform.OS,
          transactionId: purchase.transactionId,
          purchaseToken: purchase.purchaseToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Purchase verification failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Purchase verified successfully:', result);
      
      // Store verification result
      await AsyncStorage.setItem('lastVerification', JSON.stringify({
        ...result,
        timestamp: Date.now(),
        productId: purchase.productId,
      }));
      
    } catch (error) {
      console.error('Backend verification failed:', error);
      // Don't throw error to allow offline functionality
      // Store unverified purchase for later verification
      await AsyncStorage.setItem('pendingVerification', JSON.stringify({
        purchase,
        timestamp: Date.now(),
      }));
    }
  }

  private handlePurchaseError(error: IAPPurchaseError): void {
    if (error.code === 'E_USER_CANCELLED') {
      console.log('Purchase cancelled by user');
      return;
    }
    
    Alert.alert(
      'Purchase Failed',
      error.message || 'An error occurred during purchase. Please try again.',
      [{ text: 'OK' }]
    );
  }

  async purchaseSubscription(productId: string): Promise<void> {
    try {
      await this.initialize();
      
      if (!isIAPAvailable || !RNIap?.requestSubscription) {
        Alert.alert(
          'Development Mode',
          'In-app purchases are not available in development. This will work in production builds.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await RNIap.requestSubscription({ sku: productId });
    } catch (error: any) {
      console.error('Failed to purchase subscription:', error);
      if (__DEV__) {
        Alert.alert(
          'Development Mode',
          `Purchase simulation for ${productId}. This will work in production builds.`,
          [{ text: 'OK' }]
        );
      } else {
        throw error;
      }
    }
  }

  async purchaseProduct(productId: string): Promise<void> {
    try {
      await this.initialize();
      
      if (!isIAPAvailable || !RNIap?.requestPurchase) {
        Alert.alert(
          'Development Mode',
          'In-app purchases are not available in development. This will work in production builds.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await RNIap.requestPurchase({ skus: [productId] });
    } catch (error: any) {
      console.error('Failed to purchase product:', error);
      if (__DEV__) {
        Alert.alert(
          'Development Mode',
          `Purchase simulation for ${productId}. This will work in production builds.`,
          [{ text: 'OK' }]
        );
      } else {
        throw error;
      }
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      await this.initialize();
      
      if (!isIAPAvailable || !RNIap?.getAvailablePurchases) {
        Alert.alert(
          'Development Mode',
          'Purchase restoration is not available in development.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (Platform.OS === 'ios') {
        const purchases = await RNIap.getAvailablePurchases();
        console.log('Restored purchases:', purchases);
        
        for (const purchase of purchases) {
          await this.handleSuccessfulPurchase(purchase);
        }
      } else {
        // Android restore logic
        const purchases = await RNIap.getAvailablePurchases();
        console.log('Available purchases:', purchases);
      }
      
      await this.updateSubscriptionStatus();
      
      Alert.alert(
        'Restore Complete',
        'Your purchases have been restored successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const storedStatus = await AsyncStorage.getItem('subscriptionStatus');
      if (storedStatus) {
        const status = JSON.parse(storedStatus);
        return {
          ...status,
          expirationDate: status.expirationDate ? new Date(status.expirationDate) : null,
        };
      }
    } catch (error) {
      console.error('Error getting subscription status:', error);
    }
    
    return {
      isActive: false,
      productId: null,
      expirationDate: null,
      isInGracePeriod: false,
      isInTrialPeriod: false,
    };
  }

  private async updateSubscriptionStatus(): Promise<void> {
    if (!isIAPAvailable) return;

    try {
      const purchases = await RNIap.getAvailablePurchases();
      const activeSubscription = purchases.find((purchase: IAPPurchase) => 
        Object.values(SUBSCRIPTION_PRODUCTS).includes(purchase.productId)
      );
      
      if (activeSubscription) {
        const status: SubscriptionStatus = {
          isActive: true,
          productId: activeSubscription.productId,
          expirationDate: new Date(activeSubscription.transactionDate + (30 * 24 * 60 * 60 * 1000)), // Placeholder logic
          isInGracePeriod: false,
          isInTrialPeriod: false,
        };
        
        await AsyncStorage.setItem('subscriptionStatus', JSON.stringify(status));
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }

  getAvailableProducts(): IAPProduct[] {
    return this.availableProducts;
  }

  getAvailableSubscriptions(): IAPSubscription[] {
    return this.availableSubscriptions;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      if (isIAPAvailable && RNIap?.endConnection) {
        await RNIap.endConnection();
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disconnecting IAP:', error);
    }
  }
}

export const inAppPurchaseService = new InAppPurchaseService();
