// KV Cache Service for Conversation Context Preservation
// Implements key-value caching for conversation context and intermediate states

import { supabase } from './supabase';
import { encryptData, decryptData } from './security';

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messages: ConversationMessage[];
  therapeuticState: TherapeuticState;
  patternContext: PatternContext;
  lastActivity: Date;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenCount: number;
}

export interface TherapeuticState {
  detectedPatterns: string[];
  emotionalState: string;
  progressionLevel: number;
  keyThemes: string[];
}

export interface PatternContext {
  recentPatterns: { [key: string]: number };
  correlations: { [key: string]: string[] };
  intensity: 'low' | 'moderate' | 'high';
}

export interface KVCacheEntry {
  key: string;
  value: string; // encrypted JSON
  expiry: Date;
  accessCount: number;
  lastAccessed: Date;
}

class KVCacheService {
  private readonly DEFAULT_TTL_MINUTES = 60; // 1 hour default
  private readonly SESSION_TTL_MINUTES = 480; // 8 hours for sessions
  private readonly MAX_CONTEXT_MESSAGES = 20; // Keep last 20 messages
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  // Store conversation context with intelligent chunking
  async storeConversationContext(
    userId: string,
    sessionId: string,
    context: ConversationContext
  ): Promise<boolean> {
    try {
      const contextKey = `conv_context:${userId}:${sessionId}`;

      // Encrypt and compress context
      const contextData = JSON.stringify({
        ...context,
        messages: context.messages.slice(-this.MAX_CONTEXT_MESSAGES) // Keep recent messages only
      });

      const encryptedData = encryptData(contextData);
      const expiry = new Date(Date.now() + this.SESSION_TTL_MINUTES * 60 * 1000);

      // Store in a dedicated KV cache table (create if needed)
      const { error } = await supabase
        .from('kv_cache')
        .upsert({
          key: contextKey,
          value: encryptedData,
          user_id: userId,
          expiry: expiry.toISOString(),
          access_count: 1,
          last_accessed: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store conversation context:', error);
        return false;
      }

      console.log(`📝 Conversation context cached for session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('KV cache store error:', error);
      return false;
    }
  }

  // Retrieve conversation context with automatic updates
  async getConversationContext(
    userId: string,
    sessionId: string
  ): Promise<ConversationContext | null> {
    try {
      const contextKey = `conv_context:${userId}:${sessionId}`;

      const { data, error } = await supabase
        .from('kv_cache')
        .select('*')
        .eq('key', contextKey)
        .eq('user_id', userId)
        .gt('expiry', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Update access count and timestamp
      await supabase
        .from('kv_cache')
        .update({
          access_count: data.access_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('key', contextKey);

      // Decrypt and parse context
      const decryptedData = decryptData(data.value);
      const context = JSON.parse(decryptedData) as ConversationContext;

      console.log(`📖 Retrieved conversation context for session ${sessionId}`);
      return context;
    } catch (error) {
      console.warn('Failed to retrieve conversation context:', error);
      return null;
    }
  }

  // Store intermediate computation results (embeddings, analysis results)
  async storeComputationResult(
    key: string,
    result: any,
    ttlMinutes: number = this.DEFAULT_TTL_MINUTES,
    userId?: string
  ): Promise<boolean> {
    try {
      const encryptedResult = encryptData(JSON.stringify(result));
      const expiry = new Date(Date.now() + ttlMinutes * 60 * 1000);

      const { error } = await supabase
        .from('kv_cache')
        .upsert({
          key,
          value: encryptedResult,
          user_id: userId,
          expiry: expiry.toISOString(),
          access_count: 1,
          last_accessed: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Failed to store computation result:', error);
      return false;
    }
  }

  // Get computation result with type safety
  async getComputationResult<T>(key: string, userId?: string): Promise<T | null> {
    try {
      let query = supabase
        .from('kv_cache')
        .select('*')
        .eq('key', key)
        .gt('expiry', new Date().toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return null;
      }

      // Update access metrics
      await supabase
        .from('kv_cache')
        .update({
          access_count: data.access_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('key', key);

      const decryptedData = decryptData(data.value);
      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.warn('Failed to get computation result:', error);
      return null;
    }
  }

  // Cache embeddings for reuse
  async cacheEmbedding(
    text: string,
    embedding: number[],
    userId?: string
  ): Promise<boolean> {
    const embeddingKey = `embedding:${this.hashText(text)}`;
    return this.storeComputationResult(
      embeddingKey,
      { text: text.substring(0, 100), embedding }, // Store snippet for debugging
      this.SESSION_TTL_MINUTES,
      userId
    );
  }

  // Get cached embedding
  async getCachedEmbedding(text: string, userId?: string): Promise<number[] | null> {
    const embeddingKey = `embedding:${this.hashText(text)}`;
    const result = await this.getComputationResult<{ embedding: number[] }>(embeddingKey, userId);
    return result?.embedding || null;
  }

  // Store pattern analysis results
  async storePatternAnalysis(
    userId: string,
    patterns: PatternContext,
    ttlHours: number = 24
  ): Promise<boolean> {
    const patternKey = `patterns:${userId}:${new Date().toDateString()}`;
    return this.storeComputationResult(patternKey, patterns, ttlHours * 60, userId);
  }

  // Get pattern analysis
  async getPatternAnalysis(userId: string): Promise<PatternContext | null> {
    const patternKey = `patterns:${userId}:${new Date().toDateString()}`;
    return this.getComputationResult<PatternContext>(patternKey, userId);
  }

  // Batch operations for efficiency
  async storeBatch(entries: Array<{
    key: string;
    value: any;
    ttlMinutes?: number;
    userId?: string;
  }>): Promise<boolean[]> {
    const promises = entries.map(entry =>
      this.storeComputationResult(
        entry.key,
        entry.value,
        entry.ttlMinutes,
        entry.userId
      )
    );
    return Promise.all(promises);
  }

  // Get multiple keys at once
  async getBatch<T>(
    keys: string[],
    userId?: string
  ): Promise<{ [key: string]: T | null }> {
    const promises = keys.map(async key => {
      const result = await this.getComputationResult<T>(key, userId);
      return { key, result };
    });

    const results = await Promise.all(promises);
    const resultMap: { [key: string]: T | null } = {};

    results.forEach(({ key, result }) => {
      resultMap[key] = result;
    });

    return resultMap;
  }

  // Invalidate cache by pattern
  async invalidateByPattern(pattern: string, userId?: string): Promise<number> {
    try {
      let query = supabase
        .from('kv_cache')
        .delete()
        .like('key', `%${pattern}%`);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Failed to invalidate cache by pattern:', error);
        return 0;
      }

      console.log(`🗑️ Invalidated ${count || 0} cache entries matching pattern: ${pattern}`);
      return count || 0;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Manual cleanup of expired entries
  async cleanup(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('kv_cache')
        .delete()
        .lt('expiry', new Date().toISOString());

      if (!error && count) {
        console.log(`🧹 Cleaned up ${count} expired cache entries`);
      }

      return count || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getCacheStats(userId?: string): Promise<{
    totalEntries: number;
    userEntries: number;
    expiredEntries: number;
    totalAccessCount: number;
    avgAccessCount: number;
  }> {
    try {
      const { count: totalEntries } = await supabase
        .from('kv_cache')
        .select('*', { count: 'exact', head: true });

      const { count: userEntries } = userId ? await supabase
        .from('kv_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) : { count: 0 };

      const { count: expiredEntries } = await supabase
        .from('kv_cache')
        .select('*', { count: 'exact', head: true })
        .lt('expiry', new Date().toISOString());

      const { data: accessData } = await supabase
        .from('kv_cache')
        .select('access_count');

      const totalAccessCount = accessData?.reduce((sum, entry) => sum + entry.access_count, 0) || 0;
      const avgAccessCount = totalEntries ? totalAccessCount / totalEntries : 0;

      return {
        totalEntries: totalEntries || 0,
        userEntries: userEntries || 0,
        expiredEntries: expiredEntries || 0,
        totalAccessCount,
        avgAccessCount: Math.round(avgAccessCount * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        userEntries: 0,
        expiredEntries: 0,
        totalAccessCount: 0,
        avgAccessCount: 0
      };
    }
  }

  // Utility: Hash text for consistent keys
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Start automatic cleanup timer
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  // Stop cleanup timer (for testing or shutdown)
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Update context efficiently (partial updates)
  async updateConversationContext(
    userId: string,
    sessionId: string,
    updates: Partial<ConversationContext>
  ): Promise<boolean> {
    const currentContext = await this.getConversationContext(userId, sessionId);

    if (!currentContext) {
      // Create new context if none exists
      const newContext: ConversationContext = {
        userId,
        sessionId,
        messages: [],
        therapeuticState: {
          detectedPatterns: [],
          emotionalState: 'neutral',
          progressionLevel: 0,
          keyThemes: []
        },
        patternContext: {
          recentPatterns: {},
          correlations: {},
          intensity: 'low'
        },
        lastActivity: new Date(),
        ...updates
      };
      return this.storeConversationContext(userId, sessionId, newContext);
    }

    // Merge updates with current context
    const updatedContext: ConversationContext = {
      ...currentContext,
      ...updates,
      lastActivity: new Date()
    };

    return this.storeConversationContext(userId, sessionId, updatedContext);
  }
}

export const kvCacheService = new KVCacheService();