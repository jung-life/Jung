import React, { useEffect, useState } from 'react';
import { View, Image, Text, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../lib/tailwind';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type MotivationalSplashNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MotivationalSplashScreen'>;

export const MotivationalSplashScreen = () => {
  const navigation = useNavigation<MotivationalSplashNavigationProp>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const navigateToPostLogin = () => {
    navigation.navigate('PostLoginScreen');
  };

  useEffect(() => {
    // Show the motivational image for 3 seconds, then navigate to PostLoginScreen
    const timer = setTimeout(() => {
      navigateToPostLogin();
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <TouchableOpacity 
      style={tw`flex-1 bg-gray-900`}
      onPress={navigateToPostLogin}
      activeOpacity={1}
    >
      <SymbolicBackground />
      
      {/* Skip Button */}
      <View style={tw`absolute top-12 right-6 z-10`}>
        <TouchableOpacity
          onPress={navigateToPostLogin}
          style={tw`bg-gray-800/80 px-4 py-2 rounded-full`}
        >
          <Text style={tw`text-yellow-300 font-medium`}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <View style={tw`flex-1 justify-center items-center px-6`}>
        
        {/* Lighthouse Image - Full display with proper aspect ratio */}
        <View style={tw`mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gray-800`}>
          {!imageLoaded && !imageError && (
            <View style={[
              tw`absolute inset-0 justify-center items-center z-10`,
              {
                width: width * 0.9,
                height: height * 0.55,
              }
            ]}>
              <ActivityIndicator size="large" color="#FDE047" />
              <Text style={tw`text-yellow-300 mt-4 text-lg`}>Loading lighthouse...</Text>
            </View>
          )}
          
          {imageError ? (
            // Fallback to Jung logo if lighthouse image fails
            <View style={[
              tw`justify-center items-center bg-gray-800`,
              {
                width: width * 0.9,
                height: height * 0.55,
              }
            ]}>
              <Image
                source={require('../../assets/jung-app-logo-1024.png')}
                style={[
                  tw`rounded-xl`,
                  {
                    width: width * 0.6,
                    height: width * 0.6,
                    resizeMode: 'contain'
                  }
                ]}
              />
              <Text style={tw`text-yellow-300 text-lg text-center mt-4 px-4`}>
                Jung Logo
              </Text>
            </View>
          ) : (
            <Image
              source={{ 
                uri: 'https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/logo//lighthouse.png' 
              }}
              style={[
                tw`rounded-2xl`,
                {
                  width: width * 0.9,
                  height: height * 0.55,
                  resizeMode: 'cover'
                }
              ]}
              onLoad={() => {
                console.log('✅ Lighthouse image loaded successfully');
                setImageLoaded(true);
              }}
              onError={(error) => {
                console.log('❌ Lighthouse image load error:', error);
                setImageError(true);
              }}
            />
          )}
        </View>

        {/* Motivational Text with better contrast */}
        <View style={tw`items-center px-4 bg-gray-800/80 rounded-xl py-6 mx-4`}>
          <Text style={tw`text-2xl font-bold text-yellow-300 text-center mb-4`}>
            Welcome to Your Journey
          </Text>
          <Text style={tw`text-lg text-gray-100 text-center leading-relaxed`}>
            Like a lighthouse guides ships through stormy seas, Jung will illuminate your path to self-discovery
          </Text>
        </View>

        {/* Loading Indicator */}
        <View style={tw`mt-8 flex-row items-center`}>
          <View style={tw`w-2 h-2 bg-yellow-300 rounded-full mr-2 opacity-60`} />
          <View style={tw`w-2 h-2 bg-yellow-300 rounded-full mr-2 opacity-80`} />
          <View style={tw`w-2 h-2 bg-yellow-300 rounded-full opacity-100`} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
