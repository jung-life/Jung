import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type SocialButtonProps = {
  onPress: () => void;
  iconName: keyof typeof AntDesign.glyphMap;
  text: string;
  disabled?: boolean;
};

export const SocialButton = ({ 
  onPress, 
  iconName, 
  text, 
  disabled 
}: SocialButtonProps) => (
  <TouchableOpacity 
    style={[
      styles.button,
      disabled && styles.buttonDisabled
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.content}>
      <AntDesign name={iconName} size={24} color="#333" style={styles.icon} />
      <Text style={styles.text}>Continue with {text}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 