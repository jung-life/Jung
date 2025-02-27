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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Swipeable } from 'react-native-gesture-handler';
import { RootStackNavigationProp } from '../navigation/types';

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export const ConversationsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const swipeableRefs = React.useRef<Map<string, Swipeable>>(new Map());

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      console.log('Fetched conversations:', data?.length);
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
      fetchConversations();
      return () => {
        // Cleanup function if needed
      };
    }, [fetchConversations])
  );

  const handleNewConversation = () => {
    navigation.navigate('Chat', { id: 'new' });
  };

  const handleSelectConversation = (id: string) => {
    navigation.navigate('Chat', { id });
  };
  
  const handleGoToHome = async () => {
    try {
      // Sign out the user
      await supabase.auth.signOut();
      // The auth state change will automatically redirect to Landing
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
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

  const renderRightActions = (id: string, title: string) => {
    return (
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          swipeableRefs.current.get(id)?.close();
          handleDeleteConversation(id, title);
        }}
        disabled={deleting === id}
      >
        {deleting === id ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <View style={styles.deleteButtonContent}>
            <AntDesign name="delete" size={20} color="white" />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoToHome}>
          <AntDesign name="home" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Reflections</Text>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={handleNewConversation}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start a new conversation to begin your journey</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleNewConversation}
          >
            <Text style={styles.startButtonText}>Start New Conversation</Text>
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
              renderRightActions={() => renderRightActions(item.id, item.title)}
              friction={2}
              rightThreshold={40}
            >
              <TouchableOpacity 
                style={styles.conversationItem}
                onPress={() => handleSelectConversation(item.id)}
              >
                <Text style={styles.conversationTitle}>{item.title}</Text>
                <Text style={styles.conversationDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <AntDesign name="right" size={16} color="#718096" />
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      )}
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