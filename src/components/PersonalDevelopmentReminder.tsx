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

interface PersonalDevelopmentReminderProps {
  onDismiss?: () => void;
  style?: any;
}

export const PersonalDevelopmentReminder: React.FC<PersonalDevelopmentReminderProps> = ({
  onDismiss,
  style
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleResourcesContact = () => {
    Alert.alert(
      'Growth Resources',
      'Explore additional resources for personal development:\n\n• Professional life coaching\n• Personal development courses\n• Books and educational content\n• Community support groups',
      [
        { text: 'Find Coaches', onPress: () => Linking.openURL('https://www.lifecoach.com') },
        { text: 'Explore Courses', onPress: () => Linking.openURL('https://www.coursera.org/browse/personal-development') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={[tw`bg-blue-100 border border-blue-400 rounded-lg p-3 mx-4 mb-3`, style]}>
      <View style={tw`flex-row items-start`}>
        <Ionicons name="bulb" size={20} color="#2563EB" style={tw`mr-2 mt-0.5`} />
        <View style={tw`flex-1`}>
          <Text style={tw`text-blue-800 font-medium text-sm`}>
            Personal Development Tool
          </Text>
          <Text style={tw`text-blue-700 text-xs mt-1`}>
            This conversation is for self-improvement and educational purposes.
          </Text>

          <View style={tw`flex-row items-center mt-2`}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(true)}
              style={tw`bg-blue-600 px-3 py-1 rounded mr-2`}
            >
              <Text style={tw`text-white text-xs font-medium`}>Learn More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResourcesContact}
              style={tw`bg-green-600 px-3 py-1 rounded mr-2`}
            >
              <Text style={tw`text-white text-xs font-medium`}>🌟 Resources</Text>
            </TouchableOpacity>

            {onDismiss && (
              <TouchableOpacity onPress={onDismiss}>
                <Ionicons name="close" size={18} color="#2563EB" />
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
          <View style={tw`bg-blue-600 px-6 py-4 flex-row items-center justify-between`}>
            <Text style={tw`text-white text-lg font-bold`}>
              Personal Development Guide
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={tw`flex-1 px-6 py-4`}>
            <View style={tw`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-blue-800 font-bold text-base mb-2`}>
                🎯 This is a Personal Development Tool
              </Text>
              <Text style={tw`text-blue-700 text-sm leading-5`}>
                Jung provides educational content, self-reflection tools, and personal growth insights.
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-800 font-semibold text-lg mb-2`}>
                Perfect for:
              </Text>
              <Text style={tw`text-gray-700 text-sm leading-6`}>
                • Goal setting and achievement{'\n'}
                • Building self-awareness and confidence{'\n'}
                • Exploring life purpose and meaning{'\n'}
                • Learning from philosophical wisdom{'\n'}
                • Developing better habits and mindset{'\n'}
                • Personal reflection and growth planning
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-800 font-semibold text-lg mb-2`}>
                Enhance Your Journey:
              </Text>
              <Text style={tw`text-gray-700 text-sm leading-6`}>
                • Work with professional life coaches{'\n'}
                • Join personal development communities{'\n'}
                • Take courses and read books{'\n'}
                • Practice mindfulness and meditation{'\n'}
                • Set and track meaningful goals
              </Text>
            </View>

            <View style={tw`bg-green-50 border border-green-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-green-800 font-bold text-base mb-2`}>
                🌟 Ready to Grow?
              </Text>
              <Text style={tw`text-green-700 text-sm leading-5 mb-3`}>
                Explore additional resources to accelerate your personal development:
              </Text>
              <TouchableOpacity
                onPress={handleResourcesContact}
                style={tw`bg-green-600 px-4 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-semibold text-center`}>
                  🔗 Find Growth Resources
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-600 text-xs leading-5 text-center`}>
              Jung is designed to inspire and guide your personal development journey.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};