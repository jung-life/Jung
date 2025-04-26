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

export const PrivacyPolicyScreen = () => {
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
            Privacy Policy
          </Text>
        </View>
        
        <ScrollView style={tw`flex-1 p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Jung App Privacy Policy</Text>
          
          <Text style={tw`mb-4`}>
            Last Updated: May 16, 2025
          </Text>
          
          <Text style={tw`mb-4`}>
            This Privacy Policy describes how Jung ("we", "our", or "us") collects, uses, and shares your personal information when you use our mobile application ("App").
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Information We Collect</Text>
          
          <Text style={tw`mb-4`}>
            We collect information that you provide directly to us, such as when you create an account, update your profile, or engage in conversations within the App. This may include:
          </Text>
          
          <Text style={tw`mb-2`}>• Email address</Text>
          <Text style={tw`mb-2`}>• Name (optional)</Text>
          <Text style={tw`mb-2`}>• Profile picture (optional)</Text>
          
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>How We Use Your Information</Text>
          
          <Text style={tw`mb-2`}>We use the information we collect to:</Text>
          <Text style={tw`mb-2`}>• Provide, maintain, and improve our services</Text>
          <Text style={tw`mb-2`}>• Process and complete transactions</Text>
          <Text style={tw`mb-2`}>• Send you technical notices and support messages</Text>
          <Text style={tw`mb-2`}>• Respond to your comments and questions</Text>
          <Text style={tw`mb-4`}>• Develop new products and services</Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Data Security</Text>
          
          <Text style={tw`mb-4`}>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Your Rights</Text>
          
          <Text style={tw`mb-4`}>
            Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Changes to This Privacy Policy</Text>
          
          <Text style={tw`mb-4`}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
          
          <Text style={tw`text-lg font-bold mb-2 mt-6`}>Contact Us</Text>
          
          <Text style={tw`mb-12`}>
            If you have any questions about this Privacy Policy, please contact us at jungapp.ai@gmail.com.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}; 