import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, Alert, FlatList, TouchableOpacity } from 'react-native'; // Added FlatList
import { SafeTouchableOpacity } from '../components/SafeTouchableOpacity';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import * as secureStore from '../lib/secureStorage';
import * as Location from 'expo-location'; // Added Expo Location
import { supabase } from '../lib/supabase'; // Added Supabase
import useAuthStore from '../store/useAuthStore'; // Added AuthStore
import { useSubscription } from '../hooks/useSubscription';
import { ConversationLimitPrompt, SubscriptionCTA } from '../components/PremiumPrompts';
import { SubscriptionBanner } from '../components/SubscriptionStatus';
import PremiumUpgradeButton from '../components/PremiumUpgradeButton';
import { OnboardingTutorial, FeatureTour } from '../components/OnboardingTutorial';
import { useOnboarding } from '../hooks/useOnboarding';

// Define types for mood tracking
type MoodOption = 'Happy' | 'Okay' | 'Sad' | 'Anxious' | 'Angry' | 'Calm' | 'Excited' | 'Tired' | 'Stressed'; // Added new moods
type MoodEntry = {
  id: string;
  timestamp: number;
  mood: MoodOption;
  note?: string;
};

const MOOD_STORAGE_KEY = 'moodEntries';

const moodOptions: { name: MoodOption; icon: React.ReactNode; color: string }[] = [
  { name: 'Happy', icon: <SafePhosphorIcon iconType="Smiley" size={32} weight="light" />, color: 'text-green-500' },
  { name: 'Excited', icon: <SafePhosphorIcon iconType="Sparkle" size={32} weight="light" />, color: 'text-orange-500' },
  { name: 'Calm', icon: <SafePhosphorIcon iconType="Wind" size={32} weight="light" />, color: 'text-cyan-500' },
  { name: 'Okay', icon: <SafePhosphorIcon iconType="SmileyMeh" size={32} weight="light" />, color: 'text-yellow-500' },
  { name: 'Sad', icon: <SafePhosphorIcon iconType="SmileySad" size={32} weight="light" />, color: 'text-blue-500' },
  { name: 'Anxious', icon: <SafePhosphorIcon iconType="CloudLightning" size={32} weight="light" />, color: 'text-purple-500' },
  { name: 'Stressed', icon: <SafePhosphorIcon iconType="FireSimple" size={32} weight="light" />, color: 'text-pink-500' },
  { name: 'Angry', icon: <SafePhosphorIcon iconType="SmileyXEyes" size={32} weight="light" />, color: 'text-red-500' },
  { name: 'Tired', icon: <SafePhosphorIcon iconType="Bed" size={32} weight="light" />, color: 'text-slate-500' },
];

const PostLoginScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuthStore(); // Get user from auth store
  const { isPremiumUser } = useSubscription();
  const [conversationCount, setConversationCount] = useState(0); // Track conversation usage

  // Onboarding state
  const {
    shouldShowOnboarding,
    shouldShowFeatureTour,
    isNewUser,
    markOnboardingComplete,
    markFeatureTourSeen,
    incrementSkipCount,
    canSkip
  } = useOnboarding();
  
  // Mood tracker state
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For mood history loading

  // Location fetching logic
  const requestAndSaveLocation = useCallback(async () => {
    if (!user) {
      console.log('User not available for location saving.');
      return;
    }

    console.log('Requesting location permission...');
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed to provide some features. You can enable it in settings.');
      console.log('Location permission denied.');
      return;
    }

    console.log('Location permission granted. Fetching current position...');
    try {
      // Set a timeout for location fetching
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balanced accuracy for reasonable power consumption
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timed out')), 15000) // 15 seconds timeout
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      if (location && location.coords) {
        console.log('Location fetched:', location.coords);
        const { latitude, longitude, accuracy, altitude } = location.coords;
        const timestamp = new Date(location.timestamp).toISOString();

        if (supabase) {
          const { error: dbError } = await supabase
            .from('user_locations')
            .insert({
              user_id: user.id,
              latitude,
              longitude,
              accuracy,
              altitude,
              timestamp,
            });

          if (dbError) {
            console.error('Error saving location to database:', dbError);
          } else {
            console.log('Location saved successfully to database.');
          }
        }
      } else {
        console.warn('Could not fetch location coordinates.');
      }
    } catch (error) {
      console.error('Error fetching or saving location:', error);
      // Alert.alert('Location Error', 'Could not get your current location.');
    }
  }, [user]); // Add user as dependency

  useEffect(() => {
    // Request and save location when the component mounts (after login)
    requestAndSaveLocation();
  }, [requestAndSaveLocation]); // requestAndSaveLocation is memoized with useCallback

  useEffect(() => {
    if (moodModalVisible) {
      loadMoodHistory();
    }
  }, [moodModalVisible]);

  const loadMoodHistory = async () => {
    setIsLoading(true);
    try {
      const storedHistory = await secureStore.getItem(MOOD_STORAGE_KEY);
      if (storedHistory) {
        setMoodHistory(JSON.parse(storedHistory));
      } else {
        setMoodHistory([]);
      }
    } catch (error) {
      console.error('Failed to load mood history:', error);
      setMoodHistory([]); // Set empty on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood');
      return;
    }

    const newEntry: MoodEntry = {
      id: Date.now().toString(), // Simple unique ID
      timestamp: Date.now(),
      mood: selectedMood,
      note: note.trim() || undefined,
    };

    try {
      const updatedHistory = [newEntry, ...moodHistory];
      await secureStore.saveItem(MOOD_STORAGE_KEY, JSON.stringify(updatedHistory));
      setMoodHistory(updatedHistory);
      setSelectedMood(null); // Reset selection
      setNote(''); // Reset note
      Alert.alert('Mood logged successfully!');
    } catch (error) {
      console.error('Failed to save mood entry:', error);
      Alert.alert('Error', 'Could not save mood entry. Please try again.');
    }
  };

  const closeMoodModal = () => {
    setMoodModalVisible(false);
    setSelectedMood(null);
    setNote('');
  };

  // Helper to get icon and color based on mood for rendering items
  const getMoodDetails = (mood: MoodOption) => {
    switch (mood) {
      case 'Happy': return { icon: <SafePhosphorIcon iconType="Smiley" size={20} weight="light" />, color: 'text-green-500' };
      case 'Okay': return { icon: <SafePhosphorIcon iconType="SmileyMeh" size={20} weight="light" />, color: 'text-yellow-500' };
      case 'Sad': return { icon: <SafePhosphorIcon iconType="SmileySad" size={20} weight="light" />, color: 'text-blue-500' };
      case 'Anxious': return { icon: <SafePhosphorIcon iconType="CloudLightning" size={20} weight="light" />, color: 'text-purple-500' };
      case 'Angry': return { icon: <SafePhosphorIcon iconType="SmileyXEyes" size={20} weight="light" />, color: 'text-red-500' };
      case 'Calm': return { icon: <SafePhosphorIcon iconType="Wind" size={20} weight="light" />, color: 'text-cyan-500' };
      case 'Excited': return { icon: <SafePhosphorIcon iconType="Sparkle" size={20} weight="light" />, color: 'text-orange-500' };
      case 'Tired': return { icon: <SafePhosphorIcon iconType="Bed" size={20} weight="light" />, color: 'text-slate-500' };
      case 'Stressed': return { icon: <SafePhosphorIcon iconType="FireSimple" size={20} weight="light" />, color: 'text-pink-500' };
      default: return { icon: null, color: 'text-gray-500' };
    }
  };

  // Render item for the FlatList
  const renderMoodEntry = ({ item }: { item: MoodEntry }) => {
    const { icon, color } = getMoodDetails(item.mood);
    const date = new Date(item.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <View style={tw`bg-white/70 border border-gray-200/50 rounded-lg p-3 mb-3 shadow-sm mx-4`}> {/* Added mx-4 */}
        <View style={tw`flex-row items-center mb-1`}>
          <View style={tw`mr-2 ${color}`}>
            {icon}
          </View>
          <Text style={tw`font-semibold ${color}`}>{item.mood}</Text>
          <Text style={tw`text-xs text-gray-500 ml-auto`}>{formattedDate}</Text>
        </View>
        {item.note ? (
          <Text style={tw`text-sm text-gray-700 mt-1`}>{item.note}</Text>
        ) : null}
      </View>
    );
  };

  // Header component for the FlatList containing the input UI
  const renderListHeader = () => (
    <View style={tw`px-4 pt-4`}> {/* Added padding */}
      <Text style={tw`text-lg text-gray-700 mb-4 text-center`}>
        Select your current mood:
      </Text>

      {/* Mood Selection */}
      {/* Wrap mood options if they exceed screen width */}
      <View style={tw`flex-row flex-wrap justify-center mb-6`}> 
        {moodOptions.map((option) => (
          <TouchableOpacity
            key={option.name}
            // Adjust styling for wrapping: add margin
            style={tw`items-center p-2 rounded-lg w-1/5 mx-1 mb-2 ${selectedMood === option.name ? 'bg-jung-purple/20' : ''}`} 
            onPress={() => setSelectedMood(option.name)}
          >
            <View style={tw`${option.color}`}>
              {option.icon}
            </View>
            <Text style={tw`text-xs mt-1 ${option.color} ${selectedMood === option.name ? 'font-bold' : ''}`}>
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional Note */}
      <Text style={tw`text-base text-gray-600 mb-2`}>Add a note (optional):</Text>
      <TextInput
        style={tw`bg-white/80 border border-gray-300 rounded-lg p-3 h-24 text-base text-gray-800 mb-6`}
        placeholder="What's on your mind?"
        value={note}
        onChangeText={setNote}
        multiline
        textAlignVertical="top"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={tw`bg-jung-purple flex-row items-center justify-center py-3 px-6 rounded-full shadow-md mb-8 ${!selectedMood ? 'opacity-50' : ''}`}
        onPress={handleSaveMood}
        disabled={!selectedMood}
      >
        <SafePhosphorIcon iconType="FloppyDisk" size={20} color="white" weight="bold" style={tw`mr-2`} />
        <Text style={tw`text-white text-lg font-bold`}>Log Mood</Text>
      </TouchableOpacity>

      {/* Mood History Title */}
      <Text style={tw`text-xl font-semibold text-jung-deep mb-4 border-t border-gray-200/50 pt-4`}>
        Mood History
      </Text>
      {isLoading && (
         <Text style={tw`text-center text-gray-500 mb-4`}>Loading history...</Text>
      )}
       {!isLoading && moodHistory.length === 0 && (
         <Text style={tw`text-center text-gray-500 italic mb-4`}>No mood history yet.</Text>
      )}
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Header space - removed hamburger menu as it's now in the navigation header */}
        <View style={tw`h-2`}></View>
        
        <ScrollView style={tw`flex-1 px-4`}>
          <View style={tw`mt-4 mb-6`}>
            <Text style={tw`text-2xl font-bold text-jung-deep mb-1`}>Welcome</Text>
            <Text style={tw`text-base text-gray-600`}>
              Explore yourself with Jung
            </Text>
          </View>

          {/* Subscription Status Banner */}
          <SubscriptionBanner />

          {/* Premium Upgrade CTA - Show after 3 conversations for free users */}
          {!isPremiumUser && conversationCount >= 3 && (
            <ConversationLimitPrompt style={tw`mb-4`} />
          )}

          {/* Conversations Button */}
          <SafeTouchableOpacity
            style={tw`bg-conversation rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-4`}>
                <SafePhosphorIcon iconType="ChatCircleDots" size={40} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-4 right-8`}>
                <SafePhosphorIcon iconType="Heart" size={24} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="ChatCircleDots" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  AI Conversations
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Get personalized mental health support
                </Text>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-2`} />
                  <Text style={tw`text-xs text-jung-deep/60`}>Available 24/7</Text>
                </View>
              </View>
            </View>
          </SafeTouchableOpacity>
          
          {/* Journaling Button */}
          <SafeTouchableOpacity
            style={tw`bg-journaling rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('JournalingScreen')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-3 right-6`}>
                <SafePhosphorIcon iconType="BookOpen" size={36} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-2 left-12 rotate-12`}>
                <SafePhosphorIcon iconType="PencilSimple" size={20} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="BookOpen" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Personal Journal
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Reflect on your thoughts and emotions
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>✍️ Private & secure writing space</Text>
              </View>
            </View>
          </SafeTouchableOpacity>
          
          {/* Daily Motivation Button */}
          <SafeTouchableOpacity
            style={tw`bg-motivation rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-5`}>
                <SafePhosphorIcon iconType="Bolt" size={32} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-3 left-8 -rotate-12`}>
                <SafePhosphorIcon iconType="Star" size={18} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-14 h-14 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full items-center justify-center mr-4 relative border-2 border-white/40 shadow-lg`}>
                <View style={tw`w-10 h-10 bg-orange-500/90 rounded-full items-center justify-center relative`}>
                  <SafePhosphorIcon iconType="Sunrise" size={20} color="#FFFFFF" weight="fill" />
                  <View style={tw`absolute -top-1 -right-1`}>
                    <SafePhosphorIcon iconType="Sparkle" size={12} color="#FEF08A" weight="fill" />
                  </View>
                </View>
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Daily Motivation
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Start your day with inspiring insights
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>⚡ Fresh content updated daily</Text>
              </View>
            </View>
          </SafeTouchableOpacity>
          
          {/* Emotional Assessment Button */}
          <SafeTouchableOpacity
            style={tw`bg-emotional rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-4`}>
                <SafePhosphorIcon iconType="Heart" size={38} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-2 left-10 rotate-45`}>
                <SafePhosphorIcon iconType="Pulse" size={22} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="Heart" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Emotional Check-In
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Understand your emotional well-being
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>💝 Quick & insightful assessment</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Mood Tracker Button */}
          <SafeTouchableOpacity
            style={tw`bg-mood rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('MoodTrackerScreen')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-1 right-3`}>
                <SafePhosphorIcon iconType="Smiley" size={34} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-1 left-6`}>
                <SafePhosphorIcon iconType="TrendUp" size={20} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="Smiley" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Mood Tracker
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Monitor your emotional patterns daily
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>📊 Track trends over time</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Support Center Button (Crisis + Self-Help) */}
          <SafeTouchableOpacity
            style={tw`bg-resources rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('SupportCenter')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-4`}>
                <SafePhosphorIcon iconType="FirstAid" size={36} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-3 left-8`}>
                <SafePhosphorIcon iconType="HandHeart" size={18} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="FirstAid" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Support Center
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Crisis resources & helpful tools
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>🆘 Always here when you need help</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Growth Dashboard Button */}
          <SafeTouchableOpacity
            style={tw`bg-dashboard rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('PersonalGrowthDashboard')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-4`}>
                <SafePhosphorIcon iconType="TrendUp" size={36} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-2 left-10 rotate-12`}>
                <SafePhosphorIcon iconType="Target" size={20} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="TrendUp" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Growth Dashboard
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Visualize your personal development
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>📈 Track your progress journey</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Conversation Analytics Button */}
          <SafeTouchableOpacity
            style={tw`bg-analytics rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('ConversationAnalytics')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-3`}>
                <SafePhosphorIcon iconType="ChartLine" size={38} color="#2D2B55" weight="thin" />
              </View>
              <View style={tw`absolute bottom-3 left-8 -rotate-12`}>
                <SafePhosphorIcon iconType="ChatCircle" size={18} color="#2D2B55" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="ChartLine" size={24} color="#2D2B55" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-jung-deep text-lg font-bold mb-1`}>
                  Chat Analytics
                </Text>
                <Text style={tw`text-jung-deep/70 text-sm mb-2`}>
                  Insights from your conversations
                </Text>
                <Text style={tw`text-xs text-jung-deep/60`}>💬 Discover patterns & themes</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Thought Helper Button */}
          <SafeTouchableOpacity
            style={tw`bg-purple-100 rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('CognitiveDistortionChecker')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-1 right-2 rotate-12`}>
                <SafePhosphorIcon iconType="Lightbulb" size={32} color="#7C3AED" weight="thin" />
              </View>
              <View style={tw`absolute bottom-2 left-8 -rotate-12`}>
                <SafePhosphorIcon iconType="Brain" size={20} color="#7C3AED" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-purple-200 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="Lightbulb" size={24} color="#7C3AED" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-purple-800 text-lg font-bold mb-1`}>
                  Thought Helper
                </Text>
                <Text style={tw`text-purple-700 text-sm mb-2`}>
                  Challenge unhelpful thinking patterns
                </Text>
                <Text style={tw`text-xs text-purple-600`}>✨ Science-based CBT techniques</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Thought Insights Button */}
          <SafeTouchableOpacity
            style={tw`bg-purple-50 rounded-xl p-6 w-full mb-4 shadow-sm relative overflow-hidden`}
            onPress={() => navigation.navigate('ThoughtInsights')}
          >
            {/* Background Pattern */}
            <View style={tw`absolute inset-0 opacity-10`}>
              <View style={tw`absolute top-2 right-4`}>
                <SafePhosphorIcon iconType="TrendUp" size={34} color="#7C3AED" weight="thin" />
              </View>
              <View style={tw`absolute bottom-2 left-6 rotate-45`}>
                <SafePhosphorIcon iconType="Sparkle" size={18} color="#7C3AED" weight="thin" />
              </View>
            </View>

            {/* Main Content */}
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4`}>
                <SafePhosphorIcon iconType="TrendUp" size={24} color="#7C3AED" weight="fill" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-purple-800 text-lg font-bold mb-1`}>
                  Your Insights
                </Text>
                <Text style={tw`text-purple-700 text-sm mb-2`}>
                  Track your wellness journey
                </Text>
                <Text style={tw`text-xs text-purple-600`}>📊 Progress & achievements</Text>
              </View>
            </View>
          </SafeTouchableOpacity>

          {/* Bottom CTA for non-premium users */}
          {!isPremiumUser && (
            <SubscriptionCTA style={tw`mt-2`} />
          )}

        </ScrollView>

        {/* Mood Tracker Modal */}
        <Modal
          visible={moodModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={closeMoodModal}
        >
          <GradientBackground>
            <SafeAreaView style={tw`flex-1`}>
              <SymbolicBackground opacity={0.05} />

              {/* Use FlatList as the main container */}
              <FlatList
                data={moodHistory}
                renderItem={renderMoodEntry}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderListHeader}
                ListFooterComponent={<View style={tw`h-20`} />} // Add spacer at the bottom
                keyboardShouldPersistTaps="handled"
                style={tw`flex-1`} // Ensure FlatList takes up space
              />
            </SafeAreaView>
          </GradientBackground>
        </Modal>

        {/* Onboarding Tutorial */}
        <OnboardingTutorial
          visible={shouldShowOnboarding()}
          onComplete={markOnboardingComplete}
          onSkip={canSkip ? incrementSkipCount : markOnboardingComplete}
        />

        {/* Feature Tour for Updates */}
        <FeatureTour
          visible={shouldShowFeatureTour()}
          onComplete={markFeatureTourSeen}
          featureType="general"
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

export default PostLoginScreen;
