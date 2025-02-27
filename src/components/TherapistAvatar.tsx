import React, { useEffect, useState } from 'react';
import { View, Image, Text, ImageSourcePropType } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import HomeButton from './HomeButton';

interface TherapistAvatarProps {
  isSpeaking: boolean;
  message: string;
  onBackPress?: () => void;
}

export const TherapistAvatar = ({ isSpeaking, message }: TherapistAvatarProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.8);
  const [imageError, setImageError] = useState(false);
  
  // Define avatar image source
  const avatarSource: ImageSourcePropType = imageError 
    ? { uri: 'https://via.placeholder.com/120' }
    : require('../../assets/therapist-avatar.webp');
  
  useEffect(() => {
    if (isSpeaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      rotation.value = withRepeat(
        withSequence(
          withTiming(-0.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.05, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(1, { duration: 500 });
      rotation.value = withTiming(0, { duration: 500 });
      opacity.value = withTiming(0.8, { duration: 300 });
    }
  }, [isSpeaking]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}rad` }
    ],
    opacity: opacity.value
  }));
  
  return (
    <View style={tw`items-center justify-center h-45`}>
      <Animated.View style={[tw`w-30 h-30 rounded-full overflow-hidden bg-gray-100 justify-center items-center shadow-md`, animatedStyle]}>
        {imageError ? (
          <View style={tw`w-full h-full justify-center items-center bg-gray-200`}>
            <AntDesign name="user" size={60} color="#4A3B78" />
          </View>
        ) : (
          <Image 
            source={avatarSource}
            style={tw`w-full h-full`}
            onError={() => setImageError(true)}
          />
        )}
        {isSpeaking && (
          <View style={tw`absolute bottom-2.5 flex-row justify-center items-center bg-black bg-opacity-50 px-2 py-1 rounded-lg`}>
            <View style={[tw`w-1.5 h-1.5 rounded-full bg-white mx-0.5`, { opacity: 0.4 }]} />
            <View style={[tw`w-1.5 h-1.5 rounded-full bg-white mx-0.5`, { opacity: 0.7 }]} />
            <View style={[tw`w-1.5 h-1.5 rounded-full bg-white mx-0.5`, { opacity: 1 }]} />
          </View>
        )}
      </Animated.View>
      
      {isSpeaking && (
        <Text style={tw`mt-2.5 text-sm text-jung-purple font-medium`}>Thinking...</Text>
      )}
    </View>
  );
}; 