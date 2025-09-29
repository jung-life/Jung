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
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [searchFilters, setSearchFilters] = useState<JournalSearchFilters>({});
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: undefined as MoodType | undefined,
    tags: [] as string[],
    isFavorite: false,
  });

  // Edit entry form state
  const [editEntry, setEditEntry] = useState({
    title: '',
    content: '',
    mood: undefined as MoodType | undefined,
    tags: [] as string[],
    isFavorite: false,
  });

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchFilters]);

  // Sort entries with favorites first, then by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    // First sort by favorite status
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Then sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const sortedFilteredEntries = [...filteredEntries].sort((a, b) => {
    // First sort by favorite status
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Then sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
      isFavorite: false,
    });
    setSelectedTemplate(null);
    setNewTagInput('');
  };

  const addTagToNewEntry = () => {
    if (newTagInput.trim() && !newEntry.tags.includes(newTagInput.trim())) {
      setNewEntry({
        ...newEntry,
        tags: [...newEntry.tags, newTagInput.trim()],
      });
      setNewTagInput('');
    }
  };

  const removeTagFromNewEntry = (tagToRemove: string) => {
    setNewEntry({
      ...newEntry,
      tags: newEntry.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const addTagToEditEntry = () => {
    if (editTagInput.trim() && !editEntry.tags.includes(editTagInput.trim())) {
      setEditEntry({
        ...editEntry,
        tags: [...editEntry.tags, editTagInput.trim()],
      });
      setEditTagInput('');
    }
  };

  const removeTagFromEditEntry = (tagToRemove: string) => {
    setEditEntry({
      ...editEntry,
      tags: editEntry.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditEntry({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags,
      isFavorite: entry.isFavorite,
    });
    setShowEditEntryModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editEntry.title.trim() || !editEntry.content.trim()) {
      Alert.alert('Error', 'Please enter both a title and content for your journal entry');
      return;
    }

    try {
      const updatedEntry = await journalService.updateEntry(editingEntry.id, editEntry);
      const updatedEntries = entries.map(entry =>
        entry.id === editingEntry.id ? updatedEntry : entry
      );
      setEntries(updatedEntries);
      setShowEditEntryModal(false);
      setEditingEntry(null);
      Alert.alert('Success', 'Journal entry updated successfully!');
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Failed to update journal entry');
    }
  };

  const resetEditEntryForm = () => {
    setEditEntry({
      title: '',
      content: '',
      mood: undefined,
      tags: [],
      isFavorite: false,
    });
    setEditingEntry(null);
    setEditTagInput('');
  };

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await journalService.deleteEntry(entryId);
              const updatedEntries = entries.filter(entry => entry.id !== entryId);
              setEntries(updatedEntries);
              Alert.alert('Success', 'Journal entry deleted successfully');
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ],
    );
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
    <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100`}>
      {/* Header with title, favorite, mood, and delete button */}
      <View style={tw`flex-row justify-between items-start mb-2`}>
        <TouchableOpacity
          style={tw`flex-1 mr-2`}
          onPress={() => handleEditEntry(item)}
          activeOpacity={0.7}
        >
          <Text style={tw`text-lg font-bold text-gray-800`} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
        <View style={tw`flex-row items-center`}>
          {item.isFavorite && (
            <SafePhosphorIcon iconType="Heart" size={16} color="#EF4444" weight="fill" />
          )}
          <Text style={tw`text-2xl ml-1 mr-2`}>{getMoodEmoji(item.mood)}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteEntry(item.id)}
            style={tw`bg-red-50 rounded-full p-2 border border-red-200`}
            activeOpacity={0.7}
            accessibilityLabel="Delete journal entry"
            accessibilityHint="Tap to delete this journal entry permanently"
          >
            <SafePhosphorIcon iconType="X" size={14} color="#DC2626" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content preview */}
      <TouchableOpacity onPress={() => handleEditEntry(item)} activeOpacity={0.7}>
        <Text style={tw`text-gray-600 text-sm mb-3`} numberOfLines={3}>
          {item.content}
        </Text>
      </TouchableOpacity>

      {/* Date and metadata */}
      <View style={tw`flex-row justify-between items-center`}>
        <Text style={tw`text-gray-400 text-xs`}>
          {formatDate(item.date)}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-gray-400 text-xs mr-2`}>
            {item.wordCount} words • {item.readingTime} min read
          </Text>
        </View>
      </View>

      {/* Tags */}
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
    </View>
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
          <View style={tw`mb-4 items-center`}>
            <Text style={tw`text-2xl font-bold text-jung-deep text-center`}>My Journal</Text>
            <Text style={tw`text-jung-deep/70 text-sm mt-0.5 text-center`}>
              {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
              {hasActiveFilters && (
                <Text style={tw`text-jung-purple font-medium`}> • filtered</Text>
              )}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={tw`flex-row items-center justify-center gap-4`}>
            {/* Write Button */}
            <TouchableOpacity
              style={tw`bg-emerald-500 rounded-2xl px-6 py-4 shadow-xl border-2 border-emerald-400 flex-row items-center min-w-20`}
              onPress={() => setShowNewEntryModal(true)}
              activeOpacity={0.85}
              accessibilityLabel="Create new journal entry"
              accessibilityHint="Tap to start writing a new journal entry"
            >
              <SafePhosphorIcon iconType="PenNib" size={20} color="white" weight="bold" />
              <Text style={tw`text-white text-sm font-bold ml-2`}>Write</Text>
            </TouchableOpacity>

            {/* Search Button */}
            <TouchableOpacity
              style={tw`${
                hasActiveFilters
                  ? 'bg-amber-500 border-amber-400'
                  : 'bg-gray-200 border-gray-400'
              } rounded-2xl px-6 py-4 shadow-xl border-2 flex-row items-center min-w-20`}
              onPress={() => setShowSearchModal(true)}
              activeOpacity={0.85}
              accessibilityLabel={hasActiveFilters ? "Edit search filters" : "Search journal entries"}
              accessibilityHint={hasActiveFilters ? "Tap to modify current search filters" : "Tap to open search and filter options"}
            >
              <SafePhosphorIcon
                iconType={hasActiveFilters ? "FunnelSimple" : "MagnifyingGlass"}
                size={20}
                color={hasActiveFilters ? "white" : "#374151"}
                weight="bold"
              />
              <Text style={tw`${
                hasActiveFilters ? 'text-white' : 'text-gray-800'
              } text-sm font-bold ml-2`}>
                {hasActiveFilters ? 'Filter' : 'Search'}
              </Text>
            </TouchableOpacity>

            {/* Stats Button */}
            <TouchableOpacity
              style={tw`bg-indigo-500 rounded-2xl px-6 py-4 shadow-xl border-2 border-indigo-400 flex-row items-center min-w-20`}
              onPress={() => navigation.navigate('JournalInsightsScreen')}
              activeOpacity={0.85}
              accessibilityLabel="View journal statistics and insights"
              accessibilityHint="Navigate to insights screen to see your journaling patterns and statistics"
            >
              <SafePhosphorIcon iconType="TrendUp" size={20} color="white" weight="bold" />
              <Text style={tw`text-white text-sm font-bold ml-2`}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <View style={tw`px-6 py-3 bg-purple-100 border-b border-purple-200`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <SafePhosphorIcon iconType="FunnelSimple" size={16} color="#4A3B78" weight="bold" />
                <Text style={tw`text-jung-purple font-medium ml-2`}>
                  {sortedFilteredEntries.length} of {sortedEntries.length} entries
                </Text>
              </View>
              <TouchableOpacity
                onPress={clearFilters}
                style={tw`flex-row items-center bg-white rounded-lg px-3 py-1.5 shadow-sm border border-purple-300`}
                accessibilityLabel="Clear all search filters"
                accessibilityHint="Tap to remove all active filters and show all entries"
                activeOpacity={0.7}
              >
                <Text style={tw`text-jung-purple text-sm font-medium mr-1`}>Clear</Text>
                <SafePhosphorIcon iconType="X" size={14} color="#4A3B78" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Journal Entries List */}
        {(hasActiveFilters ? sortedFilteredEntries : sortedEntries).length === 0 && !hasActiveFilters ? (
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
        ) : (hasActiveFilters ? sortedFilteredEntries : sortedEntries).length === 0 && hasActiveFilters ? (
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
                  style={tw`bg-jung-purple rounded-xl py-3 px-6 flex-row items-center shadow-md`}
                  onPress={clearFilters}
                  activeOpacity={0.8}
                  accessibilityLabel="Clear all filters"
                  accessibilityHint="Remove all search filters to show all journal entries"
                >
                  <SafePhosphorIcon iconType="X" size={16} color="white" weight="bold" />
                  <Text style={tw`text-white font-bold ml-1`}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-white border border-jung-purple rounded-xl py-3 px-6 flex-row items-center shadow-md`}
                  onPress={() => setShowSearchModal(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="Edit search criteria"
                  accessibilityHint="Open search modal to modify your search filters"
                >
                  <SafePhosphorIcon iconType="FunnelSimple" size={16} color="#4A3B78" weight="bold" />
                  <Text style={tw`text-jung-purple font-bold ml-1`}>Edit Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={hasActiveFilters ? sortedFilteredEntries : sortedEntries}
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
                      {selectedTemplate ? selectedTemplate.name : 'Journaling Coach'}
                    </Text>
                  </View>
                  <SafePhosphorIcon iconType="CaretRight" size={16} color="#4A3B78" weight="bold" />
                </View>
                <Text style={tw`text-jung-purple/70 text-sm mt-1`}>
                  Get personalized writing guidance and prompts
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

              {/* Tags Section */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-700 font-semibold mb-3`}>Tags</Text>
                <View style={tw`flex-row items-center mb-3`}>
                  <TextInput
                    style={tw`flex-1 bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200 mr-2`}
                    placeholder="Add a tag..."
                    placeholderTextColor="#9CA3AF"
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={addTagToNewEntry}
                    maxLength={20}
                  />
                  <TouchableOpacity
                    style={tw`bg-jung-purple rounded-xl p-4 shadow-sm`}
                    onPress={addTagToNewEntry}
                    activeOpacity={0.8}
                  >
                    <SafePhosphorIcon iconType="Plus" size={16} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>

                {newEntry.tags.length > 0 && (
                  <View style={tw`flex-row flex-wrap`}>
                    {newEntry.tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={tw`bg-jung-purple/10 border border-jung-purple/20 rounded-full px-3 py-1.5 mr-2 mb-2 flex-row items-center`}
                        onPress={() => removeTagFromNewEntry(tag)}
                        activeOpacity={0.7}
                      >
                        <Text style={tw`text-jung-purple text-sm font-medium mr-1`}>#{tag}</Text>
                        <SafePhosphorIcon iconType="X" size={12} color="#4A3B78" weight="bold" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Options */}
              <View style={tw`space-y-6 mb-4`}>
                {/* Favorite Entry Option */}
                <View style={tw`${newEntry.isFavorite ? 'bg-red-50 border-red-200 shadow-md' : 'bg-gray-50 border-gray-200'} rounded-xl p-4 border-2`}>
                  <TouchableOpacity
                    style={tw`flex-row items-center justify-between`}
                    onPress={() => setNewEntry({ ...newEntry, isFavorite: !newEntry.isFavorite })}
                  >
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`${newEntry.isFavorite ? 'bg-red-100' : 'bg-gray-200'} p-2 rounded-full mr-3`}>
                        <SafePhosphorIcon
                          iconType="Heart"
                          size={18}
                          color={newEntry.isFavorite ? "#EF4444" : "#6B7280"}
                          weight={newEntry.isFavorite ? "fill" : "bold"}
                        />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`${newEntry.isFavorite ? 'text-red-600' : 'text-gray-800'} font-bold`}>
                          ❤️ Mark as Favorite
                        </Text>
                        <Text style={tw`${newEntry.isFavorite ? 'text-red-500' : 'text-gray-500'} text-sm mt-1`}>
                          Easy to find in your favorite entries collection
                        </Text>
                      </View>
                    </View>
                    <View style={tw`${newEntry.isFavorite ? 'bg-red-500' : 'bg-gray-300'} w-14 h-8 rounded-full p-1 ml-3`}>
                      <View style={tw`${newEntry.isFavorite ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'} w-6 h-6 rounded-full shadow-sm`} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Entry Modal */}
        <Modal
          visible={showEditEntryModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={tw`flex-1 bg-white`}>
            {/* Modal Header */}
            <View style={tw`px-6 py-4 border-b border-gray-200 flex-row justify-between items-center`}>
              <TouchableOpacity onPress={() => {
                setShowEditEntryModal(false);
                resetEditEntryForm();
              }}>
                <Text style={tw`text-jung-purple font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <Text style={tw`text-lg font-bold text-gray-800`}>Edit Entry</Text>
              <TouchableOpacity onPress={handleUpdateEntry}>
                <Text style={tw`text-jung-purple font-semibold`}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-1 p-6`}>
              {/* Title Input */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-semibold mb-2`}>Title</Text>
                <TextInput
                  style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200`}
                  placeholder="Give your entry a title..."
                  value={editEntry.title}
                  onChangeText={(text) => setEditEntry({ ...editEntry, title: text })}
                  maxLength={100}
                />
              </View>

              {/* Content Input */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-700 font-semibold mb-2`}>Content</Text>
                <TextInput
                  style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200 min-h-32`}
                  placeholder="What's on your mind? Share your thoughts, feelings, or experiences..."
                  value={editEntry.content}
                  onChangeText={(text) => setEditEntry({ ...editEntry, content: text })}
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
                        style={tw`${editEntry.mood === mood ? 'bg-jung-purple' : 'bg-gray-100'} rounded-xl p-3 items-center min-w-16`}
                        onPress={() => setEditEntry({ ...editEntry, mood: editEntry.mood === mood ? undefined : mood })}
                      >
                        <Text style={tw`text-2xl mb-1`}>{getMoodEmoji(mood)}</Text>
                        <Text style={tw`${editEntry.mood === mood ? 'text-white' : 'text-gray-600'} text-xs font-medium capitalize`}>
                          {mood}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Tags Section */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-700 font-semibold mb-3`}>Tags</Text>
                <View style={tw`flex-row items-center mb-3`}>
                  <TextInput
                    style={tw`flex-1 bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200 mr-2`}
                    placeholder="Add a tag..."
                    placeholderTextColor="#9CA3AF"
                    value={editTagInput}
                    onChangeText={setEditTagInput}
                    onSubmitEditing={addTagToEditEntry}
                    maxLength={20}
                  />
                  <TouchableOpacity
                    style={tw`bg-jung-purple rounded-xl p-4 shadow-sm`}
                    onPress={addTagToEditEntry}
                    activeOpacity={0.8}
                  >
                    <SafePhosphorIcon iconType="Plus" size={16} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>

                {editEntry.tags.length > 0 && (
                  <View style={tw`flex-row flex-wrap`}>
                    {editEntry.tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={tw`bg-jung-purple/10 border border-jung-purple/20 rounded-full px-3 py-1.5 mr-2 mb-2 flex-row items-center`}
                        onPress={() => removeTagFromEditEntry(tag)}
                        activeOpacity={0.7}
                      >
                        <Text style={tw`text-jung-purple text-sm font-medium mr-1`}>#{tag}</Text>
                        <SafePhosphorIcon iconType="X" size={12} color="#4A3B78" weight="bold" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Options */}
              <View style={tw`space-y-6 mb-4`}>
                {/* Favorite Entry Option */}
                <View style={tw`${editEntry.isFavorite ? 'bg-red-50 border-red-200 shadow-md' : 'bg-gray-50 border-gray-200'} rounded-xl p-4 border-2`}>
                  <TouchableOpacity
                    style={tw`flex-row items-center justify-between`}
                    onPress={() => setEditEntry({ ...editEntry, isFavorite: !editEntry.isFavorite })}
                  >
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`${editEntry.isFavorite ? 'bg-red-100' : 'bg-gray-200'} p-2 rounded-full mr-3`}>
                        <SafePhosphorIcon
                          iconType="Heart"
                          size={18}
                          color={editEntry.isFavorite ? "#EF4444" : "#6B7280"}
                          weight={editEntry.isFavorite ? "fill" : "bold"}
                        />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`${editEntry.isFavorite ? 'text-red-600' : 'text-gray-800'} font-bold`}>
                          ❤️ Mark as Favorite
                        </Text>
                        <Text style={tw`${editEntry.isFavorite ? 'text-red-500' : 'text-gray-500'} text-sm mt-1`}>
                          Easy to find in your favorite entries collection
                        </Text>
                      </View>
                    </View>
                    <View style={tw`${editEntry.isFavorite ? 'bg-red-500' : 'bg-gray-300'} w-14 h-8 rounded-full p-1 ml-3`}>
                      <View style={tw`${editEntry.isFavorite ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'} w-6 h-6 rounded-full shadow-sm`} />
                    </View>
                  </TouchableOpacity>
                </View>
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
              <Text style={tw`text-lg font-bold text-gray-800`}>Journaling Coach</Text>
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
