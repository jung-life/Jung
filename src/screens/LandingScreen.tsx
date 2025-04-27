import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleBeginJourney = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground 
      source={require('../assets/logo/jung-app-log.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Top Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>JUNG</Text>
        </View>
        
        {/* Spacer to push content to bottom */}
        <View style={styles.spacer} />
        
        {/* Bottom Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>
            <Text style={styles.highlightJ}>J</Text>ourney{' '}
            <Text style={styles.highlightU}>U</Text>nfolding,{' '}
            <Text style={styles.highlightN}>N</Text>urturing{' '}
            <Text style={styles.highlightG}>G</Text>rowth
          </Text>
        </View>

        {/* Begin Journey Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleBeginJourney}
        >
          <Text style={styles.buttonText}>Begin Journey</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: width,
    height: height,
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent overlay for better text visibility
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  spacer: {
    flex: 1,
  },
  taglineContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 22,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LandingScreen;
