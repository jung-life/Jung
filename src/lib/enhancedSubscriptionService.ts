import { supabase } from './supabase';
import { creditService } from './creditService';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  monthly_credits: number;
  max_rollover: number;
  price_cents: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price_cents: number;
  bonus_credits: number;
  total_credits: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  credits_allocated: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface UpgradeRecommendation {
  recommended_tier: string;
  reason: string;
  potential_savings: number;
  usage_pattern: string;
}

class EnhancedSubscriptionService {
  /**
   * Get all available subscription tiers
   */
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  /**
   * Analyze user's usage pattern and recommend subscription tier
   */
  async getUpgradeRecommendation(userId: string): Promise<UpgradeRecommendation | null> {
    try {
      // Get user's credit usage over the last 60 days
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('amount, created_at, transaction_type')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!transactions || transactions.length === 0) return null;

      // Calculate usage patterns
      const purchaseTransactions = transactions.filter(t => t.transaction_type === 'purchase');
      const usageTransactions = transactions.filter(t => t.transaction_type === 'usage');
      
      const totalPurchased = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalUsed = Math.abs(usageTransactions.reduce((sum, t) => sum + t.amount, 0));
      const monthlyUsage = totalUsed / 2; // Average over 2 months
      const monthlySpend = totalPurchased / 2;

      // Get subscription tiers for comparison
      const tiers = await this.getSubscriptionTiers();
      
      // Find optimal tier based on usage
      let recommendedTier: SubscriptionTier | null = null;
      let potentialSavings = 0;

      for (const tier of tiers) {
        if (tier.id === 'free') continue;
        
        const tierValue = tier.price_cents / 100; // Convert cents to dollars
        if (monthlyUsage <= tier.monthly_credits && monthlySpend > tierValue) {
          recommendedTier = tier;
          potentialSavings = monthlySpend - tierValue;
          break;
        }
      }

      if (!recommendedTier) return null;

      // Determine usage pattern
      let usagePattern = 'light';
      if (monthlyUsage > 200) usagePattern = 'heavy';
      else if (monthlyUsage > 100) usagePattern = 'moderate';

      // Determine reason
      let reason = 'Based on your usage pattern, a subscription could save you money';
      if (purchaseTransactions.length >= 2) {
        reason = 'You\'ve made multiple credit purchases - a subscription offers better value';
      }

      return {
        recommended_tier: recommendedTier.id,
        reason,
        potential_savings: Math.round(potentialSavings),
        usage_pattern: usagePattern
      };
    } catch (error) {
      console.error('Error analyzing upgrade recommendation:', error);
      return null;
    }
  }

  /**
   * Check if user should see upgrade prompt
   */
  async shouldShowUpgradePrompt(userId: string): Promise<boolean> {
    try {
      // Don't show if user already has an active subscription
      const subscription = await this.getUserSubscription(userId);
      if (subscription) return false;

      // Check if user has made multiple purchases recently
      const { data: recentPurchases, error } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('transaction_type', 'purchase')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      
      return (recentPurchases?.length || 0) >= 2;
    } catch (error) {
      console.error('Error checking upgrade prompt eligibility:', error);
      return false;
    }
  }

  /**
   * Create or update user subscription
   */
  async createSubscription(userId: string, tierId: string): Promise<UserSubscription> {
    try {
      const tier = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', tierId)
        .single();

      if (!tier.data) throw new Error('Subscription tier not found');

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const subscriptionData = {
        user_id: userId,
        tier_id: tierId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_date: periodEnd.toISOString(),
        credits_allocated: tier.data.monthly_credits,
        credits_used: 0
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Add credits to user's balance
      await creditService.addCredits(userId, tier.data.monthly_credits, 'subscription');

      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}

export const enhancedSubscriptionService = new EnhancedSubscriptionService();
