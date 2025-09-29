import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import tw from '../lib/tailwind';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { JournalSearchFilters, MoodType } from '../types/journal';

interface JournalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: JournalSearchFilters) => void;
  initialFilters?: JournalSearchFilters;
}

export const JournalSearchModal: React.FC<JournalSearchModalProps> = ({
  visible,
  onClose,
  onSearch,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<JournalSearchFilters>(initialFilters);
  const [tagInput, setTagInput] = useState('');

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({});
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && (!filters.tags || !filters.tags.includes(tagInput.trim()))) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters({
      ...filters,
      tags: filters.tags?.filter(tag => tag !== tagToRemove),
    });
  };

  const getMoodEmoji = (mood: MoodType) => {
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
    return moodEmojis[mood] || '😐';
  };

  const moodOptions: MoodType[] = [
    'happy', 'excited', 'content', 'calm', 'neutral',
    'anxious', 'sad', 'frustrated', 'angry', 'tired',
    'energetic', 'grateful', 'hopeful', 'lonely', 'stressed'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={tw`flex-1 bg-white`}>
        {/* Header */}
        <View style={tw`px-6 py-4 border-b border-gray-200 flex-row justify-between items-center bg-purple-50`}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Cancel search"
            accessibilityHint="Close search modal without applying filters"
            style={tw`px-3 py-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <Text style={tw`text-jung-purple font-semibold`}>Cancel</Text>
          </TouchableOpacity>
          <View style={tw`flex-row items-center`}>
            <SafePhosphorIcon iconType="FunnelSimple" size={20} color="#4A3B78" weight="bold" />
            <Text style={tw`text-lg font-bold text-gray-800 ml-2`}>Search & Filter</Text>
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            accessibilityLabel="Apply search filters"
            accessibilityHint="Apply the current search filters to your journal entries"
            style={tw`bg-jung-purple px-3 py-2 rounded-lg shadow-sm`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-white font-semibold`}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1 p-6`}>
          {/* Text Search */}
          <View style={tw`mb-6 bg-blue-50 rounded-2xl p-4 border border-blue-200`}>
            <View style={tw`flex-row items-center mb-3`}>
              <SafePhosphorIcon iconType="MagnifyingGlass" size={18} color="#3B82F6" weight="bold" />
              <Text style={tw`text-gray-700 font-semibold ml-2`}>Search Text</Text>
            </View>
            <TextInput
              style={tw`bg-white rounded-xl p-4 text-gray-800 border border-blue-300 shadow-sm`}
              placeholder="Search in titles and content..."
              placeholderTextColor="#9CA3AF"
              value={filters.query || ''}
              onChangeText={(text) => setFilters({ ...filters, query: text })}
              accessibilityLabel="Search text input"
              accessibilityHint="Enter text to search for in journal entry titles and content"
            />
          </View>

          {/* Mood Filter */}
          <View style={tw`mb-6 bg-purple-50 rounded-2xl p-4 border border-purple-200`}>
            <View style={tw`flex-row items-center mb-3`}>
              <SafePhosphorIcon iconType="Smiley" size={18} color="#8B5CF6" weight="bold" />
              <Text style={tw`text-gray-700 font-semibold ml-2`}>Filter by Mood</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw`flex-row space-x-3`}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={tw`${filters.mood === mood ? 'bg-jung-purple shadow-md' : 'bg-white border border-purple-300 shadow-sm'} rounded-xl p-3 items-center min-w-16`}
                    onPress={() => setFilters({
                      ...filters,
                      mood: filters.mood === mood ? undefined : mood
                    })}
                    accessibilityLabel={`Filter by ${mood} mood`}
                    accessibilityHint={`Tap to ${filters.mood === mood ? 'remove' : 'apply'} ${mood} mood filter`}
                    activeOpacity={0.8}
                  >
                    <Text style={tw`text-2xl mb-1`}>{getMoodEmoji(mood)}</Text>
                    <Text style={tw`${filters.mood === mood ? 'text-white' : 'text-gray-600'} text-xs font-medium capitalize`}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tags Filter */}
          <View style={tw`mb-6 bg-green-50 rounded-2xl p-4 border border-green-200`}>
            <View style={tw`flex-row items-center mb-3`}>
              <SafePhosphorIcon iconType="Plus" size={18} color="#10B981" weight="bold" />
              <Text style={tw`text-gray-700 font-semibold ml-2`}>Filter by Tags</Text>
            </View>
            <View style={tw`flex-row items-center mb-3`}>
              <TextInput
                style={tw`flex-1 bg-white rounded-xl p-4 text-gray-800 border border-green-300 shadow-sm mr-2`}
                placeholder="Add tag to filter..."
                placeholderTextColor="#9CA3AF"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                accessibilityLabel="Tag input field"
                accessibilityHint="Enter a tag name to add to your search filters"
              />
              <TouchableOpacity
                style={tw`bg-green-500 rounded-xl p-4 shadow-md`}
                onPress={addTag}
                accessibilityLabel="Add tag filter"
                accessibilityHint="Add the entered tag to your search filters"
                activeOpacity={0.8}
              >
                <SafePhosphorIcon iconType="Plus" size={16} color="white" weight="bold" />
              </TouchableOpacity>
            </View>

            {filters.tags && filters.tags.length > 0 && (
              <View style={tw`flex-row flex-wrap`}>
                {filters.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={tw`bg-green-100 border border-green-300 rounded-full px-3 py-1.5 mr-2 mb-2 flex-row items-center shadow-sm`}
                    onPress={() => removeTag(tag)}
                    accessibilityLabel={`Remove ${tag} tag filter`}
                    accessibilityHint={`Tap to remove the ${tag} tag from your search filters`}
                    activeOpacity={0.7}
                  >
                    <Text style={tw`text-green-700 text-sm font-medium mr-1`}>#{tag}</Text>
                    <SafePhosphorIcon iconType="X" size={12} color="#047857" weight="bold" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Range */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-700 font-semibold mb-2`}>Date Range</Text>
            <View style={tw`flex-row space-x-3`}>
              <TouchableOpacity style={tw`flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200`}>
                <Text style={tw`text-gray-500 text-sm`}>Start Date</Text>
                <Text style={tw`text-gray-800`}>
                  {filters.dateRange?.start ? new Date(filters.dateRange.start).toLocaleDateString() : 'Select start date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200`}>
                <Text style={tw`text-gray-500 text-sm`}>End Date</Text>
                <Text style={tw`text-gray-800`}>
                  {filters.dateRange?.end ? new Date(filters.dateRange.end).toLocaleDateString() : 'Select end date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Word Count Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-700 font-semibold mb-2`}>Word Count Range</Text>
            <View style={tw`flex-row space-x-3`}>
              <TextInput
                style={tw`flex-1 bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200`}
                placeholder="Min words"
                value={filters.minWordCount?.toString() || ''}
                onChangeText={(text) => setFilters({
                  ...filters,
                  minWordCount: text ? parseInt(text) : undefined
                })}
                keyboardType="numeric"
              />
              <TextInput
                style={tw`flex-1 bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200`}
                placeholder="Max words"
                value={filters.maxWordCount?.toString() || ''}
                onChangeText={(text) => setFilters({
                  ...filters,
                  maxWordCount: text ? parseInt(text) : undefined
                })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Additional Filters */}
          <View style={tw`mb-8`}>
            <Text style={tw`text-gray-700 font-semibold mb-3`}>Additional Filters</Text>

            <TouchableOpacity
              style={tw`flex-row items-center justify-between py-3`}
              onPress={() => setFilters({
                ...filters,
                isFavorite: filters.isFavorite === undefined ? true : (filters.isFavorite ? undefined : true)
              })}
            >
              <View style={tw`flex-row items-center`}>
                <SafePhosphorIcon
                  iconType="Heart"
                  size={20}
                  color={filters.isFavorite ? "#EF4444" : "#6B7280"}
                  weight={filters.isFavorite ? "fill" : "bold"}
                />
                <Text style={tw`text-gray-700 ml-3`}>Favorites Only</Text>
              </View>
              <View style={tw`${filters.isFavorite ? 'bg-red-500' : 'bg-gray-200'} w-12 h-6 rounded-full p-1`}>
                <View style={tw`${filters.isFavorite ? 'translate-x-6' : 'translate-x-0'} w-4 h-4 bg-white rounded-full`} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Clear Filters Button */}
          <TouchableOpacity
            style={tw`bg-red-50 border border-red-300 rounded-xl py-4 px-6 mb-4 shadow-sm flex-row items-center justify-center`}
            onPress={clearFilters}
            accessibilityLabel="Clear all search filters"
            accessibilityHint="Remove all current search filters and reset the search form"
            activeOpacity={0.8}
          >
            <SafePhosphorIcon iconType="X" size={18} color="#DC2626" weight="bold" />
            <Text style={tw`text-red-600 font-bold text-center ml-2`}>Clear All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};