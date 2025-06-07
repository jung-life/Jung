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
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateAIResponse } from '../lib/api';
import * as Clipboard from 'expo-clipboard';
import { AvatarSelector, availableAvatars } from '../components/AvatarSelector';
import { SimpleAvatar } from '../components/SimpleAvatar';
import { Avatar } from '../components/AvatarSelector';
import { generateUUID } from '../lib/uuid-polyfill';
import i18n from '../lib/i18n';
import { trackEvent } from '../lib/analytics';
import useAuthStore from '../store/useAuthStore';
import { encryptData, decryptData } from '../lib/encryptionUtils';

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

  const { user } = useAuthStore();

  const fetchConversations = useCallback(async () => {
    try {
      console.log('Fetching conversations...');
      setLoading(true);
      
      // Check if Supabase is initialized
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
       }
       
       console.log('[fetchConversations] Attempting supabase.auth.getUser()...');
       // Get current user with error handling
       let userData, userError;
       try {
         const result = await supabase.auth.getUser();
         userData = result.data;
         userError = result.error;
         console.log('[fetchConversations] supabase.auth.getUser() completed.');
       } catch (getUserCatchError) {
          console.error('[fetchConversations] Error caught during supabase.auth.getUser():', getUserCatchError);
          setError('Failed to get user session. Please try logging out and back in.');
          setLoading(false);
          return;
       }
       
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
       
       console.log('Attempting to fetch conversations from DB...');
       // Fetch conversations
       const { data, error } = await supabase
         .from('conversations')
         .select('*')
         .eq('user_id', userData.user.id)
         .order('created_at', { ascending: false });
       console.log('Fetch conversations query completed.');
       
       if (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations. Please try again later.');
        setLoading(false);
         return;
       }
       
        console.log(`Found ${data?.length || 0} conversations. Skipping decryption for testing.`);
        // Temporarily skip decryption to isolate the issue
        const conversationsWithoutDecryption = data || [];
       
       // Always set conversations, even if empty
       console.log('Fetched conversations (without decryption):', conversationsWithoutDecryption.length || 0);
       setConversations(conversationsWithoutDecryption);
       
     } catch (error) {
       console.error('Error in fetchConversations:', error);
       setError('Failed to load conversations. Please try again later.');
       setLoading(false); // Ensure loading stops on error
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
      
      // Encrypt the analysis content before saving
      const encryptedAnalysisContent = encryptData(analysisContent);
      
      // Save encrypted analysis to database
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          conversation_id: conversationId,
          content: encryptedAnalysisContent,
        })
        .select()
        .single();
        
      if (analysisError) {
        console.error('Error saving analysis:', analysisError);
        Alert.alert('Error', 'Failed to save analysis');
        setAnalyzing(null);
        return;
      }
      
      // Decrypt for display and cache
      const decryptedAnalysis = {
        ...analysisData,
        content: analysisContent // Use the original content for display
      };
      
      // Update cache with decrypted content
      setAnalysesCache(prev => ({
        ...prev,
        [conversationId]: [decryptedAnalysis, ...(prev[conversationId] || [])]
      }));
      
      // Show analysis with decrypted content
      setCurrentAnalysis(decryptedAnalysis);
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
    
    // Ensure the content is decrypted before displaying
    let displayContent = currentAnalysis.content;
    try {
      // Check if the content might be encrypted (has a pattern like "U2FsdGVkX1...")
      if (displayContent && typeof displayContent === 'string' && displayContent.startsWith('U2FsdGVkX1')) {
        displayContent = decryptData(displayContent);
      }
    } catch (error) {
      console.error('Error decrypting analysis content:', error);
      // Use the original content if decryption fails
    }
    
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
                onPress={() => setShowAnalysisModal(false)}
              >
                <SafePhosphorIcon iconType="X" size={24} color="#4A3B78" />
              </TouchableOpacity>
              <Text style={tw`text-xl font-bold text-jung-deep`}>
                Analysis: {currentConversationTitle}
              </Text>
              <View style={tw`w-10`} />
            </View>
            
            <ScrollView style={tw`flex-1 p-4`}>
              <Text style={tw`text-base leading-6 text-gray-800`}>
                {displayContent}
              </Text>
            </ScrollView>

            <View style={tw`p-4 border-t border-gray-200`}>
              <TouchableOpacity
                style={tw`bg-jung-purple py-3 rounded-lg`}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Text style={tw`text-white text-center font-semibold`}>Close</Text>
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

  // Update the generateCreativeTitle function to be avatar-specific and use LLM
  const generateCreativeTitle = async () => {
    try {
      setLoading(true);
      
      // Get the selected avatar's name
      const avatarName = availableAvatars.find((a: Avatar) => a.id === selectedAvatar)?.name || 'Jung';
      
      // Create a prompt for the LLM to generate a creative title
      const prompt = `Generate a creative, engaging title for a conversation with ${avatarName}, a psychological guide. 
The title should reflect ${avatarName}'s unique psychological approach and personality.

For context:
- Carl Jung focuses on archetypes, the collective unconscious, and individuation
- Sigmund Freud focuses on psychoanalysis, the unconscious mind, and dream interpretation
- Alfred Adler focuses on social interest, inferiority feelings, and striving for superiority
- Karen Horney focuses on cultural influences, neurotic needs, and self-realization
- Carl Rogers focuses on person-centered therapy, unconditional positive regard, and authenticity
- Viktor Frankl focuses on finding meaning in life, even in suffering
- Abraham Maslow focuses on self-actualization and the hierarchy of needs
- The Oracle focuses on mystical guidance and seeing deeper patterns
- Morpheus focuses on questioning reality and breaking free from limiting beliefs

Generate a single, concise title (3-6 words) that would appeal to someone seeking psychological insight from ${avatarName}.
The title should be creative but not overly abstract, and should hint at the transformative nature of the conversation.
Return only the title text with no additional explanation or formatting.`;

      // Call the AI API to generate a title
      const aiResponse = await generateAIResponse(prompt);
      
      // Clean up the response (remove quotes, extra spaces, etc.)
      const cleanTitle = aiResponse.replace(/^["']|["']$/g, '').trim();
      
      // Fallback titles in case the AI fails
      const fallbackTitles = {
        'jung': [
          'Exploring the Shadow',
          'Archetypes & Individuation',
          'Journey to the Self',
          'Collective Unconscious Dialogue',
          'Jungian Reflection'
        ],
        'freud': [
          'Dream Analysis Session',
          'Exploring the Unconscious',
          'Id, Ego & Superego',
          'Psychoanalytic Dialogue',
          'Freudian Introspection'
        ],
        'adler': [
          'Finding Purpose',
          'Social Interest Reflection',
          'Overcoming Inferiority',
          'Adlerian Life Goals',
          'Striving for Superiority'
        ],
        'rogers': [
          'Authentic Self Dialogue',
          'Unconditional Acceptance',
          'Person-Centered Journey',
          'Empathic Understanding',
          'Genuine Connection'
        ],
        'frankl': [
          'Finding Life\'s Meaning',
          'Transcending Suffering',
          'Logotherapy Session',
          'Purpose in Adversity',
          'Existential Freedom'
        ],
        'maslow': [
          'Path to Self-Actualization',
          'Hierarchy of Needs',
          'Peak Experience Journey',
          'Human Potential Dialogue',
          'Growth Motivation'
        ],
        'horney': [
          'Neurotic Needs Exploration',
          'Self-Realization Path',
          'Moving Toward Growth',
          'Cultural Influences Dialogue',
          'Real Self Discovery'
        ],
        'oracle': [
          'Prophecy & Potential',
          'Fate vs. Choice',
          'Oracle\'s Wisdom',
          'Seeing Beyond Time',
          'Crossroads Guidance'
        ],
        'morpheus': [
          'Red Pill Conversation',
          'Reality Deconstruction',
          'Awakening Dialogue',
          'Beyond the Matrix',
          'Truth Seeker\'s Journey'
        ]
      };
      
      // If AI response is empty or too long, use a fallback
      if (!cleanTitle || cleanTitle.length > 50) {
        const titles = fallbackTitles[selectedAvatar as keyof typeof fallbackTitles] || [
          `Reflection with ${avatarName}`,
          `${avatarName}'s Guidance`,
          `Journey with ${avatarName}`,
          `Self-Discovery Session`,
          `Inner Dialogue`
        ];
        
        return titles[Math.floor(Math.random() * titles.length)];
      }
      
      return cleanTitle;
    } catch (error) {
      console.error('Error generating title:', error);
      
      // Fallback to a simple title if AI fails
      const avatarName = availableAvatars.find((a: Avatar) => a.id === selectedAvatar)?.name || 'Jung';
      return `Conversation with ${avatarName}`;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('ConversationsScreen mounted');
    console.log('Route params:', route.params);
    console.log('Loading state:', loading);
   console.log('Conversations:', conversations);
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

  // Render new chat modal without voice functionality
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
                onPress={() => setShowNewChatModal(false)}
              >
                <SafePhosphorIcon iconType="X" size={24} color="#4A3B78" />
              </TouchableOpacity>
              <Text style={tw`text-xl font-bold text-jung-deep`}>
                New Conversation
              </Text>
              <View style={tw`w-10`} />
            </View>
            
            <ScrollView style={tw`flex-1 p-4`}>
              <Text style={tw`text-lg font-semibold mb-4`}>Choose your guide:</Text>
              
              <AvatarSelector 
                selectedAvatar={selectedAvatar}
                onSelectAvatar={setSelectedAvatar}
                hasPremiumAccess={true}
              />
              
              <Text style={tw`text-lg font-semibold mt-6 mb-4`}>Conversation title:</Text>
              
              <TextInput
                style={tw`border border-gray-300 rounded-lg p-3 mb-2`}
                placeholder="Enter a title (optional)"
                value={newConversationTitle}
                onChangeText={setNewConversationTitle}
              />
              
              <TouchableOpacity
                style={tw`bg-jung-purple-light py-2 px-4 rounded-lg self-start mb-4`}
                onPress={async () => {
                  const generatingTitle = await generateCreativeTitle();
                  setNewConversationTitle(generatingTitle);
                }}
              >
                <Text style={tw`text-jung-purple`}>Generate Title</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`bg-jung-purple py-3 rounded-lg mt-2`}
                onPress={handleCreateNewConversation}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={tw`text-white text-center font-semibold`}>Start Conversation</Text>
                )}
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
      const title = newConversationTitle || await generateCreativeTitle();
      
      // Encrypt the conversation title
      const encryptedTitle = encryptData(title);
      
      // Generate a UUID for the conversation
      const conversationId = generateUUID();
      
      console.log('Creating conversation with ID:', conversationId);
      console.log('User ID:', user.id);
      console.log('Title:', title, '(encrypted)');
      console.log('Avatar:', selectedAvatar);
      
      // Create the conversation with the selected avatar and encrypted title
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: user.id,
          title: encryptedTitle,
          avatar_id: selectedAvatar,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating conversation:', error);
        Alert.alert('Error', 'Failed to create conversation: ' + error.message);
        return;
      }
      
      setShowNewChatModal(false);
      
      // Navigate to the chat screen with the avatar ID
      navigation.navigate('Chat', { 
        conversationId,
        avatarId: selectedAvatar
      });

      trackEvent('Conversation Started', { avatarId: selectedAvatar });
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
        
        <View style={tw`flex-row justify-between items-center p-4`}>
          <Text style={tw`text-xl font-bold`}>Conversations</Text>
          <TouchableOpacity
            style={tw`bg-jung-purple-light px-3 py-1 rounded-lg`}
            onPress={() => navigation.navigate('ConversationHistoryScreen')}
          >
            <Text style={tw`text-jung-purple font-medium`}>History</Text>
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
                        <SafePhosphorIcon iconType="Brain" size={20} color="#536878" weight="light" />
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
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <SafePhosphorIcon iconType="House" size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>
        {renderNewChatModal()}
        <TouchableOpacity
          style={tw`absolute bottom-20 right-6 bg-jung-purple w-14 h-14 rounded-full justify-center items-center shadow-lg`}
          onPress={handleNewConversation}
        >
          <SafePhosphorIcon iconType="Plus" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </GradientBackground>
  );
};
