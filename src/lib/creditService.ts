import { supabase } from './supabase';

export interface CreditBalance {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalPurchased: number;
  subscriptionTierId: string | null;
  lastMonthlyGrant: string | null;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  transactionType: 'earned' | 'spent' | 'purchased' | 'granted' | 'expired' | 'refunded';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  sourceType: 'subscription' | 'purchase' | 'usage' | 'promotion' | 'refund' | 'migration' | 'monthly_grant';
  sourceId: string | null;
  description: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string | null;
  monthlyCredits: number;
  maxRollover: number;
  priceCents: number;
  features: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
  bonusCredits: number;
  totalCredits: number;
  isActive: boolean;
  sortOrder: number;
}

export interface MessageCost {
  id: string;
  messageId: string;
  userId: string;
  conversationId: string | null;
  avatarId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsCharged: number;
  apiCostCents: number;
  provider: string;
  modelName: string;
  createdAt: string;
}

export interface CreditUsageStats {
  totalMessages: number;
  totalCreditsUsed: number;
  averageCreditsPerMessage: number;
  totalApiCostCents: number;
  mostUsedAvatar: string;
  mostUsedProvider: string;
  usageByDay: Array<{
    date: string;
    credits: number;
    messages: number;
  }>;
  usageByAvatar: Array<{
    avatarId: string;
    credits: number;
    messages: number;
  }>;
}

