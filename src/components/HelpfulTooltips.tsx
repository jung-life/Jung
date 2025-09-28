import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import tw from '../lib/tailwind';

const { width } = Dimensions.get('window');

interface TooltipProps {
  visible: boolean;
  message: string;
  position: { x: number; y: number };
  onClose: () => void;
  type?: 'info' | 'tip' | 'warning';
}

export const HelpfulTooltip: React.FC<TooltipProps> = ({
  visible,
  message,
  position,
  onClose,
  type = 'info'
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const getTooltipStyle = () => {
    switch (type) {
      case 'tip':
        return {
          backgroundColor: '#10B981',
          iconName: 'Lightbulb' as const,
          iconColor: '#FFFFFF'
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          iconName: 'Warning' as const,
          iconColor: '#FFFFFF'
        };
      default:
        return {
          backgroundColor: '#4A3B78',
          iconName: 'Info' as const,
          iconColor: '#FFFFFF'
        };
    }
  };

  const style = getTooltipStyle();

  return (
    <Animated.View
      style={[
        tw`absolute z-50 p-3 rounded-lg shadow-lg max-w-64`,
        {
          backgroundColor: style.backgroundColor,
          left: Math.max(10, Math.min(position.x - 128, width - 266)),
          top: position.y + 10,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={tw`flex-row items-start`}>
        <SafePhosphorIcon
          iconType={style.iconName}
          size={16}
          color={style.iconColor}
          weight="bold"
        />
        <Text style={tw`text-white text-sm flex-1 ml-2 leading-5`}>
          {message}
        </Text>
        <TouchableOpacity onPress={onClose} style={tw`ml-2`}>
          <SafePhosphorIcon iconType="X" size={14} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
      </View>

      {/* Pointer */}
      <View
        style={[
          tw`absolute w-3 h-3 -top-1.5 left-1/2 -ml-1.5`,
          {
            backgroundColor: style.backgroundColor,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </Animated.View>
  );
};

// Context-aware help system
interface HelpSystemProps {
  screen: string;
  userType: 'new' | 'free' | 'premium';
  children: React.ReactNode;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({
  screen,
  userType,
  children
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getHelpContent = (screen: string, userType: string) => {
    const helpMap = {
      'conversations-new': {
        message: "Tap the + button to start your first conversation with Jung!",
        type: 'tip' as const
      },
      'conversations-free': {
        message: "You have limited conversations per day. Upgrade for unlimited access!",
        type: 'warning' as const
      },
      'subscription-free': {
        message: "Upgrade to unlock unlimited conversations and advanced insights!",
        type: 'tip' as const
      },
      'insights-new': {
        message: "Track your emotional journey and see patterns in your conversations.",
        type: 'info' as const
      },
      'account-features': {
        message: "Explore premium features to enhance your Jung experience.",
        type: 'tip' as const
      }
    };

    return helpMap[`${screen}-${userType}` as keyof typeof helpMap] || null;
  };

  const showTooltip = (id: string, position: { x: number; y: number }) => {
    setActiveTooltip(id);
    setTooltipPosition(position);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setActiveTooltip(null);
    }, 5000);
  };

  const helpContent = getHelpContent(screen, userType);

  return (
    <View style={tw`flex-1`}>
      {children}

      {helpContent && activeTooltip && (
        <HelpfulTooltip
          visible={!!activeTooltip}
          message={helpContent.message}
          position={tooltipPosition}
          onClose={() => setActiveTooltip(null)}
          type={helpContent.type}
        />
      )}
    </View>
  );
};

// Smart help suggestions based on user behavior
interface SmartHelpProps {
  triggers: {
    onFirstVisit?: boolean;
    onEmptyState?: boolean;
    onLimitReached?: boolean;
    onNewFeature?: boolean;
  };
  suggestions: {
    title: string;
    message: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  }[];
  onDismiss: () => void;
}

export const SmartHelp: React.FC<SmartHelpProps> = ({
  triggers,
  suggestions,
  onDismiss
}) => {
  const [visible, setVisible] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);

  useEffect(() => {
    const shouldShow = Object.values(triggers).some(trigger => trigger);
    if (shouldShow && suggestions.length > 0) {
      setVisible(true);
    }
  }, [triggers, suggestions]);

  if (!visible || suggestions.length === 0) return null;

  const suggestion = suggestions[currentSuggestion];

  return (
    <View style={tw`absolute bottom-20 left-4 right-4 z-50`}>
      <View style={tw`bg-white rounded-xl p-4 shadow-lg border border-gray-200`}>
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <Text style={tw`text-lg font-bold text-gray-800 flex-1`}>
            {suggestion.title}
          </Text>
          <TouchableOpacity onPress={() => { setVisible(false); onDismiss(); }}>
            <SafePhosphorIcon iconType="X" size={20} color="#6B7280" weight="bold" />
          </TouchableOpacity>
        </View>

        <Text style={tw`text-gray-600 mb-4 leading-6`}>
          {suggestion.message}
        </Text>

        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row space-x-1`}>
            {suggestions.map((_, index) => (
              <View
                key={index}
                style={[
                  tw`w-2 h-2 rounded-full`,
                  index === currentSuggestion ? tw`bg-jung-purple` : tw`bg-gray-300`
                ]}
              />
            ))}
          </View>

          <View style={tw`flex-row space-x-2`}>
            {suggestions.length > 1 && currentSuggestion < suggestions.length - 1 && (
              <TouchableOpacity
                onPress={() => setCurrentSuggestion(currentSuggestion + 1)}
                style={tw`bg-gray-100 rounded-lg px-3 py-2`}
              >
                <Text style={tw`text-gray-700 font-medium`}>Next</Text>
              </TouchableOpacity>
            )}

            {suggestion.action && (
              <TouchableOpacity
                onPress={() => {
                  suggestion.action!.onPress();
                  setVisible(false);
                  onDismiss();
                }}
                style={tw`bg-jung-purple rounded-lg px-3 py-2`}
              >
                <Text style={tw`text-white font-medium`}>{suggestion.action.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// Quick action hints
interface QuickHintProps {
  message: string;
  icon?: string;
  position: 'top' | 'bottom';
  visible: boolean;
  onDismiss: () => void;
}

export const QuickHint: React.FC<QuickHintProps> = ({
  message,
  icon = 'Info',
  position,
  visible,
  onDismiss
}) => {
  const [slideAnim] = useState(new Animated.Value(position === 'top' ? -100 : 100));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(position === 'top' ? -100 : 100);
    }
  }, [visible, slideAnim, position, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        tw`absolute left-4 right-4 z-50`,
        position === 'top' ? tw`top-16` : tw`bottom-20`,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={tw`bg-jung-purple rounded-lg p-3 flex-row items-center shadow-lg`}>
        <SafePhosphorIcon iconType={icon as any} size={20} color="#FFFFFF" weight="bold" />
        <Text style={tw`text-white font-medium flex-1 ml-3`}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={tw`ml-2`}>
          <SafePhosphorIcon iconType="X" size={16} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};