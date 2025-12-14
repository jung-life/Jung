// Privacy-Preserving Conversation Context Management
// HIPAA-Compliant pattern recognition without exposing personal data

import { supabase } from './supabase';
import { decryptData, anonymizeText } from './security';

export interface AnonymizedPattern {
  themeType: 'anxiety' | 'depression' | 'relationships' | 'work_stress' | 'eating_patterns' | 'life_transitions' | 'sleep_issues' | 'family_dynamics';
  intensity: 'low' | 'moderate' | 'high';
  frequency: 'rare' | 'occasional' | 'frequent' | 'persistent';
  timeframe: 'recent' | 'ongoing' | 'historical';
  correlatedThemes: string[];
  archetypeInvolved?: 'shadow' | 'anima_animus' | 'persona' | 'self' | 'mother' | 'father' | 'wise_old_man' | 'trickster';
}

export interface ContextualInsight {
  patternType: string;
  confidence: number; // 0-1
  therapeuticApproach: 'exploration' | 'validation' | 'reframing' | 'integration';
  suggestedQuestions: string[];
  relevantConcepts: string[];
  safetyFlags?: string[];
}

export interface PrivateConversationContext {
  userId: string;
  currentPrompt: string;
  recentThemes: AnonymizedPattern[];
  historicalPatterns: AnonymizedPattern[];
  potentialCorrelations: ContextualInsight[];
  emotionalTone: 'distressed' | 'neutral' | 'hopeful' | 'confused' | 'angry' | 'sad';
  sessionContext: string; // Non-identifiable summary
}

class PrivacyPreservingContextManager {

  // Extract themes without revealing specific conversation content
  private async extractAnonymizedThemes(
    conversationText: string,
    userId: string
  ): Promise<AnonymizedPattern[]> {
    const themes: AnonymizedPattern[] = [];

    // Anonymize text before analysis
    const anonymizedText = anonymizeText(conversationText);

    // Pattern detection using keyword analysis (no external LLM calls for privacy)
    const patterns = {
      anxiety: ['anxious', 'worried', 'panic', 'stress', 'nervous', 'overwhelmed'],
      depression: ['depressed', 'sad', 'hopeless', 'empty', 'down', 'unmotivated'],
      relationships: ['relationship', 'partner', 'family', 'friends', 'conflict', 'love'],
      work_stress: ['work', 'job', 'career', 'boss', 'deadline', 'performance'],
      eating_patterns: ['eating', 'food', 'appetite', 'weight', 'diet', 'hungry'],
      life_transitions: ['change', 'transition', 'new', 'moving', 'graduation', 'marriage'],
      sleep_issues: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'dreams'],
      family_dynamics: ['parents', 'mother', 'father', 'siblings', 'family', 'childhood']
    };

    for (const [themeType, keywords] of Object.entries(patterns)) {
      const mentions = keywords.filter(keyword =>
        anonymizedText.toLowerCase().includes(keyword)
      ).length;

      if (mentions > 0) {
        const intensity = mentions >= 3 ? 'high' : mentions >= 2 ? 'moderate' : 'low';

        themes.push({
          themeType: themeType as AnonymizedPattern['themeType'],
          intensity,
          frequency: 'recent', // Current session
          timeframe: 'recent',
          correlatedThemes: this.findCorrelatedThemes(themeType, themes)
        });
      }
    }

