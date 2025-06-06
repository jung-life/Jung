import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { FloppyDisk, ArrowLeft, BookOpen, Calendar } from 'phosphor-react-native';
import * as secureStore from '../lib/secureStorage';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';

// Define types for journal entries
type JournalEntry = {
  id: string;
  timestamp: number;
  content: string;
  title: string;
};

const JOURNAL_STORAGE_KEY = 'journalEntries';

const JournalingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async () => {
    setIsLoading(true);
    try {
      const storedEntries = await secureStore.getItem(JOURNAL_STORAGE_KEY);
      if (storedEntries) {
        setJournalEntries(JSON.parse(storedEntries));
      } else {
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      setJournalEntries([]); // Set empty on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) {
      Alert.alert('Please write something in your journal entry');
      return;
    }

    try {
      let updatedEntries;
      
      if (isEditing && currentEntryId) {
        // Update existing entry
        updatedEntries = journalEntries.map(entry => 
          entry.id === currentEntryId 
            ? { 
                ...entry, 
                content: currentEntry,
                title: entryTitle.trim() || 'Untitled Entry',
                timestamp: Date.now() // Update timestamp to show it was edited
              } 
            : entry
        );
      } else {
        // Create new entry
        const newEntry: JournalEntry = {
          id: Date.now().toString(), // Simple unique ID
          timestamp: Date.now(),
          content: currentEntry,
          title: entryTitle.trim() || 'Untitled Entry',
        };
        updatedEntries = [newEntry, ...journalEntries];
      }

      await secureStore.saveItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setJournalEntries(updatedEntries);
      setCurrentEntry(''); // Reset content
      setEntryTitle(''); // Reset title
      setIsEditing(false);
      setCurrentEntryId(null);
      Alert.alert('Journal entry saved successfully!');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Could not save journal entry. Please try again.');
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry.content);
    setEntryTitle(entry.title);
    setIsEditing(true);
    setCurrentEntryId(entry.id);
  };

  const handleNewEntry = () => {
    setCurrentEntry('');
    setEntryTitle('');
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Render item for the FlatList
  const renderJournalEntry = ({ item }: { item: JournalEntry }) => {
    return (
      <TouchableOpacity 
        style={tw`bg-white/70 border border-gray-200/50 rounded-lg p-4 mb-3 shadow-sm mx-4`}
        onPress={() => handleEditEntry(item)}
      >
        <View style={tw`flex-row items-center mb-2`}>
          <View style={tw`mr-2 text-jung-deep`}>
            <BookOpen size={20} color="#2D2B55" weight="light" />
          </View>
          <Text style={tw`font-semibold text-jung-deep text-lg flex-1`}>{item.title}</Text>
          <Text style={tw`text-xs text-gray-500`}>{formatDate(item.timestamp)}</Text>
        </View>
        <Text 
          style={tw`text-sm text-gray-700 mt-1`}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Header is now managed by AppNavigator.tsx options.
            The title is set there. The HamburgerMenu is on the right.
            The custom back button here is removed.
            If the "New Entry" button is still desired in the header, it should be moved to headerRight
            in AppNavigator's options for this screen, potentially replacing or alongside HamburgerMenu.
            For now, removing the entire custom header View from here.
        */}
        {/*
        <View style={tw`p-4 border-b border-gray-200/30 flex-row items-center`}>
          // Removed custom back button
          <Text style={tw`text-xl font-bold text-center text-jung-deep flex-1`}>
            {isEditing ? 'Edit Journal Entry' : 'Journal Your Thoughts'} 
          </Text>
          // This button might need to be moved to headerRight if still needed
          <TouchableOpacity
            style={tw`p-2`}
            onPress={handleNewEntry}
            disabled={!isEditing}
          >
            <View style={isEditing ? tw`opacity-100` : tw`opacity-0`}>
              <BookOpen size={20} color="#4A3B78" />
            </View>
          </TouchableOpacity>
        </View>
        */}
        
        <View style={tw`pt-4 pb-2 px-4 items-center`}> 
          <Text style={tw`text-2xl font-bold text-jung-deep`}>
            {isEditing ? 'Edit Journal Entry' : 'Journal Your Thoughts'}
          </Text>
        </View>

        <ScrollView style={tw`flex-1 px-4`}>
          {/* Title Input */}
          <Text style={tw`text-base text-gray-600 mb-2`}>Title:</Text>
          <TextInput
            style={tw`bg-white/80 border border-gray-300 rounded-lg p-3 text-base text-gray-800 mb-4`}
            placeholder="Give your entry a title"
            value={entryTitle}
            onChangeText={setEntryTitle}
          />
          
          {/* Journal Entry Input */}
          <Text style={tw`text-base text-gray-600 mb-2`}>Your thoughts:</Text>
          <TextInput
            style={tw`bg-white/80 border border-gray-300 rounded-lg p-3 h-40 text-base text-gray-800 mb-6`}
            placeholder="Write your thoughts here..."
            value={currentEntry}
            onChangeText={setCurrentEntry}
            multiline
            textAlignVertical="top"
          />

          {/* Save Button */}
          <TouchableOpacity
            style={tw`bg-jung-purple flex-row items-center justify-center py-3 px-6 rounded-full shadow-md mb-8 ${!currentEntry.trim() ? 'opacity-50' : ''}`}
            onPress={handleSaveEntry}
            disabled={!currentEntry.trim()}
          >
            <View>
              <FloppyDisk size={20} color="white" weight="bold" style={tw`mr-2`} />
            </View>
            <Text style={tw`text-white text-lg font-bold`}>
              {isEditing ? 'Update Entry' : 'Save Entry'}
            </Text>
          </TouchableOpacity>

          {/* Journal History Title */}
          <Text style={tw`text-xl font-semibold text-jung-deep mb-4 border-t border-gray-200/50 pt-4`}>
            Journal History
          </Text>
          
          {isLoading && (
            <Text style={tw`text-center text-gray-500 mb-4`}>Loading entries...</Text>
          )}
          
          {!isLoading && journalEntries.length === 0 && (
            <Text style={tw`text-center text-gray-500 italic mb-4`}>No journal entries yet.</Text>
          )}

          {/* Journal Entries List */}
          {!isLoading && journalEntries.map(entry => (
            <React.Fragment key={entry.id}>
              {renderJournalEntry({ item: entry })}
            </React.Fragment>
          ))}
        </ScrollView>
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
};

export default JournalingScreen;
