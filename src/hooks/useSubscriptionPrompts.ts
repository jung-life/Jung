import { useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';
import * as secureStore from '../lib/secureStorage';

interface PromptStrategy {
  showConversationLimit: boolean;
  showAnalyticsUpgrade: boolean;
  showExportPrompt: boolean;
  showInsightsTeaser: boolean;
  showMainCTA: boolean;
  conversationCount: number;
  lastPromptShown: string | null;
}

export const useSubscriptionPrompts = () => {
  const { isPremiumUser } = useSubscription();
  const [strategy, setStrategy] = useState<PromptStrategy>({
    showConversationLimit: false,
    showAnalyticsUpgrade: false,
    showExportPrompt: false,
    showInsightsTeaser: false,
    showMainCTA: false,
    conversationCount: 0,
    lastPromptShown: null,
  });

  useEffect(() => {
    loadPromptStrategy();
  }, []);

  const loadPromptStrategy = async () => {
    try {
      const conversationCount = await getConversationCount();
      const lastPromptShown = await secureStore.getItem('lastPromptShown');
      const lastPromptDate = await secureStore.getItem('lastPromptDate');

      // Don't show prompts to premium users
      if (isPremiumUser) {
        setStrategy(prev => ({
          ...prev,
          showConversationLimit: false,
          showAnalyticsUpgrade: false,
          showExportPrompt: false,
          showInsightsTeaser: false,
          showMainCTA: false,
        }));
        return;
      }

      // Strategic prompt timing
      const now = new Date().getTime();
      const lastShown = lastPromptDate ? parseInt(lastPromptDate) : 0;
      const hoursSinceLastPrompt = (now - lastShown) / (1000 * 60 * 60);

      setStrategy({
        // Show conversation limit after 3 conversations
        showConversationLimit: conversationCount >= 3 && hoursSinceLastPrompt > 2,

        // Show analytics upgrade when user visits analytics screen
        showAnalyticsUpgrade: conversationCount >= 2,

        // Show export prompt after user has some conversations to export
        showExportPrompt: conversationCount >= 5,

        // Show insights teaser to engaged users
        showInsightsTeaser: conversationCount >= 4,

        // Show main CTA after significant usage
        showMainCTA: conversationCount >= 1 && hoursSinceLastPrompt > 24,

        conversationCount,
        lastPromptShown,
      });

    } catch (error) {
      console.error('Error loading prompt strategy:', error);
    }
  };

  const getConversationCount = async (): Promise<number> => {
    try {
      const countStr = await secureStore.getItem('userConversationCount');
      return countStr ? parseInt(countStr) : 0;
    } catch (error) {
      console.error('Error getting conversation count:', error);
      return 0;
    }
  };

  const incrementConversationCount = async () => {
    try {
      const current = await getConversationCount();
      const newCount = current + 1;
      await secureStore.saveItem('userConversationCount', newCount.toString());
      setStrategy(prev => ({ ...prev, conversationCount: newCount }));

      // Trigger strategy recalculation
      await loadPromptStrategy();
    } catch (error) {
      console.error('Error incrementing conversation count:', error);
    }
  };

  const recordPromptShown = async (promptType: string) => {
    try {
      await secureStore.saveItem('lastPromptShown', promptType);
      await secureStore.saveItem('lastPromptDate', new Date().getTime().toString());
      setStrategy(prev => ({ ...prev, lastPromptShown: promptType }));
    } catch (error) {
      console.error('Error recording prompt shown:', error);
    }
  };

  const shouldShowPrompt = (promptType: keyof PromptStrategy): boolean => {
    if (isPremiumUser) return false;

    switch (promptType) {
      case 'showConversationLimit':
        return strategy.showConversationLimit;
      case 'showAnalyticsUpgrade':
        return strategy.showAnalyticsUpgrade;
      case 'showExportPrompt':
        return strategy.showExportPrompt;
      case 'showInsightsTeaser':
        return strategy.showInsightsTeaser;
      case 'showMainCTA':
        return strategy.showMainCTA;
      default:
        return false;
    }
  };

  return {
    strategy,
    shouldShowPrompt,
    incrementConversationCount,
    recordPromptShown,
    conversationCount: strategy.conversationCount,
    isPremiumUser,
  };
};