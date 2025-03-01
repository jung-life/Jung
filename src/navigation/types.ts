import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Register: undefined;
  Home: undefined;
  Conversations: { refresh?: boolean };
  Chat: { id: string };
  Disclaimer: undefined;
  Settings: undefined;
  Profile: undefined;
  AccountScreen: undefined;
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 