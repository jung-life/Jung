import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { setIsNewUser } = useAuth();

  const handleAccept = async () => {
    try {
      // Mark that the user has seen the disclaimer
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            has_seen_disclaimer: true,
            disclaimer_version: CURRENT_DISCLAIMER_VERSION,
            updated_at: new Date().toISOString()
          });
      }
      
      // Update the auth context
      setIsNewUser(false);
      
      // Navigate to the main screen
      navigation.replace('Conversations', { refresh: Date.now() });
    } catch (error) {
      console.error('Error saving disclaimer acknowledgment:', error);
      // Navigate anyway even if saving fails
      setIsNewUser(false);
      navigation.replace('Conversations', { refresh: Date.now() });
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
            
            <TouchableOpacity
              style={tw`flex-row items-center mb-4`}
              onPress={() => setHasAcknowledged(!hasAcknowledged)}
            >
              <View style={[
                tw`w-6 h-6 rounded-md border-2 border-jung-purple mr-3 items-center justify-center`,
                hasAcknowledged && tw`bg-jung-purple`
              ]}>
                {hasAcknowledged && <AntDesign name="check" size={16} color="white" />}
              </View>
              <Text style={tw`text-base flex-1`}>
                I understand that this app is not a replacement for professional mental health therapy
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          <TouchableOpacity
            style={[
              tw`bg-jung-purple rounded-xl py-4 items-center`,
              !hasAcknowledged && tw`opacity-50`
            ]}
            onPress={handleAccept}
            disabled={!hasAcknowledged}
          >
            <Text style={tw`text-white font-medium text-lg`}>
              I Understand & Accept
            </Text>
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