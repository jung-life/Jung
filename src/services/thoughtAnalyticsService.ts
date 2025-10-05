import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThoughtEntry, DistortionAnalytics, UserProgress } from '../types/cognitiveDistortions';
import { COGNITIVE_DISTORTIONS } from '../data/cognitiveDistortions';

const STORAGE_KEYS = {
  THOUGHT_ENTRIES: '@jung_thought_entries',
  USER_PROGRESS: '@jung_user_progress',
  ANALYTICS: '@jung_distortion_analytics'
};

class ThoughtAnalyticsService {
  /**
   * Save a thought entry
   */
  async saveThoughtEntry(entry: ThoughtEntry): Promise<void> {
    try {
      const existingEntries = await this.getThoughtEntries();
      const updatedEntries = [...existingEntries, entry];

      await AsyncStorage.setItem(
        STORAGE_KEYS.THOUGHT_ENTRIES,
        JSON.stringify(updatedEntries)
      );

      // Update analytics
      await this.updateAnalytics(entry);

      // Update user progress
      await this.updateUserProgress();

      console.log('✅ Thought entry saved successfully');
    } catch (error) {
      console.error('❌ Error saving thought entry:', error);
      throw error;
    }
  }

  /**
   * Get all thought entries for current user
   */
  async getThoughtEntries(userId?: string): Promise<ThoughtEntry[]> {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.THOUGHT_ENTRIES);
      if (!entriesJson) return [];

      const entries: ThoughtEntry[] = JSON.parse(entriesJson);

      // Filter by user if userId provided
      if (userId) {
        return entries.filter(entry => entry.userId === userId);
      }

