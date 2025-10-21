interface VoiceNote {
  id: string;
  title: string;
  timestamp: number;
  duration: number;
  uri: string;
  mood?: string;
  tags?: string[];
  reflection?: string; // Optional user reflection note
}

interface VoicePattern {
  totalNotes: number;
  totalRecordingTime: number;
  averageDuration: number;
  mostActiveTimeOfDay: string;
  mostActiveDay: string;
  recordingFrequency: { date: string; count: number }[];
  moodDistribution: { [key: string]: number };
  durationTrends: { week: string; avgDuration: number }[];
  consistencyScore: number;
  insights: string[];
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    lastRecordingDaysAgo: number;
  };
}

interface VoiceInsight {
  type: 'pattern' | 'milestone' | 'recommendation' | 'growth';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export class VoiceAnalyticsService {
  // Analyze patterns across all voice notes
  analyzeVoicePatterns(voiceNotes: VoiceNote[]): VoicePattern {
    if (voiceNotes.length === 0) {
      return this.getEmptyPattern();
    }

    const totalRecordingTime = voiceNotes.reduce((sum, note) => sum + note.duration, 0);
    const averageDuration = totalRecordingTime / voiceNotes.length;

    const timeAnalysis = this.analyzeRecordingTimes(voiceNotes);
    const moodDistribution = this.calculateMoodDistribution(voiceNotes);
    const frequencyAnalysis = this.analyzeRecordingFrequency(voiceNotes);
    const durationTrends = this.analyzeDurationTrends(voiceNotes);
    const consistencyScore = this.calculateConsistencyScore(voiceNotes);
    const streakInfo = this.calculateStreakInfo(voiceNotes);
    const insights = this.generateVoiceInsights(voiceNotes, {
      averageDuration,
      consistencyScore,
      moodDistribution,
      streakInfo
    });

    return {
      totalNotes: voiceNotes.length,
      totalRecordingTime,
      averageDuration,
      mostActiveTimeOfDay: timeAnalysis.mostActiveTime,
      mostActiveDay: timeAnalysis.mostActiveDay,
      recordingFrequency: frequencyAnalysis,
      moodDistribution,
      durationTrends,
      consistencyScore,
      insights,
      streakInfo
    };
  }

  // Generate personalized insights based on voice note patterns
  generateVoiceInsights(voiceNotes: VoiceNote[], metrics: any): string[] {
    const insights = [];

    // Recording consistency insights
    if (metrics.consistencyScore > 0.7) {
      insights.push("🎯 Excellent consistency! You're building a strong habit of self-reflection.");
    } else if (metrics.consistencyScore > 0.4) {
      insights.push("📈 You're developing a good reflection routine. Try to record more regularly for deeper insights.");
    } else {
      insights.push("🌱 Start small - even 2-3 voice notes per week can provide valuable self-awareness.");
    }

    // Duration insights
    if (metrics.averageDuration > 120) { // 2 minutes
      insights.push("🎤 Your thoughtful, longer recordings show deep self-reflection and introspection.");
    } else if (metrics.averageDuration > 60) { // 1 minute
      insights.push("⏱️ Your voice notes are well-balanced - long enough for meaningful reflection.");
    } else {
      insights.push("💭 Quick voice captures are great! Consider longer recordings for deeper insights.");
    }

    // Mood tracking insights
    const moodEntries = Object.keys(metrics.moodDistribution).length;
    if (moodEntries > 3) {
      insights.push("🌈 You're tracking a wide range of emotions - this emotional awareness is powerful for growth.");
    } else if (moodEntries > 0) {
      insights.push("😊 Great job tracking your moods! This emotional awareness supports your personal development.");
    }

    // Streak insights
    if (metrics.streakInfo.currentStreak >= 7) {
      insights.push(`🔥 Amazing ${metrics.streakInfo.currentStreak}-day streak! This consistent practice will accelerate your self-discovery.`);
    } else if (metrics.streakInfo.currentStreak >= 3) {
      insights.push(`✨ Nice ${metrics.streakInfo.currentStreak}-day streak building! Consistency in reflection leads to breakthrough insights.`);
    }

    // Time pattern insights
    const recentNotes = voiceNotes.slice(0, 5);
    const eveningNotes = recentNotes.filter(note => {
      const hour = new Date(note.timestamp).getHours();
      return hour >= 18 || hour <= 6;
    });

    if (eveningNotes.length >= 3) {
      insights.push("🌙 You often reflect in the evening - this is excellent for processing the day and preparing for rest.");
    }

    // Growth insights
    if (voiceNotes.length >= 10) {
      insights.push("📊 With 10+ voice notes, you're building a rich database of self-insights. Look for patterns in your growth!");
    }

    if (voiceNotes.length >= 25) {
      insights.push("🏆 25+ recordings shows serious commitment to self-development. You're creating a powerful personal growth archive!");
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  private analyzeRecordingTimes(voiceNotes: VoiceNote[]): { mostActiveTime: string; mostActiveDay: string } {
    const hourCounts: { [key: number]: number } = {};
    const dayCounts: { [key: string]: number } = {};

    voiceNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Find most active hour
    const mostActiveHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b
    );

    // Find most active day
    const mostActiveDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b
    );

    const hour = parseInt(mostActiveHour);
    const timeString = hour < 12 ? `${hour === 0 ? 12 : hour}:00 AM` : `${hour === 12 ? 12 : hour - 12}:00 PM`;

    return {
      mostActiveTime: timeString,
      mostActiveDay
    };
  }

  private calculateMoodDistribution(voiceNotes: VoiceNote[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};

    voiceNotes.forEach(note => {
      if (note.mood) {
        distribution[note.mood] = (distribution[note.mood] || 0) + 1;
      }
    });

    return distribution;
  }

  private analyzeRecordingFrequency(voiceNotes: VoiceNote[]): { date: string; count: number }[] {
    const dateCounts: { [key: string]: number } = {};

    voiceNotes.forEach(note => {
      const date = new Date(note.timestamp).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  }

  private analyzeDurationTrends(voiceNotes: VoiceNote[]): { week: string; avgDuration: number }[] {
    const weekGroups: { [key: string]: number[] } = {};

    voiceNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString();

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(note.duration);
    });

    return Object.entries(weekGroups)
      .map(([week, durations]) => ({
        week,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8); // Last 8 weeks
  }

  private calculateConsistencyScore(voiceNotes: VoiceNote[]): number {
    if (voiceNotes.length < 2) return 0;

    const last30Days = voiceNotes.filter(note => {
      const daysDiff = (Date.now() - note.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const daysWithRecordings = new Set(
      last30Days.map(note => new Date(note.timestamp).toDateString())
    ).size;

    return Math.min(daysWithRecordings / 30, 1); // Max score of 1.0
  }

  private calculateStreakInfo(voiceNotes: VoiceNote[]): {
    currentStreak: number;
    longestStreak: number;
    lastRecordingDaysAgo: number;
  } {
    if (voiceNotes.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastRecordingDaysAgo: -1 };
    }

    const sortedNotes = [...voiceNotes].sort((a, b) => b.timestamp - a.timestamp);
    const lastRecording = sortedNotes[0];
    const lastRecordingDaysAgo = Math.floor((Date.now() - lastRecording.timestamp) / (1000 * 60 * 60 * 24));

    // Calculate streaks
    const recordingDates = new Set(
      sortedNotes.map(note => new Date(note.timestamp).toDateString())
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check current streak
    const today = new Date();
    for (let i = 0; i <= 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();

      if (recordingDates.has(dateString)) {
        tempStreak++;
        if (i === 0 || i === 1) { // Today or yesterday
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastRecordingDaysAgo
    };
  }

  private getEmptyPattern(): VoicePattern {
    return {
      totalNotes: 0,
      totalRecordingTime: 0,
      averageDuration: 0,
      mostActiveTimeOfDay: 'N/A',
      mostActiveDay: 'N/A',
      recordingFrequency: [],
      moodDistribution: {},
      durationTrends: [],
      consistencyScore: 0,
      insights: ['Start recording voice notes to discover your reflection patterns and build self-awareness!'],
      streakInfo: {
        currentStreak: 0,
        longestStreak: 0,
        lastRecordingDaysAgo: -1
      }
    };
  }

  // Advanced audio analysis with contextual insights
  analyzeRecordingInsights(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    noteIndex: number = 0
  ): {
    category: 'spontaneous' | 'routine' | 'intensive' | 'breakthrough';
    timeContext: 'morning-clarity' | 'midday-processing' | 'evening-reflection' | 'late-night-deep';
    behaviorPattern: string;
    personalGrowthIndicators: string[];
    contextualInsights: string[];
    recommendations: string[];
  } {
    const hour = new Date(currentNote.timestamp).getHours();
    const dayOfWeek = new Date(currentNote.timestamp).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Analyze personal patterns from history
    const personalPatterns = this.analyzePersonalPatterns(currentNote, allNotes);

    // Determine sophisticated category based on multiple factors
    const category = this.determineRecordingCategory(currentNote, allNotes, personalPatterns);

    // Enhanced time context analysis
    const timeContext = this.analyzeTimeContext(hour, currentNote, allNotes);

    // Behavioral pattern analysis
    const behaviorPattern = this.analyzeBehaviorPattern(currentNote, allNotes, personalPatterns);

    // Personal growth indicators
    const personalGrowthIndicators = this.identifyGrowthIndicators(currentNote, allNotes, personalPatterns);

    // Contextual insights based on recording characteristics
    const contextualInsights = this.generateContextualInsights(
      currentNote, allNotes, personalPatterns, isWeekend, hour
    );

    // Personalized recommendations
    const recommendations = this.generatePersonalizedRecommendations(
      currentNote, allNotes, personalPatterns, category
    );

    return {
      category,
      timeContext,
      behaviorPattern,
      personalGrowthIndicators,
      contextualInsights,
      recommendations
    };
  }

  private analyzePersonalPatterns(currentNote: VoiceNote, allNotes: VoiceNote[]) {
    const userNotes = allNotes.slice(0, 20); // Recent 20 notes for pattern analysis

    // Calculate personal averages
    const avgDuration = userNotes.reduce((sum, note) => sum + note.duration, 0) / userNotes.length || 60;
    const avgTimeBetweenRecordings = this.calculateAverageTimeBetween(userNotes);

    // Analyze time preferences
    const timePreferences = this.analyzeTimePreferences(userNotes);

    // Mood patterns
    const moodPatterns = this.analyzeMoodPatterns(userNotes);

    // Duration patterns
    const durationTrend = this.analyzeDurationTrend(userNotes);

    return {
      avgDuration,
      avgTimeBetweenRecordings,
      timePreferences,
      moodPatterns,
      durationTrend,
      totalNotes: userNotes.length
    };
  }

  private determineRecordingCategory(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    patterns: any
  ): 'spontaneous' | 'routine' | 'intensive' | 'breakthrough' {
    const recentNotes = allNotes.slice(0, 5);
    const timeSinceLastRecording = recentNotes.length > 1 ?
      (currentNote.timestamp - recentNotes[1].timestamp) / (1000 * 60 * 60) : 24;

    // Breakthrough: Significantly longer than usual + recent activity
    if (currentNote.duration > patterns.avgDuration * 2 && timeSinceLastRecording < 2) {
      return 'breakthrough';
    }

    // Intensive: Much longer than average
    if (currentNote.duration > patterns.avgDuration * 1.5) {
      return 'intensive';
    }

    // Spontaneous: Quick recording or unusual timing
    if (currentNote.duration < patterns.avgDuration * 0.5 || timeSinceLastRecording < 0.5) {
      return 'spontaneous';
    }

    // Routine: Regular pattern
    return 'routine';
  }

  private analyzeTimeContext(
    hour: number,
    currentNote: VoiceNote,
    allNotes: VoiceNote[]
  ): 'morning-clarity' | 'midday-processing' | 'evening-reflection' | 'late-night-deep' {
    const isUsualTime = this.isUsualRecordingTime(hour, allNotes);

    if (hour >= 5 && hour < 10) {
      return 'morning-clarity';
    } else if (hour >= 10 && hour < 16) {
      return 'midday-processing';
    } else if (hour >= 16 && hour < 23) {
      return 'evening-reflection';
    } else {
      return 'late-night-deep';
    }
  }

  private analyzeBehaviorPattern(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    patterns: any
  ): string {
    const recentNotes = allNotes.slice(0, 7);
    const daysSinceLastRecording = recentNotes.length > 1 ?
      Math.floor((currentNote.timestamp - recentNotes[1].timestamp) / (1000 * 60 * 60 * 24)) : 0;

    // Analyze recent frequency for more nuanced pattern detection
    const last7Days = allNotes.filter(note => {
      const daysDiff = (currentNote.timestamp - note.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && daysDiff >= 0;
    });

    const last30Days = allNotes.filter(note => {
      const daysDiff = (currentNote.timestamp - note.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30 && daysDiff >= 0;
    });

    // Calculate consistency metrics
    const weeklyFrequency = last7Days.length;
    const monthlyAverage = last30Days.length / 4.3; // Average per week in a month

    // Enhanced pattern analysis
    if (daysSinceLastRecording === 0) {
      const todayCount = allNotes.filter(note => {
        const today = new Date();
        const noteDate = new Date(note.timestamp);
        return noteDate.toDateString() === today.toDateString();
      }).length;

      if (todayCount >= 3) {
        return "High-frequency reflection day - processing significant thoughts or experiences";
      } else {
        return "Multiple recordings today - active self-exploration phase";
      }
    } else if (daysSinceLastRecording === 1) {
      if (weeklyFrequency >= 5) {
        return "Daily reflection mastery - you've established a powerful self-awareness routine";
      } else {
        return "Consistent daily practice - building strong reflection momentum";
      }
    } else if (daysSinceLastRecording <= 3) {
      if (weeklyFrequency >= 3) {
        return "Regular tri-weekly pattern - balanced approach to self-reflection";
      } else {
        return "Steady reflection practice - developing sustainable habits";
      }
    } else if (daysSinceLastRecording <= 7) {
      if (monthlyAverage >= 2) {
        return "Weekly reflection rhythm - consistent pattern for processing life experiences";
      } else {
        return "Weekly touchpoint - maintaining connection with inner thoughts";
      }
    } else if (daysSinceLastRecording <= 14) {
      if (last30Days.length >= 3) {
        return "Bi-weekly reflection pattern - allowing time for experiences to settle before processing";
      } else {
        return "Spaced reflection practice - giving yourself time between deep dives";
      }
    } else if (daysSinceLastRecording <= 30) {
      return "Monthly reflection cycle - taking time to gather significant insights";
    } else {
      if (allNotes.length >= 10) {
        return "Returning to established practice - re-engaging with valuable self-reflection tool";
      } else {
        return "Rekindling reflection practice - rediscovering the value of voice journaling";
      }
    }
  }

  private identifyGrowthIndicators(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    patterns: any
  ): string[] {
    const indicators = [];

    // Duration growth evolution
    if (currentNote.duration > patterns.avgDuration * 2) {
      indicators.push("🚀 Significant depth expansion - you're accessing much deeper layers of reflection");
    } else if (currentNote.duration > patterns.avgDuration * 1.5) {
      indicators.push("📈 Extended exploration - developing capacity for thorough self-examination");
    } else if (currentNote.duration > patterns.avgDuration * 1.3) {
      indicators.push("🔍 Deeper reflection emerging - exploring thoughts with increased thoroughness");
    }

    // Consistency and momentum indicators
    const recentWeekNotes = allNotes.filter(note =>
      (currentNote.timestamp - note.timestamp) < (7 * 24 * 60 * 60 * 1000)
    );

    const recentMonthNotes = allNotes.filter(note =>
      (currentNote.timestamp - note.timestamp) < (30 * 24 * 60 * 60 * 1000)
    );

    if (recentWeekNotes.length >= 5) {
      indicators.push("⚡ Intensive reflection period - high-frequency self-discovery phase");
    } else if (recentWeekNotes.length >= 3) {
      indicators.push("🎯 Strong weekly momentum - building consistent self-awareness habits");
    }

    // Monthly progression indicators
    if (recentMonthNotes.length >= 10) {
      indicators.push("🏆 High monthly engagement - demonstrating serious commitment to growth");
    }

    // Emotional intelligence growth
    if (currentNote.mood && patterns.moodPatterns.diversity >= 5) {
      indicators.push("🌈 Advanced emotional awareness - tracking diverse feeling states with sophistication");
    } else if (currentNote.mood && patterns.moodPatterns.diversity >= 3) {
      indicators.push("💭 Developing emotional intelligence - expanding awareness of feeling states");
    }

    // Time diversity and courage indicators
    const hourDistribution = allNotes.reduce((acc, note) => {
      const hour = new Date(note.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const timeSlotCount = Object.keys(hourDistribution).length;
    if (timeSlotCount >= 8) {
      indicators.push("🕐 Time flexibility mastery - comfortable reflecting across different periods");
    }

    // Deep introspection indicators
    const nightRecordings = allNotes.filter(note => {
      const hour = new Date(note.timestamp).getHours();
      return hour >= 22 || hour <= 5;
    });

    const earlyMorningRecordings = allNotes.filter(note => {
      const hour = new Date(note.timestamp).getHours();
      return hour >= 5 && hour <= 7;
    });

    if (nightRecordings.length >= 3) {
      indicators.push("🌙 Deep night wisdom access - courageously exploring subconscious insights");
    } else if (earlyMorningRecordings.length >= 3) {
      indicators.push("🌅 Morning clarity cultivation - harnessing fresh perspective and mental clarity");
    }

    // Intentionality growth indicators
    const meaningfulTitles = allNotes.filter(note =>
      note.title && note.title.length > 10 && !note.title.includes('Voice Note')
    ).length;

    const titleIntentionality = allNotes.length > 0 ? (meaningfulTitles / allNotes.length) * 100 : 0;

    if (titleIntentionality >= 70) {
      indicators.push("🎯 High intentionality - approaching reflections with clear purpose and structure");
    } else if (titleIntentionality >= 40) {
      indicators.push("📝 Growing intentionality - increasingly mindful about reflection focus");
    }

    // Long-term progression indicators
    if (allNotes.length >= 25) {
      const firstQuarter = allNotes.slice(-Math.floor(allNotes.length * 0.25));
      const lastQuarter = allNotes.slice(0, Math.floor(allNotes.length * 0.25));

      const earlyAvg = firstQuarter.reduce((sum, note) => sum + note.duration, 0) / firstQuarter.length;
      const recentAvg = lastQuarter.reduce((sum, note) => sum + note.duration, 0) / lastQuarter.length;

      if (recentAvg > earlyAvg * 1.4) {
        indicators.push("📊 Long-term growth trajectory - significant deepening over time");
      }
    }

    // Milestone indicators
    if (allNotes.length === 10) {
      indicators.push("🎉 Double-digit milestone reached - establishing meaningful reflection practice");
    } else if (allNotes.length === 25) {
      indicators.push("🏅 Quarter-century achievement - building substantial self-insight archive");
    } else if (allNotes.length === 50) {
      indicators.push("💎 Half-century milestone - demonstrating exceptional commitment to self-development");
    }

    return indicators.slice(0, 2); // Top 2 most relevant indicators
  }

  private generateContextualInsights(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    patterns: any,
    isWeekend: boolean,
    hour: number
  ): string[] {
    const insights = [];

    // Enhanced time-based contextual insights
    const dayOfWeek = new Date(currentNote.timestamp).getDay();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = weekdays[dayOfWeek];

    // Weekend vs weekday patterns with more nuance
    if (isWeekend && hour < 10) {
      insights.push("Weekend morning reflection - embracing slower pace for deeper self-connection");
    } else if (isWeekend && hour > 18) {
      insights.push("Weekend evening thoughts - processing the week's experiences and planning ahead");
    } else if (!isWeekend && hour > 20) {
      insights.push("Weekday evening wind-down - transitioning from external demands to inner wisdom");
    } else if (!isWeekend && hour < 8) {
      insights.push("Early weekday clarity - setting intentions before external pressures begin");
    } else if (!isWeekend && hour >= 12 && hour <= 14) {
      insights.push("Midday pause - taking intentional break from productivity for self-awareness");
    }

    // Season and monthly patterns
    const month = new Date(currentNote.timestamp).getMonth();
    const seasonalInsights = this.getSeasonalContext(month, hour);
    if (seasonalInsights) {
      insights.push(seasonalInsights);
    }

    // Duration-based insights with psychological context
    if (currentNote.duration > 300) { // 5+ minutes
      insights.push("Deep dive session - you're allowing substantial time for self-exploration");
    } else if (currentNote.duration > 180) { // 3-5 minutes
      insights.push("Thorough reflection - giving yourself adequate space for processing");
    } else if (currentNote.duration > 60) { // 1-3 minutes
      insights.push("Focused insight capture - balancing brevity with meaningful depth");
    } else if (currentNote.duration < 30) {
      insights.push("Spontaneous thought capture - honoring fleeting but important insights");
    }

    // Enhanced mood correlation insights
    if (currentNote.mood) {
      const moodFrequency = allNotes.filter(note => note.mood === currentNote.mood).length;
      const totalMoodNotes = allNotes.filter(note => note.mood).length;
      const moodPercentage = totalMoodNotes > 0 ? (moodFrequency / totalMoodNotes) * 100 : 0;

      if (moodPercentage > 40) {
        insights.push(`Dominant ${currentNote.mood.toLowerCase()} pattern - this emotional state defines much of your current journey`);
      } else if (moodFrequency >= 3) {
        insights.push(`Recurring ${currentNote.mood.toLowerCase()} theme - this emotion holds significance in your growth`);
      } else if (moodFrequency === 1) {
        insights.push(`First-time ${currentNote.mood.toLowerCase()} capture - exploring new emotional territory`);
      } else {
        insights.push(`${currentNote.mood} state - deepening awareness of this emotional experience`);
      }
    }

    // Recording frequency and timing patterns
    const recentDayNotes = allNotes.filter(note => {
      const noteDiff = Math.abs(currentNote.timestamp - note.timestamp) / (1000 * 60 * 60 * 24);
      return noteDiff < 1 && note.id !== currentNote.id;
    });

    if (recentDayNotes.length >= 2) {
      insights.push("High reflection frequency today - you're in an active processing phase");
    } else if (recentDayNotes.length === 1) {
      insights.push("Multiple reflections today - thoughts are flowing and worth capturing");
    }

    // Title-based insights with intentionality analysis
    if (currentNote.title && currentNote.title.length > 10 && !currentNote.title.includes('Voice Note')) {
      const titleWords = currentNote.title.toLowerCase().split(' ');
      const intentionalWords = ['plan', 'goal', 'reflection', 'insight', 'breakthrough', 'decision', 'feeling', 'thought'];
      const hasIntentionalWords = intentionalWords.some(word => titleWords.includes(word));

      if (hasIntentionalWords) {
        insights.push("Structured reflection - you're approaching this with clear intention and focus");
      } else {
        insights.push("Personalized naming - you're creating meaningful markers for your thoughts");
      }
    }

    // Cross-reference with recent patterns
    const recentWeekNotes = allNotes.filter(note => {
      const weekDiff = (currentNote.timestamp - note.timestamp) / (1000 * 60 * 60 * 24 * 7);
      return weekDiff <= 1 && weekDiff >= 0;
    });

    if (recentWeekNotes.length >= 5) {
      insights.push("Intensive reflection period - you're in a phase of active self-discovery");
    }

    return insights.slice(0, 3); // Return up to 3 contextual insights
  }

  private getSeasonalContext(month: number, hour: number): string | null {
    // Winter months (Dec, Jan, Feb)
    if (month === 11 || month === 0 || month === 1) {
      if (hour < 8) return "Winter morning introspection - embracing the quiet, contemplative season";
      if (hour > 16) return "Winter evening reflection - using longer nights for deeper thinking";
    }

    // Spring months (Mar, Apr, May)
    if (month >= 2 && month <= 4) {
      if (hour >= 6 && hour <= 9) return "Spring renewal energy - capturing thoughts of growth and new beginnings";
      if (hour >= 17 && hour <= 20) return "Spring evening optimism - reflecting on possibilities and fresh starts";
    }

    // Summer months (Jun, Jul, Aug)
    if (month >= 5 && month <= 7) {
      if (hour >= 5 && hour <= 8) return "Summer vitality reflection - harnessing the season's energetic momentum";
      if (hour >= 19 && hour <= 22) return "Summer evening gratitude - appreciating life's abundance and joy";
    }

    // Fall months (Sep, Oct, Nov)
    if (month >= 8 && month <= 10) {
      if (hour >= 7 && hour <= 10) return "Autumn contemplation - embracing the season of reflection and harvest";
      if (hour >= 16 && hour <= 19) return "Fall transition thoughts - processing change and preparing for renewal";
    }

    return null;
  }

  private generatePersonalizedRecommendations(
    currentNote: VoiceNote,
    allNotes: VoiceNote[],
    patterns: any,
    category: string
  ): string[] {
    const recommendations = [];

    // Enhanced category-based recommendations
    if (category === 'breakthrough') {
      recommendations.push("💡 Breakthrough insight captured - create a written summary to solidify this realization");
      recommendations.push("🔄 Schedule time to revisit this in 3-7 days to track how your understanding deepens");
      recommendations.push("📱 Share this insight (anonymously) or discuss with a trusted friend for perspective");
    } else if (category === 'spontaneous') {
      recommendations.push("⚡ Authentic spontaneous capture - trust these unfiltered insights");
      recommendations.push("🎯 Consider what triggered this recording to identify your natural reflection cues");
    } else if (category === 'routine') {
      recommendations.push("📋 Solid routine practice - try asking yourself a new question next time");
      recommendations.push("🌟 Experiment with a different recording environment to spark fresh perspectives");
    } else if (category === 'intensive') {
      recommendations.push("🎯 Deep session completed - take time to integrate before your next recording");
      recommendations.push("📝 Consider following up with written reflection to capture key takeaways");
    }

    // Sophisticated pattern-based recommendations
    if (patterns.totalNotes >= 5) {
      const avgGap = patterns.avgTimeBetweenRecordings;

      if (avgGap > 168) { // More than a week
        recommendations.push("📅 Consider setting weekly reflection reminders to maintain consistency");
      } else if (avgGap > 72) { // More than 3 days
        recommendations.push("⏰ Try 2-3 recordings per week to build stronger self-awareness patterns");
      } else if (avgGap < 12) { // Less than 12 hours
        recommendations.push("🌊 You're in a high-frequency phase - ensure you're processing between recordings");
      }

      // Duration trend recommendations
      if (patterns.durationTrend === 'expanding') {
        recommendations.push("📈 Your recordings are getting longer - you're developing deeper self-reflection skills");
      } else if (patterns.durationTrend === 'condensing') {
        recommendations.push("⚡ Your recordings are becoming more focused - great for capturing clear insights");
      }
    }

    // Time-based recommendations
    const hour = new Date(currentNote.timestamp).getHours();
    const isLateNight = hour >= 23 || hour <= 5;
    const isEarlyMorning = hour >= 5 && hour <= 8;

    if (isLateNight && currentNote.duration > 120) {
      recommendations.push("🌙 Late-night deep reflection - consider keeping a notepad for insights that arise");
    } else if (isEarlyMorning) {
      recommendations.push("🌅 Morning clarity captured - use this energy to set intentions for the day");
    }

    // Advanced mood-based recommendations
    if (currentNote.mood) {
      const moodHistory = allNotes.filter(note => note.mood === currentNote.mood);
      if (moodHistory.length >= 3) {
        recommendations.push(`🎭 This ${currentNote.mood.toLowerCase()} state appears regularly - explore what triggers or supports it`);
      }

      // Mood variety recommendations
      const uniqueMoods = new Set(allNotes.filter(note => note.mood).map(note => note.mood)).size;
      if (uniqueMoods >= 4) {
        recommendations.push("🌈 Great emotional range tracking - look for patterns between moods and insights");
      }
    } else {
      const moodTaggedNotes = allNotes.filter(note => note.mood).length;
      const moodPercentage = allNotes.length > 0 ? (moodTaggedNotes / allNotes.length) * 100 : 0;

      if (moodPercentage < 30) {
        recommendations.push("😊 Try adding mood tags to discover emotional patterns in your reflection practice");
      }
    }

    // Duration and content recommendations
    if (currentNote.duration < 30 && patterns.avgDuration > 60) {
      recommendations.push("🎤 Brief capture completed - consider a follow-up recording if more thoughts emerge");
    } else if (currentNote.duration > patterns.avgDuration * 2) {
      recommendations.push("⏳ Extended session - you may have uncovered something significant worth exploring further");
    }

    // Title and intentionality recommendations
    if (!currentNote.title || currentNote.title.includes('Voice Note')) {
      recommendations.push("🏷️ Try giving recordings descriptive titles to make them easier to find and review");
    } else if (currentNote.title.length > 15) {
      recommendations.push("📋 Detailed title shows intentionality - this level of mindfulness enhances reflection quality");
    }

    // Growth milestone recommendations
    if (allNotes.length === 10) {
      recommendations.push("🎉 10 recordings milestone! Consider reviewing your first few notes to see your growth");
    } else if (allNotes.length === 25) {
      recommendations.push("🏆 25 recordings achievement! You're building a valuable personal insight archive");
    } else if (allNotes.length >= 50) {
      recommendations.push("📊 With 50+ recordings, consider exploring the Voice Insights screen for deeper patterns");
    }

    // Seasonal and contextual recommendations
    const month = new Date(currentNote.timestamp).getMonth();
    const isNewYear = month === 0; // January
    const isAutumn = month >= 8 && month <= 10;

    if (isNewYear && allNotes.length >= 5) {
      recommendations.push("🎯 New Year reflection - review your recent recordings to identify growth themes");
    } else if (isAutumn && patterns.durationTrend === 'expanding') {
      recommendations.push("🍂 Autumn introspection deepening - perfect season for extended self-reflection");
    }

    return recommendations.slice(0, 2); // Return top 2 most relevant recommendations
  }

  // Helper methods for pattern analysis
  private calculateAverageTimeBetween(notes: VoiceNote[]): number {
    if (notes.length < 2) return 24;

    const intervals = [];
    for (let i = 0; i < notes.length - 1; i++) {
      const interval = (notes[i].timestamp - notes[i + 1].timestamp) / (1000 * 60 * 60);
      intervals.push(interval);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private analyzeTimePreferences(notes: VoiceNote[]): any {
    const hourCounts: { [key: number]: number } = {};
    notes.forEach(note => {
      const hour = new Date(note.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const preferredHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return { preferredHours, distribution: hourCounts };
  }

  private analyzeMoodPatterns(notes: VoiceNote[]): any {
    const moodCounts: { [key: string]: number } = {};
    notes.forEach(note => {
      if (note.mood) {
        moodCounts[note.mood] = (moodCounts[note.mood] || 0) + 1;
      }
    });

    return {
      diversity: Object.keys(moodCounts).length,
      distribution: moodCounts,
      mostCommon: Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0]
    };
  }

  private analyzeDurationTrend(notes: VoiceNote[]): string {
    if (notes.length < 3) return 'building';

    const recent3 = notes.slice(0, 3);
    const older3 = notes.slice(3, 6);

    const recentAvg = recent3.reduce((sum, note) => sum + note.duration, 0) / recent3.length;
    const olderAvg = older3.length > 0 ?
      older3.reduce((sum, note) => sum + note.duration, 0) / older3.length : recentAvg;

    if (recentAvg > olderAvg * 1.2) return 'expanding';
    if (recentAvg < olderAvg * 0.8) return 'condensing';
    return 'stable';
  }

  private isUsualRecordingTime(hour: number, notes: VoiceNote[]): boolean {
    const hourCounts: { [key: number]: number } = {};
    notes.forEach(note => {
      const noteHour = new Date(note.timestamp).getHours();
      hourCounts[noteHour] = (hourCounts[noteHour] || 0) + 1;
    });

    const currentHourCount = hourCounts[hour] || 0;
    const maxCount = Math.max(...Object.values(hourCounts));

    return currentHourCount >= maxCount * 0.7;
  }
}

export const voiceAnalyticsService = new VoiceAnalyticsService();