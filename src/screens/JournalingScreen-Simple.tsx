import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { journalService } from '../lib/journalService';
import { JournalEntry, JournalTemplate, MoodType, JournalSearchFilters } from '../types/journal';
import { JournalSearchModal } from '../components/JournalSearchModal';

const JournalingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [searchFilters, setSearchFilters] = useState<JournalSearchFilters>({});
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: undefined as MoodType | undefined,
    tags: [] as string[],
    isPrivate: false,
    isFavorite: false,
  });

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchFilters]);

  const applyFilters = async () => {
    if (Object.keys(searchFilters).length === 0 ||
        (searchFilters.query === '' && !searchFilters.mood && !searchFilters.tags?.length &&
         !searchFilters.dateRange && !searchFilters.minWordCount && !searchFilters.maxWordCount &&
         searchFilters.isFavorite === undefined)) {
      setFilteredEntries(entries);
      setHasActiveFilters(false);
    } else {
      const filtered = await journalService.searchEntries(searchFilters);
      setFilteredEntries(filtered);
      setHasActiveFilters(true);
    }
  };

  const handleSearch = (filters: JournalSearchFilters) => {
    setSearchFilters(filters);
  };

  const clearFilters = () => {
    setSearchFilters({});
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const fetchedEntries = await journalService.getAllEntries();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const refreshEntries = async () => {
    try {
      setRefreshing(true);
      await loadEntries();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      Alert.alert('Error', 'Please enter both a title and content for your journal entry');
      return;
    }

    try {
      const createdEntry = await journalService.createEntry(newEntry);
      setEntries([createdEntry, ...entries]);
      setShowNewEntryModal(false);
      resetNewEntryForm();
      Alert.alert('Success', 'Journal entry created successfully!');
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Error', 'Failed to create journal entry');
    }
  };

  const resetNewEntryForm = () => {
    setNewEntry({
      title: '',
      content: '',
      mood: undefined,
      tags: [],
      isPrivate: false,
      isFavorite: false,
    });
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: JournalTemplate) => {
    console.log('Template selected:', template.name);
    setSelectedTemplate(template);

    // Create formatted content with prompts
    const formattedContent = template.prompts.map((prompt, index) =>
      `${index + 1}. ${prompt}\n\n`
    ).join('');

    setNewEntry({
      ...newEntry,
      title: template.name,
      content: formattedContent,
    });

    setShowTemplatesModal(false);
    console.log('Template applied successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (mood?: MoodType) => {
    const moodEmojis = {
      excited: '🤩',
      happy: '😊',
      content: '😌',
      calm: '😇',
      neutral: '😐',
      anxious: '😰',
      sad: '😢',
      frustrated: '😤',
      angry: '😡',
      tired: '😴',
      energetic: '⚡',
      grateful: '🙏',
      hopeful: '🌟',
      lonely: '😔',
      stressed: '😵',
    };
    return mood ? moodEmojis[mood] || '😐' : '😐';
  };

  const renderJournalEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100`}
      onPress={() => {/* TODO: Navigate to entry detail */}}
    >
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <Text style={tw`text-lg font-bold text-gray-800 flex-1 mr-2`} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={tw`flex-row items-center`}>
          {item.isFavorite && (
            <SafePhosphorIcon iconType="Heart" size={16} color="#EF4444" weight="fill" />
          )}
          <Text style={tw`text-2xl ml-1`}>{getMoodEmoji(item.mood)}</Text>
        </View>
      </View>

      <Text style={tw`text-gray-600 text-sm mb-3`} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={tw`flex-row justify-between items-center`}>
        <Text style={tw`text-gray-400 text-xs`}>
          {formatDate(item.date)}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-gray-400 text-xs mr-2`}>
            {item.wordCount} words • {item.readingTime} min read
          </Text>
          {item.isPrivate && (
            <SafePhosphorIcon iconType="Lock" size={12} color="#9CA3AF" weight="bold" />
          )}
        </View>
      </View>

      {item.tags.length > 0 && (
        <View style={tw`flex-row flex-wrap mt-2`}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={tw`bg-jung-purple/10 rounded-full px-2 py-1 mr-2 mt-1`}>
              <Text style={tw`text-jung-purple text-xs font-medium`}>#{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={tw`text-gray-400 text-xs mt-2`}>+{item.tags.length - 3} more</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`text-jung-deep mt-4`}>Loading your journal...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-5 border-b border-white/20 bg-gradient-to-r from-transparent to-white/10`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-2xl font-bold text-jung-deep`}>My Journal</Text>
              <Text style={tw`text-jung-deep/70 text-sm mt-0.5`}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                {hasActiveFilters && (
                  <Text style={tw`text-jung-purple font-medium`}> • filtered</Text>
                )}
              </Text>
            </View>
            <View style={tw`flex-row items-center space-x-2`}>
              {/* Insights Button */}
              <TouchableOpacity
                style={tw`bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex-row items-center`}
                onPress={() => navigation.navigate('JournalInsightsScreen')}
                activeOpacity={0.7}
              >
                <SafePhosphorIcon iconType="ChartLine" size={18} color="#4A3B78" weight="bold" />
                <Text style={tw`text-jung-purple text-xs font-semibold ml-1`}>Stats</Text>
              </TouchableOpacity>

              {/* Search Button */}
              <TouchableOpacity
                style={tw`${
                  hasActiveFilters
                    ? 'bg-jung-purple border-jung-purple'
                    : 'bg-white border-gray-200'
                } rounded-xl p-3 shadow-sm border flex-row items-center`}
                onPress={() => setShowSearchModal(true)}
                activeOpacity={0.7}
              >
                <SafePhosphorIcon
                  iconType="MagnifyingGlass"
                  size={18}
                  color={hasActiveFilters ? "white" : "#4A3B78"}
                  weight="bold"
                />
                <Text style={tw`${
                  hasActiveFilters ? 'text-white' : 'text-jung-purple'
                } text-xs font-semibold ml-1`}>
                  {hasActiveFilters ? 'Filter' : 'Search'}
                </Text>
              </TouchableOpacity>

              {/* New Entry Button */}
              <TouchableOpacity
                style={tw`bg-jung-purple rounded-xl p-3 shadow-lg border border-jung-purple flex-row items-center`}
                onPress={() => setShowNewEntryModal(true)}
                activeOpacity={0.8}
              >
                <SafePhosphorIcon iconType="PenNib" size={18} color="white" weight="bold" />
                <Text style={tw`text-white text-xs font-semibold ml-1`}>Write</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <View style={tw`px-6 py-3 bg-jung-purple/10 border-b border-jung-purple/20`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-jung-purple font-medium`}>
                {filteredEntries.length} of {entries.length} entries
              </Text>
              <TouchableOpacity
                onPress={clearFilters}
                style={tw`flex-row items-center`}
              >
                <Text style={tw`text-jung-purple text-sm mr-1`}>Clear filters</Text>
                <SafePhosphorIcon iconType="X" size={16} color="#4A3B78" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Journal Entries List */}
        {(hasActiveFilters ? filteredEntries : entries).length === 0 && !hasActiveFilters ? (
          <View style={tw`flex-1 justify-center items-center p-6`}>
            <View style={tw`bg-white/80 rounded-3xl p-8 items-center shadow-lg border border-white/50`}>
              <SafePhosphorIcon iconType="BookOpen" size={72} color="#4A3B78" weight="duotone" />
              <Text style={tw`text-xl font-bold text-jung-deep mt-4 text-center`}>
                Start Your Journey
              </Text>
              <Text style={tw`text-jung-deep/70 text-center mt-2 mb-6 leading-5`}>
                Begin documenting your thoughts, feelings, and experiences.
                Your personal space for reflection and growth.
              </Text>
              <TouchableOpacity
                style={tw`bg-jung-purple rounded-xl py-4 px-8 shadow-lg flex-row items-center`}
                onPress={() => setShowNewEntryModal(true)}
                activeOpacity={0.8}
              >
                <SafePhosphorIcon iconType="PenNib" size={18} color="white" weight="bold" />
                <Text style={tw`text-white font-bold text-center ml-2`}>Write Your First Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (hasActiveFilters ? filteredEntries : entries).length === 0 && hasActiveFilters ? (
          <View style={tw`flex-1 justify-center items-center p-6`}>
            <View style={tw`bg-white/80 rounded-3xl p-8 items-center shadow-lg border border-white/50`}>
              <SafePhosphorIcon iconType="MagnifyingGlass" size={72} color="#9CA3AF" weight="duotone" />
              <Text style={tw`text-xl font-bold text-gray-600 mt-4 text-center`}>
                No Matching Entries
              </Text>
              <Text style={tw`text-gray-500 text-center mt-2 mb-6 leading-5`}>
                No entries match your current search criteria.
                Try adjusting your filters or search terms.
              </Text>
              <View style={tw`flex-row space-x-3`}>
                <TouchableOpacity
                  style={tw`bg-jung-purple rounded-xl py-3 px-6 flex-row items-center`}
                  onPress={clearFilters}
                  activeOpacity={0.8}
                >
                  <SafePhosphorIcon iconType="X" size={16} color="white" weight="bold" />
                  <Text style={tw`text-white font-bold ml-1`}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-white border border-jung-purple rounded-xl py-3 px-6 flex-row items-center`}
                  onPress={() => setShowSearchModal(true)}
                  activeOpacity={0.8}
                >
                  <SafePhosphorIcon iconType="FunnelSimple" size={16} color="#4A3B78" weight="bold" />
                  <Text style={tw`text-jung-purple font-bold ml-1`}>Edit Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={hasActiveFilters ? filteredEntries : entries}
            renderItem={renderJournalEntry}
            keyExtractor={(item) => item.id}
            contentContainerStyle={tw`p-6`}
            refreshing={refreshing}
            onRefresh={refreshEntries}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* New Entry Modal */}
        <Modal
          visible={showNewEntryModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={tw`flex-1 bg-white`}>
            {/* Modal Header */}
            <View style={tw`px-6 py-4 border-b border-gray-200 flex-row justify-between items-center`}>
              <TouchableOpacity onPress={() => {
                setShowNewEntryModal(false);
                resetNewEntryForm();
              }}>
                <Text style={tw`text-jung-purple font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <Text style={tw`text-lg font-bold text-gray-800`}>New Entry</Text>
              <TouchableOpacity onPress={handleCreateEntry}>
                <Text style={tw`text-jung-purple font-semibold`}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-1 p-6`}>
              {/* Template Selection */}
              <TouchableOpacity
                style={tw`bg-jung-purple/10 border border-jung-purple/20 rounded-xl p-4 mb-6`}
                onPress={() => {
                  console.log('Opening templates modal');
                  setShowTemplatesModal(true);
                }}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <SafePhosphorIcon iconType="Sparkle" size={20} color="#4A3B78" weight="bold" />
                    <Text style={tw`text-jung-purple font-semibold ml-2`}>
                      {selectedTemplate ? selectedTemplate.name : 'Use a Template'}
                    </Text>
                  </View>
                  <SafePhosphorIcon iconType="CaretRight" size={16} color="#4A3B78" weight="bold" />
                </View>
                <Text style={tw`text-jung-purple/70 text-sm mt-1`}>
                  Get started with guided prompts
                </Text>
              </TouchableOpacity>

              {/* Title Input */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-semibold mb-2`}>Title</Text>
                <TextInput
                  style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200`}
                  placeholder="Give your entry a title..."
                  value={newEntry.title}
                  onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                  maxLength={100}
                />
              </View>

              {/* Content Input */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-700 font-semibold mb-2`}>Content</Text>
                <TextInput
                  style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200 min-h-32`}
                  placeholder="What's on your mind? Share your thoughts, feelings, or experiences..."
                  value={newEntry.content}
                  onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Mood Selection */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-700 font-semibold mb-3`}>How are you feeling?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={tw`flex-row space-x-3`}>
                    {(['happy', 'excited', 'content', 'calm', 'neutral', 'anxious', 'sad', 'frustrated'] as MoodType[]).map((mood) => (
                      <TouchableOpacity
                        key={mood}
                        style={tw`${newEntry.mood === mood ? 'bg-jung-purple' : 'bg-gray-100'} rounded-xl p-3 items-center min-w-16`}
                        onPress={() => setNewEntry({ ...newEntry, mood: newEntry.mood === mood ? undefined : mood })}
                      >
                        <Text style={tw`text-2xl mb-1`}>{getMoodEmoji(mood)}</Text>
                        <Text style={tw`${newEntry.mood === mood ? 'text-white' : 'text-gray-600'} text-xs font-medium capitalize`}>
                          {mood}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Options */}
              <View style={tw`space-y-4`}>
                <TouchableOpacity
                  style={tw`flex-row items-center justify-between`}
                  onPress={() => setNewEntry({ ...newEntry, isPrivate: !newEntry.isPrivate })}
                >
                  <View style={tw`flex-row items-center`}>
                    <SafePhosphorIcon
                      iconType={newEntry.isPrivate ? "Lock" : "LockOpen"}
                      size={20}
                      color="#6B7280"
                      weight="bold"
                    />
                    <Text style={tw`text-gray-700 ml-3`}>Private Entry</Text>
                  </View>
                  <View style={tw`${newEntry.isPrivate ? 'bg-jung-purple' : 'bg-gray-200'} w-12 h-6 rounded-full p-1`}>
                    <View style={tw`${newEntry.isPrivate ? 'translate-x-6' : 'translate-x-0'} w-4 h-4 bg-white rounded-full`} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-row items-center justify-between`}
                  onPress={() => setNewEntry({ ...newEntry, isFavorite: !newEntry.isFavorite })}
                >
                  <View style={tw`flex-row items-center`}>
                    <SafePhosphorIcon
                      iconType="Heart"
                      size={20}
                      color={newEntry.isFavorite ? "#EF4444" : "#6B7280"}
                      weight={newEntry.isFavorite ? "fill" : "bold"}
                    />
                    <Text style={tw`text-gray-700 ml-3`}>Mark as Favorite</Text>
                  </View>
                  <View style={tw`${newEntry.isFavorite ? 'bg-red-500' : 'bg-gray-200'} w-12 h-6 rounded-full p-1`}>
                    <View style={tw`${newEntry.isFavorite ? 'translate-x-6' : 'translate-x-0'} w-4 h-4 bg-white rounded-full`} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Templates Modal */}
        <Modal
          visible={showTemplatesModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={tw`flex-1 bg-white`}>
            <View style={tw`px-6 py-4 border-b border-gray-200 flex-row justify-between items-center`}>
              <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
                <Text style={tw`text-jung-purple font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <Text style={tw`text-lg font-bold text-gray-800`}>Journal Templates</Text>
              <View style={tw`w-16`} />
            </View>

            <ScrollView style={tw`flex-1 p-6`}>
              {journalService.getTemplates().map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-4`}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <SafePhosphorIcon iconType={template.icon as any} size={24} color="#4A3B78" weight="bold" />
                    <Text style={tw`text-lg font-bold text-gray-800 ml-3`}>{template.name}</Text>
                  </View>
                  <Text style={tw`text-gray-600 mb-3`}>{template.description}</Text>
                  <Text style={tw`text-jung-purple text-sm font-medium`}>
                    {template.prompts.length} prompts • {template.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Search Modal */}
        <JournalSearchModal
          visible={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSearch={handleSearch}
          initialFilters={searchFilters}
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

export default JournalingScreen;
