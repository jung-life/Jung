import { useState, useEffect } from 'react';
import { enhancedSubscriptionService, SubscriptionTier, UserSubscription, UpgradeRecommendation } from '../lib/enhancedSubscriptionService';
import { useAuth } from './useAuth';

export interface UseHybridSubscriptionReturn {
  // Subscription data
  subscriptionTiers: SubscriptionTier[];
  currentSubscription: UserSubscription | null;
  
  // Recommendation system
  upgradeRecommendation: UpgradeRecommendation | null;
  shouldShowUpgradePrompt: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingRecommendation: boolean;
  
  // Actions
  createSubscription: (tierId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshData: () => Promise<void>;
  dismissUpgradePrompt: () => void;
}

export function useHybridSubscription(): UseHybridSubscriptionReturn {
  const { user } = useAuth();
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [upgradeRecommendation, setUpgradeRecommendation] = useState<UpgradeRecommendation | null>(null);
  const [shouldShowUpgradePrompt, setShouldShowUpgradePrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch tiers and current subscription in parallel
      const [tiers, subscription] = await Promise.all([
        enhancedSubscriptionService.getSubscriptionTiers(),
        enhancedSubscriptionService.getUserSubscription(user.id)
      ]);
      
      setSubscriptionTiers(tiers);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch upgrade recommendation
  const fetchUpgradeRecommendation = async () => {
    if (!user?.id || currentSubscription) return;
    
    try {
      setIsLoadingRecommendation(true);
      
      const [recommendation, shouldShow] = await Promise.all([
        enhancedSubscriptionService.getUpgradeRecommendation(user.id),
        enhancedSubscriptionService.shouldShowUpgradePrompt(user.id)
      ]);
      
      setUpgradeRecommendation(recommendation);
      setShouldShowUpgradePrompt(shouldShow);
    } catch (error) {
      console.error('Error fetching upgrade recommendation:', error);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  // Create subscription
  const createSubscription = async (tierId: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const subscription = await enhancedSubscriptionService.createSubscription(user.id, tierId);
      setCurrentSubscription(subscription);
      setShouldShowUpgradePrompt(false);
      setUpgradeRecommendation(null);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      await enhancedSubscriptionService.cancelSubscription(user.id);
      setCurrentSubscription(null);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchSubscriptionData();
    await fetchUpgradeRecommendation();
  };

  // Dismiss upgrade prompt
  const dismissUpgradePrompt = () => {
    setShouldShowUpgradePrompt(false);
  };

  // Effects
  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.id]);

  useEffect(() => {
    fetchUpgradeRecommendation();
  }, [user?.id, currentSubscription]);

  return {
    subscriptionTiers,
    currentSubscription,
    upgradeRecommendation,
    shouldShowUpgradePrompt,
    isLoading,
    isLoadingRecommendation,
    createSubscription,
    cancelSubscription,
    refreshData,
    dismissUpgradePrompt
  };
}