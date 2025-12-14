// Cache Management Service for Jung Therapeutic AI
// Handles cache invalidation policies, TTL management, and performance optimization

import { supabase } from './supabase';
import { cacheService } from './cacheService';
import { kvCacheService } from './kvCacheService';

export interface CacheInvalidationPolicy {
  name: string;
  triggers: InvalidationTrigger[];
  scope: 'user' | 'global' | 'session';
  cascadeToKV: boolean;
}

export interface InvalidationTrigger {
  event: 'user_update' | 'pattern_change' | 'session_end' | 'time_based' | 'manual';
  condition?: string;
  delay?: number; // milliseconds
}

export interface CacheManagementStats {
  totalCacheSize: number;
  responseCacheStats: any;
  kvCacheStats: any;
  invalidationEvents: number;
  performanceMetrics: {
    hitRate: number;
    avgResponseTime: number;
    costSavings: number;
  };
}

class CacheManager {
  private readonly policies: CacheInvalidationPolicy[] = [
    {
      name: 'session_end_cleanup',
      triggers: [{ event: 'session_end' }],
      scope: 'session',
      cascadeToKV: true
    },
    {
      name: 'user_pattern_change',
      triggers: [{ event: 'pattern_change', delay: 300000 }], // 5 min delay
      scope: 'user',
      cascadeToKV: false
    },
    {
      name: 'daily_cleanup',
      triggers: [{ event: 'time_based' }],
      scope: 'global',
      cascadeToKV: true
    },
    {
      name: 'user_profile_update',
      triggers: [{ event: 'user_update', delay: 60000 }], // 1 min delay
      scope: 'user',
      cascadeToKV: true
    }
  ];

  private invalidationMetrics: { [key: string]: number } = {};
  private performanceMetrics: { [key: string]: any } = {};

  // Main cache invalidation orchestrator
  async invalidateCache(
    trigger: InvalidationTrigger,
    userId?: string,
    sessionId?: string,
    metadata?: any
  ): Promise<{ responseCache: number; kvCache: number }> {
    console.log(`🗑️ Cache invalidation triggered: ${trigger.event}`, { userId, sessionId, metadata });

    const applicablePolicies = this.policies.filter(policy =>
      policy.triggers.some(t => t.event === trigger.event)
    );

    let totalResponseInvalidated = 0;
    let totalKVInvalidated = 0;

    for (const policy of applicablePolicies) {
      const policyTrigger = policy.triggers.find(t => t.event === trigger.event);

      if (policyTrigger?.delay) {
        // Delayed invalidation
        setTimeout(async () => {
          await this.executePolicyInvalidation(policy, userId, sessionId, metadata);
        }, policyTrigger.delay);
        continue;
      }

      const result = await this.executePolicyInvalidation(policy, userId, sessionId, metadata);
      totalResponseInvalidated += result.responseCache;
      totalKVInvalidated += result.kvCache;
    }

    // Update metrics
    this.invalidationMetrics[trigger.event] = (this.invalidationMetrics[trigger.event] || 0) + 1;

    return {
      responseCache: totalResponseInvalidated,
      kvCache: totalKVInvalidated
    };
  }

  // Execute specific policy invalidation
  private async executePolicyInvalidation(
    policy: CacheInvalidationPolicy,
    userId?: string,
    sessionId?: string,
    metadata?: any
  ): Promise<{ responseCache: number; kvCache: number }> {
    let responseInvalidated = 0;
    let kvInvalidated = 0;

    try {
      switch (policy.scope) {
        case 'user':
          if (userId) {
            responseInvalidated = await cacheService.invalidateCache(userId);
            if (policy.cascadeToKV) {
              kvInvalidated = await kvCacheService.invalidateByPattern(`*:${userId}:*`, userId);
            }
          }
          break;

        case 'session':
          if (userId && sessionId) {
            // Invalidate session-specific caches
            responseInvalidated = await cacheService.invalidateCache(userId, sessionId);
            if (policy.cascadeToKV) {
              kvInvalidated = await kvCacheService.invalidateByPattern(`*:${userId}:${sessionId}`, userId);
            }
          }
          break;

        case 'global':
          // Global cleanup policies
          responseInvalidated = await this.executeGlobalCleanup();
          if (policy.cascadeToKV) {
            kvInvalidated = await kvCacheService.cleanup();
          }
          break;
      }

      console.log(`✅ Policy ${policy.name} executed: ${responseInvalidated} response, ${kvInvalidated} KV entries invalidated`);
    } catch (error) {
      console.error(`❌ Failed to execute policy ${policy.name}:`, error);
    }

    return { responseCache: responseInvalidated, kvCache: kvInvalidated };
  }

