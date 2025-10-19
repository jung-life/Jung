// Intelligent model routing based on conversation complexity and user context
import { ModelStrategy, getOptimalModel } from '../config/models';

export interface RoutingContext {
  messageLength: number;
  conversationLength: number;
  avatarId: string;
  userMessage: string;
  subscriptionTier?: 'free' | 'weekly' | 'monthly' | 'annual';
  urgency?: 'low' | 'medium' | 'high';
}

export interface RoutingDecision {
  strategy: ModelStrategy;
  reasoning: string;
  expectedCost: number;
  qualityLevel: 'basic' | 'good' | 'excellent';
}

export class IntelligentModelRouter {

  /**
   * Determine optimal model strategy based on conversation context
   */
  static determineStrategy(context: RoutingContext): RoutingDecision {
    const {
      messageLength,
      conversationLength,
      avatarId,
      userMessage,
      subscriptionTier = 'free',
      urgency = 'medium'
    } = context;

    // Analyze conversation complexity
    const isEmotionallyIntense = this.detectEmotionalIntensity(userMessage);
    const isComplexPsychological = this.detectPsychologicalComplexity(userMessage, avatarId);
    const isLongConversation = conversationLength > 10;
    const isLongMessage = messageLength > 300;

    // Cost considerations based on subscription
    const costSensitivity = this.getCostSensitivity(subscriptionTier);

    // Routing logic
    if (isEmotionallyIntense || urgency === 'high') {
      // Critical emotional content - always use best quality
      return {
        strategy: 'quality-first',
        reasoning: 'Emotionally intense content requires highest quality therapeutic response',
        expectedCost: 0.006,
        qualityLevel: 'excellent'
      };
    }

    if (isComplexPsychological && (isLongConversation || isLongMessage)) {
      // Complex therapeutic discussion
      if (costSensitivity === 'high') {
        return {
          strategy: 'balanced',
          reasoning: 'Complex content with cost optimization for subscription tier',
          expectedCost: 0.004,
          qualityLevel: 'good'
        };
      } else {
        return {
          strategy: 'quality-first',
          reasoning: 'Complex psychological content requires premium models',
          expectedCost: 0.006,
          qualityLevel: 'excellent'
        };
      }
    }

    if (this.isSimpleQuery(userMessage)) {
      // Simple questions, affirmations, short responses
      return {
        strategy: 'cost-optimized',
        reasoning: 'Simple query can be handled by cost-effective models',
        expectedCost: 0.0008,
        qualityLevel: 'good'
      };
    }

    // Default cost-optimized approach with Claude 3.5 Haiku
    return {
      strategy: 'cost-optimized',
      reasoning: 'Standard conversation using cost-effective Claude 3.5 Haiku',
      expectedCost: 0.001,
      qualityLevel: 'good'
    };
  }

  /**
   * Detect emotional intensity in user message
   */
  private static detectEmotionalIntensity(message: string): boolean {
    const intensityMarkers = [
      'overwhelmed', 'panic', 'crisis', 'suicidal', 'hopeless', 'desperate',
      'can\'t cope', 'breaking down', 'falling apart', 'help me', 'emergency',
      'scared', 'terrified', 'anxiety attack', 'depression', 'hurt myself'
    ];

    const lowerMessage = message.toLowerCase();
    return intensityMarkers.some(marker => lowerMessage.includes(marker));
  }

  /**
   * Detect psychological complexity
   */
  private static detectPsychologicalComplexity(message: string, avatarId: string): boolean {
    const complexityMarkers = [
      'dream', 'unconscious', 'archetype', 'shadow', 'anima', 'animus',
      'complex', 'projection', 'transference', 'trauma', 'childhood',
      'relationship pattern', 'recurring', 'symbol', 'meaning',
      'therapy', 'analysis', 'psychological', 'pattern', 'behavior'
    ];

    const lowerMessage = message.toLowerCase();
    const hasComplexMarkers = complexityMarkers.some(marker =>
      lowerMessage.includes(marker)
    );

    // Depth-focused avatars handle more complex content
    const depthAvatars = ['depthdelver', 'oracle'];
    const isDepthAvatar = depthAvatars.includes(avatarId);

    return hasComplexMarkers || (isDepthAvatar && message.length > 150);
  }

  /**
   * Check if query is simple/basic
   */
  private static isSimpleQuery(message: string): boolean {
    const simplePatterns = [
      /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|good|great)$/i,
      /^.{1,50}$/,  // Very short messages
      /how are you/i,
      /what.*think/i,
      /tell me about/i
    ];

    return simplePatterns.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Determine cost sensitivity based on subscription tier
   */
  private static getCostSensitivity(tier: string): 'low' | 'medium' | 'high' {
    switch (tier) {
      case 'free':
        return 'high';
      case 'weekly':
        return 'medium';
      case 'monthly':
      case 'annual':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Get recommended strategy for avatar type
   */
  static getAvatarOptimalStrategy(avatarId: string): ModelStrategy {
    const avatarStrategies = {
      'depthdelver': 'quality-first',     // Complex psychological analysis
      'flourishingguide': 'cost-optimized', // Growth-focused with cost efficiency
      'oracle': 'quality-first',         // Wisdom requires quality
      'morpheus': 'cost-optimized',      // Challenging but cost-effective
      'jung': 'cost-optimized',          // Default Jung with Haiku
      'freud': 'cost-optimized',         // Default Freud with Haiku
      'rogers': 'cost-optimized'         // Default Rogers with Haiku
    };

    return (avatarStrategies[avatarId] as ModelStrategy) || 'cost-optimized';
  }
}

// Export convenience function
export function getOptimalRoutingStrategy(context: RoutingContext): RoutingDecision {
  return IntelligentModelRouter.determineStrategy(context);
}