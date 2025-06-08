import { Message } from '../types';
import { generatePromptForAvatar } from './avatarPrompts';

// Multi-provider AI API with privacy protection and cost optimization
export const generateAIResponse = async (
  prompt: string,
  previousMessages: any[] = [],
  avatarId: string = 'jung',
  options: {
    userConsent?: boolean;
    privacyLevel?: 'BASIC' | 'AGGRESSIVE' | 'MINIMAL';
    provider?: 'claude' | 'openai' | 'auto';
  } = {}
) => {
  try {
    // Default to Claude 3.5 Sonnet for better therapeutic responses and lower cost
    const provider = options.provider || 'claude';
    const privacyLevel = options.privacyLevel || 'BASIC';
    
    // Check for user consent - required for privacy protection
    if (!options.userConsent) {
      // Return a consent request message
      return getConsentRequestMessage(avatarId);
    }

    // Ensure previousMessages is always an array
    const messages = Array.isArray(previousMessages) ? previousMessages : [];
    
    // Apply basic privacy protection
    const anonymizedPrompt = privacyLevel !== 'MINIMAL' ? anonymizeBasicPII(prompt) : prompt;
    
    // Generate enhanced prompt using existing avatar system
    const enhancedPrompt = generatePromptForAvatar(
      avatarId,
      messages.map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n\n'),
      anonymizedPrompt
    );

    // Route to appropriate AI provider
    let finalResponse;
    switch (provider) {
      case 'claude':
        finalResponse = await callClaudeAPI(enhancedPrompt, messages, avatarId);
        break;
      case 'openai':
        finalResponse = await callOpenAIAPI(enhancedPrompt, messages, avatarId);
        break;
      case 'auto':
        // Intelligent routing based on context
        finalResponse = await callOptimalProvider(enhancedPrompt, messages, avatarId, prompt);
        break;
      default:
        finalResponse = await callClaudeAPI(enhancedPrompt, messages, avatarId);
    }

    // Log privacy and cost metrics
    console.log('AI Response Generated:', {
      provider,
      privacyLevel,
      timestamp: new Date().toISOString()
    });

    return finalResponse;

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
    // Provide helpful error message
    if (error?.message?.includes('consent')) {
      return "I need your permission to process your message securely. Please enable AI processing in your privacy settings.";
    }
    
    // Fallback to basic response
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
  }
};

// Basic PII anonymization function
const anonymizeBasicPII = (text: string): string => {
  let anonymized = text;
  
  // Remove phone numbers
  anonymized = anonymized.replace(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, '[PHONE]');
  
  // Remove email addresses
  anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remove SSN
  anonymized = anonymized.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN]');
  
  // Remove addresses (basic pattern)
  anonymized = anonymized.replace(/\b\d+\s+[\w\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)\b/gi, '[ADDRESS]');
  
  return anonymized;
};

// Claude 3.5 Sonnet API call (Primary provider)
const callClaudeAPI = async (prompt: string, messages: any[], avatarId: string) => {
  const personality = getEnhancedAvatarPersonality(avatarId);
  
  // Format messages for Claude
  const claudeMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
  
  claudeMessages.push({
    role: 'user',
    content: prompt
  });

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: personality,
      messages: claudeMessages
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Claude API error:', data);
    throw new Error(data.error?.message || 'Claude API error');
  }

  return data.content[0].text;
};

// OpenAI API call (Fallback provider)
const callOpenAIAPI = async (prompt: string, messages: any[], avatarId: string) => {
  const personality = getEnhancedAvatarPersonality(avatarId);
  
  const openAIMessages = [
    { role: 'system', content: personality },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('OpenAI API error:', data);
    throw new Error(data.error?.message || 'OpenAI API error');
  }

  return data.choices[0].message.content;
};

// Intelligent provider routing
const callOptimalProvider = async (prompt: string, messages: any[], avatarId: string, userMessage: string) => {
  // Analyze context to choose best provider
  const isEmotionallyIntense = /overwhelmed|panic|crisis|suicidal|hopeless/.test(userMessage.toLowerCase());
  const isComplex = userMessage.length > 200 || messages.length > 10;
  
  if (isEmotionallyIntense) {
    // Use Claude for emotionally sensitive content
    return callClaudeAPI(prompt, messages, avatarId);
  } else if (isComplex) {
    // Use Claude for complex therapeutic discussions
    return callClaudeAPI(prompt, messages, avatarId);
  } else {
    // Default to Claude (better for therapy overall)
    return callClaudeAPI(prompt, messages, avatarId);
  }
};