    return themes;
  }

  private findCorrelatedThemes(currentTheme: string, existingThemes: AnonymizedPattern[]): string[] {
    // Common therapeutic correlations (based on clinical research)
    const correlations: Record<string, string[]> = {
      depression: ['eating_patterns', 'sleep_issues', 'relationships'],
      anxiety: ['work_stress', 'sleep_issues', 'family_dynamics'],
      eating_patterns: ['depression', 'anxiety', 'life_transitions'],
      work_stress: ['anxiety', 'relationships', 'sleep_issues'],
      relationships: ['depression', 'anxiety', 'family_dynamics'],
      life_transitions: ['anxiety', 'relationships', 'work_stress']
    };

    const related = correlations[currentTheme] || [];
    return existingThemes
      .filter(theme => related.includes(theme.themeType))
      .map(theme => theme.themeType);
  }

  // Get historical patterns without exposing conversation content
  private async getHistoricalPatterns(userId: string): Promise<AnonymizedPattern[]> {
    // Query conversation_patterns table (aggregated, anonymized data)
    const { data: patterns } = await supabase
      .from('conversation_patterns')
      .select('pattern_type, frequency, intensity, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false });

    if (!patterns) return [];

    return patterns.map(pattern => ({
      themeType: pattern.pattern_type as AnonymizedPattern['themeType'],
      intensity: pattern.intensity as AnonymizedPattern['intensity'],
      frequency: this.calculateFrequency(patterns, pattern.pattern_type),
      timeframe: 'historical',
      correlatedThemes: []
    }));
  }

  private calculateFrequency(patterns: any[], themeType: string): AnonymizedPattern['frequency'] {
    const occurrences = patterns.filter(p => p.pattern_type === themeType).length;
    if (occurrences >= 10) return 'persistent';
    if (occurrences >= 5) return 'frequent';
    if (occurrences >= 2) return 'occasional';
    return 'rare';
  }

  // Generate therapeutic insights without revealing source data
  private generateContextualInsights(
    currentThemes: AnonymizedPattern[],
    historicalPatterns: AnonymizedPattern[]
  ): ContextualInsight[] {
    const insights: ContextualInsight[] = [];

    // Look for recurring patterns
    for (const currentTheme of currentThemes) {
      const historicalMatch = historicalPatterns.find(
        h => h.themeType === currentTheme.themeType
      );

      if (historicalMatch && historicalMatch.frequency !== 'rare') {
        insights.push({
          patternType: `recurring_${currentTheme.themeType}`,
          confidence: this.calculateConfidence(currentTheme, historicalMatch),
          therapeuticApproach: this.getTherapeuticApproach(currentTheme.themeType),
          suggestedQuestions: this.getSuggestedQuestions(currentTheme.themeType),
          relevantConcepts: this.getJungianConcepts(currentTheme.themeType),
          safetyFlags: this.checkSafetyFlags(currentTheme)
        });
      }
    }

    // Look for correlations
    this.identifyCorrelations(currentThemes, insights);

    return insights;
  }

  private calculateConfidence(current: AnonymizedPattern, historical: AnonymizedPattern): number {
    let confidence = 0.5; // Base confidence

    if (historical.frequency === 'persistent') confidence += 0.3;
    else if (historical.frequency === 'frequent') confidence += 0.2;

    if (current.intensity === 'high') confidence += 0.2;
    else if (current.intensity === 'moderate') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private getTherapeuticApproach(themeType: string): ContextualInsight['therapeuticApproach'] {
    const approaches: Record<string, ContextualInsight['therapeuticApproach']> = {
      depression: 'validation',
      anxiety: 'exploration',
      relationships: 'integration',
      work_stress: 'reframing',
      eating_patterns: 'exploration',
      life_transitions: 'integration'
    };

    return approaches[themeType] || 'exploration';
  }

  private getSuggestedQuestions(themeType: string): string[] {
    const questions: Record<string, string[]> = {
      depression: [
        "What emotions have been most present for you lately?",
        "Have you noticed any patterns in when these feelings are strongest?",
        "What brings you even small moments of relief or comfort?"
      ],
      anxiety: [
        "What thoughts tend to occupy your mind when anxiety arises?",
        "How does anxiety show up in your body?",
        "What situations or triggers have you noticed?"
      ],
      eating_patterns: [
        "Have you noticed connections between your emotions and eating patterns?",
        "What role does food play in your comfort or stress management?",
        "How do you feel before, during, and after eating?"
      ],
      work_stress: [
        "What aspects of work feel most challenging right now?",
        "How do you typically manage work-related stress?",
        "What would 'balance' look like for you?"
      ]
    };

    return questions[themeType] || [
      "What feelings are most present for you right now?",
      "How has this been affecting other areas of your life?"
    ];
  }

  private getJungianConcepts(themeType: string): string[] {
    const concepts: Record<string, string[]> = {
      depression: ['shadow integration', 'dark night of the soul', 'individuation process'],
      anxiety: ['persona vs authentic self', 'anima/animus projection', 'collective unconscious fears'],
      relationships: ['anima/animus projection', 'persona dynamics', 'shadow projection'],
      work_stress: ['persona overidentification', 'self vs ego', 'life purpose'],
      eating_patterns: ['mother archetype', 'self-nurturing', 'body-soul connection']
    };

    return concepts[themeType] || ['individuation', 'consciousness expansion'];
  }

  private checkSafetyFlags(theme: AnonymizedPattern): string[] | undefined {
    const flags: string[] = [];

    if (theme.themeType === 'depression' && theme.intensity === 'high') {
      flags.push('monitor_for_suicidal_ideation');
    }

    if (theme.themeType === 'eating_patterns' && theme.intensity === 'high') {
      flags.push('potential_eating_disorder');
    }

    return flags.length > 0 ? flags : undefined;
  }

  private identifyCorrelations(themes: AnonymizedPattern[], insights: ContextualInsight[]): void {
    // Depression + Eating patterns correlation
    const hasDepression = themes.some(t => t.themeType === 'depression');
    const hasEatingIssues = themes.some(t => t.themeType === 'eating_patterns');

    if (hasDepression && hasEatingIssues) {
      insights.push({
        patternType: 'depression_eating_correlation',
        confidence: 0.7,
        therapeuticApproach: 'exploration',
        suggestedQuestions: [
          "Have you noticed any connections between your mood and your relationship with food?",
          "How do you typically nurture yourself when you're feeling down?",
          "What emotions tend to arise around food and eating?"
        ],
        relevantConcepts: ['self-nurturing', 'emotional regulation', 'mother archetype']
      });
    }

    // Anxiety + Work stress + Relationships
    const hasAnxiety = themes.some(t => t.themeType === 'anxiety');
    const hasWorkStress = themes.some(t => t.themeType === 'work_stress');
    const hasRelationshipIssues = themes.some(t => t.themeType === 'relationships');

    if (hasAnxiety && hasWorkStress && hasRelationshipIssues) {
      insights.push({
        patternType: 'life_balance_struggle',
        confidence: 0.8,
        therapeuticApproach: 'integration',
        suggestedQuestions: [
          "How do you experience the balance between work and personal life?",
          "What parts of yourself feel most important to honor right now?",
          "Where do you feel most authentic and at peace?"
        ],
        relevantConcepts: ['persona vs self', 'life balance', 'authentic living']
      });
    }
  }

  // Main public method to build privacy-preserving context
  public async buildConversationContext(
    userId: string,
    currentPrompt: string
  ): Promise<PrivateConversationContext> {
    try {
      // Extract themes from current prompt (anonymized)
      const recentThemes = await this.extractAnonymizedThemes(currentPrompt, userId);

      // Get historical patterns (aggregated data only)
      const historicalPatterns = await this.getHistoricalPatterns(userId);

      // Generate insights without exposing source conversations
      const potentialCorrelations = this.generateContextualInsights(
        recentThemes,
        historicalPatterns
      );

      // Determine emotional tone (anonymized analysis)
      const emotionalTone = this.analyzeEmotionalTone(currentPrompt);

      // Store pattern data (anonymized) for future context
      await this.storeAnonymizedPattern(userId, recentThemes);

      return {
        userId,
        currentPrompt: anonymizeText(currentPrompt), // Store anonymized version
        recentThemes,
        historicalPatterns,
        potentialCorrelations,
        emotionalTone,
        sessionContext: this.buildSessionSummary(recentThemes, potentialCorrelations)
      };

    } catch (error) {
      console.error('Error building conversation context:', error);

      // Fallback to basic context without historical patterns
      return {
        userId,
        currentPrompt: anonymizeText(currentPrompt),
        recentThemes: [],
        historicalPatterns: [],
        potentialCorrelations: [],
        emotionalTone: 'neutral',
        sessionContext: 'New conversation session'
      };
    }
  }

  private analyzeEmotionalTone(text: string): PrivateConversationContext['emotionalTone'] {
    const distressWords = ['terrible', 'awful', 'horrible', 'devastated', 'hopeless'];
    const sadWords = ['sad', 'down', 'depressed', 'blue', 'melancholy'];
    const angryWords = ['angry', 'furious', 'mad', 'frustrated', 'irritated'];
    const confusedWords = ['confused', 'lost', 'unclear', 'uncertain', 'don\\'t know'];
    const hopefulWords = ['hope', 'better', 'improving', 'positive', 'optimistic'];

    const lowerText = text.toLowerCase();

    if (distressWords.some(word => lowerText.includes(word))) return 'distressed';
    if (angryWords.some(word => lowerText.includes(word))) return 'angry';
    if (sadWords.some(word => lowerText.includes(word))) return 'sad';
    if (confusedWords.some(word => lowerText.includes(word))) return 'confused';
    if (hopefulWords.some(word => lowerText.includes(word))) return 'hopeful';

    return 'neutral';
  }

  private buildSessionSummary(
    themes: AnonymizedPattern[],
    insights: ContextualInsight[]
  ): string {
    const themeNames = themes.map(t => t.themeType).join(', ');
    const hasCorrelations = insights.length > 0;

    return `Session exploring ${themeNames}. ${
      hasCorrelations ? 'Potential patterns detected for therapeutic exploration.' : 'Initial assessment.'
    }`;
  }

  // Store anonymized pattern data for future context building
  private async storeAnonymizedPattern(
    userId: string,
    themes: AnonymizedPattern[]
  ): Promise<void> {
    for (const theme of themes) {
      // Check if this pattern already exists for today
      const today = new Date().toISOString().split('T')[0];

      const { data: existingPattern } = await supabase
        .from('conversation_patterns')
        .select('id, frequency')
        .eq('user_id', userId)
        .eq('pattern_type', theme.themeType)
        .gte('created_at', `${today}T00:00:00Z`)
        .maybeSingle();

      if (existingPattern) {
        // Update frequency count
        await supabase
          .from('conversation_patterns')
          .update({
            frequency: this.incrementFrequency(existingPattern.frequency),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPattern.id);
      } else {
        // Create new pattern entry
        await supabase
          .from('conversation_patterns')
          .insert({
            user_id: userId,
            pattern_type: theme.themeType,
            intensity: theme.intensity,
            frequency: 'rare', // Start with rare, will increment over time
            created_at: new Date().toISOString()
          });
      }
    }
  }

  private incrementFrequency(currentFrequency: string): string {
    switch (currentFrequency) {
      case 'rare': return 'occasional';
      case 'occasional': return 'frequent';
      case 'frequent': return 'persistent';
      default: return 'persistent';
    }
  }
}

export const privacyPreservingContext = new PrivacyPreservingContextManager();