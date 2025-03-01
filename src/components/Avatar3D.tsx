// This file is deprecated - using SimpleAvatar instead
import React from 'react';
import { View, Text } from 'react-native';
import tw from '../lib/tailwind';

// Placeholder component that redirects to SimpleAvatar
export const Avatar3D = ({ avatarId = 'jung', size = 150 }) => {
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2 },
      tw`bg-purple-100 items-center justify-center`
    ]}>
      <Text style={tw`text-purple-500`}>
        Using SimpleAvatar instead
      </Text>
    </View>
  );
};

// Dummy function to prevent import errors
export const preloadAvatarModels = async () => {
  console.log('3D models deprecated, using SimpleAvatar instead');
}; 