import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import tw from '../lib/tailwind';
import { SimpleAvatar } from './SimpleAvatar';

export type Avatar = {
  id: string;
  name: string;
  description: string;
};

// Define all available avatars - all free now
export const availableAvatars: Avatar[] = [
  {
    id: 'depthdelver',
    name: 'The Depth Delver',
    description: 'An AI guide into the profound depths of the psyche, illuminating the landscapes of the unconscious, interpreting dreams, and revealing the power of archetypes and symbols to unlock self-understanding.',
  },
  {
    id: 'flourishingguide',
    name: 'Inner Work Companion',
    description: 'An AI companion dedicated to fostering holistic well-being. It champions empathy, guides users in discovering their unique potential, finding meaning in their experiences, building strong community connections, and navigating cultural influences for authentic self-realization.',
  },
  {
    id: 'oracle',
    name: 'Sage',
    description: 'Wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding of life situations.',
  },
  {
    id: 'morpheus',
    name: 'Awakener',
    description: 'Transformative approach that challenges perceptions, encourages critical thinking, and promotes personal liberation.',
  }
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelectAvatar
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`p-2`}
    >
      {availableAvatars.map((avatar) => {
        const isSelected = selectedAvatar === avatar.id;

        return (
          <TouchableOpacity
            key={avatar.id}
            style={tw`items-center mr-4 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
            onPress={() => onSelectAvatar(avatar.id)}
          >
            <View style={tw`relative`}>
              <SimpleAvatar
                avatarId={avatar.id}
                size={110}
                style={tw`${isSelected ? 'border-2 border-jung-purple' : ''}`}
              />
            </View>
            <Text style={tw`mt-1 text-center font-medium text-xs max-w-20 ${
              isSelected ? 'text-jung-purple' : 'text-gray-700'
            }`}>
              {avatar.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
