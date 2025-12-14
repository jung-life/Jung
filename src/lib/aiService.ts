import { anonymizeText, encryptData } from './security';
import { standardizedLLM } from './standardizedLLM';
import { creditService } from './creditService';
import { supabase } from './supabase';
import { privacyPreservingContext } from './privacyPreservingContext';
import { TherapeuticPromptLoader } from './promptLoader';
import { ContentFilter, CRISIS_RESPONSES } from '../config/appStoreCompliance';
import { embeddingService } from './embeddingService';
import { cacheService } from './cacheService';

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

    // 1. Content filtering and safety checks
    const filterResult = ContentFilter.filterUserInput(userInput);
    if (!filterResult.allowed) {
      throw new Error(`Content not permitted: ${filterResult.reason}`);
    }

    // 2. Crisis detection
    const crisisDetection = ContentFilter.detectCrisisContent(userInput);
    if (crisisDetection.isCrisis && crisisDetection.severity === 'high') {
      // Return immediate crisis response without processing through LLM
      return CRISIS_RESPONSES.high;
    }

    // 3. Build privacy-preserving conversation context
    const conversationContext = await privacyPreservingContext.buildConversationContext(
      userId,
      userInput
    );

    // 4. Get appropriate therapeutic prompt with context
    const therapeuticPrompt = TherapeuticPromptLoader.buildCompletePrompt(conversationContext);

    // 4.5. Check cache first for similar queries (semantic similarity)
    const cachedResponse = await cacheService.getCachedResponse(
      userId,
      userInput,
      therapeuticPrompt
    );

    if (cachedResponse) {
      console.log('🎯 Cache hit! Returning cached response with similarity:', cachedResponse.similarity);

      // Still need to spend credits for cache hits (but reduced cost)
      const cacheHitCredits = Math.ceil(cachedResponse.creditsCost * 0.1); // 90% discount for cache hits
      const hasSufficientCredits = await creditService.hasSufficientCredits(userId, cacheHitCredits);

      if (!hasSufficientCredits) {
        throw new Error('Insufficient credits for this request');
      }

      const creditSpent = await creditService.spendCredits(
        userId,
        cacheHitCredits,
        'cache_hit',
        null,
        `Cache hit - ${cachedResponse.modelUsed}`
      );

      if (creditSpent) {
        return cachedResponse.content;
      }
    }

    // 5. Anonymize the user input
    const anonymizedInput = anonymizeText(userInput);

    // 6. Use standardized LLM service with therapeutic prompt and context
    const llmResponse = await standardizedLLM.generateQualityFirst(anonymizedInput, {
      systemPrompt: therapeuticPrompt,
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

    // 4. Generate embedding for semantic similarity (privacy-preserving)
    let promptEmbedding: number[] | null = null;
    let embeddingCost = 0;
    try {
      const embeddingResponse = await embeddingService.generateAnonymizedEmbedding(userInput);
      promptEmbedding = embeddingResponse.embedding;
      embeddingCost = embeddingResponse.costUSD;
    } catch (embeddingError) {
      console.warn('Failed to generate embedding, continuing without semantic context:', embeddingError);
      promptEmbedding = embeddingService.createZeroEmbedding(); // Fallback
    }

    // 5. Encrypt the response before storing
    const encryptedResponse = encryptData(llmResponse.content);

    // 6. Store encrypted response with embedding in conversation_cache
    await supabase
      .from('conversation_cache')
      .insert({
        user_id: userId,
        encrypted_prompt: encryptData(userInput),
        encrypted_response: encryptedResponse,
        prompt_embedding: promptEmbedding,
        model_used: llmResponse.modelUsed,
        input_tokens: llmResponse.inputTokens,
        output_tokens: llmResponse.outputTokens,
        cost_usd: llmResponse.costUSD + embeddingCost,
        credits_spent: creditsRequired,
        session_id: null, // Could be enhanced later for session tracking
        avatar_id: 'jung', // Default avatar
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
      });

    // 7. Also store in legacy conversations table for backward compatibility
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        encrypted_prompt: encryptData(userInput),
        encrypted_response: encryptedResponse,
        model_used: llmResponse.modelUsed,
        input_tokens: llmResponse.inputTokens,
        output_tokens: llmResponse.outputTokens,
        cost_usd: llmResponse.costUSD + embeddingCost,
        credits_spent: creditsRequired,
        created_at: new Date().toISOString()
      });

    // 8. Record detailed message cost for analytics (including embedding cost)
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

    // 7. Add disclaimers if required
    let finalResponse = llmResponse.content;
    const disclaimers = ContentFilter.requiresDisclaimer(userInput, finalResponse);
    if (disclaimers.length > 0) {
      finalResponse += '\n\n---\n' + disclaimers.join('\n\n');
    }

    // 8. Handle crisis content with appropriate response
    if (crisisDetection.isCrisis) {
      const crisisResponse = CRISIS_RESPONSES[crisisDetection.severity];
      finalResponse += '\n\n---\n' + crisisResponse;
    }

    // 9. Cache the response if beneficial (after all processing)
    if (cacheService.shouldCache(userInput, finalResponse.length, llmResponse.costUSD)) {
      await cacheService.cacheResponse(
        userId,
        userInput,
        finalResponse,
        llmResponse.modelUsed,
        llmResponse.inputTokens,
        llmResponse.outputTokens,
        llmResponse.costUSD + embeddingCost,
        creditsRequired,
        null, // sessionId - could be enhanced
        'jung'
      );
      console.log('💾 Response cached for future similar queries');
    }

    return finalResponse;
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw new Error('Failed to process your request');
  }
}, 1000); // 1 second delay 