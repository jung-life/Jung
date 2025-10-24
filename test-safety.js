// Simple test script for safety service
// Note: This is a simulation since we can't directly import TypeScript modules in Node.js
// We'll recreate the SafetyService logic for testing

class SafetyService {
  // Crisis and self-harm keywords - highest priority
  static CRISIS_KEYWORDS = [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
    'self harm', 'self-harm', 'cut myself', 'hurt myself', 'end it all',
    'no point living', 'better off dead', 'overdose', 'jump off',
    'hang myself', 'pills to die', 'razor', 'cutting', 'slitting',
    'gun to my head', 'bridge', 'cliff', 'carbon monoxide'
  ];

  // High-risk mental health keywords
  static HIGH_RISK_KEYWORDS = [
    'hopeless', 'worthless', 'useless', 'burden', 'trapped',
    'can\'t cope', 'breaking down', 'falling apart', 'giving up',
    'desperate', 'drowning', 'suffocating', 'numb', 'empty inside',
    'void', 'darkness', 'abyss', 'rock bottom', 'lost cause'
  ];

  // Medical advice keywords that should be blocked
  static MEDICAL_ADVICE_KEYWORDS = [
    'diagnose', 'diagnosis', 'prescribe', 'prescription', 'medication',
    'medicine', 'dosage', 'treatment plan', 'medical treatment',
    'therapy session', 'psychiatric', 'antidepressant', 'antipsychotic',
    'bipolar disorder', 'schizophrenia', 'clinical depression',
    'you have', 'you suffer from', 'you need to take', 'stop taking',
    'increase dose', 'decrease dose', 'side effects', 'drug interaction'
  ];

  static checkUserInputSafety(message) {
    const lowerMessage = message.toLowerCase();
    const triggeredKeywords = [];
    let riskLevel = 'none';
    let interventionRequired = false;
    let recommendedAction = 'continue';

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
      recommendedAction
    };
  }

  static checkResponseSafety(response) {
    const lowerResponse = response.toLowerCase();
    const medicalKeywords = [];
    let severity = 'none';

    // Check for direct medical advice
    const adviceKeywords = this.MEDICAL_ADVICE_KEYWORDS.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    );
    if (adviceKeywords.length > 0) {
      medicalKeywords.push(...adviceKeywords);
      severity = 'severe';
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
}

console.log('🛡️ Testing Safety Guard Rails\n');

// Test 1: Crisis Detection
console.log('=== Test 1: Crisis Detection ===');
const crisisTests = [
  'I want to kill myself',
  'I am thinking about suicide',
  'I feel like ending it all',
  'I want to hurt myself',
  'I just want to die'
];

crisisTests.forEach((test, index) => {
  const result = SafetyService.checkUserInputSafety(test);
  console.log(`${index + 1}. "${test}"`);
  console.log(`   Risk Level: ${result.riskLevel}`);
  console.log(`   Action: ${result.recommendedAction}`);
  console.log(`   Keywords: ${result.triggeredKeywords.join(', ')}`);
  console.log('');
});

// Test 2: High Risk Detection
console.log('=== Test 2: High Risk Detection ===');
const highRiskTests = [
  'I feel hopeless and worthless',
  'I can\'t cope anymore, I\'m falling apart',
  'I feel trapped and desperate',
  'Everything is breaking down'
];

highRiskTests.forEach((test, index) => {
  const result = SafetyService.checkUserInputSafety(test);
  console.log(`${index + 1}. "${test}"`);
  console.log(`   Risk Level: ${result.riskLevel}`);
  console.log(`   Action: ${result.recommendedAction}`);
  console.log('');
});

// Test 3: Medical Advice Detection in Responses
console.log('=== Test 3: Medical Advice Detection ===');
const medicalResponseTests = [
  'You should take antidepressants for your depression',
  'I diagnose you with anxiety disorder',
  'You need to stop taking your medication',
  'This sounds like you have bipolar disorder',
  'You should increase your dosage of medication'
];

medicalResponseTests.forEach((test, index) => {
  const result = SafetyService.checkResponseSafety(test);
  console.log(`${index + 1}. "${test}"`);
  console.log(`   Contains Medical Advice: ${result.containsMedicalAdvice}`);
  console.log(`   Severity: ${result.severity}`);
  console.log(`   Should Block: ${result.shouldBlock}`);
  console.log('');
});

// Test 4: Safe Content
console.log('=== Test 4: Safe Content ===');
const safeTests = [
  'I\'m feeling a bit stressed about work',
  'Can you help me reflect on my goals?',
  'I want to improve my self-confidence',
  'How can I build better habits?'
];

safeTests.forEach((test, index) => {
  const result = SafetyService.checkUserInputSafety(test);
  console.log(`${index + 1}. "${test}"`);
  console.log(`   Risk Level: ${result.riskLevel}`);
  console.log(`   Safe: ${result.isSafe}`);
  console.log('');
});

console.log('✅ Safety testing completed!');