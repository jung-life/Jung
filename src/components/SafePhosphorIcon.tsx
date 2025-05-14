import React from 'react';
import { View, Text } from 'react-native';
import { 
  ChatCircleDots, Brain, BookOpen, Heart, User, Smiley, SmileyMeh, 
  SmileySad, SmileyXEyes, CloudLightning, FloppyDisk, ArrowLeft, 
  Wind, Sparkle, Bed, FireSimple, House, X, Plus, ArrowRight
} from 'phosphor-react-native';

// Define the icon types we're using
type IconType = 
  | 'ChatCircleDots' | 'Brain' | 'BookOpen' | 'Heart' | 'User' 
  | 'Smiley' | 'SmileyMeh' | 'SmileySad' | 'SmileyXEyes' 
  | 'CloudLightning' | 'FloppyDisk' | 'ArrowLeft' | 'ArrowRight' | 'Wind' 
  | 'Sparkle' | 'Bed' | 'FireSimple' | 'House' | 'X' | 'Plus';

interface SafePhosphorIconProps {
  iconType: IconType;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  style?: any;
}

/**
 * A safe wrapper for Phosphor icons that prevents "Text strings must be rendered within a Text component" errors
 */
export const SafePhosphorIcon: React.FC<SafePhosphorIconProps> = ({ 
  iconType, 
  size = 24, 
  color = 'black', 
  weight = 'regular',
  style 
}) => {
  // Render the appropriate icon based on the iconType
  const renderIcon = () => {
    switch (iconType) {
      case 'ChatCircleDots':
        return <ChatCircleDots size={size} color={color} weight={weight} />;
      case 'Brain':
        return <Brain size={size} color={color} weight={weight} />;
      case 'BookOpen':
        return <BookOpen size={size} color={color} weight={weight} />;
      case 'Heart':
        return <Heart size={size} color={color} weight={weight} />;
      case 'User':
        return <User size={size} color={color} weight={weight} />;
      case 'Smiley':
        return <Smiley size={size} color={color} weight={weight} />;
      case 'SmileyMeh':
        return <SmileyMeh size={size} color={color} weight={weight} />;
      case 'SmileySad':
        return <SmileySad size={size} color={color} weight={weight} />;
      case 'SmileyXEyes':
        return <SmileyXEyes size={size} color={color} weight={weight} />;
      case 'CloudLightning':
        return <CloudLightning size={size} color={color} weight={weight} />;
      case 'FloppyDisk':
        return <FloppyDisk size={size} color={color} weight={weight} />;
      case 'ArrowLeft':
        return <ArrowLeft size={size} color={color} weight={weight} />;
      case 'Wind':
        return <Wind size={size} color={color} weight={weight} />;
      case 'Sparkle':
        return <Sparkle size={size} color={color} weight={weight} />;
      case 'Bed':
        return <Bed size={size} color={color} weight={weight} />;
      case 'FireSimple':
        return <FireSimple size={size} color={color} weight={weight} />;
      case 'House':
        return <House size={size} color={color} weight={weight} />;
      case 'X':
        return <X size={size} color={color} weight={weight} />;
      case 'Plus':
        return <Plus size={size} color={color} weight={weight} />;
      case 'ArrowRight':
        return <ArrowRight size={size} color={color} weight={weight} />;
      default:
        console.warn(`Icon "${iconType}" not supported`);
        return null;
    }
  };

  return (
    <Text style={{ fontSize: 0 }}>
      <View style={style}>
        {renderIcon()}
      </View>
    </Text>
  );
};
