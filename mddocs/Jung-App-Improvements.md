# Jung App Improvements

This document outlines comprehensive improvements for the Jung app, focusing on navigation, user experience, security, and new features.

## Screen-to-Screen Navigation Improvements

### Consistent Navigation Bar

1. **Create a unified bottom tab navigator:**

```javascript
// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ChatCircle, Brain, User, Lightbulb } from 'phosphor-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ReflectionScreen } from '../screens/ReflectionScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DailyMotivationScreen } from '../screens/DailyMotivationScreen';
import tw from '../lib/tailwind';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} weight={focused ? "fill" : "regular"} />;
          } else if (route.name === 'Conversations') {
            return <ChatCircle size={size} color={color} weight={focused ? "fill" : "regular"} />;
          } else if (route.name === 'Reflections') {
            return <Brain size={size} color={color} weight={focused ? "fill" : "regular"} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} weight={focused ? "fill" : "regular"} />;
          } else if (route.name === 'DailyMotivation') {
            return <Lightbulb size={size} color={color} weight={focused ? "fill" : "regular"} />;
          }
        },
        tabBarActiveTintColor: '#4A3B78',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: tw`bg-white border-t border-gray-200`,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Conversations" component={ConversationsScreen} />
      <Tab.Screen name="Reflections" component={ReflectionScreen} />
      <Tab.Screen name="DailyMotivation" component={DailyMotivationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

2. **Update AppNavigator to include TabNavigator:**

```javascript
// src/navigation/AppNavigator.tsx (updated)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationService';
import { TabNavigator } from './TabNavigator';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { ChatScreen } from '../screens/ChatScreen';
import LandingScreen from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import PostLoginScreen from '../screens/PostLoginScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { DisclaimerScreen } from '../screens/DisclaimerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Enhanced header options with hamburger menu
const defaultHeaderOptions = {
  headerRight: () => <HamburgerMenu />,
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#4A3B78',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerShadowVisible: false, // Remove the bottom shadow
};

