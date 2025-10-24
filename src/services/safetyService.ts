import { Alert, Linking } from 'react-native';

export interface SafetyCheck {
  isSafe: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'crisis';
  triggeredKeywords: string[];
  interventionRequired: boolean;
  recommendedAction: 'continue' | 'show_warning' | 'redirect_emergency' | 'block_response';
  message?: string;
}

export interface MedicalAdviceCheck {
  containsMedicalAdvice: boolean;
  medicalKeywords: string[];
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  shouldBlock: boolean;
}

export class SafetyService {
  // Crisis and self-harm keywords - highest priority
  private static readonly CRISIS_KEYWORDS = [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
    'self harm', 'self-harm', 'cut myself', 'hurt myself', 'end it all',
    'no point living', 'better off dead', 'overdose', 'jump off',
    'hang myself', 'pills to die', 'razor', 'cutting', 'slitting',
    'gun to my head', 'bridge', 'cliff', 'carbon monoxide'
  ];

  // Emergency and crisis situation keywords
  private static readonly EMERGENCY_KEYWORDS = [
    'emergency', 'crisis', 'panic attack', 'can\'t breathe', 'chest pain',
    'heart attack', 'stroke', 'bleeding', 'overdosed', 'poisoned',
    'abuse', 'violence', 'rape', 'assault', 'threat', 'danger',
    'help me', 'call 911', 'ambulance', 'hospital', 'emergency room'
  ];

  // High-risk mental health keywords
  private static readonly HIGH_RISK_KEYWORDS = [
    'hopeless', 'worthless', 'useless', 'burden', 'trapped',
    'can\'t cope', 'breaking down', 'falling apart', 'giving up',
    'desperate', 'drowning', 'suffocating', 'numb', 'empty inside',
    'void', 'darkness', 'abyss', 'rock bottom', 'lost cause'
  ];

  // Medical advice keywords that should be blocked
  private static readonly MEDICAL_ADVICE_KEYWORDS = [
    'diagnose', 'diagnosis', 'prescribe', 'prescription', 'medication',
    'medicine', 'dosage', 'treatment plan', 'medical treatment',
    'therapy session', 'psychiatric', 'antidepressant', 'antipsychotic',
    'bipolar disorder', 'schizophrenia', 'clinical depression',
    'you have', 'you suffer from', 'you need to take', 'stop taking',
    'increase dose', 'decrease dose', 'side effects', 'drug interaction'
  ];

  // Medical condition keywords
  private static readonly MEDICAL_CONDITION_KEYWORDS = [
    'mental illness', 'disorder', 'syndrome', 'disease', 'condition',
    'symptoms of', 'signs of', 'clinical', 'pathological', 'abnormal',
    'dysfunction', 'impairment', 'deficiency', 'imbalance'
  ];

