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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RootStackParamList, RootStackNavigationProp } from '../navigation/types';
import { SimpleAvatar } from '../components/SimpleAvatar';
import tw from '../lib/tailwind';
import { generateAIResponse } from '../lib/api';
import { availableAvatars } from '../components/AvatarSelector';
import { ArrowLeft, PaperPlaneTilt, User, Lightbulb, Sparkle, Brain, FlowerLotus, Leaf, PaperPlaneRight } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { getAvatarUrl } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../components/Message';
import { generatePromptForAvatar } from '../lib/avatarPrompts';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { encryptData, decryptData } from '../lib/encryptionUtils';

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
  const { conversationId, avatarId = 'jung' } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Use the avatarId in your chat interface
  const avatar = availableAvatars.find(a => a.id === avatarId) || availableAvatars[0];
  
  // Log the avatarId to verify it's being passed correctly
  useEffect(() => {
    console.log('Chat screen received avatarId:', avatarId);
  }, [avatarId]);
  
  // Fetch conversation details including the avatar_id and title
  const fetchConversation = async () => {
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
  };
  
  // Fetch messages for this conversation
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch conversation details to get the title and avatar
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('title, avatar_id')
        .eq('id', conversationId)
        .single();
        
      if (convError) {
        console.error('Error fetching conversation:', convError);
      } else if (convData) {
        // Decrypt the conversation title if needed
        let decryptedTitle = convData.title;
        try {
          // Check if the title is encrypted (has a pattern like "U2FsdGVkX1...")
          if (decryptedTitle && decryptedTitle.startsWith('U2FsdGVkX1')) {
            decryptedTitle = decryptData(decryptedTitle);
          } else if (decryptedTitle && decryptedTitle.length > 30 && /[^\w\s]/.test(decryptedTitle)) {
            // If title looks like it might be encrypted but doesn't have the expected prefix
            // or is a random string (long with special characters), use a fallback title
            const avatarName = availableAvatars.find((a) => a.id === convData.avatar_id)?.name || 'Jung';
            decryptedTitle = `Conversation with ${avatarName}`;
          }
        } catch (decryptError) {
          console.error('Error decrypting conversation title:', decryptError);
          // Use a fallback title if decryption fails
          const avatarName = availableAvatars.find((a) => a.id === convData.avatar_id)?.name || 'Jung';
          decryptedTitle = `Conversation with ${avatarName}`;
        }
        
        setConversationTitle(decryptedTitle);
        
        // If avatarId wasn't passed in route params, use the one from the database
        if (!route.params.avatarId && convData.avatar_id) {
          console.log('Using avatar_id from database:', convData.avatar_id);
        }
      }
      
      // Fetch messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      if (data) {
        const formattedMessages = data.map(msg => {
          let messageContent = msg.content;
          
          // Decrypt message content if it appears to be encrypted
          if (messageContent && messageContent.startsWith('U2FsdGVkX1')) {
            try {
              messageContent = decryptData(messageContent);
            } catch (decryptError) {
              console.error('Error decrypting message:', decryptError);
              // If decryption fails, use the original content
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
        
        // If no messages, send an initial greeting
        if (formattedMessages.length === 0) {
          sendInitialGreeting();
        }
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, route.params]);
  
  useEffect(() => {
    fetchConversation();
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('New message received:', payload);
        
        // Need to handle the incoming message by properly mapping it to our Message type
        const newMsg = payload.new;
        const messageContent = newMsg.content;
        
        // Try to decrypt the message if it appears to be encrypted
        const decryptedContent = messageContent && messageContent.startsWith('U2FsdGVkX1') 
          ? decryptData(messageContent) 
          : messageContent;
          
        const formattedMessage: Message = {
          id: newMsg.id,
          conversation_id: newMsg.conversation_id,
          content: decryptedContent,
          role: newMsg.is_from_user ? 'user' as const : 'assistant' as const,
          created_at: newMsg.created_at
        };
        
        setMessages(prev => [...prev, formattedMessage]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, fetchMessages]);

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
      
      switch (normalizedAvatarId) {
        case 'jung':
          greeting = "Hello, I'm an AI assistant with knowledge of Carl Jung's analytical psychology. I can help you explore your psyche through the lens of Jung's theories on dreams, archetypes, and the collective unconscious. What's on your mind today?";
          break;
        case 'freud':
          greeting = "Good day, I'm an AI assistant with expertise in Sigmund Freud's psychoanalytic theories. I can help you explore concepts like the unconscious mind, defense mechanisms, and childhood experiences. What would you like to discuss?";
          break;
        case 'adler':
          greeting = "Hello, I'm an AI assistant specializing in Alfred Adler's individual psychology. I can help you understand your social context, feelings of inferiority, and life goals through an Adlerian perspective. What brings you here today?";
          break;
        case 'rogers':
          greeting = "Hello there, I'm an AI assistant informed by Carl Rogers' person-centered approach. I aim to provide a space of empathy and unconditional positive regard as you explore your feelings. What would you like to talk about?";
          break;
        case 'frankl':
          greeting = "Greetings, I'm an AI assistant with knowledge of Viktor Frankl's logotherapy. I can help you explore meaning in your life and ways to transform suffering into purpose. What matters to you most right now?";
          break;
        case 'maslow':
          greeting = "Hello, I'm an AI assistant versed in Abraham Maslow's humanistic psychology. I can help you explore self-actualization and your hierarchy of needs. What aspects of your potential would you like to discuss?";
          break;
        case 'horney':
          greeting = "Hello, I'm an AI assistant with expertise in Karen Horney's neo-Freudian psychology. I can help you understand how cultural and social influences shape your experiences and self-concept. What would you like to discuss?";
          break;
        case 'oracle':
          greeting = "Welcome, I'm the Sage Guide AI assistant. I use a wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding. I can help you see connections and possibilities you might have missed. What guidance do you seek today?";
          break;
        case 'morpheus':
          greeting = "Welcome. I'm the Awakener AI assistant. My approach is to help you question assumptions, think critically about your beliefs, and discover new perspectives. What limitations or beliefs are you ready to examine?";
          break;
        default:
          console.warn(`Unknown avatar ID: ${currentAvatarId}, using default greeting`);
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
      await supabase
        .from('messages')
        .insert({
          id: aiMessage.id,
          conversation_id: conversationId,
          content: encryptedContent,
          is_from_user: false,
          created_at: aiMessage.created_at
        });
        
    } catch (error) {
      console.error('Error sending initial greeting:', error);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
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
      await supabase
        .from('messages')
        .insert({
          id: userMessage.id,
          conversation_id: conversationId,
          content: encryptedContent,
          is_from_user: true,
          created_at: userMessage.created_at
        });
      
      // Format conversation history for AI
      const history = updatedMessages
        .slice(0, -1) // Exclude the message we just added
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      
      // Generate the prompt based on the selected avatar
      const currentAvatarId = route.params.avatarId || avatarId;
      const prompt = generatePromptForAvatar(
        currentAvatarId,
        history,
        inputText
      );
      
      console.log('Using prompt for avatar:', currentAvatarId);
      
      // Generate AI response
      const aiResponse = await generateAIResponse(prompt);
      
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
      await supabase
        .from('messages')
        .insert({
          id: aiMessage.id,
          conversation_id: conversationId,
          content: encryptedAIContent,
          is_from_user: false,
          created_at: aiMessage.created_at
        });
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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
          
          <Text style={tw`text-xl font-bold text-jung-deep`}>
            {conversationTitle || 'Conversation'}
          </Text>
          
          <View style={tw`w-10`} />
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
                        avatarId={route.params.avatarId || avatarId} 
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
                    style={tw`bg-jung-purple w-12 h-12 rounded-full items-center justify-center`}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                  >
                    {isTyping ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <PaperPlaneRight size={24} color="white" weight="fill" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};
