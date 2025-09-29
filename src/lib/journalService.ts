import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, JournalTemplate, JournalSettings, JournalStats, JournalSearchFilters, MoodType } from '../types/journal';
import { supabase } from './supabase';

const JOURNAL_STORAGE_KEY = 'journal_entries';
const JOURNAL_SETTINGS_KEY = 'journal_settings';

export class JournalService {
  // Local storage methods (fallback)
  private async getLocalEntries(): Promise<JournalEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading local journal entries:', error);
      return [];
    }
  }

  private async saveLocalEntries(entries: JournalEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving local journal entries:', error);
      throw error;
    }
  }

  // Database methods (with Supabase)
  async getAllEntries(): Promise<JournalEntry[]> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (error) {
            console.warn('Database error, falling back to local storage:', error.message);
            return await this.getLocalEntries();
          }
          return data || [];
        }
      }

      // Fallback to local storage
      return await this.getLocalEntries();
    } catch (error) {
      console.warn('Error fetching journal entries, using local storage:', error);
      return await this.getLocalEntries();
    }
  }

  async getEntry(id: string): Promise<JournalEntry | null> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          return data;
        }
      }

      // Fallback to local storage
      const entries = await this.getLocalEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      return null;
    }
  }

  async createEntry(entryData: Omit<JournalEntry, 'id' | 'date' | 'updatedAt' | 'wordCount' | 'readingTime'>): Promise<JournalEntry> {
    const entry: JournalEntry = {
      id: this.generateId(),
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: this.calculateWordCount(entryData.content),
      readingTime: this.calculateReadingTime(entryData.content),
      ...entryData,
    };

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('journal_entries')
            .insert([{ ...entry, user_id: user.id }])
            .select()
            .single();

          if (error) {
            console.warn('Database error, saving locally:', error.message);
            // Save to local storage if database fails
            const entries = await this.getLocalEntries();
            entries.unshift(entry);
            await this.saveLocalEntries(entries);
            return entry;
          }
          return data;
        }
      }

      // Fallback to local storage
      const entries = await this.getLocalEntries();
      entries.unshift(entry);
      await this.saveLocalEntries(entries);
      return entry;
    } catch (error) {
      console.error('Error creating journal entry, saving locally:', error);
      // Final fallback to local storage
      const entries = await this.getLocalEntries();
      entries.unshift(entry);
      await this.saveLocalEntries(entries);
      return entry;
    }
  }

  async updateEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const updatedEntry = {
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      wordCount: updates.content ? this.calculateWordCount(updates.content) : undefined,
      readingTime: updates.content ? this.calculateReadingTime(updates.content) : undefined,
    };

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Updating journal entry in database:', { id, updates });
          const { data, error } = await supabase
            .from('journal_entries')
            .update(updatedEntry)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.warn('Database update failed, falling back to local storage:', error);
            // Fallback to local storage if database fails
            const entries = await this.getLocalEntries();
            const index = entries.findIndex(entry => entry.id === id);
            if (index === -1) throw new Error('Entry not found');

            entries[index] = { ...entries[index], ...updatedEntry };
            await this.saveLocalEntries(entries);
            return entries[index];
          }
          console.log('Database update successful:', data);
          return data;
        }
      }

      // Fallback to local storage
      console.log('Using local storage for journal entry update');
      const entries = await this.getLocalEntries();
      const index = entries.findIndex(entry => entry.id === id);
      if (index === -1) throw new Error('Entry not found');

      entries[index] = { ...entries[index], ...updatedEntry };
      await this.saveLocalEntries(entries);
      return entries[index];
    } catch (error) {
      console.error('Error updating journal entry:', error);

      // Final fallback - try to update local storage even if other methods failed
      try {
        console.log('Attempting final fallback to local storage');
        const entries = await this.getLocalEntries();
        const index = entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
          entries[index] = { ...entries[index], ...updatedEntry };
          await this.saveLocalEntries(entries);
          console.log('Local storage fallback successful');
          return entries[index];
        }
      } catch (fallbackError) {
        console.error('Even local storage fallback failed:', fallbackError);
      }

      throw new Error(`Failed to update journal entry: ${error.message || 'Unknown error'}`);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          return;
        }
      }

      // Fallback to local storage
      const entries = await this.getLocalEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await this.saveLocalEntries(filteredEntries);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  async searchEntries(filters: JournalSearchFilters): Promise<JournalEntry[]> {
    const entries = await this.getAllEntries();

    return entries.filter(entry => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = `${entry.title} ${entry.content}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      // Mood filter
      if (filters.mood && entry.mood !== filters.mood) return false;

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag =>
          entry.tags.some(entryTag =>
            entryTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const entryDate = new Date(entry.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (entryDate < startDate || entryDate > endDate) return false;
      }

      // Word count filters
      if (filters.minWordCount && entry.wordCount < filters.minWordCount) return false;
      if (filters.maxWordCount && entry.wordCount > filters.maxWordCount) return false;

      // Favorite filter
      if (filters.isFavorite !== undefined && entry.isFavorite !== filters.isFavorite) return false;

      return true;
    });
  }

  async getStats(): Promise<JournalStats> {
    const entries = await this.getAllEntries();

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0,
        mostUsedMood: 'neutral',
        mostUsedTags: [],
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const entriesThisWeek = entries.filter(entry => new Date(entry.date) >= weekAgo).length;
    const entriesThisMonth = entries.filter(entry => new Date(entry.date) >= monthAgo).length;

    const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
    const averageWordsPerEntry = Math.round(totalWords / entries.length);

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(entries);

    // Most used mood
    const moodCounts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    const mostUsedMood = Object.keys(moodCounts).reduce((a, b) =>
      moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
    ) as MoodType;

    // Most used tags
    const tagCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const mostUsedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalEntries: entries.length,
      currentStreak,
      longestStreak,
      totalWords,
      averageWordsPerEntry,
      entriesThisWeek,
      entriesThisMonth,
      mostUsedMood,
      mostUsedTags,
      firstEntryDate: entries[entries.length - 1]?.date,
    };
  }

  // Settings methods
  async getSettings(): Promise<JournalSettings> {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_SETTINGS_KEY);
      const defaultSettings: JournalSettings = {
        reminderEnabled: false,
        autoSave: true,
        wordWrap: true,
        fontSize: 'medium',
        theme: 'auto',
        exportFormat: 'txt',
      };

      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (error) {
      console.error('Error loading journal settings:', error);
      return {
        reminderEnabled: false,
        autoSave: true,
        wordWrap: true,
        fontSize: 'medium',
        theme: 'auto',
        exportFormat: 'txt',
      };
    }
  }

  async updateSettings(settings: Partial<JournalSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(JOURNAL_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating journal settings:', error);
      throw error;
    }
  }

  // Template methods
  getTemplates(): JournalTemplate[] {
    return [
      {
        id: 'daily-reflection',
        name: 'Daily Reflection',
        description: 'End your day with thoughtful reflection',
        prompts: [
          'What was the highlight of my day?',
          'What challenged me today and how did I handle it?',
          'What am I grateful for today?',
          'How did I grow or learn today?',
          'What would I do differently?'
        ],
        category: 'daily',
        icon: 'Sun',
      },
      {
        id: 'gratitude',
        name: 'Gratitude Journal',
        description: 'Focus on the positive aspects of your life',
        prompts: [
          'Three things I\'m grateful for today:',
          'Someone who made my day better:',
          'A small moment that brought me joy:',
          'Something about myself I appreciate:',
          'A lesson I\'m thankful to have learned:'
        ],
        category: 'gratitude',
        icon: 'Heart',
      },
      {
        id: 'goals-planning',
        name: 'Goals & Planning',
        description: 'Set intentions and track progress',
        prompts: [
          'My main goal for this week/month:',
          'Steps I can take to achieve this goal:',
          'Potential obstacles and how to overcome them:',
          'Progress I\'ve made on existing goals:',
          'How I\'ll celebrate when I achieve this goal:'
        ],
        category: 'goals',
        icon: 'Target',
      },
      {
        id: 'emotional-processing',
        name: 'Emotional Processing',
        description: 'Explore and understand your emotions',
        prompts: [
          'How am I feeling right now?',
          'What triggered these emotions?',
          'What is this emotion trying to tell me?',
          'How can I honor and process this feeling?',
          'What support do I need right now?'
        ],
        category: 'reflection',
        icon: 'Brain',
      },
      {
        id: 'dream-journal',
        name: 'Dream Journal',
        description: 'Capture and explore your dreams',
        prompts: [
          'Describe the dream as vividly as possible:',
          'What emotions did I feel in the dream?',
          'Any recurring themes or symbols?',
          'How does this dream relate to my waking life?',
          'What might this dream be telling me?'
        ],
        category: 'dreams',
        icon: 'Moon',
      }
    ];
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.calculateWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateStreaks(entries: JournalEntry[]): { currentStreak: number; longestStreak: number } {
    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort entries by date (most recent first)
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(today);

    // Calculate current streak
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === currentDate.getTime()) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    // Calculate longest streak
    const dayMap = new Set();
    sortedEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      dayMap.add(entryDate.getTime());
    });

    const sortedDays = Array.from(dayMap).sort((a, b) => b - a);

    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      tempStreak = 1;

      for (let j = i + 1; j < sortedDays.length; j++) {
        const expectedPrevDay = currentDay - (tempStreak * 24 * 60 * 60 * 1000);
        if (sortedDays[j] === expectedPrevDay) {
          tempStreak++;
        } else {
          break;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
  }

  async exportEntries(format: 'txt' | 'json' = 'txt'): Promise<string> {
    const entries = await this.getAllEntries();

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    // Text format
    return entries.map(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const mood = entry.mood ? ` (${entry.mood})` : '';
      const tags = entry.tags.length > 0 ? `\nTags: ${entry.tags.join(', ')}` : '';

      return `${date}${mood}\n${entry.title}\n\n${entry.content}${tags}\n\n---\n`;
    }).join('\n');
  }
}

export const journalService = new JournalService();