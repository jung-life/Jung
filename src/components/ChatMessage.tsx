import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import tw from '../lib/tailwind';
import { format } from 'date-fns';
import { User, Robot } from 'phosphor-react-native';

type MessageProps = {
  message: {
    id: string;
    content: string;
    is_from_user: boolean;
    created_at: string;
    pending?: boolean;
  };
};

export const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  const isUserMessage = message.is_from_user;
  const formattedTime = format(new Date(message.created_at), 'h:mm a');
  
  return (
    <View 
      style={[
        tw`mb-4 max-w-[85%]`, 
        isUserMessage ? tw`self-end` : tw`self-start`
      ]}
    >
      <View 
        style={[
          tw`rounded-2xl p-3`,
          isUserMessage 
            ? tw`bg-jung-purple rounded-tr-none` 
            : tw`bg-gray-200 rounded-tl-none`
        ]}
      >
        <View style={tw`flex-row items-center mb-1`}>
          {isUserMessage ? (
            <User size={16} color={isUserMessage ? "white" : "#333"} weight="fill" />
          ) : (
            <Robot size={16} color={isUserMessage ? "white" : "#333"} weight="fill" />
          )}
          <Text 
            style={[
              tw`text-xs ml-1 font-medium`,
              isUserMessage ? tw`text-white` : tw`text-gray-700`
            ]}
          >
            {isUserMessage ? 'You' : 'Jung AI'}
          </Text>
        </View>
        
        <Text 
          style={[
            tw`text-base`,
            isUserMessage ? tw`text-white` : tw`text-gray-800`
          ]}
        >
          {message.content}
        </Text>
        
        <View style={tw`flex-row items-center justify-end mt-1`}>
          <Text 
            style={[
              tw`text-xs`,
              isUserMessage ? tw`text-white opacity-80` : tw`text-gray-500`
            ]}
          >
            {formattedTime}
          </Text>
          
          {message.pending && (
            <ActivityIndicator 
              size="small" 
              color={isUserMessage ? "white" : "#6b46c1"} 
              style={tw`ml-1`}
            />
          )}
        </View>
      </View>
    </View>
  );
}; 