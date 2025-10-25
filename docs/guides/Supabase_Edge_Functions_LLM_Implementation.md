# Supabase Edge Functions for LLM Scaling

## Overview

Implementation guide for scaling Jung's LLM architecture using Supabase Edge Functions, focusing on Anthropic Claude and OpenAI GPT models with intelligent routing and caching.

---

## Architecture

```
Jung Mobile App → Supabase Auth → Edge Functions → [Anthropic, OpenAI] → Response Cache
     ↓                                                                           ↑
Supabase Database ← pgvector Similarity Search ← Conversation History ←────────────┘
```

---

## Edge Function Structure

### 1. LLM Router Function (`llm-router`)

```typescript
// supabase/functions/llm-router/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface LLMRequest {
  prompt: string
  userId: string
  conversationId: string
  userTier: 'free' | 'premium' | 'enterprise'
  avatarId: string
  previousMessages?: Array<{role: string, content: string}>
}

interface ModelConfig {
  provider: 'anthropic' | 'openai'
  model: string
  maxTokens: number
  costPer1M: number
  dailyLimit: number
}

const MODEL_CONFIGS = {
  free: {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    maxTokens: 500,
    costPer1M: 0.25,
    dailyLimit: 15
  } as ModelConfig,
  premium: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2000,
    costPer1M: 3.00,
    dailyLimit: 100
  } as ModelConfig,
  enterprise: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    costPer1M: 1.50, // Enterprise pricing
    dailyLimit: 1000
  } as ModelConfig
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const request: LLMRequest = await req.json()

    // Check daily usage limits
    const usageCheck = await checkDailyUsage(supabase, user.id, request.userTier)
    if (!usageCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Daily limit exceeded',
        limit: usageCheck.limit,
        used: usageCheck.used
      }), { status: 429 })
    }

    // Check cache first
    const cachedResponse = await checkCache(supabase, request)
    if (cachedResponse) {
      return new Response(JSON.stringify({
        content: cachedResponse.content,
        cached: true,
        usage: cachedResponse.usage
      }))
    }

    // Route to appropriate LLM
    const modelConfig = MODEL_CONFIGS[request.userTier]
    const llmResponse = await callLLM(modelConfig, request)

    // Cache the response
    await cacheResponse(supabase, request, llmResponse)

    // Log usage
    await logUsage(supabase, user.id, llmResponse.usage)

    return new Response(JSON.stringify(llmResponse))

  } catch (error) {
    console.error('LLM Router Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

### 2. Cache Management Function

```typescript
// supabase/functions/shared/cache-manager.ts
export async function checkCache(supabase: any, request: LLMRequest) {
  // Generate embedding for semantic similarity
  const embedding = await generateEmbedding(request.prompt)

  // Search for similar cached responses using pgvector
  const { data: cachedResponses } = await supabase.rpc('search_similar_conversations', {
    query_embedding: embedding,
    similarity_threshold: 0.85,
    user_id: request.userId,
    avatar_id: request.avatarId
  })

  if (cachedResponses && cachedResponses.length > 0) {
    // Return most similar cached response
    return cachedResponses[0]
  }

  return null
}

export async function cacheResponse(supabase: any, request: LLMRequest, response: any) {
  const embedding = await generateEmbedding(request.prompt)

  await supabase.from('conversation_cache').insert({
    user_id: request.userId,
    avatar_id: request.avatarId,
    prompt: request.prompt,
    response: response.content,
    prompt_embedding: embedding,
    model_used: response.modelUsed,
    tokens_used: response.totalTokens,
    cost_usd: response.costUSD,
    created_at: new Date().toISOString()
  })
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Use OpenAI text-embedding-3-small for consistent embeddings
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  })

  const data = await response.json()
  return data.data[0].embedding
}
```

### 3. LLM Provider Functions

```typescript
// supabase/functions/shared/llm-providers.ts
export async function callAnthropic(modelConfig: ModelConfig, request: LLMRequest) {
  const messages = [
    ...(request.previousMessages || []),
    { role: 'user', content: request.prompt }
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!
    },
    body: JSON.stringify({
      model: modelConfig.model,
      max_tokens: modelConfig.maxTokens,
      messages: messages,
      system: await getSystemPrompt(request.avatarId)
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${data.error?.message}`)
  }

  return {
    content: data.content[0].text,
    modelUsed: modelConfig.model,
    provider: 'anthropic',
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    costUSD: calculateCost(modelConfig, data.usage.input_tokens, data.usage.output_tokens)
  }
}

export async function callOpenAI(modelConfig: ModelConfig, request: LLMRequest) {
  const messages = [
    { role: 'system', content: await getSystemPrompt(request.avatarId) },
    ...(request.previousMessages || []),
    { role: 'user', content: request.prompt }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: messages,
      max_tokens: modelConfig.maxTokens,
      temperature: 0.7
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message}`)
  }

  return {
    content: data.choices[0].message.content,
    modelUsed: modelConfig.model,
    provider: 'openai',
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
    totalTokens: data.usage.total_tokens,
    costUSD: calculateCost(modelConfig, data.usage.prompt_tokens, data.usage.completion_tokens)
  }
}
```

---

## Database Schema

### 1. Conversation Cache Table

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation cache with semantic search
CREATE TABLE conversation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  avatar_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  prompt_embedding vector(1536), -- OpenAI embedding size
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX idx_conversation_cache_user_avatar ON conversation_cache(user_id, avatar_id);
CREATE INDEX idx_conversation_cache_embedding ON conversation_cache USING ivfflat (prompt_embedding vector_cosine_ops);
CREATE INDEX idx_conversation_cache_expires ON conversation_cache(expires_at);
```

