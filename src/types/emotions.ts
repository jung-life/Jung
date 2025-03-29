// Primary emotions based on Robert Plutchik's wheel of emotions
export enum PrimaryEmotion {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  DISGUST = 'disgust',
  SURPRISE = 'surprise',
  TRUST = 'trust',
  ANTICIPATION = 'anticipation'
}

// Secondary emotions - more nuanced emotional states
export enum SecondaryEmotion {
  // Joy-related
  HAPPINESS = 'happiness',
  CONTENTMENT = 'contentment',
  PRIDE = 'pride',
  OPTIMISM = 'optimism',
  ENTHRALLMENT = 'enthrallment',
  RELIEF = 'relief',
  
  // Sadness-related
  SUFFERING = 'suffering',
  DISAPPOINTMENT = 'disappointment',
  SHAME = 'shame',
  NEGLECT = 'neglect',
  SYMPATHY = 'sympathy',
  
  // Anger-related
  IRRITATION = 'irritation',
  FRUSTRATION = 'frustration',
  RAGE = 'rage',
  DISGUST = 'disgust',
  ENVY = 'envy',
  TORMENT = 'torment',
  
  // Fear-related
  HORROR = 'horror',
  NERVOUSNESS = 'nervousness',
  ANXIETY = 'anxiety',
  DOUBT = 'doubt',
  
  // Other complex emotions
  CONFUSION = 'confusion',
  CURIOSITY = 'curiosity',
  AMAZEMENT = 'amazement',
  ADMIRATION = 'admiration',
  ACCEPTANCE = 'acceptance',
  SUBMISSION = 'submission',
  AWE = 'awe',
  APPREHENSION = 'apprehension',
  DISTRACTION = 'distraction',
  BOREDOM = 'boredom'
}

// Emotion profile from assessment
export interface EmotionalProfile {
  primary_emotion: PrimaryEmotion;
  secondary_emotions: SecondaryEmotion[];
  intensity: number; // 1-10 scale
  triggers: string[];
  needs: string[];
}

// Scenario for emotional assessment
export interface EmotionalScenario {
  id: string;
  question: string;
  options: {
    emotion: string;
    text: string;
  }[];
}

// Response to an emotional scenario
export interface EmotionalResponse {
  scenarioId: string;
  emotion: string;
}
