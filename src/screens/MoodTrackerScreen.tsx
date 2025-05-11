import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types'; // Assuming this type exists
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import tw from '../lib/tailwind';
import { Smiley, SmileyMeh, SmileySad, SmileyXEyes, CloudLightning, FloppyDisk } from 'phosphor-react-native'; // Removed ArrowLeft
import * as secureStore from '../lib/secureStorage'; // Assuming secureStorage exports save/get functions
import MoodHistoryDisplay from '../components/MoodHistoryDisplay'; // Reverted: Removed .tsx extension
// HomeButton and HamburgerMenu imports removed as header is handled by navigator

type MoodOption = 'Happy' | 'Okay' | 'Sad' | 'Anxious' | 'Angry';
type MoodEntry = {
  id: string;
  timestamp: number;
  mood: MoodOption;
  note?: string;
};

const moodOptions: { name: MoodOption; icon: React.ReactNode; color: string }[] = [
  { name: 'Happy', icon: <Smiley size={32} weight="light" />, color: 'text-green-500' },
  { name: 'Okay', icon: <SmileyMeh size={32} weight="light" />, color: 'text-yellow-500' },
  { name: 'Sad', icon: <SmileySad size={32} weight="light" />, color: 'text-blue-500' },
  { name: 'Anxious', icon: <CloudLightning size={32} weight="light" />, color: 'text-purple-500' },
  { name: 'Angry', icon: <SmileyXEyes size={32} weight="light" />, color: 'text-red-500' },
];

const MOOD_STORAGE_KEY = 'moodEntries';

const MoodTrackerScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMoodHistory();
  }, []);

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

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.05} />

        {/* Custom header removed, will rely on AppNavigator's header options */}
        {/*
        <View style={tw`p-4 border-b border-gray-200/30 flex-row items-center`}>
          <TouchableOpacity
            style={tw`p-2 mr-2`}
            onPress={() => navigation.goBack()} // This would need ArrowLeft if re-enabled
          >
            // <ArrowLeft size={20} color="#4A3B78" /> // ArrowLeft import would be needed
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-center text-jung-deep flex-1`}>
            How are you feeling?
          </Text>
          <View style={tw`w-10`} />
        </View>
        */}

        <ScrollView style={tw`flex-1 px-4 pt-4`} keyboardShouldPersistTaps="handled">
          <Text style={tw`text-lg text-gray-700 mb-4 text-center`}>
            Select your current mood:
          </Text>

          {/* Mood Selection */}
          <View style={tw`flex-row justify-around mb-6`}>
            {moodOptions.map((option) => (
              <TouchableOpacity
                key={option.name}
                style={tw`items-center p-2 rounded-lg ${selectedMood === option.name ? 'bg-jung-purple/20' : ''}`}
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

          {/* Mood History */}
          <Text style={tw`text-xl font-semibold text-jung-deep mb-4 border-t border-gray-200/50 pt-4`}>
            Mood History
          </Text>
          {isLoading ? (
            <Text style={tw`text-center text-gray-500`}>Loading history...</Text>
          ) : (
            <MoodHistoryDisplay history={moodHistory} />
          )}

          {/* Spacer */}
          <View style={tw`h-20`} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default MoodTrackerScreen;
