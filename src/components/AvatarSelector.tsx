import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import tw from '../lib/tailwind';
import { SimpleAvatar } from './SimpleAvatar';
import { useSubscription } from '../hooks/useSubscription';
import PremiumUpgradeButton from './PremiumUpgradeButton';

export type Avatar = {
  id: string;
  name: string;
  description: string;
  isPremium?: boolean; // We'll keep this property but ignore it
};

// Define all available avatars with premium tiers
export const availableAvatars: Avatar[] = [
  {
    id: 'depthdelver', // Free tier - Carl Jung inspired
    name: 'The Depth Delver',
    description: 'An AI guide into the profound depths of the psyche, illuminating the landscapes of the unconscious, interpreting dreams, and revealing the power of archetypes and symbols to unlock self-understanding.',
    isPremium: false,
  },
  {
    id: 'flourishingguide', // Premium tier - Positive psychology
    name: 'The Flourishing Guide',
    description: 'An AI companion dedicated to fostering holistic well-being. It champions empathy, guides users in discovering their unique potential, finding meaning in their experiences, building strong community connections, and navigating cultural influences for authentic self-realization.',
    isPremium: true,
  },
  {
    id: 'oracle', // Premium tier - Wisdom-based
    name: 'Sage',
    description: 'Wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding of life situations.',
    isPremium: true
  },
  {
    id: 'morpheus', // Premium tier - Transformative
    name: 'Awakener',
    description: 'Transformative approach that challenges perceptions, encourages critical thinking, and promotes personal liberation.',
    isPremium: true
  }
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
  onUpgradePress?: () => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ 
  selectedAvatar, 
  onSelectAvatar,
  onUpgradePress
}) => {
  const { isPremiumUser } = useSubscription();
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`p-2`}
    >
      {availableAvatars.map((avatar) => {
        const isSelected = selectedAvatar === avatar.id;
        const isAvailable = !avatar.isPremium || isPremiumUser;
        const needsUpgrade = avatar.isPremium && !isPremiumUser;
        
        return (
          <TouchableOpacity
            key={avatar.id}
            style={tw`items-center mr-4 ${isSelected ? 'opacity-100' : isAvailable ? 'opacity-70' : 'opacity-50'}`}
            onPress={() => {
              if (needsUpgrade && onUpgradePress) {
                onUpgradePress();
              } else if (isAvailable) {
                onSelectAvatar(avatar.id);
              }
            }}
          >
            <View style={tw`relative`}>
              <SimpleAvatar 
                avatarId={avatar.id} 
                size={70} 
                style={tw`${isSelected ? 'border-2 border-jung-purple' : needsUpgrade ? 'border border-gray-300' : ''}`}
              />
              {needsUpgrade && (
                <View style={tw`absolute -top-1 -right-1 bg-jung-purple rounded-full w-6 h-6 justify-center items-center`}>
                  <Text style={tw`text-white text-xs font-bold`}>👑</Text>
                </View>
              )}
            </View>
            <Text style={tw`mt-1 text-center font-medium text-xs max-w-20 ${
              isSelected ? 'text-jung-purple' : 
              needsUpgrade ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {avatar.name}
            </Text>
            {needsUpgrade && (
              <Text style={tw`text-xs text-jung-purple font-medium`}>Premium</Text>
            )}
          </TouchableOpacity>
        );
      })}
      
      {/* Show upgrade prompt if user doesn't have premium */}
      {!isPremiumUser && (
        <View style={tw`items-center justify-center ml-4 mr-2`}>
          <PremiumUpgradeButton 
            variant="small"
            onPress={onUpgradePress}
            message="Unlock All"
            style={tw`px-3 py-2`}
          />
        </View>
      )}
    </ScrollView>
  );
};