      return entries;
    } catch (error) {
      console.error('❌ Error retrieving thought entries:', error);
      return [];
    }
  }

  /**
   * Get thought entries for a specific date range
   */
  async getThoughtEntriesInRange(startDate: Date, endDate: Date): Promise<ThoughtEntry[]> {
    try {
      const allEntries = await this.getThoughtEntries();

      return allEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
    } catch (error) {
      console.error('❌ Error retrieving entries in range:', error);
      return [];
    }
  }

  /**
   * Update analytics after a new entry
   */
  private async updateAnalytics(newEntry: ThoughtEntry): Promise<void> {
    try {
      const currentAnalytics = await this.getAnalytics();
      const allEntries = await this.getThoughtEntries();

      // Count distortion occurrences
      const distortionCounts: { [key: string]: number } = {};
      allEntries.forEach(entry => {
        entry.detectedDistortions.forEach(distortionId => {
          distortionCounts[distortionId] = (distortionCounts[distortionId] || 0) + 1;
        });
      });

      // Calculate emotional improvement
      const entriesWithBothRatings = allEntries.filter(
        entry => entry.emotionBefore && entry.emotionAfter
      );

      const totalImprovement = entriesWithBothRatings.reduce(
        (sum, entry) => sum + (entry.emotionAfter! - entry.emotionBefore), 0
      );

      const averageImprovement = entriesWithBothRatings.length > 0
        ? totalImprovement / entriesWithBothRatings.length
        : 0;

      // Calculate streak
      const streakDays = await this.calculateStreakDays();

      const updatedAnalytics: DistortionAnalytics = {
        mostCommonDistortions: distortionCounts,
        emotionalImprovement: averageImprovement,
        totalEntries: allEntries.length,
        streakDays,
        lastEntryDate: new Date(newEntry.timestamp)
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.ANALYTICS,
        JSON.stringify(updatedAnalytics)
      );
    } catch (error) {
      console.error('❌ Error updating analytics:', error);
    }
  }

  /**
   * Get current analytics
   */
  async getAnalytics(): Promise<DistortionAnalytics> {
    try {
      const analyticsJson = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);

      if (!analyticsJson) {
        return {
          mostCommonDistortions: {},
          emotionalImprovement: 0,
          totalEntries: 0,
          streakDays: 0
        };
      }

      return JSON.parse(analyticsJson);
    } catch (error) {
      console.error('❌ Error retrieving analytics:', error);
      return {
        mostCommonDistortions: {},
        emotionalImprovement: 0,
        totalEntries: 0,
        streakDays: 0
      };
    }
  }

  /**
   * Calculate consecutive days streak
   */
  private async calculateStreakDays(): Promise<number> {
    try {
      const entries = await this.getThoughtEntries();
      if (entries.length === 0) return 0;

      // Sort entries by date (newest first)
      const sortedEntries = entries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);
      currentDate.setHours(0, 0, 0, 0);

      // Check if there's an entry today or yesterday
      const latestEntryDate = new Date(sortedEntries[0].timestamp);
      latestEntryDate.setHours(0, 0, 0, 0);

      const daysSinceLatest = Math.floor(
        (currentDate.getTime() - latestEntryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If more than 1 day since last entry, streak is broken
      if (daysSinceLatest > 1) return 0;

      // Count consecutive days with entries
      const daysWithEntries = new Set<string>();
      sortedEntries.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        daysWithEntries.add(entryDate.toISOString());
      });

      let checkDate = new Date(currentDate);
      while (true) {
        const dateString = checkDate.toISOString();
        if (daysWithEntries.has(dateString)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('❌ Error calculating streak:', error);
      return 0;
    }
  }

  /**
   * Update user progress and achievements
   */
  private async updateUserProgress(): Promise<void> {
    try {
      const currentProgress = await this.getUserProgress();
      const analytics = await this.getAnalytics();

      // Calculate points based on activities
      const pointsFromEntries = analytics.totalEntries * 10;
      const pointsFromStreak = analytics.streakDays * 5;
      const totalPoints = pointsFromEntries + pointsFromStreak;

      // Calculate level (every 100 points = 1 level)
      const level = Math.floor(totalPoints / 100) + 1;

      // Check for new badges
      const newBadges = [...currentProgress.badgesUnlocked];

      if (analytics.totalEntries >= 1 && !newBadges.includes('first-entry')) {
        newBadges.push('first-entry');
      }
      if (analytics.totalEntries >= 10 && !newBadges.includes('dedicated-learner')) {
        newBadges.push('dedicated-learner');
      }
      if (analytics.streakDays >= 7 && !newBadges.includes('week-warrior')) {
        newBadges.push('week-warrior');
      }
      if (analytics.emotionalImprovement > 2 && !newBadges.includes('mood-improver')) {
        newBadges.push('mood-improver');
      }

      const updatedProgress: UserProgress = {
        level,
        pointsEarned: totalPoints,
        badgesUnlocked: newBadges,
        consecutiveDays: analytics.streakDays
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROGRESS,
        JSON.stringify(updatedProgress)
      );
    } catch (error) {
      console.error('❌ Error updating user progress:', error);
    }
  }

  /**
   * Get user progress
   */
  async getUserProgress(): Promise<UserProgress> {
    try {
      const progressJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);

      if (!progressJson) {
        return {
          level: 1,
          pointsEarned: 0,
          badgesUnlocked: [],
          consecutiveDays: 0
        };
      }

      return JSON.parse(progressJson);
    } catch (error) {
      console.error('❌ Error retrieving user progress:', error);
      return {
        level: 1,
        pointsEarned: 0,
        badgesUnlocked: [],
        consecutiveDays: 0
      };
    }
  }

  /**
   * Get insights for the user
   */
  async getPersonalInsights(): Promise<string[]> {
    try {
      const analytics = await this.getAnalytics();
      const insights: string[] = [];

      // Most common distortion insight
      const sortedDistortions = Object.entries(analytics.mostCommonDistortions)
        .sort(([,a], [,b]) => b - a);

      if (sortedDistortions.length > 0) {
        const [mostCommonId] = sortedDistortions[0];
        const distortion = COGNITIVE_DISTORTIONS.find(d => d.id === mostCommonId);
        if (distortion) {
          insights.push(
            `Your most common thinking pattern is ${distortion.name.toLowerCase()}. ` +
            `Being aware of this pattern is the first step to changing it.`
          );
        }
      }

      // Emotional improvement insight
      if (analytics.emotionalImprovement > 0) {
        insights.push(
          `On average, you feel ${analytics.emotionalImprovement.toFixed(1)} points better ` +
          `after working through your thoughts. That's real progress!`
        );
      }

      // Streak insight
      if (analytics.streakDays > 0) {
        insights.push(
          `You've been consistent for ${analytics.streakDays} days. ` +
          `Regular practice builds emotional resilience.`
        );
      }

      // Encourage more practice
      if (analytics.totalEntries < 5) {
        insights.push(
          `You're building a great foundation. The more you practice, ` +
          `the more natural it becomes to challenge unhelpful thoughts.`
        );
      }

      return insights;
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      return ['Keep practicing! Every thought challenge is a step toward better emotional wellness.'];
    }
  }

  /**
   * Clear all data (for testing or user request)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.THOUGHT_ENTRIES),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PROGRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS)
      ]);
      console.log('✅ All thought data cleared');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }
}

export const thoughtAnalyticsService = new ThoughtAnalyticsService();
export default thoughtAnalyticsService;