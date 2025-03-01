import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Register: undefined;
  Home: undefined;
  Conversations: { refresh?: number };
  Chat: { id: string };
  Disclaimer: undefined;
  Settings: undefined;
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 