import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { journalService } from '../lib/journalService';
import { JournalStats, JournalEntry, MoodType } from '../types/journal';

const { width } = Dimensions.get('window');

const JournalInsightsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [fetchedStats, allEntries] = await Promise.all([
        journalService.getStats(),
        journalService.getAllEntries(),
      ]);
      setStats(fetchedStats);
      setRecentEntries(allEntries.slice(0, 5)); // Get 5 most recent entries
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: MoodType) => {
    const moodEmojis = {
      excited: '🤩',
      happy: '😊',
      content: '😌',
      calm: '😇',
      neutral: '😐',
      anxious: '😰',
      sad: '😢',
      frustrated: '😤',
      angry: '😡',
      tired: '😴',
      energetic: '⚡',
      grateful: '🙏',
      hopeful: '🌟',
      lonely: '😔',
      stressed: '😵',
    };
    return moodEmojis[mood] || '😐';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your first entry today!';
    if (streak === 1) return 'Great start! Keep it going.';
    if (streak < 7) return 'Building momentum!';
    if (streak < 30) return 'Amazing consistency!';
    return 'Incredible dedication!';
  };

  const formatDaysSince = (dateString?: string) => {
    if (!dateString) return 'Never';
    const daysSince = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return 'Yesterday';
    return `${daysSince} days ago`;
  };

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`text-jung-deep mt-4`}>Loading insights...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!stats) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 justify-center items-center p-6`}>
            <SafePhosphorIcon iconType="ChartLine" size={64} color="#4A3B78" weight="thin" />
            <Text style={tw`text-xl font-bold text-jung-deep mt-4 text-center`}>
              No Data Available
            </Text>
            <Text style={tw`text-jung-deep/70 text-center mt-2`}>
              Start journaling to see your insights
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4 border-b border-white/20 flex-row items-center`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PostLoginScreen' as any)}
            style={tw`mr-4`}
          >
            <SafePhosphorIcon iconType="House" size={24} color="#4A3B78" weight="bold" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-bold text-jung-deep`}>Journal Insights</Text>
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
          {/* Overview Stats */}
          <View style={tw`bg-white rounded-2xl p-6 mb-6 shadow-sm`}>
            <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Overview</Text>

            <View style={tw`flex-row justify-between mb-4`}>
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-3xl font-bold text-jung-purple`}>{stats.totalEntries}</Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Total Entries</Text>
              </View>
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-3xl font-bold text-jung-purple`}>{stats.totalWords.toLocaleString()}</Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Words Written</Text>
              </View>
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-3xl font-bold text-jung-purple`}>{stats.averageWordsPerEntry}</Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>Avg Words</Text>
              </View>
            </View>

            <View style={tw`border-t border-gray-100 pt-4`}>
              <View style={tw`flex-row justify-between`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-green-600`}>{stats.entriesThisWeek}</Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>This Week</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-blue-600`}>{stats.entriesThisMonth}</Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>This Month</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-orange-600`}>{formatDaysSince(stats.firstEntryDate)}</Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>First Entry</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Writing Streak */}
          <View style={tw`bg-white rounded-2xl p-6 mb-6 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-800`}>Writing Streak</Text>
              <SafePhosphorIcon iconType="Fire" size={24} color="#F97316" weight="fill" />
            </View>

            <View style={tw`flex-row justify-between items-end mb-4`}>
              <View>
                <Text style={tw`text-4xl font-bold text-orange-500`}>{stats.currentStreak}</Text>
                <Text style={tw`text-gray-600`}>Current Streak</Text>
                <Text style={tw`text-orange-600 text-sm font-medium mt-1`}>
                  {getStreakMessage(stats.currentStreak)}
                </Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-2xl font-bold text-gray-700`}>{stats.longestStreak}</Text>
                <Text style={tw`text-gray-600 text-sm`}>Personal Best</Text>
              </View>
            </View>

            {/* Streak Progress Bar */}
            <View style={tw`bg-gray-200 rounded-full h-2 mb-2`}>
              <View
                style={[
                  tw`bg-orange-500 rounded-full h-2`,
                  { width: `${Math.min((stats.currentStreak / Math.max(stats.longestStreak, 7)) * 100, 100)}%` }
                ]}
              />
            </View>
            <Text style={tw`text-gray-500 text-xs text-center`}>
              {stats.currentStreak < stats.longestStreak
                ? `${stats.longestStreak - stats.currentStreak} days to beat your record`
                : 'New personal record! 🎉'
              }
            </Text>
          </View>

          {/* Mood Analytics */}
          <View style={tw`bg-white rounded-2xl p-6 mb-6 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-800`}>Mood Insights</Text>
              <Text style={tw`text-3xl`}>{getMoodEmoji(stats.mostUsedMood)}</Text>
            </View>

            <View style={tw`bg-jung-purple/10 rounded-xl p-4 mb-4`}>
              <Text style={tw`text-jung-purple font-bold text-lg capitalize text-center`}>
                Most Common: {stats.mostUsedMood} {getMoodEmoji(stats.mostUsedMood)}
              </Text>
              <Text style={tw`text-jung-purple/70 text-sm text-center mt-1`}>
                Your most frequently logged mood
              </Text>
            </View>

            <Text style={tw`text-gray-600 text-sm text-center`}>
              Track your moods consistently to discover patterns and insights about your emotional well-being.
            </Text>
          </View>

          {/* Popular Tags */}
          {stats.mostUsedTags.length > 0 && (
            <View style={tw`bg-white rounded-2xl p-6 mb-6 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Popular Tags</Text>
                <SafePhosphorIcon iconType="Tag" size={24} color="#6B7280" weight="bold" />
              </View>

              <View style={tw`flex-row flex-wrap`}>
                {stats.mostUsedTags.map((tag, index) => (
                  <View key={index} style={tw`bg-jung-purple/10 rounded-full px-4 py-2 mr-2 mb-2`}>
                    <Text style={tw`text-jung-purple font-medium`}>#{tag}</Text>
                  </View>
                ))}
              </View>

              <Text style={tw`text-gray-600 text-sm mt-3`}>
                Your most frequently used tags help identify recurring themes in your journaling.
              </Text>
            </View>
          )}

          {/* Recent Activity */}
          {recentEntries.length > 0 && (
            <View style={tw`bg-white rounded-2xl p-6 mb-6 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Recent Activity</Text>
                <SafePhosphorIcon iconType="Clock" size={24} color="#6B7280" weight="bold" />
              </View>

              {recentEntries.map((entry, index) => (
                <TouchableOpacity
                  key={entry.id}
                  style={tw`flex-row items-center py-3 ${index < recentEntries.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onPress={() => {/* TODO: Navigate to entry detail */}}
                >
                  <Text style={tw`text-2xl mr-3`}>{getMoodEmoji(entry.mood)}</Text>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-gray-800`} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text style={tw`text-gray-500 text-sm`}>
                      {new Date(entry.date).toLocaleDateString()} • {entry.wordCount} words
                    </Text>
                  </View>
                  <SafePhosphorIcon iconType="CaretRight" size={16} color="#9CA3AF" weight="bold" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action Cards */}
          <View style={tw`space-y-4 mb-8`}>
            <TouchableOpacity
              style={tw`bg-jung-purple rounded-2xl p-6 flex-row items-center`}
              onPress={() => navigation.navigate('JournalingScreen')}
            >
              <SafePhosphorIcon iconType="PenNib" size={32} color="white" weight="bold" />
              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-white font-bold text-lg`}>Write New Entry</Text>
                <Text style={tw`text-white/80 text-sm`}>Continue your journaling journey</Text>
              </View>
              <SafePhosphorIcon iconType="ArrowRight" size={20} color="white" weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-white border-2 border-jung-purple rounded-2xl p-6 flex-row items-center`}
              onPress={() => {/* TODO: Export functionality */}}
            >
              <SafePhosphorIcon iconType="Download" size={32} color="#4A3B78" weight="bold" />
              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-jung-purple font-bold text-lg`}>Export Journal</Text>
                <Text style={tw`text-jung-purple/70 text-sm`}>Download your entries as text or JSON</Text>
              </View>
              <SafePhosphorIcon iconType="ArrowRight" size={20} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default JournalInsightsScreen;