  /**
   * Comprehensive safety check for user input
   */
  static checkUserInputSafety(message: string): SafetyCheck {
    const lowerMessage = message.toLowerCase();
    const triggeredKeywords: string[] = [];
    let riskLevel: SafetyCheck['riskLevel'] = 'none';
    let interventionRequired = false;
    let recommendedAction: SafetyCheck['recommendedAction'] = 'continue';

    // Check for crisis keywords - highest priority
    const crisisKeywords = this.CRISIS_KEYWORDS.filter(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (crisisKeywords.length > 0) {
      triggeredKeywords.push(...crisisKeywords);
      riskLevel = 'crisis';
      interventionRequired = true;
      recommendedAction = 'redirect_emergency';
    }

    // Check for emergency keywords
    const emergencyKeywords = this.EMERGENCY_KEYWORDS.filter(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (emergencyKeywords.length > 0 && riskLevel !== 'crisis') {
      triggeredKeywords.push(...emergencyKeywords);
      riskLevel = 'high';
      interventionRequired = true;
      recommendedAction = 'redirect_emergency';
    }

    // Check for high-risk mental health keywords
    const highRiskKeywords = this.HIGH_RISK_KEYWORDS.filter(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (highRiskKeywords.length > 0 && riskLevel === 'none') {
      triggeredKeywords.push(...highRiskKeywords);
      riskLevel = 'high';
      interventionRequired = true;
      recommendedAction = 'show_warning';
    }

    return {
      isSafe: riskLevel === 'none' || riskLevel === 'low',
      riskLevel,
      triggeredKeywords,
      interventionRequired,
      recommendedAction,
      message: this.getSafetyMessage(riskLevel, triggeredKeywords)
    };
  }

  /**
   * Check AI response for medical advice or inappropriate content
   */
  static checkResponseSafety(response: string): MedicalAdviceCheck {
    const lowerResponse = response.toLowerCase();
    const medicalKeywords: string[] = [];
    let severity: MedicalAdviceCheck['severity'] = 'none';

    // Check for direct medical advice
    const adviceKeywords = this.MEDICAL_ADVICE_KEYWORDS.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    );
    if (adviceKeywords.length > 0) {
      medicalKeywords.push(...adviceKeywords);
      severity = 'severe';
    }

    // Check for medical condition diagnosis language
    const conditionKeywords = this.MEDICAL_CONDITION_KEYWORDS.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    );
    if (conditionKeywords.length > 0 && severity === 'none') {
      medicalKeywords.push(...conditionKeywords);
      severity = 'moderate';
    }

    // Check for phrases that suggest medical diagnosis
    const diagnosticPhrases = [
      'you have', 'you suffer from', 'you are experiencing symptoms of',
      'this indicates', 'sounds like you have', 'appears to be'
    ];

    const hasDiagnosticLanguage = diagnosticPhrases.some(phrase =>
      lowerResponse.includes(phrase)
    );

    if (hasDiagnosticLanguage && severity === 'none') {
      severity = 'moderate';
    }

    return {
      containsMedicalAdvice: medicalKeywords.length > 0 || hasDiagnosticLanguage,
      medicalKeywords,
      severity,
      shouldBlock: severity === 'severe'
    };
  }

  /**
   * Handle crisis intervention - show emergency resources
   */
  static handleCrisisIntervention(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🚨 Crisis Support Available',
        'It sounds like you may be going through a difficult time. Your safety and well-being are important.\n\nThis app is not designed for crisis situations. Please reach out for immediate professional support:',
        [
          {
            text: 'Call 988 (Suicide & Crisis Lifeline)',
            onPress: () => {
              Linking.openURL('tel:988');
              resolve(false); // Don't continue with AI conversation
            }
          },
          {
            text: 'Call 911 (Emergency)',
            onPress: () => {
              Linking.openURL('tel:911');
              resolve(false);
            }
          },
          {
            text: 'Get Online Support',
            onPress: () => {
              Linking.openURL('https://suicidepreventionlifeline.org/chat/');
              resolve(false);
            }
          },
          {
            text: 'I\'m Safe - Continue',
            style: 'cancel',
            onPress: () => resolve(true)
          }
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Show professional referral suggestion
   */
  static showProfessionalReferral(riskLevel: SafetyCheck['riskLevel']): void {
    const title = riskLevel === 'high' ? 'Professional Support Recommended' : 'Consider Professional Support';
    const message = riskLevel === 'high'
      ? 'Based on what you\'ve shared, it might be helpful to speak with a qualified mental health professional who can provide personalized support.'
      : 'For ongoing support with these feelings, consider speaking with a counselor, therapist, or your healthcare provider.';

    Alert.alert(
      title,
      `${message}\n\nThis app provides educational content for self-reflection, but professional support can offer personalized guidance for your specific situation.`,
      [
        {
          text: 'Find Local Resources',
          onPress: () => Linking.openURL('https://www.psychologytoday.com/us/therapists')
        },
        {
          text: 'Crisis Text Line',
          onPress: () => Linking.openURL('sms:741741')
        },
        {
          text: 'Continue Conversation',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Generate appropriate safety message based on risk level
   */
  private static getSafetyMessage(riskLevel: SafetyCheck['riskLevel'], keywords: string[]): string {
    switch (riskLevel) {
      case 'crisis':
        return 'Crisis keywords detected. Immediate professional support is recommended.';
      case 'high':
        return 'High-risk content detected. Professional support may be beneficial.';
      case 'medium':
        return 'Potentially concerning content detected. Please prioritize your well-being.';
      case 'low':
        return 'Mild concern detected. Remember that professional support is available if needed.';
      default:
        return '';
    }
  }

  /**
   * Generate safe alternative response when medical advice is detected
   */
  static generateSafeAlternativeResponse(originalResponse: string, medicalCheck: MedicalAdviceCheck): string {
    if (medicalCheck.severity === 'severe') {
      return `I understand you're looking for guidance, but I can't provide medical advice or diagnosis. Instead, let me offer some general perspective on personal growth and self-reflection.

What I can share is that many people find it helpful to explore their thoughts and feelings as part of their personal development journey. Consider speaking with a qualified healthcare professional who can provide personalized guidance for your specific situation.

Would you like to explore how this situation might be an opportunity for personal reflection or growth?

**Reminder:** This conversation is for educational and self-reflection purposes only. For medical concerns, please consult qualified healthcare professionals.`;
    }

    // For moderate severity, modify the response to add disclaimers
    return `${originalResponse}

**Important Reminder:** This reflection is for educational and personal development purposes only. If you're experiencing persistent concerns about your mental health, please consider speaking with a qualified healthcare professional who can provide personalized guidance.`;
  }

  /**
   * Enhanced system prompt additions for avatar safety
   */
  static getEnhancedSafetyPrompt(): string {
    return `
CRITICAL SAFETY GUIDELINES:
- You are an educational personal development guide, NOT a medical professional
- NEVER provide medical advice, diagnosis, treatment recommendations, or medication suggestions
- NEVER diagnose mental health conditions or suggest someone has a specific disorder
- If users mention crisis, self-harm, or emergency situations, respond with: "I'm concerned about your safety. Please contact emergency services (911) or the crisis lifeline (988) immediately for professional support. This app is not designed for crisis situations."
- Always include disclaimers about seeking professional help for medical or mental health concerns
- Focus on personal growth, self-reflection, and educational insights only
- If uncertain about response safety, err on the side of caution and suggest professional consultation

RESPONSE SAFETY RULES:
- Never use phrases like "you have," "you suffer from," "you need medication," or "stop taking"
- Avoid diagnostic language or medical terminology when describing user experiences
- Replace medical terms with personal development language
- Always emphasize that insights are for educational reflection only
`;
  }
}

export const safetyService = new SafetyService();