import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { CostAnalytics } from '../components/CostAnalytics';
import { creditService, CreditUsageStats } from '../lib/creditService';
import { useAuth } from '../hooks/useAuth';
import { AnalyticsLimitPrompt, PremiumFeatureCard, SubscriptionCTA } from '../components/PremiumPrompts';
import { SubscriptionCard } from '../components/SubscriptionStatus';
import { useSubscription } from '../hooks/useSubscription';
import tw from '../lib/tailwind';

interface MoodEntry {
  date: string;
  mood: number; // 1-10 scale
  notes?: string;
}

interface GrowthMetric {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  isPositive: boolean;
}

export default function PersonalGrowthDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isPremiumUser } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<CreditUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real data from your backend
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([
    {
      title: 'Sessions This Week',
      value: '12',
      change: '+3 from last week',
      icon: 'ChatCircle',
      color: '#6366F1',
      isPositive: true
    },
    {
      title: 'Avg Session Quality',
      value: '8.4/10',
      change: '+0.8 improvement',
      icon: 'Star',
      color: '#F59E0B',
      isPositive: true
    },
    {
      title: 'Insights Gained',
      value: '24',
      change: '+6 this month',
      icon: 'Lightbulb',
      color: '#10B981',
      isPositive: true
    },
    {
      title: 'Emotional Stability',
      value: '7.2/10',
      change: '+1.4 since start',
      icon: 'Heart',
      color: '#EF4444',
      isPositive: true
    }
  ]);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const stats = await creditService.getCreditUsageStats(user.id, 30);
      setUsageStats(stats);

      // Update metrics based on real usage data
      if (stats) {
        updateMetricsFromUsage(stats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMetricsFromUsage = (stats: CreditUsageStats) => {
    const dailyAverage = stats.totalMessages / 30;
    const weeklyEstimate = Math.round(dailyAverage * 7);

    setGrowthMetrics(prev => [
      {
        ...prev[0],
        value: weeklyEstimate.toString(),
        change: stats.totalMessages > 0 ? `${stats.totalMessages} total messages` : 'No recent activity'
      },
      {
        ...prev[1],
        value: stats.averageCreditsPerMessage > 0 ? `${stats.averageCreditsPerMessage.toFixed(1)} credits/msg` : 'N/A',
        change: 'Avg cost per message'
      },
      prev[2], // Keep insights as is for now
      prev[3]  // Keep emotional stability as is for now
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderMetricCard = (metric: GrowthMetric, index: number) => {
    return (
      <View key={index} style={tw`w-1/2 ${index % 2 === 0 ? 'pr-2' : 'pl-2'} mb-4`}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={tw`rounded-2xl p-4 shadow-sm border border-gray-100`}
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: metric.color + '20' }]}>
              <SafePhosphorIcon
                iconType={metric.icon as any}
                size={20}
                color={metric.color}
                weight="bold"
              />
            </View>
          </View>

          <Text style={tw`text-2xl font-bold text-gray-800 mb-1`}>
            {metric.value}
          </Text>
          <Text style={tw`text-xs font-medium text-gray-600 mb-2`}>
            {metric.title}
          </Text>
          <Text style={[
            tw`text-xs`,
            metric.isPositive ? tw`text-green-600` : tw`text-red-600`
          ]}>
            {metric.change}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        title: 'New Session',
        subtitle: 'Start conversation',
        icon: 'Plus',
        color: '#6366F1',
        onPress: () => navigation.navigate('Chat' as never)
      },
      {
        title: 'Support Center',
        subtitle: 'Crisis & self-help resources',
        icon: 'FirstAid',
        color: '#EF4444',
        onPress: () => navigation.navigate('SupportCenter' as never)
      },
      {
        title: 'Analytics',
        subtitle: 'View detailed insights',
        icon: 'ChartLine',
        color: '#10B981',
        onPress: () => navigation.navigate('ConversationAnalytics' as never)
      },
      {
        title: 'Export Data',
        subtitle: 'Download insights',
        icon: 'Download',
        color: '#F59E0B',
        onPress: () => {/* TODO: Implement export */}
      }
    ];

    return (
      <View style={tw`mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4 px-6`}>
          Quick Actions
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`px-6`}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={tw`mr-4 ${index === actions.length - 1 ? 'mr-6' : ''}`}
            >
              <LinearGradient
                colors={[action.color, action.color + 'DD']}
                style={tw`w-32 h-24 rounded-2xl p-4 justify-between`}
              >
                <SafePhosphorIcon
                  iconType={action.icon as any}
                  size={24}
                  color="#FFFFFF"
                  weight="bold"
                />
                <View>
                  <Text style={tw`text-white font-bold text-sm`}>
                    {action.title}
                  </Text>
                  <Text style={tw`text-white/80 text-xs`}>
                    {action.subtitle}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRecentInsights = () => {
    const insights = [
      {
        title: "You're processing emotions more effectively",
        description: "Your conversations show increased emotional vocabulary and self-awareness.",
        icon: "Brain",
        color: "#6366F1"
      },
      {
        title: "Pattern recognition improving",
        description: "You've identified 3 recurring behavioral patterns this month.",
        icon: "Graph",
        color: "#10B981"
      },
      {
        title: "Integration work needed",
        description: "Consider practicing insights from recent shadow work sessions.",
        icon: "Target",
        color: "#F59E0B"
      }
    ];

    return (
      <View style={tw`px-6 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          Recent Insights
        </Text>
        {insights.map((insight, index) => (
          <View key={index} style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-start`}>
              <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1`, { backgroundColor: insight.color + '20' }]}>
                <SafePhosphorIcon
                  iconType={insight.icon as any}
                  size={16}
                  color={insight.color}
                  weight="bold"
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`font-semibold text-gray-800 mb-1`}>
                  {insight.title}
                </Text>
                <Text style={tw`text-sm text-gray-600`}>
                  {insight.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />

        {/* Header */}
        <View style={tw`px-6 pt-2 pb-4`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`p-2 -ml-2`}
            >
              <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold text-jung-deep`}>Growth Dashboard</Text>
            <TouchableOpacity onPress={onRefresh} style={tw`p-2 -mr-2`}>
              <SafePhosphorIcon iconType="ArrowsClockwise" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
          </View>
          <Text style={tw`text-center text-gray-600`}>
            Track your personal development journey
          </Text>
        </View>

        <ScrollView
          style={tw`flex-1`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Subscription Status */}
          <SubscriptionCard />

          {/* Growth Metrics */}
          <View style={tw`px-6 mb-6`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
              Your Progress
            </Text>
            <View style={tw`flex-row flex-wrap`}>
              {growthMetrics.map((metric, index) => renderMetricCard(metric, index))}
            </View>
          </View>

          {/* Premium Features Showcase - After showing basic metrics */}
          {!isPremiumUser && (
            <View style={tw`px-6 mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
                Unlock Advanced Features
              </Text>
              <PremiumFeatureCard
                title="Deep Pattern Analysis"
                description="AI identifies recurring themes and breakthrough moments"
                icon="🧠"
              />
              <PremiumFeatureCard
                title="Mood Correlation Insights"
                description="Discover how conversations impact your emotional well-being"
                icon="📊"
              />
              <PremiumFeatureCard
                title="Therapeutic Goal Tracking"
                description="Set and monitor progress toward specific psychological goals"
                icon="🎯"
              />
            </View>
          )}

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Recent Insights */}
          {renderRecentInsights()}

          {/* Cost Analytics Integration */}
          {user?.id && (
            <View style={tw`px-6 mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
                Usage Analytics
              </Text>
              <CostAnalytics userId={user.id} daysBack={30} />
            </View>
          )}

          {/* Growth Tips */}
          <View style={tw`px-6 mb-8`}>
            <View style={tw`bg-jung-purple/10 rounded-2xl p-6`}>
              <View style={tw`flex-row items-center mb-3`}>
                <SafePhosphorIcon iconType="Lightbulb" size={24} color="#4A3B78" weight="bold" />
                <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>
                  Growth Tip
                </Text>
              </View>
              <Text style={tw`text-gray-700 leading-6`}>
                Consider setting aside 10 minutes daily for reflection. Regular self-observation
                accelerates personal growth and helps integrate insights from your conversations.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}