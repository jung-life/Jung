import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedTitleProps {
  text: string;
  style?: any;
  colors?: string[];
  delay?: number;
  duration?: number;
  onComplete?: () => void;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  text,
  style,
  colors = ['#1A1A1A', '#0047AB', '#8B0000', '#1A1A1A'],
  delay = 300,
  duration = 500,
  onComplete
}) => {
  const characters = text.split('');
  const [animatedValues] = useState(
    characters.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    const animations = characters.map((_, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: duration,
        delay: delay * index,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      });
    });

    Animated.stagger(delay, animations).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  // Create a combined animated component for the gradient effect
  const AnimatedGradientText = () => (
    <MaskedView
      maskElement={
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {characters.map((char, index) => (
            <Animated.Text
              key={index}
              style={[
                style,
                {
                  opacity: animatedValues[index],
                  transform: [
                    {
                      translateY: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    },
                    {
                      scale: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ]
                }
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 120, width: '100%' }}
      />
    </MaskedView>
  );

  // If we can't use MaskedView, fall back to individual colored letters
  const AnimatedColoredLetters = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {characters.map((char, index) => (
        <Animated.Text
          key={index}
          style={[
            style,
            {
              color: colors[index % colors.length],
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                },
                {
                  scale: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1]
                  })
                }
              ]
            }
          ]}
        >
          {char}
        </Animated.Text>
      ))}
    </View>
  );

  try {
    // Try to use the gradient version first
    return <AnimatedGradientText />;
  } catch (error) {
    // Fall back to individual colored letters if gradient fails
    console.warn('Falling back to colored letters due to:', error);
    return <AnimatedColoredLetters />;
  }
}; 