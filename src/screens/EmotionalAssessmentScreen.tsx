import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import tw from '../lib/tailwind';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from '../lib/encryptionUtils';
import { generateAIResponse } from '../lib/api';
import { ArrowLeft, Heart, ChartBar, Brain, Lightbulb, Scales, Plant, ArrowRight, CaretRight, CaretLeft } from 'phosphor-react-native';
import { additionalScenarios, emotionalInsights, emotionalChallenges } from '../data/emotionalScenarios';

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
  const [responses, setResponses] = useState<{scenarioId: string, emotion: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);
  const [scenarioSet, setScenarioSet] = useState<"base" | "all">("base");
  // const [selectedScenarios, setSelectedScenarios] = useState(baseScenarios); // Remove this useState
  const [showInsights, setShowInsights] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Memoize the selected scenarios
  const selectedScenarios = useMemo(() => {
    console.log(`Recalculating scenarios for set: ${scenarioSet}`); // Add log for debugging
    if (scenarioSet === "base") {
      return baseScenarios;
    } else {
      // For comprehensive assessment, select 10 random scenarios from the full set
      const randomScenarios = [...allScenarios]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
      return randomScenarios;
    }
  }, [scenarioSet]); // Dependency array ensures recalculation only when scenarioSet changes

  // Reset index and responses when selectedScenarios changes (derived from scenarioSet)
  useEffect(() => {
    setCurrentScenarioIndex(0);
    setResponses([]);
    // Scroll to top when scenarios change
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false }); // Use non-animated scroll here
    }
  }, [selectedScenarios]); // Now depends on the memoized value

  const handleResponse = (emotion: string) => {
    const scenarioId = selectedScenarios[currentScenarioIndex].id;
    setResponses([...responses, { scenarioId, emotion }]);
    
    if (currentScenarioIndex < selectedScenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      // Scroll to top for next scenario
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    } else {
      completeAssessment();
    }
  };

  const handleScenarioSetChange = (set: "base" | "all") => {
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
              setCurrentScenarioIndex(0);
              setResponses([]);
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
      const analysisResult = await generateAIResponse(prompt);
      
      // Parse JSON response
      const profileData = JSON.parse(analysisResult);
      setEmotionalProfile(profileData);
      
      // Save to database (encrypted)
      await saveEmotionalProfile(profileData);
      
      // Mark assessment as complete
      setAssessmentComplete(true);
      
    } catch (error) {
      console.error('Error analyzing emotional profile:', error);
      alert('There was an error analyzing your responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveEmotionalProfile = async (profileData: any) => {
    try {
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

  const renderScenario = () => {
    if (assessmentComplete) {
      return renderResults();
    }
    
    if (showInsights) {
      return renderInsights();
    }
    
    const scenario = selectedScenarios[currentScenarioIndex];
    
    return (
      <View style={tw`p-6`}>
        <View style={tw`flex-row items-center mb-6`}>
          <Heart size={24} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
          <Text style={tw`text-xl font-bold text-gray-700`}>
            Scenario {currentScenarioIndex + 1} of {selectedScenarios.length}
          </Text>
        </View>
        
        <View style={tw`bg-white/90 rounded-xl p-6 shadow-md mb-6 border border-emotional/30`}>
          <Text style={tw`text-lg font-medium text-gray-700 mb-6`}>
            {scenario.question}
          </Text>
          
          <View style={tw`space-y-4`}>
            {scenario.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={tw`border border-emotional/30 rounded-lg p-4 active:bg-soothing-lavender/10 bg-white/90`}
                onPress={() => handleResponse(option.emotion)}
              >
                <Text style={tw`text-gray-700 leading-relaxed`}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={tw`flex-row justify-center bg-soothing-lavender/20 rounded-full px-4 py-2 self-center`}>
          <Text style={tw`text-sm text-emotional font-medium`}>
            {currentScenarioIndex + 1} of {selectedScenarios.length} scenarios
          </Text>
        </View>
      </View>
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

  const renderResults = () => {
    if (!emotionalProfile) return null;
    
    return (
      <ScrollView style={tw`p-6`}>
        <View style={tw`flex-row items-center mb-6`}>
          <Heart size={24} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
          <Text style={tw`text-xl font-bold text-gray-700`}>
            Your Emotional Profile
          </Text>
        </View>
        
        <View style={tw`bg-white/90 rounded-xl p-6 shadow-md mb-6 border border-emotional/30`}>
          <View style={tw`mb-5 border-b border-gray-100 pb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Heart size={18} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
              <Text style={tw`text-sm text-gray-600 font-medium`}>Primary Emotion</Text>
            </View>
            <Text style={tw`text-xl font-semibold text-emotional`}>
              {emotionalProfile.primary_emotion}
            </Text>
          </View>
          
          <View style={tw`mb-5 border-b border-gray-100 pb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Brain size={18} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
              <Text style={tw`text-sm text-gray-600 font-medium`}>Secondary Emotions</Text>
            </View>
            <View style={tw`flex-row flex-wrap`}>
              {emotionalProfile.secondary_emotions.map((emotion: string, index: number) => (
                <View key={index} style={tw`bg-emotional/10 border border-emotional/20 rounded-full px-3 py-1 mr-2 mb-2`}>
                  <Text style={tw`text-emotional`}>{emotion}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={tw`mb-5 border-b border-gray-100 pb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <ChartBar size={18} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
              <Text style={tw`text-sm text-gray-600 font-medium`}>Emotional Intensity</Text>
            </View>
            <View style={tw`bg-gray-200 h-3 rounded-full overflow-hidden`}>
              <View 
                style={[
                  tw`bg-emotional h-full`, 
                  { width: `${emotionalProfile.intensity * 10}%` }
                ]} 
              />
            </View>
            <Text style={tw`text-right mt-1 text-sm text-gray-600`}>
              {emotionalProfile.intensity}/10
            </Text>
          </View>
          
          <View style={tw`mb-5 border-b border-gray-100 pb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Scales size={18} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
              <Text style={tw`text-sm text-gray-600 font-medium`}>Potential Triggers</Text>
            </View>
            <View>
              {emotionalProfile.triggers.map((trigger: string, index: number) => (
                <Text key={index} style={tw`text-gray-700 mb-1 leading-relaxed`}>• {trigger}</Text>
              ))}
            </View>
          </View>
          
          <View>
            <View style={tw`flex-row items-center mb-2`}>
              <Lightbulb size={18} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
              <Text style={tw`text-sm text-gray-600 font-medium`}>Emotional Needs</Text>
            </View>
            <View>
              {emotionalProfile.needs.map((need: string, index: number) => (
                <Text key={index} style={tw`text-gray-700 mb-1 leading-relaxed`}>• {need}</Text>
              ))}
            </View>
          </View>
        </View>
        
        <View style={tw`flex-row mb-4`}>
          <TouchableOpacity
            style={tw`bg-emotional/90 rounded-xl py-4 mb-4 flex-row justify-center items-center shadow-sm flex-1 mr-2`}
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            <Plant size={20} color="#fff" weight="fill" style={tw`mr-2`} />
            <Text style={tw`text-white text-center font-medium`}>
              See Daily Motivation
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw`bg-white border border-emotional rounded-xl py-4 mb-4 flex-row justify-center items-center shadow-sm flex-1 ml-2`}
            onPress={() => setShowInsights(true)}
          >
            <Lightbulb size={20} color="#CEB5CD" weight="fill" style={tw`mr-2`} />
            <Text style={tw`text-emotional text-center font-medium`}>
              Emotional Insights
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tw`bg-emotional/10 rounded-xl p-4 border border-emotional/20 mb-6`}>
          <Text style={tw`text-gray-700 font-medium mb-2`}>
            Try this emotional awareness challenge:
          </Text>
          <Text style={tw`text-gray-600 mb-2`}>
            {emotionalChallenges[Math.floor(Math.random() * emotionalChallenges.length)].description}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <GradientBackground variant="emotional">
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.07} variant="emotional" />
        
        <View style={tw`p-4 border-b border-emotional/30 flex-row items-center`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#CEB5CD" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-center text-gray-700 flex-1 mr-8`}>
            Emotional Assessment
          </Text>
        </View>
        
        {!assessmentComplete && !showInsights && !loading && (
          <View style={tw`flex-row justify-center border-b border-emotional/20 py-2 bg-white/80`}>
            <TouchableOpacity
              style={tw`px-4 py-2 rounded-full ${scenarioSet === "base" ? "bg-emotional/20" : ""}`}
              onPress={() => handleScenarioSetChange("base")}
            >
              <Text style={tw`${scenarioSet === "base" ? "text-emotional font-medium" : "text-gray-600"}`}>
                Quick Assessment
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={tw`px-4 py-2 rounded-full ${scenarioSet === "all" ? "bg-emotional/20" : ""}`}
              onPress={() => handleScenarioSetChange("all")}
            >
              <Text style={tw`${scenarioSet === "all" ? "text-emotional font-medium" : "text-gray-600"}`}>
                Comprehensive
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#CEB5CD" />
            <Text style={tw`mt-4 text-lg text-emotional`}>Analyzing your emotional profile...</Text>
          </View>
        ) : (
          <ScrollView ref={scrollViewRef}>
            {renderScenario()}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};
