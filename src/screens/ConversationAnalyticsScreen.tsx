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
import { creditService, CreditUsageStats } from '../lib/creditService';
import { standardizedLLM } from '../lib/standardizedLLM';
import useAuthStore from '../store/useAuthStore';
import { AnalyticsLimitPrompt, InsightsTeaser, ExportLimitPrompt } from '../components/PremiumPrompts';
import { useSubscription } from '../hooks/useSubscription';
import tw from '../lib/tailwind';

interface ConversationTheme {
  theme: string;
  count: number;
  percentage: number;
  color: string;
  insights: string[];
}

interface EmotionalPattern {
  emotion: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  color: string;
}

interface AnalyticsData {
  themes: ConversationTheme[];
  emotions: EmotionalPattern[];
  aiInsights: string[];
  progressMetrics: {
    totalSessions: number;
    avgSessionLength: number;
    mostActiveAvatar: string;
    growthIndicators: string[];
  };
}

export default function ConversationAnalyticsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { isPremiumUser } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<CreditUsageStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 30 | 90>(30);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = async () => {
    if (!user?.id) {
      console.log('No user ID available for analytics');
      // Set mock data even without user for demonstration
      setAnalyticsData(await generateAnalyticsInsights({
        totalMessages: 0,
        totalCreditsUsed: 0,
        averageCreditsPerMessage: 0,
        totalApiCostCents: 0,
        mostUsedAvatar: '',
        mostUsedProvider: '',
        usageByDay: [],
        usageByAvatar: [],
      }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading analytics for user:', user.id);

      // Load usage stats from credit service
      const stats = await creditService.getCreditUsageStats(user.id, selectedTimeframe);
      console.log('Usage stats loaded:', stats);
      setUsageStats(stats);

      // Generate AI-powered insights (mock data for now - replace with real AI analysis)
      const analyticsData = await generateAnalyticsInsights(stats);
      console.log('Analytics data generated:', analyticsData);
      setAnalyticsData(analyticsData);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set fallback data on error
      setAnalyticsData(await generateAnalyticsInsights({
        totalMessages: 0,
        totalCreditsUsed: 0,
        averageCreditsPerMessage: 0,
        totalApiCostCents: 0,
        mostUsedAvatar: '',
        mostUsedProvider: '',
        usageByDay: [],
        usageByAvatar: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsInsights = async (stats: CreditUsageStats): Promise<AnalyticsData> => {
    // In a real implementation, you'd analyze conversation content with AI
    // For now, using mock data based on usage patterns

    // Use demo data if no real messages exist
    const baseMessages = stats.totalMessages > 0 ? stats.totalMessages : 15; // Demo with 15 messages

    const themes: ConversationTheme[] = [
      {
        theme: 'Self-Discovery',
        count: Math.round(baseMessages * 0.3),
        percentage: 30,
        color: '#6366F1',
        insights: [
          'You frequently explore questions about identity and purpose',
          'Strong focus on understanding your authentic self',
          'Regular patterns of questioning life direction'
        ]
      },
      {
        theme: 'Relationship Dynamics',
        count: Math.round(baseMessages * 0.25),
        percentage: 25,
        color: '#EC4899',
        insights: [
          'Consistent exploration of interpersonal patterns',
          'Growing awareness of communication styles',
          'Processing past relationship experiences'
        ]
      },
      {
        theme: 'Emotional Processing',
        count: Math.round(baseMessages * 0.2),
        percentage: 20,
        color: '#10B981',
        insights: [
          'Regular work on emotional regulation',
          'Increasing emotional vocabulary',
          'Better understanding of trigger patterns'
        ]
      },
      {
        theme: 'Shadow Work',
        count: Math.round(baseMessages * 0.15),
        percentage: 15,
        color: '#F59E0B',
        insights: [
          'Brave exploration of unconscious aspects',
          'Growing comfort with difficult emotions',
          'Integration of rejected parts of self'
        ]
      },
      {
        theme: 'Dreams & Symbols',
        count: Math.round(baseMessages * 0.1),
        percentage: 10,
        color: '#8B5CF6',
        insights: [
          'Active engagement with unconscious material',
          'Symbolic thinking development',
          'Dream recall improvement'
        ]
      }
    ];

    const emotions: EmotionalPattern[] = [
      { emotion: 'Curiosity', frequency: 85, trend: 'increasing', color: '#6366F1' },
      { emotion: 'Anxiety', frequency: 45, trend: 'decreasing', color: '#EF4444' },
      { emotion: 'Contentment', frequency: 70, trend: 'increasing', color: '#10B981' },
      { emotion: 'Confusion', frequency: 35, trend: 'stable', color: '#F59E0B' },
      { emotion: 'Excitement', frequency: 60, trend: 'increasing', color: '#EC4899' }
    ];

    const aiInsights = [
      'Your conversation depth has increased 40% over the past month, indicating growing psychological sophistication.',
      'You show consistent patterns of integration - taking insights from conversations and applying them practically.',
      'Strong preference for the Depth Delver avatar suggests comfort with analytical, introspective approaches.',
      'Your question complexity has evolved from "what" to "why" and "how" - showing deeper psychological inquiry.',
      'Emotional vocabulary has expanded significantly, with 60% more nuanced emotion words used recently.'
    ];

    return {
      themes,
      emotions,
      aiInsights,
      progressMetrics: {
        totalSessions: baseMessages,
        avgSessionLength: stats.averageCreditsPerMessage > 0 ? stats.averageCreditsPerMessage * 100 : 180, // Mock session length
        mostActiveAvatar: stats.mostUsedAvatar || 'Depth Delver',
        growthIndicators: [
          'Increased session frequency',
          'More complex question patterns',
          'Better emotional articulation',
          'Greater insight integration'
        ]
      }
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const renderTimeframeSelector = () => {
    const timeframes = [
      { value: 7, label: '7 Days' },
      { value: 30, label: '30 Days' },
      { value: 90, label: '90 Days' }
    ];

    return (
      <View style={tw`flex-row bg-gray-100 rounded-xl p-1 mx-6 mb-6`}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe.value}
            onPress={() => setSelectedTimeframe(timeframe.value)}
            style={[
              tw`flex-1 py-2 rounded-lg`,
              selectedTimeframe === timeframe.value ? tw`bg-white shadow-sm` : null
            ]}
          >
            <Text style={[
              tw`text-center font-medium`,
              selectedTimeframe === timeframe.value ? tw`text-jung-purple` : tw`text-gray-600`
            ]}>
              {timeframe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderThemeAnalysis = () => {
    if (!analyticsData) return null;

    return (
      <View style={tw`px-6 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          Conversation Themes
        </Text>
        {analyticsData.themes.map((theme, index) => (
          <View key={index} style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[tw`w-4 h-4 rounded-full mr-3`, { backgroundColor: theme.color }]} />
                <Text style={tw`font-semibold text-gray-800 flex-1`}>
                  {theme.theme}
                </Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`font-bold text-lg text-gray-800`}>
                  {theme.percentage}%
                </Text>
                <Text style={tw`text-xs text-gray-500`}>
                  {theme.count} messages
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={tw`bg-gray-200 rounded-full h-2 mb-3`}>
              <View
                style={[
                  tw`h-2 rounded-full`,
                  { backgroundColor: theme.color, width: `${theme.percentage}%` }
                ]}
              />
            </View>

            {/* Key insights */}
            <View>
              <Text style={tw`text-xs font-medium text-gray-600 mb-2`}>Key Insights:</Text>
              {theme.insights.slice(0, 2).map((insight, idx) => (
                <Text key={idx} style={tw`text-xs text-gray-600 mb-1`}>
                  • {insight}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderEmotionalPatterns = () => {
    if (!analyticsData) return null;

    return (
      <View style={tw`px-6 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          Emotional Patterns
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {analyticsData.emotions.map((emotion, index) => (
            <View key={index} style={tw`mr-4 ${index === analyticsData.emotions.length - 1 ? 'mr-6' : ''}`}>
              <LinearGradient
                colors={[emotion.color + '20', emotion.color + '10']}
                style={tw`w-32 rounded-xl p-4 border border-gray-100`}
              >
                <View style={tw`items-center`}>
                  <Text style={tw`font-bold text-gray-800 mb-1`}>
                    {emotion.emotion}
                  </Text>
                  <Text style={tw`text-2xl font-bold mb-2`}
                        color={emotion.color}>
                    {emotion.frequency}%
                  </Text>
                  <View style={tw`flex-row items-center`}>
                    <SafePhosphorIcon
                      iconType={
                        emotion.trend === 'increasing' ? 'TrendUp' :
                        emotion.trend === 'decreasing' ? 'TrendDown' : 'Minus'
                      }
                      size={12}
                      color={
                        emotion.trend === 'increasing' ? '#10B981' :
                        emotion.trend === 'decreasing' ? '#EF4444' : '#6B7280'
                      }
                      weight="bold"
                    />
                    <Text style={tw`text-xs text-gray-600 ml-1 capitalize`}>
                      {emotion.trend}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAIInsights = () => {
    if (!analyticsData) return null;

    return (
      <View style={tw`px-6 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          AI-Generated Insights
        </Text>
        {analyticsData.aiInsights.slice(0, 3).map((insight, index) => (
          <View key={index} style={tw`bg-jung-purple/5 rounded-xl p-4 mb-3 border border-jung-purple/10`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`bg-jung-purple/20 rounded-full p-2 mr-3 mt-1`}>
                <SafePhosphorIcon iconType="Brain" size={16} color="#4A3B78" weight="bold" />
              </View>
              <Text style={tw`flex-1 text-gray-700 leading-5`}>
                {insight}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderProgressMetrics = () => {
    if (!analyticsData) return null;

    const metrics = [
      {
        title: 'Total Sessions',
        value: analyticsData.progressMetrics.totalSessions.toString(),
        icon: 'ChatCircle',
        color: '#6366F1'
      },
      {
        title: 'Avg Length',
        value: `${analyticsData.progressMetrics.avgSessionLength.toFixed(0)}s`,
        icon: 'Clock',
        color: '#10B981'
      },
      {
        title: 'Favorite Avatar',
        value: analyticsData.progressMetrics.mostActiveAvatar.replace(/([A-Z])/g, ' $1').trim(),
        icon: 'User',
        color: '#F59E0B'
      }
    ];

    return (
      <View style={tw`px-6 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          Progress Metrics
        </Text>
        <View style={tw`flex-row flex-wrap`}>
          {metrics.map((metric, index) => (
            <View key={index} style={tw`w-1/2 ${index % 2 === 0 ? 'pr-2' : 'pl-2'} mb-4`}>
              <View style={tw`bg-white rounded-xl p-4 shadow-sm border border-gray-100`}>
                <View style={[tw`w-8 h-8 rounded-full items-center justify-center mb-3`, { backgroundColor: metric.color + '20' }]}>
                  <SafePhosphorIcon
                    iconType={metric.icon as any}
                    size={16}
                    color={metric.color}
                    weight="bold"
                  />
                </View>
                <Text style={tw`text-xl font-bold text-gray-800 mb-1`}>
                  {metric.value}
                </Text>
                <Text style={tw`text-xs text-gray-600`}>
                  {metric.title}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
              onPress={() => navigation.navigate('PostLoginScreen' as any)}
              style={tw`p-2 -ml-2`}
            >
              <SafePhosphorIcon iconType="House" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold text-jung-deep`}>Conversation Analytics</Text>
            <TouchableOpacity onPress={onRefresh} style={tw`p-2 -mr-2`}>
              <SafePhosphorIcon iconType="ArrowsClockwise" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
          </View>
          <Text style={tw`text-center text-gray-600`}>
            Deep insights into your therapeutic journey
          </Text>
        </View>

        <ScrollView
          style={tw`flex-1`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Timeframe Selector */}
          {renderTimeframeSelector()}

          {loading ? (
            <View style={tw`px-6 py-12`}>
              <Text style={tw`text-center text-gray-500`}>
                Analyzing your conversations...
              </Text>
            </View>
          ) : (
            <>
              {/* Progress Metrics */}
              {renderProgressMetrics()}

              {/* Premium Analytics Teaser - Non-premium users */}
              {!isPremiumUser && <AnalyticsLimitPrompt />}

              {/* Theme Analysis */}
              {renderThemeAnalysis()}

              {/* Insights Teaser - After showing basic themes */}
              {!isPremiumUser && <InsightsTeaser />}

              {/* Emotional Patterns */}
              {renderEmotionalPatterns()}

              {/* AI Insights */}
              {renderAIInsights()}

              {/* Export Prompt - Before recommendations */}
              {!isPremiumUser && <ExportLimitPrompt />}

              {/* Growth Recommendations */}
              <View style={tw`px-6 mb-8`}>
                <View style={tw`bg-green-50 border border-green-200 rounded-xl p-4`}>
                  <View style={tw`flex-row items-center mb-3`}>
                    <SafePhosphorIcon iconType="Lightbulb" size={24} color="#059669" weight="bold" />
                    <Text style={tw`text-lg font-bold text-green-800 ml-2`}>
                      Growth Recommendations
                    </Text>
                  </View>
                  <Text style={tw`text-green-700 mb-2`}>
                    Based on your conversation patterns, consider:
                  </Text>
                  <Text style={tw`text-green-700 text-sm`}>
                    • Exploring dream symbolism more deeply{'\n'}
                    • Practicing integration exercises between sessions{'\n'}
                    • Setting weekly reflection goals{'\n'}
                    • Expanding emotional vocabulary through journaling
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}