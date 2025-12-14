// Apple App Store Compliance Configuration for Jung Therapeutic AI
// Based on App Review Guidelines and HIPAA requirements

export interface ComplianceSettings {
  contentFiltering: ContentFilterConfig;
  privacyProtections: PrivacyConfig;
  safetyMeasures: SafetyConfig;
  therapeuticBoundaries: TherapeuticConfig;
  dataHandling: DataHandlingConfig;
}

export interface ContentFilterConfig {
  blockedContent: string[];
  ageRating: '17+';
  sensitiveTopicHandling: SensitiveTopicConfig;
  disclaimerRequirements: DisclaimerConfig;
}

export interface PrivacyConfig {
  dataMinimization: boolean;
  encryptionRequired: boolean;
  userConsentRequired: boolean;
  thirdPartyDataSharing: boolean; // false for Jung
  anonymizationLevel: 'full' | 'partial';
  retentionPolicy: RetentionPolicy;
}

export interface SafetyConfig {
  crisisDetectionEnabled: boolean;
  suicidalIdeationResponse: CrisisResponse;
  selfHarmDetection: boolean;
  professionalReferralTriggers: string[];
  emergencyContacts: EmergencyContact[];
}

export interface TherapeuticConfig {
  diagnosticProhibitions: string[];
  medicalAdviceProhibitions: string[];
  therapyReplacement: boolean; // false - Jung supplements, doesn't replace therapy
  professionalBoundaries: BoundaryConfig;
  ethicalGuidelines: EthicalConfig;
}

export interface DataHandlingConfig {
  hipaaCompliance: boolean;
  gdprCompliance: boolean;
  coppaCompliance: boolean;
  localDataStorage: boolean;
  cloudDataSyncing: CloudConfig;
  userDataDeletion: DeletionConfig;
}

