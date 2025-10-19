import { anonymizeText, encryptData } from './security';
import { standardizedLLM } from './standardizedLLM';
import { creditService } from './creditService';
import { supabase } from './supabase';

const rateLimit = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn(...args);
  };
};

export const processAIRequest = rateLimit(async (userInput: string, userId: string) => {
  try {
    // Development bypass - return mock response in development
    if (__DEV__) {
      console.log('🚀 Development mode: returning mock AI response');
      return "This is a mock AI response for development testing. The actual AI service is bypassed in development mode to prevent API costs and errors.";
    }

    // 1. Anonymize the user input
    const anonymizedInput = anonymizeText(userInput);

    // 2. Use standardized LLM service with cost optimization
    const llmResponse = await standardizedLLM.generateQualityFirst(anonymizedInput, {
      systemPrompt: "You are a Jungian analysis assistant specializing in depth psychology, dream interpretation, and archetypal analysis.",
      maxTokens: 800,
      temperature: 0.7
    });

    // 3. Check and spend credits
    const creditsRequired = llmResponse.creditsCost;
    const hasSufficientCredits = await creditService.hasSufficientCredits(userId, creditsRequired);

    if (!hasSufficientCredits) {
      throw new Error('Insufficient credits for this request');
    }

    const creditSpent = await creditService.spendCredits(
      userId,
      creditsRequired,
      'usage',
      null,
      `AI analysis - ${llmResponse.modelUsed}`
    );

    if (!creditSpent) {
      throw new Error('Failed to process credit transaction');
    }

    // 4. Encrypt the response before storing
    const encryptedResponse = encryptData(llmResponse.content);

    // 5. Store encrypted response with cost tracking
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        encrypted_prompt: encryptData(userInput),
        encrypted_response: encryptedResponse,
        model_used: llmResponse.modelUsed,
        input_tokens: llmResponse.inputTokens,
        output_tokens: llmResponse.outputTokens,
        cost_usd: llmResponse.costUSD,
        credits_spent: creditsRequired,
        created_at: new Date().toISOString()
      });

    // 6. Record detailed message cost for analytics
    await creditService.recordMessageCost(
      `msg_${Date.now()}`,
      userId,
      null,
      'jungian-analyst',
      llmResponse.inputTokens,
      llmResponse.outputTokens,
      creditsRequired,
      Math.round(llmResponse.costUSD * 100), // Convert to cents
      llmResponse.provider,
      llmResponse.modelUsed
    );

    return llmResponse.content;
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw new Error('Failed to process your request');
  }
}, 1000); // 1 second delay 