  // Global cache cleanup based on usage patterns
  private async executeGlobalCleanup(): Promise<number> {
    try {
      // Clean up old and expired entries
      const expiredCleanup = await cacheService.invalidateCache(
        undefined,
        undefined,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      );

      return expiredCleanup;
    } catch (error) {
      console.error('Global cleanup failed:', error);
      return 0;
    }
  }

  // Smart TTL management based on usage patterns
  async optimizeTTL(userId: string, sessionId: string): Promise<void> {
    try {
      const cacheStats = await cacheService.getCacheStats(userId);
      const kvStats = await kvCacheService.getCacheStats(userId);

      // Analyze usage patterns
      const hitRate = cacheStats.hitRate;
      const avgAccess = kvStats.avgAccessCount;

      // Adjust TTL based on usage
      let newTTLHours = 24; // Default

      if (hitRate > 0.8 && avgAccess > 5) {
        // High usage, extend TTL
        newTTLHours = 72;
      } else if (hitRate < 0.3 || avgAccess < 2) {
        // Low usage, reduce TTL
        newTTLHours = 6;
      }

      await cacheService.updateCacheTTL(userId, sessionId, newTTLHours);
      console.log(`⚡ TTL optimized for user ${userId}: ${newTTLHours}h (hit rate: ${hitRate})`);
    } catch (error) {
      console.warn('TTL optimization failed:', error);
    }
  }

