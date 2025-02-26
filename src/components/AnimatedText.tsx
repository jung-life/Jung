import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface AnimatedTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  style?: object;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  speed = 50,
  onComplete,
  style = {},
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    if (wordIndex < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((current) => current + (current ? ' ' : '') + words[wordIndex]);
        setWordIndex(wordIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [wordIndex, words, speed, onComplete]);

  return <Text style={[styles.text, style]}>{displayedText}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333',
  },
}); 