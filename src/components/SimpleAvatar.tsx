import React, { useState, useEffect } from 'react';
import { View, Image as RNImage, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { getAvatarUrl, supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'phosphor-react-native';
import tw from '../lib/tailwind';

// Conditionally import expo-image
let ExpoImage;
try {
  ExpoImage = require('expo-image').Image;
} catch (e) {
  console.log('expo-image not available, using React Native Image');
  ExpoImage = null;
}

// Use the appropriate Image component based on platform and availability
// const Image = (Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 14 && ExpoImage) 
//   ? ExpoImage 
//   : RNImage;
const Image = RNImage; // Force RNImage for diagnostics

// Define available avatars with their details - metadata only
export const availableAvatars = [
  { id: 'jung', name: 'Jung', filename: 'jung.png', premium: false },
  { id: 'freud', name: 'Freud', filename: 'frued.png', premium: false }, // Note: Filename has a typo "frued" to match actual file
  { id: 'adler', name: 'Adler', filename: 'alfredadler.png', premium: false },
  { id: 'rogers', name: 'Carl Rogers', filename: 'carl_rogers.png', premium: false },
  { id: 'depthdelver', name: 'Depth Delver', filename: 'depth_delver.png', premium: false },
  { id: 'morpheus', name: 'Morpheus', filename: 'awakener.png', premium: true },
  { id: 'oracle', name: 'Oracle', filename: 'sage.png', premium: true },
];

interface SimpleAvatarProps {
  avatarId: string;
  size?: number;
  style?: any;
  isUser?: boolean;
}

export const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ 
  avatarId, 
  size = 50, 
  style,
  isUser = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  useEffect(() => {
    if (isUser) {
      fetchUserAvatar();
    }
  }, [isUser]);
  
  const fetchUserAvatar = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.log('Supabase not available, using default avatar');
        setUserAvatarUrl('https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars//user.png');
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found, using default avatar');
        // Use the default user avatar
        setUserAvatarUrl('https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars//user.png');
        setLoading(false);
        return;
      }
      
      try {
        // Try to get the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        // If there's an error or no avatar_url, use default avatar
        if (error || !data || !data.avatar_url) {
          console.log('No custom avatar found, using default avatar');
          setUserAvatarUrl('https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars//user.png');
          setLoading(false);
          return;
        }
        
        // If we have an avatar_url, get the public URL
        if (data.avatar_url) {
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          
          setUserAvatarUrl(publicUrlData.publicUrl);
        }
      } catch (error) {
        console.log('Error fetching user avatar, using default:', error);
        // Use the default user avatar on error
        setUserAvatarUrl('https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars//user.png');
      }
    } catch (error) {
      console.log('Error in fetchUserAvatar, using default:', error);
      // Use the default user avatar on error
      setUserAvatarUrl('https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars//user.png');
    } finally {
      setLoading(false);
    }
  };
  
  // For user avatar, show a user icon with a darker color
  if (isUser) {
    return (
      <View 
        style={[
          tw`bg-indigo-700 rounded-full justify-center items-center`,
          { width: size, height: size },
          style
        ]}
      >
        <User size={size * 0.6} color="#F3F4F6" weight="fill" />
      </View>
    );
  }
  
  // For AI avatars, find the avatar metadata
  const avatar = availableAvatars.find(a => a.id === avatarId) || availableAvatars[0];
  const avatarUrl = getAvatarUrl(avatar.filename);
  
  return (
    <View 
      style={[
        styles.container, 
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color="#8A2BE2" 
          style={styles.loader} 
        />
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="person" size={size * 0.6} color="#8A2BE2" />
        </View>
      ) : (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.image}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
            console.error(`Failed to load image for ${avatar.id}: ${avatarUrl}`);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loader: {
    position: 'absolute',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
