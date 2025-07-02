import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';

const JournalingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Text style={tw`text-2xl font-bold text-jung-deep mb-4 text-center`}>
            Journaling Screen
          </Text>
          <Text style={tw`text-base text-gray-600 text-center mb-8`}>
            Journal functionality coming soon...
          </Text>
          
          <TouchableOpacity 
            style={tw`bg-jung-purple py-3 px-6 rounded-lg`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <Text style={tw`text-white font-semibold`}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white/80 border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <SafePhosphorIcon iconType="House" size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default JournalingScreen;
