// LLM Caching Service for Jung Therapeutic AI
// Implements both response caching and context caching for performance optimization

import { supabase } from './supabase';
import { embeddingService } from './embeddingService';
import { decryptData, encryptData } from './security';

export interface CacheResponse {
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  creditsCost: number;
  cacheHit: boolean;
  similarity?: number;
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalTokensSaved: number;
  costSavedUSD: number;
}

class CacheService {
  private readonly SIMILARITY_THRESHOLD = 0.85; // Minimum similarity for cache hit
  private readonly EXACT_MATCH_THRESHOLD = 0.98; // High similarity threshold for exact matches
  private readonly CACHE_TTL_HOURS = 24; // Default cache TTL in hours
  private readonly MAX_CACHE_ENTRIES = 1000; // Maximum cache entries per user

  // Check for cached response using semantic similarity
  async getCachedResponse(
    userId: string,
    userInput: string,
    contextualPrompt: string
  ): Promise<CacheResponse | null> {
    try {
      // Generate embedding for the current query
      const embeddingResponse = await embeddingService.generateAnonymizedEmbedding(userInput);
      const queryEmbedding = embeddingResponse.embedding;

      // Search for similar conversations using the database function
      const { data: similarConversations, error } = await supabase.rpc(
        'search_similar_conversations',
        {
          query_embedding: queryEmbedding,
          similarity_threshold: this.SIMILARITY_THRESHOLD,
          p_user_id: userId,
          result_limit: 5
        }
      );

      if (error || !similarConversations || similarConversations.length === 0) {
        return null;
      }

      // Get the most similar conversation
      const bestMatch = similarConversations[0];

      // If similarity is very high, consider it an exact match
      if (bestMatch.similarity >= this.EXACT_MATCH_THRESHOLD) {
        // Retrieve the full cached response
        const { data: cachedConversation, error: fetchError } = await supabase
          .from('conversation_cache')
          .select('*')
          .eq('id', bestMatch.id)
          .eq('user_id', userId)
          .single();

        if (fetchError || !cachedConversation) {
          return null;
        }

        // Decrypt and return the cached response
        try {
          const decryptedResponse = decryptData(cachedConversation.encrypted_response);

          return {
            content: decryptedResponse,
            modelUsed: cachedConversation.model_used,
            inputTokens: cachedConversation.input_tokens,
            outputTokens: cachedConversation.output_tokens,
            costUSD: parseFloat(cachedConversation.cost_usd),
            creditsCost: cachedConversation.credits_spent,
            cacheHit: true,
            similarity: bestMatch.similarity
          };
        } catch (decryptionError) {
          console.warn('Failed to decrypt cached response:', decryptionError);
          return null;
        }
      }

      return null; // No suitable cache hit found
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  // Store response in cache with expiration
  async cacheResponse(
    userId: string,
    userInput: string,
    response: string,
    modelUsed: string,
    inputTokens: number,
    outputTokens: number,
    costUSD: number,
    creditsCost: number,
    sessionId?: string,
    avatarId: string = 'jung',
    ttlHours: number = this.CACHE_TTL_HOURS
  ): Promise<boolean> {
    try {
      // Generate embedding for semantic search
      const embeddingResponse = await embeddingService.generateAnonymizedEmbedding(userInput);

      // Check cache size and clean up if necessary
      await this.cleanupUserCache(userId);

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

      // Encrypt data before storing
      const encryptedPrompt = encryptData(userInput);
      const encryptedResponse = encryptData(response);

      // Store in conversation cache
      const { error } = await supabase
        .from('conversation_cache')
        .insert({
          user_id: userId,
          encrypted_prompt: encryptedPrompt,
          encrypted_response: encryptedResponse,
          prompt_embedding: embeddingResponse.embedding,
          model_used: modelUsed,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: costUSD + embeddingResponse.costUSD,
          credits_spent: creditsCost,
          session_id: sessionId,
          avatar_id: avatarId,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Failed to cache response:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache storage failed:', error);
      return false;
    }
  }

  // Clean up old and excess cache entries for a user
  private async cleanupUserCache(userId: string): Promise<void> {
    try {
      // Get user's cache count
      const { count, error: countError } = await supabase
        .from('conversation_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError || !count) return;

      // If over limit, remove oldest entries
      if (count >= this.MAX_CACHE_ENTRIES) {
        const excessCount = count - this.MAX_CACHE_ENTRIES + 1; // +1 to make room for new entry

        const { data: oldestEntries, error: selectError } = await supabase
          .from('conversation_cache')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(excessCount);

        if (selectError || !oldestEntries) return;

        const idsToDelete = oldestEntries.map(entry => entry.id);

        await supabase
          .from('conversation_cache')
          .delete()
          .in('id', idsToDelete);
      }

      // Also clean up expired entries
      await supabase
        .from('conversation_cache')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());

    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Get cache statistics for a user
  async getCacheStats(userId: string, days: number = 7): Promise<CacheStats> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get all conversations for the time period
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('input_tokens, output_tokens, cost_usd, created_at')
        .eq('user_id', userId)
        .gte('created_at', since);

      if (error || !conversations) {
        return {
          totalRequests: 0,
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
          totalTokensSaved: 0,
          costSavedUSD: 0
        };
      }

      // Get cache entries for the same period
      const { data: cacheEntries, error: cacheError } = await supabase
        .from('conversation_cache')
        .select('input_tokens, output_tokens, cost_usd, created_at')
        .eq('user_id', userId)
        .gte('created_at', since);

      if (cacheError) {
        console.warn('Failed to fetch cache statistics:', cacheError);
      }

      const totalRequests = conversations.length;
      const cacheHits = cacheEntries?.length || 0;
      const cacheMisses = totalRequests - cacheHits;
      const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

      // Estimate tokens and cost saved by cache hits
      const avgTokensPerRequest = conversations.reduce(
        (sum, conv) => sum + conv.input_tokens + conv.output_tokens, 0
      ) / Math.max(totalRequests, 1);

      const avgCostPerRequest = conversations.reduce(
        (sum, conv) => sum + parseFloat(conv.cost_usd), 0
      ) / Math.max(totalRequests, 1);

      const totalTokensSaved = Math.round(cacheHits * avgTokensPerRequest);
      const costSavedUSD = cacheHits * avgCostPerRequest;

      return {
        totalRequests,
        cacheHits,
        cacheMisses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalTokensSaved,
        costSavedUSD: Math.round(costSavedUSD * 100) / 100
      };
    } catch (error) {
      console.error('Failed to calculate cache statistics:', error);
      return {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        totalTokensSaved: 0,
        costSavedUSD: 0
      };
    }
  }

  // Invalidate cache entries based on criteria
  async invalidateCache(
    userId?: string,
    sessionId?: string,
    beforeDate?: Date,
    pattern?: string
  ): Promise<number> {
    try {
      let query = supabase.from('conversation_cache').delete();

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      if (beforeDate) {
        query = query.lt('created_at', beforeDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Cache invalidation failed:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Warm up cache with common queries for a user
  async warmupCache(userId: string, commonQueries: string[]): Promise<void> {
    try {
      for (const query of commonQueries) {
        // Check if query is already cached
        const cached = await this.getCachedResponse(userId, query, '');
        if (!cached) {
          // Pre-generate embedding for faster future lookups
          await embeddingService.generateAnonymizedEmbedding(query);
        }
      }
    } catch (error) {
      console.warn('Cache warmup failed:', error);
    }
  }

  // Update cache TTL for specific entries
  async updateCacheTTL(userId: string, sessionId: string, newTTLHours: number): Promise<boolean> {
    try {
      const newExpirationTime = new Date(Date.now() + newTTLHours * 60 * 60 * 1000);

      const { error } = await supabase
        .from('conversation_cache')
        .update({ expires_at: newExpirationTime.toISOString() })
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      return !error;
    } catch (error) {
      console.error('Failed to update cache TTL:', error);
      return false;
    }
  }

  // Check if caching is beneficial based on query patterns
  shouldCache(userInput: string, responseLength: number, cost: number): boolean {
    // Cache if:
    // 1. Query is longer than 20 characters (not trivial)
    // 2. Response is substantial (> 100 characters)
    // 3. Cost is significant (> $0.001)
    // 4. Not containing highly personalized content

    if (userInput.length < 20 || responseLength < 100) {
      return false;
    }

    if (cost < 0.001) {
      return false;
    }

    // Don't cache highly personalized responses
    const personalizedIndicators = [
      'my name is', 'i am called', 'yesterday i', 'tomorrow i will',
      'my address', 'my phone', 'my email', 'today i'
    ];

    const lowerInput = userInput.toLowerCase();
    const hasPersonalContent = personalizedIndicators.some(
      indicator => lowerInput.includes(indicator)
    );

    return !hasPersonalContent;
  }
}

export const cacheService = new CacheService();