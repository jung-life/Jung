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
  TextInput
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
import { SignOut, Plus, Sparkle, Brain, ArrowRight, ChatCircle, Play, X, NotePencil, Notebook, PencilLine, CheckCircle, XCircle, Feather, BookOpen, Lightbulb, FlowerLotus, Leaf } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateAIResponse } from '../lib/api';
import * as Clipboard from 'expo-clipboard';
import { AvatarSelector, availableAvatars } from '../components/AvatarSelector';

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

type Analysis = {
  id: string;
  conversation_id: string;
  content: string;
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
  const [analysesCache, setAnalysesCache] = useState<Record<string, Analysis[]>>({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('jung');
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

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
    setSelectedAvatar('jung');
    setShowNewChatModal(true);
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
      // Check cache first
      let existingAnalysis: Analysis | undefined;
      
      if (analysesCache[id]?.length > 0) {
        existingAnalysis = analysesCache[id][0];
      } else {
        // Fetch from database if not in cache
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!error && data) {
          existingAnalysis = data;
          // Update cache
          setAnalysesCache(prev => ({
            ...prev,
            [id]: [data]
          }));
        }
      }
      
      if (existingAnalysis) {
        // Analysis exists, show options
        Alert.alert(
          "Insights Available",
          `What would you like to do with the insights for "${title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "View", onPress: () => viewAnalysis(existingAnalysis) },
            { text: "Download", onPress: () => downloadAnalysis(existingAnalysis, title) },
            { text: "Share", onPress: () => emailAnalysis(existingAnalysis, title) },
            { text: "Regenerate", onPress: () => createAnalysis(id, title) }
          ]
        );
      } else {
        // No analysis exists, create one
        Alert.alert(
          "Generate Insights",
          `Would you like to generate insights for "${title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Generate", onPress: () => createAnalysis(id, title) }
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
      Alert.alert("Generating Insights", "Please wait while we analyze your conversation...");
      
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
      
      // Format the conversation as a simple string
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      // Create a more general prompt for analysis
      const analysisPrompt = `Please analyze the following conversation and provide:
1. Key themes and patterns in the discussion
2. Personal insights that might be valuable for self-reflection
3. Practical suggestions based on the conversation
4. Potential areas for further exploration

Please use clear, accessible language with specific examples from the conversation. Format your response in sections with headings.

Here's the conversation:
${conversationText}`;
      
      // Call the API with the prompt
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const apiKey = process.env.EXPO_PUBLIC_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error('Missing API URL or API Key');
      }

      const analysisResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.7
        })
      });
      
      if (!analysisResponse.ok) {
        throw new Error(`API error: ${analysisResponse.status}`);
      }
      
      const responseData = await analysisResponse.json();
      const analysisContent = responseData.choices[0].message.content;
      
      // Store analysis in Supabase
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          conversation_id: conversationId,
          content: analysisContent,
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
          { text: "Download", onPress: () => downloadAnalysis(analysis, title) },
          { text: "Share", onPress: () => emailAnalysis(analysis, title) }
        ]
      );
      
    } catch (error) {
      console.error('Error creating analysis:', error);
      Alert.alert("Error", "Failed to create analysis");
    }
  };

  const viewAnalysis = (analysis: Analysis) => {
    Alert.alert(
      "Conversation Insights",
      analysis.content,
      [{ text: "Close" }]
    );
  };

  const downloadAnalysis = async (analysis: Analysis, title?: string) => {
    try {
      // Get conversation title from cache or use default
      const conversationTitle = title || "Conversation";
      
      // Format date for filename
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Create a header for the text file
      const header = `INSIGHTS FOR: ${conversationTitle.toUpperCase()}\nDATE: ${date.toLocaleDateString()}\n\n`;
      const content = header + analysis.content;
      
      // Use React Native's Share API directly without file operations
      await Share.share({
        title: `Insights_${formattedDate}`,
        message: content
      });
      
    } catch (error) {
      console.error('Error sharing insights:', error);
      Alert.alert("Error", "Failed to share insights: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const emailAnalysis = async (analysis: Analysis, title?: string) => {
    try {
      await downloadAnalysis(analysis, title);
    } catch (error) {
      console.error('Error sharing insights:', error);
      Alert.alert("Error", "Failed to share insights: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const fetchAnalyses = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }
  };

  const createNewConversation = async (title: string) => {
    try {
      setShowNewChatModal(false);
      
      // Format the current date for the default title
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      const defaultTitle = `Reflection_${month}/${day}/${year}`;
      
      // Get user session with better error handling
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        Alert.alert("Authentication Error", "Please log out and log back in to continue.");
        return;
      }
      
      if (!data.session || !data.session.user) {
        console.error('No active session found');
        Alert.alert("Authentication Error", "You need to be logged in to create a conversation.");
        return;
      }
      
      const user = data.session.user;
      console.log('Creating conversation for user:', user.id);
      
      // Create a new conversation with the avatar information
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          title: title || defaultTitle,
          user_id: user.id,
          avatar_id: selectedAvatar,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      // Navigate to the chat screen with the new conversation
      navigation.navigate('Chat', { id: conversation.id });
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    }
  };

  const renderNewChatModal = () => (
    <Modal
      visible={showNewChatModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNewChatModal(false)}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-5/6 rounded-xl p-5`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Typography variant="title" style={tw`text-center flex-1`}>Start a New Conversation</Typography>
            <TouchableOpacity 
              style={tw`p-2`}
              onPress={() => setShowNewChatModal(false)}
            >
              <AntDesign name="close" size={24} color="red" />
            </TouchableOpacity>
          </View>
          
          <AvatarSelector
            selectedAvatar={selectedAvatar}
            onSelectAvatar={(avatarId) => {
              setSelectedAvatar(avatarId);
              
              // Set default title with current date in mm/dd/yyyy format
              const today = new Date();
              const month = (today.getMonth() + 1).toString().padStart(2, '0');
              const day = today.getDate().toString().padStart(2, '0');
              const year = today.getFullYear();
              
              setNewConversationTitle(`Reflection - ${month}/${day}/${year}`);
            }}
            hasPremiumAccess={hasPremiumAccess}
          />
          
          <TextInput
            style={tw`border border-gray-300 rounded-lg p-3 mb-4`}
            placeholder="Conversation title"
            onChangeText={setNewConversationTitle}
            value={newConversationTitle}
          />
          
          <View style={tw`flex-row justify-between items-center mt-2`}>
            <TouchableOpacity 
              style={tw`w-14 h-14 rounded-full flex items-center justify-center border-2 border-red-300`}
              onPress={() => setShowNewChatModal(false)}
            >
              <XCircle size={28} color="#F87171" weight="duotone" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`w-14 h-14 rounded-full flex items-center justify-center border-2 border-purple-300 bg-jung-purple`}
              onPress={() => createNewConversation(newConversationTitle)}
            >
              <FlowerLotus size={28} color="#A5F3FC" weight="duotone" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const checkPremiumAccess = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('is_active')
        .eq('user_id', user.id)
        .single();
        
      if (error || !data) return false;
      return data.is_active === true;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkPremium = async () => {
      const isPremium = await checkPremiumAccess();
      setHasPremiumAccess(isPremium);
    };
    
    checkPremium();
  }, []);

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-gray-200/50`}>
          <TouchableJung
            onPress={handleLogout}
            style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-gold`}
          >
            <SignOut size={24} color="#D4AF37" weight="light" />
          </TouchableJung>
          
          <Typography variant="title">Reflections</Typography>
          
          <TouchableJung
            onPress={handleNewConversation}
            style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-anima`}
          >
            <PencilLine size={24} color="#E6C3C3" weight="light" />
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
        {renderNewChatModal()}
      </SafeAreaView>
    </GradientBackground>
  );
};