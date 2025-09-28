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
        <View style={tw`px-6 py-4 border-b border-gray-200 flex-row justify-between items-center`}>
          <TouchableOpacity onPress={onClose}>
            <Text style={tw`text-jung-purple font-semibold`}>Cancel</Text>
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-gray-800`}>Search & Filter</Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={tw`text-jung-purple font-semibold`}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1 p-6`}>
          {/* Text Search */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-700 font-semibold mb-2`}>Search Text</Text>
            <TextInput
              style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200`}
              placeholder="Search in titles and content..."
              value={filters.query || ''}
              onChangeText={(text) => setFilters({ ...filters, query: text })}
            />
          </View>

          {/* Mood Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-700 font-semibold mb-3`}>Filter by Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw`flex-row space-x-3`}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={tw`${filters.mood === mood ? 'bg-jung-purple' : 'bg-gray-100'} rounded-xl p-3 items-center min-w-16`}
                    onPress={() => setFilters({
                      ...filters,
                      mood: filters.mood === mood ? undefined : mood
                    })}
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
          <View style={tw`mb-6`}>
            <Text style={tw`text-gray-700 font-semibold mb-2`}>Filter by Tags</Text>
            <View style={tw`flex-row items-center mb-3`}>
              <TextInput
                style={tw`flex-1 bg-gray-50 rounded-xl p-4 text-gray-800 border border-gray-200 mr-2`}
                placeholder="Add tag to filter..."
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={tw`bg-jung-purple rounded-xl p-4`}
                onPress={addTag}
              >
                <SafePhosphorIcon iconType="Plus" size={16} color="white" weight="bold" />
              </TouchableOpacity>
            </View>

            {filters.tags && filters.tags.length > 0 && (
              <View style={tw`flex-row flex-wrap`}>
                {filters.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={tw`bg-jung-purple/10 border border-jung-purple/20 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center`}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={tw`text-jung-purple text-sm font-medium mr-1`}>#{tag}</Text>
                    <SafePhosphorIcon iconType="X" size={12} color="#4A3B78" weight="bold" />
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
            style={tw`bg-gray-100 border border-gray-200 rounded-xl py-4 px-6 mb-4`}
            onPress={clearFilters}
          >
            <Text style={tw`text-gray-700 font-bold text-center`}>Clear All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};