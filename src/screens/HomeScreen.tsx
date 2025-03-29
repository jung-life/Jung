import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import tw from '../lib/tailwind';
import { Heart, Brain, ChatCircle, Gauge } from 'phosphor-react-native';

export const HomeScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // The useAuth hook will automatically update the session state
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  return (
    <GradientBackground>
      <SymbolicBackground opacity={0.03} />
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-bold text-jung-purple mb-2`}>Welcome to Jung</Text>
          <Text style={tw`text-gray-600`}>Your companion for psychological exploration and growth</Text>
        </View>

        {/* Features Grid */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Explore Features</Text>
          
          <View style={tw`flex-row flex-wrap -mx-2`}>
            {/* Emotional Assessment Card */}
            <TouchableOpacity
              style={tw`w-1/2 px-2 mb-4`}
              onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
            >
              <View style={tw`bg-white rounded-xl p-4 shadow-md h-36 justify-between`}>
                <View style={tw`bg-jung-purple-light w-10 h-10 rounded-full items-center justify-center mb-2`}>
                  <Gauge size={20} color="#4A3B78" />
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Emotional Assessment</Text>
                  <Text style={tw`text-gray-600 text-sm`}>Understand your emotional state</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Daily Motivation Card */}
            <TouchableOpacity
              style={tw`w-1/2 px-2 mb-4`}
              onPress={() => navigation.navigate('DailyMotivationScreen')}
            >
              <View style={tw`bg-white rounded-xl p-4 shadow-md h-36 justify-between`}>
                <View style={tw`bg-rose-100 w-10 h-10 rounded-full items-center justify-center mb-2`}>
                  <Heart size={20} color="#BE185D" />
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Daily Motivation</Text>
                  <Text style={tw`text-gray-600 text-sm`}>Start your day with inspiration</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Chat Card */}
            <TouchableOpacity
              style={tw`w-1/2 px-2 mb-4`}
              onPress={() => navigation.navigate('ConversationsScreen', { refresh: false })}
            >
              <View style={tw`bg-white rounded-xl p-4 shadow-md h-36 justify-between`}>
                <View style={tw`bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2`}>
                  <ChatCircle size={20} color="#1E40AF" />
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Conversations</Text>
                  <Text style={tw`text-gray-600 text-sm`}>Engage in therapeutic dialogue</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Profile Card */}
            <TouchableOpacity
              style={tw`w-1/2 px-2 mb-4`}
              onPress={() => navigation.navigate('AccountScreen')}
            >
              <View style={tw`bg-white rounded-xl p-4 shadow-md h-36 justify-between`}>
                <View style={tw`bg-amber-100 w-10 h-10 rounded-full items-center justify-center mb-2`}>
                  <Brain size={20} color="#9A3412" />
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Your Profile</Text>
                  <Text style={tw`text-gray-600 text-sm`}>Manage account settings</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={tw`bg-gray-200 py-3 rounded-lg items-center`}
          onPress={handleSignOut}
        >
          <Text style={tw`text-gray-700 font-medium`}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
};
