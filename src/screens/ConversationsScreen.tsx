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
import { SignOut, Plus, Sparkle, Brain, ArrowRight, ChatCircle, Play, X, NotePencil, Notebook, PencilLine, CheckCircle, XCircle, Feather, BookOpen, Lightbulb, FlowerLotus, Leaf, User, ArrowLeft, List, House } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateAIResponse } from '../lib/api';
import * as Clipboard from 'expo-clipboard';
import { AvatarSelector, availableAvatars } from '../components/AvatarSelector';
import { SimpleAvatar } from '../components/SimpleAvatar';
import { Avatar } from '../components/AvatarSelector';
import { generateUUID } from '../lib/uuid-polyfill';

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

type ConversationsScreenRouteProp = RouteProp<RootStackParamList, 'ConversationsScreen'>;

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
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      console.log('Fetching conversations...');
      setLoading(true);
      
      // Add a fallback mechanism
      setTimeout(() => {
        if (loading) {
          console.log('Fetch timeout - forcing loading to false');
          setLoading(false);
          setError('Connection timeout. Please check your internet connection and try again.');
        }
      }, 15000); // 15 second absolute timeout
      
      // Check if Supabase is initialized
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }
      
      // Get current user with error handling
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setLoading(false);
        return;
      }
      
      if (!userData?.user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }
      
      console.log('User found:', userData.user.id);
      
      // Fetch conversations with timeout
      const fetchPromise = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 10000)
      );
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('Supabase fetch error:', error);
        setLoading(false);
        return;
      }
      
      console.log('Fetched conversations:', data?.length || 0);
      setConversations(data || []);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      setError('Failed to load conversations. Please try again later.');
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

  const handleAnalyzeChat = async (conversationId: string, title: string) => {
    Alert.alert(
      'Analyze Conversation',
      'What would you like to do?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Read Analysis',
          onPress: () => showAnalysis(conversationId, title)
        },
        {
          text: 'Export Analysis',
          onPress: () => handleExportAnalysis(conversationId)
        },
        {
          text: 'Save Analysis',
          onPress: () => handleSaveAnalysis(conversationId)
        }
      ]
    );
  };

  const showAnalysis = async (conversationId: string, title: string) => {
    try {
      setAnalyzing(conversationId);
      
      // Check if we already have the analysis cached
      if (analysesCache[conversationId]) {
        setCurrentAnalysis(analysesCache[conversationId][0]);
        setCurrentConversationTitle(title);
        setShowAnalysisModal(true);
        setAnalyzing(null);
        return;
      }
      
      // Fetch messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        Alert.alert('Error', 'Failed to fetch conversation messages');
        setAnalyzing(null);
        return;
      }
      
      if (!messages || messages.length === 0) {
        Alert.alert('Error', 'No messages found in this conversation');
        setAnalyzing(null);
        return;
      }
      
      // Format messages for analysis
      const formattedConversation = messages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'Jung'}: ${msg.content}`
      ).join('\n\n');
      
      // Generate analysis using AI
      const prompt = `
        Analyze the following conversation from a psychological perspective:
        
        ${formattedConversation}
        
        Please provide:
        1. Key themes and patterns
        2. Psychological insights
        3. Potential areas for personal growth
        4. Recommendations for further reflection
        
        Format your response in clear sections with headings.
      `;
      
      const analysisContent = await generateAIResponse(prompt);
      
      // Save analysis to database
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          conversation_id: conversationId,
          content: analysisContent,
        })
        .select()
        .single();
        
      if (analysisError) {
        console.error('Error saving analysis:', analysisError);
        Alert.alert('Error', 'Failed to save analysis');
        setAnalyzing(null);
        return;
      }
      
      // Update cache
      setAnalysesCache(prev => ({
        ...prev,
        [conversationId]: [analysisData, ...(prev[conversationId] || [])]
      }));
      
      // Show analysis
      setCurrentAnalysis(analysisData);
      setCurrentConversationTitle(title);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Error showing analysis:', error);
      Alert.alert('Error', 'Failed to show analysis');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleExportAnalysis = async (conversationId: string) => {
    try {
      setAnalyzing(conversationId);
      
      // Show confirmation dialog before proceeding
      const shouldProceed = await new Promise((resolve) => {
        Alert.alert(
          'Export Analysis',
          'Are you sure you want to export this analysis?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setAnalyzing(null);
                setShowAnalysisModal(false);
                resolve(false);
              }
            },
            {
              text: 'Export',
              onPress: () => resolve(true)
            }
          ]
        );
      });
      
      if (!shouldProceed) {
        return;
      }
      
      // Fetch analysis if not already cached
      if (!analysesCache[conversationId]) {
        await showAnalysis(conversationId, '');
      }
      
      // Export the analysis
      await handleShareAnalysis();
      
    } catch (error) {
      console.error('Error exporting analysis:', error);
      Alert.alert('Error', 'Failed to export analysis');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleSaveAnalysis = async (conversationId: string) => {
    try {
      setAnalyzing(conversationId);
      
      // Fetch analysis if not already cached
      if (!analysesCache[conversationId]) {
        await showAnalysis(conversationId, '');
      }
      
      // Save the analysis
      await handleCopyAnalysis();
      Alert.alert('Success', 'Analysis saved to clipboard');
      
    } catch (error) {
      console.error('Error saving analysis:', error);
      Alert.alert('Error', 'Failed to save analysis');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleShareAnalysis = async () => {
    try {
      if (!currentAnalysis) return;
      
      // Share directly as text
      await Share.share({
        message: currentAnalysis.content,
        title: 'Jung Analysis'
      });
    } catch (error) {
      console.error('Error sharing analysis:', error);
      Alert.alert('Error', 'Failed to share analysis. Please try again.');
    }
  };

  const handleCopyAnalysis = async () => {
    if (!currentAnalysis) return;
    
    try {
      await Clipboard.setStringAsync(currentAnalysis.content);
      Alert.alert('Success', 'Analysis copied to clipboard');
    } catch (error) {
      console.error('Error copying analysis:', error);
      Alert.alert('Error', 'Failed to copy analysis');
    }
  };

  const renderAnalysisModal = () => {
    if (!currentAnalysis) return null;
    
    return (
      <Modal
        visible={showAnalysisModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={tw`flex-1 bg-white`}>
          <SafeAreaView style={tw`flex-1`}>
            <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
              <TouchableOpacity 
                style={tw`p-2`}
                onPress={() => {
                  setShowAnalysisModal(false);
                  navigation.navigate('PostLoginScreen');
                }}
              >
                <X size={24} color="#4A3B78" />
              </TouchableOpacity>
              <Text style={tw`text-xl font-bold text-jung-deep`}>
                Analysis: {currentConversationTitle}
              </Text>
              <View style={tw`w-10`} />
            </View>
            
            <ScrollView style={tw`flex-1 p-4`}>
              <Text style={tw`text-base leading-6 text-gray-800`}>
                {currentAnalysis.content}
              </Text>
            </ScrollView>

            <View style={tw`flex-row justify-between p-4 border-t border-gray-200`}>
              <TouchableOpacity
                style={tw`flex-1 bg-jung-purple-light py-3 px-6 rounded-lg mr-2`}
                onPress={handleCopyAnalysis}
              >
                <Text style={tw`text-jung-purple text-center font-semibold`}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-jung-purple py-3 px-6 rounded-lg`}
                onPress={handleShareAnalysis}
              >
                <Text style={tw`text-white text-center font-semibold`}>Export</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
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

  useEffect(() => {
    console.log('ConversationsScreen mounted');
    console.log('Route params:', route.params);
    console.log('Loading state:', loading);
    console.log('Conversations:', conversations);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('Checking authentication...');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setError('Authentication error: ' + error.message);
          return;
        }
        
        if (!data?.session?.user) {
          console.log('No authenticated user');
          setError('Not authenticated. Please log in again.');
          return;
        }
        
        console.log('User authenticated:', data.session.user.id);
        setUserId(data.session.user.id);
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Add this function to test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Check if we can get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth test failed:', authError);
        setError('Authentication error: ' + authError.message);
        return false;
      }
      
      if (!authData.user) {
        console.log('No authenticated user');
        setError('Not authenticated. Please log in again.');
        return false;
      }
      
      // Try a simple query to test database access
      const { data: testData, error: testError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.error('Database test failed:', testError);
        setError('Database error: ' + testError.message);
        return false;
      }
      
      console.log('Supabase connection test passed');
      return true;
    } catch (error) {
      console.error('Error testing Supabase connection:', error);
      setError('Connection error: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  };

  const renderNewChatModal = () => {
    return (
      <Modal
        visible={showNewChatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={tw`flex-1 bg-white`}>
          <SafeAreaView style={tw`flex-1`}>
            <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
              <TouchableOpacity 
                style={tw`p-2`}
                onPress={() => {
                  setLoading(false);
                  setAnalyzing(null);
                  setShowNewChatModal(false);
                  navigation.navigate('PostLoginScreen');
                }}
              >
                <X size={24} color="#4A3B78" />
              </TouchableOpacity>
              <Text style={tw`text-xl font-bold text-jung-deep`}>
                New Conversation
              </Text>
              <View style={tw`w-10`} />
            </View>
            
            <ScrollView style={tw`flex-1 p-4`}>
              <Text style={tw`text-lg font-semibold mb-2`}>Choose an Avatar</Text>
              <AvatarSelector 
                selectedAvatar={selectedAvatar}
                onSelectAvatar={setSelectedAvatar}
              />
              
              <Text style={tw`text-lg font-semibold mt-6 mb-2`}>Conversation Title</Text>
              <TextInput
                style={tw`border border-gray-300 rounded-lg p-3 text-base`}
                value={newConversationTitle}
                onChangeText={setNewConversationTitle}
                placeholder="Enter a title for your conversation"
              />
              
              <TouchableOpacity
                style={tw`bg-jung-purple-light py-2 px-4 rounded-lg self-start mt-2`}
                onPress={() => {
                  const title = generateCreativeTitle();
                  setNewConversationTitle(title);
                }}
              >
                <Text style={tw`text-jung-purple`}>Generate Title</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`bg-jung-purple mt-8 py-3 rounded-lg`}
                onPress={handleCreateNewConversation}
              >
                <Text style={tw`text-white text-center font-semibold text-lg`}>
                  Start Conversation
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  const handleCreateNewConversation = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Authentication Error', 'Please log in again');
        return;
      }
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a conversation');
        return;
      }
      
      // Use a title or generate one
      const title = newConversationTitle || generateCreativeTitle();
      
      // Generate a UUID for the conversation
      const conversationId = generateUUID();
      
      console.log('Creating conversation with ID:', conversationId);
      console.log('User ID:', user.id);
      console.log('Title:', title);
      console.log('Avatar:', selectedAvatar);
      
      // Create the conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: user.id,
          title: title,
          avatar_id: selectedAvatar
        });
      
      if (error) {
        console.error('Error creating conversation:', error);
        Alert.alert('Error', 'Failed to create conversation: ' + error.message);
        return;
      }
      
      console.log('Conversation created successfully');
      setShowNewChatModal(false);
      
      // Navigate to the chat screen
      navigation.navigate('Chat', { conversationId });
    } catch (error) {
      console.error('Error in handleCreateNewConversation:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row items-center justify-between mb-6 p-4`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => {
              setLoading(false);
              setAnalyzing(null);
              setShowNewChatModal(false);
              navigation.navigate('PostLoginScreen');
            }}
          >
            <X size={24} color="#4A3B78" />
          </TouchableOpacity>
          
          <Text style={tw`text-2xl font-bold text-jung-deep`}>
            Conversations
          </Text>
          
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => setMenuVisible(true)}
          >
            <List size={24} color="#4A3B78" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>Loading conversations...</Text>
          </View>
        ) : error ? (
          <View style={tw`flex-1 justify-center items-center p-4`}>
            <Text style={tw`text-red-500 text-lg mb-4`}>Error</Text>
            <Text style={tw`text-center mb-6`}>{error}</Text>
            <TouchableOpacity
              style={tw`mb-4 bg-jung-purple py-3 px-6 rounded-lg`}
              onPress={async () => {
                setError(null);
                setLoading(true);
                const connectionOk = await testSupabaseConnection();
                if (connectionOk) {
                  fetchConversations();
                } else {
                  setLoading(false);
                }
              }}
            >
              <Text style={tw`text-white font-semibold`}>Test Connection & Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-gray-200 py-3 px-6 rounded-lg`}
              onPress={() => navigation.navigate('PostLoginScreen')}
            >
              <Text style={tw`text-gray-800 font-semibold`}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
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
                      disabled={analyzing === item.id}
                    >
                      {analyzing === item.id ? (
                        <ActivityIndicator size="small" color="#536878" />
                      ) : (
                        <Brain size={20} color="#536878" weight="light" />
                      )}
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
        {renderAnalysisModal()}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={tw`flex-1 bg-black bg-opacity-50`} 
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={tw`absolute top-0 right-0 bg-white w-48 rounded-bl-lg shadow-lg`}>
              <TouchableOpacity 
                style={tw`flex-row items-center p-4 border-b border-gray-200`}
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert(
                    "Logout",
                    "Are you sure you want to logout?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Logout", 
                        onPress: async () => {
                          try {
                            await supabase.auth.signOut();
                            navigation.navigate('LandingScreen');
                          } catch (error) {
                            console.error('Error signing out:', error);
                            Alert.alert('Error', 'Failed to sign out');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <SignOut size={20} color="#4A3B78" />
                <Text style={tw`ml-3 text-jung-purple`}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <House size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>
        {renderNewChatModal()}
        <TouchableOpacity
          style={tw`absolute bottom-20 right-6 bg-jung-purple w-14 h-14 rounded-full justify-center items-center shadow-lg`}
          onPress={handleNewConversation}
        >
          <Plus size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </GradientBackground>
  );
};