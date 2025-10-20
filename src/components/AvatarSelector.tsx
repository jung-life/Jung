import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, Dimensions } from 'react-native';
import tw from '../lib/tailwind';
import { SimpleAvatar } from './SimpleAvatar';
import { getAvatarUrl } from '../lib/supabase';
import { availableAvatars as avatarMetadata } from './SimpleAvatar';
import { SafePhosphorIcon } from './SafePhosphorIcon';

const { width, height } = Dimensions.get('window');

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
    description: 'A personal development guide for profound self-reflection, exploring life patterns, understanding personal symbolism, and uncovering deeper meanings in your experiences.',
  },
  {
    id: 'flourishingguide',
    name: 'The Life Coach',
    description: 'A personal development mentor dedicated to goal achievement. Focuses on building confidence, creating action plans, and helping you unlock your potential through proven growth strategies.',
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

interface AvatarPopupProps {
  visible: boolean;
  avatar: Avatar | null;
  onClose: () => void;
  onConfirm: () => void;
}

const AvatarPopup: React.FC<AvatarPopupProps> = ({ visible, avatar, onClose, onConfirm }) => {
  if (!avatar) return null;

  const avatarImageData = avatarMetadata.find(a => a.id === avatar.id);
  const imageUrl = avatarImageData ? getAvatarUrl(avatarImageData.filename) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 justify-center items-center px-4`}>
        <View style={tw`bg-white rounded-xl p-6 w-full max-w-md shadow-2xl`}>
          {/* Header */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-xl font-bold text-jung-deep`}>Meet Your Guide</Text>
            <TouchableOpacity onPress={onClose}>
              <SafePhosphorIcon iconType="X" size={24} color="#666" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Avatar Image */}
          <View style={tw`items-center mb-4`}>
            <View style={tw`w-72 h-72 rounded-full overflow-hidden border-4 border-jung-purple shadow-lg`}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              ) : (
                <View style={tw`w-full h-full bg-jung-purple/20 justify-center items-center`}>
                  <SafePhosphorIcon iconType="User" size={48} color="#8A2BE2" weight="fill" />
                </View>
              )}
            </View>
          </View>

          {/* Avatar Info */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold text-jung-deep text-center mb-2`}>
              {avatar.name}
            </Text>
            <Text style={tw`text-sm text-gray-600 text-center leading-5`}>
              {avatar.description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={tw`bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-3`}
              onPress={onClose}
            >
              <Text style={tw`text-gray-700 font-semibold text-center`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-jung-purple px-6 py-3 rounded-lg flex-1 ml-3`}
              onPress={onConfirm}
            >
              <Text style={tw`text-white font-semibold text-center`}>Choose Guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelectAvatar
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAvatarForPopup, setSelectedAvatarForPopup] = useState<Avatar | null>(null);

  const handleAvatarPress = (avatar: Avatar) => {
    setSelectedAvatarForPopup(avatar);
    setShowPopup(true);
  };

  const handleConfirmSelection = () => {
    if (selectedAvatarForPopup) {
      onSelectAvatar(selectedAvatarForPopup.id);
    }
    setShowPopup(false);
    setSelectedAvatarForPopup(null);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedAvatarForPopup(null);
  };

  return (
    <>
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
              onPress={() => handleAvatarPress(avatar)}
            >
              <View style={tw`relative`}>
                <SimpleAvatar
                  avatarId={avatar.id}
                  size={110}
                  style={tw`${isSelected ? 'border-2 border-jung-purple' : ''}`}
                />
                {/* Add a subtle "tap to preview" indicator */}
                <View style={tw`absolute bottom-0 right-0 bg-jung-purple/90 rounded-full p-1`}>
                  <SafePhosphorIcon iconType="Eye" size={12} color="white" weight="fill" />
                </View>
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

      <AvatarPopup
        visible={showPopup}
        avatar={selectedAvatarForPopup}
        onClose={handleClosePopup}
        onConfirm={handleConfirmSelection}
      />
    </>
  );
};
