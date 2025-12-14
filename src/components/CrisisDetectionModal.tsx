// Crisis Detection Modal for Jung Therapeutic AI
// Provides immediate safety resources and emergency contact information

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export interface CrisisDetectionModalProps {
  visible: boolean;
  severity: 'low' | 'medium' | 'high';
  onClose: () => void;
  onContinueConversation: () => void;
  userMessage?: string;
}

interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  availability: string;
  type: 'call' | 'text' | 'web';
  icon: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    number: '988',
    description: 'Free, confidential crisis support 24/7',
    availability: '24/7',
    type: 'call',
    icon: 'call'
  },
  {
    name: 'Crisis Text Line',
    number: '741741',
    description: 'Text HOME for immediate crisis support',
    availability: '24/7',
    type: 'text',
    icon: 'chatbox'
  },
  {
    name: 'National Domestic Violence Hotline',
    number: '1-800-799-7233',
    description: 'Support for domestic violence situations',
    availability: '24/7',
    type: 'call',
    icon: 'shield'
  },
  {
    name: 'SAMHSA Helpline',
    number: '1-800-662-4357',
    description: 'Mental health and substance abuse support',
    availability: '24/7',
    type: 'call',
    icon: 'medical'
  }
];\n\nexport const CrisisDetectionModal: React.FC<CrisisDetectionModalProps> = ({\n  visible,\n  severity,\n  onClose,\n  onContinueConversation,\n  userMessage\n}) => {\n  const [hasCalledForHelp, setHasCalledForHelp] = useState(false);\n  const [showMoreResources, setShowMoreResources] = useState(false);\n\n  const handleEmergencyContact = async (contact: EmergencyContact) => {\n    try {\n      let url: string;\n      \n      if (contact.type === 'call') {\n        url = `tel:${contact.number}`;\n      } else if (contact.type === 'text') {\n        url = `sms:${contact.number}${contact.number === '741741' ? '&body=HOME' : ''}`;\n      } else {\n        url = `https://${contact.number}`; // For web resources\n      }\n      \n      const supported = await Linking.canOpenURL(url);\n      \n      if (supported) {\n        await Linking.openURL(url);\n        setHasCalledForHelp(true);\n      } else {\n        Alert.alert(\n          'Contact Information',\n          `Please contact: ${contact.number}\\n${contact.description}`,\n          [{ text: 'Copy Number', onPress: () => copyToClipboard(contact.number) }]\n        );\n      }\n    } catch (error) {\n      Alert.alert(\n        'Contact Information', \n        `${contact.name}: ${contact.number}\\n${contact.description}`\n      );\n    }\n  };\n\n  const copyToClipboard = (text: string) => {\n    // Note: In a real app, you'd use @react-native-clipboard/clipboard\n    Alert.alert('Phone Number', text);\n  };\n\n  const handleEmergencyServices = () => {\n    Alert.alert(\n      'Emergency Services',\n      'If you are in immediate danger, please call 911 or go to your nearest emergency room.',\n      [\n        { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },\n        { text: 'Find Hospital', onPress: () => Linking.openURL('https://maps.google.com/search/emergency+room+near+me') },\n        { text: 'Cancel', style: 'cancel' }\n      ]\n    );\n  };\n\n  const getSeverityConfig = () => {\n    switch (severity) {\n      case 'high':\n        return {\n          title: 'Immediate Support Available',\n          backgroundColor: '#DC2626', // Red\n          message: 'Your safety and wellbeing are the top priority. Please reach out for immediate professional support.',\n          showEmergencyFirst: true\n        };\n      case 'medium':\n        return {\n          title: 'Support Resources Available',\n          backgroundColor: '#D97706', // Orange\n          message: 'It sounds like you\\'re going through a difficult time. You don\\'t have to face this alone.',\n          showEmergencyFirst: false\n        };\n      case 'low':\n      default:\n        return {\n          title: 'Additional Support',\n          backgroundColor: '#2563EB', // Blue\n          message: 'While we can continue our conversation, these additional resources are always available.',\n          showEmergencyFirst: false\n        };\n    }\n  };\n\n  const config = getSeverityConfig();\n\n  return (\n    <Modal\n      visible={visible}\n      animationType=\"slide\"\n      presentationStyle=\"pageSheet\"\n      onRequestClose={onClose}\n    >\n      <View style={[tw`flex-1 bg-white`, { backgroundColor: '#f9fafb' }]}>\n        {/* Header */}\n        <View style={[tw`px-6 pt-12 pb-6`, { backgroundColor: config.backgroundColor }]}>\n          <View style={tw`flex-row items-center justify-between`}>\n            <View style={tw`flex-1`}>\n              <Text style={tw`text-white text-2xl font-bold`}>\n                {config.title}\n              </Text>\n              <Text style={tw`text-white text-sm mt-2 opacity-90`}>\n                Available 24/7 • Confidential • Free\n              </Text>\n            </View>\n            {severity !== 'high' && (\n              <TouchableOpacity \n                onPress={onClose}\n                style={tw`p-2 rounded-full bg-white bg-opacity-20`}\n              >\n                <Ionicons name=\"close\" size={24} color=\"white\" />\n              </TouchableOpacity>\n            )}\n          </View>\n        </View>\n\n        <ScrollView style={tw`flex-1 px-6`}>\n          {/* Crisis Message */}\n          <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100`}>\n            <Text style={tw`text-gray-800 text-base leading-6`}>\n              {config.message}\n            </Text>\n          </View>\n\n          {/* Emergency Services (for high severity) */}\n          {config.showEmergencyFirst && (\n            <View style={tw`mb-6`}>\n              <TouchableOpacity\n                onPress={handleEmergencyServices}\n                style={tw`bg-red-600 rounded-xl p-6 shadow-sm`}\n              >\n                <View style={tw`flex-row items-center`}>\n                  <View style={tw`w-12 h-12 bg-white rounded-full items-center justify-center mr-4`}>\n                    <Ionicons name=\"medical\" size={24} color=\"#DC2626\" />\n                  </View>\n                  <View style={tw`flex-1`}>\n                    <Text style={tw`text-white font-semibold text-lg`}>\n                      Emergency Services\n                    </Text>\n                    <Text style={tw`text-white text-sm opacity-90`}>\n                      Call 911 or go to nearest ER\n                    </Text>\n                  </View>\n                  <Ionicons name=\"chevron-forward\" size={24} color=\"white\" />\n                </View>\n              </TouchableOpacity>\n            </View>\n          )}\n\n          {/* Crisis Support Contacts */}\n          <Text style={tw`text-gray-900 text-lg font-semibold mb-4`}>\n            Crisis Support\n          </Text>\n          \n          {EMERGENCY_CONTACTS.slice(0, showMoreResources ? undefined : 2).map((contact, index) => (\n            <TouchableOpacity\n              key={index}\n              onPress={() => handleEmergencyContact(contact)}\n              style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}\n            >\n              <View style={tw`flex-row items-center`}>\n                <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>\n                  <Ionicons name={contact.icon as any} size={20} color=\"#2563EB\" />\n                </View>\n                <View style={tw`flex-1`}>\n                  <Text style={tw`text-gray-900 font-medium text-base`}>\n                    {contact.name}\n                  </Text>\n                  <Text style={tw`text-gray-600 text-sm`}>\n                    {contact.description}\n                  </Text>\n                  <View style={tw`flex-row items-center mt-1`}>\n                    <Text style={tw`text-blue-600 font-medium text-sm`}>\n                      {contact.number}\n                    </Text>\n                    <Text style={tw`text-gray-400 text-xs ml-2`}>\n                      • {contact.availability}\n                    </Text>\n                  </View>\n                </View>\n                <Ionicons name=\"chevron-forward\" size={20} color=\"#9CA3AF\" />\n              </View>\n            </TouchableOpacity>\n          ))}\n\n          {/* Show More/Less Resources */}\n          {!showMoreResources && EMERGENCY_CONTACTS.length > 2 && (\n            <TouchableOpacity\n              onPress={() => setShowMoreResources(true)}\n              style={tw`py-3`}\n            >\n              <Text style={tw`text-blue-600 text-center font-medium`}>\n                Show More Resources\n              </Text>\n            </TouchableOpacity>\n          )}\n\n          {/* Safety Planning */}\n          <View style={tw`bg-blue-50 rounded-xl p-6 mb-6`}>\n            <Text style={tw`text-blue-900 font-semibold text-lg mb-3`}>\n              Immediate Safety Steps\n            </Text>\n            <View style={tw`space-y-3`}>\n              <Text style={tw`text-blue-800 text-base`}>\n                • Reach out to a trusted friend, family member, or crisis counselor\n              </Text>\n              <Text style={tw`text-blue-800 text-base`}>\n                • Remove any means of self-harm from your immediate area\n              </Text>\n              <Text style={tw`text-blue-800 text-base`}>\n                • Stay in a safe, public place with others if possible\n              </Text>\n              <Text style={tw`text-blue-800 text-base`}>\n                • Remember that these feelings are temporary and will pass\n              </Text>\n            </View>\n          </View>\n\n          {/* Professional Help */}\n          <View style={tw`bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100`}>\n            <Text style={tw`text-gray-900 font-semibold text-lg mb-3`}>\n              Professional Support\n            </Text>\n            <Text style={tw`text-gray-700 text-base mb-4`}>\n              Jung is designed to provide support and education, but cannot replace professional mental health care.\n            </Text>\n            <TouchableOpacity\n              onPress={() => Linking.openURL('https://www.psychologytoday.com/us/therapists')}\n              style={tw`bg-gray-100 rounded-lg p-3`}\n            >\n              <Text style={tw`text-blue-600 font-medium text-center`}>\n                Find a Therapist Near You\n              </Text>\n            </TouchableOpacity>\n          </View>\n        </ScrollView>\n\n        {/* Bottom Actions */}\n        <View style={tw`px-6 py-4 bg-white border-t border-gray-200`}>\n          {severity === 'high' ? (\n            <View style={tw`space-y-3`}>\n              <TouchableOpacity\n                onPress={() => handleEmergencyContact(EMERGENCY_CONTACTS[0])}\n                style={tw`bg-red-600 rounded-xl py-4 px-6`}\n              >\n                <Text style={tw`text-white font-semibold text-center text-lg`}>\n                  Call Crisis Support (988)\n                </Text>\n              </TouchableOpacity>\n              <TouchableOpacity\n                onPress={onContinueConversation}\n                style={tw`bg-gray-200 rounded-xl py-3 px-6`}\n              >\n                <Text style={tw`text-gray-700 font-medium text-center`}>\n                  Continue with Jung\n                </Text>\n              </TouchableOpacity>\n            </View>\n          ) : (\n            <View style={tw`space-y-3`}>\n              <TouchableOpacity\n                onPress={onContinueConversation}\n                style={tw`bg-blue-600 rounded-xl py-4 px-6`}\n              >\n                <Text style={tw`text-white font-semibold text-center text-lg`}>\n                  Continue Conversation\n                </Text>\n              </TouchableOpacity>\n              {hasCalledForHelp && (\n                <View style={tw`bg-green-50 rounded-lg p-3`}>\n                  <Text style={tw`text-green-800 text-center text-sm`}>\n                    ✓ You've taken an important step by reaching out for support\n                  </Text>\n                </View>\n              )}\n            </View>\n          )}\n        </View>\n      </View>\n    </Modal>\n  );\n};\n\nconst styles = StyleSheet.create({\n  // Add any custom styles here if needed\n});"