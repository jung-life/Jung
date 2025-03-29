import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import tw from '../lib/tailwind';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from '../lib/security';
import { generateAIResponse } from '../lib/api';

// Scenarios for emotional assessment
const scenarios = [
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

export const EmotionalAssessmentScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [responses, setResponses] = useState<{scenarioId: string, emotion: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);

  const handleResponse = (emotion: string) => {
    const scenarioId = scenarios[currentScenarioIndex].id;
    setResponses([...responses, { scenarioId, emotion }]);
    
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = async () => {
    try {
      setLoading(true);
      
      // Format responses for analysis
      const formattedResponses = scenarios.map((scenario, index) => {
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
      const encryptedData = await encryptData(JSON.stringify(profileData));
      
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
    
    const scenario = scenarios[currentScenarioIndex];
    
    return (
      <View style={tw`p-6`}>
        <Text style={tw`text-2xl font-bold text-jung-purple mb-6`}>
          Scenario {currentScenarioIndex + 1} of {scenarios.length}
        </Text>
        
        <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
          <Text style={tw`text-lg font-medium text-gray-800 mb-4`}>
            {scenario.question}
          </Text>
          
          <View style={tw`space-y-3`}>
            {scenario.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={tw`border border-gray-200 rounded-lg p-4 active:bg-gray-100`}
                onPress={() => handleResponse(option.emotion)}
              >
                <Text style={tw`text-gray-700`}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-sm text-gray-500`}>
            {currentScenarioIndex + 1} of {scenarios.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderResults = () => {
    if (!emotionalProfile) return null;
    
    return (
      <ScrollView style={tw`p-6`}>
        <Text style={tw`text-2xl font-bold text-jung-purple mb-6`}>
          Your Emotional Profile
        </Text>
        
        <View style={tw`bg-white rounded-xl p-6 shadow-md mb-6`}>
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm text-gray-500 mb-1`}>Primary Emotion</Text>
            <Text style={tw`text-xl font-semibold text-jung-purple`}>
              {emotionalProfile.primary_emotion}
            </Text>
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm text-gray-500 mb-1`}>Secondary Emotions</Text>
            <View style={tw`flex-row flex-wrap`}>
              {emotionalProfile.secondary_emotions.map((emotion: string, index: number) => (
                <View key={index} style={tw`bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2`}>
                  <Text style={tw`text-gray-700`}>{emotion}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm text-gray-500 mb-1`}>Emotional Intensity</Text>
            <View style={tw`bg-gray-200 h-2 rounded-full overflow-hidden`}>
              <View 
                style={[
                  tw`bg-jung-purple h-full`, 
                  { width: `${emotionalProfile.intensity * 10}%` }
                ]} 
              />
            </View>
            <Text style={tw`text-right mt-1 text-sm text-gray-600`}>
              {emotionalProfile.intensity}/10
            </Text>
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm text-gray-500 mb-1`}>Potential Triggers</Text>
            <View>
              {emotionalProfile.triggers.map((trigger: string, index: number) => (
                <Text key={index} style={tw`text-gray-700 mb-1`}>• {trigger}</Text>
              ))}
            </View>
          </View>
          
          <View>
            <Text style={tw`text-sm text-gray-500 mb-1`}>Emotional Needs</Text>
            <View>
              {emotionalProfile.needs.map((need: string, index: number) => (
                <Text key={index} style={tw`text-gray-700 mb-1`}>• {need}</Text>
              ))}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={tw`bg-jung-purple rounded-lg py-4 mb-4`}
          onPress={() => navigation.navigate('DailyMotivationScreen')}
        >
          <Text style={tw`text-white text-center font-semibold`}>
            See Your Daily Motivation
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-lg text-jung-purple`}>Analyzing your emotional profile...</Text>
          </View>
        ) : (
          renderScenario()
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};
