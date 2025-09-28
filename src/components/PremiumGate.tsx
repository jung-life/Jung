import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../hooks/useSubscription';
import tw from '../lib/tailwind';

interface PremiumGateProps {
  feature: string;
  description: string;
  icon?: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
  style?: any;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  description,
  icon = "👑",
  children,
  onUpgrade,
  style
}) => {
  const navigation = useNavigation();
  const { isPremiumUser } = useSubscription();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Subscription' as never);
    }
  };

  // Show content for premium users
  if (isPremiumUser) {
    return <>{children}</>;
  }

  // Show premium gate for free users
  return (
    <View style={[tw`mx-4 mb-4`, style]}>
      <TouchableOpacity onPress={handleUpgrade}>
        <LinearGradient
          colors={['#F8F9FA', '#E9ECEF']}
          style={tw`rounded-2xl p-6 border border-gray-200 items-center`}
        >
          <Text style={tw`text-4xl mb-3`}>{icon}</Text>
          <Text style={tw`text-xl font-bold text-gray-800 mb-2 text-center`}>
            {feature}
          </Text>
          <Text style={tw`text-gray-600 text-center mb-4 leading-5`}>
            {description}
          </Text>

          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={tw`rounded-full px-6 py-3`}
          >
            <View style={tw`flex-row items-center`}>
              <SafePhosphorIcon iconType="Plus" size={16} color="#FFFFFF" weight="bold" />
              <Text style={tw`text-white font-bold ml-2`}>Upgrade to Premium</Text>
            </View>
          </LinearGradient>

          <Text style={tw`text-gray-500 text-xs mt-2 text-center`}>
            Unlock this feature and many more
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Specialized premium gates for different contexts
export const AdvancedAnalyticsGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PremiumGate
    feature="Advanced Analytics"
    description="Get deeper insights into your psychological patterns, emotional trends, and breakthrough moments with AI-powered analysis."
    icon="📊"
  >
    {children}
  </PremiumGate>
);

export const ExportFeaturesGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PremiumGate
    feature="Export & Share"
    description="Export your conversations, insights, and progress reports as PDF files to share with therapists or for personal records."
    icon="📄"
  >
    {children}
  </PremiumGate>
);

export const UnlimitedConversationsGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PremiumGate
    feature="Unlimited Conversations"
    description="Continue your therapeutic journey without limits. Engage with all avatars and explore your psyche as deeply as you need."
    icon="💬"
  >
    {children}
  </PremiumGate>
);

export const PriorityFeaturesGate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PremiumGate
    feature="Priority Features"
    description="Access cutting-edge therapeutic tools, priority support, and early access to new psychological assessment features."
    icon="⭐"
  >
    {children}
  </PremiumGate>
);