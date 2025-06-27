import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCredits } from '../hooks/useCredits';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { Coins, Plus, TrendUp } from 'phosphor-react-native';

interface CreditDisplayProps {
  variant?: 'compact' | 'detailed' | 'header';
  onPress?: () => void;
  showUpgradeButton?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  variant = 'compact', 
  onPress,
  showUpgradeButton = true 
}) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { creditBalance, loading, currentTier } = useCredits();

  if (loading) {
    return (
      <View style={tw`flex-row items-center`}>
        <ActivityIndicator size="small" color="#4A3B78" />
        <Text style={tw`ml-2 text-sm text-gray-600`}>Loading...</Text>
      </View>
    );
  }

  const credits = creditBalance?.currentBalance || 0;
  const tierName = currentTier?.name || creditBalance?.subscriptionTierId || 'Free';
  const isLowCredits = credits < 5;
  const isOutOfCredits = credits === 0;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Subscription');
    }
  };

  if (variant === 'header') {
    return (
      <TouchableOpacity 
        style={tw`flex-row items-center bg-white rounded-full px-3 py-2 shadow-sm border border-gray-200`}
        onPress={handlePress}
      >
        <Coins 
          size={18} 
          color={isOutOfCredits ? "#EF4444" : isLowCredits ? "#F59E0B" : "#4A3B78"} 
          weight="fill" 
        />
        <Text style={tw`ml-2 font-semibold text-sm ${isOutOfCredits ? 'text-red-500' : isLowCredits ? 'text-amber-500' : 'text-jung-purple'}`}>
          {credits}
        </Text>
        {showUpgradeButton && isLowCredits && (
          <Plus size={14} color="#4A3B78" weight="bold" style={tw`ml-1`} />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        style={tw`flex-row items-center bg-gray-50 rounded-lg px-3 py-2`}
        onPress={handlePress}
      >
        <Coins 
          size={20} 
          color={isOutOfCredits ? "#EF4444" : isLowCredits ? "#F59E0B" : "#4A3B78"} 
          weight="fill" 
        />
        <View style={tw`ml-2`}>
          <Text style={tw`font-semibold text-sm ${isOutOfCredits ? 'text-red-600' : isLowCredits ? 'text-amber-600' : 'text-jung-purple'}`}>
            {credits} credits
          </Text>
          <Text style={tw`text-xs text-gray-500`}>
            {tierName} plan
          </Text>
        </View>
        {showUpgradeButton && isLowCredits && (
          <Plus size={16} color="#4A3B78" weight="bold" style={tw`ml-2`} />
        )}
      </TouchableOpacity>
    );
  }

  // Detailed variant
  return (
    <TouchableOpacity 
      style={tw`bg-white rounded-xl p-4 shadow-sm border border-gray-200`}
      onPress={handlePress}
    >
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <View style={tw`flex-row items-center`}>
          <Coins size={24} color="#4A3B78" weight="fill" />
          <Text style={tw`ml-2 text-lg font-bold text-jung-purple`}>
            {credits} Credits
          </Text>
        </View>
        {showUpgradeButton && (
          <TouchableOpacity 
            style={tw`bg-jung-purple rounded-full p-2`}
            onPress={handlePress}
          >
            <Plus size={16} color="white" weight="bold" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={tw`flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-sm font-medium text-gray-700`}>
            {tierName} Plan
          </Text>
          <Text style={tw`text-xs text-gray-500`}>
            {currentTier?.monthlyCredits ? `${currentTier.monthlyCredits} credits/month` : 'Limited credits'}
          </Text>
        </View>
        
        {showUpgradeButton && (
          <TouchableOpacity 
            style={tw`flex-row items-center bg-jung-purple/10 rounded-lg px-3 py-2`}
            onPress={handlePress}
          >
            <TrendUp size={14} color="#4A3B78" weight="bold" />
            <Text style={tw`ml-1 text-xs font-medium text-jung-purple`}>
              Upgrade
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isLowCredits && (
        <View style={[
          tw`mt-3 p-3 rounded-lg border`,
          isOutOfCredits ? tw`bg-red-50 border-red-200` : tw`bg-amber-50 border-amber-200`
        ]}>
          <Text style={[
            tw`text-sm font-medium`,
            isOutOfCredits ? tw`text-red-800` : tw`text-amber-800`
          ]}>
            {isOutOfCredits 
              ? '⚠️ Out of credits!' 
              : '⚠️ Low credits'
            }
          </Text>
          <Text style={[
            tw`text-xs mt-1`,
            isOutOfCredits ? tw`text-red-600` : tw`text-amber-600`
          ]}>
            {isOutOfCredits 
              ? 'Purchase credits to continue conversations' 
              : 'Consider upgrading your plan or buying more credits'
            }
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CreditDisplay;
