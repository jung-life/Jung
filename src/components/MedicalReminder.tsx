import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import tw from '../lib/tailwind';
import { Ionicons } from '@expo/vector-icons';

interface MedicalReminderProps {
  onDismiss?: () => void;
  style?: any;
}

export const MedicalReminder: React.FC<MedicalReminderProps> = ({
  onDismiss,
  style
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  return (
    <View style={[tw`bg-yellow-100 border border-yellow-400 rounded-lg p-3 mx-4 mb-3`, style]}>
      <View style={tw`flex-row items-start`}>
        <Ionicons name="warning" size={20} color="#D97706" style={tw`mr-2 mt-0.5`} />
        <View style={tw`flex-1`}>
          <Text style={tw`text-yellow-800 font-medium text-sm`}>
            Educational Content Only
          </Text>
          <Text style={tw`text-yellow-700 text-xs mt-1`}>
            This conversation is for self-reflection and educational purposes. Not medical advice.
          </Text>

          <View style={tw`flex-row items-center mt-2`}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(true)}
              style={tw`bg-yellow-600 px-3 py-1 rounded mr-2`}
            >
              <Text style={tw`text-white text-xs font-medium`}>Learn More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEmergencyContact}
              style={tw`bg-red-600 px-3 py-1 rounded mr-2`}
            >
              <Text style={tw`text-white text-xs font-medium`}>🚨 Crisis Help</Text>
            </TouchableOpacity>

            {onDismiss && (
              <TouchableOpacity onPress={onDismiss}>
                <Ionicons name="close" size={18} color="#D97706" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={tw`flex-1 bg-white`}>
          <View style={tw`bg-yellow-600 px-6 py-4 flex-row items-center justify-between`}>
            <Text style={tw`text-white text-lg font-bold`}>
              Important Reminder
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={tw`flex-1 px-6 py-4`}>
            <View style={tw`bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-yellow-800 font-bold text-base mb-2`}>
                ⚠️ This is Not Medical Treatment
              </Text>
              <Text style={tw`text-yellow-700 text-sm leading-5`}>
                Jung AI provides educational content and self-reflection tools only.
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-800 font-semibold text-lg mb-2`}>
                When to Seek Professional Help:
              </Text>
              <Text style={tw`text-gray-700 text-sm leading-6`}>
                • Persistent feelings of sadness or anxiety{'\n'}
                • Thoughts of self-harm or suicide{'\n'}
                • Difficulty functioning in daily life{'\n'}
                • Substance abuse concerns{'\n'}
                • Relationship or family issues{'\n'}
                • Any mental health concerns
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-800 font-semibold text-lg mb-2`}>
                Professional Resources:
              </Text>
              <Text style={tw`text-gray-700 text-sm leading-6`}>
                • Contact your primary care physician{'\n'}
                • Find a licensed therapist or counselor{'\n'}
                • Speak with a psychiatrist for medication concerns{'\n'}
                • Use your health insurance provider directory{'\n'}
                • Contact your employee assistance program
              </Text>
            </View>

            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-red-800 font-bold text-base mb-2`}>
                🚨 Emergency Situations
              </Text>
              <Text style={tw`text-red-700 text-sm leading-5 mb-3`}>
                If you're having thoughts of self-harm or are in crisis:
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

            <Text style={tw`text-gray-600 text-xs leading-5 text-center`}>
              Jung AI is designed to supplement, not replace, professional mental health care.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};