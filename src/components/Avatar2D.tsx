import React, { useRef, useEffect } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

// Define avatar images with the correct path
const AVATAR_IMAGES = {
  jung: require('../assets/avtars/jung.png'),
  freud: require('../assets/avtars/frued.png'), // Fixed typo in filename to match actual file
  adler: require('../assets/avtars/adler.webp'),
  horney: require('../assets/avtars/horney.jpeg'),
  morpheus: require('../assets/avtars/morpheus.jpg'),
  oracle: require('../assets/avtars/oracle.webp'),
  user: require('../assets/avtars/user.webp'),
  // Use jung as default if others aren't available
  default: require('../assets/avtars/jung.png'),
} as const;

// Define the type for avatar IDs
type AvatarId = keyof typeof AVATAR_IMAGES;

// Define the props interface with proper typing
interface Avatar2DProps {
  avatarId?: AvatarId;
  size?: number;
  animate?: boolean;
  style?: any;
}

// Main Avatar2D component
export const Avatar2D = ({ 
  avatarId = 'jung', 
  size = 150, 
  animate = true,
  style = {}
}: Avatar2DProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (animate) {
      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Subtle breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [animate, rotateAnim, scaleAnim]);
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Get the avatar image with fallback handling
  const getAvatarImage = () => {
    try {
      return AVATAR_IMAGES[avatarId] || AVATAR_IMAGES.default;
    } catch (error) {
      console.error(`Error loading avatar image for ${avatarId}:`, error);
      return AVATAR_IMAGES.default;
    }
  };
  
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2 },
      tw`overflow-hidden bg-gray-100`,
      style
    ]}>
      <LinearGradient
        colors={['#f0f4ff', '#e2e8f0']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={{
        width: '100%',
        height: '100%',
        transform: [
          { rotate: animate ? spin : '0deg' },
          { scale: animate ? scaleAnim : 1 }
        ],
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Image
          source={getAvatarImage()}
          style={{
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2
          }}
          resizeMode="cover"
        />
      </Animated.View>
      
      {/* Add subtle inner shadow */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }
      ]} />
    </View>
  );
};

// Modified preload function with error handling
export const preloadAvatarImages = () => {
  console.log('Preloading avatar images...');
  Object.entries(AVATAR_IMAGES).forEach(([key, image]) => {
    try {
      if (Image.prefetch && typeof image === 'string') {
        Image.prefetch(image);
      }
    } catch (error) {
      console.error(`Error preloading avatar image ${key}:`, error);
    }
  });
};
