import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import tw from '../lib/tailwind';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from '../lib/encryptionUtils';
import { generateAIResponse } from '../lib/api';
import { additionalScenarios, emotionalInsights, emotionalChallenges } from '../data/emotionalScenarios';
import { emotionalQuestionBank, EmotionalQuestion } from '../data/emotionalQuestionBank';
import { QuestionRotationService } from '../lib/questionRotationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface AssessmentHistory {
  id: string;
  date: string;
  profile: any;
  scenarioCount: number;
  assessmentType: 'quick' | 'comprehensive';
}

interface EmotionOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  intensity: number;
}

const emotionOptions: EmotionOption[] = [
  { id: 'joy', name: 'Joy', emoji: '😊', color: '#F59E0B', intensity: 8 },
  { id: 'sadness', name: 'Sadness', emoji: '😢', color: '#3B82F6', intensity: 6 },
  { id: 'anger', name: 'Anger', emoji: '😡', color: '#EF4444', intensity: 9 },
  { id: 'fear', name: 'Fear', emoji: '😰', color: '#8B5CF6', intensity: 7 },
  { id: 'surprise', name: 'Surprise', emoji: '😲', color: '#06B6D4', intensity: 5 },
  { id: 'disgust', name: 'Disgust', emoji: '🤢', color: '#84CC16', intensity: 6 },
  { id: 'trust', name: 'Trust', emoji: '🤗', color: '#10B981', intensity: 4 },
  { id: 'anticipation', name: 'Anticipation', emoji: '🤔', color: '#F97316', intensity: 5 },
];

// Basic scenarios for emotional assessment
const baseScenarios = [
  {
    id: 'scenario_1',
    question: "You're at a social gathering when you notice no one has spoken to you in over 10 minutes. How do you feel?",
    options: [
      { emotion: 'sadness', text: "I feel left out and wonder what's wrong with me" },
      { emotion: 'anger', text: "I'm annoyed that people are being so rude" },
      { emotion: 'fear', text: "I worry that I've done something wrong or inappropriate" },
      { emotion: 'joy', text: "I appreciate the chance to observe and take a breather" }
    ]
  },
  {
    id: 'scenario_2',
    question: "You're about to give an important presentation when you realize you've forgotten a key part of your notes. What's your reaction?",
    options: [
      { emotion: 'fear', text: "My heart races as I imagine the worst possible outcome" },
      { emotion: 'trust', text: "I trust my knowledge of the subject to carry me through" },
      { emotion: 'surprise', text: "I'm caught off guard but quickly think of how to adapt" },
      { emotion: 'anger', text: "I'm frustrated with myself for not being better prepared" }
    ]
  },
  {
    id: 'scenario_3',
    question: "You receive unexpected praise for work you didn't think was your best effort. How do you respond?",
    options: [
      { emotion: 'joy', text: "I feel happy and grateful for the recognition" },
      { emotion: 'surprise', text: "I'm genuinely surprised as I didn't think it was that good" },
      { emotion: 'disgust', text: "I'm uncomfortable with praise I don't feel I deserve" },
      { emotion: 'trust', text: "I accept that others may see value I didn't notice" }
    ]
  },
  {
    id: 'scenario_4',
    question: "You notice a friend seems to be avoiding you lately. What's your first thought?",
    options: [
      { emotion: 'sadness', text: "I feel hurt that our friendship might be changing" },
      { emotion: 'fear', text: "I worry I've done something to upset them" },
      { emotion: 'anger', text: "I'm annoyed they're not being direct with me" },
      { emotion: 'anticipation', text: "I'm curious what might be going on with them" }
    ]
  },
  {
    id: 'scenario_5',
    question: "You've been working on a creative project and suddenly hit a wall. How do you feel?",
    options: [
      { emotion: 'frustration', text: "I feel stuck and irritated that I can't move forward" },
      { emotion: 'anticipation', text: "I see this as a natural part of the process and look forward to breaking through" },
      { emotion: 'doubt', text: "I question whether I should continue or if I have the ability" },
      { emotion: 'contentment', text: "I'm satisfied with taking a break and coming back later" }
    ]
  }
];

// Combine base scenarios with additional ones
const allScenarios = [...baseScenarios, ...additionalScenarios];

