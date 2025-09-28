export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: MoodType;
  tags: string[];
  date: string;
  updatedAt: string;
  weather?: WeatherType;
  location?: string;
  attachments?: JournalAttachment[];
  wordCount: number;
  readingTime: number; // in minutes
  isPrivate: boolean;
  isFavorite: boolean;
}

export interface JournalAttachment {
  id: string;
  type: 'image' | 'audio' | 'link';
  url: string;
  thumbnail?: string;
  caption?: string;
}

export type MoodType =
  | 'excited'
  | 'happy'
  | 'content'
  | 'calm'
  | 'neutral'
  | 'anxious'
  | 'sad'
  | 'frustrated'
  | 'angry'
  | 'tired'
  | 'energetic'
  | 'grateful'
  | 'hopeful'
  | 'lonely'
  | 'stressed';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'clear';

export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  prompts: string[];
  category: 'daily' | 'gratitude' | 'reflection' | 'goals' | 'dreams' | 'custom';
  icon: string;
}

export interface JournalSettings {
  reminderTime?: string;
  reminderEnabled: boolean;
  autoSave: boolean;
  wordWrap: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  exportFormat: 'txt' | 'pdf' | 'json';
}

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  averageWordsPerEntry: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  mostUsedMood: MoodType;
  mostUsedTags: string[];
  firstEntryDate?: string;
}

export interface JournalSearchFilters {
  query?: string;
  mood?: MoodType;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  minWordCount?: number;
  maxWordCount?: number;
  isFavorite?: boolean;
}