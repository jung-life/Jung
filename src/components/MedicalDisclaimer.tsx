import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import tw from '../lib/tailwind';
import { Ionicons } from '@expo/vector-icons';

interface MedicalDisclaimerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Resources',
      'If you are in crisis or having thoughts of self-harm:\n\n• Call 988 (Suicide & Crisis Lifeline)\n• Call 911 for immediate emergency\n• Go to your nearest emergency room',
      [
        { text: 'Call 988', onPress: () => Linking.openURL('tel:988') },
        { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDecline}
    >
      <View style={tw`flex-1 bg-gray-900`}>
        {/* Header */}
        <View style={tw`bg-red-600 px-6 py-4 flex-row items-center`}>
          <Ionicons name="warning" size={24} color="white" style={tw`mr-3`} />
          <Text style={tw`text-white text-xl font-bold flex-1`}>
            Important Medical Disclaimer
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={tw`flex-1 px-6 py-4`}
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          <View style={tw`bg-red-50 border border-red-200 rounded-lg p-4 mb-6`}>
            <Text style={tw`text-red-800 font-bold text-lg mb-2`}>
              ⚠️ CRITICAL NOTICE
            </Text>
            <Text style={tw`text-red-700 text-base leading-6`}>
              This app is for educational and self-reflection purposes only.
            </Text>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-white text-2xl font-bold mb-4`}>
              Jung AI Disclaimer
            </Text>

            <Text style={tw`text-gray-300 text-base leading-7 mb-4`}>
              Jung AI is designed for self-reflection, personal growth, and educational purposes only. This application and its AI-powered conversations:
            </Text>

            <View style={tw`mb-4`}>
              <Text style={tw`text-red-400 font-semibold text-lg mb-2`}>
                Does NOT provide:
              </Text>
              <Text style={tw`text-gray-300 text-base leading-6 ml-4`}>
                • Medical advice, diagnosis, or treatment{'\n'}
                • Professional therapy or counseling{'\n'}
                • Crisis intervention or emergency support{'\n'}
                • Treatment for mental health conditions
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-yellow-400 font-semibold text-lg mb-2`}>
                Should NOT be used:
              </Text>
              <Text style={tw`text-gray-300 text-base leading-6 ml-4`}>
                • As a replacement for professional mental health care{'\n'}
                • For diagnosing mental health conditions{'\n'}
                • During mental health emergencies{'\n'}
                • When experiencing thoughts of self-harm
              </Text>
            </View>

            <View style={tw`bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-yellow-200 font-bold text-lg mb-2`}>
                🚨 EMERGENCY SITUATIONS
              </Text>
              <Text style={tw`text-yellow-100 text-base leading-6 mb-3`}>
                If you are experiencing thoughts of self-harm or are in a mental health crisis, do not use this app. Instead:
              </Text>
              <TouchableOpacity
                onPress={handleEmergencyContact}
                style={tw`bg-red-600 px-4 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-semibold text-center`}>
                  📞 Get Immediate Help
                </Text>
              </TouchableOpacity>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-green-400 font-semibold text-lg mb-2`}>
                IMPORTANT RECOMMENDATIONS:
              </Text>
              <Text style={tw`text-gray-300 text-base leading-6 ml-4`}>
                • Always consult qualified mental health professionals for medical concerns{'\n'}
                • Use this app as a supplement to, not replacement for, professional care{'\n'}
                • Discuss any insights with your healthcare provider{'\n'}
                • Seek professional help if you experience persistent mental health symptoms
              </Text>
            </View>

            <View style={tw`bg-blue-900 border border-blue-600 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-blue-200 font-bold text-base mb-2`}>
                Data & Methodology
              </Text>
              <Text style={tw`text-blue-100 text-sm leading-5`}>
                Jung AI uses artificial intelligence trained on psychological concepts and therapeutic approaches. The AI responses are generated based on patterns in training data and should not be considered professional advice. No health measurements or medical data are collected or analyzed.
              </Text>
            </View>

            <Text style={tw`text-gray-400 text-sm leading-6 mb-6`}>
              By continuing to use Jung AI, you acknowledge that:
              {'\n\n'}
              • You understand this is not medical treatment
              {'\n'}
              • You will seek professional help for medical concerns
              {'\n'}
              • You will not rely on this app for emergency situations
              {'\n'}
              • You are using this app for educational and self-reflection purposes only
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={tw`px-6 py-4 border-t border-gray-700`}>
          <View style={tw`flex-row space-x-3`}>
            <TouchableOpacity
              onPress={onDecline}
              style={tw`flex-1 bg-gray-600 py-4 rounded-lg`}
            >
              <Text style={tw`text-white text-center font-semibold text-lg`}>
                I Do Not Accept
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAccept}
              disabled={!hasScrolledToBottom}
              style={[
                tw`flex-1 py-4 rounded-lg`,
                hasScrolledToBottom ? tw`bg-blue-600` : tw`bg-gray-500`
              ]}
            >
              <Text style={tw`text-white text-center font-semibold text-lg`}>
                I Understand & Accept
              </Text>
            </TouchableOpacity>
          </View>

          {!hasScrolledToBottom && (
            <Text style={tw`text-gray-400 text-center text-sm mt-2`}>
              Please scroll to read the full disclaimer
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};