// Standardized LLM service with automatic model selection and cost optimization
import {
  MODEL_CONFIGS,
  getOptimalModel,
  getProviderConfig,
  estimateTokenCost,
  calculateCreditCost,
  getModelKeyByConfig,
  ModelStrategy,
  ModelConfig
} from '../config/models';

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  strategy?: ModelStrategy;
  maxTokens?: number;
  temperature?: number;
  forceModel?: string;
}

export interface LLMResponse {
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  creditsCost: number;
  provider: string;
  processingTimeMs: number;
}

export interface LLMError {
  message: string;
  code: string;
  provider: string;
  modelId: string;
  retryable: boolean;
}

class StandardizedLLMService {
  private async callAnthropicAPI(
    model: ModelConfig,
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const providerConfig = getProviderConfig('anthropic');

    const requestBody = {
      model: model.modelId,
      max_tokens: model.maxTokens,
      temperature: model.temperature,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    };

    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        ...providerConfig.defaultHeaders,
        'x-api-key': providerConfig.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.error?.message || 'Anthropic API error',
        code: data.error?.type || 'unknown',
        provider: 'anthropic',
        modelId: model.modelId,
        retryable: response.status >= 500 || response.status === 429
      } as LLMError;
    }

    const processingTimeMs = Date.now() - startTime;
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Clean response
    let cleanedContent = data.content[0].text
      .replace(/<\/?response>/gi, '')
      .replace(/<\/?thinking>/gi, '')
      .replace(/<\/?analysis>/gi, '')
      .trim();

    const modelKey = getModelKeyByConfig(model) || 'claude-3.5-sonnet';

    return {
      content: cleanedContent,
      modelUsed: model.modelId,
      inputTokens,
      outputTokens,
      totalTokens,
      costUSD: estimateTokenCost(modelKey, inputTokens, outputTokens),
      creditsCost: calculateCreditCost(modelKey, inputTokens, outputTokens),
      provider: 'anthropic',
      processingTimeMs
    };
  }

  private async callOpenAIAPI(
    model: ModelConfig,
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const providerConfig = getProviderConfig('openai');

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    formattedMessages.push(...messages);

    const requestBody = {
      model: model.modelId,
      messages: formattedMessages,
      max_tokens: model.maxTokens,
      temperature: model.temperature
    };

    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        ...providerConfig.defaultHeaders,
        'Authorization': `Bearer ${providerConfig.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.error?.message || 'OpenAI API error',
        code: data.error?.code || 'unknown',
        provider: 'openai',
        modelId: model.modelId,
        retryable: response.status >= 500 || response.status === 429
      } as LLMError;
    }

    const processingTimeMs = Date.now() - startTime;
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const totalTokens = data.usage?.total_tokens || inputTokens + outputTokens;

    // Clean response
    let cleanedContent = data.choices[0].message.content
      .replace(/<\/?response>/gi, '')
      .replace(/<\/?thinking>/gi, '')
      .replace(/<\/?analysis>/gi, '')
      .trim();

    const modelKey = getModelKeyByConfig(model) || 'gpt-4o';

    return {
      content: cleanedContent,
      modelUsed: model.modelId,
      inputTokens,
      outputTokens,
      totalTokens,
      costUSD: estimateTokenCost(modelKey, inputTokens, outputTokens),
      creditsCost: calculateCreditCost(modelKey, inputTokens, outputTokens),
      provider: 'openai',
      processingTimeMs
    };
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Determine which model to use
    let selectedModel: ModelConfig;

    if (request.forceModel) {
      const forcedModel = MODEL_CONFIGS[request.forceModel];
      if (!forcedModel || !forcedModel.isActive) {
        throw new Error(`Forced model ${request.forceModel} is not available`);
      }
      selectedModel = forcedModel;
    } else {
      selectedModel = getOptimalModel(request.strategy || 'balanced');
    }

    // Override model settings if provided
    if (request.maxTokens) {
      selectedModel = { ...selectedModel, maxTokens: request.maxTokens };
    }
    if (request.temperature !== undefined) {
      selectedModel = { ...selectedModel, temperature: request.temperature };
    }

    // Prepare messages
    const messages = [
      ...(request.previousMessages || []),
      { role: 'user', content: request.prompt }
    ];

    // Try primary model, with fallback
    const maxRetries = 3;
    let lastError: LLMError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (selectedModel.provider === 'anthropic') {
          return await this.callAnthropicAPI(selectedModel, messages, request.systemPrompt);
        } else if (selectedModel.provider === 'openai') {
          return await this.callOpenAIAPI(selectedModel, messages, request.systemPrompt);
        } else {
          throw new Error(`Unsupported provider: ${selectedModel.provider}`);
        }
      } catch (error: any) {
        lastError = error as LLMError;

        console.warn(`Attempt ${attempt + 1} failed for ${selectedModel.modelId}:`, error.message);

        // If not retryable or last attempt, break
        if (!error.retryable || attempt === maxRetries - 1) {
          break;
        }

        // Try fallback model on next attempt
        if (attempt === 0) {
          const fallbackModels = request.strategy === 'cost-optimized'
            ? ['claude-3.5-sonnet', 'gpt-4o']
            : ['gpt-4o', 'claude-3.5-sonnet'];

          for (const fallbackId of fallbackModels) {
            const fallback = MODEL_CONFIGS[fallbackId];
            if (fallback && fallback.isActive && fallback.modelId !== selectedModel.modelId) {
              selectedModel = fallback;
              console.log(`Falling back to ${fallback.modelId}`);
              break;
            }
          }
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // If all attempts failed
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async generateWithStrategy(
    prompt: string,
    strategy: ModelStrategy,
    options: Partial<LLMRequest> = {}
  ): Promise<LLMResponse> {
    return this.generate({
      prompt,
      strategy,
      ...options
    });
  }

  // Convenience methods for different use cases
  async generateCostOptimized(prompt: string, options: Partial<LLMRequest> = {}): Promise<LLMResponse> {
    return this.generateWithStrategy(prompt, 'cost-optimized', options);
  }

  async generateBalanced(prompt: string, options: Partial<LLMRequest> = {}): Promise<LLMResponse> {
    return this.generateWithStrategy(prompt, 'balanced', options);
  }

  async generateQualityFirst(prompt: string, options: Partial<LLMRequest> = {}): Promise<LLMResponse> {
    return this.generateWithStrategy(prompt, 'quality-first', options);
  }

  // Get available models for UI
  getAvailableModels(): ModelConfig[] {
    return Object.values(MODEL_CONFIGS)
      .filter(model => model.isActive)
      .sort((a, b) => a.priority - b.priority);
  }

  // Calculate costs for different strategies
  estimateCosts(inputTokens: number, outputTokens: number): Record<string, { usd: number; credits: number; model: string }> {
    const strategies: ModelStrategy[] = ['cost-optimized', 'balanced', 'quality-first'];
    const results: Record<string, { usd: number; credits: number; model: string }> = {};

    for (const strategy of strategies) {
      const model = getOptimalModel(strategy);
      const modelKey = getModelKeyByConfig(model) || 'claude-3.5-sonnet';
      results[strategy] = {
        usd: estimateTokenCost(modelKey, inputTokens, outputTokens),
        credits: calculateCreditCost(modelKey, inputTokens, outputTokens),
        model: model.name
      };
    }

    return results;
  }
}

export const standardizedLLM = new StandardizedLLMService();