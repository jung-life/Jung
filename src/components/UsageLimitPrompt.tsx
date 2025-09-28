import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { useNavigation } from '@react-navigation/native';
import { useUsageTracking } from '../hooks/useUsageTracking';
import tw from '../lib/tailwind';

interface UsageLimitPromptProps {
  visible: boolean;
  onClose: () => void;
  limitType?: 'daily' | 'weekly' | 'monthly' | 'feature';
  title?: string;
  message?: string;
}

export const UsageLimitPrompt: React.FC<UsageLimitPromptProps> = ({
  visible,
  onClose,
  limitType = 'daily',
  title,
  message
}) => {
  const navigation = useNavigation();
  const { usageStats, FREE_USER_LIMITS } = useUsageTracking();

  const getLimitInfo = () => {
    switch (limitType) {
      case 'daily':
        return {
          title: title || 'Daily Limit Reached',
          message: message || `You've reached your daily limit of ${FREE_USER_LIMITS.conversationsPerDay} conversations.`,
          icon: 'Calendar' as const,
          resetTime: 'Resets tomorrow',
          color: '#F59E0B'
        };
      case 'weekly':
        return {
          title: title || 'Weekly Message Limit',
          message: message || `You've sent ${FREE_USER_LIMITS.messagesPerWeek} messages this week.`,
          icon: 'ChatCircle' as const,
          resetTime: 'Resets on Monday',
          color: '#8B5CF6'
        };
      case 'monthly':
        return {
          title: title || 'Monthly Limit Reached',
          message: message || `You've reached your monthly limit of ${FREE_USER_LIMITS.conversationsPerMonth} conversations.`,
          icon: 'Calendar' as const,
          resetTime: 'Resets next month',
          color: '#EF4444'
        };
      case 'feature':
        return {
          title: title || 'Premium Feature',
          message: message || `You've explored ${FREE_USER_LIMITS.premiumFeatures} features. Unlock unlimited access!`,
          icon: 'Star' as const,
          resetTime: 'Upgrade for unlimited',
          color: '#10B981'
        };
      default:
        return {
          title: 'Usage Limit',
          message: 'You\'ve reached your usage limit.',
          icon: 'Info' as const,
          resetTime: 'Upgrade for more',
          color: '#6B7280'
        };
    }
  };

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('Subscription' as never);
  };

  const limitInfo = getLimitInfo();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 justify-center items-center px-6`}>
        <View style={tw`bg-white rounded-2xl p-6 max-w-sm w-full`}>
          {/* Header */}
          <View style={tw`items-center mb-6`}>
            <LinearGradient
              colors={[limitInfo.color, `${limitInfo.color}CC`]}
              style={tw`rounded-full p-4 mb-4`}
            >
              <SafePhosphorIcon
                iconType={limitInfo.icon}
                size={32}
                color="#FFFFFF"
                weight="bold"
              />
            </LinearGradient>
            <Text style={tw`text-xl font-bold text-gray-800 text-center mb-2`}>
              {limitInfo.title}
            </Text>
            <Text style={tw`text-gray-600 text-center leading-6`}>
              {limitInfo.message}
            </Text>
          </View>

          {/* Usage Stats */}
          <View style={tw`bg-gray-50 rounded-lg p-4 mb-6`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Your Usage</Text>
            <View style={tw`space-y-2`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm text-gray-600`}>Conversations today:</Text>
                <Text style={tw`text-sm font-medium text-gray-800`}>
                  {usageStats.conversationsToday}/{FREE_USER_LIMITS.conversationsPerDay}
                </Text>
              </View>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm text-gray-600`}>Messages this week:</Text>
                <Text style={tw`text-sm font-medium text-gray-800`}>
                  {usageStats.messagesThisWeek}/{FREE_USER_LIMITS.messagesPerWeek}
                </Text>
              </View>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm text-gray-600`}>Conversations this month:</Text>
                <Text style={tw`text-sm font-medium text-gray-800`}>
                  {usageStats.conversationsThisMonth}/{FREE_USER_LIMITS.conversationsPerMonth}
                </Text>
              </View>
            </View>
          </View>

          {/* Premium Benefits */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Premium Benefits</Text>
            <View style={tw`space-y-2`}>
              {[
                'Unlimited conversations',
                'Unlimited messages',
                'Advanced analytics',
                'Priority support'
              ].map((benefit, index) => (
                <View key={index} style={tw`flex-row items-center`}>
                  <SafePhosphorIcon iconType="Plus" size={14} color="#10B981" weight="bold" />
                  <Text style={tw`ml-2 text-sm text-gray-600`}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reset Time */}
          <View style={tw`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6`}>
            <Text style={tw`text-blue-800 text-sm text-center`}>
              ⏰ {limitInfo.resetTime}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={tw`space-y-3`}>
            <TouchableOpacity
              onPress={handleUpgrade}
              style={tw`bg-jung-purple rounded-xl py-4 px-6 flex-row items-center justify-center`}
            >
              <Text style={tw`text-white text-2xl mr-3`}>👑</Text>
              <Text style={tw`text-white font-bold text-lg`}>Upgrade to Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={tw`bg-gray-100 border border-gray-200 rounded-xl py-3 px-6`}
            >
              <Text style={tw`text-gray-700 font-medium text-center`}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Specialized components for different limits
export const DailyLimitPrompt: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <UsageLimitPrompt visible={visible} onClose={onClose} limitType="daily" />
);

export const WeeklyLimitPrompt: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <UsageLimitPrompt visible={visible} onClose={onClose} limitType="weekly" />
);

export const MonthlyLimitPrompt: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <UsageLimitPrompt visible={visible} onClose={onClose} limitType="monthly" />
);

export const FeatureLimitPrompt: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <UsageLimitPrompt visible={visible} onClose={onClose} limitType="feature" />
);