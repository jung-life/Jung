// Centralized LLM model configuration and pricing management
export interface ModelConfig {
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  modelId: string;
  inputCostPer1M: number; // Cost per 1M input tokens in USD
  outputCostPer1M: number; // Cost per 1M output tokens in USD
  maxTokens: number;
  contextWindow: number;
  temperature: number;
  description: string;
  features: string[];
  isActive: boolean;
  priority: number; // Lower number = higher priority
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  apiVersion?: string;
  defaultHeaders: Record<string, string>;
}

// Model configurations with working Claude models only
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Primary model - best quality/cost balance
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxTokens: 1000,
    contextWindow: 200000,
    temperature: 0.7,
    description: 'Excellent for therapeutic conversations, proven reliable',
    features: ['200K context', 'excellent reasoning', 'reliable'],
    isActive: true,
    priority: 1
  },

  // Cost-optimized models
  'claude-3.5-haiku': {
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
    maxTokens: 1000,
    contextWindow: 200000,
    temperature: 0.7,
    description: 'Fast and cost-effective for simple conversations',
    features: ['200K context', 'fast responses', 'very cheap'],
    isActive: true,
    priority: 2
  },

  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    modelId: 'claude-3-haiku-20240307',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxTokens: 1000,
    contextWindow: 200000,
    temperature: 0.7,
    description: 'Ultra-cheap option for basic conversations',
    features: ['200K context', 'very fast', 'cheapest', 'reliable'],
    isActive: true,
    priority: 3
  },

  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    inputCostPer1M: 3.00,
    outputCostPer1M: 10.00,
    maxTokens: 1000,
    contextWindow: 128000,
    temperature: 0.7,
    description: 'OpenAI flagship model, excellent performance',
    features: ['128K context', 'fast responses', 'integrated tools'],
    isActive: true,
    priority: 2
  },

  // Budget models
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    maxTokens: 1000,
    contextWindow: 128000,
    temperature: 0.7,
    description: 'Ultra-low cost option for high-volume usage',
    features: ['128K context', 'very cheap', 'good for simple queries'],
    isActive: false, // Temporarily disabled due to model name issues
    priority: 3
  },

  // Legacy models (expensive, use only if needed)
  'gpt-4-legacy': {
    name: 'GPT-4 Legacy',
    provider: 'openai',
    modelId: 'gpt-4',
    inputCostPer1M: 30.00,
    outputCostPer1M: 60.00,
    maxTokens: 1000,
    contextWindow: 8192,
    temperature: 0.7,
    description: 'Legacy GPT-4 - expensive, avoid unless necessary',
    features: ['8K context', 'high quality', 'very expensive'],
    isActive: false,
    priority: 10
  },

  // Latest 2025 models (when available)
  'gpt-4.1': {
    name: 'GPT-4.1',
    provider: 'openai',
    modelId: 'gpt-4.1',
    inputCostPer1M: 2.25, // 26% less than GPT-4o
    outputCostPer1M: 7.50,
    maxTokens: 1000,
    contextWindow: 1000000,
    temperature: 0.7,
    description: 'Latest GPT-4.1 model with 1M context window',
    features: ['1M context', 'latest reasoning', 'cost effective'],
    isActive: false, // Set to false until confirmed available
    priority: 1
  },

  // Google Gemini models
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    modelId: 'gemini-1.5-pro',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    maxTokens: 8192,
    contextWindow: 2097152, // 2M tokens
    temperature: 0.7,
    description: 'Google\'s most capable model with huge context window',
    features: ['2M context', 'multimodal', 'excellent reasoning'],
    isActive: true,
    priority: 1
  },

  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    modelId: 'gemini-1.5-flash',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    maxTokens: 8192,
    contextWindow: 1048576, // 1M tokens
    temperature: 0.7,
    description: 'Fast and cost-effective Gemini model',
    features: ['1M context', 'very fast', 'ultra cheap', 'multimodal'],
    isActive: true,
    priority: 2
  },

  'gemini-1.5-flash-8b': {
    name: 'Gemini 1.5 Flash-8B',
    provider: 'google',
    modelId: 'gemini-1.5-flash-8b',
    inputCostPer1M: 0.0375,
    outputCostPer1M: 0.15,
    maxTokens: 8192,
    contextWindow: 1048576, // 1M tokens
    temperature: 0.7,
    description: 'Ultra-low cost Gemini model for high volume',
    features: ['1M context', 'fastest', 'cheapest', 'lightweight'],
    isActive: true,
    priority: 3
  }
};

// Provider configurations
export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic',
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiVersion: '2023-06-01',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  },

  openai: {
    name: 'OpenAI',
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultHeaders: {
      'Content-Type': 'application/json'
    }
  },

  google: {
    name: 'Google',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultHeaders: {
      'Content-Type': 'application/json'
    }
  }
};

// Model selection strategy
export type ModelStrategy = 'cost-optimized' | 'balanced' | 'quality-first' | 'fallback';

export const MODEL_STRATEGIES: Record<ModelStrategy, string[]> = {
  'cost-optimized': ['gemini-1.5-flash-8b', 'gemini-1.5-flash', 'claude-3-haiku'],
  'balanced': ['gemini-1.5-flash', 'claude-3.5-haiku', 'gemini-1.5-pro'],
  'quality-first': ['gemini-1.5-pro', 'claude-3.5-sonnet', 'gpt-4o'],
  'fallback': ['claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-haiku']
};

// Utility functions
export function getActiveModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS)
    .filter(model => model.isActive)
    .sort((a, b) => a.priority - b.priority);
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS[modelId];
}

export function getModelKeyByConfig(config: ModelConfig): string | undefined {
  for (const [key, model] of Object.entries(MODEL_CONFIGS)) {
    if (model.modelId === config.modelId) {
      return key;
    }
  }
  return undefined;
}

export function getModelsByProvider(provider: string): ModelConfig[] {
  return Object.values(MODEL_CONFIGS)
    .filter(model => model.provider === provider && model.isActive)
    .sort((a, b) => a.priority - b.priority);
}

export function getOptimalModel(strategy: ModelStrategy = 'balanced'): ModelConfig {
  const modelIds = MODEL_STRATEGIES[strategy];

  for (const modelId of modelIds) {
    const model = MODEL_CONFIGS[modelId];
    if (model && model.isActive) {
      return model;
    }
  }

  // Fallback to first active model
  const activeModels = getActiveModels();
  if (activeModels.length === 0) {
    throw new Error('No active models configured');
  }

  return activeModels[0];
}

export function estimateTokenCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }

  const inputCost = (inputTokens / 1000000) * model.inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * model.outputCostPer1M;

  return inputCost + outputCost;
}

export function getProviderConfig(provider: string): ProviderConfig {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    throw new Error(`Provider ${provider} not configured`);
  }

  if (!config.apiKey) {
    throw new Error(`API key not configured for provider ${provider}`);
  }

  return config;
}

// Credits calculation (assuming 1 credit = $0.01)
export function calculateCreditCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  creditRate: number = 0.01
): number {
  const dollarCost = estimateTokenCost(modelId, inputTokens, outputTokens);
  return Math.ceil(dollarCost / creditRate);
}