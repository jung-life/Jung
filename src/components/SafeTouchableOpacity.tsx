import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Text, View } from 'react-native';

interface SafeTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

/**
 * A safe wrapper for TouchableOpacity that prevents "Text strings must be rendered within a Text component" errors
 * by ensuring all content is properly wrapped
 */
export const SafeTouchableOpacity: React.FC<SafeTouchableOpacityProps> = ({ 
  children, 
  style,
  ...props 
}) => {
  // Ensure we're wrapping the children in a Text component if they're not already
  const wrappedChildren = React.Children.map(children, child => {
    // If the child is already a React element, return it as is
    if (React.isValidElement(child)) {
      return child;
    }
    
    // Otherwise, wrap it in a Text component
    return <Text>{child}</Text>;
  });

  return (
    <TouchableOpacity style={style} {...props}>
      <View>
        {wrappedChildren}
      </View>
    </TouchableOpacity>
  );
};
