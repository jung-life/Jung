import { useState } from 'react';
import { standardizedLLM } from '../lib/standardizedLLM';

const useLLM = () => {
  const [loading, setLoading] = useState(false);

  const generateQuote = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      // Use cost-optimized strategy for quote generation
      const response = await standardizedLLM.generateCostOptimized(prompt, {
        systemPrompt: 'You are a motivational quote generator. Create inspiring, original quotes that resonate with people facing life challenges.',
        maxTokens: 150, // Quotes are short
        temperature: 0.8 // Higher creativity for quotes
      });

      return response.content;
    } catch (error) {
      console.error('Error generating quote:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (
    prompt: string,
    systemPrompt?: string,
    strategy: 'cost-optimized' | 'balanced' | 'quality-first' = 'balanced'
  ): Promise<{
    content: string;
    modelUsed: string;
    costUSD: number;
    creditsCost: number;
  }> => {
    setLoading(true);
    try {
      const response = await standardizedLLM.generateWithStrategy(prompt, strategy, {
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.7
      });

      return {
        content: response.content,
        modelUsed: response.modelUsed,
        costUSD: response.costUSD,
        creditsCost: response.creditsCost
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const estimateCosts = (inputTokens: number, outputTokens: number) => {
    return standardizedLLM.estimateCosts(inputTokens, outputTokens);
  };

  const getAvailableModels = () => {
    return standardizedLLM.getAvailableModels();
  };

  return {
    generateQuote,
    generateContent,
    estimateCosts,
    getAvailableModels,
    loading
  };
};

export default useLLM; 