import React from 'react';
import { View } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';

// Define the icon types we're using (same as in SafePhosphorIcon)
type IconType = 
  | 'ChatCircleDots' | 'Brain' | 'BookOpen' | 'Heart' | 'User' 
  | 'Smiley' | 'SmileyMeh' | 'SmileySad' | 'SmileyXEyes' 
  | 'CloudLightning' | 'FloppyDisk' | 'ArrowLeft' | 'Wind' 
  | 'Sparkle' | 'Bed' | 'FireSimple' | 'House';

interface TextWrappedIconProps {
  iconType: IconType;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  style?: any;
}

/**
 * A wrapper for SafePhosphorIcon that ensures proper text wrapping
 * Note: SafePhosphorIcon already has text wrapping built in, so this component
 * is mainly for consistency and future-proofing
 */
export const TextWrappedIcon: React.FC<TextWrappedIconProps> = ({ 
  iconType, 
  size = 24, 
  color = '#000000', 
  weight = 'regular',
  style
}) => {
  return (
    <SafePhosphorIcon 
      iconType={iconType} 
      size={size} 
      color={color} 
      weight={weight} 
      style={style}
    />
  );
};
