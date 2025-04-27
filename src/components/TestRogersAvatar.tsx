import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TherapistAvatar from './TherapistAvatar';
import tw from '../lib/tailwind';

/**
 * A test component to verify that the Carl Rogers avatar displays correctly
 */
const TestRogersAvatar = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const message = "This is a test message for Carl Rogers avatar";

  return (
    <View style={tw`flex-1 items-center justify-center p-4 bg-gray-100`}>
      <Text style={tw`text-xl font-bold mb-6 text-center`}>
        Testing Carl Rogers Avatar
      </Text>
      
      <TherapistAvatar 
        isSpeaking={isSpeaking} 
        message={message} 
        avatarId="rogers" 
      />
      
      <TouchableOpacity
        style={tw`mt-8 bg-jung-purple px-6 py-3 rounded-lg`}
        onPress={() => setIsSpeaking(!isSpeaking)}
      >
        <Text style={tw`text-white font-bold`}>
          {isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
        </Text>
      </TouchableOpacity>
      
      <View style={tw`mt-8 p-4 bg-white rounded-lg shadow-md w-full`}>
        <Text style={tw`font-bold mb-2`}>Avatar Details:</Text>
        <Text>Avatar ID: rogers</Text>
        <Text>Expected Image: carl_rogers.png</Text>
        <Text style={tw`mt-4 text-xs text-gray-500`}>
          If the avatar doesn't display correctly, check the browser console for errors.
        </Text>
      </View>
    </View>
  );
};

export default TestRogersAvatar;
