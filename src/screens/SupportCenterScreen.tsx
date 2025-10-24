import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { standardizedLLM } from '../lib/standardizedLLM';
import { useAuth } from '../hooks/useAuth';
import tw from '../lib/tailwind';

interface CrisisResource {
  title: string;
  subtitle: string;
  phone: string;
  website?: string;
  icon: string;
  color: string;
  isEmergency?: boolean;
}

interface CopingTechnique {
  title: string;
  description: string;
  steps: string[];
  duration: string;
  icon: string;
  color: string;
}

interface SelfHelpResource {
  title: string;
  description: string;
  category: 'article' | 'exercise' | 'meditation' | 'book';
  url?: string;
  icon: string;
  color: string;
}

export default function SupportCenterScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'crisis' | 'selfhelp' | 'coping'>('crisis');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const breathingAnimation = new Animated.Value(0.5);

  const crisisResources: CrisisResource[] = [
    {
      title: 'National Suicide Prevention Lifeline',
      subtitle: '24/7 Crisis Support',
      phone: '988',
      website: 'https://suicidepreventionlifeline.org',
      icon: 'Phone',
      color: '#EF4444',
      isEmergency: true
    },
    {
      title: 'Crisis Text Line',
      subtitle: 'Text HOME to 741741',
      phone: '741741',
      website: 'https://crisistextline.org',
      icon: 'ChatText',
      color: '#3B82F6',
      isEmergency: true
    },
    {
      title: 'Emergency Services',
      subtitle: 'Immediate Emergency',
      phone: '911',
      icon: 'FirstAid',
      color: '#DC2626',
      isEmergency: true
    },
    {
      title: 'SAMHSA Helpline',
      subtitle: 'Wellness & Substance Abuse',
      phone: '1-800-662-4357',
      website: 'https://www.samhsa.gov',
      icon: 'Heart',
      color: '#059669'
    },
    {
      title: 'National Domestic Violence Hotline',
      subtitle: '24/7 Confidential Support',
      phone: '1-800-799-7233',
      website: 'https://www.thehotline.org',
      icon: 'Shield',
      color: '#7C3AED'
    }
  ];

  const copingTechniques: CopingTechnique[] = [
    {
      title: '4-7-8 Breathing',
      description: 'Calms nervous system and reduces anxiety',
      steps: [
        'Inhale through nose for 4 counts',
        'Hold breath for 7 counts',
        'Exhale through mouth for 8 counts',
        'Repeat 3-4 cycles'
      ],
      duration: '2-3 minutes',
      icon: 'Wind',
      color: '#6366F1'
    },
    {
      title: '5-4-3-2-1 Grounding',
      description: 'Grounds you in the present moment',
      steps: [
        'Name 5 things you can see',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste'
      ],
      duration: '3-5 minutes',
      icon: 'Eye',
      color: '#10B981'
    },
    {
      title: 'Progressive Muscle Relaxation',
      description: 'Releases physical tension and stress',
      steps: [
        'Tense muscles in feet for 5 seconds, then release',
        'Move up to calves, thighs, etc.',
        'Continue through entire body',
        'Notice the contrast between tension and relaxation'
      ],
      duration: '10-15 minutes',
      icon: 'FlexMuscle',
      color: '#F59E0B'
    }
  ];

  const selfHelpResources: SelfHelpResource[] = [
    {
      title: 'Understanding Depression',
      description: 'Learn about symptoms, causes, and treatment options for depression.',
      category: 'article',
      url: 'https://www.nimh.nih.gov/health/topics/depression',
      icon: 'Brain',
      color: '#6366F1'
    },
    {
      title: 'Anxiety Management Techniques',
      description: 'Practical strategies for managing anxiety in daily life.',
      category: 'article',
      url: 'https://www.anxiety.org/anxiety-management',
      icon: 'Shield',
      color: '#10B981'
    },
    {
      title: 'Mindfulness Meditation Guide',
      description: 'Introduction to mindfulness practice for mental well-being.',
      category: 'meditation',
      url: 'https://www.mindful.org/meditation/mindfulness-getting-started/',
      icon: 'Flower',
      color: '#8B5CF6'
    },
    {
      title: 'Sleep Hygiene Basics',
      description: 'Tips for better sleep quality and overall wellness.',
      category: 'article',
      url: 'https://www.sleepfoundation.org/sleep-hygiene',
      icon: 'Moon',
      color: '#3B82F6'
    },
    {
      title: 'Stress Management Workbook',
      description: 'Exercises and techniques for managing daily stress.',
      category: 'exercise',
      icon: 'BookOpen',
      color: '#F59E0B'
    },
    {
      title: 'Building Healthy Relationships',
      description: 'Guide to developing and maintaining supportive relationships.',
      category: 'article',
      url: 'https://www.helpguide.org/articles/relationships-communication/',
      icon: 'Users',
      color: '#EC4899'
    }
  ];

  useEffect(() => {
    if (breathingActive) {
      startBreathingCycle();
    }
  }, [breathingActive, breathingCount]);

  const startBreathingCycle = () => {
    const phases = [
      { phase: 'inhale', duration: 4000, scale: 1 },
      { phase: 'hold', duration: 7000, scale: 1 },
      { phase: 'exhale', duration: 8000, scale: 0.5 }
    ];

    const currentPhase = phases[breathingCount % 3];
    setBreathingPhase(currentPhase.phase as any);

    Animated.timing(breathingAnimation, {
      toValue: currentPhase.scale,
      duration: currentPhase.duration,
      useNativeDriver: true,
    }).start(() => {
      if (breathingActive) {
        setBreathingCount(prev => prev + 1);
      }
    });
  };

  const toggleBreathing = () => {
    if (breathingActive) {
      setBreathingActive(false);
      setBreathingCount(0);
      breathingAnimation.setValue(0.5);
    } else {
      setBreathingActive(true);
      setBreathingCount(0);
    }
  };

  const callCrisisLine = (phone: string, title: string) => {
    Alert.alert(
      'Call Crisis Support',
      `Are you sure you want to call ${title}?\n\nPhone: ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'default',
          onPress: () => {
            Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
          }
        }
      ]
    );
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const getImmediateHelp = async () => {
    try {
      const crisisResponse = await standardizedLLM.generateQualityFirst(
        "I'm in crisis and need immediate emotional support and coping strategies. Please provide calm, supportive guidance.",
        {
          systemPrompt: "You are a crisis support AI. Provide immediate, calm, supportive guidance. Focus on safety, grounding, and immediate coping strategies. Be warm, non-judgmental, and encouraging. Always recommend professional help.",
          maxTokens: 300
        }
      );

      Alert.alert(
        "Immediate Support",
        crisisResponse.content,
        [
          { text: "Call Crisis Line", onPress: () => callCrisisLine('988', 'Crisis Support') },
          { text: "Continue", style: "default" }
        ]
      );
    } catch (error) {
      Alert.alert(
        "Immediate Support",
        "You are not alone. Your feelings are valid, and this difficult moment will pass. Please reach out to a crisis counselor who can provide professional support right now.",
        [
          { text: "Call 988", onPress: () => callCrisisLine('988', 'Crisis Support') },
          { text: "OK", style: "default" }
        ]
      );
    }
  };

  const renderTabSelector = () => {
    const tabs = [
      { id: 'crisis', title: 'Crisis Support', icon: 'FirstAid', color: '#EF4444' },
      { id: 'coping', title: 'Coping Tools', icon: 'Heart', color: '#6366F1' },
      { id: 'selfhelp', title: 'Self-Help', icon: 'BookOpen', color: '#10B981' }
    ];

    return (
      <View style={tw`flex-row bg-gray-100 rounded-xl p-1 mx-6 mb-6`}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setSelectedTab(tab.id as any)}
            style={[
              tw`flex-1 py-3 rounded-lg flex-row items-center justify-center`,
              selectedTab === tab.id ? tw`bg-white shadow-sm` : null
            ]}
          >
            <SafePhosphorIcon
              iconType={tab.icon as any}
              size={16}
              color={selectedTab === tab.id ? tab.color : '#6B7280'}
              weight="bold"
            />
            <Text style={[
              tw`text-center font-medium ml-2 text-sm`,
              selectedTab === tab.id ? { color: tab.color } : tw`text-gray-600`
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCrisisSupport = () => (
    <View style={tw`px-6`}>
      {/* Emergency Banner */}
      <View style={tw`bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6`}>
        <View style={tw`flex-row items-center mb-3`}>
          <SafePhosphorIcon iconType="Warning" size={24} color="#DC2626" weight="bold" />
          <Text style={tw`text-lg font-bold text-red-800 ml-2`}>
            Emergency Support
          </Text>
        </View>
        <Text style={tw`text-red-700 mb-4 leading-5`}>
          If you're in immediate danger or having thoughts of self-harm, please reach out for help right now.
        </Text>

        <TouchableOpacity
          onPress={getImmediateHelp}
          style={tw`bg-red-600 rounded-xl py-4 px-6 mb-4`}
        >
          <View style={tw`flex-row items-center justify-center`}>
            <SafePhosphorIcon iconType="FirstAid" size={20} color="#FFFFFF" weight="bold" />
            <Text style={tw`text-white font-bold text-lg ml-2`}>
              Get Immediate Help
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Crisis Resources */}
      {crisisResources.map((resource, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => callCrisisLine(resource.phone, resource.title)}
          style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4`}
          borderLeftColor={resource.color}
        >
          <View style={tw`flex-row items-center`}>
            <View style={[tw`w-12 h-12 rounded-full items-center justify-center mr-4`, { backgroundColor: resource.color + '20' }]}>
              <SafePhosphorIcon
                iconType={resource.icon as any}
                size={24}
                color={resource.color}
                weight="bold"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`font-bold text-gray-800 text-lg`}>
                {resource.title}
              </Text>
              <Text style={tw`text-gray-600 text-sm mb-1`}>
                {resource.subtitle}
              </Text>
              <Text style={tw`font-bold text-lg`} color={resource.color}>
                {resource.phone}
              </Text>
            </View>
            <View style={tw`flex-row`}>
              <SafePhosphorIcon iconType="Phone" size={20} color={resource.color} weight="bold" />
              {resource.website && (
                <TouchableOpacity
                  onPress={() => openWebsite(resource.website!)}
                  style={tw`ml-3`}
                >
                  <SafePhosphorIcon iconType="Globe" size={20} color={resource.color} weight="bold" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCopingTools = () => (
    <View style={tw`px-6`}>
      {/* Breathing Exercise */}
      <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6`}>
        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
          Guided Breathing Exercise
        </Text>
        <View style={tw`items-center mb-6`}>
          <Animated.View
            style={[
              tw`w-32 h-32 rounded-full border-4 border-blue-400 items-center justify-center mb-4`,
              {
                transform: [{ scale: breathingAnimation }],
                backgroundColor: '#DBEAFE'
              }
            ]}
          >
            <Text style={tw`text-blue-600 font-bold text-lg capitalize`}>
              {breathingPhase}
            </Text>
          </Animated.View>

          <TouchableOpacity
            onPress={toggleBreathing}
            style={[
              tw`py-3 px-6 rounded-xl`,
              breathingActive ? tw`bg-red-500` : tw`bg-blue-500`
            ]}
          >
            <Text style={tw`text-white font-bold`}>
              {breathingActive ? 'Stop Exercise' : 'Start Breathing Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={tw`text-center text-gray-600 text-sm`}>
          Follow the circle: Inhale (4s) → Hold (7s) → Exhale (8s)
        </Text>
      </View>

      {/* Coping Techniques */}
      <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
        Coping Techniques
      </Text>
      {copingTechniques.map((technique, index) => (
        <View key={index} style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}>
          <View style={tw`flex-row items-start mb-3`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1`, { backgroundColor: technique.color + '20' }]}>
              <SafePhosphorIcon
                iconType={technique.icon as any}
                size={20}
                color={technique.color}
                weight="bold"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`font-bold text-gray-800 text-lg mb-1`}>
                {technique.title}
              </Text>
              <Text style={tw`text-gray-600 text-sm mb-2`}>
                {technique.description}
              </Text>
              <Text style={tw`text-xs text-gray-500 mb-3`}>
                Duration: {technique.duration}
              </Text>
            </View>
          </View>

          <View style={tw`pl-13`}>
            {technique.steps.map((step, stepIndex) => (
              <Text key={stepIndex} style={tw`text-sm text-gray-700 mb-1`}>
                {stepIndex + 1}. {step}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderSelfHelp = () => (
    <View style={tw`px-6`}>
      <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
        Self-Help Resources
      </Text>
      {selfHelpResources.map((resource, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => resource.url && openWebsite(resource.url)}
          style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}
        >
          <View style={tw`flex-row items-start`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1`, { backgroundColor: resource.color + '20' }]}>
              <SafePhosphorIcon
                iconType={resource.icon as any}
                size={20}
                color={resource.color}
                weight="bold"
              />
            </View>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Text style={tw`font-bold text-gray-800 flex-1`}>
                  {resource.title}
                </Text>
                <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: resource.color + '20' }]}>
                  <Text style={tw`text-xs font-medium`} color={resource.color}>
                    {resource.category.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={tw`text-gray-600 text-sm`}>
                {resource.description}
              </Text>
            </View>
            {resource.url && (
              <SafePhosphorIcon iconType="ArrowSquareOut" size={20} color={resource.color} weight="bold" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'crisis':
        return renderCrisisSupport();
      case 'coping':
        return renderCopingTools();
      case 'selfhelp':
        return renderSelfHelp();
      default:
        return renderCrisisSupport();
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />

        {/* Header */}
        <View style={tw`px-6 pt-2 pb-4`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PostLoginScreen' as any)}
              style={tw`p-2 -ml-2`}
            >
              <SafePhosphorIcon iconType="House" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold text-jung-deep`}>Support Center</Text>
            <View style={tw`w-8`} />
          </View>
          <Text style={tw`text-center text-gray-600`}>
            Crisis support, coping tools, and self-help resources
          </Text>
        </View>

        {/* Tab Selector */}
        {renderTabSelector()}

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          {/* Content */}
          {renderContent()}

          {/* Remember Section */}
          <View style={tw`px-6 mb-8 mt-6`}>
            <View style={tw`bg-jung-purple/10 rounded-xl p-6`}>
              <View style={tw`flex-row items-center mb-3`}>
                <SafePhosphorIcon iconType="Heart" size={24} color="#4A3B78" weight="bold" />
                <Text style={tw`text-lg font-bold text-jung-deep ml-2`}>
                  Remember
                </Text>
              </View>
              <Text style={tw`text-gray-700 leading-6`}>
                You are not alone in your journey. Whether you need immediate crisis support,
                practical coping strategies, or self-help resources, help is available.
                Reaching out for support is a sign of strength and self-care.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}