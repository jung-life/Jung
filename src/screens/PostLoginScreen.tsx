import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { ChatCircleDots, Brain, BookOpen, User } from 'phosphor-react-native';
import { HamburgerMenu } from '../components/HamburgerMenu';

const PostLoginScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Add header with hamburger menu */}
   
        
        <ScrollView style={tw`flex-1 px-4`}>
          <View style={tw`mt-4 mb-8`}>
            <Text style={tw`text-2xl font-bold text-jung-deep mb-1`}>Welcome</Text>
            <Text style={tw`text-base text-gray-600`}>
              Explore yourself with Jung
            </Text>
          </View>
          
          <TouchableOpacity
            style={tw`bg-jung-purple-light rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`}
            onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
          >
            <ChatCircleDots size={28} color="#4A3B78" weight="fill" />
            <Text style={tw`ml-4 text-jung-purple text-lg font-semibold`}>Conversations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={tw`bg-jung-purple-light rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`}
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            <Brain size={28} color="#4A3B78" weight="fill" />
            <Text style={tw`ml-4 text-jung-purple text-lg font-semibold`}>Daily Motivation</Text>
          </TouchableOpacity>
          

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default PostLoginScreen; 