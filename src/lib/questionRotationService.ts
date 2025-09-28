import AsyncStorage from '@react-native-async-storage/async-storage';
import { emotionalQuestionBank, questionCategories, difficultyLevels, EmotionalQuestion } from '../data/emotionalQuestionBank';

interface UserQuestionHistory {
  questionId: string;
  askedDate: string;
  difficulty: string;
  category: string;
  timesAsked: number;
}

interface QuestionSelectionCriteria {
  assessmentType: 'quick' | 'comprehensive';
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  avoidRecentQuestions: boolean;
  balanceCategories: boolean;
  progressiveDifficulty: boolean;
}

export class QuestionRotationService {
  private static readonly HISTORY_KEY = 'emotional_question_history';
  private static readonly USER_LEVEL_KEY = 'user_assessment_level';
  private static readonly MAX_HISTORY_SIZE = 200;

  // Load user's question history
  static async loadQuestionHistory(): Promise<UserQuestionHistory[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Error loading question history:', error);
      return [];
    }
  }

  // Save question to history
  static async saveQuestionToHistory(questionId: string, question: EmotionalQuestion): Promise<void> {
    try {
      const history = await this.loadQuestionHistory();
      const now = new Date().toISOString();

      // Check if question was already asked recently
      const existingEntry = history.find(h => h.questionId === questionId);

      if (existingEntry) {
        existingEntry.askedDate = now;
        existingEntry.timesAsked += 1;
      } else {
        history.unshift({
          questionId,
          askedDate: now,
          difficulty: question.difficulty,
          category: question.category,
          timesAsked: 1
        });
      }

      // Keep only recent history
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_SIZE);
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving question to history:', error);
    }
  }

  // Get user's current level based on history
  static async getUserLevel(): Promise<'beginner' | 'intermediate' | 'advanced'> {
    try {
      const storedLevel = await AsyncStorage.getItem(this.USER_LEVEL_KEY);
      if (storedLevel) {
        return storedLevel as 'beginner' | 'intermediate' | 'advanced';
      }

      // Determine level based on history
      const history = await this.loadQuestionHistory();
      const assessmentCount = new Set(history.map(h => h.askedDate.split('T')[0])).size;

      if (assessmentCount >= 10) return 'advanced';
      if (assessmentCount >= 3) return 'intermediate';
      return 'beginner';
    } catch (error) {
      console.error('Error getting user level:', error);
      return 'beginner';
    }
  }

  // Update user level
  static async updateUserLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_LEVEL_KEY, level);
    } catch (error) {
      console.error('Error updating user level:', error);
    }
  }

  // Select questions for assessment
  static async selectQuestionsForAssessment(criteria: QuestionSelectionCriteria): Promise<EmotionalQuestion[]> {
    const history = await this.loadQuestionHistory();
    const userLevel = await this.getUserLevel();

    const questionCount = criteria.assessmentType === 'quick' ? 5 : 10;
    const recentQuestions = this.getRecentQuestions(history, 30); // Last 30 days

    let availableQuestions = [...emotionalQuestionBank];

    // Filter out recent questions if requested
    if (criteria.avoidRecentQuestions) {
      availableQuestions = availableQuestions.filter(q =>
        !recentQuestions.includes(q.id)
      );
    }

    // Filter by difficulty based on user level and criteria
    if (criteria.progressiveDifficulty) {
      availableQuestions = this.filterByDifficulty(availableQuestions, userLevel, criteria.assessmentType);
    }

    // Select questions with category balance
    let selectedQuestions: EmotionalQuestion[] = [];

    if (criteria.balanceCategories) {
      selectedQuestions = this.selectBalancedQuestions(availableQuestions, questionCount, history);
    } else {
      selectedQuestions = this.selectWeightedRandomQuestions(availableQuestions, questionCount, history);
    }

    // Ensure we have enough questions (fallback to recent if needed)
    if (selectedQuestions.length < questionCount) {
      const additionalNeeded = questionCount - selectedQuestions.length;
      const fallbackQuestions = emotionalQuestionBank
        .filter(q => !selectedQuestions.find(sq => sq.id === q.id))
        .slice(0, additionalNeeded);
      selectedQuestions.push(...fallbackQuestions);
    }

    // Save selected questions to history
    for (const question of selectedQuestions) {
      await this.saveQuestionToHistory(question.id, question);
    }

    return selectedQuestions.slice(0, questionCount);
  }

  // Get recently asked questions
  private static getRecentQuestions(history: UserQuestionHistory[], daysBack: number): string[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return history
      .filter(h => new Date(h.askedDate) > cutoffDate)
      .map(h => h.questionId);
  }

  // Filter questions by difficulty
  private static filterByDifficulty(
    questions: EmotionalQuestion[],
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    assessmentType: 'quick' | 'comprehensive'
  ): EmotionalQuestion[] {
    const difficultyMapping = {
      beginner: ['basic', 'intermediate'],
      intermediate: ['basic', 'intermediate', 'advanced'],
      advanced: ['intermediate', 'advanced']
    };

    const allowedDifficulties = difficultyMapping[userLevel];
    let filtered = questions.filter(q => allowedDifficulties.includes(q.difficulty));

    // For comprehensive assessments, include more advanced questions
    if (assessmentType === 'comprehensive' && userLevel !== 'beginner') {
      // Ensure at least 30% are intermediate+ difficulty
      const advancedQuestions = filtered.filter(q => q.difficulty !== 'basic');
      const basicQuestions = filtered.filter(q => q.difficulty === 'basic');

      const minAdvanced = Math.ceil(filtered.length * 0.3);
      if (advancedQuestions.length < minAdvanced) {
        // Add more advanced questions if available
        const moreAdvanced = questions
          .filter(q => q.difficulty === 'advanced' && !filtered.includes(q))
          .slice(0, minAdvanced - advancedQuestions.length);
        filtered.push(...moreAdvanced);
      }
    }

    return filtered;
  }

  // Select questions with category balance
  private static selectBalancedQuestions(
    questions: EmotionalQuestion[],
    count: number,
    history: UserQuestionHistory[]
  ): EmotionalQuestion[] {
    const selected: EmotionalQuestion[] = [];
    const categoryCount = new Map<string, number>();

    // Initialize category counts
    questionCategories.forEach(cat => categoryCount.set(cat, 0));

    // Sort questions by preference (weight, recency, frequency)
    const sortedQuestions = this.sortQuestionsByPreference(questions, history);

    // Select questions ensuring category balance
    for (const question of sortedQuestions) {
      if (selected.length >= count) break;

      const currentCategoryCount = categoryCount.get(question.category) || 0;
      const maxPerCategory = Math.ceil(count / questionCategories.length);

      // Add question if we haven't exceeded category limit
      if (currentCategoryCount < maxPerCategory) {
        selected.push(question);
        categoryCount.set(question.category, currentCategoryCount + 1);
      }
    }

    // Fill remaining slots if needed
    if (selected.length < count) {
      const remaining = sortedQuestions.filter(q => !selected.includes(q));
      selected.push(...remaining.slice(0, count - selected.length));
    }

    return selected;
  }

  // Select questions using weighted random selection
  private static selectWeightedRandomQuestions(
    questions: EmotionalQuestion[],
    count: number,
    history: UserQuestionHistory[]
  ): EmotionalQuestion[] {
    const selected: EmotionalQuestion[] = [];
    const available = [...questions];

    while (selected.length < count && available.length > 0) {
      // Calculate weights based on question properties and history
      const weights = available.map(q => this.calculateQuestionWeight(q, history));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      // Random selection based on weights
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      selected.push(available[selectedIndex]);
      available.splice(selectedIndex, 1);
    }

    return selected;
  }

  // Calculate weight for question selection
  private static calculateQuestionWeight(question: EmotionalQuestion, history: UserQuestionHistory[]): number {
    let weight = question.weight;

    const questionHistory = history.find(h => h.questionId === question.id);

    if (questionHistory) {
      // Reduce weight based on how recently it was asked
      const daysSinceAsked = Math.floor(
        (Date.now() - new Date(questionHistory.askedDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Reduce weight more for recently asked questions
      if (daysSinceAsked < 7) {
        weight *= 0.1; // Very recent
      } else if (daysSinceAsked < 30) {
        weight *= 0.5; // Recent
      } else if (daysSinceAsked < 90) {
        weight *= 0.8; // Somewhat recent
      }

      // Reduce weight based on frequency
      weight *= Math.max(0.1, 1 - (questionHistory.timesAsked * 0.2));
    }

    return Math.max(0.1, weight); // Minimum weight
  }

  // Sort questions by preference
  private static sortQuestionsByPreference(
    questions: EmotionalQuestion[],
    history: UserQuestionHistory[]
  ): EmotionalQuestion[] {
    return questions.sort((a, b) => {
      const weightA = this.calculateQuestionWeight(a, history);
      const weightB = this.calculateQuestionWeight(b, history);
      return weightB - weightA; // Higher weight first
    });
  }

  // Get statistics about question usage
  static async getQuestionStats(): Promise<{
    totalAsked: number;
    categoryCounts: Record<string, number>;
    difficultyCounts: Record<string, number>;
    recentQuestions: number;
  }> {
    const history = await this.loadQuestionHistory();
    const recent = this.getRecentQuestions(history, 30);

    const categoryCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};

    history.forEach(h => {
      categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
      difficultyCounts[h.difficulty] = (difficultyCounts[h.difficulty] || 0) + 1;
    });

    return {
      totalAsked: history.length,
      categoryCounts,
      difficultyCounts,
      recentQuestions: recent.length
    };
  }

  // Reset question history (for testing or user request)
  static async resetQuestionHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.HISTORY_KEY);
      await AsyncStorage.removeItem(this.USER_LEVEL_KEY);
    } catch (error) {
      console.error('Error resetting question history:', error);
    }
  }
}