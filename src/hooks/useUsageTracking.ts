import { useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';
import * as secureStore from '../lib/secureStorage';

interface UsageStats {
  conversationsThisMonth: number;
  messagesThisWeek: number;
  lastActiveDate: string | null;
  totalSessionTime: number; // in minutes
  featuresUsed: string[];
  conversationsToday: number;
  lastResetDate: string | null;
}

// Free user limits
const FREE_USER_LIMITS = {
  conversationsPerDay: 5,
  conversationsPerMonth: 10,
  messagesPerWeek: 20,
  premiumFeatures: 3
};

export const useUsageTracking = () => {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    conversationsThisMonth: 0,
    messagesThisWeek: 0,
    lastActiveDate: null,
    totalSessionTime: 0,
    featuresUsed: [],
    conversationsToday: 0,
    lastResetDate: null
  });

  const { isPremiumUser } = useSubscription();

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await secureStore.getItem('usageStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        // Reset daily counters if it's a new day
        const today = new Date().toDateString();
        const lastReset = parsedStats.lastResetDate;

        if (lastReset !== today) {
          parsedStats.conversationsToday = 0;
          parsedStats.lastResetDate = today;
        }

        setUsageStats(parsedStats);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const saveUsageStats = async (newStats: UsageStats) => {
    try {
      await secureStore.saveItem('usageStats', JSON.stringify(newStats));
      setUsageStats(newStats);
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  };

  const trackConversation = async () => {
    const now = new Date();
    const today = now.toDateString();

    const newStats = {
      ...usageStats,
      conversationsThisMonth: usageStats.conversationsThisMonth + 1,
      conversationsToday: usageStats.conversationsToday + 1,
      lastActiveDate: now.toISOString(),
      lastResetDate: today
    };

    await saveUsageStats(newStats);
  };

  const trackMessage = async () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

    const newStats = {
      ...usageStats,
      messagesThisWeek: usageStats.messagesThisWeek + 1,
      lastActiveDate: new Date().toISOString()
    };

    await saveUsageStats(newStats);
  };

  const trackFeatureUsage = async (feature: string) => {
    const featuresUsed = [...new Set([...usageStats.featuresUsed, feature])];

    const newStats = {
      ...usageStats,
      featuresUsed,
      lastActiveDate: new Date().toISOString()
    };

    await saveUsageStats(newStats);
  };

  const trackSessionTime = async (minutes: number) => {
    const newStats = {
      ...usageStats,
      totalSessionTime: usageStats.totalSessionTime + minutes,
      lastActiveDate: new Date().toISOString()
    };

    await saveUsageStats(newStats);
  };

  const resetMonthlyStats = async () => {
    const newStats = {
      ...usageStats,
      conversationsThisMonth: 0,
      messagesThisWeek: 0
    };

    await saveUsageStats(newStats);
  };

  // Check if user has reached limits
  const checkLimits = () => {
    if (isPremiumUser) {
      return {
        canStartConversation: true,
        canSendMessage: true,
        canUseFeature: true,
        limitReached: null
      };
    }

    return {
      canStartConversation: usageStats.conversationsToday < FREE_USER_LIMITS.conversationsPerDay &&
                           usageStats.conversationsThisMonth < FREE_USER_LIMITS.conversationsPerMonth,
      canSendMessage: usageStats.messagesThisWeek < FREE_USER_LIMITS.messagesPerWeek,
      canUseFeature: usageStats.featuresUsed.length < FREE_USER_LIMITS.premiumFeatures,
      limitReached: usageStats.conversationsToday >= FREE_USER_LIMITS.conversationsPerDay ? 'daily' :
                   usageStats.conversationsThisMonth >= FREE_USER_LIMITS.conversationsPerMonth ? 'monthly' :
                   usageStats.messagesThisWeek >= FREE_USER_LIMITS.messagesPerWeek ? 'weekly' : null
    };
  };

  const getUsageSummary = () => {
    const totalFeatures = usageStats.featuresUsed.length;
    const averageSessionLength = usageStats.conversationsThisMonth > 0
      ? usageStats.totalSessionTime / usageStats.conversationsThisMonth
      : 0;

    const limits = checkLimits();

    return {
      isActiveUser: usageStats.conversationsThisMonth > 5,
      isHeavyUser: usageStats.messagesThisWeek > 20,
      engagementLevel: totalFeatures > 5 ? 'high' : totalFeatures > 2 ? 'medium' : 'low',
      averageSessionLength: Math.round(averageSessionLength),
      shouldUpgrade: !isPremiumUser && (usageStats.conversationsThisMonth > 8 || usageStats.messagesThisWeek > 15),
      ...limits
    };
  };

  return {
    usageStats,
    trackConversation,
    trackMessage,
    trackFeatureUsage,
    trackSessionTime,
    resetMonthlyStats,
    getUsageSummary,
    checkLimits,
    isPremiumUser,
    FREE_USER_LIMITS
  };
};