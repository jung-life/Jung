import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ChatCircleDots, Brain, Sparkle } from 'phosphor-react-native';
import tw from '../lib/tailwind';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PostLoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={tw`flex-1 justify-center items-center bg-jung-bg p-6`}>
      <Text style={tw`text-2xl font-bold text-jung-deep mb-8`}>Choose Your Path</Text>
      
      {/* Conversations Button */}
      <TouchableOpacity
        style={tw`bg-jung-purple-light rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`}
        onPress={() => navigation.navigate('ConversationsScreen')}
      >
        <ChatCircleDots size={28} color="#4A3B78" weight="fill" />
        <Text style={tw`ml-4 text-jung-purple text-lg font-semibold`}>
          Start a Conversation
        </Text>
        <Sparkle size={20} color="#4A3B78" weight="fill" style={tw`ml-auto`} />
      </TouchableOpacity>

      {/* Motivation Button */}
      <TouchableOpacity
        style={tw`bg-jung-anima-light rounded-xl p-6 w-full flex-row items-center shadow-sm`}
        onPress={() => navigation.navigate('DailyMotivationScreen')}
      >
        <Brain size={28} color="#E6C3C3" weight="fill" />
        <Text style={tw`ml-4 text-jung-anima text-lg font-semibold`}>
          Daily Motivation
        </Text>
        <Sparkle size={20} color="#E6C3C3" weight="fill" style={tw`ml-auto`} />
      </TouchableOpacity>
    </View>
  );
};

export default PostLoginScreen; 