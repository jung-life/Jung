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
    id: 'deepseer', // Renamed ID
    name: 'Deepseer', // Renamed Name
    description: 'An AI guide into the profound depths of the psyche, illuminating the landscapes of the unconscious, interpreting dreams, and revealing the power of archetypes and symbols to unlock self-understanding.',
    isPremium: false,
  },
  {
    id: 'flourishingguide',
    name: 'The Flourishing Guide',
    description: 'An AI companion dedicated to fostering holistic well-being. It champions empathy, guides users in discovering their unique potential, finding meaning in their experiences, building strong community connections, and navigating cultural influences for authentic self-realization.',
    isPremium: false,
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
