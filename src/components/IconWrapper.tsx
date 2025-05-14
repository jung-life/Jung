import React from 'react';
import { View, Text } from 'react-native';

interface IconWrapperProps {
  children: React.ReactNode;
  style?: any;
}

/**
 * A wrapper component for icons to prevent "Text strings must be rendered within a Text component" errors
 * This component ensures that any text content from icons is properly contained
 */
export const IconWrapper: React.FC<IconWrapperProps> = ({ children, style }) => {
  // If the children are a string, wrap them in a Text component
  if (typeof children === 'string') {
    return (
      <View style={style}>
        <Text>{children}</Text>
      </View>
    );
  }
  
  // Otherwise, just render the children in a View
  return (
    <View style={style}>
      {children}
    </View>
  );
};
