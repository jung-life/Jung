import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import tw from '../lib/tailwind';

const { width, height } = Dimensions.get('window');

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface InteractiveTourProps {
  visible: boolean;
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  visible,
  steps,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [tooltipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      tooltipAnim.setValue(0);
    }
  }, [visible, currentStep]);

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.action) {
      step.action();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  if (!currentStepData) return null;

  const getTooltipPosition = () => {
    const { targetArea, position } = currentStepData;
    const tooltipPadding = 20;
    const tooltipHeight = 200;
    const tooltipWidth = width - 40;

    switch (position) {
      case 'top':
        return {
          top: targetArea.y - tooltipHeight - tooltipPadding,
          left: Math.max(20, Math.min(targetArea.x - tooltipWidth / 2 + targetArea.width / 2, width - tooltipWidth - 20)),
        };
      case 'bottom':
        return {
          top: targetArea.y + targetArea.height + tooltipPadding,
          left: Math.max(20, Math.min(targetArea.x - tooltipWidth / 2 + targetArea.width / 2, width - tooltipWidth - 20)),
        };
      case 'left':
        return {
          top: Math.max(20, targetArea.y - tooltipHeight / 2 + targetArea.height / 2),
          left: Math.max(20, targetArea.x - tooltipWidth - tooltipPadding),
        };
      case 'right':
        return {
          top: Math.max(20, targetArea.y - tooltipHeight / 2 + targetArea.height / 2),
          left: Math.min(targetArea.x + targetArea.width + tooltipPadding, width - tooltipWidth - 20),
        };
      default:
        return {
          top: height / 2 - tooltipHeight / 2,
          left: 20,
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          tw`flex-1`,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        {/* Dark overlay with spotlight */}
        <View style={tw`flex-1 relative`}>
          {/* Dark background */}
          <View style={tw`absolute inset-0 bg-black/70`} />

          {/* Spotlight cutout */}
          <View
            style={[
              tw`absolute bg-transparent border-4 border-white/50 rounded-lg`,
              {
                left: currentStepData.targetArea.x - 4,
                top: currentStepData.targetArea.y - 4,
                width: currentStepData.targetArea.width + 8,
                height: currentStepData.targetArea.height + 8,
              },
            ]}
          />

          {/* Animated pulse effect */}
          <Animated.View
            style={[
              tw`absolute rounded-lg`,
              {
                left: currentStepData.targetArea.x - 8,
                top: currentStepData.targetArea.y - 8,
                width: currentStepData.targetArea.width + 16,
                height: currentStepData.targetArea.height + 16,
                borderWidth: 2,
                borderColor: '#667eea',
                opacity: tooltipAnim,
              },
            ]}
          />

          {/* Tooltip */}
          <Animated.View
            style={[
              tw`absolute`,
              {
                ...tooltipPosition,
                transform: [
                  {
                    scale: tooltipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: tooltipAnim,
              },
            ]}
          >
            <View style={tw`bg-white rounded-2xl p-6 shadow-2xl max-w-sm`}>
              {/* Header */}
              <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={tw`flex-1 pr-4`}>
                  <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
                    {currentStepData.title}
                  </Text>
                  <Text style={tw`text-gray-600 leading-6`}>
                    {currentStepData.description}
                  </Text>
                </View>
                <TouchableOpacity onPress={onSkip}>
                  <SafePhosphorIcon iconType="X" size={20} color="#6B7280" weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Progress indicator */}
              <View style={tw`flex-row items-center mb-4`}>
                <Text style={tw`text-sm text-gray-500 mr-3`}>
                  {currentStep + 1} of {steps.length}
                </Text>
                <View style={tw`flex-1 bg-gray-200 rounded-full h-2`}>
                  <View
                    style={[
                      tw`bg-jung-purple rounded-full h-2`,
                      { width: `${((currentStep + 1) / steps.length) * 100}%` }
                    ]}
                  />
                </View>
              </View>

              {/* Navigation buttons */}
              <View style={tw`flex-row space-x-3`}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    onPress={handlePrevious}
                    style={tw`bg-gray-100 rounded-xl py-3 px-4 flex-1`}
                  >
                    <Text style={tw`text-gray-700 font-medium text-center`}>Previous</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleNext}
                  style={tw`bg-jung-purple rounded-xl py-3 px-4 flex-1`}
                >
                  <Text style={tw`text-white font-medium text-center`}>
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Arrow pointer */}
            <View
              style={[
                tw`absolute w-4 h-4 bg-white`,
                currentStepData.position === 'top' && tw`-bottom-2 left-1/2 -ml-2`,
                currentStepData.position === 'bottom' && tw`-top-2 left-1/2 -ml-2`,
                currentStepData.position === 'left' && tw`-right-2 top-1/2 -mt-2`,
                currentStepData.position === 'right' && tw`-left-2 top-1/2 -mt-2`,
                { transform: [{ rotate: '45deg' }] },
              ]}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Pre-defined tour configurations
export const createConversationTour = (): TourStep[] => [
  {
    id: 'new-conversation',
    title: 'Start a New Conversation',
    description: 'Tap the + button to begin a conversation with your chosen AI guide.',
    targetArea: { x: width - 80, y: 100, width: 60, height: 60 },
    position: 'left',
  },
  {
    id: 'choose-avatar',
    title: 'Choose Your AI Guide',
    description: 'Each avatar has a unique personality. Pick one that matches your current needs.',
    targetArea: { x: 20, y: 200, width: width - 40, height: 120 },
    position: 'bottom',
  },
  {
    id: 'start-typing',
    title: 'Share Your Thoughts',
    description: 'Type your message here. Be open and honest - your AI guide is here to help.',
    targetArea: { x: 20, y: height - 100, width: width - 40, height: 60 },
    position: 'top',
  },
];

export const createInsightsTour = (): TourStep[] => [
  {
    id: 'insights-tab',
    title: 'View Your Insights',
    description: 'Access detailed analytics about your conversations and emotional patterns.',
    targetArea: { x: width / 2 - 40, y: height - 80, width: 80, height: 60 },
    position: 'top',
  },
  {
    id: 'mood-tracker',
    title: 'Track Your Mood',
    description: 'See how your emotional state changes over time with visual charts.',
    targetArea: { x: 20, y: 150, width: width - 40, height: 100 },
    position: 'bottom',
  },
  {
    id: 'export-data',
    title: 'Export Your Data',
    description: 'Premium users can export their conversation history and insights.',
    targetArea: { x: width - 100, y: 100, width: 80, height: 40 },
    position: 'left',
  },
];

// Smart tour component that adapts to user context
interface SmartTourProps {
  visible: boolean;
  tourType: 'conversation' | 'insights' | 'subscription';
  onComplete: () => void;
  onSkip: () => void;
}

export const SmartTour: React.FC<SmartTourProps> = ({
  visible,
  tourType,
  onComplete,
  onSkip
}) => {
  const getTourSteps = () => {
    switch (tourType) {
      case 'conversation':
        return createConversationTour();
      case 'insights':
        return createInsightsTour();
      default:
        return [];
    }
  };

  return (
    <InteractiveTour
      visible={visible}
      steps={getTourSteps()}
      onComplete={onComplete}
      onSkip={onSkip}
    />
  );
};