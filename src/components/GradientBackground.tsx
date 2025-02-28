import React, { ReactNode } from 'react';
import { View } from 'react-native';
import tw from '../lib/tailwind';

interface GradientBackgroundProps {
  children: ReactNode;
}

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
  // Simple fallback using a solid color instead of a gradient
  return (
    <View style={tw`flex-1 bg-jung-bg`}>
      {children}
    </View>
  );
}; 