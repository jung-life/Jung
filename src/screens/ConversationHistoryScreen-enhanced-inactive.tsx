import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabaseEnhanced } from '../lib/supabase-enhanced'; // Use enhanced version
import { Swipeable } from 'react-native-gesture-handler';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import TouchableJung from '../components/TouchableJung';
import { ArrowLeft, Brain, X, House, Calendar, Clock, Download, ShareNetwork, Copy } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { SimpleAvatar } from '../components/SimpleAvatar';
import { availableAvatars } from '../components/AvatarSelector';
import { encryptData, decryptData } from '../lib/encryptionUtils';
import useAuthStore from '../store/useAuthStore';

type ConversationHistory = {
  id: string;
  conversation_id: string;
  title: string;
  saved_at: string;
  avatar_id?: string;
};

export const ConversationHistoryScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const swipeableRefs = React.useRef<Map<string, Swipeable>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchConversationHistory = useCallback(async () => {
    try {
      console.log('Fetching conversation history...');
      setLoading(true);
      
      if (!supabaseEnhanced) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No authenticated user found in store');
        setError('Not authenticated. Please try logging out and back in.');
        setLoading(false);
        return;
      }
      
      console.log('Using user from store:', user.id);
      
      // Fetch conversation history
      const { data, error } = await supabaseEnhanced
        .from('conversation_history')
        .select(`
          id,
          conversation_id,
          title,
          saved_at,
          conversations:conversation_id (avatar_id)
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversation history:', error);
        setError('Failed to load conversation history. Please try again later.');
        setLoading(false);
        return;
      }
      
      // Format the data to include avatar_id
      const formattedHistory = data?.map(item => {
        // Extract avatar_id from the conversations join
        const avatarId = item.conversations ? (item.conversations as any).avatar_id : null;
        
        // Decrypt title if needed - using the improved decryptData that doesn't throw errors
        let title = item.title;
        if (title) {
          // decryptData now handles all errors internally
          title = decryptData(title);
          
          // If decryption failed, use a default title
          if (title === '[Encrypted Content]') {
            title = 'Untitled Conversation';
          }
        } else {
          title = 'Untitled Conversation';
        }
        
        return {
          id: item.id,
          conversation_id: item.conversation_id,
          title: title,
          saved_at: item.saved_at,
          avatar_id: avatarId
        };
      }) || [];
      
      console.log('Fetched conversation history:', formattedHistory.length);
      setHistory(formattedHistory);
      
    } catch (error) {
      console.error('Error in fetchConversationHistory:', error);
      setError('Failed to load conversation history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('Conversation History screen focused');
      fetchConversationHistory();
      return () => {
        // Cleanup function if needed
      };
    }, [fetchConversationHistory])
  );

  const handleSelectConversation = (conversationId: string) => {
    navigation.navigate('Chat', { conversationId });
  };

  const handleDeleteHistory = (id: string, title: string) => {
    Alert.alert(
      "Delete History",
      `Are you sure you want to delete "${title}" from your history? This won't delete the actual conversation.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => deleteHistory(id),
          style: "destructive"
        }
      ]
    );
  };

  const deleteHistory = async (id: string) => {
    try {
      setDeleting(id);
      
      const { error } = await supabaseEnhanced
        .from('conversation_history')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting history:', error);
        throw error;
      }
      
      console.log(`Successfully deleted history ${id}`);
      
      // Update the UI
      setHistory(prev => prev.filter(item => item.id !== id));
      
    } catch (error) {
      console.error('Error deleting history:', error);
      Alert.alert("Error", "Failed to delete history. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewInsights = (conversationId: string) => {
    // Navigate to the enhanced insights screen
    navigation.navigate('ConversationInsightsScreen-enhanced', { conversationId });
  };

  const renderHistoryItem = ({ item }: { item: ConversationHistory }) => {
    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderRightActions={() => (
          <TouchableOpacity 
            style={tw`bg-red-500 w-24 justify-center items-center`}
            onPress={() => {
              swipeableRefs.current.get(item.id)?.close();
              handleDeleteHistory(item.id, item.title);
            }}
            disabled={deleting === item.id}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={tw`items-center justify-center`}>
                <AntDesign name="delete" size={20} color="white" />
                <Text style={tw`text-white text-sm mt-1`}>Delete</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity 
          style={tw`flex-row items-center justify-between p-4 bg-white border-b border-gray-200`}
          onPress={() => handleSelectConversation(item.conversation_id)}
        >
          <SimpleAvatar 
            avatarId={item.avatar_id || 'jung'} 
            size={50} 
            style={tw`mr-4`}
          />
          <View style={tw`flex-1`}>
            <Text style={tw`text-base font-medium text-gray-900`}>{item.title}</Text>
            <View style={tw`flex-row items-center`}>
              <Clock size={14} color="#718096" weight="fill" />
              <Text style={tw`text-sm text-gray-500 ml-1`}>
                {new Date(item.saved_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              {item.avatar_id && (
                <View style={tw`flex-row items-center ml-2`}>
                  <Text style={tw`text-sm text-gray-400 mx-1`}>•</Text>
                  <Text style={tw`text-sm text-gray-500`}>
                    {availableAvatars.find((a) => a.id === item.avatar_id)?.name || 'Jung'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={tw`flex-row items-center`}>
            <TouchableJung
              style={tw`p-2 mr-2`}
              onPress={() => handleViewInsights(item.conversation_id)}
            >
              <Brain size={20} color="#536878" weight="light" />
            </TouchableJung>
            <AntDesign name="right" size={16} color="#718096" />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#4A3B78" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Conversation History</Text>
          <View style={tw`w-10`} />
        </View>
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>Loading conversation history...</Text>
          </View>
        ) : error ? (
          <View style={tw`flex-1 justify-center items-center p-4`}>
            <Text style={tw`text-red-500 text-lg mb-4`}>Error</Text>
            <Text style={tw`text-center mb-6`}>{error}</Text>
            <TouchableOpacity
              style={tw`mb-4 bg-jung-purple py-3 px-6 rounded-lg`}
              onPress={() => {
                setError(null);
                fetchConversationHistory();
              }}
            >
              <Text style={tw`text-white font-semibold`}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-gray-200 py-3 px-6 rounded-lg`}
              onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
            >
              <Text style={tw`text-gray-800 font-semibold`}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : history.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center p-5`}>
            <Calendar size={60} color="#4A3B78" weight="light" />
            <Text style={tw`text-xl font-bold text-gray-900 mt-4 mb-2`}>No conversation history</Text>
            <Text style={tw`text-base text-gray-600 text-center mb-6`}>
              Your saved conversations will appear here
            </Text>
            <TouchableOpacity 
              style={tw`bg-jung-purple py-3 px-6 rounded-lg shadow-sm`}
              onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
            >
              <Text style={tw`text-white font-semibold text-base`}>Go to Conversations</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={tw`pb-20`}
          />
        )}
        
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <House size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};
