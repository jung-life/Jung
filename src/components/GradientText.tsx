import React from 'react';
import { Text, View } from 'react-native';

interface GradientTextProps {
  text: string;
  style?: any;
  colors?: string[];
}

export const GradientText: React.FC<GradientTextProps> = ({ 
  text, 
  style, 
  colors = ['#FF5757', '#FFD256', '#57C84D', '#4D7CC8']
}) => {
  // Split the text into individual characters
  const characters = text.split('');
  
  return (
    <View style={{ flexDirection: 'row' }}>
      {characters.map((char, index) => (
        <Text 
          key={index} 
          style={[
            style, 
            { color: colors[index % colors.length] }
          ]}
        >
          {char}
        </Text>
      ))}
    </View>
  );
}; 