  // Proactive cache warming based on user patterns
  async warmCacheForUser(userId: string): Promise<void> {
    try {
      // Get user's common patterns
      const { data: userPatterns, error } = await supabase
        .rpc('get_user_patterns', {
          p_user_id: userId,
          days_back: 7
        });

      if (error || !userPatterns) return;

      // Generate common queries for warming
      const commonQueries = this.generateWarmupQueries(userPatterns);

      // Warm up cache with common queries
      await cacheService.warmupCache(userId, commonQueries);
      console.log(`🔥 Cache warmed for user ${userId} with ${commonQueries.length} common queries`);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  // Generate warmup queries based on user patterns
  private generateWarmupQueries(patterns: any[]): string[] {
    const queries = [
      "I'm feeling anxious about work",
      "How can I manage stress better?",
      "I'm having trouble sleeping",
      "I feel overwhelmed today",
      "Can you help me understand my emotions?",
      "I'm struggling with relationships",
      "How do I build better habits?",
      "I feel stuck in life",
      "Can you help me process my feelings?",
      "I need guidance on self-care"
    ];

    // Customize based on detected patterns
    patterns.forEach(pattern => {
      switch (pattern.pattern_type) {
        case 'anxiety':
          queries.push("I'm experiencing anxiety symptoms", "How to calm anxiety attacks?");
          break;
        case 'depression':
          queries.push("I feel depressed today", "Help me cope with sadness");
          break;
        case 'relationships':
          queries.push("I'm having relationship issues", "How to communicate better");
          break;
        case 'work_stress':
          queries.push("Work is stressing me out", "How to handle workplace pressure");
          break;
      }
    });

    return [...new Set(queries)]; // Remove duplicates
  }

  // Cache performance monitoring
  async monitorCachePerformance(): Promise<CacheManagementStats> {
    try {
      const responseCacheStats = await cacheService.getCacheStats('global');
      const kvStats = await kvCacheService.getCacheStats();

      const performanceMetrics = {
        hitRate: responseCacheStats.hitRate,
        avgResponseTime: await this.calculateAvgResponseTime(),
        costSavings: responseCacheStats.costSavedUSD
      };

      const stats: CacheManagementStats = {
        totalCacheSize: this.calculateTotalCacheSize(responseCacheStats, kvStats),
        responseCacheStats,
        kvCacheStats: kvStats,
        invalidationEvents: Object.values(this.invalidationMetrics).reduce((sum, count) => sum + count, 0),
        performanceMetrics
      };

      // Store metrics for historical analysis
      await this.storePerformanceMetrics(stats);

      return stats;
    } catch (error) {
      console.error('Cache performance monitoring failed:', error);
      throw error;
    }
  }

  // Calculate average response time improvement from caching
  private async calculateAvgResponseTime(): Promise<number> {
    try {
      // Get recent conversation response times
      const { data: recentConversations, error } = await supabase
        .from('conversations')
        .select('created_at, input_tokens, output_tokens')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !recentConversations) return 0;

      // Estimate response time based on token counts (rough approximation)
      const avgTokens = recentConversations.reduce(
        (sum, conv) => sum + conv.input_tokens + conv.output_tokens, 0
      ) / recentConversations.length;

      // Assume ~50 tokens/second processing speed
      const estimatedResponseTime = avgTokens / 50; // seconds

      return Math.round(estimatedResponseTime * 100) / 100;
    } catch (error) {
      console.warn('Failed to calculate response time:', error);
      return 0;
    }
  }

  // Calculate total cache size across all caches
  private calculateTotalCacheSize(responseStats: any, kvStats: any): number {
    return (responseStats.totalRequests || 0) + (kvStats.totalEntries || 0);
  }

  // Store performance metrics for historical analysis
  private async storePerformanceMetrics(stats: CacheManagementStats): Promise<void> {
    try {
      const metricsKey = `cache_metrics:${new Date().toISOString().split('T')[0]}`;
      await kvCacheService.storeComputationResult(
        metricsKey,
        stats,
        24 * 60, // Store for 24 hours
        undefined
      );
    } catch (error) {
      console.warn('Failed to store performance metrics:', error);
    }
  }

  // Get cache health score (0-100)
  async getCacheHealthScore(userId?: string): Promise<number> {
    try {
      const stats = await this.monitorCachePerformance();

      let score = 100;

      // Deduct points for poor hit rate
      if (stats.performanceMetrics.hitRate < 0.3) score -= 30;
      else if (stats.performanceMetrics.hitRate < 0.5) score -= 15;

      // Deduct points for high cache size (may indicate over-caching)
      if (stats.totalCacheSize > 10000) score -= 20;
      else if (stats.totalCacheSize > 5000) score -= 10;

      // Bonus for cost savings
      if (stats.performanceMetrics.costSavings > 10) score += 10;
      else if (stats.performanceMetrics.costSavings > 5) score += 5;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Failed to calculate cache health score:', error);
      return 0;
    }
  }

  // Manual cache management operations
  async manualInvalidation(scope: 'user' | 'session' | 'global', identifier?: string): Promise<number> {
    const trigger: InvalidationTrigger = { event: 'manual' };

    let userId: string | undefined;
    let sessionId: string | undefined;

    if (scope === 'user' && identifier) {
      userId = identifier;
    } else if (scope === 'session' && identifier) {
      const parts = identifier.split(':');
      userId = parts[0];
      sessionId = parts[1];
    }

    const result = await this.invalidateCache(trigger, userId, sessionId);
    return result.responseCache + result.kvCache;
  }

  // Get invalidation recommendations
  async getInvalidationRecommendations(userId: string): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      const cacheStats = await cacheService.getCacheStats(userId);
      const kvStats = await kvCacheService.getCacheStats(userId);

      if (cacheStats.hitRate < 0.2) {
        recommendations.push('Low cache hit rate detected. Consider invalidating old entries.');
      }

      if (kvStats.userEntries > 500) {
        recommendations.push('High KV cache usage. Consider cleanup of old session data.');
      }

      if (kvStats.expiredEntries > 50) {
        recommendations.push('Many expired entries found. Run cleanup to improve performance.');
      }

      if (cacheStats.cacheMisses > cacheStats.cacheHits * 2) {
        recommendations.push('Cache miss rate is high. Consider adjusting TTL policies.');
      }

    } catch (error) {
      console.warn('Failed to generate invalidation recommendations:', error);
    }

    return recommendations;
  }
}

export const cacheManager = new CacheManager();