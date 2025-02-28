import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackNavigationProp } from '../navigation/types';
import { generateAIResponse } from '../lib/api';
import { TherapistAvatar } from '../components/TherapistAvatar';
import tw from '../lib/tailwind';
import HomeButton from "../components/HomeButton";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ArrowLeft, PaperPlaneRight, PencilSimple } from 'phosphor-react-native';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

export const ChatScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(id !== 'new' ? id : '');
  const [conversationTitle, setConversationTitle] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      // Automatically create a new conversation with default name
      const createNewConversation = async () => {
        const defaultTitle = `Reflection - ${new Date().toLocaleDateString()}`;
        const newId = await createConversation(defaultTitle);
        if (newId) {
          // Update the conversation ID and title
          setConversationId(newId);
          setConversationTitle(defaultTitle);
        }
      };
      
      createNewConversation();
    } else if (id !== 'new') {
      fetchMessages();
      fetchConversationTitle();
    }
  }, [id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationTitle = async () => {
    if (!id || id === 'new') return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) setConversationTitle(data.title);
    } catch (error) {
      console.error('Error fetching conversation title:', error);
    }
  };

  const getNextReflectionNumber = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return 1;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('title')
        .eq('user_id', user.id)
        .ilike('title', 'Reflection #%')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (!data || data.length === 0) return 1;
      
      // Try to extract the highest number from existing titles
      let highestNumber = 0;
      data.forEach(conv => {
        const match = conv.title.match(/Reflection #(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > highestNumber) highestNumber = num;
        }
      });
      
      return highestNumber + 1;
    } catch (error) {
      console.error('Error getting next reflection number:', error);
      return 1;
    }
  };

  const createConversation = async (customTitle?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      // Generate a default title if none provided
      let title = customTitle;
      if (!title) {
        const nextNumber = await getNextReflectionNumber();
        const date = new Date().toLocaleDateString();
        title = `Reflection #${nextNumber} - ${date}`;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          { 
            user_id: user.id,
            title: title,
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      setConversationId(data.id);
      setConversationTitle(data.title);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const updateConversationTitle = async (title: string) => {
    if (!conversationId) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
        
      if (error) throw error;
      
      // Update the UI immediately
      setConversationTitle(title);
      console.log('Conversation title updated to:', title);
    } catch (error) {
      console.error('Error updating conversation title:', error);
      Alert.alert('Error', 'Failed to update conversation title');
    }
  };

  const handleRenameConversation = () => {
    if (!conversationId) return;
    
    Alert.prompt(
      "Rename Reflection",
      "Enter a new name for this reflection:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save",
          onPress: async (newTitle) => {
            if (!newTitle || !newTitle.trim()) return;
            
            try {
              console.log('Updating conversation title in Supabase:', {
                id: conversationId,
                title: newTitle.trim()
              });
              
              // Update the conversation title in the database
              const { data, error } = await supabase
                .from('conversations')
                .update({ 
                  title: newTitle.trim(),
                  updated_at: new Date().toISOString() 
                })
                .eq('id', conversationId)
                .select();
                
              if (error) {
                console.error('Supabase update error:', error);
                throw error;
              }
              
              console.log('Supabase update response:', data);
              
              // Update the local state
              setConversationTitle(newTitle.trim());
              
              // Force a refresh when navigating back
              setNeedsRefresh(true);
            } catch (error) {
              console.error('Error renaming conversation:', error);
              Alert.alert("Error", "Failed to rename reflection. Please try again.");
            }
          }
        }
      ],
      "plain-text",
      conversationTitle
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to UI immediately
    const tempUserMsg = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user' as const,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    
    try {
      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        // For first message, prompt for conversation name
        if (messages.length === 0) {
          setShowNameModal(true);
          setNewTitle(`Reflection - ${new Date().toLocaleDateString()}`);
        }
        
        currentConversationId = await createConversation();
        if (!currentConversationId) throw new Error('Failed to create conversation');
      }
      
      // Save user message to database
      const { error: msgError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: currentConversationId,
            content: userMessage,
            role: 'user',
          }
        ]);
        
      if (msgError) throw msgError;
      
      // Show loading state for AI response
      setLoading(true);
      
      // Get AI response from our API
      const aiResponse = await generateAIResponse(
        userMessage, 
        messages
      );
      
      // Save AI response to database
      const { error: aiError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: currentConversationId,
            content: aiResponse,
            role: 'assistant',
          }
        ]);
        
      if (aiError) throw aiError;
      
      // Add AI response to UI
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          content: aiResponse,
          role: 'assistant',
          created_at: new Date().toISOString(),
        }
      ]);
      
      setIsSpeaking(true);
      setCurrentAIMessage(aiResponse);
      
      // Add a ripple effect from the user's message to the AI
      const rippleAnimation = new Animated.Value(0);
      Animated.timing(rippleAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error', 
        'Failed to get a response. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSpeaking) {
      const timer = setTimeout(() => {
        setIsSpeaking(false);
      }, 5000); // Adjust time based on message length
      return () => clearTimeout(timer);
    }
  }, [isSpeaking]);

  const handleBackToReflections = () => {
    navigation.navigate('Conversations', { refresh: needsRefresh ? Date.now() : undefined });
  };

  const generateSummary = async () => {
    if (messages.length < 2) {
      Alert.alert('Not enough content', 'Have a conversation first before generating a summary.');
      return;
    }
    
    try {
      setSummarizing(true);
      
      // Prepare the conversation for the AI
      const conversationText = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      
      // Create a prompt for the AI
      const prompt = `Please provide a concise summary of the following conversation, highlighting key insights, patterns, and potential areas for self-reflection:\n\n${conversationText}`;
      
      // Get the summary from the AI
      const summaryResponse = await generateAIResponse(prompt, []);
      
      // Save the summary to the database
      if (conversationId) {
        const { error } = await supabase
          .from('conversations')
          .update({ 
            summary: summaryResponse,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
          
        if (error) throw error;
      }
      
      // Update the UI
      setSummary(summaryResponse);
      setShowSummaryModal(true);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const exportSummary = async () => {
    try {
      // First check if the modules are available
      if (!Sharing || !FileSystem) {
        Alert.alert(
          'Error', 
          'Sharing functionality is not available. Please make sure expo-sharing and expo-file-system are installed.'
        );
        return;
      }
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Create a file with the summary content
      const fileDate = new Date().toISOString().split('T')[0];
      const fileName = `${FileSystem.documentDirectory}summary-${fileDate}.txt`;
      
      // Format the content with title and date
      const content = `# ${conversationTitle}\n\nDate: ${new Date().toLocaleDateString()}\n\n${summary}`;
      
      // Write the file
      await FileSystem.writeAsStringAsync(fileName, content);
      
      // Share the file
      await Sharing.shareAsync(fileName, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Summary',
        UTI: 'public.plain-text'
      });
      
    } catch (error) {
      console.error('Error exporting summary:', error);
      Alert.alert('Error', 'Failed to export summary. Please make sure the required packages are installed.');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-jung-bg`}>
      <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-gray-200`}>
        <TouchableOpacity 
          style={tw`p-2 rounded-full`}
          onPress={handleBackToReflections}
        >
          <ArrowLeft size={24} color="#4A3B78" weight="light" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={tw`flex-1 flex-row items-center justify-center`}
          onPress={handleRenameConversation}
        >
          <Text style={tw`text-lg font-bold text-gray-900 mr-2`} numberOfLines={1}>
            {conversationTitle || 'New Reflection'}
          </Text>
          <View style={tw`bg-gray-100/50 p-1.5 rounded-full`}>
            <PencilSimple size={18} color="#4A3B78" weight="light" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={tw`p-2 rounded-full`}
          onPress={generateSummary}
          disabled={summarizing || messages.length < 2}
        >
          {summarizing ? (
            <ActivityIndicator size="small" color="#4A3B78" />
          ) : (
            <AntDesign name="filetext1" size={24} color="#4A3B78" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <TherapistAvatar 
          isSpeaking={isSpeaking} 
          message={currentAIMessage}
          onBackPress={handleBackToReflections}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[
            tw`px-4 py-3 mb-4 max-w-[85%]`,
            item.role === 'user' 
              ? tw`bg-jung-animus/90 self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm shadow-sm` 
              : tw`bg-jung-anima-light self-start rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm border border-jung-anima/20`
          ]}>
            <Text style={[
              tw`text-base leading-6`,
              item.role === 'user' ? tw`text-white` : tw`text-jung-text`
            ]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Begin Your Inner Journey
            </Text>
            <Text style={styles.emptyChatSubtext}>
              Share your thoughts, feelings, or questions to explore your deeper self
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            multiline
          />
          {loading ? (
            <ActivityIndicator color="#0284c7" style={styles.sendButton} />
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!input.trim()}
            >
              <PaperPlaneRight size={22} color="white" weight="fill" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Name Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name your reflection</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter a name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (newTitle.trim()) {
                    updateConversationTitle(newTitle.trim());
                    setShowNameModal(false);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Conversation Summary</Text>
            <ScrollView style={tw`mb-4`}>
              <Text style={tw`text-base leading-6 text-gray-800`}>{summary}</Text>
            </ScrollView>
            <View style={tw`flex-row justify-center space-x-4`}>
              <TouchableOpacity 
                style={tw`bg-gray-200 py-3 px-6 rounded-lg`}
                onPress={() => setShowSummaryModal(false)}
              >
                <Text style={tw`text-gray-800 font-semibold text-base`}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={tw`bg-jung-purple py-3 px-6 rounded-lg`}
                onPress={exportSummary}
              >
                <Text style={tw`text-white font-semibold text-base`}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#0284c7',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A3B78',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9D94BC',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyChatSubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0284c7',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
}); 