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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackNavigationProp } from '../navigation/types';
import { generateAIResponse } from '../lib/api';
import { TherapistAvatar } from '../components/TherapistAvatar';

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

  useEffect(() => {
    if (id !== 'new') {
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

  const createConversation = async (customTitle?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      // Generate a default title if none provided
      const defaultTitle = customTitle || `Reflection - ${new Date().toLocaleDateString()}`;
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          { 
            user_id: user.id,
            title: defaultTitle,
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
      
      setConversationTitle(title);
    } catch (error) {
      console.error('Error updating conversation title:', error);
      Alert.alert('Error', 'Failed to update conversation title');
    }
  };

  const handleRenameConversation = () => {
    setNewTitle(conversationTitle);
    setShowNameModal(true);
  };

  const confirmRename = () => {
    if (newTitle.trim()) {
      updateConversationTitle(newTitle.trim());
      setShowNameModal(false);
    }
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
    navigation.navigate('Conversations');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToReflections}>
          <AntDesign name="arrowleft" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.titleContainer} 
          onPress={handleRenameConversation}
        >
          <Text style={styles.title} numberOfLines={1}>
            {conversationTitle || 'New Reflection'}
          </Text>
          <AntDesign 
            name="edit" 
            size={16} 
            color="#718096" 
            style={styles.editIcon}
          />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
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
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.aiBubble
          ]}>
            <Text style={styles.messageText}>{item.content}</Text>
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
              <AntDesign name="arrowup" size={24} color="white" />
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
                onPress={confirmRename}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={styles.floatingBackButton}
        onPress={handleBackToReflections}
      >
        <AntDesign name="arrowleft" size={18} color="white" />
      </TouchableOpacity>
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
  floatingBackButton: {
    position: 'absolute',
    top: 90,
    left: 10,
    backgroundColor: '#4A3B78',
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
}); 