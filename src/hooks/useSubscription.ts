import { useState, useEffect, useCallback } from 'react';
import { inAppPurchaseService, SubscriptionStatus } from '../lib/inAppPurchaseService';
import { revenueCatService } from '../lib/revenueCatService';

export const useSubscription = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevenueCatAvailable, setIsRevenueCatAvailable] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try RevenueCat first (Primary system)
      try {
        const revenueCatSubscribed = await revenueCatService.isUserSubscribed();
        if (revenueCatSubscribed !== undefined) {
          console.log('✅ Using RevenueCat for subscription management');
          setIsRevenueCatAvailable(true);
          setSubscriptionStatus({
            isActive: revenueCatSubscribed,
            expirationDate: await revenueCatService.getSubscriptionExpirationDate(),
            productId: 'premium',
            isTrialPeriod: await revenueCatService.isInTrialPeriod(),
          });
          return;
        }
      } catch (revenueCatError) {
        console.log('⚠️ RevenueCat unavailable, falling back to native IAP');
      }

      // Fallback to native IAP service
      console.log('🛡️ Using native IAP as fallback');
      setIsRevenueCatAvailable(false);
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
      // Set default free user status on error
      setSubscriptionStatus({
        isActive: false,
        expirationDate: null,
        productId: null,
        isTrialPeriod: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSubscription = useCallback(async () => {
    try {
      // Try to initialize both services
      await Promise.all([
        revenueCatService.initialize().catch(e => console.warn('RevenueCat init failed:', e)),
        inAppPurchaseService.initialize().catch(e => console.warn('InAppPurchase init failed:', e))
      ]);

      await checkSubscriptionStatus();
    } catch (err) {
      console.error('Error initializing subscription:', err);
      setError('Failed to initialize subscription service');
      setLoading(false);
    }
  }, [checkSubscriptionStatus]);

  useEffect(() => {
    initializeSubscription();
  }, [initializeSubscription]);

  const isSubscriptionActive = subscriptionStatus?.isActive || false;
  const isPremiumUser = isSubscriptionActive;

  return {
    subscriptionStatus,
    loading,
    error,
    isSubscriptionActive,
    isPremiumUser,
    checkSubscriptionStatus,
    initializeSubscription,
    isRevenueCatAvailable,
  };
};

export default useSubscription;
