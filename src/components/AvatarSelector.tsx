import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { supabase, getAvatarUrl } from '../lib/supabase';
import tw from '../lib/tailwind';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  hasPremiumAccess?: boolean;
}

// Predefined avatar names in the bucket
const AVATAR_FILES = [
  { id: 'jung', name: 'Jung', premium: false, filename: 'jung.webp' },
  { id: 'freud', name: 'Freud', premium: false, filename: 'freud.webp' },
  { id: 'adler', name: 'Adler', premium: false, filename: 'adler.webp' },
  { id: 'horney', name: 'Horney', premium: false, filename: 'horney.webp' },
  { id: 'morpheus', name: 'Morpheus', premium: true, filename: 'morpheus.webp' },
  { id: 'oracle', name: 'Oracle', premium: true, filename: 'oracle.webp' }
];

export const AvatarSelector = ({ 
  selectedAvatar, 
  onSelectAvatar,
  hasPremiumAccess = false
}: AvatarSelectorProps) => {
  const [loadingAvatar, setLoadingAvatar] = useState<string | null>(null);
  const [errorAvatars, setErrorAvatars] = useState<Set<string>>(new Set());

  const handleSelectAvatar = async (avatarId: string) => {
    if (loadingAvatar) return; // Prevent multiple selections while loading
    
    setLoadingAvatar(avatarId);
    onSelectAvatar(avatarId);
    setLoadingAvatar(null);
  };

  return (
    <View style={tw`mb-4`}>
      <Text style={tw`text-lg font-semibold mb-2`}>Choose Your Guide</Text>
      <View style={tw`flex-row flex-wrap justify-center`}>
        {AVATAR_FILES.map((avatar) => {
          const isSelected = selectedAvatar === avatar.id;
          const isLocked = avatar.premium && !hasPremiumAccess;
          const hasError = errorAvatars.has(avatar.id);
          
          return (
            <TouchableOpacity
              key={avatar.id}
              style={[
                tw`m-2 items-center`,
                { opacity: isLocked ? 0.6 : 1 }
              ]}
              onPress={() => {
                if (!isLocked) {
                  handleSelectAvatar(avatar.id);
                } else {
                  // Show premium upgrade message
                  console.log('Premium avatar locked');
                }
              }}
              disabled={isLocked || loadingAvatar !== null}
            >
              <View style={[
                tw`w-16 h-16 rounded-full overflow-hidden border-2`,
                isSelected ? tw`border-purple-500` : tw`border-gray-300`,
              ]}>
                {loadingAvatar === avatar.id ? (
                  <View style={tw`w-full h-full items-center justify-center bg-gray-100`}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </View>
                ) : hasError ? (
                  <View style={tw`w-full h-full items-center justify-center bg-gray-100`}>
                    <AntDesign name="user" size={24} color="#8B5CF6" />
                  </View>
                ) : (
                  <Image
                    source={{ 
                      uri: `https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars/${avatar.filename}` 
                    }}
                    style={tw`w-full h-full`}
                    defaultSource={{ uri: 'https://via.placeholder.com/150' }}
                    onError={() => {
                      console.log(`Failed to load avatar: ${avatar.id}, filename: ${avatar.filename}`);
                      setErrorAvatars(prev => new Set(prev).add(avatar.id));
                    }}
                  />
                )}
                {isLocked && (
                  <View style={tw`absolute inset-0 bg-black bg-opacity-40 items-center justify-center`}>
                    <AntDesign name="lock" size={20} color="white" />
                  </View>
                )}
              </View>
              <Text style={[
                tw`text-sm mt-1`,
                isSelected ? tw`font-bold text-purple-600` : tw`text-gray-700`
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
      </View>
    </View>
  );
};

// Add this export to fix any linter errors
export const availableAvatars = []; 