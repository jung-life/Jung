import React from 'react';
import { View, Text } from 'react-native';

interface PhosphorIconProps {
  icon: React.ReactNode;
  color?: string;
  style?: any;
}

/**
 * A specialized wrapper for Phosphor icons to prevent "Text strings must be rendered within a Text component" errors
 * This component ensures that any text content from icons is properly contained
 */
export const PhosphorIcon: React.FC<PhosphorIconProps> = ({ icon, color, style }) => {
  return (
    <View style={[{ color }, style]}>
      {icon}
    </View>
  );
};