class CreditService {
  /**
   * Get user's current credit balance and details
   */
  async getCreditBalance(userId: string): Promise<CreditBalance | null> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found - create initial credit record for user
        console.log('No credit record found for user, initializing...');
        const initialized = await this.initializeUserCredits(userId);
        if (initialized) {
          return await this.getCreditBalance(userId);
        }
        return null;
      }

      if (error) {
        console.error('Error fetching credit balance:', error);
        return null;
      }

      if (!data) {
        // Create initial credit record for user
        await this.initializeUserCredits(userId);
        return await this.getCreditBalance(userId);
      }

      return {
        userId: data.user_id,
        currentBalance: data.current_balance,
        totalEarned: data.total_earned,
        totalSpent: data.total_spent,
        totalPurchased: data.total_purchased,
        subscriptionTierId: data.subscription_tier_id,
        lastMonthlyGrant: data.last_monthly_grant,
      };
    } catch (error) {
      console.error('Error in getCreditBalance:', error);
      return null;
    }
  }

  /**
   * Check if user has sufficient credits for an operation
   */
  async hasSufficientCredits(userId: string, requiredCredits: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('has_sufficient_credits', {
          user_uuid: userId,
          required_credits: requiredCredits
        });

      if (error) {
        console.error('Error checking sufficient credits:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in hasSufficientCredits:', error);
      return false;
    }
  }

  /**
   * Spend credits for a message/operation
   */
  async spendCredits(
    userId: string,
    creditsToSpend: number,
    sourceType: string = 'usage',
    sourceId: string | null = null,
    description: string | null = null
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('spend_credits', {
          user_uuid: userId,
          credits_to_spend: creditsToSpend,
          source_type_param: sourceType,
          source_id_param: sourceId,
          description_param: description
        });

      if (error) {
        console.error('Error spending credits:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in spendCredits:', error);
      return false;
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(
    userId: string,
    creditsToAdd: number,
    transactionType: string = 'granted',
    sourceType: string = 'promotion',
    sourceId: string | null = null,
    description: string | null = null
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('add_credits', {
          user_uuid: userId,
          credits_to_add: creditsToAdd,
          transaction_type_param: transactionType,
          source_type_param: sourceType,
          source_id_param: sourceId,
          description_param: description
        });

      if (error) {
        console.error('Error adding credits:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in addCredits:', error);
      return false;
    }
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching credit transactions:', error);
        return [];
      }

      return data.map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        transactionType: transaction.transaction_type,
        amount: transaction.amount,
        balanceBefore: transaction.balance_before,
        balanceAfter: transaction.balance_after,
        sourceType: transaction.source_type,
        sourceId: transaction.source_id,
        description: transaction.description,
        metadata: transaction.metadata || {},
        createdAt: transaction.created_at,
      }));
    } catch (error) {
      console.error('Error in getCreditTransactions:', error);
      return [];
    }
  }

  /**
   * Get available subscription tiers
   */
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching subscription tiers:', error);
        return [];
      }

      return data.map(tier => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        monthlyCredits: tier.monthly_credits,
        maxRollover: tier.max_rollover,
        priceCents: tier.price_cents,
        features: tier.features || {},
        isActive: tier.is_active,
        sortOrder: tier.sort_order,
      }));
    } catch (error) {
      console.error('Error in getSubscriptionTiers:', error);
      return [];
    }
  }

  /**
   * Get available credit packages
   */
  async getCreditPackages(): Promise<CreditPackage[]> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching credit packages:', error);
        return [];
      }

      return data.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        credits: pkg.credits,
        priceCents: pkg.price_cents,
        bonusCredits: pkg.bonus_credits,
        totalCredits: pkg.total_credits,
        isActive: pkg.is_active,
        sortOrder: pkg.sort_order,
      }));
    } catch (error) {
      console.error('Error in getCreditPackages:', error);
      return [];
    }
  }

  /**
   * Record message cost for analytics
   */
  async recordMessageCost(
    messageId: string,
    userId: string,
    conversationId: string | null,
    avatarId: string,
    inputTokens: number = 0,
    outputTokens: number = 0,
    creditsCharged: number = 1,
    apiCostCents: number = 0,
    provider: string = 'claude',
    modelName: string = 'claude-3-5-sonnet'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_costs')
        .insert({
          message_id: messageId,
          user_id: userId,
          conversation_id: conversationId,
          avatar_id: avatarId,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          credits_charged: creditsCharged,
          api_cost_cents: apiCostCents,
          provider,
          model_name: modelName,
        });

      if (error) {
        console.error('Error recording message cost:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordMessageCost:', error);
      return false;
    }
  }

  /**
   * Get user's credit usage statistics
   */
  async getCreditUsageStats(
    userId: string,
    daysBack: number = 30
  ): Promise<CreditUsageStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('message_costs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usage stats:', error);
        return this.getEmptyUsageStats();
      }

      if (!data || data.length === 0) {
        return this.getEmptyUsageStats();
      }

      const totalMessages = data.length;
      const totalCreditsUsed = data.reduce((sum, msg) => sum + msg.credits_charged, 0);
      const totalApiCostCents = data.reduce((sum, msg) => sum + msg.api_cost_cents, 0);
      const averageCreditsPerMessage = totalMessages > 0 ? totalCreditsUsed / totalMessages : 0;

      // Most used avatar
      const avatarUsage = data.reduce((acc, msg) => {
        acc[msg.avatar_id] = (acc[msg.avatar_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostUsedAvatar = Object.keys(avatarUsage).reduce((a, b) => 
        avatarUsage[a] > avatarUsage[b] ? a : b, ''
      );

      // Most used provider
      const providerUsage = data.reduce((acc, msg) => {
        acc[msg.provider] = (acc[msg.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostUsedProvider = Object.keys(providerUsage).reduce((a, b) => 
        providerUsage[a] > providerUsage[b] ? a : b, ''
      );

      // Usage by day
      const usageByDay = data.reduce((acc, msg) => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { credits: 0, messages: 0 };
        }
        acc[date].credits += msg.credits_charged;
        acc[date].messages += 1;
        return acc;
      }, {} as Record<string, { credits: number; messages: number }>);

      // Usage by avatar
      const usageByAvatarData = data.reduce((acc, msg) => {
        if (!acc[msg.avatar_id]) {
          acc[msg.avatar_id] = { credits: 0, messages: 0 };
        }
        acc[msg.avatar_id].credits += msg.credits_charged;
        acc[msg.avatar_id].messages += 1;
        return acc;
      }, {} as Record<string, { credits: number; messages: number }>);

      return {
        totalMessages,
        totalCreditsUsed,
        averageCreditsPerMessage,
        totalApiCostCents,
        mostUsedAvatar,
        mostUsedProvider,
        usageByDay: Object.entries(usageByDay).map(([date, stats]) => ({
          date,
          credits: (stats as { credits: number; messages: number }).credits,
          messages: (stats as { credits: number; messages: number }).messages,
        })),
        usageByAvatar: Object.entries(usageByAvatarData).map(([avatarId, stats]) => ({
          avatarId,
          credits: (stats as { credits: number; messages: number }).credits,
          messages: (stats as { credits: number; messages: number }).messages,
        })),
      };
    } catch (error) {
      console.error('Error in getCreditUsageStats:', error);
      return this.getEmptyUsageStats();
    }
  }

  /**
   * Initialize user credits (called for new users)
   */
  async initializeUserCredits(userId: string, tierId: string = 'free'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          current_balance: 10, // Free tier starting credits
          subscription_tier_id: tierId,
        });

      if (error) {
        console.error('Error initializing user credits:', error);
        return false;
      }

      // Log the initialization transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'granted',
          amount: 10,
          balance_before: 0,
          balance_after: 10,
          source_type: 'migration',
          source_id: tierId,
          description: 'Welcome credits for new user',
        });

      return true;
    } catch (error) {
      console.error('Error in initializeUserCredits:', error);
      return false;
    }
  }

  /**
   * Update user's subscription tier
   */
  async updateSubscriptionTier(userId: string, tierId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ subscription_tier_id: tierId })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription tier:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubscriptionTier:', error);
      return false;
    }
  }

  /**
   * Process a credit purchase
   */
  async processCreditPurchase(
    userId: string,
    packageId: string,
    purchaseToken: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // Get package details
      const { data: packageData, error: packageError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError || !packageData) {
        console.error('Error fetching package details:', packageError);
        return false;
      }

      // Add credits to user account
      const success = await this.addCredits(
        userId,
        packageData.total_credits,
        'purchased',
        'purchase',
        transactionId,
        `Purchased ${packageData.name} - ${packageData.total_credits} credits`
      );

      if (success) {
        // Update purchase count using raw SQL
        await supabase
          .from('user_credits')
          .update({
            total_purchased: packageData.total_credits
          })
          .eq('user_id', userId);
      }

      return success;
    } catch (error) {
      console.error('Error in processCreditPurchase:', error);
      return false;
    }
  }

  private getEmptyUsageStats(): CreditUsageStats {
    return {
      totalMessages: 0,
      totalCreditsUsed: 0,
      averageCreditsPerMessage: 0,
      totalApiCostCents: 0,
      mostUsedAvatar: '',
      mostUsedProvider: '',
      usageByDay: [],
      usageByAvatar: [],
    };
  }
}

export const creditService = new CreditService();
