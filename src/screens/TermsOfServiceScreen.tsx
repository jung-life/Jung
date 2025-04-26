import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'phosphor-react-native';
import { RootStackNavigationProp } from '../navigation/types';
import { GradientBackground } from '../components/GradientBackground';
import tw from '../lib/tailwind';

export const TermsOfServiceScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-row items-center p-4 border-b border-gray-200`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`p-2`}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={tw`ml-2 text-xl font-semibold`}>
            Terms of Service
          </Text>
        </View>
        
        <ScrollView style={tw`flex-1 p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Jung App Terms of Service</Text>
          
          <Text style={tw`mb-4`}>
            Last Updated: May 16, 2025
          </Text>
          
          <Text style={tw`mb-4`}>
            Please read these Terms of Service ("Terms") carefully before using the Jung mobile application ("App") operated by Jung ("we", "our", or "us").
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Acceptance of Terms</Text>
          
          <Text style={tw`mb-4`}>
            By accessing or using the App, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the App.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Use of the App</Text>
          
          <Text style={tw`mb-4`}>
            The Jung App is designed for self-reflection and personal growth. It is not a substitute for professional mental health services. The App does not provide medical advice, diagnosis, or treatment.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>User Accounts</Text>
          
          <Text style={tw`mb-4`}>
            When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Intellectual Property</Text>
          
          <Text style={tw`mb-4`}>
            The App and its original content, features, and functionality are owned by Jung and are protected by international copyright, trademark, and other intellectual property laws.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Limitation of Liability</Text>
          
          <Text style={tw`mb-4`}>
            In no event shall Jung, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Changes to Terms</Text>
          
          <Text style={tw`mb-4`}>
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page and updating the "Last Updated" date.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Governing Law</Text>
          
          <Text style={tw`mb-4`}>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Jung is established.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Contact Us</Text>
          
          <Text style={tw`mb-12`}>
            If you have any questions about these Terms, please contact us at terms@jungapp.com.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}; 