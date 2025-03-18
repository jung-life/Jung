import React, { useEffect, useState, memo } from 'react';
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
import { supabase, getAvatarUrl } from '../lib/supabase';

interface TherapistAvatarProps {
  isSpeaking: boolean;
  message: string;
  onBackPress?: () => void;
  avatarId?: string;
}

const TherapistAvatar = memo(({ isSpeaking, message, avatarId = 'jung' }: TherapistAvatarProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.8);
  const [imageError, setImageError] = useState(false);
  const [avatarDetails, setAvatarDetails] = useState<{name: string, imageUrl: string} | null>(null);
  
  // Use the avatar image from fetched details or a default placeholder
  const avatarSource = imageError ? null : 
    (avatarDetails ? { uri: avatarDetails.imageUrl } : null);
  
  useEffect(() => {
    if (isSpeaking) {
      // Subtle breathing effect - represents the living psyche
      scale.value = withRepeat(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      
      // Very subtle rotation - represents balance of opposites
      rotation.value = withRepeat(
        withSequence(
          withTiming(-0.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.02, { duration: 3000, easing: Easing.inOut(Easing.ease) })
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
  
  useEffect(() => {
    const fetchAvatarDetails = async () => {
      try {
        console.log('Fetching avatar details for:', avatarId);
        const { data, error } = await supabase
          .from('avatars')
          .select('name, image_url')
          .eq('avatar_id', avatarId)
          .single();
          
        if (error) {
          console.error('Supabase error fetching avatar:', error);
          throw error;
        }
        
        if (data) {
          const imageUrl = getAvatarUrl(data.image_url);
          console.log('Avatar image URL:', imageUrl);
          setAvatarDetails({
            name: data.name,
            imageUrl: imageUrl
          });
        } else {
          // If no data found, use a default
          console.log('No avatar data found, using default');
          setAvatarDetails({
            name: 'Therapist',
            imageUrl: getAvatarUrl('jung.webp') // Default avatar
          });
        }
      } catch (err) {
        console.error('Error fetching avatar details:', err);
        setImageError(true);
      }
    };
    
    fetchAvatarDetails();
  }, [avatarId]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}rad` }
    ],
    opacity: opacity.value
  }));
  
  return (
    <View style={tw`items-center`}>
      <Animated.View style={[tw`w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg`, animatedStyle]}>
        {imageError || !avatarSource ? (
          <View style={tw`w-full h-full items-center justify-center bg-gray-100`}>
            <AntDesign name="user" size={60} color="#4A3B78" />
          </View>
        ) : (
          <Image 
            source={avatarSource}
            style={tw`w-full h-full`}
            onError={() => {
              console.error('Image failed to load');
              setImageError(true);
            }}
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
});

export default TherapistAvatar; 