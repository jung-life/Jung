import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';

const LandingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleBeginJourney = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Colorful JUNG text */}
      <View style={styles.titleContainer}>
        <Text style={[styles.letter, styles.j]}>J</Text>
        <Text style={[styles.letter, styles.u]}>U</Text>
        <Text style={[styles.letter, styles.n]}>N</Text>
        <Text style={[styles.letter, styles.g]}>G</Text>
      </View>

      {/* Tagline with highlighted letters */}
      <View style={styles.taglineContainer}>
        <Text style={styles.tagline}>
          <Text style={styles.highlightJ}>J</Text>ourney{' '}
          <Text style={styles.highlightU}>U</Text>nfolding,{' '}
          <Text style={styles.highlightN}>N</Text>urturing{' '}
          <Text style={styles.highlightG}>G</Text>rowth
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleBeginJourney}
      >
        <Text style={styles.buttonText}>Begin Journey</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F7F4',
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  letter: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  j: {
    color: '#FF5757', // Red
  },
  u: {
    color: '#FFD256', // Yellow
  },
  n: {
    color: '#57C84D', // Green
  },
  g: {
    color: '#4D7CC8', // Blue
  },
  taglineContainer: {
    marginBottom: 40,
  },
  tagline: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
  },
  highlightJ: {
    color: '#FF5757',
    fontWeight: 'bold',
  },
  highlightU: {
    color: '#FFD256',
    fontWeight: 'bold',
  },
  highlightN: {
    color: '#57C84D',
    fontWeight: 'bold',
  },
  highlightG: {
    color: '#4D7CC8',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4A3B78',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LandingScreen;