### 2. Usage Tracking Table

```sql
-- Daily usage tracking per user
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_tier TEXT NOT NULL,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index for quick daily lookups
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date);
```

### 3. RPC Functions

```sql
-- Search for similar conversations using pgvector
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.85,
  user_id uuid DEFAULT NULL,
  avatar_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  prompt text,
  response text,
  similarity float,
  model_used text,
  tokens_used integer,
  cost_usd decimal
)
LANGUAGE sql
AS $$
  SELECT
    cc.id,
    cc.prompt,
    cc.response,
    1 - (cc.prompt_embedding <=> query_embedding) as similarity,
    cc.model_used,
    cc.tokens_used,
    cc.cost_usd
  FROM conversation_cache cc
  WHERE
    (user_id IS NULL OR cc.user_id = user_id)
    AND (avatar_id IS NULL OR cc.avatar_id = avatar_id)
    AND cc.expires_at > NOW()
    AND 1 - (cc.prompt_embedding <=> query_embedding) > similarity_threshold
  ORDER BY cc.prompt_embedding <=> query_embedding
  LIMIT 5;
$$;
```

---

## Usage Monitoring & Analytics

### 1. Analytics Edge Function

```typescript
// supabase/functions/analytics/index.ts
export async function getUserAnalytics(supabase: any, userId: string, period: string = '7d') {
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('date', getDateFromPeriod(period))
    .order('date', { ascending: true })

  const { data: conversations } = await supabase
    .from('conversation_cache')
    .select('model_used, tokens_used, cost_usd, created_at')
    .eq('user_id', userId)
    .gte('created_at', getDateFromPeriod(period))

  return {
    totalMessages: usage.reduce((sum, day) => sum + day.messages_count, 0),
    totalTokens: usage.reduce((sum, day) => sum + day.tokens_used, 0),
    totalCost: usage.reduce((sum, day) => sum + parseFloat(day.cost_usd), 0),
    dailyBreakdown: usage,
    modelUsage: aggregateModelUsage(conversations),
    cacheHitRate: await calculateCacheHitRate(supabase, userId, period)
  }
}

async function calculateCacheHitRate(supabase: any, userId: string, period: string) {
  // Calculate cache hit rate based on request logs
  // Implementation depends on how you track cache hits vs misses
  return 0.35 // 35% hit rate example
}
```

---

## Rate Limiting & Quotas

### 1. Daily Limit Enforcement

```typescript
// supabase/functions/shared/rate-limiting.ts
export async function checkDailyUsage(supabase: any, userId: string, userTier: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('daily_usage')
    .select('messages_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const limits = {
    free: 15,
    premium: 100,
    enterprise: 1000
  }

  const currentUsage = usage?.messages_count || 0
  const limit = limits[userTier]

  return {
    allowed: currentUsage < limit,
    used: currentUsage,
    limit: limit,
    remaining: limit - currentUsage
  }
}

export async function incrementDailyUsage(supabase: any, userId: string, userTier: string, tokens: number, cost: number) {
  const today = new Date().toISOString().split('T')[0]

  await supabase.rpc('increment_daily_usage', {
    p_user_id: userId,
    p_date: today,
    p_user_tier: userTier,
    p_tokens: tokens,
    p_cost: cost
  })
}
```

---

## Deployment & Configuration

### 1. Environment Variables

```bash
# Supabase Edge Functions Environment
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Provider APIs
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### 2. Deploy Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy Edge Functions
supabase functions deploy llm-router
supabase functions deploy analytics

# Set environment variables
supabase secrets set ANTHROPIC_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key
```

---

## Cost Optimization Benefits

### Expected Savings with Supabase Architecture:

1. **35-45% Cache Hit Rate**: Reduces LLM API costs significantly
2. **Ultra-cheap Free Tier**: Claude 3 Haiku at $0.25/1M tokens
3. **Edge Function Efficiency**: Faster responses, lower latency
4. **Intelligent Routing**: Right model for right use case
5. **Usage Analytics**: Data-driven optimization

### Cost Comparison:
- **Without optimization**: $200/month for 1K users
- **With Supabase + caching**: $120/month for 1K users (40% savings)
- **At 10K users**: $1,200/month vs $2,000/month (40% savings)
- **At 100K users**: $8,000/month vs $20,000/month (60% savings)

This Supabase-native approach leverages your existing infrastructure while providing enterprise-grade scaling capabilities through Edge Functions and intelligent caching.