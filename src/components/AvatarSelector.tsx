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
    id: 'symbolsage', // Carl Jung -> The Symbol Sage
    name: 'The Symbol Sage',
    description: 'AI embodying analytical psychology, exploring dreams, archetypes, and the collective unconscious.',
  },
  {
    id: 'mindmapper', // Sigmund Freud -> The Mind Mapper
    name: 'The Mind Mapper',
    description: 'AI embodying psychoanalysis, focusing on the unconscious mind, defense mechanisms, and early experiences.',
  },
  {
    id: 'communitybuilder', // Alfred Adler -> The Community Builder
    name: 'The Community Builder',
    description: 'AI embodying individual psychology, emphasizing social interest, community, and life goals.',
  },
  {
    id: 'empathyengine', // Carl Rogers -> The Empathy Engine
    name: 'The Empathy Engine',
    description: 'AI embodying person-centered therapy, focusing on empathy, unconditional positive regard, and authenticity.',
    isPremium: false,
  },
  {
    id: 'meaningfinder', // Viktor Frankl -> The Meaning Finder
    name: 'The Meaning Finder',
    description: 'AI embodying logotherapy, focusing on finding meaning in life and overcoming suffering.',
    isPremium: false,
  },
  {
    id: 'potentialseeker', // Abraham Maslow -> The Potential Seeker
    name: 'The Potential Seeker',
    description: 'AI embodying humanistic psychology, focusing on self-actualization and the hierarchy of needs.',
    isPremium: false,
  },
  {
    id: 'culturecompass', // Karen Horney -> The Culture Compass
    name: 'The Culture Compass',
    description: 'AI embodying neo-Freudian psychology, focusing on cultural influences and self-realization.',
    isPremium: false
  },
  {
    id: 'oracle', // Stays as is
    name: 'Sage',
    description: 'Wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding of life situations.',
    isPremium: false
  },
  {
    id: 'morpheus',
    name: 'Awakener',
    description: 'Transformative approach that challenges perceptions, encourages critical thinking, and promotes personal liberation.',
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