// Implementation
export const JUNG_APP_STORE_COMPLIANCE: ComplianceSettings = {
  contentFiltering: {
    blockedContent: [
      // Violence & harmful content (1.1.2)
      'graphic violence',
      'self-harm instructions',
      'suicide methods',
      'illegal drug use',
      'weapons instructions',

      // Inappropriate content (1.1.4)
      'explicit sexual content',
      'pornographic material',
      'adult dating services',

      // False information (1.1.6)
      'medical misinformation',
      'false health claims',
      'miracle cures',
      'diagnostic claims',

      // Discriminatory content (1.1.1)
      'hate speech',
      'discriminatory language',
      'targeted harassment'
    ],
    ageRating: '17+',
    sensitiveTopicHandling: {
      depression: {
        approach: 'supportive_exploration',
        requiredDisclaimer: true,
        professionalReferral: true,
        crisisDetection: true
      },
      anxiety: {
        approach: 'coping_strategies',
        requiredDisclaimer: true,
        professionalReferral: false,
        crisisDetection: false
      },
      suicidalIdeation: {
        approach: 'immediate_crisis_response',
        requiredDisclaimer: true,
        professionalReferral: true,
        crisisDetection: true
      },
      eatingDisorders: {
        approach: 'gentle_exploration',
        requiredDisclaimer: true,
        professionalReferral: true,
        crisisDetection: true
      },
      addiction: {
        approach: 'non_judgmental_support',
        requiredDisclaimer: true,
        professionalReferral: true,
        crisisDetection: false
      },
      trauma: {
        approach: 'trauma_informed',
        requiredDisclaimer: true,
        professionalReferral: true,
        crisisDetection: true
      }
    },
    disclaimerRequirements: {
      generalTherapy: "This is for educational and self-reflection purposes only. Jung is not a replacement for professional mental health care.",
      medicalTopics: "This information is not medical advice. Please consult with a healthcare provider for medical concerns.",
      crisis: "If you're experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.",
      privacy: "Your conversations are encrypted and private. We do not sell or share your personal data.",
      minors: "Users under 18 should use this app with parental guidance and professional supervision."
    }
  },

  privacyProtections: {
    dataMinimization: true, // Only collect data necessary for app function
    encryptionRequired: true, // All conversations encrypted at rest
    userConsentRequired: true, // Explicit consent for all data collection
    thirdPartyDataSharing: false, // No data sharing with third parties
    anonymizationLevel: 'full', // Full anonymization for pattern analysis
    retentionPolicy: {
      conversationData: '2_years', // User can delete earlier
      analyticsData: '1_year',
      crashLogs: '30_days',
      userAccounts: 'until_deletion_requested'
    }
  },

  safetyMeasures: {
    crisisDetectionEnabled: true,
    suicidalIdeationResponse: {
      immediateResponse: true,
      emergencyContacts: [
        {
          service: 'National Suicide Prevention Lifeline',
          number: '988',
          country: 'US'
        },
        {
          service: 'Crisis Text Line',
          contact: 'Text HOME to 741741',
          country: 'US'
        },
        {
          service: 'Emergency Services',
          number: '911',
          country: 'US'
        }
      ],
      professionalReferralRequired: true,
      conversationTermination: false // Continue with crisis support
    },
    selfHarmDetection: true,
    professionalReferralTriggers: [
      'persistent_suicidal_thoughts',
      'severe_depression_symptoms',
      'psychosis_indicators',
      'severe_eating_disorder_symptoms',
      'substance_abuse_crisis',
      'domestic_violence_disclosure',
      'child_abuse_disclosure'
    ],
    emergencyContacts: [
      {
        service: 'National Suicide Prevention Lifeline',
        number: '988',
        availability: '24/7',
        country: 'US'
      },
      {
        service: 'Crisis Text Line',
        contact: 'Text HOME to 741741',
        availability: '24/7',
        country: 'US'
      },
      {
        service: 'National Domestic Violence Hotline',
        number: '1-800-799-7233',
        availability: '24/7',
        country: 'US'
      },
      {
        service: 'SAMHSA Helpline',
        number: '1-800-662-4357',
        availability: '24/7',
        country: 'US'
      }
    ]
  },

  therapeuticBoundaries: {
    diagnosticProhibitions: [
      'mental_health_diagnosis',
      'medical_diagnosis',
      'personality_disorder_diagnosis',
      'psychiatric_medication_recommendations',
      'treatment_plan_creation',
      'therapy_session_replacement',
      'professional_assessment'
    ],
    medicalAdviceProhibitions: [
      'medication_dosage',
      'medical_treatment_recommendations',
      'health_condition_diagnosis',
      'symptom_diagnosis',
      'medical_emergency_treatment',
      'prescription_advice',
      'medical_procedure_guidance'
    ],
    therapyReplacement: false,
    professionalBoundaries: {
      roleDefinition: 'AI_therapeutic_companion',
      limitations: [
        'Not a licensed therapist',
        'Not a medical professional',
        'Cannot diagnose conditions',
        'Cannot prescribe treatments',
        'Cannot replace professional care'
      ],
      appropriateUse: [
        'Self-reflection and exploration',
        'Emotional support and validation',
        'Jungian psychology education',
        'Personal growth guidance',
        'Stress and anxiety coping strategies',
        'Relationship insight and reflection'
      ]
    },
    ethicalGuidelines: {
      doNoHarm: true,
      respectAutonomy: true,
      maintainConfidentiality: true,
      practiceWithinLimitations: true,
      encourageProfessionalHelp: true,
      avoidDualRelationships: true,
      maintainBoundaries: true
    }
  },

  dataHandling: {
    hipaaCompliance: true,
    gdprCompliance: true,
    coppaCompliance: true, // For users under 13 (requires parental consent)
    localDataStorage: true, // Primary storage on device
    cloudDataSyncing: {
      enabled: true,
      encrypted: true,
      userControlled: true,
      optOut: true,
      providers: ['supabase'], // HIPAA-compliant
      regions: ['US', 'EU'] // Region-specific compliance
    },
    userDataDeletion: {
      selfService: true, // Users can delete their own data
      completeDeletion: true, // All data including backups
      retentionOverride: false, // User choice overrides retention policy
      confirmationRequired: true,
      gracePeriod: '30_days' // Account recovery period
    }
  }
};

// Content filtering functions for real-time use
export class ContentFilter {

  static filterUserInput(input: string): { allowed: boolean; reason?: string; filteredInput?: string } {
    const blocked = JUNG_APP_STORE_COMPLIANCE.contentFiltering.blockedContent;

    for (const blockedTerm of blocked) {
      if (input.toLowerCase().includes(blockedTerm.toLowerCase())) {
        return {
          allowed: false,
          reason: `Content contains prohibited material: ${blockedTerm}`
        };
      }
    }

    // Check for crisis indicators
    const crisisTerms = ['suicide', 'kill myself', 'end it all', 'not worth living'];
    const hasCrisisContent = crisisTerms.some(term =>
      input.toLowerCase().includes(term.toLowerCase())
    );

    if (hasCrisisContent) {
      // Allow but flag for crisis response
      return {
        allowed: true,
        reason: 'crisis_content_detected',
        filteredInput: input
      };
    }

    return {
      allowed: true,
      filteredInput: input
    };
  }

  static requiresDisclaimer(input: string, responseContent: string): string[] {
    const disclaimers: string[] = [];
    const disclaimerConfig = JUNG_APP_STORE_COMPLIANCE.contentFiltering.disclaimerRequirements;

    // Always include general therapy disclaimer
    disclaimers.push(disclaimerConfig.generalTherapy);

    // Check for medical content
    const medicalTerms = ['symptom', 'treatment', 'medication', 'diagnosis', 'health'];
    if (medicalTerms.some(term =>
      input.toLowerCase().includes(term) || responseContent.toLowerCase().includes(term)
    )) {
      disclaimers.push(disclaimerConfig.medicalTopics);
    }

    // Check for crisis content
    if (responseContent.includes('crisis') || responseContent.includes('emergency')) {
      disclaimers.push(disclaimerConfig.crisis);
    }

    return disclaimers;
  }

