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
import { SignOut, Plus, Sparkle, Brain, ArrowRight, ChatCircle, Play, X, NotePencil, Notebook, PencilLine, CheckCircle, XCircle, Feather, BookOpen, Lightbulb, FlowerLotus, Leaf, User } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateAIResponse } from '../lib/api';
import * as Clipboard from 'expo-clipboard';
import { AvatarSelector, availableAvatars } from '../components/AvatarSelector';
import { SimpleAvatar } from '../components/SimpleAvatar';
import { Avatar } from '../components/AvatarSelector';

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  avatar_id?: string;
  avatar?: string;
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
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

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
    
    // Set a more intuitive default title
    setNewConversationTitle('New Reflection');
    
    setShowNewChatModal(true);
  };

  const handleSelectConversation = (id: string) => {
    navigation.navigate('Chat', { conversationId: id });
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
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your conversation');
      return;
    }
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a conversation');
        return;
      }
      
      // Create a new conversation with the selected avatar
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title,
          user_id: user.id,
          avatar_id: selectedAvatar, // Use the column name that exists in your database
          // If you've added the avatar column, you can include this too
          // avatar: selectedAvatar
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Created new conversation:', data);
      
      // Close the modal and navigate to the new chat
      setShowNewChatModal(false);
      setNewConversationTitle('');
      
      // Navigate to the chat screen with the new conversation ID
      navigation.navigate('Chat', { conversationId: data.id });
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderNewChatModal = () => {
    return (
      <Modal
        visible={showNewChatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white rounded-t-3xl p-6 max-h-[80%]`}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={tw`text-2xl font-bold text-center mb-6`}>
                New Reflection
              </Text>
              
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelectAvatar={(avatarId) => {
                  setSelectedAvatar(avatarId);
                  
                  // Update title based on selected avatar
                  const avatarName = availableAvatars.find((a: Avatar) => a.id === avatarId)?.name || 'Jung';
                  setNewConversationTitle(`Reflection with ${avatarName}`);
                }}
                hasPremiumAccess={hasPremiumAccess}
              />
              
              <View style={tw`mb-4`}>
                <TextInput
                  style={tw`border border-gray-300 rounded-lg p-3 mb-2`}
                  placeholder="Conversation title"
                  onChangeText={setNewConversationTitle}
                  value={newConversationTitle}
                />
                
                {/* Title suggestions */}
                <View style={tw`mb-2`}>
                  <Text style={tw`text-sm text-gray-500 mb-2`}>Suggested titles:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {titleSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={tw`bg-gray-100 rounded-full px-3 py-1 mr-2`}
                        onPress={() => setNewConversationTitle(suggestion)}
                      >
                        <Text style={tw`text-sm`}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Generate title button */}
                <TouchableOpacity
                  style={tw`flex-row items-center justify-center bg-gray-100 p-2 rounded-lg`}
                  onPress={() => setNewConversationTitle(generateCreativeTitle())}
                >
                  <Sparkle size={18} color="#8A2BE2" weight="duotone" style={tw`mr-2`} />
                  <Text style={tw`text-jung-purple`}>Generate Creative Title</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            {/* Fixed position buttons at the bottom */}
            <View style={tw`flex-row justify-between items-center mt-4 pb-2`}>
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
  };

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

  // Add this function to generate a creative title
  const generateCreativeTitle = () => {
    const avatarName = availableAvatars.find((a: Avatar) => a.id === selectedAvatar)?.name || 'Jung';
    
    // Different title formats based on avatar
    const titleFormats = {
      'jung': [
        'Exploring the Shadow with Jung',
        'Archetypes & Individuation',
        'Journey to the Self',
        'Collective Unconscious Dialogue',
        'Jungian Reflection'
      ],
      'freud': [
        'Dream Analysis with Freud',
        'Exploring the Unconscious',
        'Id, Ego & Superego',
        'Psychoanalytic Dialogue',
        'Freudian Introspection'
      ],
      'adler': [
        'Finding Purpose with Adler',
        'Social Interest Reflection',
        'Overcoming Inferiority',
        'Adlerian Life Goals',
        'Striving for Superiority'
      ],
      'horney': [
        'Neurotic Needs Exploration',
        'Self-Realization with Horney',
        'Moving Toward, Against, Away',
        'Cultural Influences Dialogue',
        "Horney's Feminine Psychology"
      ],
      'morpheus': [
        'Red Pill Conversation',
        'Reality Deconstruction',
        'Awakening with Morpheus',
        'Beyond the Matrix',
        'Truth Seeker\'s Dialogue'
      ],
      'oracle': [
        'Prophecy & Potential',
        'Fate vs. Choice',
        'Oracle\'s Wisdom',
        'Seeing Beyond Time',
        'Crossroads Guidance'
      ]
    };
    
    // Get titles for the selected avatar or use default
    const titles = titleFormats[selectedAvatar as keyof typeof titleFormats] || [
      `Reflection with ${avatarName}`,
      `${avatarName}'s Guidance`,
      `My Journey with ${avatarName}`,
      `Self-Discovery with ${avatarName}`,
      `Inner Dialogue: ${avatarName}`
    ];
    
    // Pick a random title from the list
    const randomIndex = Math.floor(Math.random() * titles.length);
    return titles[randomIndex];
  };

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
          
          <View style={tw`flex-row`}>
            <TouchableJung
              onPress={() => navigation.navigate('AccountScreen')}
              style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-anima mr-2`}
            >
              <User size={24} color="#6b46c1" />
            </TouchableJung>
            
            <TouchableJung
              onPress={handleNewConversation}
              style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-anima`}
            >
              <PencilLine size={24} color="#E6C3C3" weight="light" />
            </TouchableJung>
          </View>
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
                  <SimpleAvatar 
                    avatarId={item.avatar || item.avatar_id || 'jung'} 
                    size={50} 
                    style={tw`mr-4`}
                  />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-base font-medium text-gray-900`}>{item.title}</Text>
                    <View style={tw`flex-row items-center`}>
                      <Text style={tw`text-sm text-gray-500`}>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                      {item.avatar_id && (
                        <View style={tw`flex-row items-center ml-2`}>
                          <Text style={tw`text-sm text-gray-400 mx-1`}>•</Text>
                          <Text style={tw`text-sm text-gray-500`}>
                            {availableAvatars.find((a: Avatar) => a.id === item.avatar_id)?.name || 'Jung'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
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