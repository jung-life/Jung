import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumUpgradeButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'small' | 'medium' | 'large';
  message?: string;
}

const PremiumUpgradeButton: React.FC<PremiumUpgradeButtonProps> = ({
  onPress,
  style,
  textStyle,
  variant = 'medium',
  message,
}) => {
  const { isPremiumUser } = useSubscription();

  // Don't show the button if user is already premium
  if (isPremiumUser) {
    return null;
  }

  const getStyles = () => {
    switch (variant) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
          icon: styles.smallIcon,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
          icon: styles.largeIcon,
        };
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
          icon: styles.mediumIcon,
        };
    }
  };

  const variantStyles = getStyles();
  const displayMessage = message || 'Upgrade to Premium';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, variantStyles.container, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.gradient, variantStyles.container]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[variantStyles.icon]}>👑</Text>
        <Text style={[styles.buttonText, variantStyles.text, textStyle]}>
          {displayMessage}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Small variant
  smallContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallText: {
    fontSize: 12,
  },
  smallIcon: {
    fontSize: 14,
  },
  // Medium variant
  mediumContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mediumText: {
    fontSize: 14,
  },
  mediumIcon: {
    fontSize: 16,
  },
  // Large variant
  largeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  largeText: {
    fontSize: 16,
  },
  largeIcon: {
    fontSize: 20,
  },
});

export default PremiumUpgradeButton;
