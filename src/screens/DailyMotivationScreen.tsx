import React, { useState, useEffect } from 'react';
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
          
          // If we have emotional data, try to decrypt and use it
          if (emotionalStates && emotionalStates.length > 0) {
            try {
              // Make sure we properly await the async decryptData function
              const decryptedData = await decryptData(emotionalStates[0].encrypted_data);
              
              // Add additional validation before parsing
              if (!decryptedData || typeof decryptedData !== 'string' || decryptedData.trim() === '') {
                throw new Error('Decrypted data is empty or invalid');
              }
              
              const profile = JSON.parse(decryptedData);
              
              // Validate the profile structure before using it
              if (!profile || typeof profile !== 'object' || 
                  !profile.primary_emotion || 
                  !Array.isArray(profile.secondary_emotions) || 
                  !Array.isArray(profile.needs)) {
                throw new Error('Decrypted profile has invalid structure');
              }
              
              setEmotionalProfile(profile);
              // Generate personalized quote only if decryption is successful
              await generatePersonalizedQuote(profile);
            } catch (decryptError) {
              console.error('Error decrypting emotional data:', decryptError);
              // Clear potentially bad data and fall back to random quote
              setEmotionalProfile(null);
              setPersonalizedQuote('');
              selectRandomQuote();
            }
          } else {
            // No emotional data, use random quote
            setEmotionalProfile(null); // Ensure profile is null if no data
            setPersonalizedQuote(''); // Ensure personalized quote is empty
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
          <ActivityIndicator size="large" color="#97C1A9" />
          <Text style={tw`mt-4 text-lg text-gray-700`}>Finding your daily inspiration...</Text>
        </View>
      );
    }
    
    // Corrected renderContent structure
    return (
      <ScrollView style={tw`flex-1 p-6`}>
        
        {/* Personalized Section */}
        {personalizedQuote ? (
          <View style={tw`mb-10`}>
            <View style={tw`flex-row mb-2 items-center`}>
              <SafePhosphorIcon iconType="Smiley" size={22} color="#97C1A9" weight="fill" />
              <Text style={tw`text-sm text-gray-700 ml-2 font-medium`}>Personalized For You</Text>
            </View>
            <View style={tw`bg-white/90 rounded-xl p-6 shadow-md mb-4 border border-soothing-green/30`}>
              <Text style={tw`text-lg text-gray-700 italic leading-relaxed`}>
                "{personalizedQuote}"
              </Text>
            </View>
            {emotionalProfile && (
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
            )}
          </View>
        ) : null} 
        {/* End Personalized Section */}

        {/* Daily Wisdom Section */}
        {currentQuote ? (
          <View style={tw`mb-8`}> {/* Added mb-8 for spacing */}
            <View style={tw`flex-row mb-2 items-center`}>
              <SafePhosphorIcon iconType="Sparkle" size={20} color="#97C1A9" weight="fill" />
              <Text style={tw`text-sm text-gray-700 ml-2 font-medium`}>Daily Wisdom</Text>
            </View>
            <View style={tw`bg-white/90 rounded-xl p-6 shadow-md border border-soothing-green/30`}>
              <Text style={tw`text-lg text-gray-700 italic mb-4 leading-relaxed`}>
                "{currentQuote}"
              </Text>
              {currentAuthor && (
                <Text style={tw`text-right text-gray-500`}>— {currentAuthor}</Text>
              )}
            </View>
          </View>
        ) : null}
        {/* End Daily Wisdom Section */}

        {/* Buttons Section */}
        <TouchableOpacity
          style={tw`bg-jung-purple rounded-xl py-4 items-center shadow-sm`} // Removed mt-8 as spacing is handled by Daily Wisdom section margin
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
        {/* End Buttons Section */}

      </ScrollView> // Closing ScrollView tag was missing/misplaced before
    );
  };

  return ( // This return was correct
    <GradientBackground variant="motivation">
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.07} variant="motivation" />
        
        {/* Custom header removed, will rely on AppNavigator's header options */}
        {/*
        <View style={tw`p-4 border-b border-soothing-green/30 flex-row items-center`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#4A3B78" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-center text-gray-700 flex-1 mr-8`}>
            Daily Motivation
          </Text>
        </View>
        */}
        
        {renderContent()}

        {/* Add Home Button */}
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
