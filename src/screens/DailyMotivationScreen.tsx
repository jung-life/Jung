import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Share,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import tw from '../lib/tailwind';
import { decryptData } from '../lib/encryptionUtils';
import { generateAIResponse } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { quotes } from '../data/quotes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface MotivationCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface DailyStats {
  currentStreak: number;
  totalDays: number;
  lastVisit: string;
  favoritesCount: number;
}

const motivationCategories: MotivationCategory[] = [
  { id: 'growth', name: 'Growth', icon: 'TrendUp', color: '#10B981', description: 'Personal development and progress' },
  { id: 'resilience', name: 'Resilience', icon: 'Shield', color: '#F59E0B', description: 'Strength through challenges' },
  { id: 'mindfulness', name: 'Mindfulness', icon: 'Brain', color: '#8B5CF6', description: 'Present moment awareness' },
  { id: 'success', name: 'Success', icon: 'Trophy', color: '#EF4444', description: 'Achievement and goals' },
  { id: 'relationships', name: 'Love', icon: 'Heart', color: '#EC4899', description: 'Connection and compassion' },
  { id: 'wisdom', name: 'Wisdom', icon: 'BookOpen', color: '#06B6D4', description: 'Deep insights and understanding' },
];

export default function DailyMotivationScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [emotionalProfile, setEmotionalProfile] = useState<any>(null);
  const [personalizedQuote, setPersonalizedQuote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    currentStreak: 0,
    totalDays: 0,
    lastVisit: '',
    favoritesCount: 0
  });
  const [favoriteQuotes, setFavoriteQuotes] = useState<string[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const isMounted = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      isMounted.current = true;
      const fetchData = async () => {
        await loadDailyStats();
        await loadFavorites();
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
              const decryptedData = decryptData(emotionalStates[0].encrypted_data);
              console.log('Raw decrypted data:', decryptedData);

              // Check if decryption failed (encryptionUtils returns "[Encrypted Content]" on failure)
              if (decryptedData === "[Encrypted Content]" || !decryptedData) {
                console.warn('Decryption failed, falling back to random quote');
                throw new Error('Decryption failed');
              }

              let profile;
              if (typeof decryptedData === 'string') {
                const cleanedData = decryptedData.trim();
                
                // Skip processing if it's clearly not valid JSON
                if (cleanedData.length < 2 || (!cleanedData.startsWith('{') && !cleanedData.includes('{'))) {
                  console.warn('Decrypted data does not appear to be JSON:', cleanedData);
                  throw new Error('Decrypted data is not valid JSON format');
                }
                
                try {
                  // Try direct JSON parse
                  profile = JSON.parse(cleanedData);
                } catch (firstError) {
                  // Try to extract JSON object with regex
                  const jsonMatch = cleanedData.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    try {
                      profile = JSON.parse(jsonMatch[0]);
                    } catch (secondError) {
                      console.error('Failed to parse extracted JSON:', secondError, 'Extracted:', jsonMatch[0]);
                      throw new Error('No valid JSON found in decrypted data');
                    }
                  } else {
                    console.error('No JSON object found in decrypted data:', cleanedData);
                    throw new Error('No valid JSON found in decrypted data');
                  }
                }
              } else if (typeof decryptedData === 'object' && decryptedData !== null) {
                profile = decryptedData;
              } else {
                console.error('Decrypted data is not a string or object:', decryptedData);
                throw new Error('Invalid data format');
              }

              // Validate that we have a valid profile structure
              if (!profile || typeof profile !== 'object') {
                console.error('Profile is not a valid object:', profile);
                throw new Error('Invalid profile structure');
              }

              // Validate and set defaults
              const validatedProfile = {
                primary_emotion: profile?.primary_emotion || 'neutral',
                secondary_emotions: Array.isArray(profile?.secondary_emotions) 
                  ? profile.secondary_emotions 
                  : ['calm'],
                intensity: typeof profile?.intensity === 'number' ? profile.intensity : 5,
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
          if (isMounted.current) selectRandomQuote(selectedCategory);
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
      if (isMounted.current) {
        setPersonalizedQuote(aiResponse.trim());
        setIsPersonalized(true);
      }
      
      // Also set a fallback quote
      if (isMounted.current) selectRandomQuote(selectedCategory);
      
    } catch (error) {
      console.error('Error generating personalized quote:', error);
      if (isMounted.current) selectRandomQuote(selectedCategory);
    }
  };

  const renderCategoryPill = ({ item }: { item: MotivationCategory }) => (
    <TouchableOpacity
      style={tw`${selectedCategory === item.id ? 'bg-white' : 'bg-white/20'} rounded-full px-4 py-2 mr-3 flex-row items-center border ${
        selectedCategory === item.id ? 'border-white' : 'border-white/30'
      }`}
      onPress={() => {
        setSelectedCategory(item.id);
        selectRandomQuote(item.id);
      }}
      activeOpacity={0.7}
    >
      <SafePhosphorIcon
        iconType={item.icon as any}
        size={16}
        color={selectedCategory === item.id ? item.color : 'white'}
        weight="bold"
      />
      <Text style={tw`${selectedCategory === item.id ? 'text-gray-700' : 'text-white'} font-semibold ml-2 text-sm`}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <View style={tw`bg-white/80 rounded-3xl p-8 items-center shadow-lg`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-lg text-jung-deep font-medium`}>Finding your daily inspiration...</Text>
            <Text style={tw`text-jung-deep/70 text-sm mt-2 text-center`}>Crafting the perfect motivation for you</Text>
          </View>
        </View>
      );
    }

    const displayQuote = (isPersonalized && personalizedQuote) ? personalizedQuote : currentQuote;
    const isQuoteFavorited = favoriteQuotes.includes(displayQuote);

    return (
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={tw`px-6 py-4`}>
          <View style={tw`bg-white/90 rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`items-center flex-1`}>
                <View style={tw`bg-orange-100 rounded-full w-12 h-12 items-center justify-center mb-2`}>
                  <SafePhosphorIcon iconType="Fire" size={24} color="#F97316" weight="fill" />
                </View>
                <Text style={tw`text-2xl font-bold text-orange-600`}>{dailyStats.currentStreak}</Text>
                <Text style={tw`text-gray-600 text-xs font-medium`}>Day Streak</Text>
              </View>

              <View style={tw`items-center flex-1`}>
                <View style={tw`bg-jung-purple/10 rounded-full w-12 h-12 items-center justify-center mb-2`}>
                  <SafePhosphorIcon iconType="Calendar" size={24} color="#4A3B78" weight="bold" />
                </View>
                <Text style={tw`text-2xl font-bold text-jung-purple`}>{dailyStats.totalDays}</Text>
                <Text style={tw`text-gray-600 text-xs font-medium`}>Total Days</Text>
              </View>

              <View style={tw`items-center flex-1`}>
                <View style={tw`bg-red-100 rounded-full w-12 h-12 items-center justify-center mb-2`}>
                  <SafePhosphorIcon iconType="Heart" size={24} color="#EF4444" weight="fill" />
                </View>
                <Text style={tw`text-2xl font-bold text-red-500`}>{dailyStats.favoritesCount}</Text>
                <Text style={tw`text-gray-600 text-xs font-medium`}>Favorites</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-jung-deep font-bold text-lg mb-3`}>Choose Your Focus</Text>
          <View style={tw`flex-row mb-3`}>
            <TouchableOpacity
              style={tw`${selectedCategory === 'all' ? 'bg-white' : 'bg-white/20'} rounded-full px-4 py-2 mr-3 flex-row items-center border ${
                selectedCategory === 'all' ? 'border-white' : 'border-white/30'
              }`}
              onPress={() => {
                setSelectedCategory('all');
                selectRandomQuote('all');
              }}
              activeOpacity={0.7}
            >
              <SafePhosphorIcon
                iconType="Sparkle"
                size={16}
                color={selectedCategory === 'all' ? '#4A3B78' : 'white'}
                weight="bold"
              />
              <Text style={tw`${selectedCategory === 'all' ? 'text-jung-purple' : 'text-white'} font-semibold ml-2 text-sm`}>
                All
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={motivationCategories}
            renderItem={renderCategoryPill}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`pb-2`}
          />
        </View>

        {/* Main Quote Card */}
        {displayQuote ? (
          <View style={tw`px-6 mb-6`}>
            <View style={tw`bg-white rounded-3xl p-6 shadow-lg border border-white/50 relative overflow-hidden`}>
              {/* Background decoration */}
              <View style={tw`absolute top-0 right-0 w-32 h-32 opacity-5`}>
                <SafePhosphorIcon iconType="Quotes" size={128} color="#4A3B78" weight="thin" />
              </View>

              {/* Quote type indicator */}
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`${isPersonalized ? 'bg-jung-purple' : 'bg-blue-500'} rounded-full px-3 py-1 flex-row items-center`}>
                  <SafePhosphorIcon
                    iconType={isPersonalized ? "Brain" : "Sparkle"}
                    size={14}
                    color="white"
                    weight="bold"
                  />
                  <Text style={tw`text-white text-xs font-bold ml-1`}>
                    {isPersonalized ? 'Personalized for You' : 'Daily Wisdom'}
                  </Text>
                </View>
              </View>

              <Text style={tw`text-lg text-gray-800 leading-relaxed mb-4 font-medium`}>
                "{displayQuote}"
              </Text>

              {currentAuthor && !isPersonalized ? (
                <Text style={tw`text-right text-gray-500 italic mb-4`}>— {currentAuthor}</Text>
              ) : null}

              {/* Action buttons */}
              <View style={tw`flex-row justify-between items-center pt-4 border-t border-gray-100`}>
                <TouchableOpacity
                  style={tw`flex-row items-center`}
                  onPress={() => toggleFavorite(displayQuote)}
                  activeOpacity={0.7}
                >
                  <SafePhosphorIcon
                    iconType="Heart"
                    size={20}
                    color={isQuoteFavorited ? "#EF4444" : "#9CA3AF"}
                    weight={isQuoteFavorited ? "fill" : "bold"}
                  />
                  <Text style={tw`${isQuoteFavorited ? 'text-red-500' : 'text-gray-500'} font-medium ml-2 text-sm`}>
                    {isQuoteFavorited ? 'Favorited' : 'Add to Favorites'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-row items-center`}
                  onPress={shareQuote}
                  activeOpacity={0.7}
                >
                  <SafePhosphorIcon iconType="Share" size={20} color="#4A3B78" weight="bold" />
                  <Text style={tw`text-jung-purple font-medium ml-2 text-sm`}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={tw`px-6 space-y-4 mb-8`}>
          <TouchableOpacity
            style={tw`bg-jung-purple rounded-2xl py-4 items-center shadow-lg flex-row justify-center`}
            onPress={() => selectRandomQuote(selectedCategory)}
            activeOpacity={0.8}
          >
            <SafePhosphorIcon iconType="Sparkle" size={20} color="white" weight="bold" />
            <Text style={tw`text-white font-bold ml-2 text-lg`}>
              Get New Inspiration
            </Text>
          </TouchableOpacity>

          {emotionalProfile ? (
            <TouchableOpacity
              style={tw`bg-white border-2 border-jung-purple rounded-2xl py-4 items-center flex-row justify-center`}
              onPress={() => generatePersonalizedQuote(emotionalProfile)}
              activeOpacity={0.8}
            >
              <SafePhosphorIcon iconType="Brain" size={20} color="#4A3B78" weight="bold" />
              <Text style={tw`text-jung-purple font-bold ml-2 text-lg`}>
                Generate Personal Quote
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={tw`bg-white/80 rounded-2xl py-4 items-center flex-row justify-center border border-white/50`}
            onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
            activeOpacity={0.8}
          >
            <SafePhosphorIcon iconType="ChartLine" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-jung-purple font-semibold ml-2`}>
              Update Emotional Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <GradientBackground variant="motivation">
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.07} variant="motivation" />
        {renderContent()}
      </SafeAreaView>
    </GradientBackground>
  );
}