  static detectCrisisContent(input: string): { isCrisis: boolean; severity: 'low' | 'medium' | 'high' } {
    const highRiskTerms = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'not worth living', 'better off dead', 'end it all'
    ];

    const mediumRiskTerms = [
      'hopeless', 'can\'t go on', 'what\'s the point', 'give up',
      'no way out', 'trapped', 'overwhelmed'
    ];

    const lowRiskTerms = [
      'depressed', 'sad', 'down', 'struggling', 'difficult time'
    ];

    const lowerInput = input.toLowerCase();

    if (highRiskTerms.some(term => lowerInput.includes(term))) {
      return { isCrisis: true, severity: 'high' };
    }

    if (mediumRiskTerms.some(term => lowerInput.includes(term))) {
      return { isCrisis: true, severity: 'medium' };
    }

    if (lowRiskTerms.some(term => lowerInput.includes(term))) {
      return { isCrisis: true, severity: 'low' };
    }

    return { isCrisis: false, severity: 'low' };
  }
}

// Crisis response templates
export const CRISIS_RESPONSES = {
  high: `I'm really concerned about what you're sharing. These feelings are serious and you deserve immediate professional support. Please reach out to:

• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911
• Or go to your nearest emergency room

You are not alone, and there are people trained specifically to help with these feelings. Would you like me to help you think through taking one of these steps?`,

  medium: `I hear that you're going through a really difficult time right now. These feelings are important and deserve attention. While I can provide some support, I also want to encourage you to reach out to:

• National Suicide Prevention Lifeline: 988 (free, confidential, 24/7)
• Crisis Text Line: Text HOME to 741741
• A trusted friend, family member, or counselor

Would you like to talk about what's making things feel so difficult right now? Remember, this is for support and self-reflection - professional help can provide additional resources and care.`,

  low: `I can hear that you're struggling right now, and I want you to know that your feelings are valid and important. While we can explore these feelings together, please remember that this is for educational and self-reflection purposes only.

If these feelings persist or worsen, please consider reaching out to a mental health professional who can provide personalized support. You deserve care and support.

What would feel most helpful to explore right now?`
};

// App Store specific metadata compliance
export const APP_STORE_METADATA = {
  ageRating: '17+',
  categoryPrimary: 'Health & Fitness',
  categorySecondary: 'Lifestyle',
  keywords: [
    'therapy', 'mental health', 'psychology', 'jung', 'jungian',
    'self-reflection', 'personal growth', 'mindfulness', 'wellness',
    'emotional support', 'depth psychology', 'archetypal'
  ],
  prohibitedKeywords: [
    'diagnosis', 'treatment', 'cure', 'medical', 'prescription',
    'therapy replacement', 'clinical', 'professional therapy'
  ],
  requiredPrivacyPolicy: true,
  requiredTermsOfService: true,
  dataCollectionDisclosure: {
    personalData: true,
    conversationContent: true,
    usageAnalytics: true,
    crashReports: true,
    neverCollected: [
      'financial_info',
      'health_records',
      'contact_info_of_others',
      'browsing_history',
      'location_beyond_general_area'
    ]
  }
};

type SensitiveTopicConfig = Record<string, {
  approach: string;
  requiredDisclaimer: boolean;
  professionalReferral: boolean;
  crisisDetection: boolean;
}>;

type DisclaimerConfig = {
  generalTherapy: string;
  medicalTopics: string;
  crisis: string;
  privacy: string;
  minors: string;
};

type RetentionPolicy = {
  conversationData: string;
  analyticsData: string;
  crashLogs: string;
  userAccounts: string;
};

type CrisisResponse = {
  immediateResponse: boolean;
  emergencyContacts: EmergencyContact[];
  professionalReferralRequired: boolean;
  conversationTermination: boolean;
};

type EmergencyContact = {
  service: string;
  number?: string;
  contact?: string;
  availability?: string;
  country: string;
};

type BoundaryConfig = {
  roleDefinition: string;
  limitations: string[];
  appropriateUse: string[];
};

type EthicalConfig = {
  doNoHarm: boolean;
  respectAutonomy: boolean;
  maintainConfidentiality: boolean;
  practiceWithinLimitations: boolean;
  encourageProfessionalHelp: boolean;
  avoidDualRelationships: boolean;
  maintainBoundaries: boolean;
};

type CloudConfig = {
  enabled: boolean;
  encrypted: boolean;
  userControlled: boolean;
  optOut: boolean;
  providers: string[];
  regions: string[];
};

type DeletionConfig = {
  selfService: boolean;
  completeDeletion: boolean;
  retentionOverride: boolean;
  confirmationRequired: boolean;
  gracePeriod: string;
};