import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import tw from '../lib/tailwind';
import { decryptData } from '../lib/security';
import { generateAIResponse } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowRight, ArrowLeft, Sparkle } from 'phosphor-react-native';
import { quotes } from '../data/quotes';

export default function DailyMotivationScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);
  const [personalizedQuote, setPersonalizedQuote] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Get user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('No authenticated user');
          }
          
          // Fetch most recent emotional state
          const { data: emotionalStates, error } = await supabase
            .from('emotional_states')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(1);
            
          if (error) throw error;
          
          // If we have emotional data, decrypt and use it
          if (emotionalStates && emotionalStates.length > 0) {
            const decryptedData = await decryptData(emotionalStates[0].encrypted_data);
            const profile = JSON.parse(decryptedData);
            setEmotionalProfile(profile);
            
            // Generate personalized quote
            await generatePersonalizedQuote(profile);
          } else {
            // No emotional data, use random quote
            selectRandomQuote();
          }
        } catch (error) {
          console.error('Error in DailyMotivationScreen:', error);
          selectRandomQuote();
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [])
  );

  const selectRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex].text);
    setCurrentAuthor(quotes[randomIndex].author);
  };

  const generatePersonalizedQuote = async (profile: any) => {
    try {
      // Create prompt for AI
      const prompt = `
        Generate a personalized daily motivation quote for someone with the following emotional profile:
        
        Primary emotion: ${profile.primary_emotion}
        Secondary emotions: ${profile.secondary_emotions.join(', ')}
        Emotional intensity: ${profile.intensity}/10
        Emotional needs: ${profile.needs.join(', ')}
        
        The quote should:
        1. Acknowledge their emotional state without being patronizing
        2. Offer wisdom or insight relevant to their needs
        3. Provide gentle encouragement or perspective
        4. Feel personal and specific to their situation
        5. Have a touch of depth and wisdom (similar to Carl Jung or other great thinkers)
        
        The quote should be 2-4 sentences long and should NOT be attributed to anyone specific (unless it's a genuine quote).
        Return only the quote text with no additional explanation or formatting.
      `;
      
      // Generate quote
      const aiResponse = await generateAIResponse(prompt);
      setPersonalizedQuote(aiResponse.trim());
      
      // Also set a fallback quote
      selectRandomQuote();
      
    } catch (error) {
      console.error('Error generating personalized quote:', error);
      selectRandomQuote();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#4A3B78" />
          <Text style={tw`mt-4 text-lg text-jung-purple`}>Finding your daily inspiration...</Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={tw`flex-1 p-6`}>
        {personalizedQuote ? (
          <View style={tw`mb-10`}>
            <View style={tw`flex-row mb-2`}>
              <Sparkle size={20} color="#4A3B78" />
              <Text style={tw`text-sm text-jung-purple ml-1 font-medium`}>Personalized For You</Text>
            </View>
            
            <View style={tw`bg-white rounded-xl p-6 shadow-md mb-4`}>
              <Text style={tw`text-lg text-gray-800 italic`}>
                "{personalizedQuote}"
              </Text>
            </View>
            
            {emotionalProfile && (
              <View style={tw`bg-gray-50 rounded-lg p-4 border border-gray-200`}>
                <Text style={tw`text-sm text-gray-500 mb-2`}>Based on your emotional profile:</Text>
                <View style={tw`flex-row flex-wrap`}>
                  <View style={tw`bg-jung-purple-light rounded-full px-3 py-1 mr-2 mb-2`}>
                    <Text style={tw`text-jung-purple text-xs`}>{emotionalProfile.primary_emotion}</Text>
                  </View>
                  {emotionalProfile.secondary_emotions.slice(0, 2).map((emotion: string, index: number) => (
                    <View key={index} style={tw`bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2`}>
                      <Text style={tw`text-gray-700 text-xs`}>{emotion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : null}
        
        <View>
          <Text style={tw`text-sm text-gray-500 mb-2`}>Daily Wisdom</Text>
          <View style={tw`bg-white rounded-xl p-6 shadow-md`}>
            <Text style={tw`text-lg text-gray-800 italic mb-4`}>
              "{currentQuote}"
            </Text>
            {currentAuthor && (
              <Text style={tw`text-right text-gray-600`}>— {currentAuthor}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={tw`mt-6 bg-jung-purple-light rounded-lg py-3 items-center`}
          onPress={selectRandomQuote}
        >
          <Text style={tw`text-jung-purple font-medium`}>
            Show Another Quote
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={tw`mt-4 flex-row justify-center items-center py-2`}
          onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
        >
          <Text style={tw`text-gray-600 mr-2`}>Update Your Emotional Profile</Text>
          <ArrowRight size={16} color="#718096" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`p-4 border-b border-gray-200 flex-row items-center`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#4A3B78" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-center text-jung-purple flex-1 mr-8`}>
            Daily Motivation
          </Text>
        </View>
        
        {renderContent()}
      </SafeAreaView>
    </GradientBackground>
  );
}
