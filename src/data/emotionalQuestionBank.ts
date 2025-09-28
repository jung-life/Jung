export interface EmotionalQuestion {
  id: string;
  category: 'social' | 'work' | 'personal' | 'stress' | 'relationships' | 'achievement' | 'conflict' | 'change' | 'self-reflection' | 'family';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  question: string;
  options: {
    emotion: string;
    text: string;
    intensity?: number;
  }[];
  tags: string[];
  weight: number; // For priority in selection
}

export const emotionalQuestionBank: EmotionalQuestion[] = [
  // Social Situations
  {
    id: 'social_001',
    category: 'social',
    difficulty: 'basic',
    question: "You're at a party where you don't know many people. Someone approaches you for conversation. How do you feel?",
    options: [
      { emotion: 'anxiety', text: "I feel nervous and worry about what to say", intensity: 6 },
      { emotion: 'excitement', text: "I'm excited to meet someone new and learn about them", intensity: 7 },
      { emotion: 'comfort', text: "I feel at ease and open to the conversation", intensity: 4 },
      { emotion: 'overwhelm', text: "I feel overwhelmed and want to find a quiet space", intensity: 8 }
    ],
    tags: ['socializing', 'new_people', 'conversation'],
    weight: 1.0
  },
  {
    id: 'social_002',
    category: 'social',
    difficulty: 'intermediate',
    question: "During a group discussion, everyone seems to disagree with your opinion. How do you react?",
    options: [
      { emotion: 'defensive', text: "I become defensive and argue my point more forcefully", intensity: 7 },
      { emotion: 'doubt', text: "I start to doubt myself and wonder if I'm wrong", intensity: 6 },
      { emotion: 'curiosity', text: "I'm curious to understand their perspectives better", intensity: 5 },
      { emotion: 'isolation', text: "I feel isolated and like an outsider", intensity: 8 }
    ],
    tags: ['disagreement', 'group_dynamics', 'opinion'],
    weight: 1.2
  },
  {
    id: 'social_003',
    category: 'social',
    difficulty: 'advanced',
    question: "You notice a close friend has been distant lately and seems to avoid you. What's your primary emotional response?",
    options: [
      { emotion: 'hurt', text: "I feel deeply hurt and wonder what I did wrong", intensity: 8 },
      { emotion: 'concern', text: "I'm concerned about them and want to help", intensity: 6 },
      { emotion: 'anger', text: "I'm frustrated by their behavior and lack of communication", intensity: 7 },
      { emotion: 'understanding', text: "I respect their need for space while staying available", intensity: 4 }
    ],
    tags: ['friendship', 'distance', 'relationships'],
    weight: 1.5
  },

  // Work/Professional Situations
  {
    id: 'work_001',
    category: 'work',
    difficulty: 'basic',
    question: "Your boss assigns you a project with an unrealistic deadline. What's your immediate feeling?",
    options: [
      { emotion: 'stress', text: "I feel stressed and overwhelmed by the pressure", intensity: 8 },
      { emotion: 'determination', text: "I feel challenged and determined to make it work", intensity: 7 },
      { emotion: 'frustration', text: "I'm frustrated by the unrealistic expectations", intensity: 7 },
      { emotion: 'anxiety', text: "I'm anxious about failing and disappointing others", intensity: 8 }
    ],
    tags: ['deadline', 'pressure', 'work_stress'],
    weight: 1.3
  },
  {
    id: 'work_002',
    category: 'work',
    difficulty: 'intermediate',
    question: "A colleague takes credit for your idea in a meeting. How do you feel?",
    options: [
      { emotion: 'betrayal', text: "I feel betrayed and shocked by their behavior", intensity: 9 },
      { emotion: 'anger', text: "I'm angry and want to confront them immediately", intensity: 8 },
      { emotion: 'disappointment', text: "I'm disappointed but choose to address it privately", intensity: 6 },
      { emotion: 'acceptance', text: "I accept it and focus on my next contribution", intensity: 3 }
    ],
    tags: ['credit', 'workplace_conflict', 'recognition'],
    weight: 1.4
  },
  {
    id: 'work_003',
    category: 'work',
    difficulty: 'advanced',
    question: "You're offered a promotion that requires relocating to a different city. What emotions arise?",
    options: [
      { emotion: 'excitement', text: "I'm excited about the new opportunities and growth", intensity: 8 },
      { emotion: 'conflict', text: "I feel torn between ambition and personal attachments", intensity: 7 },
      { emotion: 'fear', text: "I'm afraid of leaving my comfort zone and support system", intensity: 7 },
      { emotion: 'pride', text: "I feel proud of being recognized and chosen", intensity: 6 }
    ],
    tags: ['promotion', 'relocation', 'career_decision'],
    weight: 1.6
  },

  // Personal Growth & Self-Reflection
  {
    id: 'personal_001',
    category: 'personal',
    difficulty: 'basic',
    question: "When you look in the mirror first thing in the morning, what do you typically feel?",
    options: [
      { emotion: 'acceptance', text: "I accept myself as I am and feel neutral", intensity: 4 },
      { emotion: 'criticism', text: "I notice flaws and feel critical of my appearance", intensity: 6 },
      { emotion: 'gratitude', text: "I feel grateful for my body and health", intensity: 5 },
      { emotion: 'dissatisfaction', text: "I feel dissatisfied and wish I looked different", intensity: 7 }
    ],
    tags: ['self_image', 'morning_routine', 'self_acceptance'],
    weight: 1.1
  },
  {
    id: 'personal_002',
    category: 'self-reflection',
    difficulty: 'intermediate',
    question: "When you make a mistake that affects others, what's your dominant emotion?",
    options: [
      { emotion: 'guilt', text: "I feel guilty and responsible for the impact", intensity: 8 },
      { emotion: 'shame', text: "I feel ashamed and want to hide from the situation", intensity: 9 },
      { emotion: 'determination', text: "I'm determined to fix it and make it right", intensity: 6 },
      { emotion: 'learning', text: "I see it as a learning opportunity for growth", intensity: 4 }
    ],
    tags: ['mistakes', 'responsibility', 'guilt'],
    weight: 1.3
  },
  {
    id: 'personal_003',
    category: 'self-reflection',
    difficulty: 'advanced',
    question: "When you think about your life goals, how do you feel about your current progress?",
    options: [
      { emotion: 'satisfaction', text: "I feel satisfied with the progress I've made", intensity: 5 },
      { emotion: 'frustration', text: "I'm frustrated that I'm not further along", intensity: 7 },
      { emotion: 'motivation', text: "I feel motivated to push harder toward my goals", intensity: 7 },
      { emotion: 'overwhelm', text: "I feel overwhelmed by how much I still need to do", intensity: 8 }
    ],
    tags: ['goals', 'progress', 'life_satisfaction'],
    weight: 1.5
  },

  // Stress & Pressure
  {
    id: 'stress_001',
    category: 'stress',
    difficulty: 'basic',
    question: "You have multiple urgent tasks due on the same day. What's your emotional state?",
    options: [
      { emotion: 'panic', text: "I feel panicked and don't know where to start", intensity: 9 },
      { emotion: 'focus', text: "I feel focused and ready to tackle them systematically", intensity: 6 },
      { emotion: 'overwhelm', text: "I feel overwhelmed and consider asking for help", intensity: 8 },
      { emotion: 'energy', text: "I feel energized by the challenge", intensity: 7 }
    ],
    tags: ['multitasking', 'deadlines', 'time_pressure'],
    weight: 1.2
  },
  {
    id: 'stress_002',
    category: 'stress',
    difficulty: 'intermediate',
    question: "You're stuck in heavy traffic when you're already running late for an important appointment. How do you feel?",
    options: [
      { emotion: 'anger', text: "I feel angry at the situation and other drivers", intensity: 8 },
      { emotion: 'anxiety', text: "I'm anxious about the consequences of being late", intensity: 8 },
      { emotion: 'resignation', text: "I accept that it's out of my control", intensity: 4 },
      { emotion: 'frustration', text: "I'm frustrated but try to use the time productively", intensity: 6 }
    ],
    tags: ['traffic', 'lateness', 'uncontrollable_situations'],
    weight: 1.1
  },

  // Relationships & Family
  {
    id: 'relationship_001',
    category: 'relationships',
    difficulty: 'basic',
    question: "Your romantic partner seems upset but won't tell you what's wrong. How do you feel?",
    options: [
      { emotion: 'worry', text: "I worry about what I might have done wrong", intensity: 7 },
      { emotion: 'frustration', text: "I'm frustrated by their lack of communication", intensity: 6 },
      { emotion: 'patience', text: "I give them space while staying supportive", intensity: 4 },
      { emotion: 'anxiety', text: "I feel anxious about the state of our relationship", intensity: 8 }
    ],
    tags: ['romantic_relationship', 'communication', 'conflict'],
    weight: 1.4
  },
  {
    id: 'relationship_002',
    category: 'family',
    difficulty: 'intermediate',
    question: "During a family gathering, old conflicts resurface in conversation. What's your reaction?",
    options: [
      { emotion: 'tension', text: "I feel tense and want to change the subject", intensity: 7 },
      { emotion: 'sadness', text: "I feel sad that these issues still affect us", intensity: 6 },
      { emotion: 'anger', text: "I'm angry that the same problems keep coming up", intensity: 8 },
      { emotion: 'hope', text: "I hope we can finally resolve these issues", intensity: 5 }
    ],
    tags: ['family_conflict', 'past_issues', 'family_dynamics'],
    weight: 1.3
  },

  // Achievement & Success
  {
    id: 'achievement_001',
    category: 'achievement',
    difficulty: 'basic',
    question: "You receive recognition for something you worked hard on. How do you feel?",
    options: [
      { emotion: 'pride', text: "I feel proud of my accomplishment", intensity: 7 },
      { emotion: 'relief', text: "I feel relieved that my efforts were noticed", intensity: 6 },
      { emotion: 'imposter', text: "I worry I don't deserve the recognition", intensity: 7 },
      { emotion: 'motivation', text: "I feel motivated to achieve even more", intensity: 8 }
    ],
    tags: ['recognition', 'achievement', 'self_worth'],
    weight: 1.2
  },
  {
    id: 'achievement_002',
    category: 'achievement',
    difficulty: 'intermediate',
    question: "You watch a friend achieve something you've been working toward for years. What do you feel?",
    options: [
      { emotion: 'jealousy', text: "I feel jealous and question why it's not happening for me", intensity: 8 },
      { emotion: 'inspiration', text: "I feel inspired by their success and motivated", intensity: 6 },
      { emotion: 'happiness', text: "I feel genuinely happy for their achievement", intensity: 5 },
      { emotion: 'inadequacy', text: "I feel inadequate and doubt my own abilities", intensity: 8 }
    ],
    tags: ['comparison', 'friend_success', 'jealousy'],
    weight: 1.4
  },

  // Change & Transitions
  {
    id: 'change_001',
    category: 'change',
    difficulty: 'basic',
    question: "You're moving to a new city where you don't know anyone. What's your primary emotion?",
    options: [
      { emotion: 'excitement', text: "I'm excited about new adventures and possibilities", intensity: 8 },
      { emotion: 'fear', text: "I'm afraid of the unknown and being alone", intensity: 8 },
      { emotion: 'sadness', text: "I'm sad to leave behind familiar people and places", intensity: 7 },
      { emotion: 'optimism', text: "I'm optimistic about the fresh start", intensity: 6 }
    ],
    tags: ['relocation', 'new_beginnings', 'unknown'],
    weight: 1.3
  },
  {
    id: 'change_002',
    category: 'change',
    difficulty: 'advanced',
    question: "A major life change forces you to reconsider your long-term plans. How do you feel?",
    options: [
      { emotion: 'uncertainty', text: "I feel uncertain about what the future holds", intensity: 7 },
      { emotion: 'opportunity', text: "I see it as an opportunity to reassess and grow", intensity: 5 },
      { emotion: 'loss', text: "I feel a sense of loss for the plans I had to abandon", intensity: 8 },
      { emotion: 'adaptability', text: "I feel capable of adapting to whatever comes", intensity: 4 }
    ],
    tags: ['life_change', 'planning', 'adaptation'],
    weight: 1.6
  },

  // Conflict Resolution
  {
    id: 'conflict_001',
    category: 'conflict',
    difficulty: 'intermediate',
    question: "Someone publicly criticizes your work in front of your peers. What's your immediate response?",
    options: [
      { emotion: 'humiliation', text: "I feel humiliated and want to disappear", intensity: 9 },
      { emotion: 'defensiveness', text: "I become defensive and want to argue back", intensity: 8 },
      { emotion: 'professionalism', text: "I stay professional and address it constructively", intensity: 4 },
      { emotion: 'hurt', text: "I feel hurt by the public nature of the criticism", intensity: 8 }
    ],
    tags: ['public_criticism', 'workplace_conflict', 'embarrassment'],
    weight: 1.4
  },
  {
    id: 'conflict_002',
    category: 'conflict',
    difficulty: 'advanced',
    question: "You discover a close friend has been talking negatively about you behind your back. How do you feel?",
    options: [
      { emotion: 'betrayal', text: "I feel deeply betrayed and question the friendship", intensity: 9 },
      { emotion: 'hurt', text: "I'm hurt but want to understand their perspective", intensity: 8 },
      { emotion: 'anger', text: "I'm angry and want to confront them immediately", intensity: 8 },
      { emotion: 'reflection', text: "I reflect on whether their concerns have merit", intensity: 5 }
    ],
    tags: ['betrayal', 'friendship', 'trust'],
    weight: 1.5
  }
];

// Categories for balanced selection
export const questionCategories = [
  'social',
  'work',
  'personal',
  'stress',
  'relationships',
  'achievement',
  'conflict',
  'change',
  'self-reflection',
  'family'
] as const;

// Difficulty levels for progressive assessment
export const difficultyLevels = ['basic', 'intermediate', 'advanced'] as const;