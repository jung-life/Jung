import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Lightbulb, Brain, FlowerLotus, Sparkle, PaperPlaneTilt } from 'phosphor-react-native';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import { supabase } from '../lib/supabase';

export const ReflectionScreen = () => {
  const navigation = useNavigation();
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleSubmitReflection = async () => {
    if (!reflection.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      // Save reflection to database
      const { error } = await supabase
        .from('reflections')
        .insert({
          user_id: user.id,
          content: reflection,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error saving reflection:', error);
        return;
      }
      
      // Clear input and navigate back
      setReflection('');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error in handleSubmitReflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.05} />
        
        <View style={tw`flex-row items-center p-4`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`p-2`}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Typography variant="title" style={tw`ml-2`}>Daily Reflection</Typography>
        </View>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1`}
          keyboardVerticalOffset={100}
        >
          <ScrollView 
            contentContainerStyle={tw`flex-grow p-4`}
            keyboardShouldPersistTaps="handled"
          >
            <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
              <View style={tw`flex-row items-center mb-3`}>
                <Brain size={24} color="#6b46c1" weight="duotone" />
                <Text style={tw`ml-2 text-lg font-medium text-gray-800`}>
                  Reflect on your journey
                </Text>
              </View>
              <Text style={tw`text-gray-600 mb-4`}>
                Take a moment to reflect on your insights, emotions, and discoveries. 
                What patterns are emerging? What shadows are you beginning to recognize?
              </Text>
            </View>
            
            <View style={tw`bg-white rounded-xl p-5 shadow-sm flex-1`}>
              <TextInput
                ref={inputRef}
                style={tw`text-base text-gray-800 min-h-[200px]`}
                placeholder="Write your reflection here..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                value={reflection}
                onChangeText={setReflection}
                editable={!isSubmitting}
              />
            </View>
          </ScrollView>
          
          <View style={tw`p-4 bg-white border-t border-gray-200`}>
            <TouchableOpacity
              style={tw`bg-jung-purple rounded-full p-4 flex-row items-center justify-center ${!reflection.trim() ? 'opacity-50' : ''}`}
              onPress={handleSubmitReflection}
              disabled={!reflection.trim() || isSubmitting}
            >
              <View style={tw`bg-white rounded-full p-1.5 mr-2`}>
                <PaperPlaneTilt size={20} color="#6b46c1" weight="bold" />
              </View>
              <Text style={tw`text-white font-semibold text-base`}>
                {isSubmitting ? 'Saving...' : 'Share Insight'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}; 