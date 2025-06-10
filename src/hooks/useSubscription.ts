import { useState, useEffect, useCallback } from 'react';
import { inAppPurchaseService, SubscriptionStatus } from '../lib/inAppPurchaseService';

export const useSubscription = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSubscription = useCallback(async () => {
    try {
      await inAppPurchaseService.initialize();
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
  };
};

export default useSubscription;
