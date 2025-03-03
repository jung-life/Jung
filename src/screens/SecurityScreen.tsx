import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Easing 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Fingerprint, 
  CheckCircle,
  ArrowRight
} from 'phosphor-react-native';

export const SecurityScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [animatedValues] = useState({
    shield: new Animated.Value(0),
    items: Array(4).fill(0).map(() => new Animated.Value(0)),
    button: new Animated.Value(0)
  });
  
  useEffect(() => {
    // Animate shield first
    Animated.timing(animatedValues.shield, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5))
    }).start();
    
    // Then animate each item with a delay
    animatedValues.items.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 800 + (index * 200),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
    });
    
    // Finally animate the button
    Animated.timing(animatedValues.button, {
      toValue: 1,
      duration: 600,
      delay: 2000,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  }, []);
  
  const handleContinue = () => {
    // Navigate to the main app content with required params
    navigation.navigate('Conversations', { refresh: true });
  };
  
  const securityFeatures = [
    {
      icon: <Lock size={28} color="#6b46c1" weight="fill" />,
      title: "End-to-End Encryption",
      description: "Your conversations are encrypted and can only be accessed by you."
    },
    {
      icon: <Eye size={28} color="#6b46c1" weight="fill" />,
      title: "Privacy-First Design",
      description: "We don't sell or share your data with third parties."
    },
    {
      icon: <Database size={28} color="#6b46c1" weight="fill" />,
      title: "Secure Cloud Storage",
      description: "Your data is stored in secure, encrypted databases."
    },
    {
      icon: <Fingerprint size={28} color="#6b46c1" weight="fill" />,
      title: "Personal Control",
      description: "Delete your data anytime with our easy data management tools."
    }
  ];
  
  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`flex-grow p-6`}>
          <View style={tw`flex-1 items-center justify-center`}>
            {/* Animated Shield Icon */}
            <Animated.View style={[
              tw`mb-8`,
              {
                transform: [
                  { scale: animatedValues.shield },
                  { 
                    rotate: animatedValues.shield.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}>
              <View style={tw`bg-purple-100 p-6 rounded-full`}>
                <Shield size={80} color="#6b46c1" weight="fill" />
              </View>
            </Animated.View>
            
            <Text style={tw`text-3xl font-bold text-center mb-2 text-gray-800`}>
              Your Data is Secure
            </Text>
            
            <Text style={tw`text-base text-center mb-8 text-gray-600 px-4`}>
              We prioritize your privacy and security in every aspect of your journey with us.
            </Text>
            
            {/* Security Features */}
            <View style={tw`w-full mb-8`}>
              {securityFeatures.map((feature, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    tw`flex-row items-center bg-white rounded-xl p-4 mb-4 shadow-sm`,
                    {
                      opacity: animatedValues.items[index],
                      transform: [
                        { 
                          translateY: animatedValues.items[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={tw`mr-4`}>
                    {feature.icon}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-gray-800 mb-1`}>{feature.title}</Text>
                    <Text style={tw`text-gray-600`}>{feature.description}</Text>
                  </View>
                  <CheckCircle size={24} color="#10B981" weight="fill" />
                </Animated.View>
              ))}
            </View>
            
            <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 mb-6 w-full`}>
              <Text style={tw`text-lg font-bold text-red-800 mb-2`}>
                Health Disclaimer
              </Text>
              <Text style={tw`text-red-700 leading-5`}>
                Jung is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with any 
                questions you may have regarding a medical condition. Never disregard professional 
                medical advice because of something you have read or heard on this app.
              </Text>
            </View>
            
            {/* Continue Button */}
            <Animated.View style={{
              width: '100%',
              opacity: animatedValues.button,
              transform: [
                { 
                  translateY: animatedValues.button.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }}>
              <TouchableOpacity 
                style={tw`bg-jung-purple rounded-xl py-4 px-6 flex-row items-center justify-center`}
                onPress={handleContinue}
              >
                <Text style={tw`text-white font-bold text-lg mr-2`}>Continue to Your Journey</Text>
                <ArrowRight size={20} color="white" weight="bold" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}; 