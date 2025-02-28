import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Typography } from './Typography';
import tw from '../lib/tailwind';
import { supabase, getAvatarUrl } from '../lib/supabase';

// Define avatar types
export type Avatar = {
  id: string;
  avatar_id: string;
  name: string;
  image_url: string;
  description: string;
  is_premium: boolean;
  order: number;
};

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
  hasPremiumAccess?: boolean;
}

export const AvatarSelector = ({ 
  selectedAvatar, 
  onSelectAvatar,
  hasPremiumAccess = false
}: AvatarSelectorProps) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setLoading(true);
        
        // Fetch avatars from Supabase
        const { data, error } = await supabase
          .from('avatars')
          .select('*')
          .order('order', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setAvatars(data);
        }
      } catch (err) {
        console.error('Error fetching avatars:', err);
        setError('Failed to load avatars');
        
        // Fallback to default avatars if fetch fails
        setAvatars([
          {
            id: '1',
            avatar_id: 'jung',
            name: 'Carl Jung',
            image_url: 'jung.webp',
            description: 'Explore the collective unconscious and archetypes',
            is_premium: false,
            order: 1
          },
          {
            id: '2',
            avatar_id: 'freud',
            name: 'Sigmund Freud',
            image_url: 'freud.webp',
            description: 'Analyze dreams and unconscious desires',
            is_premium: false,
            order: 2
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvatars();
  }, []);

  if (loading) {
    return (
      <View style={tw`mb-4 items-center justify-center h-24`}>
        <ActivityIndicator size="large" color="#4A3B78" />
        <Text style={tw`mt-2 text-sm text-gray-600`}>Loading avatars...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`mb-4 items-center justify-center h-24`}>
        <AntDesign name="warning" size={24} color="#f59e0b" />
        <Text style={tw`mt-2 text-sm text-gray-600`}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={tw`mb-4`}>
      <Typography variant="subtitle" style={tw`mb-2 ml-1`}>Choose Your Guide</Typography>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`pb-2`}
      >
        {avatars.map(avatar => {
          const isSelected = avatar.avatar_id === selectedAvatar;
          const isLocked = avatar.is_premium && !hasPremiumAccess;
          
          return (
            <TouchableOpacity
              key={avatar.id}
              style={[
                tw`mr-4 items-center`,
                styles.avatarContainer,
                isSelected && styles.selectedAvatarContainer
              ]}
              onPress={() => {
                if (!isLocked) {
                  onSelectAvatar(avatar.avatar_id);
                } else {
                  // Show premium upgrade prompt
                  Alert.alert(
                    "Premium Avatar",
                    `${avatar.name} is a premium avatar. Upgrade to access all guides.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Upgrade", onPress: () => console.log("Navigate to upgrade screen") }
                    ]
                  );
                }
              }}
              disabled={isLocked}
            >
              <View style={[
                tw`w-16 h-16 rounded-full overflow-hidden border-2`,
                isSelected ? tw`border-jung-gold` : tw`border-gray-200`,
                isLocked && styles.lockedAvatar
              ]}>
                <Image 
                  source={{ uri: getAvatarUrl(avatar.image_url) }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
                {isLocked && (
                  <View style={styles.lockOverlay}>
                    <AntDesign name="lock" size={20} color="white" />
                  </View>
                )}
              </View>
              <Text style={[
                tw`text-sm mt-1 font-medium`,
                isSelected ? tw`text-jung-gold` : tw`text-gray-700`
              ]}>
                {avatar.name}
              </Text>
              {isLocked && (
                <View style={tw`bg-gray-800 rounded-full px-2 py-0.5 mt-1`}>
                  <Text style={tw`text-xs text-white`}>Premium</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 80,
  },
  selectedAvatarContainer: {
    transform: [{ scale: 1.05 }],
  },
  lockedAvatar: {
    opacity: 0.7,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 