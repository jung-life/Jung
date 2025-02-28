import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Swipeable } from 'react-native-gesture-handler';
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SensualContainer } from '../components/SensualContainer';
import { Typography } from '../components/Typography';
import TouchableJung from '../components/TouchableJung';
import { SignOut, Plus, Sparkle, Brain } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateAIResponse } from '../lib/api';

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

type ConversationsScreenRouteProp = RouteProp<RootStackParamList, 'Conversations'>;

export const ConversationsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ConversationsScreenRouteProp>();
  const refresh = route.params?.refresh;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const swipeableRefs = React.useRef<Map<string, Swipeable>>(new Map());

  const fetchConversations = useCallback(async () => {
    try {
      console.log('Fetching conversations...');
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        return;
      }
      
      console.log('Fetching conversations for user:', user.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      console.log('Fetched conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Reflections screen focused - fetching conversations');
      console.log('Route params:', route.params);
      fetchConversations();
      return () => {
        // Cleanup function if needed
      };
    }, [fetchConversations, refresh])
  );

  const handleNewConversation = () => {
    navigation.navigate('Chat', { id: 'new' });
  };

  const handleSelectConversation = (id: string) => {
    navigation.navigate('Chat', { id });
  };
  
  const handleLogout = async () => {
    try {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Logout", 
            onPress: async () => {
              try {
                await supabase.auth.signOut();
                // The auth state change will automatically redirect to Landing
              } catch (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing logout dialog:', error);
    }
  };

  const handleDeleteConversation = (id: string, title: string) => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => deleteConversation(id),
          style: "destructive"
        }
      ]
    );
  };

  const deleteConversation = async (id: string) => {
    try {
      setDeleting(id);
      
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);
        
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
        
      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }
      
      console.log(`Successfully deleted conversation ${id} and its messages`);
      
      // Update the UI
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert("Error", "Failed to delete conversation. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleAnalyzeChat = async (id: string, title: string) => {
    try {
      // Check if analysis already exists
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .eq('conversation_id', id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking for existing analysis:', fetchError);
        Alert.alert("Error", "Failed to check for existing analysis");
        return;
      }
      
      if (existingAnalysis) {
        // Analysis exists, show options
        Alert.alert(
          "Analysis Available",
          `What would you like to do with the analysis for "${title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "View", onPress: () => viewAnalysis(existingAnalysis) },
            { text: "Download", onPress: () => downloadAnalysis(existingAnalysis) },
            { text: "Share", onPress: () => emailAnalysis(existingAnalysis) },
            { text: "Regenerate", onPress: () => createAnalysis(id, title) }
          ]
        );
      } else {
        // No analysis exists, create one
        Alert.alert(
          "Create Analysis",
          `Would you like to create an analysis for "${title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Create", onPress: () => createAnalysis(id, title) }
          ]
        );
      }
    } catch (error) {
      console.error('Error in handleAnalyzeChat:', error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const createAnalysis = async (conversationId: string, title: string) => {
    try {
      // Show loading indicator
      Alert.alert("Generating Analysis", "Please wait while we analyze your conversation...");
      
      // Fetch all messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        Alert.alert("Error", "Failed to fetch conversation messages");
        return;
      }
      
      if (!messages || messages.length === 0) {
        Alert.alert("Empty Conversation", "There are no messages to analyze");
        return;
      }
      
      // Format messages for the API in the expected format
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add a system message with the analysis instructions
      const conversationHistory = [
        {
          role: "system",
          content: "Please analyze the following conversation and provide insights from a Jungian perspective. Include themes, patterns, and potential areas for self-reflection."
        },
        ...formattedMessages
      ];
      
      // Pass the formatted conversation history to the API
      const analysisResponse = await generateAIResponse(conversationHistory, "gpt-4");
      
      if (!analysisResponse) {
        Alert.alert("Error", "Failed to generate analysis");
        return;
      }
      
      // Store analysis in Supabase
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          conversation_id: conversationId,
          content: analysisResponse,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error storing analysis:', insertError);
        Alert.alert("Error", "Failed to save analysis");
        return;
      }
      
      // Show success and options
      Alert.alert(
        "Analysis Complete",
        "Your conversation has been analyzed. What would you like to do next?",
        [
          { text: "View", onPress: () => viewAnalysis(analysis) },
          { text: "Download", onPress: () => downloadAnalysis(analysis) },
          { text: "Share", onPress: () => emailAnalysis(analysis) }
        ]
      );
      
    } catch (error) {
      console.error('Error creating analysis:', error);
      Alert.alert("Error", "Failed to create analysis");
    }
  };

  const viewAnalysis = (analysis) => {
    Alert.alert(
      "Conversation Analysis",
      analysis.content,
      [{ text: "Close" }]
    );
  };

  const downloadAnalysis = async (analysis) => {
    try {
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (!isSharingAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }
      
      // Create a temporary file
      const fileUri = `${FileSystem.documentDirectory}analysis_${analysis.conversation_id}.txt`;
      
      // Write the analysis to the file
      await FileSystem.writeAsStringAsync(fileUri, analysis.content);
      
      // Share the file
      await Sharing.shareAsync(fileUri);
      
    } catch (error) {
      console.error('Error downloading analysis:', error);
      Alert.alert("Error", "Failed to download analysis");
    }
  };

  const emailAnalysis = async (analysis) => {
    try {
      // Create a temporary file for sharing
      const fileUri = `${FileSystem.documentDirectory}analysis_${analysis.conversation_id}.txt`;
      
      // Write the analysis to the file
      await FileSystem.writeAsStringAsync(fileUri, analysis.content);
      
      // Use sharing instead of email composer
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Analysis',
        UTI: 'public.plain-text'
      });
      
    } catch (error) {
      console.error('Error sharing analysis:', error);
      Alert.alert("Error", "Failed to share analysis");
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-gray-200/50`}>
          <TouchableJung
            onPress={handleLogout}
            style={tw`flex-row items-center py-2 px-3 rounded-lg`}
          >
            <View style={tw`w-8 h-8 rounded-full border border-jung-gold flex items-center justify-center`}>
              <SignOut size={16} color="#D4AF37" weight="light" />
            </View>
          </TouchableJung>
          
          <Typography variant="title">Reflections</Typography>
          
          <TouchableJung
            onPress={handleNewConversation}
            style={tw`w-11 h-11 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-anima`}
          >
            <Sparkle size={24} color="#E6C3C3" weight="light" />
          </TouchableJung>
        </View>
        
        {conversations.length === 0 && !loading ? (
          <View style={tw`flex-1 justify-center items-center p-5`}>
            <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>No conversations yet</Text>
            <Text style={tw`text-base text-gray-600 text-center mb-6`}>
              Start a new conversation to begin your journey
            </Text>
            <TouchableOpacity 
              style={tw`bg-jung-purple py-3 px-6 rounded-lg shadow-sm`}
              onPress={handleNewConversation}
            >
              <Text style={tw`text-white font-semibold text-base`}>Start New Conversation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Swipeable
                ref={(ref) => {
                  if (ref) swipeableRefs.current.set(item.id, ref);
                }}
                renderRightActions={() => (
                  <TouchableOpacity 
                    style={tw`bg-red-500 w-24 justify-center items-center`}
                    onPress={() => {
                      swipeableRefs.current.get(item.id)?.close();
                      handleDeleteConversation(item.id, item.title);
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
                  onPress={() => handleSelectConversation(item.id)}
                >
                  <Text style={tw`text-base font-medium text-gray-900`}>{item.title}</Text>
                  <View style={tw`flex-row items-center`}>
                    <TouchableJung
                      style={tw`p-2 mr-2`}
                      onPress={() => handleAnalyzeChat(item.id, item.title)}
                    >
                      <Brain size={20} color="#536878" weight="light" />
                    </TouchableJung>
                    <Text style={tw`text-sm text-gray-500 mr-2`}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    <AntDesign name="right" size={16} color="#718096" />
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  newButton: {
    backgroundColor: '#0284c7',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  conversationDate: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
}); 