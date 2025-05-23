import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Image 
} from 'react-native';
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
// Add House icon import
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { quotes } from '../data/quotes';

export default function DailyMotivationScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);
  const [personalizedQuote, setPersonalizedQuote] = useState('');
  const isMounted = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      isMounted.current = true;
      const fetchData = async () => {
        try {
          if (isMounted.current) setLoading(true);
          
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
          
          // If we have emotional data, try to decrypt and use it
          if (emotionalStates && emotionalStates.length > 0) {
            try {
              const decryptedData = await decryptData(emotionalStates[0].encrypted_data);
              console.log('Raw decrypted data:', decryptedData);

              let profile;
              if (typeof decryptedData === 'string') {
                const cleanedData = decryptedData.trim();
                try {
                  profile = JSON.parse(cleanedData);
                } catch (firstError) {
                  // If direct parse fails, try to extract JSON object
                  const jsonMatch = cleanedData.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    profile = JSON.parse(jsonMatch[0]);
                  } else {
                    throw new Error('No valid JSON found in decrypted data');
                  }
                }
              } else if (typeof decryptedData === 'object' && decryptedData !== null) {
                profile = decryptedData;
              } else {
                throw new Error('Invalid data format');
              }

              // Validate and set defaults
              const validatedProfile = {
                primary_emotion: profile?.primary_emotion || 'neutral',
                secondary_emotions: Array.isArray(profile?.secondary_emotions) 
                  ? profile.secondary_emotions 
                  : ['calm'],
                intensity: profile?.intensity || 5,
                needs: Array.isArray(profile?.needs) 
                  ? profile.needs 
                  : ['balance'],
              };

              if (isMounted.current) {
                setEmotionalProfile(validatedProfile);
                await generatePersonalizedQuote(validatedProfile);
              }
            } catch (decryptError) {
              console.error('Error processing emotional data:', decryptError);
              // Clear potentially bad data and fall back to random quote
              if (isMounted.current) {
                setEmotionalProfile(null);
                setPersonalizedQuote('');
                selectRandomQuote();
              }
            }
          } else {
            // No emotional data, use random quote
            if (isMounted.current) {
              setEmotionalProfile(null); // Ensure profile is null if no data
              setPersonalizedQuote(''); // Ensure personalized quote is empty
              selectRandomQuote();
            }
          }
        } catch (error) {
          console.error('Error in DailyMotivationScreen:', error);
          if (isMounted.current) selectRandomQuote();
        } finally {
          if (isMounted.current) setLoading(false);
        }
      };
      
      fetchData();

      return () => {
        isMounted.current = false; // Cleanup on unmount
      };
    }, [])
  );

  const selectRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    if (isMounted.current) {
      setCurrentQuote(quotes[randomIndex].text);
      setCurrentAuthor(quotes[randomIndex].author);
    }
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
      if (isMounted.current) setPersonalizedQuote(aiResponse.trim());
      
      // Also set a fallback quote
      if (isMounted.current) selectRandomQuote();
      
    } catch (error) {
      console.error('Error generating personalized quote:', error);
      if (isMounted.current) selectRandomQuote();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#97C1A9" />
          <Text style={tw`mt-4 text-lg text-gray-700`}>Finding your daily inspiration...</Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={tw`flex-1 p-6`}>
        
        {personalizedQuote ? (
          <View style={tw`mb-10`}>
            <View style={tw`flex-row mb-2 items-center`}>
              <SafePhosphorIcon iconType="Smiley" size={22} color="#97C1A9" weight="fill" />
              <Text style={tw`text-sm text-gray-700 ml-2 font-medium`}>Personalized For You</Text>
            </View>
            <View style={tw`bg-white rounded-xl p-6 shadow-md mb-4 border border-soothing-green/30 overflow-hidden`}>
              <Text style={tw`text-lg text-gray-700 italic leading-relaxed`}>
                "{personalizedQuote}"
              </Text>
            </View>
            {emotionalProfile ? (
              <View style={tw`bg-soothing-green/10 rounded-lg p-4 border border-soothing-green/20`}>
                <Text style={tw`text-sm text-gray-600 mb-2 font-medium`}>Based on your emotional profile:</Text>
                <View style={tw`flex-row flex-wrap`}>
                  <View style={tw`bg-motivation/20 rounded-full px-3 py-1 mr-2 mb-2 border border-motivation/30`}>
                    <Text style={tw`text-gray-700 text-xs font-medium`}>{emotionalProfile.primary_emotion}</Text>
                  </View>
                  {emotionalProfile.secondary_emotions.slice(0, 2).map((emotion: string, index: number) => (
                    <View key={index} style={tw`bg-soothing-green/10 rounded-full px-3 py-1 mr-2 mb-2 border border-soothing-green/20`}>
                      <Text style={tw`text-gray-600 text-xs`}>{emotion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentQuote ? (
          <View style={tw`mb-8`}>
            <View style={tw`flex-row mb-2 items-center`}>
              <SafePhosphorIcon iconType="Sparkle" size={20} color="#97C1A9" weight="fill" />
              <Text style={tw`text-sm text-gray-700 ml-2 font-medium`}>Daily Wisdom</Text>
            </View>
            <View style={tw`bg-white rounded-xl p-6 shadow-md border border-soothing-green/30 overflow-hidden`}>
              <Text style={tw`text-lg text-gray-700 italic mb-4 leading-relaxed`}>
                "{currentQuote}"
              </Text>
              {currentAuthor ? (
                <Text style={tw`text-right text-gray-500`}>— {currentAuthor}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={tw`bg-jung-purple rounded-xl py-4 items-center shadow-sm`}
          onPress={selectRandomQuote}
        >
          <View style={tw`flex-row items-center`}>
            <SafePhosphorIcon iconType="Sparkle" size={20} color="white" weight="fill" style={tw`mr-2`} />
            <Text style={tw`text-white font-medium`}>
              Refresh Your Inspiration
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={tw`mt-6 flex-row justify-center items-center py-4`}
          onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
        >
          <Text style={tw`text-gray-600 mr-2 font-medium`}>Update Your Emotional Profile</Text>
          <SafePhosphorIcon iconType="ArrowLeft" size={16} color="#97C1A9" />
        </TouchableOpacity>

      </ScrollView>
    );
  };

  return (
    <GradientBackground variant="motivation">
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.07} variant="motivation" />
        {renderContent()}
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white/80 border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <SafePhosphorIcon iconType="House" size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
