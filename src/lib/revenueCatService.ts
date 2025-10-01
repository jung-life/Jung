import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

// RevenueCat API Keys from environment variables
const REVENUECAT_APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '';
const REVENUECAT_GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '';

// Your entitlement identifier from RevenueCat dashboard
export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'premium';

// Global promise tracking to prevent simultaneous requests
let offeringsPromise: Promise<any> | null = null;
let customerInfoPromise: Promise<CustomerInfo> | null = null;

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

    // Check if running in Expo Go (which doesn't support RevenueCat)
    if (__DEV__ && typeof Purchases.configure === 'undefined') {
      console.warn('RevenueCat not available in Expo Go. Please use a development build.');
      this.initialized = true; // Mark as initialized to prevent further attempts
      return;
    }

    // Simulator detection for better testing experience
    const isSimulator = Platform.OS === 'ios' && __DEV__ &&
      (Platform.isPad === false && Platform.isTV === false);

    if (isSimulator) {
      console.log('📱 Running on iOS Simulator - StoreKit Configuration mode');
    }

    // Check if API keys are properly configured
    if (Platform.OS === 'ios' && (!REVENUECAT_APPLE_API_KEY || REVENUECAT_APPLE_API_KEY.includes('YourKeyHere'))) {
      console.warn('RevenueCat iOS API key not configured properly');
      if (__DEV__) {
        this.initialized = true;
        return;
      }
    }

    if (Platform.OS === 'android' && (!REVENUECAT_GOOGLE_API_KEY || REVENUECAT_GOOGLE_API_KEY.includes('YourKeyHere'))) {
      console.warn('RevenueCat Android API key not configured properly');
      if (__DEV__) {
        this.initialized = true;
        return;
      }
    }

    try {
      // Set log level to ERROR to suppress development warnings
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Configure RevenueCat based on platform
      if (Platform.OS === 'ios') {
        console.log('🔧 Configuring RevenueCat for iOS...');
        console.log('🔑 API Key:', REVENUECAT_APPLE_API_KEY ? 'Present' : 'MISSING');
        console.log('🆔 Entitlement ID:', ENTITLEMENT_ID);

        await Purchases.configure({
          apiKey: REVENUECAT_APPLE_API_KEY,
          appUserID: null, // Use anonymous ID
          observerMode: false, // Full RevenueCat mode
          userDefaultsSuiteName: null,
          useStoreKit2IfAvailable: false, // Use StoreKit 1 for better compatibility
          shouldShowInAppMessagesAutomatically: false // Disable development popups
        });
        console.log('✅ RevenueCat configured for iOS in production mode');

        // Test connection with error suppression
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          console.log('✅ RevenueCat connection successful');
        } catch (connectionError) {
          console.log('RevenueCat connection will retry automatically');
          // Don't throw error - let it fail gracefully to native IAP
        }

      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
        console.log('RevenueCat configured for Android');
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.log('RevenueCat initialization failed, will use native IAP fallback');
      // Mark as initialized to prevent further attempts, but don't throw error
      this.initialized = true;
      // Don't throw error - let the app gracefully fall back to native IAP
    }
  }

  /**
   * Check if RevenueCat is available (not in Expo Go)
   */
  private isRevenueCatAvailable(): boolean {
    return typeof Purchases.configure !== 'undefined';
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

    // Check if RevenueCat is initialized before attempting logout
    if (!this.initialized) {
      console.warn('RevenueCat not initialized - skipping logout');
      return;
    }

    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      // Handle specific RevenueCat errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('singleton instance') || error.message.includes('configuring-sdk')) {
          console.log('RevenueCat not configured for logout - this is normal in development');
          return;
        }
      }
      console.error('Failed to log out from RevenueCat:', error);
      // Don't throw error in development to prevent app crashes
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
      // Always return empty array in development to prevent blocking the app
      if (__DEV__) {
        console.warn('RevenueCat error suppressed in development mode');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get current offering with debouncing to prevent simultaneous requests
   */
  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!this.isRevenueCatAvailable()) {
      console.warn('RevenueCat not available - returning null offering');
      return null;
    }

    try {
      // If already loading offerings, return the existing promise
      if (offeringsPromise) {
        console.log('RevenueCat offerings request already in progress, waiting...');
        const offerings = await offeringsPromise;
        return offerings.current;
      }

      // Create new promise and store it
      offeringsPromise = Purchases.getOfferings();
      
      const offerings = await offeringsPromise;
      
      // Check if we have valid offerings
      if (!offerings || !offerings.current) {
        console.log('No RevenueCat offerings available, will use native IAP');
        return null;
      }
      
      return offerings.current;
    } catch (error) {
      // Handle specific RevenueCat errors
      if (error instanceof Error) {
        // Handle the "cancelled" error gracefully
        if (error.message.includes('Previous request was cancelled')) {
          console.log('RevenueCat offerings request was cancelled - this is normal behavior');
          return null;
        }
        
        // Handle offerings configuration errors
        if (error.message.includes('OfferingsManager.Error error 1') ||
            error.message.includes('could be fetched from App Store Connect')) {
          console.log('RevenueCat products not available, using native IAP fallback');
          return null;
        }
      }
      
      console.log('RevenueCat offerings failed, using native IAP fallback');
      return null;
    } finally {
      offeringsPromise = null;
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
