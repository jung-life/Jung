import React from 'react';
import { View, Text, FlatList } from 'react-native';
import tw from '../lib/tailwind';
import { Smiley, SmileyMeh, SmileySad, SmileyXEyes, CloudLightning } from 'phosphor-react-native';

type MoodOption = 'Happy' | 'Okay' | 'Sad' | 'Anxious' | 'Angry';
type MoodEntry = {
  id: string;
  timestamp: number;
  mood: MoodOption;
  note?: string;
};

interface MoodHistoryDisplayProps {
  history: MoodEntry[];
}

// Helper to get icon and color based on mood
const getMoodDetails = (mood: MoodOption) => {
  switch (mood) {
    case 'Happy': return { icon: <Smiley size={20} weight="light" />, color: 'text-green-500' };
    case 'Okay': return { icon: <SmileyMeh size={20} weight="light" />, color: 'text-yellow-500' };
    case 'Sad': return { icon: <SmileySad size={20} weight="light" />, color: 'text-blue-500' };
    case 'Anxious': return { icon: <CloudLightning size={20} weight="light" />, color: 'text-purple-500' };
    case 'Angry': return { icon: <SmileyXEyes size={20} weight="light" />, color: 'text-red-500' };
    default: return { icon: null, color: 'text-gray-500' };
  }
};

const MoodHistoryDisplay: React.FC<MoodHistoryDisplayProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <Text style={tw`text-center text-gray-500 italic`}>No mood history yet.</Text>;
  }

  const renderItem = ({ item }: { item: MoodEntry }) => {
    const { icon, color } = getMoodDetails(item.mood);
    const date = new Date(item.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <View style={tw`bg-white/70 border border-gray-200/50 rounded-lg p-3 mb-3 shadow-sm`}>
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

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      // Optional: Add styling for the list container if needed
      // style={tw`...`}
    />
  );
};

export default MoodHistoryDisplay;
