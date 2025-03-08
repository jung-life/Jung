import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import tw from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PostLoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <Text style={tw`text-xl font-bold text-jung-purple mb-8`}>Choose Your Path</Text>
      <TouchableOpacity
        style={tw`bg-jung-purple rounded-lg py-4 px-8 mb-4`}
        onPress={() => navigation.navigate('ConversationScreen')}
      >
        <Text style={tw`text-white font-bold text-lg`}>Go to Conversations</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`bg-jung-animus rounded-lg py-4 px-8`}
        onPress={() => navigation.navigate('DailyMotivationScreen')}
      >
        <Text style={tw`text-white font-bold text-lg`}>Get Daily Motivation</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PostLoginScreen; 