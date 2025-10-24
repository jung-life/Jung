import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';
import { TrendUp, Brain, Target, Fire, House } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { thoughtAnalyticsService } from '../services/thoughtAnalyticsService';
import { DistortionAnalytics, UserProgress } from '../types/cognitiveDistortions';
import { COGNITIVE_DISTORTIONS } from '../data/cognitiveDistortions';

export const ThoughtInsights: React.FC = () => {
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<DistortionAnalytics | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsData, progressData, insightsData] = await Promise.all([
        thoughtAnalyticsService.getAnalytics(),
        thoughtAnalyticsService.getUserProgress(),
        thoughtAnalyticsService.getPersonalInsights()
      ]);

      setAnalytics(analyticsData);
      setProgress(progressData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading insights data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderProgressCard = () => {
    if (!progress) return null;

    return (
      <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
        <View style={tw`flex-row items-center mb-4`}>
          <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>
            <Target size={20} color="#3B82F6" weight="bold" />
          </View>
          <View>
            <Text style={tw`text-lg font-semibold text-gray-800`}>Your Progress</Text>
            <Text style={tw`text-sm text-gray-600`}>Level {progress.level} • {progress.pointsEarned} points</Text>
          </View>
        </View>

        <View style={tw`flex-row justify-between`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-blue-600`}>{analytics?.totalEntries || 0}</Text>
            <Text style={tw`text-xs text-gray-600 text-center`}>Thoughts Processed</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <View style={tw`flex-row items-center`}>
              <Fire size={16} color="#EF4444" weight="fill" />
              <Text style={tw`text-2xl font-bold text-red-500 ml-1`}>{progress.consecutiveDays}</Text>
            </View>
            <Text style={tw`text-xs text-gray-600 text-center`}>Day Streak</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-green-600`}>
              {analytics?.emotionalImprovement ? `+${analytics.emotionalImprovement.toFixed(1)}` : '0'}
            </Text>
            <Text style={tw`text-xs text-gray-600 text-center`}>Avg Improvement</Text>
          </View>
        </View>

        {/* Progress to next level */}
        <View style={tw`mt-4`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-sm text-gray-600`}>Level {progress.level}</Text>
            <Text style={tw`text-sm text-gray-600`}>Level {progress.level + 1}</Text>
          </View>
          <View style={tw`w-full h-2 bg-gray-200 rounded-full`}>
            <View
              style={[
                tw`h-full bg-blue-500 rounded-full`,
                { width: `${((progress.pointsEarned % 100) / 100) * 100}%` }
              ]}
            />
          </View>
          <Text style={tw`text-xs text-gray-500 mt-1 text-center`}>
            {100 - (progress.pointsEarned % 100)} points to next level
          </Text>
        </View>
      </View>
    );
  };

  const renderDistortionBreakdown = () => {
    if (!analytics || Object.keys(analytics.mostCommonDistortions).length === 0) {
      return (
        <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
          <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>Common Patterns</Text>
          <Text style={tw`text-gray-600 text-center py-8`}>
            Complete more exercises to see your thinking patterns
          </Text>
        </View>
      );
    }

    const sortedDistortions = Object.entries(analytics.mostCommonDistortions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const maxCount = Math.max(...Object.values(analytics.mostCommonDistortions));

    return (
      <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
        <View style={tw`flex-row items-center mb-4`}>
          <View style={tw`w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3`}>
            <Brain size={20} color="#7C3AED" weight="bold" />
          </View>
          <Text style={tw`text-lg font-semibold text-gray-800`}>Your Common Patterns</Text>
        </View>

        {sortedDistortions.map(([distortionId, count], index) => {
          const distortion = COGNITIVE_DISTORTIONS.find(d => d.id === distortionId);
          if (!distortion) return null;

          const percentage = (count / maxCount) * 100;

          return (
            <View key={distortionId} style={tw`mb-4 last:mb-0`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <Text style={tw`text-base mr-2`}>{distortion.icon}</Text>
                  <Text style={tw`text-sm font-medium text-gray-800 flex-1`}>
                    {distortion.name}
                  </Text>
                </View>
                <Text style={tw`text-sm font-bold text-gray-700`}>{count}x</Text>
              </View>
              <View style={tw`w-full h-2 bg-gray-200 rounded-full`}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${percentage}%`,
                      backgroundColor: distortion.color
                    }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderInsights = () => {
    if (insights.length === 0) return null;

    return (
      <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
        <View style={tw`flex-row items-center mb-4`}>
          <View style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3`}>
            <TrendUp size={20} color="#059669" weight="bold" />
          </View>
          <Text style={tw`text-lg font-semibold text-gray-800`}>Personal Insights</Text>
        </View>

        {insights.map((insight, index) => (
          <View key={index} style={tw`mb-3 last:mb-0`}>
            <View style={tw`flex-row`}>
              <Text style={tw`text-green-500 mr-2`}>•</Text>
              <Text style={tw`text-sm text-gray-700 flex-1`}>{insight}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderBadges = () => {
    if (!progress || progress.badgesUnlocked.length === 0) return null;

    const badgeInfo = {
      'first-entry': { emoji: '🌱', name: 'First Step', description: 'Completed your first thought exercise' },
      'dedicated-learner': { emoji: '📚', name: 'Dedicated Learner', description: 'Completed 10 thought exercises' },
      'week-warrior': { emoji: '💪', name: 'Week Warrior', description: 'Maintained a 7-day streak' },
      'mood-improver': { emoji: '😊', name: 'Mood Improver', description: 'Consistently improved your mood' }
    };

    return (
      <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>Achievements</Text>
        <View style={tw`flex-row flex-wrap`}>
          {progress.badgesUnlocked.map((badgeId) => {
            const badge = badgeInfo[badgeId as keyof typeof badgeInfo];
            if (!badge) return null;

            return (
              <View key={badgeId} style={tw`w-1/2 p-2`}>
                <View style={tw`bg-yellow-50 border border-yellow-200 rounded-lg p-3 items-center`}>
                  <Text style={tw`text-2xl mb-1`}>{badge.emoji}</Text>
                  <Text style={tw`text-xs font-medium text-gray-800 text-center`}>{badge.name}</Text>
                  <Text style={tw`text-xs text-gray-600 text-center mt-1`}>{badge.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <GradientBackground variant="emotional">
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`flex-row items-center px-6 py-4`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PostLoginScreen' as any)}
            style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4`}
          >
            <House size={20} color="#FFFFFF" weight="regular" />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-semibold text-white`}>Your Insights</Text>
            <Text style={tw`text-sm text-white/80`}>Track your wellness journey</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={tw`flex-1 bg-gray-50`}
          contentContainerStyle={tw`px-6 py-6`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderProgressCard()}
          {renderInsights()}
          {renderDistortionBreakdown()}
          {renderBadges()}

          {/* Encouragement */}
          <View style={tw`bg-blue-50 rounded-xl p-6 mb-6`}>
            <Text style={tw`text-base font-medium text-blue-800 mb-2`}>
              Keep Growing! 🌟
            </Text>
            <Text style={tw`text-sm text-blue-700`}>
              Every thought you challenge builds stronger emotional resilience.
              Your awareness and practice are already making a difference.
            </Text>
          </View>

          {/* Start New Exercise Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('CognitiveDistortionChecker' as never)}
            style={tw`bg-purple-500 py-4 rounded-xl mb-6`}
          >
            <Text style={tw`text-white text-center font-semibold text-base`}>
              Start New Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};