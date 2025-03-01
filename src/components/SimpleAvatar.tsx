import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from '../lib/tailwind';

// Define avatar colors and initials
const AVATAR_STYLES = {
  jung: { color: '#8A2BE2', initial: 'J', name: 'Jung' },      // BlueViolet
  freud: { color: '#4682B4', initial: 'F', name: 'Freud' },    // SteelBlue
  adler: { color: '#2E8B57', initial: 'A', name: 'Adler' },    // SeaGreen
  horney: { color: '#CD5C5C', initial: 'H', name: 'Horney' },  // IndianRed
  morpheus: { color: '#191970', initial: 'M', name: 'Morpheus' }, // MidnightBlue
  oracle: { color: '#DAA520', initial: 'O', name: 'Oracle' },  // GoldenRod
  user: { color: '#4169E1', initial: 'U', name: 'User' },      // RoyalBlue
  assistant: { color: '#8A2BE2', initial: 'A', name: 'Assistant' }, // BlueViolet
  default: { color: '#4169E1', initial: '?', name: 'Unknown' } // RoyalBlue
};

// Simple avatar component that doesn't require image assets
export const SimpleAvatar = ({ 
  avatarId = 'jung', 
  size = 40, 
  style = {}
}) => {
  // Get avatar style or use default
  const avatarStyle = AVATAR_STYLES[avatarId] || AVATAR_STYLES.default;
  
  return (
    <View style={[
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: avatarStyle.color,
      },
      tw`flex items-center justify-center shadow-sm`,
      style
    ]}>
      <Text style={[
        tw`text-white font-bold`,
        { fontSize: size * 0.5 }
      ]}>
        {avatarStyle.initial}
      </Text>
    </View>
  );
};

// Get avatar name by ID
export const getAvatarName = (avatarId) => {
  const avatarStyle = AVATAR_STYLES[avatarId] || AVATAR_STYLES.default;
  return avatarStyle.name;
};

// Export avatar styles for use in other components
export const availableAvatars = Object.keys(AVATAR_STYLES)
  .filter(id => id !== 'default' && id !== 'user' && id !== 'assistant')
  .map(id => ({
    id,
    name: AVATAR_STYLES[id].name,
    color: AVATAR_STYLES[id].color,
    premium: ['morpheus', 'oracle'].includes(id)
  })); 