export const EmotionalAssessmentScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [responses, setResponses] = useState<{scenarioId: string, emotion: string, intensity: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);
  const [scenarioSet, setScenarioSet] = useState<"quick" | "comprehensive">("quick");
  const [selectedScenarios, setSelectedScenarios] = useState<EmotionalQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionStats, setQuestionStats] = useState<any>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuestionStats, setShowQuestionStats] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showEmotionWheel, setShowEmotionWheel] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState(5);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load questions using rotation service
  const loadQuestions = async (assessmentType: 'quick' | 'comprehensive') => {
    try {
      setLoadingQuestions(true);
      const userLevel = await QuestionRotationService.getUserLevel();

      const criteria = {
        assessmentType,
        userLevel,
        avoidRecentQuestions: true,
        balanceCategories: true,
        progressiveDifficulty: true,
      };

      const questions = await QuestionRotationService.selectQuestionsForAssessment(criteria);
      setSelectedScenarios(questions);

      // Reset assessment state
      setCurrentScenarioIndex(0);
      setResponses([]);
      progressAnim.setValue(0);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback to base scenarios if rotation service fails
      setSelectedScenarios(baseScenarios.slice(0, assessmentType === 'quick' ? 5 : 10));
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Use effect to update the scenarios based on the selected set
  useEffect(() => {
    loadQuestions(scenarioSet);
  }, [scenarioSet]);

  useEffect(() => {
    loadAssessmentHistory();
    loadQuestionStats();
  }, []);

  const loadQuestionStats = async () => {
    try {
      const stats = await QuestionRotationService.getQuestionStats();
      setQuestionStats(stats);
    } catch (error) {
      console.error('Error loading question stats:', error);
    }
  };

  useEffect(() => {
    // Animate progress bar
    const progress = (currentScenarioIndex / selectedScenarios.length) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentScenarioIndex, selectedScenarios.length]);

  const loadAssessmentHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem('assessmentHistory');
      if (historyData) {
        setAssessmentHistory(JSON.parse(historyData));
      }
    } catch (error) {
      console.error('Error loading assessment history:', error);
    }
  };

  const saveAssessmentToHistory = async (profile: any) => {
    try {
      const newAssessment: AssessmentHistory = {
        id: uuidv4(),
        date: new Date().toISOString(),
        profile,
        scenarioCount: selectedScenarios.length,
        assessmentType: scenarioSet,
      };

      const updatedHistory = [newAssessment, ...assessmentHistory].slice(0, 10); // Keep last 10
      setAssessmentHistory(updatedHistory);
      await AsyncStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving assessment to history:', error);
    }
  };

  const handleResponse = (emotion: string, intensity: number = 5) => {
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const scenarioId = selectedScenarios[currentScenarioIndex].id;
      setResponses([...responses, { scenarioId, emotion, intensity }]);

      if (currentScenarioIndex < selectedScenarios.length - 1) {
        setCurrentScenarioIndex(currentScenarioIndex + 1);
        // Scroll to top for next scenario
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        completeAssessment();
      }
    });
  };

  const handleEmotionWheelSelection = (emotion: EmotionOption) => {
    setSelectedEmotion(emotion);
    setSelectedIntensity(emotion.intensity);
    setShowEmotionWheel(false);
    handleResponse(emotion.id, emotion.intensity);
  };

  const handleScenarioSetChange = (set: "quick" | "comprehensive") => {
    if (responses.length > 0) {
      Alert.alert(
        "Change Assessment Type?",
        "This will reset your current progress. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Change",
            onPress: () => {
              setScenarioSet(set);
              loadQuestions(set);
            }
          }
        ]
      );
    } else {
      setScenarioSet(set);
    }
  };

  const completeAssessment = async () => {
    try {
      setLoading(true);
      
      // Format responses for analysis
      const formattedResponses = selectedScenarios.map((scenario: any, index: number) => {
        const response = responses[index] || { emotion: 'unknown' };
        return `Scenario: ${scenario.question}\nResponse: ${response.emotion}`;
      }).join('\n\n');
      
      // Create prompt for AI analysis
      const prompt = `
        Analyze the following emotional responses to different scenarios:
        
        ${formattedResponses}
        
        Based on these responses, please:
        1. Identify the dominant primary emotion (choose from: joy, sadness, anger, fear, disgust, surprise, trust, or anticipation)
        2. Identify 2-3 secondary emotions that are present
        3. Rate the overall emotional intensity on a scale of 1-10
        4. Suggest potential emotional triggers or patterns
        5. Identify potential emotional needs
        
        Format your response as a JSON object with the following structure:
        {
          "primary_emotion": "[emotion]",
          "secondary_emotions": ["emotion1", "emotion2", "emotion3"],
          "intensity": [number],
          "triggers": ["trigger1", "trigger2"],
          "needs": ["need1", "need2"]
        }
        
        Return only valid JSON.
      `;
      
      // Get analysis from AI
      const analysisResult = await generateAIResponse(prompt, [], 'jung', {
        userConsent: true,
        privacyLevel: 'BASIC',
        provider: 'claude'
      });

      // Clean and parse JSON response
      const cleanedResult = analysisResult.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
      console.log('AI Response for debugging:', analysisResult);

      let profileData;
      try {
        // Try direct JSON parse first
        profileData = JSON.parse(cleanedResult);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw AI response:', analysisResult);
        console.log('Cleaned response:', cleanedResult);

        // Try to extract JSON object with more comprehensive regex patterns
        let jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);

        // If no match, try to find JSON wrapped in markdown code blocks
        if (!jsonMatch) {
          jsonMatch = cleanedResult.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonMatch[0] = jsonMatch[1]; // Use the captured group
          }
        }

        // If still no match, try to find JSON after common prefixes
        if (!jsonMatch) {
          const jsonStart = cleanedResult.indexOf('{');
          const jsonEnd = cleanedResult.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonMatch = [cleanedResult.substring(jsonStart, jsonEnd + 1)];
          }
        }

        if (jsonMatch) {
          try {
            profileData = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error('Failed to parse extracted JSON:', extractError);
            console.error('Extracted text was:', jsonMatch[0]);

            // Create a fallback profile based on the analysis
            profileData = {
              primary_emotion: "neutral",
              secondary_emotions: ["curiosity", "thoughtfulness"],
              intensity: 5,
              triggers: ["assessment scenarios"],
              needs: ["emotional understanding", "self-reflection"]
            };
            console.log('Using fallback emotional profile');
          }
        } else {
          console.error('No JSON found in response, using fallback');
          // Create a fallback profile
          profileData = {
            primary_emotion: "neutral",
            secondary_emotions: ["curiosity", "openness"],
            intensity: 5,
            triggers: ["new experiences"],
            needs: ["emotional clarity", "personal growth"]
          };
        }
      }
      setEmotionalProfile(profileData);

      // Save to database (encrypted)
      await saveEmotionalProfile(profileData);

      // Save to history
      await saveAssessmentToHistory(profileData);

      // Mark assessment as complete
      setAssessmentComplete(true);
      
    } catch (error) {
      console.error('Error analyzing emotional profile:', error);

      // Create a basic fallback profile so the user can still proceed
      const fallbackProfile = {
        primary_emotion: "neutral",
        secondary_emotions: ["curiosity", "self-awareness"],
        intensity: 5,
        triggers: ["self-reflection"],
        needs: ["emotional understanding", "personal growth"]
      };

      setEmotionalProfile(fallbackProfile);

      // Save fallback profile to database
      try {
        await saveEmotionalProfile(fallbackProfile);
      } catch (saveError) {
        console.error('Error saving fallback profile:', saveError);
      }

      // Mark assessment as complete even with fallback
      setAssessmentComplete(true);

      alert('Assessment completed with basic analysis. Your emotional profile has been saved.');
    } finally {
      setLoading(false);
    }
  };

  const saveEmotionalProfile = async (profileData: any) => {
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Encrypt data before storing
      const encryptedData = encryptData(JSON.stringify(profileData));

      // Save to database
      const { error } = await supabase
        .from('emotional_states')
        .insert({
          id: uuidv4(),
          user_id: user.id,
          encrypted_data: encryptedData,
          timestamp: new Date().toISOString()
        });
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error saving emotional profile:', error);
      throw error;
    }
  };

  const renderEmotionWheel = () => {
    const radius = width * 0.3;
    const center = { x: width / 2, y: height / 2 - 100 };

    return (
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-3xl p-8 m-6 items-center shadow-2xl`}>
          <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>How are you feeling?</Text>
          <Text style={tw`text-gray-600 text-center mb-6`}>Select the emotion that best matches your current state</Text>

          <View style={[{ width: radius * 2, height: radius * 2 }, tw`relative justify-center items-center`]}>
            {emotionOptions.map((emotion, index) => {
              const angle = (index * 2 * Math.PI) / emotionOptions.length;
              const x = radius * 0.8 * Math.cos(angle - Math.PI / 2);
              const y = radius * 0.8 * Math.sin(angle - Math.PI / 2);

              return (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    {
                      position: 'absolute',
                      left: radius + x - 30,
                      top: radius + y - 30,
                      width: 60,
                      height: 60,
                    },
                    tw`rounded-full justify-center items-center shadow-lg`,
                    { backgroundColor: emotion.color + '20', borderColor: emotion.color, borderWidth: 2 }
                  ]}
                  onPress={() => handleEmotionWheelSelection(emotion)}
                  activeOpacity={0.7}
                >
                  <Text style={tw`text-2xl`}>{emotion.emoji}</Text>
                  <Text style={[tw`text-xs font-bold text-center`, { color: emotion.color }]}>
                    {emotion.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Center circle */}
            <View style={tw`absolute w-16 h-16 rounded-full bg-jung-purple/10 border-2 border-jung-purple justify-center items-center`}>
              <SafePhosphorIcon iconType="Brain" size={24} color="#4A3B78" weight="bold" />
            </View>
          </View>

          <TouchableOpacity
            style={tw`mt-6 bg-gray-100 rounded-xl py-3 px-6`}
            onPress={() => setShowEmotionWheel(false)}
          >
            <Text style={tw`text-gray-600 font-medium`}>Use Traditional Options</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderScenario = () => {
    if (assessmentComplete) {
      return renderResults();
    }

    if (showInsights) {
      return renderInsights();
    }

    if (showHistory) {
      return renderHistory();
    }

    if (showQuestionStats) {
      return renderQuestionStats();
    }

    if (showEmotionWheel) {
      return renderEmotionWheel();
    }

    // Safety check: ensure we have scenarios and valid index
    if (!selectedScenarios || selectedScenarios.length === 0 || currentScenarioIndex >= selectedScenarios.length) {
      return (
        <View style={tw`flex-1 justify-center items-center bg-white p-6`}>
          <View style={tw`bg-jung-purple/10 rounded-full w-24 h-24 items-center justify-center mb-6`}>
            <SafePhosphorIcon iconType="Warning" size={32} color="#4A3B78" weight="bold" />
          </View>
          <Text style={tw`text-jung-purple text-xl font-bold mb-2 text-center`}>
            Loading Questions
          </Text>
          <Text style={tw`text-gray-600 text-center mb-6`}>
            Preparing your personalized assessment questions...
          </Text>
          <TouchableOpacity
            style={tw`bg-jung-purple rounded-2xl py-3 px-6`}
            onPress={() => loadQuestions(scenarioSet)}
          >
            <Text style={tw`text-white font-bold`}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const scenario = selectedScenarios[currentScenarioIndex];

    return (
      <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
        {/* Enhanced Progress Bar */}
        <View style={tw`px-6 py-4 bg-white/90 border-b border-gray-100`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-jung-purple font-bold text-lg`}>
              Question {currentScenarioIndex + 1}
            </Text>
            <Text style={tw`text-gray-500 text-sm`}>
              {selectedScenarios.length} total
            </Text>
          </View>

          <View style={tw`bg-gray-200 h-2 rounded-full overflow-hidden`}>
            <Animated.View
              style={[
                tw`bg-jung-purple h-full rounded-full`,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <Text style={tw`text-jung-purple text-xs text-center mt-2 font-medium`}>
            {Math.round((currentScenarioIndex / selectedScenarios.length) * 100)}% Complete
          </Text>
        </View>

        <ScrollView ref={scrollViewRef} style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
          {/* Scenario Card */}
          <View style={tw`bg-white rounded-3xl p-6 shadow-lg mb-6 border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`bg-jung-purple/10 rounded-full w-10 h-10 items-center justify-center mr-3`}>
                <SafePhosphorIcon iconType="ChatCircle" size={20} color="#4A3B78" weight="bold" />
              </View>
              <Text style={tw`text-lg font-bold text-jung-purple`}>Scenario</Text>
            </View>

            <Text style={tw`text-gray-700 text-lg leading-relaxed mb-6 font-medium`}>
              {scenario.question}
            </Text>

            {/* Emotion Wheel Button */}
            <TouchableOpacity
              style={tw`bg-jung-purple/5 border-2 border-jung-purple/20 rounded-2xl p-4 mb-4 flex-row items-center justify-center`}
              onPress={() => setShowEmotionWheel(true)}
            >
              <SafePhosphorIcon iconType="Circle" size={20} color="#4A3B78" weight="bold" />
              <Text style={tw`text-jung-purple font-bold ml-2`}>Use Emotion Wheel</Text>
            </TouchableOpacity>

            <Text style={tw`text-gray-500 text-sm text-center mb-4`}>or choose from options below:</Text>

            {/* Traditional Options */}
            <View style={tw`space-y-3`}>
              {scenario.options.map((option, index) => {
                const emotionData = emotionOptions.find(e => e.id === option.emotion);
                return (
                  <TouchableOpacity
                    key={index}
                    style={tw`border-2 border-gray-200 rounded-2xl p-4 bg-white flex-row items-center`}
                    onPress={() => handleResponse(option.emotion, emotionData?.intensity || 5)}
                    activeOpacity={0.7}
                  >
                    <View style={tw`mr-4`}>
                      <Text style={tw`text-2xl`}>{emotionData?.emoji || '😐'}</Text>
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-gray-800 leading-relaxed font-medium`}>{option.text}</Text>
                      <Text style={tw`text-jung-purple text-sm font-semibold mt-1 capitalize`}>{option.emotion}</Text>
                    </View>
                    <SafePhosphorIcon iconType="ArrowRight" size={16} color="#9CA3AF" weight="bold" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Navigation */}
          <View style={tw`flex-row justify-between items-center`}>
            <TouchableOpacity
              style={tw`${currentScenarioIndex > 0 ? 'bg-gray-100' : 'bg-gray-50'} rounded-xl py-3 px-6 flex-row items-center`}
              onPress={() => {
                if (currentScenarioIndex > 0) {
                  setCurrentScenarioIndex(currentScenarioIndex - 1);
                  setResponses(responses.slice(0, -1));
                }
              }}
              disabled={currentScenarioIndex === 0}
            >
              <SafePhosphorIcon
                iconType="ArrowLeft"
                size={16}
                color={currentScenarioIndex > 0 ? "#4A3B78" : "#D1D5DB"}
                weight="bold"
              />
              <Text style={tw`${currentScenarioIndex > 0 ? 'text-jung-purple' : 'text-gray-400'} font-medium ml-1`}>
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={tw`text-jung-purple font-bold text-lg`}>
              {currentScenarioIndex + 1} / {selectedScenarios.length}
            </Text>

            <TouchableOpacity
              style={tw`bg-jung-purple/10 rounded-xl py-3 px-6 flex-row items-center`}
              onPress={() => setShowEmotionWheel(true)}
            >
              <Text style={tw`text-jung-purple font-medium mr-1`}>Quick Select</Text>
              <SafePhosphorIcon iconType="Circle" size={16} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderInsights = () => {
    const insight = emotionalInsights[currentInsightIndex];
    
    return (
      <ScrollView style={tw`p-6`}>
        <View style={tw`flex-row items-center mb-6`}>
          <Lightbulb size={24} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
          <Text style={tw`text-xl font-bold text-gray-700`}>
            Emotional Insights
          </Text>
        </View>
        
        <View style={tw`bg-white/90 rounded-xl p-6 shadow-md mb-6 border border-emotional/30`}>
          <Text style={tw`text-lg font-bold text-emotional mb-3`}>
            {insight.title}
          </Text>
          
          <Text style={tw`text-gray-700 leading-relaxed mb-4`}>
            {insight.content}
          </Text>
          
          <View style={tw`flex-row justify-between mt-4`}>
            <TouchableOpacity
              style={tw`p-2 rounded-full bg-emotional/10`}
              onPress={() => setCurrentInsightIndex(prev => Math.max(0, prev - 1))}
              disabled={currentInsightIndex === 0}
            >
              <CaretLeft size={20} color={currentInsightIndex === 0 ? "#ccc" : "#CEB5CD"} />
            </TouchableOpacity>
            
            <Text style={tw`text-gray-500`}>
              {currentInsightIndex + 1} of {emotionalInsights.length}
            </Text>
            
            <TouchableOpacity
              style={tw`p-2 rounded-full bg-emotional/10`}
              onPress={() => setCurrentInsightIndex(prev => Math.min(emotionalInsights.length - 1, prev + 1))}
              disabled={currentInsightIndex === emotionalInsights.length - 1}
            >
              <CaretRight size={20} color={currentInsightIndex === emotionalInsights.length - 1 ? "#ccc" : "#CEB5CD"} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={tw`bg-emotional/90 rounded-xl py-4 mb-4 flex-row justify-center items-center shadow-sm`}
          onPress={() => setShowInsights(false)}
        >
          <ArrowLeft size={20} color="#fff" weight="fill" style={tw`mr-2`} />
          <Text style={tw`text-white text-center font-medium`}>
            Back to Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderQuestionStats = () => {
    return (
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
        <View style={tw`flex-row items-center mb-6`}>
          <SafePhosphorIcon iconType="ChartBar" size={24} color="#4A3B78" weight="bold" />
          <Text style={tw`text-xl font-bold text-jung-purple ml-2`}>
            Question Bank Stats
          </Text>
        </View>

        {/* Overview Cards */}
        <View style={tw`flex-row space-x-3 mb-6`}>
          <View style={tw`bg-white rounded-2xl p-4 flex-1 shadow-sm`}>
            <SafePhosphorIcon iconType="Database" size={24} color="#10B981" weight="bold" />
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {emotionalQuestionBank.length}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>Total Questions</Text>
          </View>

          <View style={tw`bg-white rounded-2xl p-4 flex-1 shadow-sm`}>
            <SafePhosphorIcon iconType="Shuffle" size={24} color="#F59E0B" weight="bold" />
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {questionStats?.totalAsked || 0}
            </Text>
            <Text style={tw`text-gray-600 text-sm`}>Questions Asked</Text>
          </View>
        </View>

        {/* Categories Distribution */}
        <View style={tw`bg-white rounded-2xl p-6 shadow-sm mb-6`}>
          <View style={tw`flex-row items-center mb-4`}>
            <SafePhosphorIcon iconType="Tag" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>Categories</Text>
          </View>

          <View style={tw`space-y-3`}>
            {questionCategories.map(category => {
              const categoryQuestions = emotionalQuestionBank.filter(q => q.category === category);
              const askedCount = questionStats?.categoryCounts?.[category] || 0;
              const percentage = categoryQuestions.length > 0 ? (askedCount / categoryQuestions.length) * 100 : 0;

              return (
                <View key={category} style={tw`space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-gray-700 font-medium capitalize`}>
                      {category.replace('_', ' ')}
                    </Text>
                    <Text style={tw`text-gray-500 text-sm`}>
                      {askedCount}/{categoryQuestions.length}
                    </Text>
                  </View>
                  <View style={tw`bg-gray-200 h-2 rounded-full overflow-hidden`}>
                    <View
                      style={[
                        tw`bg-jung-purple h-full rounded-full`,
                        { width: `${Math.min(percentage, 100)}%` }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Difficulty Distribution */}
        <View style={tw`bg-white rounded-2xl p-6 shadow-sm mb-6`}>
          <View style={tw`flex-row items-center mb-4`}>
            <SafePhosphorIcon iconType="TrendUp" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>Difficulty Levels</Text>
          </View>

          <View style={tw`flex-row space-x-3`}>
            {difficultyLevels.map(difficulty => {
              const difficultyQuestions = emotionalQuestionBank.filter(q => q.difficulty === difficulty);
              const askedCount = questionStats?.difficultyCounts?.[difficulty] || 0;

              return (
                <View key={difficulty} style={tw`flex-1 items-center`}>
                  <View style={tw`${
                    difficulty === 'basic' ? 'bg-green-100' :
                    difficulty === 'intermediate' ? 'bg-yellow-100' : 'bg-red-100'
                  } rounded-full w-16 h-16 items-center justify-center mb-2`}>
                    <Text style={tw`text-2xl font-bold ${
                      difficulty === 'basic' ? 'text-green-600' :
                      difficulty === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {askedCount}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-700 font-medium text-sm capitalize`}>
                    {difficulty}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs`}>
                    /{difficultyQuestions.length} total
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Smart Rotation Info */}
        <View style={tw`bg-gradient-to-r from-jung-purple/10 to-blue-100 rounded-2xl p-6 border border-jung-purple/20 mb-6`}>
          <View style={tw`flex-row items-center mb-3`}>
            <SafePhosphorIcon iconType="Brain" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-jung-purple font-bold ml-2`}>Smart Question Rotation</Text>
          </View>
          <Text style={tw`text-gray-700 leading-relaxed mb-3`}>
            Our system intelligently selects questions based on:
          </Text>
          <View style={tw`space-y-1`}>
            <Text style={tw`text-gray-600 text-sm`}>• Your assessment history and frequency</Text>
            <Text style={tw`text-gray-600 text-sm`}>• Category balance for comprehensive insights</Text>
            <Text style={tw`text-gray-600 text-sm`}>• Progressive difficulty based on experience</Text>
            <Text style={tw`text-gray-600 text-sm`}>• Avoiding recently asked questions</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={tw`space-y-3`}>
          <TouchableOpacity
            style={tw`bg-jung-purple rounded-2xl py-4 flex-row justify-center items-center`}
            onPress={() => setShowQuestionStats(false)}
          >
            <SafePhosphorIcon iconType="ArrowLeft" size={20} color="white" weight="bold" />
            <Text style={tw`text-white font-bold ml-2`}>Back to Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-white border-2 border-jung-purple rounded-2xl py-3 flex-row justify-center items-center`}
            onPress={async () => {
              Alert.alert(
                'Reset Question History',
                'This will clear your question history and start fresh. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await QuestionRotationService.resetQuestionHistory();
                      await loadQuestionStats();
                      Alert.alert('Success', 'Question history has been reset');
                    }
                  }
                ]
              );
            }}
          >
            <SafePhosphorIcon iconType="ArrowCounterClockwise" size={18} color="#4A3B78" weight="bold" />
            <Text style={tw`text-jung-purple font-bold ml-1`}>Reset Question History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderHistory = () => {
    return (
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
        <View style={tw`flex-row items-center mb-6`}>
          <SafePhosphorIcon iconType="ClockCounterClockwise" size={24} color="#4A3B78" weight="bold" />
          <Text style={tw`text-xl font-bold text-jung-purple ml-2`}>
            Assessment History
          </Text>
        </View>

        {assessmentHistory.length === 0 ? (
          <View style={tw`bg-white rounded-2xl p-8 items-center`}>
            <SafePhosphorIcon iconType="Calendar" size={48} color="#D1D5DB" weight="thin" />
            <Text style={tw`text-gray-500 text-lg font-medium mt-4 text-center`}>
              No Previous Assessments
            </Text>
            <Text style={tw`text-gray-400 text-center mt-2`}>
              Complete an assessment to see your emotional journey
            </Text>
          </View>
        ) : (
          <View style={tw`space-y-4`}>
            {assessmentHistory.map((assessment, index) => {
              const date = new Date(assessment.date);
              const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <View key={assessment.id} style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100`}>
                  <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View>
                      <Text style={tw`text-jung-purple font-bold text-lg capitalize`}>
                        {assessment.profile.primary_emotion}
                      </Text>
                      <Text style={tw`text-gray-500 text-sm`}>
                        {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <View style={tw`${assessment.assessmentType === 'comprehensive' ? 'bg-jung-purple' : 'bg-blue-500'} rounded-full px-2 py-1`}>
                        <Text style={tw`text-white text-xs font-bold`}>
                          {assessment.assessmentType === 'comprehensive' ? 'Comprehensive' : 'Quick'}
                        </Text>
                      </View>
                      <Text style={tw`text-gray-400 text-xs mt-1`}>{assessment.scenarioCount} scenarios</Text>
                    </View>
                  </View>

                  <View style={tw`flex-row flex-wrap mb-3`}>
                    {assessment.profile.secondary_emotions?.slice(0, 3).map((emotion: string, i: number) => (
                      <View key={i} style={tw`bg-jung-purple/10 rounded-full px-2 py-1 mr-2 mb-1`}>
                        <Text style={tw`text-jung-purple text-xs font-medium`}>{emotion}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={tw`bg-gray-200 h-1 rounded-full overflow-hidden`}>
                    <View
                      style={[
                        tw`bg-jung-purple h-full rounded-full`,
                        { width: `${(assessment.profile.intensity || 0) * 10}%` }
                      ]}
                    />
                  </View>
                  <Text style={tw`text-gray-500 text-xs mt-1 text-right`}>
                    Intensity: {assessment.profile.intensity}/10
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={tw`bg-jung-purple rounded-2xl py-4 mt-6 flex-row justify-center items-center`}
          onPress={() => setShowHistory(false)}
        >
          <SafePhosphorIcon iconType="ArrowLeft" size={20} color="white" weight="bold" />
          <Text style={tw`text-white font-bold ml-2`}>Back to Assessment</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderResults = () => {
    if (!emotionalProfile) return null;

    const primaryEmotion = emotionOptions.find(e => e.id === emotionalProfile.primary_emotion);

    return (
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
        {/* Celebration Header */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-lg mb-6 items-center`}>
          <View style={tw`bg-jung-purple/10 rounded-full w-20 h-20 items-center justify-center mb-4`}>
            <Text style={tw`text-4xl`}>{primaryEmotion?.emoji || '🧘'}</Text>
          </View>
          <Text style={tw`text-2xl font-bold text-jung-purple mb-2`}>Assessment Complete!</Text>
          <Text style={tw`text-gray-600 text-center`}>Your emotional profile has been analyzed</Text>
        </View>

        {/* Primary Emotion Card */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-lg mb-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <SafePhosphorIcon iconType="Heart" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>Primary Emotion</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-3xl mr-3`}>{primaryEmotion?.emoji || '😐'}</Text>
            <View>
              <Text style={tw`text-2xl font-bold text-gray-800 capitalize`}>
                {emotionalProfile.primary_emotion}
              </Text>
              <Text style={tw`text-gray-500`}>Dominant emotional state</Text>
            </View>
          </View>
        </View>

        {/* Secondary Emotions */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-lg mb-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <SafePhosphorIcon iconType="Brain" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>Secondary Emotions</Text>
          </View>
          <View style={tw`flex-row flex-wrap`}>
            {emotionalProfile.secondary_emotions.map((emotion: string, index: number) => {
              const emotionData = emotionOptions.find(e => e.id === emotion || e.name.toLowerCase() === emotion.toLowerCase());
              return (
                <View key={index} style={tw`bg-jung-purple/10 border border-jung-purple/20 rounded-2xl px-4 py-2 mr-2 mb-2 flex-row items-center`}>
                  <Text style={tw`text-lg mr-2`}>{emotionData?.emoji || '😐'}</Text>
                  <Text style={tw`text-jung-purple font-medium capitalize`}>{emotion}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Intensity Gauge */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-lg mb-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <SafePhosphorIcon iconType="Gauge" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>Emotional Intensity</Text>
          </View>
          <View style={tw`relative`}>
            <View style={tw`bg-gray-200 h-4 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.round((emotionalProfile.intensity || 0) * 10)}%`,
                    backgroundColor: emotionalProfile.intensity > 7 ? '#EF4444' : emotionalProfile.intensity > 4 ? '#F59E0B' : '#10B981'
                  }
                ]}
              />
            </View>
            <Text style={tw`text-right mt-2 text-xl font-bold text-gray-800`}>
              {emotionalProfile.intensity}/10
            </Text>
          </View>
        </View>

        {/* Insights Cards */}
        <View style={tw`flex-row space-x-2 mb-4`}>
          <View style={tw`bg-white rounded-3xl p-4 shadow-lg flex-1`}>
            <SafePhosphorIcon iconType="Warning" size={20} color="#F59E0B" weight="bold" />
            <Text style={tw`text-gray-800 font-bold mt-2 mb-2`}>Triggers</Text>
            {emotionalProfile.triggers.slice(0, 2).map((trigger: string, index: number) => (
              <Text key={index} style={tw`text-gray-600 text-sm leading-relaxed`}>• {trigger}</Text>
            ))}
          </View>

          <View style={tw`bg-white rounded-3xl p-4 shadow-lg flex-1`}>
            <SafePhosphorIcon iconType="Lightbulb" size={20} color="#10B981" weight="bold" />
            <Text style={tw`text-gray-800 font-bold mt-2 mb-2`}>Needs</Text>
            {emotionalProfile.needs.slice(0, 2).map((need: string, index: number) => (
              <Text key={index} style={tw`text-gray-600 text-sm leading-relaxed`}>• {need}</Text>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`space-y-3 mb-6`}>
          <TouchableOpacity
            style={tw`bg-jung-purple rounded-2xl py-4 flex-row justify-center items-center shadow-lg`}
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            <SafePhosphorIcon iconType="Sparkle" size={20} color="white" weight="bold" />
            <Text style={tw`text-white font-bold ml-2 text-lg`}>Get Personalized Motivation</Text>
          </TouchableOpacity>

          <View style={tw`flex-row space-x-3`}>
            <TouchableOpacity
              style={tw`bg-white border-2 border-jung-purple rounded-2xl py-3 flex-row justify-center items-center flex-1`}
              onPress={() => setShowInsights(true)}
            >
              <SafePhosphorIcon iconType="Lightbulb" size={18} color="#4A3B78" weight="bold" />
              <Text style={tw`text-jung-purple font-bold ml-1`}>Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-white border-2 border-jung-purple rounded-2xl py-3 flex-row justify-center items-center flex-1`}
              onPress={() => setShowHistory(true)}
            >
              <SafePhosphorIcon iconType="Clock" size={18} color="#4A3B78" weight="bold" />
              <Text style={tw`text-jung-purple font-bold ml-1`}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emotional Challenge */}
        <View style={tw`bg-gradient-to-r from-jung-purple/10 to-blue-100 rounded-3xl p-6 border border-jung-purple/20`}>
          <View style={tw`flex-row items-center mb-3`}>
            <SafePhosphorIcon iconType="Target" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-jung-purple font-bold ml-2 text-lg`}>Today's Challenge</Text>
          </View>
          <Text style={tw`text-gray-700 leading-relaxed`}>
            {emotionalChallenges[Math.floor(Math.random() * emotionalChallenges.length)].description}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        
        {/* Enhanced Header */}
        <View style={tw`px-6 py-4 bg-white/95 border-b border-gray-200`}>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={tw`bg-gray-100 rounded-xl p-2`}
              onPress={() => navigation.goBack()}
            >
              <SafePhosphorIcon iconType="ArrowLeft" size={20} color="#4A3B78" weight="bold" />
            </TouchableOpacity>

            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-xl font-bold text-jung-purple`}>
                {assessmentComplete ? 'Your Profile' : showHistory ? 'History' : loadingQuestions ? 'Preparing...' : 'Assessment'}
              </Text>
              {!assessmentComplete && !showHistory && !loadingQuestions && (
                <Text style={tw`text-gray-500 text-sm`}>
                  {scenarioSet === 'quick' ? 'Quick' : 'Comprehensive'} Assessment
                </Text>
              )}
            </View>

            {!assessmentComplete && !showHistory && (
              <View style={tw`flex-row space-x-2`}>
                <TouchableOpacity
                  style={tw`bg-jung-purple/10 rounded-xl p-2`}
                  onPress={() => setShowQuestionStats(true)}
                >
                  <SafePhosphorIcon iconType="ChartBar" size={20} color="#4A3B78" weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-jung-purple/10 rounded-xl p-2`}
                  onPress={() => setShowHistory(true)}
                >
                  <SafePhosphorIcon iconType="ClockCounterClockwise" size={20} color="#4A3B78" weight="bold" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {!assessmentComplete && !showInsights && !showHistory && !loading && !loadingQuestions && (
          <View style={tw`bg-white border-b border-gray-100 py-4`}>
            <View style={tw`flex-row justify-center space-x-2 px-6`}>
              <TouchableOpacity
                style={tw`${scenarioSet === "quick" ? "bg-jung-purple" : "bg-gray-100"} rounded-2xl py-3 px-6 flex-1 items-center`}
                onPress={() => handleScenarioSetChange("quick")}
              >
                <SafePhosphorIcon
                  iconType="Lightning"
                  size={16}
                  color={scenarioSet === "quick" ? "white" : "#6B7280"}
                  weight="bold"
                />
                <Text style={tw`${scenarioSet === "quick" ? "text-white" : "text-gray-600"} font-bold text-sm mt-1`}>
                  Quick (5 min)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`${scenarioSet === "comprehensive" ? "bg-jung-purple" : "bg-gray-100"} rounded-2xl py-3 px-6 flex-1 items-center`}
                onPress={() => handleScenarioSetChange("comprehensive")}
              >
                <SafePhosphorIcon
                  iconType="ChartLine"
                  size={16}
                  color={scenarioSet === "comprehensive" ? "white" : "#6B7280"}
                  weight="bold"
                />
                <Text style={tw`${scenarioSet === "comprehensive" ? "text-white" : "text-gray-600"} font-bold text-sm mt-1`}>
                  Comprehensive (10 min)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Rotation Info */}
            {questionStats && (
              <View style={tw`px-6 mt-3`}>
                <View style={tw`bg-jung-purple/5 rounded-xl p-3 flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <SafePhosphorIcon iconType="Shuffle" size={16} color="#4A3B78" weight="bold" />
                    <Text style={tw`text-jung-purple text-sm font-medium ml-2`}>
                      Fresh questions from {emotionalQuestionBank.length} total
                    </Text>
                  </View>
                  <Text style={tw`text-jung-purple/70 text-xs`}>
                    {questionStats.recentQuestions} used recently
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        
        {(loading || loadingQuestions) ? (
          <View style={tw`flex-1 justify-center items-center bg-white`}>
            <View style={tw`bg-jung-purple/10 rounded-full w-24 h-24 items-center justify-center mb-6`}>
              <ActivityIndicator size="large" color="#4A3B78" />
            </View>
            <Text style={tw`text-jung-purple text-xl font-bold mb-2`}>
              {loadingQuestions ? 'Selecting Questions' : 'Analyzing Your Profile'}
            </Text>
            <Text style={tw`text-gray-600 text-center px-8`}>
              {loadingQuestions
                ? 'Curating personalized questions based on your history and preferences...'
                : 'Our AI is processing your responses to create a personalized emotional profile...'
              }
            </Text>
            <View style={tw`mt-6 bg-gray-200 h-1 w-64 rounded-full overflow-hidden`}>
              <View style={tw`bg-jung-purple h-full w-2/3 rounded-full`} />
            </View>
          </View>
        ) : (
          renderScenario()
        )}


      </SafeAreaView>
    </GradientBackground>
  );
};
