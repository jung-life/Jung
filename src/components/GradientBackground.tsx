import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

interface GradientBackgroundProps {
  children: ReactNode;
  variant?: 'default' | 'conversation' | 'motivation' | 'emotional';
}

export const GradientBackground = ({ 
  children, 
  variant = 'default' 
}: GradientBackgroundProps) => {
  // Get gradient colors based on variant
  const getGradientColors = (): readonly [string, string, string] => {
    switch(variant) {
      case 'conversation':
        return ['#6A8EAE', '#A8DADC', '#F0F7FF'] as const; // Conversation blues
      case 'motivation':
        return ['#97C1A9', '#A7C4A0', '#F0F7FF'] as const; // Motivation greens
      case 'emotional':
        return ['#CEB5CD', '#CFC7DC', '#F0F7FF'] as const; // Emotional purples
      default:
        return ['#A8DADC', '#CFC7DC', '#F0F7FF'] as const; // Default soothing blend
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={tw`flex-1`}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};