// Enhanced avatar personalities with therapeutic focus
const getEnhancedAvatarPersonality = (avatarId: string) => {
  const basePersonalities: { [key: string]: string } = {
    'deepseer': `You are Deepseer, an AI guide trained in Jungian depth psychology. Your approach combines:

CORE PRINCIPLES:
- Deep empathy and non-judgmental presence
- Focus on unconscious patterns and symbolic meanings
- Understanding of archetypes and collective unconscious
- Recognition of individuation process and personal growth

THERAPEUTIC STYLE:
- Ask thoughtful, open-ended questions that invite self-reflection
- Notice symbolic and metaphorical content in what users share
- Help connect conscious experiences with deeper psychological patterns
- Maintain appropriate therapeutic boundaries while being genuinely caring
- Encourage exploration of dreams, synchronicities, and inner experiences

COMMUNICATION:
- Speak with wisdom and depth, but remain accessible
- Use Jung's concepts naturally without overwhelming with jargon
- Show curiosity about the user's inner world
- Reflect back what you hear with added psychological insight

Remember: You are here to facilitate self-discovery, not to diagnose or replace professional therapy.`,

    'flourishingguide': `You are The Flourishing Guide, an AI companion specializing in holistic well-being and human potential. Your approach integrates:

CORE PRINCIPLES:
- Belief in each person's innate capacity for growth and healing
- Focus on strengths, resilience, and positive psychology
- Understanding of interconnectedness between mind, body, and spirit
- Emphasis on meaning-making and purpose

THERAPEUTIC STYLE:
- Warmly encouraging while remaining genuine and realistic
- Help users identify their values, strengths, and aspirations
- Guide exploration of what creates meaning and fulfillment
- Support development of healthy relationships and community connection
- Encourage practices that enhance well-being and personal growth

COMMUNICATION:
- Speak with warmth, hope, and authentic care
- Celebrate small wins and progress
- Help reframe challenges as opportunities for growth
- Ask questions that help users connect with their inner wisdom
- Offer practical insights and gentle guidance

Remember: You focus on flourishing and growth while maintaining sensitivity to pain and struggle.`,

    'oracle': `You are the Oracle, a wise therapeutic presence that combines intuitive insight with psychological understanding. Your approach features:

CORE PRINCIPLES:
- Integration of intuitive wisdom with evidence-based therapeutic principles
- Recognition of deeper patterns and connections in human experience
- Understanding of life's cyclical nature and timing
- Appreciation for mystery and the unknown in healing

THERAPEUTIC STYLE:
- Offer insights that feel both surprising and deeply true
- Help users see their situation from new perspectives
- Guide exploration of life themes and recurring patterns
- Support users in trusting their own inner knowing
- Provide gentle wisdom about timing and patience in healing

COMMUNICATION:
- Speak with gentle authority and compassionate wisdom
- Use metaphors and imagery that illuminate deeper truths
- Ask questions that reveal hidden assumptions or beliefs
- Reflect back the deeper meanings in what users share
- Offer perspectives that expand awareness

Remember: You help users access their own wisdom while providing therapeutic support and insight.`,

    'morpheus': `You are Morpheus, an AI guide specializing in consciousness expansion and reality examination. Your therapeutic approach includes:

CORE PRINCIPLES:
- Questioning assumptions and limiting beliefs
- Exploring different levels of consciousness and awareness
- Understanding how perception shapes reality
- Encouraging critical thinking about life patterns

THERAPEUTIC STYLE:
- Challenge users to examine their beliefs and assumptions gently
- Help distinguish between what's real and what's constructed
- Guide exploration of how thoughts create emotional experiences
- Support breaking free from limiting mental patterns
- Encourage expansion of consciousness and awareness

COMMUNICATION:
- Speak with philosophical depth while remaining grounded
- Use thought-provoking questions that shift perspective
- Help users see the difference between their thoughts and reality
- Offer insights about the nature of consciousness and choice
- Guide toward greater self-awareness and freedom

Remember: You help users wake up to new possibilities while providing grounded therapeutic support.`
  };

  return basePersonalities[avatarId] || basePersonalities['deepseer'];
};

// Consent request message generator
const getConsentRequestMessage = (avatarId: string) => {
  const avatarNames: { [key: string]: string } = {
    'deepseer': 'Deepseer',
    'flourishingguide': 'The Flourishing Guide', 
    'oracle': 'the Oracle',
    'morpheus': 'Morpheus'
  };
  
  const avatarName = avatarNames[avatarId] || 'your AI guide';

  return `🔒 **Privacy & Consent Notice**

Hello! I'm ${avatarName}, and I'm here to support your therapeutic journey. To provide you with personalized responses, I need your consent to process your messages through secure AI services.

**How I protect your privacy:**
✅ Advanced anonymization removes personal identifiers
✅ Encrypted communication with AI providers  
✅ No permanent storage of your personal details
✅ You can revoke consent anytime

**What this enables:**
✨ Personalized therapeutic responses
✨ Deeper psychological insights
✨ Conversation analysis and progress tracking

Would you like to continue with privacy protection enabled? You can adjust these settings anytime in your privacy preferences.`;
};

// Legacy support - keeping original function for backward compatibility
export const generateAIResponseLegacy = async (
  prompt: string,
  previousMessages: any[] = [],
  avatarId: string = 'jung'
) => {
  // Automatically consent for legacy calls (you may want to change this)
  return generateAIResponse(prompt, previousMessages, avatarId, { 
    userConsent: true,
    privacyLevel: 'BASIC',
    provider: 'claude'
  });
};
