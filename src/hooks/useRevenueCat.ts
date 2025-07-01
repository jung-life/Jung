import { useState, useEffect, useCallback } from 'react';
import { revenueCatService, ENTITLEMENT_ID } from '../lib/revenueCatService';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// Global promise tracking to prevent simultaneous requests
let currentOfferingPromise: Promise<PurchasesOffering | null> | null = null;

interface UseRevenueCatReturn {
  // Subscription status
  isSubscribed: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  
  // Subscription details
  expirationDate: Date | null;
  isInTrialPeriod: boolean;
  
  // Offerings and products
  currentOffering: PurchasesOffering | null;
  
  // Actions
  checkSubscriptionStatus: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  
  // Error handling
  error: string | null;
}

export const useRevenueCat = (entitlementId: string = ENTITLEMENT_ID): UseRevenueCatReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check subscription status and update all related state
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get customer info
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);

      // Check subscription status
      const subscribed = await revenueCatService.isUserSubscribed(entitlementId);
      setIsSubscribed(subscribed);

      // Get expiration date
      const expDate = await revenueCatService.getSubscriptionExpirationDate(entitlementId);
      setExpirationDate(expDate);

      // Check trial period
      const inTrial = await revenueCatService.isInTrialPeriod(entitlementId);
      setIsInTrialPeriod(inTrial);

      console.log('RevenueCat status updated:', {
        subscribed,
        expirationDate: expDate,
        inTrial
      });
    } catch (err) {
      console.error('Failed to check subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [entitlementId]);

  // Get current offering with debouncing to prevent simultaneous requests
  const fetchCurrentOffering = useCallback(async () => {
    try {
      // If already loading, return the existing promise
      if (currentOfferingPromise) {
        console.log('RevenueCat offering request already in progress, waiting...');
        const offering = await currentOfferingPromise;
        setCurrentOffering(offering);
        return;
      }

      currentOfferingPromise = revenueCatService.getCurrentOffering();
      
      const offering = await currentOfferingPromise;
      setCurrentOffering(offering);
    } catch (err) {
      // Handle the "cancelled" error gracefully
      if (err instanceof Error && err.message.includes('Previous request was cancelled')) {
        console.log('RevenueCat offering request was cancelled - this is normal behavior');
        return;
      }
      console.error('Failed to fetch current offering:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
    } finally {
      currentOfferingPromise = null;
    }
  }, []);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);

      // Refresh subscription status after purchase
      await checkSubscriptionStatus();

      return true;
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkSubscriptionStatus]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const customerInfo = await revenueCatService.restorePurchases();
      setCustomerInfo(customerInfo);

      // Refresh subscription status after restore
      await checkSubscriptionStatus();

      return true;
    } catch (err) {
      console.error('Restore purchases failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkSubscriptionStatus]);

  // Initial load
  useEffect(() => {
    checkSubscriptionStatus();
    fetchCurrentOffering();
  }, [checkSubscriptionStatus, fetchCurrentOffering]);

  return {
    // Subscription status
    isSubscribed,
    isLoading,
    customerInfo,
    
    // Subscription details
    expirationDate,
    isInTrialPeriod,
    
    // Offerings and products
    currentOffering,
    
    // Actions
    checkSubscriptionStatus,
    purchasePackage,
    restorePurchases,
    
    // Error handling
    error
  };
};

export default useRevenueCat;
