import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import useLLM from '../hooks/useLLM'; // Assuming you have a hook for LLM interactions
import { ArrowLeft } from 'phosphor-react-native';

const DailyMotivationScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [quote, setQuote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { generateQuote } = useLLM(); // Hook to interact with the LLM

  const fetchMotivationalQuote = async () => {
    setLoading(true);
    try {
      const prompt = `Generate a motivational quote from one of the following categories:
      1. Philosophers (e.g., Aristotle, Socrates, Nietzsche)
      2. Thinkers (e.g., Marcus Aurelius, Seneca, Epictetus)
      3. Psychologists (e.g., Carl Jung, Viktor Frankl, Abraham Maslow)
      
      The quote should be inspiring, thought-provoking, and relevant to daily life. Include the author's name at the end.`;

      const generatedQuote = await generateQuote(prompt);
      setQuote(generatedQuote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      Alert.alert('Error', 'Failed to fetch a motivational quote. Please try again.');
      setQuote('Failed to fetch a motivational quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Currently on DailyMotivationScreen');
    fetchMotivationalQuote();
  }, []);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color="#4A3B78" />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.quoteText}>{quote}</Text>
          <Button
            title="Get Another Quote"
            onPress={fetchMotivationalQuote}
            disabled={loading}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default DailyMotivationScreen; 