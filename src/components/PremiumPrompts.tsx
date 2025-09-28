import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

interface PremiumPromptProps {
  onPress?: () => void;
  style?: any;
}

export const AnalyticsLimitPrompt: React.FC<PremiumPromptProps> = ({ onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`mx-6 mb-4`, style]}>
      <LinearGradient
        colors={['#FEF3C7', '#F59E0B']}
        style={tw`rounded-2xl p-5 border border-amber-200`}
      >
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-amber-600 rounded-full p-2 mr-3`}>
            <SafePhosphorIcon iconType="ChartLine" size={20} color="#FFFFFF" weight="bold" />
          </View>
          <Text style={tw`text-lg font-bold text-amber-900 flex-1`}>
            Unlock Advanced Analytics
          </Text>
          <SafePhosphorIcon iconType="ArrowRight" size={16} color="#92400E" weight="bold" />
        </View>
        <Text style={tw`text-amber-800 mb-3 leading-5`}>
          Get deeper insights into your psychological patterns, emotional trends, and growth metrics with our premium analytics suite.
        </Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-amber-900 font-semibold mr-2`}>✨ Premium Features:</Text>
          <Text style={tw`text-amber-800 text-sm`}>Historical tracking • AI insights • Export data</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const ConversationLimitPrompt: React.FC<PremiumPromptProps> = ({ onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`mx-6 mb-4`, style]}>
      <LinearGradient
        colors={['#DBEAFE', '#3B82F6']}
        style={tw`rounded-2xl p-5 border border-blue-200`}
      >
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-blue-600 rounded-full p-2 mr-3`}>
            <SafePhosphorIcon iconType="ChatCircleDots" size={20} color="#FFFFFF" weight="bold" />
          </View>
          <Text style={tw`text-lg font-bold text-blue-900 flex-1`}>
            Continue Your Journey
          </Text>
          <SafePhosphorIcon iconType="ArrowRight" size={16} color="#1E40AF" weight="bold" />
        </View>
        <Text style={tw`text-blue-800 mb-3 leading-5`}>
          You're making great progress! Upgrade to continue unlimited conversations with all avatars and unlock your full potential.
        </Text>
        <View style={tw`bg-blue-100 rounded-lg p-3`}>
          <Text style={tw`text-blue-900 font-semibold text-center`}>
            📈 87% of premium users report breakthrough insights within 2 weeks
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const InsightsTeaser: React.FC<PremiumPromptProps> = ({ onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`mx-6 mb-4`, style]}>
      <LinearGradient
        colors={['#F3E8FF', '#8B5CF6']}
        style={tw`rounded-2xl p-5 border border-purple-200`}
      >
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-purple-600 rounded-full p-2 mr-3`}>
            <SafePhosphorIcon iconType="Brain" size={20} color="#FFFFFF" weight="bold" />
          </View>
          <Text style={tw`text-lg font-bold text-purple-900 flex-1`}>
            AI Detected Patterns
          </Text>
          <SafePhosphorIcon iconType="ArrowRight" size={16} color="#6B21A8" weight="bold" />
        </View>
        <Text style={tw`text-purple-800 mb-3 leading-5`}>
          Our AI has identified 3 recurring themes in your conversations that could unlock major breakthroughs.
        </Text>
        <View style={tw`bg-purple-100 rounded-lg p-3 mb-3`}>
          <Text style={tw`text-purple-900 font-medium mb-1`}>🔮 Hidden insights include:</Text>
          <Text style={tw`text-purple-800 text-sm`}>• Shadow work patterns • Relationship dynamics • Growth blockers</Text>
        </View>
        <Text style={tw`text-purple-900 font-semibold text-center`}>
          Unlock with Premium →
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const ExportLimitPrompt: React.FC<PremiumPromptProps> = ({ onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`mx-6 mb-4`, style]}>
      <LinearGradient
        colors={['#ECFDF5', '#10B981']}
        style={tw`rounded-2xl p-5 border border-green-200`}
      >
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-green-600 rounded-full p-2 mr-3`}>
            <SafePhosphorIcon iconType="Plus" size={20} color="#FFFFFF" weight="bold" />
          </View>
          <Text style={tw`text-lg font-bold text-green-900 flex-1`}>
            Export Your Insights
          </Text>
          <SafePhosphorIcon iconType="ArrowRight" size={16} color="#047857" weight="bold" />
        </View>
        <Text style={tw`text-green-800 mb-3 leading-5`}>
          Take your therapeutic journey beyond the app. Export conversations, insights, and progress reports to share with your therapist or for personal reflection.
        </Text>
        <View style={tw`bg-green-100 rounded-lg p-3`}>
          <Text style={tw`text-green-900 font-semibold text-center`}>
            📄 PDF Reports • 💬 Conversation Exports • 📊 Analytics Dashboard
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const SubscriptionCTA: React.FC<PremiumPromptProps> = ({ onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`mx-6 mb-6`, style]}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={tw`rounded-2xl p-6 border border-gray-600`}
      >
        <View style={tw`items-center`}>
          <Text style={tw`text-2xl mb-2`}>👑</Text>
          <Text style={tw`text-xl font-bold text-white mb-2 text-center`}>
            Unlock Your Full Potential
          </Text>
          <Text style={tw`text-gray-300 text-center mb-4 leading-5`}>
            Join thousands who've transformed their lives with premium insights, unlimited conversations, and advanced AI guidance.
          </Text>
          <View style={tw`bg-jung-gold rounded-lg px-6 py-3`}>
            <Text style={tw`text-gray-900 font-bold text-center`}>
              Start Free Trial
            </Text>
          </View>
          <Text style={tw`text-gray-400 text-xs mt-2 text-center`}>
            Cancel anytime • No commitment
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Inline premium features showcase
export const PremiumFeatureCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
  style?: any;
}> = ({ title, description, icon, onPress, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[tw`bg-jung-purple/5 border border-jung-purple/20 rounded-xl p-4 mb-3`, style]}>
      <View style={tw`flex-row items-center`}>
        <View style={tw`bg-jung-purple/20 rounded-full p-3 mr-4`}>
          <Text style={tw`text-lg`}>{icon}</Text>
        </View>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-1`}>
            <Text style={tw`font-bold text-jung-deep mr-2`}>{title}</Text>
            <Text style={tw`bg-jung-gold text-gray-900 text-xs px-2 py-1 rounded-full font-bold`}>PRO</Text>
          </View>
          <Text style={tw`text-gray-600 text-sm`}>{description}</Text>
        </View>
        <SafePhosphorIcon iconType="ArrowRight" size={16} color="#4A3B78" weight="bold" />
      </View>
    </TouchableOpacity>
  );
};