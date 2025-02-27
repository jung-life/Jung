import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export const HomeScreen = () => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // The useAuth hook will automatically update the session state
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Jung</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 