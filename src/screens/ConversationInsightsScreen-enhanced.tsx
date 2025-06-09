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
import { supabase } from '../lib/supabase'; // Use standard supabase client
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { ArrowLeft, Brain, ShareNetwork, Copy, Download, House, FileText, Lightbulb, TrendUp, Target, Star, CheckCircle } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { generateAIResponse } from '../lib/api';
import { encryptData, decryptData } from '../lib/encryptionUtils';
import useAuthStore from '../store/useAuthStore';
import { availableAvatars, Avatar } from '../components/AvatarSelector';

// Use the enhanced screen name for the route prop type
type ConversationInsightsScreenRouteProp = RouteProp<RootStackParamList, 'ConversationInsightsScreen-enhanced'>;

// Define a basic type for the message structure from the database
type DbMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string | null;
  is_from_user: boolean;
  created_at: string;
  // Add any other relevant fields from your messages table
};

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
  // Combine loading and analyzing states
  const [isBusy, setIsBusy] = useState(true); 
  const [busyText, setBusyText] = useState('Loading insights...'); // Text for the busy indicator
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchConversationDetails = useCallback(async (): Promise<Conversation | null> => { // Added return type
    if (!conversationId) return null;
    
    try {
      const { data, error } = await supabase // Use standard client
        .from('conversations')
        .select('id, title, avatar_id')
        .eq('id', conversationId)
        .single();
        
      if (error) {
        // Handle the specific error where no rows are found gracefully
        if (error.code === 'PGRST116') {
          console.warn(`Conversation not found or RLS prevented access for ID: ${conversationId}`);
          setError('Conversation details not found. It might have been deleted or access is restricted.');
        } else {
          console.error('Error fetching conversation:', error);
          setError('Failed to load conversation details.');
        }
        return null; // Return null to indicate failure
      }
      
      if (data) {
        // Decrypt title if needed - using the improved decryptData that doesn't throw errors
        let title = data.title;
        if (title) {
          // decryptData now handles all errors internally
          title = decryptData(title);
          
          // If decryption failed, use a default title
          if (title === '[Encrypted Content]') {
            title = 'Untitled Conversation';
          }
        } else {
          title = 'Untitled Conversation';
        }
        
        const fetchedConversation = {
          ...data,
          title
        };
        setConversation(fetchedConversation);
        return fetchedConversation; // Return the fetched conversation
      }
      return null; // Return null if no data
    } catch (error) {
      console.error('Error in fetchConversationDetails:', error);
      setError('An unexpected error occurred while fetching conversation details.');
      return null; // Return null on catch
    }
  }, [conversationId]);

  // Define generateInsight first to avoid circular dependency
  const generateInsight = useCallback(async (conv: Conversation | null) => { // Accept conversation as argument
    if (!conversationId || !user || !conv) {
        setError('Cannot generate insight without conversation details.');
        setIsBusy(false); // Ensure busy state is reset
        return;
    }
    
    let insightGenerated = false; // Flag to track if insight generation completed
    try {
      setBusyText('Analyzing conversation...'); // Update busy text
      // No need to set isBusy(true) here, it should already be true from fetchInsight
      setError(null); // Clear previous errors
      
      // Fetch messages for this conversation
      const { data, error } = await supabase // Use standard client (Corrected variable names)
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) { // Use 'error'
        console.error('Error fetching messages for analysis:', error); // Use 'error'
        setError('Failed to fetch conversation messages');
        // No return here, finally will handle isBusy
        throw error; // Throw to prevent further execution in try block
      }
      
      if (!data || data.length === 0) { // Use 'data'
        setError('No messages found in this conversation to analyze.');
        // No return here, finally will handle isBusy
        throw new Error('No messages found'); // Throw to prevent further execution
      }
      
      // Decrypt messages - using the improved decryptData that doesn't throw errors
      // Add type annotation for 'msg' and use 'data'
      const decryptedMessages = data.map((msg: DbMessage) => { 
        let content = msg.content;
        if (content) {
          // decryptData now handles all errors internally and returns a placeholder if needed
          content = decryptData(content);
        }
        // Return the full message structure expected by later code
        return { ...msg, content }; 
      });
      
      // Filter out any messages that couldn't be decrypted properly
      // Add type annotation for 'msg'
      const validMessages = decryptedMessages.filter((msg: { content: string | null; [key: string]: any }) => 
        msg.content && 
        msg.content !== '[Encrypted Content]' && 
        msg.content !== '[Encrypted Message]'
      );
      
      // Check if we have enough valid messages to perform analysis
      if (validMessages.length === 0) {
        setError('No readable messages found in this conversation. The messages may be encrypted or corrupted.');
        // No return here, finally will handle isBusy
        throw new Error('No readable messages'); // Throw to prevent further execution
      }
      
      // Format messages for analysis - only use validMessages (not decryptedMessages)
      // Use a more explicit format to make it clear this is a human conversation
      // Add type annotation for 'msg'
      const formattedConversation = validMessages
        .map((msg: { is_from_user: boolean; content: string | null; [key: string]: any }) => {
          const role = msg.is_from_user ? 'Human' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      
      // Use the conversation passed as argument, default to depthdelver
      const avatarId = conv.avatar_id || 'depthdelver'; 
      const avatarName = availableAvatars.find(a => a.id === avatarId)?.name || 'The Depth Delver';
      
      // Create avatar-specific prompt based on the avatar's philosophy
      let avatarContext = '';
      switch (avatarId) {
        case 'depthdelver':
          avatarContext = `As The Depth Delver, analyze this conversation through the lens of analytical psychology and depth psychology. 
          Focus on uncovering unconscious patterns, archetypal themes, symbolic meanings, and the individuation process. 
          Explore the depths of the psyche, dreams, and shadow elements that seek integration.`;
          break;
        case 'flourishingguide':
          avatarContext = `As The Flourishing Guide, analyze this conversation through the lens of humanistic and positive psychology. 
          Focus on strengths, resilience, meaning-making, self-actualization, and holistic well-being. 
          Consider empathy, cultural influences, community connections, and the person's journey toward authentic self-realization.`;
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
        // Legacy avatar IDs for backward compatibility
        case 'jung':
        case 'freud':
        case 'adler':
          avatarContext = `As The Depth Delver, analyze this conversation through the lens of analytical psychology and depth psychology. 
          Focus on uncovering unconscious patterns, archetypal themes, symbolic meanings, and the individuation process.`;
          break;
        case 'rogers':
        case 'frankl':
        case 'maslow':
        case 'horney':
          avatarContext = `As The Flourishing Guide, analyze this conversation through the lens of humanistic and positive psychology. 
          Focus on strengths, resilience, meaning-making, self-actualization, and holistic well-being.`;
          break;
        default:
          avatarContext = `As The Depth Delver, analyze this conversation from a psychological perspective, focusing on patterns, 
          insights, and opportunities for growth through understanding the unconscious.`;
      }
      
      // Generate analysis using AI with avatar-specific context
      const prompt = `
        ${avatarContext}
        
        SYSTEM INSTRUCTION: The following text block contains a transcript of a dialogue between a Human user and an AI Assistant. This is plain, unencrypted English text. Your task is to perform a psychological analysis of this dialogue. Do NOT treat this text as encrypted or coded. Analyze it as a standard human-AI conversation.
        
        --- BEGIN CONVERSATION TRANSCRIPT ---
        ${formattedConversation}
        --- END CONVERSATION TRANSCRIPT ---
        
        ${validMessages.some((msg: { content: string | null; [key: string]: any }) => msg.content === "[Unable to decrypt message]") ? "Note: Some parts of the conversation were unavailable (marked as '[Unable to decrypt message]') and are not included in the transcript above. Please provide your analysis based on the available text." : ""}
        
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
      
      // Pass proper options to ensure consent is granted for analysis generation
      let analysisContent = await generateAIResponse(prompt, [], avatarId, {
        userConsent: true,
        privacyLevel: 'BASIC',
        provider: 'claude'
      });
      
      // Additional cleaning to remove any remaining XML-style tags
      analysisContent = analysisContent
        .replace(/<\/?response>/gi, '')  // Remove <response> and </response> tags
        .replace(/<\/?thinking>/gi, '')  // Remove <thinking> and </thinking> tags
        .replace(/<\/?analysis>/gi, '')  // Remove <analysis> and </analysis> tags
        .replace(/<\/?\w+>/gi, '')       // Remove any other XML-style tags
        .trim(); // Remove leading/trailing whitespace
      
      // Encrypt the analysis content before saving
      const encryptedAnalysisContent = encryptData(analysisContent);
      
      // Save encrypted analysis to database
      const { data: insightData, error: insightError } = await supabase // Use standard client
        .from('conversation_insights')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content: encryptedAnalysisContent,
          title: conv?.title ? `Analysis: ${conv.title}` : 'Conversation Analysis' // Use conv argument
        })
        .select()
        .single();
        
      if (insightError) {
        console.error('Error saving insight:', insightError);
        setError('Failed to save analysis');
        // No return here, finally will handle isBusy
        throw insightError; // Throw to prevent further execution
      }
      
      // Set the insight with decrypted content
      setInsight({
        ...insightData,
        content: analysisContent
      });
      insightGenerated = true; // Mark success
      
      // Also save to conversation_history if not already saved
      try {
        const { data: historyData, error: historyError } = await supabase // Use standard client
          .from('conversation_history')
          .upsert({
            user_id: user.id,
            conversation_id: conversationId,
            title: conv?.title || 'Untitled Conversation', // Use conv argument
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
      // Set error state only if it hasn't been set already by specific checks
      // Use optional chaining for error.message check
      if (!error || (error instanceof Error && !error.message?.includes('Failed to fetch'))) { 
          setError('Failed to generate insight. Please try again later.');
      }
      // Ensure busy is reset even if error happens mid-generation
      setIsBusy(false); 
      setBusyText('Loading insights...'); // Reset busy text on error too
    } finally {
      // Only set busy to false here, at the very end of the generation process
      setIsBusy(false); 
      setBusyText('Loading insights...'); // Reset busy text
    }
  }, [conversationId, user]); // Removed conversation dependency as it's passed as arg

  const fetchInsight = useCallback(async (fetchedConv: Conversation | null) => { // Accept fetched conversation
    if (!conversationId || !user) return;
    
    let needsGeneration = false; // Flag to track if generation is needed
    try {
      // No need to set isBusy(true) here, handled by the calling useEffect
      setError(null); // Clear previous errors
      
      // Check if we already have an insight for this conversation
      const { data, error } = await supabase // Use standard client
        .from('conversation_insights')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching insight:', error);
        setError('Failed to load insight. Please try again later.');
        // No return, finally will handle isBusy
        throw error; // Throw to prevent further execution
      }
      
      if (data && data.length > 0) {
        // Decrypt content if needed - using the improved decryptData that doesn't throw errors
        let content = data[0].content;
        if (content) {
          // decryptData now handles all errors internally
          content = decryptData(content);
        }
        
        // Check if content was successfully decrypted
        if (content === '[Encrypted Content]') {
          console.warn('Could not decrypt insight content');
          setError('Unable to decrypt the analysis content. Please try regenerating the analysis.');
          // No return, finally will handle isBusy
          throw new Error('Decryption failed'); // Throw to prevent further execution
        }
        
        setInsight({
          ...data[0],
          content
        });
      } else {
        // No insight found, mark that we need to generate one
        if (fetchedConv) { // Check if conversation details are loaded
           needsGeneration = true;
        } else {
           console.warn("fetchInsight: Conversation details not loaded yet, cannot generate insight.");
           setError("Conversation details needed before generating insight.");
           // No return, finally will handle isBusy
           throw new Error('Conversation details missing'); // Throw to prevent further execution
        }
      }
    } catch (error) {
      console.error('Error in fetchInsight:', error);
      // Set error state only if it hasn't been set already
      if (!error) {
          setError('Failed to load insight. Please try again later.');
      }
    } finally {
      // Only set isBusy to false if we are NOT generating
      if (!needsGeneration) {
          setIsBusy(false);
      }
    }
    // If generation is needed, call generateInsight AFTER finally block
    if (needsGeneration && fetchedConv) {
        await generateInsight(fetchedConv); // Pass fetched conversation
    }
  }, [conversationId, user, generateInsight]); // Removed conversation dependency

  // Combined useEffect for fetching
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if unmounted
    setIsBusy(true); // Set busy at the start
    setBusyText('Loading insights...'); // Set initial busy text
    setError(null); // Clear previous errors
    setInsight(null); // Clear previous insight
    setConversation(null); // Clear previous conversation details

    fetchConversationDetails().then((fetchedConv) => {
      if (isMounted) {
        // Pass the fetched conversation details to fetchInsight
        // Only proceed if fetchConversationDetails didn't set an error
        if (fetchedConv && !error) { 
            fetchInsight(fetchedConv); 
        } else if (!error) {
            // If fetchConversationDetails returned null but didn't set an error explicitly
            // (e.g., conversationId was missing initially), set busy false.
            setIsBusy(false);
        } else {
            // If fetchConversationDetails set an error, ensure busy is false
            setIsBusy(false);
        }
      }
    });

    return () => {
        isMounted = false; // Cleanup function to set flag
    };
  }, [conversationId, fetchConversationDetails, fetchInsight]); // conversationId is the key dependency


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
          // Pass the current conversation state to generateInsight
          onPress: () => {
              if (conversation) {
                  setIsBusy(true); // Set busy before generating
                  generateInsight(conversation);
              } else {
                  Alert.alert("Error", "Cannot regenerate insight without conversation details.");
              }
          }
        }
      ]
    );
  };

  // Function to render formatted insight with icons and visual styling
  const renderFormattedInsight = (content: string) => {
    // Additional cleaning at render time to ensure no XML tags are displayed
    const cleanedContent = content
      .replace(/<\/?response>/gi, '')  // Remove <response> and </response> tags
      .replace(/<\/?thinking>/gi, '')  // Remove <thinking> and </thinking> tags
      .replace(/<\/?analysis>/gi, '')  // Remove <analysis> and </analysis> tags
      .replace(/<\/?\w+>/gi, '')       // Remove any other XML-style tags
      .trim();
    
    const sections = cleanedContent.split('#').filter(section => section.trim());
    
    return (
      <View style={tw`p-4`}>
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const title = lines[0]?.trim();
          const body = lines.slice(1).join('\n').trim();
          
          // Determine icon and colors based on section title
          let icon = <Lightbulb size={20} color="#4A3B78" weight="duotone" />;
          let bgColor = 'bg-blue-50';
          let borderColor = 'border-blue-200';
          let titleColor = 'text-blue-900';
          
          if (title.toLowerCase().includes('theme') || title.toLowerCase().includes('pattern')) {
            icon = <Star size={20} color="#7C3AED" weight="duotone" />;
            bgColor = 'bg-purple-50';
            borderColor = 'border-purple-200';
            titleColor = 'text-purple-900';
          } else if (title.toLowerCase().includes('insight')) {
            icon = <Brain size={20} color="#059669" weight="duotone" />;
            bgColor = 'bg-emerald-50';
            borderColor = 'border-emerald-200';
            titleColor = 'text-emerald-900';
          } else if (title.toLowerCase().includes('growth')) {
            icon = <TrendUp size={20} color="#DC2626" weight="duotone" />;
            bgColor = 'bg-red-50';
            borderColor = 'border-red-200';
            titleColor = 'text-red-900';
          } else if (title.toLowerCase().includes('recommendation')) {
            icon = <Target size={20} color="#EA580C" weight="duotone" />;
            bgColor = 'bg-orange-50';
            borderColor = 'border-orange-200';
            titleColor = 'text-orange-900';
          }
          
          return (
            <View key={index} style={tw`mb-6`}>
              {/* Section Header with Icon */}
              <View style={tw`flex-row items-center mb-3 ${bgColor} ${borderColor} border-l-4 p-3 rounded-r-lg`}>
                {icon}
                <Text style={tw`ml-3 text-lg font-bold ${titleColor}`}>
                  {title}
                </Text>
              </View>
              
              {/* Section Content */}
              <View style={tw`pl-4`}>
                {body.split('\n').map((line, lineIndex) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;
                  
                  // Handle bullet points
                  if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                    const bulletText = trimmedLine.substring(1).trim();
                    return (
                      <View key={lineIndex} style={tw`flex-row items-start mb-2`}>
                        <View style={tw`w-2 h-2 bg-jung-purple rounded-full mt-2 mr-3`} />
                        <Text style={tw`flex-1 text-gray-700 leading-6`}>
                          {bulletText}
                        </Text>
                      </View>
                    );
                  }
                  
                  // Handle numbered list items
                  if (/^\d+\./.test(trimmedLine)) {
                    const match = trimmedLine.match(/^(\d+)\.\s*(.*)$/);
                    if (match) {
                      const [, number, text] = match;
                      return (
                        <View key={lineIndex} style={tw`flex-row items-start mb-3`}>
                          <View style={tw`bg-jung-purple w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`}>
                            <Text style={tw`text-white text-xs font-bold`}>{number}</Text>
                          </View>
                          <Text style={tw`flex-1 text-gray-700 leading-6`}>
                            {text}
                          </Text>
                        </View>
                      );
                    }
                  }
                  
                  // Handle regular paragraphs
                  if (trimmedLine.length > 0) {
                    return (
                      <Text key={lineIndex} style={tw`text-gray-700 leading-6 mb-2`}>
                        {trimmedLine}
                      </Text>
                    );
                  }
                  
                  return null;
                })}
              </View>
            </View>
          );
        })}
        
        {/* Footer message */}
        <View style={tw`mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200`}>
          <View style={tw`flex-row items-center mb-2`}>
            <CheckCircle size={18} color="#059669" weight="duotone" />
            <Text style={tw`ml-2 text-sm font-semibold text-gray-800`}>
              Analysis Complete
            </Text>
          </View>
          <Text style={tw`text-xs text-gray-600 leading-4`}>
            This analysis is generated by AI and is meant to provide insights for reflection. 
            It is not a substitute for professional psychological or therapeutic advice.
          </Text>
        </View>
      </View>
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
        
        {/* Use the single isBusy state */}
        {isBusy ? ( 
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>
              {busyText} {/* Show dynamic busy text */}
            </Text>
          </View>
        ) : error ? (
          <View style={tw`flex-1 justify-center items-center p-4`}>
            <Text style={tw`text-red-500 text-lg mb-4`}>Error</Text>
            <Text style={tw`text-center mb-6`}>{error}</Text>
            <TouchableOpacity
              style={tw`mb-4 bg-jung-purple py-3 px-6 rounded-lg`}
              onPress={async () => { // Make handler async
                setError(null);
                setIsBusy(true); // Set busy before retrying
                setBusyText('Loading insights...'); // Reset busy text
                const fetchedConv = await fetchConversationDetails(); // Re-fetch details
                if (fetchedConv) {
                  // Decide whether to fetchInsight or generateInsight based on context
                  if (insight && insight.content === '[Encrypted Content]') {
                     await generateInsight(fetchedConv); // Pass fetched conversation
                  } else {
                     await fetchInsight(fetchedConv); // Pass fetched conversation
                  }
                } else {
                  // If fetching details failed again, error is already set by fetchConversationDetails
                  setIsBusy(false); // Ensure busy is false if fetch fails
                }
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
              
              <View style={tw`bg-white rounded-lg p-1 shadow-sm mb-4`}>
                {renderFormattedInsight(insight.content)}
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
              // Pass conversation to generateInsight when button is pressed
              onPress={() => {
                  if (conversation) {
                      setIsBusy(true); // Set busy before generating
                      generateInsight(conversation);
                  } else {
                      Alert.alert("Error", "Cannot generate insight without conversation details.");
                  }
              }}
              disabled={!conversation} // Disable if conversation details aren't loaded
            >
              <Text style={tw`text-white font-semibold text-base`}>Generate Insights</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};
