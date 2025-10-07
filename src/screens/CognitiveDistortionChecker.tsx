import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';
import { ArrowLeft, CheckCircle, Brain, Lightbulb, Heart } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { COGNITIVE_DISTORTIONS, MOOD_STATES, WELLNESS_DISCLAIMERS } from '../data/cognitiveDistortions';
import { ThoughtEntry, CognitiveDistortion } from '../types/cognitiveDistortions';
import { thoughtAnalyticsService } from '../services/thoughtAnalyticsService';
import { useAuth } from '../contexts/AuthContext';

type CheckerStep = 'input' | 'emotion' | 'detect' | 'challenge' | 'reframe' | 'complete';

export const CognitiveDistortionChecker: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState<CheckerStep>('input');
  const [thoughtText, setThoughtText] = useState('');
  const [emotionBefore, setEmotionBefore] = useState<number>(5);
  const [emotionAfter, setEmotionAfter] = useState<number>(5);
  const [detectedDistortions, setDetectedDistortions] = useState<string[]>([]);
  const [selectedDistortion, setSelectedDistortion] = useState<CognitiveDistortion | null>(null);
  const [challengeResponses, setChallengeResponses] = useState<{ [key: string]: string }>({});
  const [reframedThought, setReframedThought] = useState('');

  // Animation
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate step transitions
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleStepTransition = (nextStep: CheckerStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      fadeAnim.setValue(0);
      slideAnim.setValue(-50);
    });
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 'input':
        if (thoughtText.trim()) {
          handleStepTransition('emotion');
        } else {
          Alert.alert('Please enter a thought', 'Write down what\'s going through your mind to continue.');
        }
        break;
      case 'emotion':
        handleStepTransition('detect');
        break;
      case 'detect':
        if (detectedDistortions.length > 0) {
          setSelectedDistortion(COGNITIVE_DISTORTIONS.find(d => d.id === detectedDistortions[0]) || null);
          handleStepTransition('challenge');
        } else {
          Alert.alert('Select a distortion', 'Choose at least one thinking pattern that matches your thought.');
        }
        break;
      case 'challenge':
        handleStepTransition('reframe');
        break;
      case 'reframe':
        if (reframedThought.trim()) {
          handleStepTransition('complete');
        } else {
          Alert.alert('Create a reframe', 'Try to write a more balanced version of your original thought.');
        }
        break;
      case 'complete':
        // Save the entry and navigate back
        await saveThoughtEntry();
        navigation.goBack();
        break;
    }
  };

  const saveThoughtEntry = async () => {
    try {
      const entry: ThoughtEntry = {
        id: Date.now().toString(),
        originalThought: thoughtText,
        reframedThought,
        emotionBefore,
        emotionAfter,
        detectedDistortions,
        timestamp: new Date(),
        userId: user?.id || 'anonymous'
      };

      await thoughtAnalyticsService.saveThoughtEntry(entry);
      console.log('✅ Thought entry saved successfully');
    } catch (error) {
      console.error('❌ Error saving thought entry:', error);
      Alert.alert('Save Error', 'Unable to save your progress. Please try again.');
    }
  };

  const renderProgressBar = () => {
    const steps = ['input', 'emotion', 'detect', 'challenge', 'reframe', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    const progress = (currentIndex / (steps.length - 1)) * 100;

    return (
      <View style={tw`w-full h-2 bg-gray-200 rounded-full mb-6`}>
        <View
          style={[
            tw`h-full bg-blue-500 rounded-full transition-all duration-300`,
            { width: `${progress}%` }
          ]}
        />
      </View>
    );
  };

  const renderStepIndicator = () => {
    const stepInfo = {
      input: { icon: Brain, title: 'Share Your Thought', subtitle: 'What\'s going through your mind?' },
      emotion: { icon: Heart, title: 'Rate Your Feeling', subtitle: 'How does this thought make you feel?' },
      detect: { icon: Brain, title: 'Identify Patterns', subtitle: 'Recognize thinking patterns' },
      challenge: { icon: Lightbulb, title: 'Challenge the Thought', subtitle: 'Question and examine' },
      reframe: { icon: CheckCircle, title: 'Reframe Positively', subtitle: 'Create a balanced perspective' },
      complete: { icon: CheckCircle, title: 'Well Done!', subtitle: 'You\'ve completed the exercise' }
    };

    const step = stepInfo[currentStep];
    const IconComponent = step.icon;

    return (
      <View style={tw`items-center mb-8`}>
        <View style={tw`w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3`}>
          <IconComponent size={24} color="#3B82F6" weight="regular" />
        </View>
        <Text style={tw`text-xl font-semibold text-gray-800 mb-1`}>{step.title}</Text>
        <Text style={tw`text-sm text-gray-600 text-center`}>{step.subtitle}</Text>
      </View>
    );
  };

  const renderInputStep = () => (
    <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-medium text-gray-800 mb-4`}>
        What thought is bothering you right now?
      </Text>
      <TextInput
        style={tw`bg-white p-4 rounded-xl border border-gray-200 text-base min-h-32`}
        placeholder="Write your thought here..."
        placeholderTextColor="#9CA3AF"
        value={thoughtText}
        onChangeText={setThoughtText}
        multiline
        textAlignVertical="top"
        autoFocus
      />
      <Text style={tw`text-xs text-gray-500 mt-2`}>
        Be honest and specific. There's no judgment here.
      </Text>
    </View>
  );

  const renderEmotionStep = () => (
    <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-medium text-gray-800 mb-6 text-center`}>
        How intense is this feeling right now?
      </Text>

      <View style={tw`items-center mb-8`}>
        <Text style={tw`text-4xl mb-2`}>
          {MOOD_STATES.find(m => m.value === emotionBefore)?.emoji}
        </Text>
        <Text style={tw`text-lg font-medium text-gray-700`}>
          {MOOD_STATES.find(m => m.value === emotionBefore)?.label}
        </Text>
      </View>

      <View style={tw`flex-row justify-between items-center mb-6`}>
        <Text style={tw`text-sm text-gray-600`}>Distressed</Text>
        <Text style={tw`text-sm text-gray-600`}>Calm</Text>
      </View>

      <View style={tw`flex-row justify-between mb-8`}>
        {MOOD_STATES.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            onPress={() => setEmotionBefore(mood.value)}
            style={[
              tw`w-8 h-8 rounded-full border-2`,
              emotionBefore === mood.value
                ? tw`border-blue-500`
                : tw`border-gray-300`,
              { backgroundColor: emotionBefore === mood.value ? mood.color : 'transparent' }
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderDetectStep = () => (
    <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-medium text-gray-800 mb-4`}>
        Which thinking patterns do you notice?
      </Text>
      <Text style={tw`text-sm text-gray-600 mb-6`}>
        Select any that seem to match your thought:
      </Text>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {COGNITIVE_DISTORTIONS.map((distortion) => (
          <TouchableOpacity
            key={distortion.id}
            onPress={() => {
              if (detectedDistortions.includes(distortion.id)) {
                setDetectedDistortions(prev => prev.filter(id => id !== distortion.id));
              } else {
                setDetectedDistortions(prev => [...prev, distortion.id]);
              }
            }}
            style={[
              tw`p-4 rounded-xl mb-3 border`,
              detectedDistortions.includes(distortion.id)
                ? tw`bg-blue-50 border-blue-300`
                : tw`bg-white border-gray-200`
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <Text style={tw`text-lg mr-2`}>{distortion.icon}</Text>
              <Text style={tw`text-base font-medium text-gray-800 flex-1`}>
                {distortion.name}
              </Text>
              {detectedDistortions.includes(distortion.id) && (
                <CheckCircle size={20} color="#3B82F6" weight="fill" />
              )}
            </View>
            <Text style={tw`text-sm text-gray-600 mb-2`}>
              {distortion.description}
            </Text>
            <Text style={tw`text-xs text-gray-500 italic`}>
              Example: "{distortion.examples[0]}"
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderChallengeStep = () => {
    if (!selectedDistortion) return null;

    return (
      <View style={tw`flex-1`}>
        <View style={tw`bg-blue-50 p-4 rounded-xl mb-6`}>
          <Text style={tw`text-base font-medium text-blue-800 mb-1`}>
            {selectedDistortion.icon} {selectedDistortion.name}
          </Text>
          <Text style={tw`text-sm text-blue-700`}>
            {selectedDistortion.description}
          </Text>
        </View>

        <Text style={tw`text-lg font-medium text-gray-800 mb-4`}>
          Let's challenge this thought:
        </Text>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          {selectedDistortion.challengeQuestions.map((question, index) => (
            <View key={index} style={tw`mb-6`}>
              <Text style={tw`text-base text-gray-700 mb-2`}>
                {index + 1}. {question}
              </Text>
              <TextInput
                style={tw`bg-white p-3 rounded-lg border border-gray-200 text-sm`}
                placeholder="Your reflection..."
                placeholderTextColor="#9CA3AF"
                value={challengeResponses[index.toString()] || ''}
                onChangeText={(text) =>
                  setChallengeResponses(prev => ({ ...prev, [index.toString()]: text }))
                }
                multiline
                textAlignVertical="top"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReframeStep = () => (
    <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-medium text-gray-800 mb-4`}>
        Create a more balanced thought:
      </Text>

      <View style={tw`bg-gray-50 p-4 rounded-xl mb-6`}>
        <Text style={tw`text-sm text-gray-600 mb-1`}>Original thought:</Text>
        <Text style={tw`text-base text-gray-800 italic`}>"{thoughtText}"</Text>
      </View>

      <Text style={tw`text-base text-gray-700 mb-3`}>
        Based on your reflections, how could you reframe this thought?
      </Text>

      <TextInput
        style={tw`bg-white p-4 rounded-xl border border-gray-200 text-base min-h-32 mb-4`}
        placeholder="Write a more balanced, realistic version..."
        placeholderTextColor="#9CA3AF"
        value={reframedThought}
        onChangeText={setReframedThought}
        multiline
        textAlignVertical="top"
      />

      <View style={tw`bg-green-50 p-3 rounded-lg`}>
        <Text style={tw`text-sm text-green-700`}>
          💡 Try to be compassionate and realistic. What would you tell a good friend?
        </Text>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-medium text-gray-800 mb-6 text-center`}>
        How do you feel now after working through this thought?
      </Text>

      <View style={tw`items-center mb-8`}>
        <Text style={tw`text-4xl mb-2`}>
          {MOOD_STATES.find(m => m.value === emotionAfter)?.emoji}
        </Text>
        <Text style={tw`text-lg font-medium text-gray-700`}>
          {MOOD_STATES.find(m => m.value === emotionAfter)?.label}
        </Text>
      </View>

      <View style={tw`flex-row justify-between items-center mb-6`}>
        <Text style={tw`text-sm text-gray-600`}>Still distressed</Text>
        <Text style={tw`text-sm text-gray-600`}>Much better</Text>
      </View>

      <View style={tw`flex-row justify-between mb-8`}>
        {MOOD_STATES.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            onPress={() => setEmotionAfter(mood.value)}
            style={[
              tw`w-8 h-8 rounded-full border-2`,
              emotionAfter === mood.value
                ? tw`border-blue-500`
                : tw`border-gray-300`,
              { backgroundColor: emotionAfter === mood.value ? mood.color : 'transparent' }
            ]}
          />
        ))}
      </View>

      {/* Show improvement */}
      <View style={tw`bg-green-50 p-4 rounded-xl mb-6`}>
        <Text style={tw`text-sm text-green-700 mb-2`}>Your Progress:</Text>
        <View style={tw`flex-row items-center justify-center`}>
          <Text style={tw`text-2xl mr-3`}>
            {MOOD_STATES.find(m => m.value === emotionBefore)?.emoji}
          </Text>
          <Text style={tw`text-lg font-medium text-green-700 mx-2`}>→</Text>
          <Text style={tw`text-2xl ml-3`}>
            {MOOD_STATES.find(m => m.value === emotionAfter)?.emoji}
          </Text>
        </View>
        <Text style={tw`text-sm text-green-600 text-center mt-2`}>
          {emotionAfter > emotionBefore
            ? `You improved by ${emotionAfter - emotionBefore} points! 🎉`
            : emotionAfter === emotionBefore
            ? 'Sometimes maintaining your mood is progress too.'
            : 'That\'s okay. Some thoughts take time to process.'
          }
        </Text>
      </View>

      <Text style={tw`text-xs text-gray-500 text-center px-4`}>
        {WELLNESS_DISCLAIMERS.encouragement}
      </Text>
    </View>
  );

  const renderCurrentStep = () => {
    const content = {
      input: renderInputStep,
      emotion: renderEmotionStep,
      detect: renderDetectStep,
      challenge: renderChallengeStep,
      reframe: renderReframeStep,
      complete: renderCompleteStep
    }[currentStep]();

    return (
      <Animated.View
        style={[
          tw`flex-1`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {content}
      </Animated.View>
    );
  };

  return (
    <GradientBackground variant="conversation">
      <SafeAreaView style={tw`flex-1`}>
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={tw`flex-row items-center px-6 py-4`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4`}
            >
              <ArrowLeft size={20} color="#FFFFFF" weight="regular" />
            </TouchableOpacity>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-semibold text-white`}>
                Thought Helper
              </Text>
              <Text style={tw`text-sm text-white/80`}>
                Personal wellness exercise
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`px-6 mb-4`}>
            {renderProgressBar()}
          </View>

          {/* Content */}
          <View style={tw`flex-1 bg-white rounded-t-3xl px-6 py-8`}>
            {renderStepIndicator()}
            {renderCurrentStep()}

            {/* Bottom Button */}
            <TouchableOpacity
              onPress={handleNext}
              style={tw`bg-blue-500 py-4 rounded-xl mt-6`}
            >
              <Text style={tw`text-white text-center font-semibold text-base`}>
                {currentStep === 'complete' ? 'Finish' : 'Continue'}
              </Text>
            </TouchableOpacity>

            {/* Disclaimer */}
            {currentStep === 'input' && (
              <Text style={tw`text-xs text-gray-400 text-center mt-4 px-4`}>
                {WELLNESS_DISCLAIMERS.privacy}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};