// Prompt Loader Utility for Jung Therapeutic AI
// Loads and manages therapeutic prompts with context integration

import therapeuticPromptData from '../prompts/therapeutic-pattern-analysis.json';
import { PrivateConversationContext } from './privacyPreservingContext';

export interface LoadedPrompt {
  systemPrompt: string;
  contextualPrompt?: string;
  safetyGuidelines: any;
  exampleResponses: any;
}

export class TherapeuticPromptLoader {

  // Load the main therapeutic system prompt
  static getSystemPrompt(): string {
    return therapeuticPromptData.systemPrompt.content;
  }

  // Build contextual prompt with privacy-preserving user patterns
  static buildContextualPrompt(context: PrivateConversationContext): string {
    const baseContextPrompt = therapeuticPromptData.conversationContextPrompt.content;

    // Replace placeholders with actual context data
    return baseContextPrompt
      .replace('{recentThemes}', this.formatThemes(context.recentThemes))
      .replace('{historicalPatterns}', this.formatPatterns(context.historicalPatterns))
      .replace('{potentialCorrelations}', this.formatCorrelations(context.potentialCorrelations))
      .replace('{currentEmotionalContext}', this.formatEmotionalContext(context.emotionalTone));
  }

  // Build complete prompt combining system + context
  static buildCompletePrompt(context?: PrivateConversationContext): string {
    const systemPrompt = this.getSystemPrompt();

    if (!context) {
      return systemPrompt;
    }

    const contextualPrompt = this.buildContextualPrompt(context);
    return `${systemPrompt}\n\n${contextualPrompt}`;
  }

  // Get safety guidelines for crisis detection
  static getSafetyGuidelines() {
    return therapeuticPromptData.safetyGuidelines;
  }

  // Get example responses for specific scenarios
  static getExampleResponse(scenario: string) {
    return therapeuticPromptData.exampleResponses[scenario];
  }

  // Get privacy protection information
  static getPrivacyLayers() {
    return therapeuticPromptData.privacyProtectionLayers;
  }

  // Format recent themes for prompt context
  private static formatThemes(themes: any[]): string {
    if (!themes || themes.length === 0) {
      return 'No specific themes detected in current session.';
    }

    return themes.map(theme =>
      `- ${theme.themeType} (${theme.intensity} intensity, ${theme.frequency})`
    ).join('\n');
  }

  // Format historical patterns for prompt context
  private static formatPatterns(patterns: any[]): string {
    if (!patterns || patterns.length === 0) {
      return 'No significant historical patterns identified.';
    }

    return patterns.map(pattern =>
      `- Recurring ${pattern.themeType} concerns (${pattern.frequency} frequency)`
    ).join('\n');
  }

  // Format potential correlations for therapeutic exploration
  private static formatCorrelations(correlations: any[]): string {
    if (!correlations || correlations.length === 0) {
      return 'No obvious correlations detected between current and historical themes.';
    }

    return correlations.map(correlation => {
      const approach = correlation.therapeuticApproach;
      const confidence = Math.round(correlation.confidence * 100);

      return `- ${correlation.patternType} pattern detected (${confidence}% confidence)
  Suggested approach: ${approach}
  Relevant concepts: ${correlation.relevantConcepts?.join(', ') || 'general exploration'}`;
    }).join('\n\n');
  }

  // Format emotional context
  private static formatEmotionalContext(emotionalTone: string): string {
    const toneDescriptions = {
      distressed: 'User appears to be in significant emotional distress. Prioritize validation and safety.',
      sad: 'User is experiencing sadness or melancholy. Offer gentle support and exploration.',
      angry: 'User may be experiencing anger or frustration. Validate emotions while exploring underlying causes.',
      confused: 'User seems uncertain or confused. Provide clarity and help organize thoughts.',
      hopeful: 'User shows signs of hope or optimism. Build on positive momentum.',
      neutral: 'User appears emotionally balanced. Open to general exploration.'
    };

    return toneDescriptions[emotionalTone] || toneDescriptions.neutral;
  }

  // Get crisis response template based on severity
  static getCrisisResponse(severity: 'low' | 'medium' | 'high'): string {
    const responses = {
      low: therapeuticPromptData.safetyGuidelines.crisisResponse,
      medium: therapeuticPromptData.safetyGuidelines.crisisResponse,
      high: therapeuticPromptData.safetyGuidelines.crisisResponse
    };

    return responses[severity] || responses.medium;
  }
}

// Export commonly used prompts for easy access
export const THERAPEUTIC_PROMPTS = {
  system: () => TherapeuticPromptLoader.getSystemPrompt(),
  safetyGuidelines: () => TherapeuticPromptLoader.getSafetyGuidelines(),
};

// Helper function to get appropriate prompt based on user input
export function getAppropriatePrompt(
  userInput: string,
  context?: PrivateConversationContext
): LoadedPrompt {
  const systemPrompt = TherapeuticPromptLoader.getSystemPrompt();
  const contextualPrompt = context ? TherapeuticPromptLoader.buildContextualPrompt(context) : undefined;

  return {
    systemPrompt: context ? TherapeuticPromptLoader.buildCompletePrompt(context) : systemPrompt,
    contextualPrompt,
    safetyGuidelines: TherapeuticPromptLoader.getSafetyGuidelines(),
    exampleResponses: therapeuticPromptData.exampleResponses
  };
}