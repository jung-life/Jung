import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, Alert, FlatList } from 'react-native'; // Added FlatList
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { ChatCircleDots, Brain, BookOpen, Heart, User, Smiley, SmileyMeh, SmileySad, SmileyXEyes, CloudLightning, FloppyDisk, ArrowLeft, Wind, Sparkle, Bed, FireSimple } from 'phosphor-react-native'; // Added new icons
import { HamburgerMenu } from '../components/HamburgerMenu';
import * as secureStore from '../lib/secureStorage';
// import MoodHistoryDisplay from '../components/MoodHistoryDisplay'; // No longer needed here

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
  { name: 'Happy', icon: <Smiley size={32} weight="light" />, color: 'text-green-500' },
  { name: 'Excited', icon: <Sparkle size={32} weight="light" />, color: 'text-orange-500' },
  { name: 'Calm', icon: <Wind size={32} weight="light" />, color: 'text-cyan-500' },
  { name: 'Okay', icon: <SmileyMeh size={32} weight="light" />, color: 'text-yellow-500' },
  { name: 'Sad', icon: <SmileySad size={32} weight="light" />, color: 'text-blue-500' },
  { name: 'Anxious', icon: <CloudLightning size={32} weight="light" />, color: 'text-purple-500' },
  { name: 'Stressed', icon: <FireSimple size={32} weight="light" />, color: 'text-pink-500' },
  { name: 'Angry', icon: <SmileyXEyes size={32} weight="light" />, color: 'text-red-500' },
  { name: 'Tired', icon: <Bed size={32} weight="light" />, color: 'text-slate-500' },
];

const PostLoginScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  
  // Mood tracker state
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      case 'Happy': return { icon: <Smiley size={20} weight="light" />, color: 'text-green-500' };
      case 'Okay': return { icon: <SmileyMeh size={20} weight="light" />, color: 'text-yellow-500' };
      case 'Sad': return { icon: <SmileySad size={20} weight="light" />, color: 'text-blue-500' };
      case 'Anxious': return { icon: <CloudLightning size={20} weight="light" />, color: 'text-purple-500' };
      case 'Angry': return { icon: <SmileyXEyes size={20} weight="light" />, color: 'text-red-500' };
      case 'Calm': return { icon: <Wind size={20} weight="light" />, color: 'text-cyan-500' };
      case 'Excited': return { icon: <Sparkle size={20} weight="light" />, color: 'text-orange-500' };
      case 'Tired': return { icon: <Bed size={20} weight="light" />, color: 'text-slate-500' };
      case 'Stressed': return { icon: <FireSimple size={20} weight="light" />, color: 'text-pink-500' };
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
          <View style={tw`mr-2 ${color}`}>{icon}</View>
          <Text style={tw`font-semibold ${color}`}>{item.mood}</Text>
          <Text style={tw`text-xs text-gray-500 ml-auto`}>{formattedDate}</Text>
        </View>
        {item.note && (
          <Text style={tw`text-sm text-gray-700 mt-1`}>{item.note}</Text>
        )}
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
            <View style={tw`${option.color}`}>{option.icon}</View>
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
        <FloppyDisk size={20} color="white" weight="bold" style={tw`mr-2`} />
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
        
        {/* Header with hamburger menu */}
        <View style={tw`flex-row justify-between items-center p-4`}>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Jung</Text>
          <HamburgerMenu />
        </View>
        
        <ScrollView style={tw`flex-1 px-4`}>
          <View style={tw`mt-4 mb-8`}>
            <Text style={tw`text-2xl font-bold text-jung-deep mb-1`}>Welcome</Text>
            <Text style={tw`text-base text-gray-600`}>
              Explore yourself with Jung
            </Text>
          </View>
          
          {/* Conversations Button */}
          <TouchableOpacity
            style={tw`bg-conversation rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use conversation color
            onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
          >
            {/* Wrap icon in a View */}
            <View>
              <ChatCircleDots size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Conversations</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>
          
          {/* Daily Motivation Button */}
          <TouchableOpacity 
            style={tw`bg-motivation rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use motivation color
            onPress={() => navigation.navigate('DailyMotivationScreen')}
          >
            {/* Wrap icon in a View */}
            <View>
              <Brain size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Daily Motivation</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>
          
          {/* Emotional Assessment Button */}
          <TouchableOpacity 
            style={tw`bg-emotional rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use emotional color
            onPress={() => navigation.navigate('EmotionalAssessmentScreen')}
          >
            {/* Wrap icon in a View */}
            <View> 
              <Heart size={28} color="#2D2B55" weight="fill" /> {/* Use jung-deep for icon */}
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Emotional Assessment</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>

          {/* Mood Tracker Button */}
          <TouchableOpacity 
            style={tw`bg-indigo-200 rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Example color
            onPress={() => setMoodModalVisible(true)}
            >
            {/* Wrap icon in a View */}
            <View>
              <Smiley size={28} color="#2D2B55" weight="fill" />
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Mood Tracker</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>

          {/* Self-Help Resources Button */}
          <TouchableOpacity 
            style={tw`bg-resources rounded-xl p-6 w-full mb-4 flex-row items-center shadow-sm`} // Use resources color
            onPress={() => navigation.navigate('SelfHelpResourcesScreen')}
            >
            {/* Wrap icon in a View */}
            <View>
              <BookOpen size={28} color="#2D2B55" weight="fill" />
            </View>
            <Text style={tw`ml-4 text-jung-deep text-lg font-semibold`}>Self-Help Resources</Text> {/* Use jung-deep for text */}
          </TouchableOpacity>

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

              {/* Header */}
              <View style={tw`p-4 border-b border-gray-200/30 flex-row items-center`}>
                <TouchableOpacity
                  style={tw`p-2 mr-2`}
                  onPress={closeMoodModal}
                >
                  <ArrowLeft size={20} color="#4A3B78" />
                </TouchableOpacity>
                <Text style={tw`text-xl font-bold text-center text-jung-deep flex-1`}>
                  How are you feeling?
                </Text>
                <View style={tw`w-10`} />{/* Spacer */}
              </View>

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
      </SafeAreaView>
    </GradientBackground>
  );
};

export default PostLoginScreen;
