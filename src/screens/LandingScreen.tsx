import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedText } from '../components/AnimatedText';
import { quotes } from '../data/quotes';
import { RootStackParamList } from '../navigation/types';
import { StatusBar } from 'expo-status-bar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export const LandingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteComplete, setIsQuoteComplete] = useState(false);

  const handleQuoteComplete = () => {
    setIsQuoteComplete(true);
  };

  const handleNextQuote = () => {
    setIsQuoteComplete(false);
    setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>Jung</Text>
        <Text style={styles.subtitle}>AI-Guided Self-Discovery</Text>
        
        <Text style={styles.description}>
          Where AI meets analytical psychology.{'\n'}
          Explore your inner world, understand your{'\n'}
          shadows, and discover your authentic self.
        </Text>

        <View style={styles.quoteContainer}>
          <AnimatedText
            key={currentQuoteIndex}
            text={quotes[currentQuoteIndex].text}
            speed={70}
            style={styles.quote}
            onComplete={handleQuoteComplete}
          />
          <Text style={styles.author}>― {quotes[currentQuoteIndex].author}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {isQuoteComplete && (
            <TouchableOpacity 
              style={[styles.button, styles.nextButton]}
              onPress={handleNextQuote}
            >
              <Text style={styles.buttonText}>Next Insight</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.buttonText}>Begin My Journey</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4a5568',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  quoteContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 40,
    width: '100%',
    maxWidth: 500,
  },
  quote: {
    fontSize: 20,
    lineHeight: 28,
    color: '#2c3e50',
    marginBottom: 15,
  },
  author: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 500,
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4a5568',
  },
  loginButton: {
    backgroundColor: '#0284c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 