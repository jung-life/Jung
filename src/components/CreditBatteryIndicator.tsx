import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Coins, Lightning, Warning } from 'phosphor-react-native';
import tw from '../lib/tailwind';

interface CreditBatteryIndicatorProps {
  currentCredits: number;
  maxCredits?: number;
  variant?: 'horizontal' | 'vertical' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showWarnings?: boolean;
  onPress?: () => void;
}

export const CreditBatteryIndicator: React.FC<CreditBatteryIndicatorProps> = ({
  currentCredits,
  maxCredits = 100,
  variant = 'horizontal',
  size = 'md',
  showPercentage = true,
  showWarnings = true,
  onPress,
}) => {
  const percentage = Math.min((currentCredits / maxCredits) * 100, 100);
  const isLow = percentage <= 20;
  const isCritical = percentage <= 10;
  const isEmpty = currentCredits === 0;

  const getColorClass = () => {
    if (isEmpty) return 'text-red-500';
    if (isCritical) return 'text-red-500';
    if (isLow) return 'text-amber-500';
    if (percentage <= 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getBgColorClass = () => {
    if (isEmpty) return 'bg-red-500';
    if (isCritical) return 'bg-red-500';
    if (isLow) return 'bg-amber-500';
    if (percentage <= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-2 w-12',
          text: 'text-xs',
          icon: 16,
        };
      case 'lg':
        return {
          container: 'h-4 w-20',
          text: 'text-base',
          icon: 24,
        };
      default:
        return {
          container: 'h-3 w-16',
          text: 'text-sm',
          icon: 20,
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'circular') {
    // Simple circular progress using stacked views
    return (
      <TouchableOpacity
        style={tw`flex items-center justify-center`}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={tw`relative w-16 h-16`}>
          {/* Background circle */}
          <View style={tw`w-16 h-16 rounded-full bg-gray-200 items-center justify-center`}>
            <View style={tw`w-12 h-12 rounded-full bg-white items-center justify-center`}>
              <Text style={tw`${sizeClasses.text} font-bold ${getColorClass()}`}>
                {showPercentage ? `${Math.round(percentage)}%` : currentCredits}
              </Text>
            </View>
          </View>
          
          {/* Progress indicator - simplified as colored border */}
          {percentage > 0 && (
            <View 
              style={[
                tw`absolute inset-0 rounded-full`,
                {
                  borderWidth: 2,
                  borderColor: isEmpty ? '#EF4444' : isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
                  borderTopColor: 'transparent',
                  borderRightColor: percentage > 25 ? undefined : 'transparent',
                  borderBottomColor: percentage > 50 ? undefined : 'transparent',
                  borderLeftColor: percentage > 75 ? undefined : 'transparent',
                }
              ]}
            />
          )}
        </View>

        {showWarnings && (isLow || isEmpty) && (
          <View style={tw`mt-1 flex-row items-center`}>
            <Warning size={12} color={isEmpty ? '#EF4444' : '#F59E0B'} />
            <Text style={tw`ml-1 text-xs font-medium ${getColorClass()}`}>
              {isEmpty ? 'Empty' : 'Low'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'vertical') {
    return (
      <TouchableOpacity
        style={tw`flex items-center`}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={tw`w-6 h-16 bg-gray-200 rounded-full relative overflow-hidden`}>
          <View
            style={[
              tw`absolute bottom-0 left-0 right-0 rounded-full ${getBgColorClass()}`,
              { height: `${percentage}%` }
            ]}
          />
          
          {/* Battery tip */}
          <View style={[tw`absolute -top-1 left-1/2 w-2 h-1 bg-gray-400 rounded-t`, { marginLeft: -4 }]} />
        </View>

        {showPercentage && (
          <Text style={tw`mt-2 ${sizeClasses.text} font-semibold text-gray-700`}>
            {currentCredits}
          </Text>
        )}

        {showWarnings && (isLow || isEmpty) && (
          <View style={tw`mt-1 flex items-center`}>
            <Warning size={14} color={isEmpty ? '#EF4444' : '#F59E0B'} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Horizontal variant (default)
  return (
    <TouchableOpacity
      style={tw`flex-row items-center bg-white rounded-lg p-3 border border-gray-200`}
      onPress={onPress}
      disabled={!onPress}
    >
      <Coins size={sizeClasses.icon} color={isEmpty ? '#EF4444' : isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#4A3B78'} weight="fill" />
      
      <View style={tw`ml-3 flex-1`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`${sizeClasses.text} font-semibold text-gray-800`}>
            {currentCredits} credits
          </Text>
          {showPercentage && (
            <Text style={tw`text-xs text-gray-500`}>
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
        
        {/* Progress bar */}
        <View style={tw`${sizeClasses.container} bg-gray-200 rounded-full overflow-hidden`}>
          <View
            style={[
              tw`h-full rounded-full ${getBgColorClass()}`,
              { width: `${percentage}%` }
            ]}
          />
        </View>

        {showWarnings && (isLow || isEmpty) && (
          <View style={tw`flex-row items-center mt-2`}>
            <Warning size={12} color={isEmpty ? '#EF4444' : '#F59E0B'} />
            <Text style={tw`ml-1 text-xs font-medium ${getColorClass()}`}>
              {isEmpty ? 'Out of credits! Tap to purchase more.' : 'Running low on credits'}
            </Text>
          </View>
        )}
      </View>

      {(isLow || isEmpty) && (
        <View style={tw`ml-2`}>
          <Lightning size={16} color="#4A3B78" weight="fill" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CreditBatteryIndicator;
