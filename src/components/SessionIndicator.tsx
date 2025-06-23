import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { sessionService, SessionInfo } from '../lib/sessionService';
import tw from '../lib/tailwind';

interface SessionIndicatorProps {
  session: SessionInfo | null;
  onEndSession?: () => void;
  compact?: boolean;
}

export const SessionIndicator: React.FC<SessionIndicatorProps> = ({
  session,
  onEndSession,
  compact = false
}) => {
  if (!session || !session.isActive) {
    return null;
  }

  const progress = sessionService.getSessionProgress(session);
  const warning = sessionService.shouldShowSessionWarning(session);

  if (compact) {
    return (
      <View style={tw`bg-white/90 rounded-xl p-3 mx-4 mb-3 shadow-sm`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`bg-green-100 rounded-full p-2 mr-3`}>
              <SafePhosphorIcon iconType="Circle" size={16} color="#059669" weight="fill" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-semibold text-jung-deep`}>
                Session Active
              </Text>
              <Text style={tw`text-xs text-gray-600`}>
                {session.messageCount} messages • {progress.timeRemaining}
              </Text>
            </View>
          </View>
          
          {/* Progress Ring */}
          <View style={tw`w-8 h-8 relative`}>
            <View style={tw`w-8 h-8 rounded-full bg-gray-200`} />
            <View 
              style={[
                tw`absolute inset-0 rounded-full`,
                { 
                  backgroundColor: '#10b981',
                  transform: [{ rotate: `${(progress.timeProgress / 100) * 360}deg` }]
                }
              ]} 
            />
            <View style={tw`absolute inset-1 bg-white rounded-full`} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`mx-4 mb-4`}>
      <LinearGradient
        colors={warning.showWarning ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
        style={tw`rounded-2xl p-4 shadow-sm`}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`bg-white/20 rounded-full p-2 mr-3`}>
              <SafePhosphorIcon 
                iconType={warning.showWarning ? "WarningCircle" : "Clock"} 
                size={20} 
                color="white" 
                weight="fill" 
              />
            </View>
            <View>
              <Text style={tw`text-white font-bold text-base`}>
                {warning.showWarning ? 'Session Ending Soon' : 'Therapy Session Active'}
              </Text>
              <Text style={tw`text-white/80 text-sm`}>
                Chat freely - no message counting
              </Text>
            </View>
          </View>
          
          {onEndSession && (
            <TouchableOpacity
              onPress={onEndSession}
              style={tw`bg-white/20 rounded-full p-2`}
            >
              <SafePhosphorIcon iconType="X" size={16} color="white" weight="bold" />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Bars */}
        <View style={tw`space-y-3`}>
          {/* Time Progress */}
          <View>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={tw`text-white/80 text-xs font-medium`}>Time</Text>
              <Text style={tw`text-white text-xs font-semibold`}>
                {progress.timeRemaining}
              </Text>
            </View>
            <View style={tw`bg-white/20 rounded-full h-2`}>
              <View 
                style={[
                  tw`bg-white rounded-full h-2`,
                  { width: `${progress.timeProgress}%` }
                ]} 
              />
            </View>
          </View>

          {/* Message Progress */}
          <View>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={tw`text-white/80 text-xs font-medium`}>Messages</Text>
              <Text style={tw`text-white text-xs font-semibold`}>
                {session.messageCount}/30 sent
              </Text>
            </View>
            <View style={tw`bg-white/20 rounded-full h-2`}>
              <View 
                style={[
                  tw`bg-white rounded-full h-2`,
                  { width: `${progress.messageProgress}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Warning Message */}
        {warning.showWarning && (
          <View style={tw`mt-3 p-3 bg-white/10 rounded-lg`}>
            <Text style={tw`text-white text-sm`}>
              {warning.message}
            </Text>
          </View>
        )}

        {/* Session Info */}
        <View style={tw`flex-row justify-between items-center mt-3 pt-3 border-t border-white/20`}>
          <Text style={tw`text-white/80 text-xs`}>
            1 credit per session • {session.creditCharged ? 'Credit used' : 'Credit pending'}
          </Text>
          <View style={tw`flex-row items-center`}>
            <SafePhosphorIcon iconType="Heart" size={12} color="white" weight="fill" />
            <Text style={tw`text-white text-xs font-medium ml-1`}>
              Natural conversation flow
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default SessionIndicator;
