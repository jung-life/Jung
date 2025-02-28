import React, { ReactNode } from 'react';
import { Text } from 'react-native';
import tw from '../lib/tailwind';

interface TypographyProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  style?: object;
}

export const Typography = ({ 
  children, 
  variant = 'body',
  style = {} 
}: TypographyProps) => {
  
  const styles = {
    title: tw`text-2xl tracking-wide text-jung-deep font-bold`,
    subtitle: tw`text-lg tracking-wide text-jung-animus font-medium`,
    body: tw`text-base leading-6 text-jung-text`,
    caption: tw`text-sm italic text-jung-stone`,
  };
  
  return (
    <Text style={[styles[variant], style]}>
      {children}
    </Text>
  );
}; 