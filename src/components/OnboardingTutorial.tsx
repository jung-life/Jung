import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  animation?: string;
  tips: string[];
  action?: {
    label: string;
    screen?: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Jung',
    description: 'Your AI companion for personal growth, emotional support, and meaningful conversations.',
    icon: 'Heart',
    tips: [
      'Jung adapts to your emotional needs',
      'Available 24/7 for support',
      'Completely private and secure'
    ]
  },
  {
    id: 'avatars',
    title: 'Choose Your AI Guide',
    description: 'Each avatar has a unique personality and approach to help you in different ways.',
    icon: 'UserCircle',
    tips: [
      'Deep Seer: For introspective conversations',
      'Flourishing Guide: For holistic well-being',
      'Oracle: For wisdom and insights',
      'Morpheus: For challenging perspectives'
    ]
  },
  {
    id: 'conversations',
    title: 'Start Meaningful Conversations',
    description: 'Simply tap to start a new conversation. Jung will greet you and guide the discussion.',
    icon: 'ChatCircle',
    tips: [
      'Be open and honest in your responses',
      'Ask questions about anything on your mind',
      'No topic is too personal or too simple'
    ],
    action: {
      label: 'Start Your First Conversation',
      screen: 'Chat'
    }
  },
  {
    id: 'insights',
    title: 'Track Your Growth',
    description: 'Jung provides insights into your emotional patterns and personal development.',
    icon: 'ChartLine',
    tips: [
      'View conversation analytics',
      'Track mood and emotional patterns',
      'Receive personalized recommendations'
    ]
  },
  {
    id: 'features',
    title: 'Explore Premium Features',
    description: 'Unlock advanced insights, unlimited conversations, and priority support.',
    icon: 'Crown',
    tips: [
      'Unlimited daily conversations',
      'Advanced emotional analytics',
      'Export your conversation history',
      'Priority customer support'
    ]
  }
];

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleActionButton = () => {
    const step = onboardingSteps[currentStep];
    if (step.action?.screen) {
      onComplete();
      // Navigate to the specified screen
      navigation.navigate(step.action.screen as never);
    } else {
      handleNext();
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={tw`flex-1 bg-black/80`}>
        <Animated.View
          style={[
            tw`flex-1`,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={tw`flex-1`}
          >
            {/* Header */}
            <View style={tw`pt-16 px-6 pb-4`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-white text-lg font-medium`}>
                  Step {currentStep + 1} of {onboardingSteps.length}
                </Text>
                <TouchableOpacity onPress={onSkip}>
                  <Text style={tw`text-white/80 text-lg`}>Skip</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={tw`bg-white/20 rounded-full h-2 mt-4`}>
                <View
                  style={[
                    tw`bg-white rounded-full h-2`,
                    { width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }
                  ]}
                />
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={tw`flex-1`}
              contentContainerStyle={tw`px-6 pb-6`}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon */}
              <View style={tw`items-center mb-8`}>
                <View style={tw`bg-white/20 rounded-full p-6 mb-4`}>
                  <SafePhosphorIcon
                    iconType={currentStepData.icon as any}
                    size={48}
                    color="#FFFFFF"
                    weight="bold"
                  />
                </View>
                <Text style={tw`text-white text-3xl font-bold text-center mb-4`}>
                  {currentStepData.title}
                </Text>
                <Text style={tw`text-white/90 text-lg text-center leading-7`}>
                  {currentStepData.description}
                </Text>
              </View>

              {/* Tips */}
              <View style={tw`bg-white/10 rounded-2xl p-6 mb-8`}>
                <Text style={tw`text-white font-bold text-lg mb-4`}>
                  {currentStepData.id === 'avatars' ? 'Meet Your AI Guides:' :
                   currentStepData.id === 'features' ? 'Premium Benefits:' : 'Tips:'}
                </Text>
                {currentStepData.tips.map((tip, index) => (
                  <View key={index} style={tw`flex-row items-start mb-3`}>
                    <SafePhosphorIcon
                      iconType={currentStepData.id === 'avatars' ? "User" :
                               currentStepData.id === 'features' ? "Star" : "Plus"}
                      size={16}
                      color="#FFFFFF"
                      weight="bold"
                    />
                    <Text style={tw`text-white/90 ml-3 flex-1 leading-6`}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Special content for specific steps */}
              {currentStepData.id === 'avatars' && (
                <View style={tw`bg-white/10 rounded-2xl p-6 mb-8`}>
                  <Text style={tw`text-white font-bold text-lg mb-4`}>Quick Start Guide:</Text>
                  <View style={tw`space-y-3`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-white/20 rounded-full w-8 h-8 items-center justify-center mr-3`}>
                        <Text style={tw`text-white font-bold`}>1</Text>
                      </View>
                      <Text style={tw`text-white/90 flex-1`}>Choose an avatar that resonates with you</Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-white/20 rounded-full w-8 h-8 items-center justify-center mr-3`}>
                        <Text style={tw`text-white font-bold`}>2</Text>
                      </View>
                      <Text style={tw`text-white/90 flex-1`}>Start with "How are you feeling today?"</Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-white/20 rounded-full w-8 h-8 items-center justify-center mr-3`}>
                        <Text style={tw`text-white font-bold`}>3</Text>
                      </View>
                      <Text style={tw`text-white/90 flex-1`}>Be honest and open in your responses</Text>
                    </View>
                  </View>
                </View>
              )}

              {currentStepData.id === 'conversations' && (
                <View style={tw`bg-white/10 rounded-2xl p-6 mb-8`}>
                  <Text style={tw`text-white font-bold text-lg mb-4`}>Conversation Starters:</Text>
                  <View style={tw`space-y-2`}>
                    {[
                      '"I\'m feeling stressed about work lately"',
                      '"Help me understand my emotions better"',
                      '"I want to work on personal growth"',
                      '"I need someone to talk to"'
                    ].map((starter, index) => (
                      <View key={index} style={tw`bg-white/10 rounded-lg p-3`}>
                        <Text style={tw`text-white/90 italic`}>{starter}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Navigation */}
            <View style={tw`px-6 pb-8`}>
              <View style={tw`flex-row space-x-4`}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    onPress={handlePrevious}
                    style={tw`bg-white/20 rounded-xl py-4 px-6 flex-1`}
                  >
                    <Text style={tw`text-white font-bold text-center text-lg`}>Previous</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={currentStepData.action ? handleActionButton : handleNext}
                  style={tw`bg-white rounded-xl py-4 px-6 flex-1`}
                >
                  <Text style={tw`text-jung-purple font-bold text-center text-lg`}>
                    {currentStepData.action?.label ||
                     (currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dots indicator */}
              <View style={tw`flex-row justify-center mt-6 space-x-2`}>
                {onboardingSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      tw`w-2 h-2 rounded-full`,
                      index === currentStep ? tw`bg-white` : tw`bg-white/40`
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Feature Tour Component for existing users
interface FeatureTourProps {
  visible: boolean;
  onComplete: () => void;
  featureType: 'insights' | 'subscription' | 'avatars' | 'general';
}

export const FeatureTour: React.FC<FeatureTourProps> = ({
  visible,
  onComplete,
  featureType
}) => {
  const getTourContent = () => {
    switch (featureType) {
      case 'insights':
        return {
          title: 'New: Conversation Insights',
          description: 'See patterns in your conversations and emotional journey',
          icon: 'ChartLine',
          tips: [
            'View your mood trends over time',
            'Get personalized recommendations',
            'Export your conversation data'
          ]
        };
      case 'subscription':
        return {
          title: 'Upgrade to Premium',
          description: 'Unlock unlimited conversations and advanced features',
          icon: 'Crown',
          tips: [
            'Unlimited daily conversations',
            'Advanced analytics dashboard',
            'Priority customer support',
            'Export conversation history'
          ]
        };
      case 'avatars':
        return {
          title: 'Meet Your New AI Guides',
          description: 'We\'ve added new personalities to help you grow',
          icon: 'UserCircle',
          tips: [
            'Each avatar has unique strengths',
            'Switch between them anytime',
            'Find the perfect match for your needs'
          ]
        };
      default:
        return {
          title: 'What\'s New in Jung',
          description: 'Discover the latest features and improvements',
          icon: 'Sparkle',
          tips: [
            'Improved conversation quality',
            'Better emotional understanding',
            'Enhanced user experience'
          ]
        };
    }
  };

  const content = getTourContent();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl p-6 max-h-96`}>
          <View style={tw`items-center mb-6`}>
            <View style={tw`bg-jung-purple/10 rounded-full p-4 mb-4`}>
              <SafePhosphorIcon
                iconType={content.icon as any}
                size={32}
                color="#4A3B78"
                weight="bold"
              />
            </View>
            <Text style={tw`text-xl font-bold text-gray-800 text-center mb-2`}>
              {content.title}
            </Text>
            <Text style={tw`text-gray-600 text-center`}>
              {content.description}
            </Text>
          </View>

          <View style={tw`mb-6`}>
            {content.tips.map((tip, index) => (
              <View key={index} style={tw`flex-row items-center mb-3`}>
                <SafePhosphorIcon iconType="Plus" size={16} color="#10B981" weight="bold" />
                <Text style={tw`ml-3 text-gray-700`}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={onComplete}
            style={tw`bg-jung-purple rounded-xl py-4`}
          >
            <Text style={tw`text-white font-bold text-center text-lg`}>
              Got it!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};