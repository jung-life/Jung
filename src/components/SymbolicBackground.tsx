import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import tw from '../lib/tailwind';

export const SymbolicBackground = ({ opacity = 0.05 }) => {
  return (
    <View style={tw`absolute inset-0 overflow-hidden opacity-${opacity * 100}`}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800">
        {/* Mandala - represents wholeness */}
        <G opacity="0.2" transform="translate(200, 400)">
          <Circle cx="0" cy="0" r="150" stroke="#D4AF37" strokeWidth="1" fill="none" />
          <Circle cx="0" cy="0" r="100" stroke="#D4AF37" strokeWidth="1" fill="none" />
          <Circle cx="0" cy="0" r="50" stroke="#D4AF37" strokeWidth="1" fill="none" />
          <Path d="M0,-180 L0,180 M-180,0 L180,0" stroke="#D4AF37" strokeWidth="1" />
          <Path d="M-120,-120 L120,120 M-120,120 L120,-120" stroke="#D4AF37" strokeWidth="1" />
        </G>
        
        {/* Spiral - represents growth and evolution */}
        <Path 
          d="M100,700 Q120,680 140,690 Q160,700 180,680 Q200,660 220,680 Q240,700 260,680" 
          stroke="#536878" 
          strokeWidth="1.5" 
          fill="none" 
        />
      </Svg>
    </View>
  );
}; 