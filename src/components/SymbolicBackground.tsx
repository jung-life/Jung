import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import tw from '../lib/tailwind';

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface SymbolicBackgroundProps {
  opacity?: number;
  variant?: 'default' | 'conversation' | 'motivation' | 'emotional';
  animate?: boolean;
}

export const SymbolicBackground = ({ 
  opacity = 0.05, 
  variant = 'default',
  animate = false
}: SymbolicBackgroundProps) => {
  // Get colors based on variant
  const getColors = () => {
    switch(variant) {
      case 'conversation':
        return { primary: '#6A8EAE', secondary: '#A8DADC' };
      case 'motivation':
        return { primary: '#97C1A9', secondary: '#A7C4A0' };
      case 'emotional':
        return { primary: '#CEB5CD', secondary: '#CFC7DC' };
      default:
        return { primary: '#A8DADC', secondary: '#CFC7DC' };
    }
  };

  const colors = getColors();

  // Animation for breathing oval
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

  // Animate oval rx/ry for breathing effect
  const animatedRx = animate
    ? animatedValue.interpolate({ inputRange: [0, 1], outputRange: [80, 120] })
    : 80;
  const animatedRy = animate
    ? animatedValue.interpolate({ inputRange: [0, 1], outputRange: [40, 60] })
    : 40;

  return (
    <View style={[tw`absolute inset-0 overflow-hidden`, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.5" />
            <Stop offset="1" stopColor={colors.secondary} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {/* Gentle flowing curves - soothing visuals */}
        <Path 
          d="M0,200 C100,180 150,250 250,230 S350,180 400,200" 
          stroke={colors.primary} 
          strokeWidth="1" 
          fill="none" 
          opacity="0.3"
        />
        
        <Path 
          d="M0,300 C80,320 120,280 200,300 S320,340 400,320" 
          stroke={colors.secondary} 
          strokeWidth="1" 
          fill="none" 
          opacity="0.3"
        />

        {/* Gentle circles representing calm, balance */}
        <G opacity="0.2" transform="translate(200, 400)">
          <Circle cx="0" cy="0" r="150" stroke={colors.primary} strokeWidth="0.8" fill="none" />
          <Circle cx="0" cy="0" r="120" stroke={colors.secondary} strokeWidth="0.8" fill="none" />
          <Circle cx="0" cy="0" r="90" stroke={colors.primary} strokeWidth="0.8" fill="none" />
          <Circle cx="0" cy="0" r="60" stroke={colors.secondary} strokeWidth="0.8" fill="none" />
          <Circle cx="0" cy="0" r="30" stroke={colors.primary} strokeWidth="0.8" fill="none" />
        </G>
        
        {/* Soft breathing animation simulation - expanding/contracting oval */}
        <Ellipse 
          cx="200" 
          cy="600" 
          rx={typeof animatedRx === 'number' ? animatedRx : 80}
          ry={typeof animatedRy === 'number' ? animatedRy : 40}
          stroke={colors.secondary} 
          strokeWidth="1" 
          fill="url(#grad)" 
          opacity="0.15"
        />
      </Svg>
    </View>
  );
};
