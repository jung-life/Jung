import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

interface GradientBackgroundProps {
  children: ReactNode;
  variant?: 'default' | 'conversation' | 'motivation' | 'emotional';
  animate?: boolean;
}

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const GradientBackground = ({ 
  children, 
  variant = 'default',
  animate = false
}: GradientBackgroundProps) => {
  const getGradientColors = (): readonly [string, string, string] => {
    switch(variant) {
      case 'conversation':
        return ['#6A8EAE', '#A8DADC', '#F0F7FF'] as const;
      case 'motivation':
        return ['#97C1A9', '#A7C4A0', '#F0F7FF'] as const;
      case 'emotional':
        return ['#CEB5CD', '#CFC7DC', '#F0F7FF'] as const;
      default:
        return ['#A8DADC', '#CFC7DC', '#F0F7FF'] as const;
    }
  };

  // Animated gradient logic
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [animate, animatedValue]);

  // Interpolate colors for animation
  const colors = getGradientColors();
  const animatedColors = animate
    ? [
        animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [colors[0], colors[1]],
        }),
        animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [colors[1], colors[2]],
        }),
        animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [colors[2], colors[0]],
        }),
      ]
    : colors;

  return (
    <LinearGradient
      colors={animate ? colors : colors}
      style={tw`flex-1`}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};
