import React, { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, PaperPlaneTilt, User, Lightbulb, Sparkle, Brain, FlowerLotus, Leaf } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { getAvatarUrl } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  conversation_id: string;
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
  const route = useRoute<ChatScreenRouteProp>();
  const { conversationId, avatarId, title } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Use the avatarId in your chat interface
  const avatar = availableAvatars.find(a => a.id === avatarId) || availableAvatars[0];
  
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
  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // First, fetch the conversation to get its details
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
        
      if (conversationError) {
        console.error('Error fetching conversation:', conversationError);
        return;
      }
      
      if (conversationData) {
        setConversation(conversationData);
      }
      
      // Then fetch all messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }
      
      console.log(`Fetched ${messagesData?.length || 0} messages for conversation ${conversationId}`);
      
      if (messagesData && messagesData.length > 0) {
        setMessages(messagesData);
      } else {
        // If no messages, set an empty array
        setMessages([]);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);
  
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    
    const currentInput = inputText.trim();
    setInputText('');
    setSending(true);
    
    try {
      // Create a new message object for the user's message
      const userMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        content: currentInput,
        role: 'user',
        created_at: new Date().toISOString()
      };
      
      // Add the message to the UI immediately
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      console.log('Added user message to state:', userMessage);
      
      // Save the message to the database WITHOUT is_from_user
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: currentInput,
            role: 'user',
            created_at: userMessage.created_at
          });
        
        if (error) {
          console.error('Error saving message:', error);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }
      
      // Generate AI response
      try {
        const aiResponse = await generateAIResponse(
          currentInput,
          messages,
          conversation?.avatar_id || 'jung'
        );
        
        // Create a new message object for the AI's response
        const aiMessage: Partial<Message> = {
          id: uuidv4(),
          conversation_id: conversationId,
          content: aiResponse,
          role: 'assistant',
          created_at: new Date().toISOString()
        };
        
        // Add the AI message to the UI
        setMessages(prevMessages => [...prevMessages, aiMessage as Message]);
        
        // Save the AI message to the database
        try {
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              content: aiMessage.content,
              role: 'assistant',
              created_at: aiMessage.created_at
            });
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        Alert.alert('Error', 'Failed to generate a response. Please try again.');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
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
  
  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        {/* Avatar header with back button */}
        <View style={tw`items-center justify-center py-4 bg-white border-b border-gray-200 relative`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`absolute left-4 top-4 z-10`}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <SimpleAvatar 
            avatarId={avatar.id} 
            size={80} 
          />
          <Text style={tw`mt-2 text-lg font-medium`}>
            {avatar.name}
          </Text>
          <Text style={tw`text-sm text-gray-500`}>
            {conversation?.title || 'New Conversation'}
          </Text>
        </View>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1`}
          keyboardVerticalOffset={90}
        >
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#6b46c1" />
              <Text style={tw`mt-4 text-gray-600`}>Loading conversation...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={tw`p-4 pb-4`}
              onLayout={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              ListEmptyComponent={
                <View style={tw`flex-1 justify-center items-center p-8`}>
                  <Text style={tw`text-lg text-gray-500 text-center`}>
                    Start a conversation with {avatar.name}
                  </Text>
                </View>
              }
            />
          )}
          
          <View style={tw`p-2 border-t border-gray-200 bg-white flex-row items-center`}>
            <TextInput
              ref={inputRef}
              style={tw`flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-2 min-h-[44px]`}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="center"
              editable={!sending}
            />
            
            <TouchableOpacity
              style={tw`bg-jung-purple rounded-full h-[44px] w-[44px] items-center justify-center ${sending || !inputText.trim() ? 'opacity-50' : ''}`}
              onPress={sendMessage}
              disabled={sending || !inputText.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View style={tw`items-center justify-center`}>
                  <FlowerLotus size={36} color="#D4AF37" weight="fill" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};