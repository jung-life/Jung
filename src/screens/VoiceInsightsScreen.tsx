import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { voiceAnalyticsService } from '../services/voiceAnalyticsService';
import * as secureStore from '../lib/secureStorage';

interface VoiceNote {
  id: string;
  title: string;
  timestamp: number;
  duration: number;
  uri: string;
  mood?: string;
  tags?: string[];
  reflection?: string;
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

const VOICE_NOTES_STORAGE_KEY = 'voiceNotes';

const VoiceInsightsScreen = () => {
  const navigation = useNavigation();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [patterns, setPatterns] = useState<VoicePattern | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAndAnalyzeVoiceNotes();
  }, []);

  const loadAndAnalyzeVoiceNotes = async () => {
    try {
      setLoading(true);
      const stored = await secureStore.getItem(VOICE_NOTES_STORAGE_KEY);
      if (stored) {
        const notes: VoiceNote[] = JSON.parse(stored);
        setVoiceNotes(notes);

        const analysis = voiceAnalyticsService.analyzeVoicePatterns(notes);
        setPatterns(analysis);
      } else {
        setPatterns(voiceAnalyticsService.analyzeVoicePatterns([]));
      }
    } catch (error) {
      console.error('Failed to analyze voice notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMoodColor = (mood: string) => {
    const colors: { [key: string]: string } = {
      'Happy': 'text-green-500',
      'Excited': 'text-orange-500',
      'Calm': 'text-cyan-500',
      'Reflective': 'text-blue-500',
      'Inspired': 'text-yellow-500',
      'Grateful': 'text-pink-500',
      'Curious': 'text-purple-500'
    };
    return colors[mood] || 'text-gray-500';
  };

  const getConsistencyColor = (score: number) => {
    if (score > 0.7) return 'text-green-500';
    if (score > 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConsistencyLabel = (score: number) => {
    if (score > 0.7) return 'Excellent';
    if (score > 0.4) return 'Good';
    return 'Building';
  };

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-jung-deep text-lg`}>Analyzing your voice patterns...</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!patterns) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1 justify-center items-center px-4`}>
          <Text style={tw`text-jung-deep text-lg text-center`}>
            Unable to analyze voice notes. Please try again.
          </Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.08} />

        {/* Header */}
        <View style={tw`flex-row items-center justify-between px-4 py-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#2D2B55" weight="bold" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Voice Insights</Text>
          <View style={tw`w-6`} />
        </View>

        <ScrollView style={tw`flex-1 px-4`}>
          {/* Overview Stats */}
          <View style={tw`bg-white/80 rounded-xl p-6 mb-4 shadow-sm`}>
            <Text style={tw`text-lg font-bold text-jung-deep mb-4`}>Your Voice Journey</Text>

            <View style={tw`flex-row justify-between mb-4`}>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-2xl font-bold text-jung-purple`}>{patterns.totalNotes}</Text>
                <Text style={tw`text-sm text-gray-600 text-center`}>Total Notes</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-2xl font-bold text-jung-purple`}>
                  {formatTotalTime(patterns.totalRecordingTime)}
                </Text>
                <Text style={tw`text-sm text-gray-600 text-center`}>Total Time</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-2xl font-bold text-jung-purple`}>
                  {formatDuration(Math.round(patterns.averageDuration))}
                </Text>
                <Text style={tw`text-sm text-gray-600 text-center`}>Avg Length</Text>
              </View>
            </View>

            {/* Consistency & Streak */}
            <View style={tw`flex-row justify-between`}>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-lg font-bold ${getConsistencyColor(patterns.consistencyScore)}`}>
                  {getConsistencyLabel(patterns.consistencyScore)}
                </Text>
                <Text style={tw`text-xs text-gray-600`}>Consistency</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-lg font-bold text-orange-500`}>
                  {patterns.streakInfo.currentStreak}🔥
                </Text>
                <Text style={tw`text-xs text-gray-600`}>Current Streak</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-lg font-bold text-blue-500`}>
                  {patterns.mostActiveTimeOfDay}
                </Text>
                <Text style={tw`text-xs text-gray-600`}>Peak Time</Text>
              </View>
            </View>
          </View>

          {/* Personal Insights */}
          <View style={tw`bg-white/80 rounded-xl p-6 mb-4 shadow-sm`}>
            <View style={tw`flex-row items-center mb-4`}>
              <SafePhosphorIcon iconType="Lightbulb" size={20} color="#2D2B55" weight="fill" />
              <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>Your Insights</Text>
            </View>

            {patterns.insights.map((insight, index) => (
              <View key={index} style={tw`flex-row items-start mb-3`}>
                <View style={tw`w-2 h-2 bg-jung-purple rounded-full mt-2 mr-3`} />
                <Text style={tw`flex-1 text-gray-700 leading-6`}>{insight}</Text>
              </View>
            ))}
          </View>

          {/* Recording Patterns */}
          <View style={tw`bg-white/80 rounded-xl p-6 mb-4 shadow-sm`}>
            <View style={tw`flex-row items-center mb-4`}>
              <SafePhosphorIcon iconType="Clock" size={20} color="#2D2B55" weight="fill" />
              <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>Recording Patterns</Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Most Active Day</Text>
              <Text style={tw`text-jung-purple font-bold`}>{patterns.mostActiveDay}</Text>
            </View>

            {patterns.streakInfo.longestStreak > 0 && (
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Longest Streak</Text>
                <Text style={tw`text-orange-500 font-bold`}>{patterns.streakInfo.longestStreak} days 🏆</Text>
              </View>
            )}
          </View>

          {/* Mood Distribution */}
          {Object.keys(patterns.moodDistribution).length > 0 && (
            <View style={tw`bg-white/80 rounded-xl p-6 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center mb-4`}>
                <SafePhosphorIcon iconType="Smiley" size={20} color="#2D2B55" weight="fill" />
                <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>Emotional Awareness</Text>
              </View>

              {Object.entries(patterns.moodDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([mood, count]) => (
                <View key={mood} style={tw`flex-row items-center justify-between mb-3`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <Text style={tw`${getMoodColor(mood)} text-sm font-medium mr-2`}>●</Text>
                    <Text style={tw`text-gray-700 flex-1`}>{mood}</Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-16 h-2 bg-gray-200 rounded-full mr-3`}>
                      <View
                        style={[
                          tw`h-2 bg-jung-purple rounded-full`,
                          { width: `${Math.min((count / patterns.totalNotes) * 100, 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={tw`text-jung-purple font-bold text-sm w-8`}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          {patterns.recordingFrequency.length > 0 && (
            <View style={tw`bg-white/80 rounded-xl p-6 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center mb-4`}>
                <SafePhosphorIcon iconType="TrendUp" size={20} color="#2D2B55" weight="fill" />
                <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>Recent Activity</Text>
              </View>

              <View style={tw`flex-row flex-wrap`}>
                {patterns.recordingFrequency.slice(-7).map((day, index) => (
                  <View key={index} style={tw`flex-1 items-center mb-2 min-w-10`}>
                    <View
                      style={[
                        tw`w-8 h-8 rounded-lg items-center justify-center`,
                        { backgroundColor: day.count > 0 ? '#4A3B78' : '#E5E7EB' }
                      ]}
                    >
                      <Text style={tw`text-xs ${day.count > 0 ? 'text-white' : 'text-gray-400'} font-bold`}>
                        {day.count || ''}
                      </Text>
                    </View>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={tw`text-xs text-gray-500 mt-2 text-center`}>
                Last 7 days - Recording frequency
              </Text>
            </View>
          )}

          {/* Empty State */}
          {patterns.totalNotes === 0 && (
            <View style={tw`bg-white/60 rounded-xl p-8 items-center mb-4`}>
              <SafePhosphorIcon iconType="Microphone" size={48} color="#9CA3AF" weight="light" />
              <Text style={tw`text-gray-500 text-center mt-4 text-lg font-medium`}>
                No Voice Notes Yet
              </Text>
              <Text style={tw`text-gray-400 text-center mt-2`}>
                Start recording your thoughts to see patterns and insights about your reflection habits
              </Text>

              <TouchableOpacity
                style={tw`bg-jung-purple rounded-full px-6 py-3 mt-4`}
                onPress={() => navigation.goBack()}
              >
                <Text style={tw`text-white font-medium`}>Record Your First Note</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={tw`h-8`} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default VoiceInsightsScreen;