import { CognitiveDistortion, MoodState } from '../types/cognitiveDistortions';

export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  {
    id: 'all-or-nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black and white categories, with no middle ground',
    examples: [
      'If I make one mistake, I\'m a complete failure',
      'I either do it perfectly or not at all',
      'Everyone either loves me or hates me'
    ],
    challengeQuestions: [
      'Are there any exceptions to this absolute statement?',
      'What would be a more balanced way to view this?',
      'Can you think of examples where this isn\'t completely true?',
      'What would you tell a friend who thought this way?'
    ],
    icon: '⚫',
    color: '#374151'
  },
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome or magnifying problems',
    examples: [
      'If I fail this test, my entire career is ruined',
      'This headache must be a brain tumor',
      'If I speak up, everyone will think I\'m stupid'
    ],
    challengeQuestions: [
      'What\'s the most likely outcome, realistically?',
      'How often have your worst fears actually come true?',
      'What would happen if this worst case scenario did occur?',
      'Are you focusing on low-probability events?'
    ],
    icon: '🌪️',
    color: '#DC2626'
  },
  {
    id: 'mind-reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others are thinking without evidence',
    examples: [
      'She didn\'t smile at me, so she must dislike me',
      'My boss thinks I\'m incompetent',
      'They\'re all judging me'
    ],
    challengeQuestions: [
      'What evidence do you have for this assumption?',
      'Are there other possible explanations?',
      'Have you asked them directly what they think?',
      'How accurate have your mind-reading assumptions been in the past?'
    ],
    icon: '🧠',
    color: '#7C3AED'
  },
  {
    id: 'fortune-telling',
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes without sufficient evidence',
    examples: [
      'I know this presentation will go terribly',
      'I\'ll never find someone who loves me',
      'This relationship is doomed to fail'
    ],
    challengeQuestions: [
      'What evidence supports this prediction?',
      'Have you been wrong about predictions before?',
      'What factors could lead to a positive outcome?',
      'How can you prepare for different scenarios?'
    ],
    icon: '🔮',
    color: '#DB2777'
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing that your emotions reflect reality',
    examples: [
      'I feel anxious, so something bad must be happening',
      'I feel worthless, so I must be worthless',
      'I feel guilty, so I must have done something wrong'
    ],
    challengeQuestions: [
      'Are your feelings always accurate reflections of reality?',
      'What facts contradict this emotional conclusion?',
      'How might someone else view this situation?',
      'What would you think if you weren\'t feeling this emotion?'
    ],
    icon: '💭',
    color: '#059669'
  },
  {
    id: 'should-statements',
    name: 'Should Statements',
    description: 'Using rigid rules about how you or others "should" behave',
    examples: [
      'I should always be perfect',
      'People should always be fair',
      'I shouldn\'t feel sad about this'
    ],
    challengeQuestions: [
      'Where did this "should" rule come from?',
      'Is this expectation realistic and helpful?',
      'What would happen if you replaced "should" with "prefer"?',
      'Are you being flexible or too rigid?'
    ],
    icon: '📏',
    color: '#EA580C'
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Assigning global negative labels to yourself or others',
    examples: [
      'I\'m stupid (instead of "I made a mistake")',
      'He\'s a jerk (instead of "He acted rudely")',
      'I\'m a failure (instead of "I failed at this task")'
    ],
    challengeQuestions: [
      'Does one action define your entire identity?',
      'What specific behavior are you actually referring to?',
      'Are you confusing your actions with who you are as a person?',
      'How would you describe this more accurately?'
    ],
    icon: '🏷️',
    color: '#B91C1C'
  },
  {
    id: 'mental-filter',
    name: 'Mental Filter',
    description: 'Focusing exclusively on negative details while ignoring positives',
    examples: [
      'Focusing only on one criticism while ignoring multiple compliments',
      'Remembering only your mistakes from the day',
      'Only noticing what went wrong in a generally successful event'
    ],
    challengeQuestions: [
      'What positive aspects are you overlooking?',
      'Are you giving equal attention to both positives and negatives?',
      'What would a balanced perspective include?',
      'What would others say went well?'
    ],
    icon: '🔍',
    color: '#0369A1'
  },
  {
    id: 'disqualifying-positive',
    name: 'Disqualifying the Positive',
    description: 'Rejecting positive experiences as "not counting" for arbitrary reasons',
    examples: [
      'That compliment doesn\'t count because they were just being nice',
      'I only succeeded because I got lucky',
      'They only hired me because they felt sorry for me'
    ],
    challengeQuestions: [
      'Why doesn\'t this positive experience "count"?',
      'Are you applying different standards to positives vs negatives?',
      'What evidence supports this dismissal?',
      'How would you advise a friend who dismissed their achievements?'
    ],
    icon: '❌',
    color: '#BE185D'
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Drawing broad conclusions from single events',
    examples: [
      'I failed one test, so I\'m bad at school',
      'One person rejected me, so no one will ever love me',
      'I made one social mistake, so I\'m socially awkward'
    ],
    challengeQuestions: [
      'Is this conclusion based on enough evidence?',
      'Are there counter-examples to this generalization?',
      'What\'s the difference between one event and a pattern?',
      'How many examples would you need to make this conclusion valid?'
    ],
    icon: '🌐',
    color: '#7C2D12'
  }
];

export const MOOD_STATES: MoodState[] = [
  { label: 'Very Distressed', emoji: '😰', value: 1, color: '#DC2626' },
  { label: 'Quite Upset', emoji: '😔', value: 2, color: '#EA580C' },
  { label: 'Somewhat Bothered', emoji: '😕', value: 3, color: '#D97706' },
  { label: 'Slightly Uncomfortable', emoji: '😐', value: 4, color: '#CA8A04' },
  { label: 'Neutral', emoji: '😶', value: 5, color: '#6B7280' },
  { label: 'Slightly Positive', emoji: '🙂', value: 6, color: '#059669' },
  { label: 'Pretty Good', emoji: '😊', value: 7, color: '#10B981' },
  { label: 'Quite Happy', emoji: '😄', value: 8, color: '#34D399' },
  { label: 'Very Joyful', emoji: '😁', value: 9, color: '#6EE7B7' },
  { label: 'Extremely Positive', emoji: '🤩', value: 10, color: '#A7F3D0' }
];

// Helper function to get distortion by ID
export const getDistortionById = (id: string): CognitiveDistortion | undefined => {
  return COGNITIVE_DISTORTIONS.find(distortion => distortion.id === id);
};

// Helper function to get mood state by value
export const getMoodByValue = (value: number): MoodState | undefined => {
  return MOOD_STATES.find(mood => mood.value === value);
};

// Wellness-focused disclaimers and educational content
export const WELLNESS_DISCLAIMERS = {
  main: "This tool is for educational and self-reflection purposes only. It is not intended to diagnose, treat, cure, or prevent any medical condition. If you're experiencing persistent distress, please consult a qualified mental health professional.",

  privacy: "Your thoughts and reflections are private and stored securely on your device. This information is for your personal wellness journey.",

  encouragement: "Remember: having cognitive distortions is completely normal. Everyone experiences these thinking patterns. The goal is awareness and gentle self-compassion, not perfection."
};