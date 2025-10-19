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

interface PersonalDevelopmentDisclaimerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PersonalDevelopmentDisclaimer: React.FC<PersonalDevelopmentDisclaimerProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleSupportResources = () => {
    Alert.alert(
      'Support Resources',
      'For professional help with life challenges:\n\n• Life coaching services\n• Career counseling\n• Personal development courses\n• Professional therapy (for mental health concerns)',
      [
        { text: 'Learn More', onPress: () => Linking.openURL('https://www.psychologytoday.com') },
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
      transparent={false}
      onRequestClose={onDecline}
    >
      <View style={tw`flex-1 bg-gradient-to-br from-purple-50 to-blue-50`}>
        <View style={tw`bg-purple-600 px-6 py-4 flex-row items-center justify-between`}>
          <Text style={tw`text-white text-lg font-bold`}>
            Welcome to Jung
          </Text>
          <TouchableOpacity onPress={onDecline}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={tw`flex-1 px-6`}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          contentContainerStyle={tw`py-6`}
        >
          <View style={tw`bg-purple-100 border border-purple-300 rounded-lg p-4 mb-6`}>
          <Text style={tw`text-purple-800 font-bold text-xl mb-3`}>
            Personal Development Disclaimer
          </Text>
          <Text style={tw`text-purple-700 text-base leading-6 mb-4`}>
            Jung provides life coaching content and self-improvement tools. This app is designed for personal development and educational purposes only.
          </Text>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-800 font-semibold text-lg mb-3`}>
              🎯 What Jung Offers:
            </Text>
            <Text style={tw`text-gray-700 text-base leading-6 mb-4`}>
              • Personal development conversations and insights{'\n'}
              • Life coaching guidance and goal-setting support{'\n'}
              • Wisdom from philosophical and coaching traditions{'\n'}
              • Self-reflection tools and exercises{'\n'}
              • Educational content about personal growth{'\n'}
              • Mindfulness and awareness-building activities
            </Text>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-800 font-semibold text-lg mb-3`}>
              📚 Educational Purpose:
            </Text>
            <Text style={tw`text-gray-700 text-base leading-6 mb-4`}>
              Jung is an educational and self-improvement tool that draws inspiration from philosophy, ancient wisdom, and modern personal development teachings. Our mentors provide insights based on established wisdom traditions and proven coaching practices.
            </Text>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-800 font-semibold text-lg mb-3`}>
              🤝 When to Seek Professional Help:
            </Text>
            <Text style={tw`text-gray-700 text-base leading-6 mb-4`}>
              For significant life challenges, mental health concerns, or professional guidance needs:{'\n\n'}
              • Licensed life coaches or career counselors{'\n'}
              • Professional therapists for mental health support{'\n'}
              • Career guidance services{'\n'}
              • Educational institutions and courses{'\n'}
              • Support groups and communities
            </Text>
          </View>

          <View style={tw`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6`}>
            <Text style={tw`text-blue-800 font-bold text-base mb-2`}>
              🌟 Your Personal Growth Journey
            </Text>
            <Text style={tw`text-blue-700 text-sm leading-5 mb-3`}>
              Jung is designed to complement your personal development journey with insights, reflections, and educational content.
            </Text>
            <TouchableOpacity
              onPress={handleSupportResources}
              style={tw`bg-blue-600 px-4 py-3 rounded-lg`}
            >
              <Text style={tw`text-white font-semibold text-center`}>
                🔗 Find Professional Resources
              </Text>
            </TouchableOpacity>
          </View>

          <View style={tw`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6`}>
            <Text style={tw`text-gray-800 font-semibold text-base mb-2`}>
              📖 Terms of Use:
            </Text>
            <Text style={tw`text-gray-600 text-sm leading-5`}>
              By using Jung, you acknowledge that this app is for personal development and educational purposes. The mentors provide general guidance based on established wisdom traditions and should not replace professional advice for serious life decisions.
            </Text>
          </View>

          <Text style={tw`text-gray-600 text-xs leading-5 text-center mb-4`}>
            Jung is your companion for personal growth, self-discovery, and lifelong learning.
          </Text>
        </ScrollView>

        <View style={tw`bg-white border-t border-gray-200 px-6 py-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <TouchableOpacity
              onPress={onDecline}
              style={tw`bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-3`}
            >
              <Text style={tw`text-gray-800 font-semibold text-center`}>
                Not Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAccept}
              disabled={!hasScrolledToBottom}
              style={[
                tw`px-6 py-3 rounded-lg flex-1 ml-3`,
                hasScrolledToBottom
                  ? tw`bg-purple-600`
                  : tw`bg-gray-300`
              ]}
            >
              <Text style={[
                tw`font-semibold text-center`,
                hasScrolledToBottom
                  ? tw`text-white`
                  : tw`text-gray-500`
              ]}>
                Begin Journey
              </Text>
            </TouchableOpacity>
          </View>

          {!hasScrolledToBottom && (
            <Text style={tw`text-gray-500 text-xs text-center mt-2`}>
              Please read the full disclaimer to continue
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};