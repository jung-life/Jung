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
    name: 'The Deep Thinker',
    description: 'An AI guide for profound self-reflection, exploring life patterns, understanding personal symbolism, and uncovering deeper meanings in your experiences.',
  },
  {
    id: 'flourishingguide',
    name: 'The Life Coach',
    description: 'An AI mentor dedicated to personal development and goal achievement. Focuses on building confidence, creating action plans, and helping you unlock your potential through proven growth strategies.',
  },
  {
    id: 'oracle',
    name: 'The Wise Sage',
    description: 'Ancient wisdom meets modern insights. Specializes in intuitive guidance, life philosophy, and helping you see the bigger picture in your personal journey.',
  },
  {
    id: 'morpheus',
    name: 'The Breakthrough Coach',
    description: 'Transformative mentor that challenges limiting beliefs, encourages bold thinking, and helps you break through barriers to create positive life changes.',
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
