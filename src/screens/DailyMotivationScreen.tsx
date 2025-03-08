import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from '../lib/tailwind';

const DailyMotivationScreen = () => {
  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <Text style={tw`text-xl font-bold text-jung-purple`}>Daily Motivation</Text>
      <Text style={tw`text-lg text-center mt-4`}>
        "The only way to do great work is to love what you do." - Steve Jobs
      </Text>
    </View>
  );
};

export default DailyMotivationScreen; 