import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList, RootStackNavigationProp } from '../navigation/types';
import { SimpleAvatar } from '../components/SimpleAvatar';
import tw from '../lib/tailwind';
import { generateAIResponse } from '../lib/api';
import { availableAvatars } from '../components/AvatarSelector';
import { ArrowLeft, User, Brain, PaperPlaneRight, Shield } from 'phosphor-react-native'; // Import phosphor icons
import { GradientBackground } from '../components/GradientBackground';
import { getAvatarUrl } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../components/Message';
import { generatePromptForAvatar } from '../lib/avatarPrompts';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { encryptData, decryptData } from '../lib/encryptionUtils';
import { PrivacyConsentDialog } from '../components/PrivacyConsentDialog';
import { CreditDisplay } from '../components/CreditDisplay';
import { useCredits } from '../hooks/useCredits';
import { creditService } from '../lib/creditService';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  conversation_id?: string; // Making this optional to accommodate local messages
  content: string;
  role: 'user' | 'assistant';
  is_from_user?: boolean;
  created_at: string;
};

type Conversation = {
  id: string;
  title: string;
  avatar_id?: string;
  user_id: string;
  created_at: string;
};

export const ChatScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const { conversationId, avatarId = 'jung', isNewConversation } = route.params; // Added isNewConversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { hasCredits, spendCredits } = useCredits();
  // Removed analysis-related state
  // const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  // const [analysisContent, setAnalysisContent] = useState('');
  // const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use the avatarId in your chat interface
  const avatar = availableAvatars.find(a => a.id === avatarId) || availableAvatars[0];
  
  // Log the avatarId to verify it's being passed correctly
  useEffect(() => {
    console.log('Chat screen received avatarId:', avatarId);
  }, [avatarId]);

  
  // Fetch conversation details including the avatar_id and title
  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      console.error('fetchConversation called without a conversationId.');
      // Alert.alert('Error', 'Cannot load conversation details: Conversation ID is missing.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
        
      if (error) {
        throw error;
      }
      
      setConversation(data);
      console.log('Fetched conversation:', data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  }, [conversationId]);
  
  // Fetch messages for this conversation
  const fetchMessages = useCallback(async () => {
    // Add check: Ensure conversationId exists before proceeding
    if (!conversationId) {
      console.error('fetchMessages called without a conversationId.');
      Alert.alert('Error', 'Cannot load messages: Conversation ID is missing.');
      setLoading(false);
      // Optionally navigate back or show an error state
      // navigation.goBack(); 
      return; 
    }
    console.log(`fetchMessages: Called for conversationId: ${conversationId}`); // Diagnostic log
    
    try {
      setLoading(true);

      // Diagnostic: Check current auth state directly before fetching messages
      const { data: { user: currentUser }, error: authCheckError } = await supabase.auth.getUser();
      if (authCheckError || !currentUser) {
        console.error('fetchMessages: Auth check failed or no current user.', { authCheckError, userId: currentUser?.id });
        Alert.alert('Authentication Error', 'Cannot load messages. User not authenticated during fetch.');
        setLoading(false);
        return;
      }
      console.log(`fetchMessages: Authenticated user for RLS check: ${currentUser.id}`); // Diagnostic log
      
      // Fetch conversation details to get the title and avatar
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('title, avatar_id')
        .eq('id', conversationId)
        .single();
        
      if (convError) {
        console.error('Error fetching conversation:', convError);
      } else if (convData) {
        // Decrypt the conversation title if needed - using the improved decryptData that doesn't throw errors
        let decryptedTitle = convData.title;
        if (decryptedTitle) {
          // decryptData now handles all errors internally
          decryptedTitle = decryptData(decryptedTitle);
          
          // If decryption failed or title looks suspicious, use a fallback title
          if (decryptedTitle === '[Encrypted Content]' || 
              (decryptedTitle.length > 30 && /[^\w\s]/.test(decryptedTitle))) {
            const avatarName = availableAvatars.find((a) => a.id === convData.avatar_id)?.name || 'Jung';
            decryptedTitle = `Conversation with ${avatarName}`;
          }
        } else {
          // If title is null or undefined, use a fallback title
          const avatarName = availableAvatars.find((a) => a.id === convData.avatar_id)?.name || 'Jung';
          decryptedTitle = `Conversation with ${avatarName}`;
        }
        
        setConversationTitle(decryptedTitle);
        
        // If avatarId wasn't passed in route params, use the one from the database
        if (!route.params.avatarId && convData.avatar_id) {
          console.log('Using avatar_id from database:', convData.avatar_id);
          // Update the conversation state with the avatar_id from the database
          setConversation(prev => {
            if (prev) {
              // If conversation exists, just update the avatar_id
              return {
                ...prev,
                avatar_id: convData.avatar_id
              };
            } else {
              // If conversation doesn't exist yet, create a minimal valid conversation object
              return {
                id: conversationId,
                title: decryptedTitle,
                avatar_id: convData.avatar_id,
                user_id: '', // This will be populated later when we fetch the full conversation
                created_at: new Date().toISOString()
              };
            }
          });
        }
      }
      
      // Fetch messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Diagnostic: Log the result of fetching messages
      console.log(`fetchMessages: Result for conversationId ${conversationId}`, { dataLength: data?.length, error });
        
      if (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', `Failed to load messages: ${error.message}`);
        return;
      }
      
      if (data) {
        const formattedMessages = data.map(msg => {
          let messageContent = msg.content;
          
          // Always attempt to decrypt content from DB if it's not null or undefined
          if (messageContent) {
            // decryptData now handles all errors internally
            messageContent = decryptData(messageContent);
            
            // If decryption failed, use a placeholder
            if (messageContent === '[Encrypted Content]') {
              messageContent = "[Unable to decrypt message]";
            }
          }
          
          return {
            id: msg.id,
            content: messageContent,
            role: msg.is_from_user ? 'user' as const : 'assistant' as const,
            created_at: msg.created_at
          };
        });
        
        setMessages(formattedMessages);
        
        // If no messages AND it's a new conversation, send an initial greeting
        if (formattedMessages.length === 0 && isNewConversation) {
          sendInitialGreeting();
        }
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, route.params]);
  
  // useFocusEffect for fetching data and managing subscriptions
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Flag to prevent state updates if component is unmounted quickly

      if (conversationId) {
        console.log(`ChatScreen focused with conversationId: ${conversationId}`);
        fetchConversation().catch(err => console.error("Error in fetchConversation on focus:", err));
        fetchMessages().catch(err => console.error("Error in fetchMessages on focus:", err));
      } else {
        console.warn("ChatScreen focused without a conversationId.");
        // Potentially clear messages or show an error state if appropriate
        // setMessages([]); 
        // setLoading(false);
      }

      // Ensure conversationId is available before subscribing
      if (!conversationId) {
        return;
      }

      const channelName = `chat-messages-${conversationId}`;
      const channel = supabase.channel(channelName);

      const subscription = channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          if (!isActive) return;

          console.log('New message received via subscription:', payload);
          
          const newMsg = payload.new;
          // Ensure newMsg and its properties are defined
          if (!newMsg || !newMsg.id || !newMsg.content || !newMsg.created_at) {
            console.error('Received incomplete message payload:', payload);
            return;
          }

          let messageContent = newMsg.content;
          
          // Always attempt to decrypt content from DB if it's not null or undefined
          if (messageContent) {
            // decryptData now handles all errors internally
            messageContent = decryptData(messageContent);
            
            // If decryption failed, use a placeholder
            if (messageContent === '[Encrypted Content]') {
              messageContent = "[Unable to decrypt message]";
            }
          }
            
          const formattedMessage: Message = {
            id: newMsg.id,
            conversation_id: newMsg.conversation_id,
            content: messageContent,
            role: newMsg.is_from_user ? 'user' as const : 'assistant' as const,
            created_at: newMsg.created_at
          };
          
          // Check for duplicate messages before adding
          setMessages(prev => {
            if (prev.find(m => m.id === formattedMessage.id)) {
              return prev; // Message already exists, do not add duplicate
            }
            return [...prev, formattedMessage];
          });
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${channelName}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Subscription error on ${channelName}: ${status}`, err);
            // Optionally, try to resubscribe or notify user
          } else {
            console.log(`Subscription status on ${channelName}: ${status}`);
          }
        });
        
      return () => {
        isActive = false;
        console.log(`Cleaning up subscription for ${channelName}`);
        if (channel) {
          supabase.removeChannel(channel)
            .then(status => console.log(`Removed channel ${channelName} status:`, status))
            .catch(error => console.error(`Error removing channel ${channelName}:`, error));
        }
      };
    }, [conversationId, fetchMessages, fetchConversation]) // Dependencies for useFocusEffect's useCallback
  );

  // Automatically scroll to the new message when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      const lastIndex = messages.length - 1;
      // Add a small delay to ensure the list has rendered the new item
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: lastIndex,
          animated: true,
          viewPosition: 0, // Align the top of the item with the top of the viewport
        });
      }, 100); 
    }
  }, [messages]);
  
  // Send an initial greeting from the AI
  const sendInitialGreeting = async () => {
    try {
      setIsTyping(true);
      
      // Get the avatar's name for personalized greeting
      const currentAvatarId = conversation?.avatar_id || route.params.avatarId || 'jung';
      console.log(`Sending initial greeting for avatar ID: ${currentAvatarId}`);
      
      let greeting = '';
      
      // Normalize the avatar ID to handle case sensitivity and trim any whitespace
      const normalizedAvatarId = currentAvatarId.toLowerCase().trim();
      
      // Map to new creative keys if old keys are somehow still passed.
      // This provides a layer of backward compatibility for the greeting switch.
      // Ideally, currentAvatarId should already be the new creative key.
      const keyMap: Record<string, string> = {
        // New keys map to themselves
        'deepseer': 'deepseer', // Renamed
        'flourishingguide': 'flourishingguide',
        'oracle': 'oracle',
        'morpheus': 'morpheus'
      };
      const displayKey = keyMap[normalizedAvatarId] || normalizedAvatarId;

      switch (displayKey) {
        case 'deepseer': // Renamed
          greeting = "Greetings. I am Deepseer, an AI guide into the profound depths of your psyche. Together, we can explore the landscapes of the unconscious, interpret dreams, and understand the power of archetypes and early experiences. What is on your mind?"; // Renamed
          break;
        case 'flourishingguide':
          greeting = "Welcome! I am The Flourishing Guide, your AI companion for holistic well-being. I'm here to help you discover your potential, find meaning, build connections, and navigate life's journey with empathy. How can I support you today?";
          break;
        case 'oracle': // Stays Sage/Oracle
          greeting = "Welcome, I'm the Sage Guide AI assistant. I use a wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding. I can help you see connections and possibilities you might have missed. What guidance do you seek today?";
          break;
        case 'morpheus': // Stays Awakener/Morpheus
          greeting = "Welcome. I'm the Awakener AI assistant. My approach is to help you question assumptions, think critically about your beliefs, and discover new perspectives. What limitations or beliefs are you ready to examine?";
          break;
        default:
          console.warn(`Unknown avatar ID for greeting: '${currentAvatarId}' (normalized to '${normalizedAvatarId}', displayKey '${displayKey}'). Using default greeting.`);
          // Default to a generic greeting or Depth Delver's greeting if preferred
          greeting = "Hello, I'm an AI assistant here to support your journey of self-discovery and personal growth. How can I help you today?";
      }
      
      const aiMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        content: greeting,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      
      setMessages([aiMessage]);
      
      // Encrypt message before saving to database
      const encryptedContent = encryptData(greeting);
      
      // Save to database
      const initialMsgToInsert = {
        id: aiMessage.id,
        conversation_id: conversationId,
        content: encryptedContent,
        role: 'assistant', // Explicitly set role
        is_from_user: false,
        created_at: aiMessage.created_at
      };
      console.log('sendInitialGreeting: Attempting to insert initial message:', initialMsgToInsert);
      const { data: insertData, error: insertError } = await supabase
        .from('messages')
        .insert(initialMsgToInsert)
        .select(); // select() to get the inserted row back, or error
        
      if (insertError) {
        console.error('sendInitialGreeting: Error inserting initial message:', insertError, 'Data:', initialMsgToInsert);
        Alert.alert('Error', `Failed to save initial greeting: ${insertError.message}`);
      } else {
        console.log('sendInitialGreeting: Successfully inserted initial message:', insertData);
      }
        
    } catch (error) {
      console.error('Error sending initial greeting:', error);
      // Ensure Alert is shown for any other catch block error
      Alert.alert('Error', 'An unexpected error occurred while sending initial greeting.');
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Check if user has credits before sending message
    if (!hasCredits(1)) {
      Alert.alert(
        'No Credits Available',
        'You need credits to send messages. Would you like to purchase more credits or upgrade your plan?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    try {
      // Add user message to the chat
      const userMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        content: inputText,
        role: 'user',
        created_at: new Date().toISOString()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputText('');
      setIsTyping(true);
      
      // Encrypt user message before saving to database
      const encryptedContent = encryptData(userMessage.content);
      
      // Save user message to database
      const userMsgToInsert = {
        id: userMessage.id,
        conversation_id: conversationId,
        content: encryptedContent,
        role: 'user', // Explicitly set role
        is_from_user: true,
        created_at: userMessage.created_at
      };
      console.log('handleSendMessage: Attempting to insert user message:', userMsgToInsert);
      const { data: userInsertData, error: userInsertError } = await supabase
        .from('messages')
        .insert(userMsgToInsert)
        .select();
      
      if (userInsertError) {
        console.error('handleSendMessage: Error inserting user message:', userInsertError, 'Data:', userMsgToInsert);
        // Display a more specific error and stop further execution in this block
        Alert.alert('Error', `Failed to save your message: ${userInsertError.message}`);
        setIsTyping(false); // Reset typing indicator
        // Optionally, remove the optimistically added message from local state if save fails
        // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessage.id));
        return; // Stop if user message failed to save
      } else {
        console.log('handleSendMessage: Successfully inserted user message:', userInsertData);
      }
      
      // Format conversation history for AI
      const history = updatedMessages
        .slice(0, -1) // Exclude the message we just added
        .filter(msg => msg.content !== "[Unable to decrypt message]" && msg.content !== "[Encrypted Content]") // Filter out undecryptable messages
        .map(msg => {
          const role = msg.role === 'user' ? 'Human' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      
      // Generate the prompt based on the selected avatar
      // First check conversation.avatar_id (from database), then route.params.avatarId, then default avatarId
      const currentAvatarId = conversation?.avatar_id || route.params.avatarId || avatarId;
      const prompt = generatePromptForAvatar(
        currentAvatarId,
        history,
        inputText
      );
      
      console.log('Using prompt for avatar:', currentAvatarId);
      
      // Generate AI response with privacy protection
      const aiResponse = await generateAIResponse(
        inputText, // Use the raw user input instead of the formatted prompt
        updatedMessages.slice(0, -1), // Previous messages excluding the one we just added
        currentAvatarId,
        {
          userConsent: true, // For now, auto-consent. Later we'll add a consent dialog
          privacyLevel: 'BASIC',
          provider: 'claude' // Default to Claude 3.5 Sonnet for better therapy responses
        }
      );
      
      // Extract the response content from the tags if needed
      const responseContent = extractResponseContent(aiResponse);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        content: responseContent,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      
      setMessages([...updatedMessages, aiMessage]);
      
      // Encrypt AI message before saving to database
      const encryptedAIContent = encryptData(aiMessage.content);
      
      // Save AI message to database
      const aiMsgToInsert = {
        id: aiMessage.id,
        conversation_id: conversationId,
        content: encryptedAIContent,
        role: 'assistant', // Explicitly set role
        is_from_user: false,
        created_at: aiMessage.created_at
      };
      console.log('handleSendMessage: Attempting to insert AI message:', aiMsgToInsert);
      const { data: aiInsertData, error: aiInsertError } = await supabase
        .from('messages')
        .insert(aiMsgToInsert)
        .select();

      if (aiInsertError) {
        console.error('handleSendMessage: Error inserting AI message:', aiInsertError, 'Data:', aiMsgToInsert);
        Alert.alert('Error', `Failed to save AI response: ${aiInsertError.message}`);
        // Optionally, handle the UI for the AI message if its save fails
        // e.g., remove it or mark it as unsaved
      } else {
        console.log('handleSendMessage: Successfully inserted AI message:', aiInsertData);
        
        // Deduct credit after successful message exchange
        const creditSpent = await spendCredits(1, `Chat with ${availableAvatars.find(a => a.id === currentAvatarId)?.name || 'AI'}`);
        if (!creditSpent) {
          console.warn('Failed to deduct credit, but message was sent successfully');
        }
        
        // Record message cost for analytics
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await creditService.recordMessageCost(
              aiMessage.id,
              currentUser.id,
              conversationId,
              currentAvatarId,
              0, // input tokens (we don't track this yet)
              0, // output tokens (we don't track this yet)  
              1, // credits charged
              0, // api cost in cents (we don't track this yet)
              'claude',
              'claude-3-5-sonnet'
            );
          }
        } catch (analyticsError) {
          console.warn('Failed to record message cost for analytics:', analyticsError);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Ensure a generic alert for other types of errors in this try-catch
      Alert.alert('Error', 'An unexpected error occurred while sending your message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };
  
  // Helper function to extract response content from tags
  const extractResponseContent = (response: string): string => {
    const match = response.match(/<response>(.*?)<\/response>/s);
    return match ? match[1].trim() : response;
  };

  
  const renderMessage = ({ item }: { item: Message }) => {
    // Only use role to determine if it's a user message
    const isUser = item.role === 'user';
    
    return (
      <View style={tw`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
        {!isUser && (
          <SimpleAvatar 
            avatarId={conversation?.avatar_id || 'jung'} 
            size={40} 
            style={tw`mr-2 mt-1`}
          />
        )}
        
        <View 
          style={tw`
            ${isUser ? 'bg-indigo-100 border border-indigo-200' : 'bg-gray-100'} 
            rounded-2xl 
            p-3 
            max-w-[80%]
            shadow-sm
          `}
        >
          <View style={tw`flex-row items-center mb-1`}>
            {isUser ? (
              <User size={16} color="#4A3B78" weight="fill" />
            ) : (
              <Brain size={16} color="#4A3B78" weight="fill" />
            )}
            <Text 
              style={tw`text-xs ml-1 font-medium text-gray-700`}
            >
              {isUser ? 'You' : availableAvatars.find(a => a.id === (conversation?.avatar_id || 'jung'))?.name || 'Jung'}
            </Text>
          </View>
          
          <Text 
            style={tw`
              ${isUser ? 'text-indigo-900' : 'text-gray-800'} 
              text-base
            `}
          >
            {item.content}
          </Text>
        </View>
        
        {isUser && (
          <SimpleAvatar 
            isUser={true}
            avatarId="user"
            size={40} 
            style={tw`ml-2 mt-1`}
          />
        )}
      </View>
    );
  };
  
  // Improved AvatarComponent to properly display avatar images
  const AvatarComponent = ({ avatarId, isSpeaking }: { avatarId: string, isSpeaking: boolean }) => {
    const avatar = availableAvatars.find(a => a.id === avatarId) || availableAvatars[0];
    
    return (
      <View style={tw`items-center`}>
        <View style={tw`${isSpeaking ? 'border-2 border-jung-purple' : ''} rounded-full p-1`}>
          <SimpleAvatar 
            avatarId={avatarId} 
            size={80} 
            style={tw`shadow-md`}
          />
        </View>
        {isSpeaking && (
          <Text style={tw`mt-2 text-jung-purple animate-pulse`}>Thinking...</Text>
        )}
        <Text style={tw`mt-1 text-gray-700 font-medium`}>
          {avatar.name || avatarId}
        </Text>
      </View>
    );
  };
  
  // Function to handle conversation analysis (REMOVED)
  // const handleAnalyzeConversation = async () => { ... };
  
  // Function to handle sharing the analysis (REMOVED)
  // const handleShareAnalysis = async () => { ... };
  
  // Function to handle copying the analysis (REMOVED)
  // const handleCopyAnalysis = async () => { ... };
  
  // Function to save conversation to history (REMOVED)
  // const handleSaveToHistory = async () => { ... };
  
  // Modal for displaying analysis (REMOVED)
  // const renderAnalysisModal = () => ( ... );

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#4A3B78" />
          </TouchableOpacity>
          
          <Text style={tw`text-lg font-bold text-jung-deep text-center flex-1 mx-2`} numberOfLines={1} ellipsizeMode="tail">
            {conversationTitle || 'Conversation'}
          </Text>
          
          <View style={tw`flex-row items-center`}>
            {/* Credit Display in header */}
            <CreditDisplay variant="header" showUpgradeButton={true} />
            
            {/* Re-adding Analyze button to chat header */}
            <TouchableOpacity 
              style={tw`p-2 ml-2`}
              onPress={() => navigation.navigate('ConversationInsightsScreen-enhanced', { conversationId })}
              disabled={loading || isTyping}
            >
              <View style={tw`flex-row items-center`}>
                <Brain size={22} color="#4A3B78" />
                <Text style={tw`ml-1 text-sm text-jung-purple font-medium`}>Insights</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1`}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#4A3B78" />
              <Text style={tw`mt-4 text-jung-purple`}>Loading conversation...</Text>
            </View>
          ) : (
            <>
              <View style={tw`flex-1`}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={tw`p-4 pb-6`}
                  ListHeaderComponent={
                    <View style={tw`items-center mb-6`}>
                      <AvatarComponent 
                        avatarId={conversation?.avatar_id || route.params.avatarId || avatarId} 
                        isSpeaking={isTyping}
                      />
                    </View>
                  }
                  renderItem={renderMessage}
                  onScrollToIndexFailed={info => {
                    console.warn('scrollToIndex failed:', info);
                    // Fallback to scrolling to the end if index scroll fails
                    const wait = new Promise(resolve => setTimeout(resolve, 50));
                    wait.then(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    });
                  }}
                />
              </View>
              
              {/* Insights Button Above Input REMOVED */}

              <View style={tw`p-4 border-t border-gray-200 bg-white`}>
                <View style={tw`flex-row items-center`}>
                  <TextInput
                    ref={inputRef}
                    style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2`}
                    placeholder="Type a message..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={tw`bg-jung-purple w-10 h-10 rounded-full items-center justify-center`}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                  >
                    {isTyping ? <ActivityIndicator size="small" color="white" /> : null}
                    {!isTyping ? <PaperPlaneRight size={20} color="white" weight="fill" /> : null}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
        {/* {renderAnalysisModal()}  Removed call to deleted function */}
      </SafeAreaView>
    </GradientBackground>
  );
};
