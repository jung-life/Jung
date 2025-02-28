import React, { ReactNode } from 'react';
import { View } from 'react-native';
import tw from '../lib/tailwind';

interface SensualContainerProps {
  children: ReactNode;
  style?: object;
}

export const SensualContainer = ({ children, style = {} }: SensualContainerProps) => {
  return (
    <View 
      style={[
        tw`rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100`,
        { borderTopLeftRadius: 40, borderBottomRightRadius: 40 },
        style
      ]}
    >
      {children}
    </View>
  );
}; 