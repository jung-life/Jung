import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { ChatCircleDots, Brain, BookOpen, Heart, User } from 'phosphor-react-native';
import { HamburgerMenu } from '../components/HamburgerMenu';

const PostLoginScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Header with hamburger menu */}
        <View style={tw`flex-row justify-between items-center p-4`}>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Jung</Text>
          <HamburgerMenu />
        </View>
        
        <ScrollView style={tw`flex-1 px-4`}>
          <View style={tw`mt-4 mb-8`}>
            <Text style={tw`text-2xl font-bold text-jung-deep mb-1`}>Welcome</Text>
            <Text style={tw`text-base text-gray-600`}>
              Explore yourself with Jung
            </Text>
          </View>
          
          {/* Conversations Button */}
          <TouchableOpacity
            style={tw`bg-conversation rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use conversation color
            onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
          >
            {/* Wrap icon in a View */}
            <View>
              <ChatCircleDots size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Conversations</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>
          
          {/* Daily Motivation Button */}
          <TouchableOpacity 
            style={tw`bg-motivation rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use motivation color
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            {/* Wrap icon in a View */}
            <View>
              <Brain size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Daily Motivation</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>
          
          {/* Emotional Assessment Button */}
          <TouchableOpacity 
            style={tw`bg-emotional rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use emotional color
            onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
          >
            {/* Wrap icon in a View */}
            <View> 
              <Heart size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Emotional Assessment</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>

          {/* Self-Help Resources Button */}
          <TouchableOpacity 
            style={tw`bg-resources rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use resources color
            onPress={() => navigation.navigate('SelfHelpResourcesScreen')}
            >
            {/* Wrap icon in a View */}
            <View>
              <BookOpen size={28} color="#2D2B55" weight="fill" />
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Self-Help Resources</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default PostLoginScreen;
