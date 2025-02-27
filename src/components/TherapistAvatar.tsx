import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, ImageSourcePropType, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withRepeat, 
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';

interface TherapistAvatarProps {
  isSpeaking: boolean;
  message: string;
  onBackPress?: () => void;
}

export const TherapistAvatar = ({ isSpeaking, message, onBackPress }: TherapistAvatarProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.8);
  const [imageError, setImageError] = useState(false);
  
  // Define avatar image source
  const avatarSource: ImageSourcePropType = imageError 
    ? { uri: 'https://via.placeholder.com/120' } // Fallback to online placeholder
    : require('../../assets/therapist-avatar.webp'); // Use local WebP image
  
  useEffect(() => {
    if (isSpeaking) {
      // Subtle pulsing effect when speaking
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
      
      // Subtle swaying effect
      rotation.value = withRepeat(
        withSequence(
          withTiming(-0.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.05, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      // Increase opacity when speaking
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // Reset animations when not speaking
      scale.value = withTiming(1, { duration: 500 });
      rotation.value = withTiming(0, { duration: 500 });
      opacity.value = withTiming(0.8, { duration: 300 });
    }
  }, [isSpeaking]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}rad` }
      ],
      opacity: opacity.value
    };
  });
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.avatarContainer, animatedStyle]}>
        {imageError ? (
          <View style={styles.fallbackAvatar}>
            <AntDesign name="user" size={60} color="#4A3B78" />
          </View>
        ) : (
          <Image 
            source={avatarSource}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        )}
        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        )}
      </Animated.View>
      {isSpeaking && (
        <Text style={styles.speakingText}>Thinking...</Text>
      )}
      {onBackPress && (
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={onBackPress}
        >
          <AntDesign name="home" size={28} color="#4A3B78" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  speakingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4A3B78',
    fontWeight: '500',
  },
  homeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 