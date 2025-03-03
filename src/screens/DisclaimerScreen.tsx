import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { RootStackNavigationProp } from '../navigation/types';
import { GradientBackground } from '../components/GradientBackground';
import { Typography } from '../components/Typography';
import tw from '../lib/tailwind';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CURRENT_DISCLAIMER_VERSION } from '../lib/supabase';

export const DisclaimerScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [healthDisclaimerChecked, setHealthDisclaimerChecked] = useState(false);
  const { setIsNewUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Update the user_preferences table
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_seen_disclaimer: true,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      // Update the auth context
      setIsNewUser(false);
      
      // Navigate to the main app
      navigation.navigate('Conversations', { refresh: true });
    } catch (error) {
      console.error('Error accepting disclaimer:', error);
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 p-6`}>
          <View style={tw`items-center mb-6`}>
            <Typography variant="title" style={tw`text-center`}>
              Important Disclaimer
            </Typography>
          </View>
          
          <ScrollView 
            style={tw`flex-1 bg-white bg-opacity-90 rounded-xl p-5 mb-6`}
            contentContainerStyle={tw`pb-6`}
          >
            <Typography variant="subtitle" style={tw`mb-4 text-jung-purple`}>
              Not a Replacement for Professional Therapy
            </Typography>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              Welcome to Jung, an AI-powered reflection tool. Before you begin, please understand that this application is <Text style={tw`font-bold`}>not a replacement for professional mental health therapy</Text>.
            </Text>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              This app is designed to enhance your self-reflection journey and improve communication with yourself, but it does not provide medical advice, diagnosis, or treatment.
            </Text>
            
            <Typography variant="subtitle" style={tw`mb-4 mt-2 text-jung-purple`}>
              How to Use This App
            </Typography>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              • Use Jung as a complementary tool alongside professional therapy, not as a substitute
            </Text>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              • The AI guides are inspired by various psychological perspectives but do not represent actual therapeutic methodologies
            </Text>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              • For mental health emergencies, please contact a healthcare professional, call your local emergency number, or reach out to a crisis helpline
            </Text>
            
            <Typography variant="subtitle" style={tw`mb-4 mt-2 text-jung-purple`}>
              Privacy & Data
            </Typography>
            
            <Text style={tw`text-base mb-4 leading-6`}>
              Your conversations are stored securely, but please be mindful about sharing sensitive personal information. Review our privacy policy for more details on how your data is handled.
            </Text>
            
            <Text style={tw`text-base mb-6 leading-6 italic`}>
              By continuing to use this application, you acknowledge that you understand and agree to these terms.
            </Text>
            
            <View style={tw`flex-row items-start mb-6`}>
              <TouchableOpacity 
                style={tw`p-2 mr-2`} 
                onPress={() => setHealthDisclaimerChecked(!healthDisclaimerChecked)}
              >
                <View style={tw`w-6 h-6 border-2 border-red-500 rounded items-center justify-center`}>
                  {healthDisclaimerChecked && (
                    <View style={tw`w-4 h-4 bg-red-500 rounded`} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={tw`flex-1 text-gray-700`}>
                I understand that Jung is not a healthcare provider and does not offer medical advice. 
                I will seek professional help for any mental health concerns.
              </Text>
            </View>
          </ScrollView>
          
          <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 mb-6`}>
            <Text style={tw`text-lg font-bold text-red-800 mb-2`}>
              Important Health Notice
            </Text>
            <Text style={tw`text-red-700 leading-5`}>
              Jung is not a healthcare provider and does not offer medical advice, diagnosis, or treatment. 
              This app is designed for self-reflection and exploration only. If you're experiencing mental 
              health concerns, please consult with a qualified healthcare professional.
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              tw`bg-jung-purple rounded-xl py-4 px-6 w-full items-center`,
              (!healthDisclaimerChecked) && tw`opacity-50`
            ]}
            onPress={handleAccept}
            disabled={!healthDisclaimerChecked}
          >
            <Text style={tw`text-white font-bold text-lg`}>I Accept</Text>
          </TouchableOpacity>
          
          <View style={tw`items-center mt-2`}>
            <Text style={tw`text-xs text-gray-500`}>
              Disclaimer Version: {CURRENT_DISCLAIMER_VERSION}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}; 