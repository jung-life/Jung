import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { SimpleAvatar, availableAvatars } from './SimpleAvatar';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  hasPremiumAccess?: boolean;
}

export const AvatarSelector = ({ 
  selectedAvatar, 
  onSelectAvatar,
  hasPremiumAccess = false
}: AvatarSelectorProps) => {
  return (
    <View style={tw`mb-4`}>
      <Text style={tw`text-lg font-medium mb-2`}>Choose an Avatar</Text>
      
      <View style={tw`flex-row flex-wrap justify-center`}>
        {availableAvatars.map(avatar => {
          const isSelected = selectedAvatar === avatar.id;
          const isLocked = avatar.premium && !hasPremiumAccess;
          
          return (
            <TouchableOpacity
              key={avatar.id}
              style={tw`items-center m-2 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
              onPress={() => {
                if (!isLocked) {
                  onSelectAvatar(avatar.id);
                } else {
                  // Show premium upgrade prompt
                  alert('This avatar requires premium access');
                }
              }}
              disabled={isLocked}
            >
              <View style={[
                tw`overflow-hidden border-2`,
                isSelected ? tw`border-purple-600` : tw`border-gray-300`,
                isLocked && tw`opacity-50`
              ]}>
                <SimpleAvatar 
                  avatarId={avatar.id} 
                  size={64}
                />
                
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