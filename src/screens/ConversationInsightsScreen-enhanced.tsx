import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabaseEnhanced } from '../lib/supabase-enhanced'; // Use enhanced version
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { ArrowLeft, Brain, ShareNetwork, Copy, Download, House, FileText } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { generateAIResponse } from '../lib/api';
import { encryptData, decryptData } from '../lib/encryptionUtils';
import useAuthStore from '../store/useAuthStore';
import { availableAvatars, Avatar } from '../components/AvatarSelector';

// Use the enhanced screen name for the route prop type
type ConversationInsightsScreenRouteProp = RouteProp<RootStackParamList, 'ConversationInsightsScreen-enhanced'>;

type Insight = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  title?: string;
};

type Conversation = {
  id: string;
  title: string;
  avatar_id?: string;
};

// Rename component to match filename
export const ConversationInsightsScreenEnhanced = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ConversationInsightsScreenRouteProp>();
  const { conversationId } = route.params || {};
  const [insight, setInsight] = useState<Insight | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabaseEnhanced
        .from('conversations')
        .select('id, title, avatar_id')
        .eq('id', conversationId)
        .single();
        
      if (error) {
        console.error('Error fetching conversation:', error);
        return;
      }
      
      if (data) {
        // Decrypt title if needed
        let title = data.title;
        try {
          if (title && title.startsWith('U2FsdGVkX1')) {
            title = decryptData(title);
          }
        } catch (e) {
          console.error('Error decrypting title:', e);
          title = 'Untitled Conversation';
        }
        
        setConversation({
          ...data,
          title
        });
      }
    } catch (error) {
      console.error('Error in fetchConversationDetails:', error);
    }
  }, [conversationId]);

  // Define generateInsight first to avoid circular dependency
  const generateInsight = useCallback(async () => {
    if (!conversationId || !user) return;
    
    try {
      setAnalyzing(true);
      
      // Fetch messages for this conversation
      const { data: messages, error: messagesError } = await supabaseEnhanced
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error('Error fetching messages for analysis:', messagesError);
        setError('Failed to fetch conversation messages');
        return;
      }
      
      if (!messages || messages.length === 0) {
        setError('No messages found in this conversation');
        return;
      }
      
      // Decrypt messages
      const decryptedMessages = messages.map(msg => {
        let content = msg.content;
        try {
          if (content && content.startsWith('U2FsdGVkX1')) {
            content = decryptData(content);
          }
        } catch (e) {
          console.error('Error decrypting message:', e);
          content = '[Encrypted Message]';
        }
        return { ...msg, content };
      });
      
      // Format messages for analysis
      const formattedConversation = decryptedMessages
        .map(msg => `${msg.is_from_user ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      
      // Get the avatar details for the conversation
      const { data: convData } = await supabaseEnhanced
        .from('conversations')
        .select('avatar_id')
        .eq('id', conversationId)
        .single();
        
      const avatarId = convData?.avatar_id || 'jung';
      const avatarName = availableAvatars.find(a => a.id === avatarId)?.name || 'Jung';
      
      // Create avatar-specific prompt based on the avatar's philosophy
      let avatarContext = '';
      switch (avatarId) {
        case 'jung':
          avatarContext = `As Carl Jung, analyze this conversation through the lens of analytical psychology. 
          Focus on archetypes, the collective unconscious, individuation, and psychological types. 
          Identify potential shadow elements and opportunities for integration of the psyche.`;
          break;
        case 'freud':
          avatarContext = `As Sigmund Freud, analyze this conversation through the lens of psychoanalysis. 
          Focus on unconscious motivations, defense mechanisms, psychosexual development, and the dynamics 
          of id, ego, and superego. Look for repressed desires and childhood influences.`;
          break;
        case 'adler':
          avatarContext = `As Alfred Adler, analyze this conversation through the lens of individual psychology. 
          Focus on striving for superiority, social interest, inferiority feelings, and lifestyle. 
          Consider birth order, family dynamics, and life tasks.`;
          break;
        case 'rogers':
          avatarContext = `As Carl Rogers, analyze this conversation through the lens of person-centered therapy. 
          Focus on unconditional positive regard, empathy, congruence, and the actualizing tendency. 
          Consider the person's movement toward self-actualization and authentic self-expression.`;
          break;
        case 'frankl':
          avatarContext = `As Viktor Frankl, analyze this conversation through the lens of logotherapy. 
          Focus on the search for meaning, existential frustration, and the will to meaning. 
          Consider how suffering can be transformed through finding purpose.`;
          break;
        case 'maslow':
          avatarContext = `As Abraham Maslow, analyze this conversation through the lens of humanistic psychology. 
          Focus on the hierarchy of needs, self-actualization, peak experiences, and human potential. 
          Consider which needs are being met or unmet.`;
          break;
        case 'horney':
          avatarContext = `As Karen Horney, analyze this conversation through the lens of neo-Freudian psychology. 
          Focus on cultural and social influences, neurotic needs, and coping strategies. 
          Consider the person's movement toward, against, or away from others.`;
          break;
        case 'oracle':
          avatarContext = `As the Oracle, analyze this conversation through a lens of mystical wisdom and pattern recognition. 
          Focus on hidden connections, synchronicities, and deeper meanings. 
          Offer guidance that helps the person see beyond their immediate circumstances.`;
          break;
        case 'morpheus':
          avatarContext = `As Morpheus, analyze this conversation with a focus on questioning perceived reality and limitations. 
          Focus on breaking free from mental constraints, awakening to deeper truths, and realizing potential. 
          Challenge assumptions and offer perspectives that expand consciousness.`;
          break;
        default:
          avatarContext = `Analyze this conversation from a psychological perspective, focusing on patterns, 
          insights, and opportunities for growth.`;
      }
      
      // Generate analysis using AI with avatar-specific context
      const prompt = `
        ${avatarContext}
        
        Conversation to analyze:
        ${formattedConversation}
        
        Please provide a comprehensive analysis with the following sections:
        
        # Key Themes and Patterns
        [Identify the main topics, recurring themes, and patterns in the conversation]
        
        # Psychological Insights (from ${avatarName}'s perspective)
        [Provide deeper psychological insights about the user's thoughts, feelings, and behaviors using ${avatarName}'s theoretical framework]
        
        # Areas for Personal Growth
        [Suggest potential areas for personal development based on the conversation]
        
        # Recommendations (based on ${avatarName}'s approach)
        [Offer specific recommendations for further reflection or action that align with ${avatarName}'s philosophy]
        
        Format your response with clear section headings and concise, insightful content.
        IMPORTANT: Maintain the perspective and theoretical framework of ${avatarName} throughout the analysis.
      `;
      
      const analysisContent = await generateAIResponse(prompt);
      
      // Encrypt the analysis content before saving
      const encryptedAnalysisContent = encryptData(analysisContent);
      
      // Save encrypted analysis to database
      const { data: insightData, error: insightError } = await supabaseEnhanced
        .from('conversation_insights')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content: encryptedAnalysisContent,
          title: conversation?.title ? `Analysis: ${conversation.title}` : 'Conversation Analysis'
        })
        .select()
        .single();
        
      if (insightError) {
        console.error('Error saving insight:', insightError);
        setError('Failed to save analysis');
        return;
      }
      
      // Set the insight with decrypted content
      setInsight({
        ...insightData,
        content: analysisContent
      });
      
      // Also save to conversation_history if not already saved
      try {
        const { data: historyData, error: historyError } = await supabaseEnhanced
          .from('conversation_history')
          .upsert({
            user_id: user.id,
            conversation_id: conversationId,
            title: conversation?.title || 'Untitled Conversation',
            saved_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,conversation_id',
            ignoreDuplicates: true
          })
          .select();
          
        if (historyError) {
          console.error('Error saving to history:', historyError);
        } else {
          console.log('Conversation saved to history:', historyData);
        }
      } catch (historyError) {
        console.error('Error saving to history:', historyError);
      }
      
    } catch (error) {
      console.error('Error generating insight:', error);
      setError('Failed to generate insight. Please try again later.');
    } finally {
      setAnalyzing(false);
    }
  }, [conversationId, user, conversation]);

  const fetchInsight = useCallback(async () => {
    if (!conversationId || !user) return;
    
    try {
      setLoading(true);
      
      // Check if we already have an insight for this conversation
      const { data, error } = await supabaseEnhanced
        .from('conversation_insights')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching insight:', error);
        setError('Failed to load insight. Please try again later.');
        return;
      }
      
      if (data && data.length > 0) {
        // Decrypt content if needed
        let content = data[0].content;
        try {
          if (content && content.startsWith('U2FsdGVkX1')) {
            content = decryptData(content);
          }
        } catch (e) {
          console.error('Error decrypting insight content:', e);
          content = 'Error decrypting insight content.';
        }
        
        setInsight({
          ...data[0],
          content
        });
      } else {
        // No insight found, we'll need to generate one
        await generateInsight();
      }
    } catch (error) {
      console.error('Error in fetchInsight:', error);
      setError('Failed to load insight. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, generateInsight]);

  useEffect(() => {
    fetchConversationDetails();
    fetchInsight();
  }, [fetchConversationDetails, fetchInsight]);

  const handleShareInsight = async () => {
    if (!insight) return;
    
    try {
      await Share.share({
        message: insight.content,
        title: insight.title || 'Conversation Analysis'
      });
    } catch (error) {
      console.error('Error sharing insight:', error);
      Alert.alert('Error', 'Failed to share insight. Please try again.');
    }
  };

  const handleCopyInsight = async () => {
    if (!insight) return;
    
    try {
      await Clipboard.setStringAsync(insight.content);
      Alert.alert('Success', 'Insight copied to clipboard');
    } catch (error) {
      console.error('Error copying insight:', error);
      Alert.alert('Error', 'Failed to copy insight');
    }
  };

  const handleDownloadInsight = async () => {
    if (!insight) return;
    
    try {
      // Create a file name based on the conversation title or a default
      const fileName = `${insight.title || 'Conversation-Analysis'}-${new Date().toISOString().split('T')[0]}.txt`;
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // For mobile, we'll save to a temporary file and then share it
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, insight.content);
        
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(fileUri);
        } else {
          // For Android, we can use the Share API
          await Share.share({
            title: fileName,
            message: insight.content,
          });
        }
      } else {
        // For web, we'll create a blob and download it
        const blob = new Blob([insight.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading insight:', error);
      Alert.alert('Error', 'Failed to download insight');
    }
  };

  const handleRegenerateInsight = () => {
    Alert.alert(
      'Regenerate Analysis',
      'Are you sure you want to regenerate the analysis? This will replace the current analysis.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Regenerate',
          onPress: generateInsight
        }
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#4A3B78" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Conversation Insights</Text>
          <View style={tw`w-10`} />
        </View>
        
        {loading || analyzing ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>
              {analyzing ? 'Analyzing conversation...' : 'Loading insights...'}
            </Text>
          </View>
        ) : error ? (
          <View style={tw`flex-1 justify-center items-center p-4`}>
            <Text style={tw`text-red-500 text-lg mb-4`}>Error</Text>
            <Text style={tw`text-center mb-6`}>{error}</Text>
            <TouchableOpacity
              style={tw`mb-4 bg-jung-purple py-3 px-6 rounded-lg`}
              onPress={() => {
                setError(null);
                generateInsight();
              }}
            >
              <Text style={tw`text-white font-semibold`}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-gray-200 py-3 px-6 rounded-lg`}
              onPress={() => navigation.goBack()}
            >
              <Text style={tw`text-gray-800 font-semibold`}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : insight ? (
          <>
            <ScrollView style={tw`flex-1 p-4`}>
              <View style={tw`mb-4`}>
                <Text style={tw`text-lg font-bold text-jung-deep mb-1`}>
                  {conversation?.title || 'Conversation Analysis'}
                </Text>
                <Text style={tw`text-sm text-gray-500`}>
                  Analysis generated on {new Date(insight.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={tw`bg-white rounded-lg p-4 shadow-sm mb-4`}>
                <Text style={tw`text-base leading-6 text-gray-800`}>
                  {insight.content}
                </Text>
              </View>
              
              <View style={tw`h-20`} />
            </ScrollView>
            
            <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4`}>
              <View style={tw`flex-row justify-around mb-2`}>
                <TouchableOpacity 
                  style={tw`items-center`}
                  onPress={handleCopyInsight}
                >
                  <View style={tw`bg-gray-100 p-3 rounded-full mb-1`}>
                    <Copy size={20} color="#4A3B78" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Copy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`items-center`}
                  onPress={handleShareInsight}
                >
                  <View style={tw`bg-gray-100 p-3 rounded-full mb-1`}>
                    <ShareNetwork size={20} color="#4A3B78" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`items-center`}
                  onPress={handleDownloadInsight}
                >
                  <View style={tw`bg-gray-100 p-3 rounded-full mb-1`}>
                    <Download size={20} color="#4A3B78" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Download</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`items-center`}
                  onPress={handleRegenerateInsight}
                >
                  <View style={tw`bg-gray-100 p-3 rounded-full mb-1`}>
                    <Brain size={20} color="#4A3B78" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Regenerate</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={tw`bg-jung-purple py-3 rounded-lg mt-2`}
                onPress={() => navigation.navigate('ConversationsScreen', { refresh: true })}
              >
                <Text style={tw`text-white text-center font-semibold`}>Back to Conversations</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={tw`flex-1 justify-center items-center p-5`}>
            <FileText size={60} color="#4A3B78" weight="light" />
            <Text style={tw`text-xl font-bold text-gray-900 mt-4 mb-2`}>No insights available</Text>
            <Text style={tw`text-base text-gray-600 text-center mb-6`}>
              Generate an analysis to see insights for this conversation
            </Text>
            <TouchableOpacity 
              style={tw`bg-jung-purple py-3 px-6 rounded-lg shadow-sm`}
              onPress={generateInsight}
            >
              <Text style={tw`text-white font-semibold text-base`}>Generate Insights</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};
