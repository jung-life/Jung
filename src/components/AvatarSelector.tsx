import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import tw from '../lib/tailwind';
import { SimpleAvatar } from './SimpleAvatar';

export type Avatar = {
  id: string;
  name: string;
  description: string;
  isPremium?: boolean; // We'll keep this property but ignore it
};

// Define all available avatars without premium restrictions
export const availableAvatars: Avatar[] = [
  {
    id: 'jung',
    name: 'Carl Jung',
    description: 'Analytical psychology focused on the psyche through exploring dreams, art, mythology, religion, and philosophy.',
  },
  {
    id: 'freud',
    name: 'Sigmund Freud',
    description: 'Founder of psychoanalysis focusing on unconscious mind, defense mechanisms, and childhood experiences.',
  },
  {
    id: 'adler',
    name: 'Alfred Adler',
    description: 'Individual psychology emphasizing social interest, inferiority feelings, and striving for superiority.',
  },
  {
    id: 'rogers',
    name: 'Carl Rogers',
    description: 'Person-centered approach focusing on empathy, unconditional positive regard, and authenticity.',
    isPremium: false, // Previously premium, now free
  },
  {
    id: 'frankl',
    name: 'Viktor Frankl',
    description: 'Logotherapy focusing on finding meaning in life and overcoming suffering.',
    isPremium: false, // Previously premium, now free
  },
  {
    id: 'maslow',
    name: 'Abraham Maslow',
    description: 'Humanistic psychology focusing on self-actualization and the hierarchy of needs.',
    isPremium: false, // Previously premium, now free
  },
  {
    id: 'horney',
    name: 'Karen Horney',
    description: 'Neo-Freudian psychology focusing on cultural influences and self-realization.',
    isPremium: false
  },
  {
    id: 'oracle',
    name: 'The Oracle',
    description: 'Mystical guidance focusing on deeper patterns and possibilities.',
    isPremium: false
  },
  {
    id: 'morpheus',
    name: 'Morpheus',
    description: 'Challenging guide who helps question assumptions and break free from limiting beliefs.',
    isPremium: false
  }
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
  hasPremiumAccess?: boolean; // We'll keep this but ignore it
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ 
  selectedAvatar, 
  onSelectAvatar,
  hasPremiumAccess = true // Default to true to make all avatars available
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`p-2`}
    >
      {availableAvatars.map((avatar) => {
        const isSelected = selectedAvatar === avatar.id;
        // Remove the premium check - all avatars are available
        const isAvailable = true;
        
        return (
          <TouchableOpacity
            key={avatar.id}
            style={tw`items-center mr-4 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
            onPress={() => isAvailable && onSelectAvatar(avatar.id)}
            disabled={!isAvailable}
          >
            <View style={tw`relative`}>
              <SimpleAvatar 
                avatarId={avatar.id} 
                size={70} 
                style={tw`${isSelected ? 'border-2 border-jung-purple' : ''}`}
              />
              {/* Remove the lock icon for premium avatars */}
            </View>
            <Text style={tw`mt-1 text-center font-medium ${isSelected ? 'text-jung-purple' : 'text-gray-700'}`}>
              {avatar.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}; 