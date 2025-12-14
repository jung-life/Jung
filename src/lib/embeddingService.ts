// Embedding Service for Semantic Similarity in Jung Therapeutic AI
// Generates embeddings for privacy-preserving conversation context

import { getProviderConfig } from '../config/models';

export interface EmbeddingResponse {
  embedding: number[];
  tokenCount: number;
  costUSD: number;
  provider: string;
  model: string;
}

export interface EmbeddingError {
  message: string;
  code: string;
  retryable: boolean;
}

class EmbeddingService {
  private readonly OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly EMBEDDING_DIMENSION = 1536;
  private readonly COST_PER_1M_TOKENS = 0.02; // $0.02 per 1M tokens for text-embedding-3-small

  // Generate embedding using OpenAI's text-embedding-3-small model
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      const providerConfig = getProviderConfig('openai');

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: this.OPENAI_EMBEDDING_MODEL,
          encoding_format: 'float'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.error?.message || 'OpenAI embedding API error',
          code: errorData.error?.code || 'unknown',
          retryable: response.status >= 500 || response.status === 429
        } as EmbeddingError;
      }

      const data = await response.json();

      const tokenCount = data.usage?.total_tokens || 0;
      const costUSD = (tokenCount / 1000000) * this.COST_PER_1M_TOKENS;

      return {
        embedding: data.data[0].embedding,
        tokenCount,
        costUSD,
        provider: 'openai',
        model: this.OPENAI_EMBEDDING_MODEL
      };

    } catch (error: any) {
      if (error.retryable !== undefined) {
        throw error; // Re-throw EmbeddingError
      }

      throw {
        message: `Embedding generation failed: ${error.message}`,
        code: 'network_error',
        retryable: true
      } as EmbeddingError;
    }
  }

  // Generate embedding for anonymized text (privacy-preserving)
  async generateAnonymizedEmbedding(text: string): Promise<EmbeddingResponse> {
    // Remove personal identifiers before embedding generation
    const anonymizedText = this.anonymizeForEmbedding(text);
    return this.generateEmbedding(anonymizedText);
  }

  // Remove personal information while preserving semantic meaning
  private anonymizeForEmbedding(text: string): string {
    return text
      // Remove names (basic pattern matching)
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[PERSON]')
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      // Remove addresses (simplified)
      .replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, '[ADDRESS]')
      // Remove specific dates
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE]')
      // Preserve emotional and therapeutic content while anonymizing
      .trim();
  }

  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // Batch embedding generation for multiple texts (cost optimization)
  async generateBatchEmbeddings(texts: string[], anonymize: boolean = true): Promise<EmbeddingResponse[]> {
    const processedTexts = anonymize
      ? texts.map(text => this.anonymizeForEmbedding(text))
      : texts;

    try {
      const providerConfig = getProviderConfig('openai');

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: processedTexts,
          model: this.OPENAI_EMBEDDING_MODEL,
          encoding_format: 'float'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          message: errorData.error?.message || 'OpenAI batch embedding API error',
          code: errorData.error?.code || 'unknown',
          retryable: response.status >= 500 || response.status === 429
        } as EmbeddingError;
      }

      const data = await response.json();
      const totalTokens = data.usage?.total_tokens || 0;
      const totalCostUSD = (totalTokens / 1000000) * this.COST_PER_1M_TOKENS;

      // Distribute cost across embeddings proportionally
      return data.data.map((embeddingData: any, index: number) => {
        const textLength = processedTexts[index].length;
        const totalLength = processedTexts.reduce((sum, text) => sum + text.length, 0);
        const proportionalCost = totalLength > 0 ? (textLength / totalLength) * totalCostUSD : 0;

        return {
          embedding: embeddingData.embedding,
          tokenCount: Math.round((textLength / totalLength) * totalTokens),
          costUSD: proportionalCost,
          provider: 'openai',
          model: this.OPENAI_EMBEDDING_MODEL
        };
      });

    } catch (error: any) {
      if (error.retryable !== undefined) {
        throw error; // Re-throw EmbeddingError
      }

      throw {
        message: `Batch embedding generation failed: ${error.message}`,
        code: 'network_error',
        retryable: true
      } as EmbeddingError;
    }
  }

  // Get embedding dimension for database schema
  getEmbeddingDimension(): number {
    return this.EMBEDDING_DIMENSION;
  }

  // Validate embedding format
  isValidEmbedding(embedding: any): boolean {
    return Array.isArray(embedding) &&
           embedding.length === this.EMBEDDING_DIMENSION &&
           embedding.every(val => typeof val === 'number' && !isNaN(val));
  }

  // Create zero embedding (fallback)
  createZeroEmbedding(): number[] {
    return new Array(this.EMBEDDING_DIMENSION).fill(0);
  }

  // Estimate token count for text (approximation)
  estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Estimate cost for embedding generation
  estimateEmbeddingCost(text: string): number {
    const estimatedTokens = this.estimateTokenCount(text);
    return (estimatedTokens / 1000000) * this.COST_PER_1M_TOKENS;
  }
}

export const embeddingService = new EmbeddingService();