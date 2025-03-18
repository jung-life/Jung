import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import tw from '../lib/tailwind';

interface TouchableJungProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}

const TouchableJung: React.FC<TouchableJungProps> = ({ 
  onPress, 
  children, 
  style,
  disabled
}) => {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.97, { 
      duration: 200, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
  };
  
  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1
  }));
  
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel="Start new conversation"
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default TouchableJung; 