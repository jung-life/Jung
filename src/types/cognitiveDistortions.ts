// Types for Cognitive Distortion Checker
export interface CognitiveDistortion {
  id: string;
  name: string;
  description: string;
  examples: string[];
  challengeQuestions: string[];
  icon: string;
  color: string;
}

export interface ThoughtEntry {
  id: string;
  originalThought: string;
  reframedThought?: string;
  emotionBefore: number; // 1-10 scale
  emotionAfter?: number; // 1-10 scale
  detectedDistortions: string[]; // distortion IDs
  timestamp: Date;
  userId: string;
}

export interface ThoughtChallenge {
  thoughtId: string;
  distortionId: string;
  questionResponses: { [questionId: string]: string };
  helpfulness: number; // 1-5 scale
}

export interface DistortionAnalytics {
  mostCommonDistortions: { [distortionId: string]: number };
  emotionalImprovement: number; // average improvement score
  totalEntries: number;
  streakDays: number;
  lastEntryDate?: Date;
}

// Mood states for emotion tracking
export interface MoodState {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

// Progress tracking
export interface UserProgress {
  level: number;
  pointsEarned: number;
  badgesUnlocked: string[];
  consecutiveDays: number;
}