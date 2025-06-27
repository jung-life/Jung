import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

// RevenueCat API Keys from environment variables
const REVENUECAT_APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '';
const REVENUECAT_GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '';

// Your entitlement identifier from RevenueCat dashboard
export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'premium';

class RevenueCatService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    // Check if running in Expo Go or if RevenueCat is not available
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available. Running in Expo Go or native module not linked.');
      this.initialized = true; // Mark as initialized to prevent further attempts
      return;
    }

    // Check if API keys are configured
    if (!REVENUECAT_APPLE_API_KEY && !REVENUECAT_GOOGLE_API_KEY) {
      console.warn('RevenueCat API keys not configured. Skipping initialization.');
      this.initialized = true;
      return;
    }

    try {
      // Set log level for debugging (you can change this to LOG_LEVEL.ERROR for production)
      if (Purchases.setLogLevel) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      // Configure RevenueCat based on platform
      if (Platform.OS === 'ios' && REVENUECAT_APPLE_API_KEY) {
        console.log('Configuring RevenueCat for iOS...');
        await Purchases.configure({ apiKey: REVENUECAT_APPLE_API_KEY });
      } else if (Platform.OS === 'android' && REVENUECAT_GOOGLE_API_KEY) {
        console.log('Configuring RevenueCat for Android...');
        await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
        
        // For Amazon builds (uncomment if needed):
        // await Purchases.configure({ 
        //   apiKey: REVENUECAT_AMAZON_API_KEY, 
        //   useAmazon: true 
        // });
      } else {
        console.warn(`No RevenueCat API key configured for platform: ${Platform.OS}`);
        this.initialized = true;
        return;
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      // Always mark as initialized to prevent repeated attempts
      this.initialized = true;
      
      // Don't throw error to prevent app crashes
      if (__DEV__) {
        console.warn('RevenueCat initialization failed in development. Continuing without RevenueCat functionality.');
      } else {
        console.error('RevenueCat initialization failed in production. Continuing without subscription features.');
      }
    }
  }

  /**
   * Check if RevenueCat is available (not in Expo Go)
   */
  private isRevenueCatAvailable(): boolean {
    try {
      return typeof Purchases !== 'undefined' && 
             typeof Purchases.configure !== 'undefined' &&
             Purchases.configure !== null;
    } catch (error) {
      console.warn('Error checking RevenueCat availability:', error);
      return false;
    }
  }

  /**
   * Identify user with RevenueCat
   */
  async identifyUser(userId: string): Promise<void> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - running in Expo Go');
      return;
    }

    try {
      await Purchases.logIn(userId);
      console.log('User identified with RevenueCat:', userId);
    } catch (error) {
      console.error('Failed to identify user with RevenueCat:', error);
      if (!__DEV__) throw error;
    }
  }

  /**
   * Log out current user
   */
  async logOut(): Promise<void> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - running in Expo Go');
      return;
    }

    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
      if (!__DEV__) throw error;
    }
  }

  /**
   * Get current customer info and subscription status
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - running in Expo Go');
      // Return mock customer info for development
      return {} as CustomerInfo;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      if (__DEV__) {
        return {} as CustomerInfo;
      }
      throw error;
    }
  }

  /**
   * Check if user has active subscription to specified entitlement
   */
  async isUserSubscribed(entitlementId: string = ENTITLEMENT_ID): Promise<boolean> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - returning false for subscription status');
      return false;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo.entitlements) return false;
      
      const isSubscribed = typeof customerInfo.entitlements.active?.[entitlementId] !== 'undefined';
      console.log(`User subscription status for ${entitlementId}:`, isSubscribed);
      return isSubscribed;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get available offerings (products/paywalls)
   */
  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - returning empty offerings');
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      if (__DEV__) return [];
      throw error;
    }
  }

  /**
   * Get current offering
   */
  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - returning null offering');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get current offering:', error);
      return null;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - purchase not possible in Expo Go');
      throw new Error('RevenueCat not available in development environment');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('Purchase successful:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - restore not possible in Expo Go');
      return {} as CustomerInfo;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      if (__DEV__) return {} as CustomerInfo;
      throw error;
    }
  }

  /**
   * Get user's subscription expiration date
   */
  async getSubscriptionExpirationDate(entitlementId: string = ENTITLEMENT_ID): Promise<Date | null> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[entitlementId];
      
      if (entitlement && entitlement.expirationDate) {
        return new Date(entitlement.expirationDate);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get subscription expiration date:', error);
      return null;
    }
  }

  /**
   * Check if subscription is in trial period
   */
  async isInTrialPeriod(entitlementId: string = ENTITLEMENT_ID): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[entitlementId];
      
      if (entitlement) {
        // Check if the product identifier contains 'trial' or check the period type
        return entitlement.periodType === 'TRIAL' || entitlement.productIdentifier.toLowerCase().includes('trial');
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check trial period status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService;