const AppNavigator = () => {
  const { session, isNewUser } = useAuth();
  const user = session?.user;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="LandingScreen"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Smooth transitions
        }}
      >
        {/* Authentication Screens */}
        <Stack.Screen name="LandingScreen" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} />
        
        {/* Main App Screens */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* Modal Screens with Headers */}
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            headerShown: true,
            title: 'Chat',
            ...defaultHeaderOptions,
            presentation: 'card',
          }}
        />
        <Stack.Screen 
          name="AccountScreen" 
          component={AccountScreen}
          options={{
            headerShown: true,
            title: 'Account Settings',
            ...defaultHeaderOptions,
          }}
        />
        <Stack.Screen 
          name="PrivacyPolicyScreen" 
          component={PrivacyPolicyScreen}
          options={{
            headerShown: true,
            title: 'Privacy Policy',
            ...defaultHeaderOptions,
          }}
        />
        <Stack.Screen 
          name="TermsOfServiceScreen" 
          component={TermsOfServiceScreen}
          options={{
            headerShown: true,
            title: 'Terms of Service',
            ...defaultHeaderOptions,
          }}
        />
        <Stack.Screen 
          name="DisclaimerScreen" 
          component={DisclaimerScreen}
          options={{
            headerShown: true,
            title: 'Disclaimer',
            ...defaultHeaderOptions,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
```

3. **Update Navigation Types:**

```javascript
// src/navigation/types.ts (updated)
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  // Auth flow
  LandingScreen: undefined;
  Login: undefined;
  Register: undefined;
  PostLoginScreen: undefined;
  
  // Main navigation
  MainTabs: undefined;
  
  // Modal screens
  Chat: { 
    conversationId: string;
    avatarId?: string;
  };
  AccountScreen: undefined;
  PrivacyPolicyScreen: undefined;
  TermsOfServiceScreen: undefined;
  DisclaimerScreen: undefined;
};

export type TabNavigatorParamList = {
  Home: undefined;
  Conversations: { refresh?: boolean };
  Reflections: undefined;
  DailyMotivation: undefined;
  Profile: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabNavigatorParamList>;
```

### Enhanced Hamburger Menu

Improve the hamburger menu with better icons and organization:

```javascript
// src/components/HamburgerMenu.tsx (improved)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';
import { 
  List, 
  SignOut, 
  Shield, 
  FileText, 
  Info, 
  Export, 
  Gear, 
  Bell, 
  Share, 
  Heart, 
  LockKey, 
  Question, 
  Moon 
} from 'phosphor-react-native';

interface HamburgerMenuProps {
  showLogout?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ showLogout = true }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LandingScreen' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          title: 'Account Settings',
          icon: <Shield size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('AccountScreen');
          },
        },
        {
          title: 'Security',
          icon: <LockKey size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('SecurityScreen');
          },
        },
        {
          title: 'Export Data',
          icon: <Export size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            // Handle export data
          },
        },
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          title: 'Settings',
          icon: <Gear size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('SettingsScreen');
          },
        },
        {
          title: 'Notifications',
          icon: <Bell size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            // Handle notifications
          },
        },
        {
          title: 'Dark Mode',
          icon: <Moon size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            // Toggle dark mode
          },
        },
      ]
    },
    {
      title: "About",
      items: [
        {
          title: 'Privacy Policy',
          icon: <FileText size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('PrivacyPolicyScreen');
          },
        },
        {
          title: 'Terms of Service',
          icon: <Info size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('TermsOfServiceScreen');
          },
        },
        {
          title: 'Disclaimer',
          icon: <Info size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            navigation.navigate('DisclaimerScreen');
          },
        },
        {
          title: 'Help & Support',
          icon: <Question size={20} color="#4A3B78" />,
          onPress: () => {
            setMenuVisible(false);
            // Open help page
          },
        },
      ]
    },
  ];

  if (showLogout) {
    menuSections.push({
      title: "Session",
      items: [
        {
          title: 'Logout',
          icon: <SignOut size={20} color="#E53E3E" />,
          onPress: handleLogout,
          textStyle: { color: '#E53E3E' },
        }
      ]
    });
  }

  return (
    <>
      <TouchableOpacity
        style={tw`p-2`}
        onPress={() => setMenuVisible(true)}
        accessible={true}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <List size={24} color="#4A3B78" weight="bold" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={tw`flex-1 bg-black bg-opacity-30`}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={tw`absolute top-16 right-4 bg-white rounded-lg shadow-lg w-72 overflow-hidden max-h-[80%]`}>
            <ScrollView>
              {menuSections.map((section, sectionIndex) => (
                <View key={sectionIndex}>
                  <Text style={tw`px-4 pt-3 pb-1 text-xs uppercase text-gray-500 font-bold`}>
                    {section.title}
                  </Text>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      style={tw`flex-row items-center p-4 border-b border-gray-100`}
                      onPress={item.onPress}
                    >
                      <View style={tw`mr-3`}>{item.icon}</View>
                      <Text style={[tw`text-base`, item.textStyle]}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
```

## Enhanced Conversation Export Functionality

### Add Multiple Export Options

Create a new component for handling exports:

```javascript
// src/components/ExportOptions.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import { 
  X, 
  Share as ShareIcon, 
  Copy, 
  Email, 
  Download, 
  FilePdf, 
  FileDoc, 
  FileTxt 
} from 'phosphor-react-native';

interface ExportOptionsProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  content: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  visible,
  onClose,
  conversationId,
  conversationTitle,
  content
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  const handleCopyToClipboard = async () => {
    try {
      setExporting(true);
      setExportType('copy');
      await Clipboard.setStringAsync(content);
      Alert.alert('Success', 'Content copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy content');
    } finally {
      setExporting(false);
      setExportType(null);
      onClose();
    }
  };

  const handleShareAsText = async () => {
    try {
      setExporting(true);
      setExportType('share');
      await Share.share({
        message: content,
        title: conversationTitle
      });
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share content');
    } finally {
      setExporting(false);
      setExportType(null);
      onClose();
    }
  };

  const handleEmailExport = async () => {
    try {
      setExporting(true);
      setExportType('email');
      
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }
      
      await MailComposer.composeAsync({
        subject: `Jung Analysis: ${conversationTitle}`,
        body: content,
        isHtml: false
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setExporting(false);
      setExportType(null);
      onClose();
    }
  };

  const handleExportAsFile = async (fileType: 'txt' | 'pdf' | 'docx') => {
    try {
      setExporting(true);
      setExportType(fileType);
      
      let fileUri = '';
      const sanitizedTitle = conversationTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const filename = `jung_${sanitizedTitle}_${timestamp}`;
      
      // For TXT export (direct)
      if (fileType === 'txt') {
        fileUri = `${FileSystem.documentDirectory}${filename}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, content);
      } 
      // For PDF/DOCX, we'd use a server endpoint to convert and then download
      else {
        // Mock implementation - in a real app, you'd use a server endpoint
        // This would call an API that returns a URL to download the file
        Alert.alert('Feature Coming Soon', `Export as ${fileType.toUpperCase()} will be available soon!`);
        setExporting(false);
        setExportType(null);
        return;
      }
      
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      // Share the file
      await Sharing.shareAsync(fileUri);
      
    } catch (error) {
      console.error(`Error exporting as ${fileType}:`, error);
      Alert.alert('Error', `Failed to export as ${fileType.toUpperCase()}`);
    } finally {
      setExporting(false);
      setExportType(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
        <View style={tw`bg-white rounded-t-xl p-6`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-xl font-bold text-gray-800`}>Export Options</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#4A3B78" />
            </TouchableOpacity>
          </View>
          
          <Text style={tw`text-base text-gray-600 mb-4`}>
            Choose how you want to export your analysis
          </Text>
          
          <View style={tw`grid grid-cols-2 gap-4`}>
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'copy' ? 'bg-gray-100' : ''}`}
              onPress={handleCopyToClipboard}
              disabled={exporting}
            >
              {exporting && exportType === 'copy' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <Copy size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Copy to Clipboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'share' ? 'bg-gray-100' : ''}`}
              onPress={handleShareAsText}
              disabled={exporting}
            >
              {exporting && exportType === 'share' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <ShareIcon size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Share as Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'email' ? 'bg-gray-100' : ''}`}
              onPress={handleEmailExport}
              disabled={exporting}
            >
              {exporting && exportType === 'email' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <Email size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Send via Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'txt' ? 'bg-gray-100' : ''}`}
              onPress={() => handleExportAsFile('txt')}
              disabled={exporting}
            >
              {exporting && exportType === 'txt' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <FileTxt size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Export as TXT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'pdf' ? 'bg-gray-100' : ''}`}
              onPress={() => handleExportAsFile('pdf')}
              disabled={exporting}
            >
              {exporting && exportType === 'pdf' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <FilePdf size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Export as PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`p-4 border border-gray-200 rounded-xl items-center ${exporting && exportType === 'docx' ? 'bg-gray-100' : ''}`}
              onPress={() => handleExportAsFile('docx')}
              disabled={exporting}
            >
              {exporting && exportType === 'docx' ? (
                <ActivityIndicator size="small" color="#4A3B78" />
              ) : (
                <FileDoc size={28} color="#4A3B78" />
              )}
              <Text style={tw`mt-2 text-center text-gray-800`}>Export as DOCX</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={tw`mt-6 p-4 bg-gray-200 rounded-xl`}
            onPress={onClose}
          >
            <Text style={tw`text-center text-gray-800 font-semibold`}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
```

## Google Authentication Integration

### Improve Google Sign-In Flow

Update the auth callback handler:

```javascript
// src/auth/callback.ts (improved)
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useURL } from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import { useSupabase } from '../contexts/SupabaseContext';
import * as WebBrowser from 'expo-web-browser';
import { mixpanel } from '../lib/analytics';

export default function Callback() {
  const url = useURL();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { setOAuthSession } = useSupabase();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (!url) return;
        
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const provider = params.get('provider') || 'unknown';
        
        console.log(`OAuth callback received for provider: ${provider}`);
        
        if (!accessToken || !refreshToken) {
          console.error('OAuth callback missing tokens');
          throw new Error('Invalid OAuth callback URL');
        }
        
        // Set the OAuth session
        await setOAuthSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        // Get user info
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user after OAuth:', error);
          throw error;
        }
        
        if (!user) {
          console.error('No user found after OAuth');
          throw new Error('Authentication failed');
        }
        
        // Track successful sign in
        mixpanel.track('User Signed In', {
          method: provider,
          userId: user.id,
        });
        
        // Navigate to the post-login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'PostLoginScreen' }],
        });
        
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        
        // Navigate back to the login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    
    handleOAuthCallback();
  }, [url, navigation, setOAuthSession]);
  
  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <ActivityIndicator size="large" color="#4A3B78" />
      <Text style={tw`mt-4 text-lg text-jung-purple`}>Completing sign in...</Text>
    </View>
  );
}
```

### Enhanced Social Button Component

Improve the Google Sign-In button:

```javascript
// src/components/SocialButton.tsx (improved)
import React from 'react';
import { TouchableOpacity, Text, Image, ActivityIndicator, View } from 'react-native';
import tw from '../lib/tailwind';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false
}) => {
  const isGoogle = provider === 'google';
  const iconSource = isGoogle 
    ? require('../assets/google.png') 
    : require('../assets/apple.png');
  
  const buttonStyles = isGoogle
    ? tw`bg-white border-gray-300 shadow-sm`
    : tw`bg-black`;
    
  const textStyles = isGoogle
    ? tw`text-gray-800`
    : tw`text-white`;
  
  const providerName = isGoogle ? 'Google' : 'Apple';
  
  return (
    <TouchableOpacity
      style={[
        tw`flex-row items-center justify-center py-3 px-4 rounded-full border mb-3`,
        buttonStyles,
        disabled ? tw`opacity-60` : {},
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isGoogle ? '#4285F4' : '#FFFFFF'} 
          style={tw`mr-2`} 
        />
      ) : (
        <Image
          source={iconSource}
          style={tw`w-5 h-5 mr-3`}
          resizeMode="contain"
        />
      )}
      
      <Text style={[tw`font-medium`, textStyles]}>
        Continue with {providerName}
      </Text>
    </TouchableOpacity>
  );
};
```

## Daily Motivation with LLM-based Emotional Analysis

### Create Emotional State Assessment

First, let's create a model for emotional states:

```javascript
// src/types/emotions.ts
export type EmotionalState = {
  id: string;
  user_id: string;
  primary_emotion: PrimaryEmotion;
  secondary_emotions: SecondaryEmotion[];
  intensity: number; // 1-10
  triggers?: string[];
  needs?: string[];
  timestamp: string;
};

export type PrimaryEmotion = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'disgust' 
  | 'surprise'
  | 'trust'
  | 'anticipation';

export type SecondaryEmotion =
  | 'acceptance'
  | 'admiration'
  | 'adoration'
  | 'anxiety'
  | 'awe'
  | 'boredom'
  | 'calm'
  | 'confusion'
  | 'contempt'
  | 'contentment'
  | 'craving'
  | 'disappointment'
  | 'doubt'
  | 'ecstasy'
  | 'embarrassment'
  | 'empathy'
  | 'envy'
  | 'excitement'
  | 'frustration'
  | 'gratitude'
  | 'grief'
