import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { creditService, CreditBalance, CreditTransaction, SubscriptionTier, CreditPackage } from '../lib/creditService';

export interface UseCreditsReturn {
  // Credit balance info
  creditBalance: CreditBalance | null;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Subscription tier info
  currentTier: SubscriptionTier | null;
  availableTiers: SubscriptionTier[];
  
  // Credit packages
  creditPackages: CreditPackage[];
  
  // Transaction history
  transactions: CreditTransaction[];
  
  // Helper functions
  hasCredits: (amount?: number) => boolean;
  canAfford: (credits: number) => boolean;
  
  // Actions
  refreshBalance: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  spendCredits: (amount: number, description?: string) => Promise<boolean>;
  
  // Error handling
  error: string | null;
}

export const useCredits = (): UseCreditsReturn => {
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [availableTiers, setAvailableTiers] = useState<SubscriptionTier[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if user has credits
  const hasCredits = useCallback((amount: number = 1): boolean => {
    return creditBalance ? creditBalance.currentBalance >= amount : false;
  }, [creditBalance]);

  // Alias for hasCredits for clearer intent
  const canAfford = useCallback((credits: number): boolean => {
    return hasCredits(credits);
  }, [hasCredits]);

  // Get current user ID
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user.id;
    } catch (error) {
      console.error('Error in getCurrentUserId:', error);
      return null;
    }
  }, []);

  // Refresh credit balance
  const refreshBalance = useCallback(async (): Promise<void> => {
    try {
      setRefreshing(true);
      setError(null);
      
      const userId = await getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const balance = await creditService.getCreditBalance(userId);
      setCreditBalance(balance);

      // If user has a subscription tier, fetch tier details
      if (balance?.subscriptionTierId) {
        const tiers = await creditService.getSubscriptionTiers();
        const userTier = tiers.find(tier => tier.id === balance.subscriptionTierId);
        setCurrentTier(userTier || null);
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Failed to refresh credit balance');
    } finally {
      setRefreshing(false);
    }
  }, [getCurrentUserId]);

  // Load subscription tiers and credit packages
  const loadTiersAndPackages = useCallback(async (): Promise<void> => {
    try {
      const [tiers, packages] = await Promise.all([
        creditService.getSubscriptionTiers(),
        creditService.getCreditPackages()
      ]);
      
      setAvailableTiers(tiers);
      setCreditPackages(packages);
    } catch (err) {
      console.error('Error loading tiers and packages:', err);
      setError('Failed to load subscription options');
    }
  }, []);

  // Load transaction history
  const loadTransactions = useCallback(async (): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const userTransactions = await creditService.getCreditTransactions(userId, 20);
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transaction history');
    }
  }, [getCurrentUserId]);

  // Spend credits function
  const spendCredits = useCallback(async (
    amount: number, 
    description?: string
  ): Promise<boolean> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return false;
      }

      const success = await creditService.spendCredits(
        userId,
        amount,
        'usage',
        null,
        description || `Spent ${amount} credits`
      );

      if (success) {
        // Refresh balance after spending
        await refreshBalance();
      } else {
        setError('Insufficient credits');
      }

      return success;
    } catch (err) {
      console.error('Error spending credits:', err);
      setError('Failed to spend credits');
      return false;
    }
  }, [getCurrentUserId, refreshBalance]);

  // Initialize data on mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          refreshBalance(),
          loadTiersAndPackages(),
          loadTransactions()
        ]);
      } catch (err) {
        console.error('Error initializing credit data:', err);
        if (isMounted) {
          setError('Failed to load credit information');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [refreshBalance, loadTiersAndPackages, loadTransactions]);

  // Set up real-time subscription for credit balance changes
  useEffect(() => {
    let subscription: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) return;

        subscription = supabase
          .channel(`user-credits-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_credits',
              filter: `user_id=eq.${userId}`
            },
            async (payload) => {
              console.log('Credit balance changed:', payload);
              await refreshBalance();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'credit_transactions',
              filter: `user_id=eq.${userId}`
            },
            async (payload) => {
              console.log('New credit transaction:', payload);
              await loadTransactions();
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [getCurrentUserId, refreshBalance, loadTransactions]);

  return {
    // State
    creditBalance,
    currentTier,
    availableTiers,
    creditPackages,
    transactions,
    loading,
    refreshing,
    error,
    
    // Helper functions
    hasCredits,
    canAfford,
    
    // Actions
    refreshBalance,
    loadTransactions,
    spendCredits,
  };
};

export default useCredits;
