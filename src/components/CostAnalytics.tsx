import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { creditService, CreditUsageStats } from '../lib/creditService';
import { standardizedLLM } from '../lib/standardizedLLM';
import tw from '../lib/tailwind';

interface CostAnalyticsProps {
  userId: string;
  daysBack?: number;
}

export const CostAnalytics: React.FC<CostAnalyticsProps> = ({
  userId,
  daysBack = 30
}) => {
  const [usageStats, setUsageStats] = useState<CreditUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, [userId, daysBack]);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const stats = await creditService.getCreditUsageStats(userId, daysBack);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(3)}`;
  };

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  if (loading) {
    return (
      <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
        <Text style={tw`text-center text-gray-500`}>Loading analytics...</Text>
      </View>
    );
  }

  if (!usageStats) {
    return (
      <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
        <Text style={tw`text-center text-gray-500`}>No usage data available</Text>
      </View>
    );
  }

  const avgCostPerMessage = usageStats.totalMessages > 0
    ? usageStats.totalApiCostCents / usageStats.totalMessages
    : 0;

  const costSavingsVsLegacy = usageStats.totalMessages > 0
    ? (usageStats.totalMessages * 1.8) - (usageStats.totalApiCostCents / 100) // Assuming 1.8 cents per message with legacy GPT-4
    : 0;

  return (
    <ScrollView style={tw`bg-white rounded-xl shadow-sm`}>
      <View style={tw`p-4`}>
        <View style={tw`flex-row items-center mb-4`}>
          <SafePhosphorIcon iconType="ChartLine" size={24} color="#4A3B78" weight="bold" />
          <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>
            Cost Analytics ({daysBack} days)
          </Text>
        </View>

        {/* Overview Stats */}
        <View style={tw`flex-row flex-wrap mb-6`}>
          <View style={tw`w-1/2 pr-2 mb-4`}>
            <View style={tw`bg-blue-50 rounded-lg p-3`}>
              <Text style={tw`text-xs text-blue-600 font-medium`}>Total Messages</Text>
              <Text style={tw`text-2xl font-bold text-blue-800`}>
                {usageStats.totalMessages}
              </Text>
            </View>
          </View>

          <View style={tw`w-1/2 pl-2 mb-4`}>
            <View style={tw`bg-green-50 rounded-lg p-3`}>
              <Text style={tw`text-xs text-green-600 font-medium`}>Credits Used</Text>
              <Text style={tw`text-2xl font-bold text-green-800`}>
                {formatCredits(usageStats.totalCreditsUsed)}
              </Text>
            </View>
          </View>

          <View style={tw`w-1/2 pr-2 mb-4`}>
            <View style={tw`bg-purple-50 rounded-lg p-3`}>
              <Text style={tw`text-xs text-purple-600 font-medium`}>Total Cost</Text>
              <Text style={tw`text-2xl font-bold text-purple-800`}>
                {formatCurrency(usageStats.totalApiCostCents)}
              </Text>
            </View>
          </View>

          <View style={tw`w-1/2 pl-2 mb-4`}>
            <View style={tw`bg-orange-50 rounded-lg p-3`}>
              <Text style={tw`text-xs text-orange-600 font-medium`}>Avg/Message</Text>
              <Text style={tw`text-2xl font-bold text-orange-800`}>
                {formatCurrency(avgCostPerMessage)}
              </Text>
            </View>
          </View>
        </View>

        {/* Cost Savings */}
        {costSavingsVsLegacy > 0 && (
          <View style={tw`bg-green-100 border border-green-200 rounded-lg p-4 mb-6`}>
            <View style={tw`flex-row items-center mb-2`}>
              <SafePhosphorIcon iconType="TrendUp" size={20} color="#059669" weight="bold" />
              <Text style={tw`text-green-800 font-bold text-lg ml-2`}>Cost Savings</Text>
            </View>
            <Text style={tw`text-green-700 text-sm mb-2`}>
              Saved vs legacy GPT-4 pricing:
            </Text>
            <Text style={tw`text-green-800 font-bold text-xl`}>
              ${costSavingsVsLegacy.toFixed(2)}
            </Text>
            <Text style={tw`text-green-600 text-xs mt-1`}>
              That's {((costSavingsVsLegacy / (usageStats.totalApiCostCents / 100 + costSavingsVsLegacy)) * 100).toFixed(0)}% savings!
            </Text>
          </View>
        )}

        {/* Usage by Provider/Model */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-md font-semibold text-gray-700 mb-3`}>
            Most Used
          </Text>
          <View style={tw`bg-gray-50 rounded-lg p-3`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-sm text-gray-600`}>Provider:</Text>
              <Text style={tw`text-sm font-medium text-gray-800`}>
                {usageStats.mostUsedProvider || 'N/A'}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-sm text-gray-600`}>Avatar:</Text>
              <Text style={tw`text-sm font-medium text-gray-800`}>
                {usageStats.mostUsedAvatar || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage by Avatar */}
        {usageStats.usageByAvatar.length > 0 && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-md font-semibold text-gray-700 mb-3`}>
              Usage by Avatar
            </Text>
            {usageStats.usageByAvatar.map((avatar, index) => (
              <View key={avatar.avatarId} style={tw`flex-row justify-between items-center py-2`}>
                <Text style={tw`text-sm text-gray-600 capitalize`}>
                  {avatar.avatarId.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-sm font-medium text-gray-800 mr-3`}>
                    {avatar.messages} msgs
                  </Text>
                  <Text style={tw`text-sm text-blue-600`}>
                    {avatar.credits} credits
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Efficiency Metrics */}
        <View style={tw`bg-jung-purple/5 rounded-lg p-4`}>
          <Text style={tw`text-md font-semibold text-jung-deep mb-3`}>
            Efficiency Metrics
          </Text>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Avg credits/message:</Text>
              <Text style={tw`text-sm font-medium text-jung-deep`}>
                {usageStats.averageCreditsPerMessage.toFixed(1)}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Daily avg messages:</Text>
              <Text style={tw`text-sm font-medium text-jung-deep`}>
                {(usageStats.totalMessages / daysBack).toFixed(1)}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Daily avg cost:</Text>
              <Text style={tw`text-sm font-medium text-jung-deep`}>
                {formatCurrency(usageStats.totalApiCostCents / daysBack)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};