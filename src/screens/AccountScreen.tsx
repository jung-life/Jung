import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { 
  User, 
  SignOut, 
  Camera, 
  Gear, 
  Bell, 
  CreditCard, 
  Lock, 
  Question, 
  ArrowLeft,
  CheckCircle,
  Crown,
  Sparkle,
  Download,
  Trash
} from 'phosphor-react-native';
import { RootStackNavigationProp } from '../navigation/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type UserProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  notification_preferences: {
    daily_reminders: boolean;
    new_features: boolean;
    insights: boolean;
  } | null;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
};

export const AccountScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dailyReminders, setDailyReminders] = useState(false);
  const [newFeatures, setNewFeatures] = useState(true);
  const [insights, setInsights] = useState(true);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  
  // Add this state variable near your other state declarations
  const [formState, setFormState] = useState({
    full_name: '',
    email: '',
    avatar_url: null,
    theme_preference: 'system' as const,
    notification_preferences: {
      daily_reminders: false,
      new_features: true,
      insights: true
    }
  });
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  useEffect(() => {
    if (formState) {
      setFullName(formState.full_name);
      setEmail(formState.email);
      setAvatarUrl(formState.avatar_url);
      setThemePreference(formState.theme_preference);
      
      if (formState.notification_preferences) {
        setDailyReminders(formState.notification_preferences.daily_reminders);
        setNewFeatures(formState.notification_preferences.new_features);
        setInsights(formState.notification_preferences.insights);
      }
    }
  }, [formState]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user with full metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      console.log('Fetching profile for user ID:', user.id);
      console.log('User metadata:', user.user_metadata);
      
      // Try to get profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .filter('user_id', 'eq', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
      }
      
      // If profile exists in database, use that
      if (data) {
        setProfile(data);
        updateFormState(data);
      } else {
        // Otherwise, create a profile using auth metadata
        const newProfile: UserProfile = {
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null,
          is_premium: false,
          notification_preferences: {
            daily_reminders: false,
            new_features: true,
            insights: true
          },
          theme_preference: 'system',
          created_at: new Date().toISOString()
        };
        
        // Save this profile to the database
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          Alert.alert('Error', 'Failed to create your profile. Please try again.');
        } else {
          setProfile(newProfile);
          updateFormState(newProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading your profile.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateFormState = (profileData: any) => {
    setFormState({
      full_name: profileData.full_name || '',
      email: profileData.email || '',
      avatar_url: profileData.avatar_url || null,
      theme_preference: profileData.theme_preference || 'system',
      notification_preferences: profileData.notification_preferences || {
        daily_reminders: false,
        new_features: true,
        insights: true
      }
    });
    
    // Also update avatar URL for display
    if (profileData.avatar_url) {
      setAvatarUrl(profileData.avatar_url);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update your profile');
        return;
      }
      
      const updates = {
        id: user.id,
        full_name: fullName.trim(),
        notification_preferences: {
          daily_reminders: dailyReminders,
          new_features: newFeatures,
          insights: insights
        },
        theme_preference: themePreference,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName.trim(),
          notification_preferences: {
            daily_reminders: dailyReminders,
            new_features: newFeatures,
            insights: insights
          },
          theme_preference: themePreference
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUploadingImage(true);
        
        // Get file extension
        const fileExtension = uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`;
        const filePath = `avatars/${fileName}`;
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user found');
        }
        
        // Convert image to blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        const publicUrl = urlData?.publicUrl;
        
        if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded image');
        }
        
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('user_id', user.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update local state
        setAvatarUrl(publicUrl);
        if (profile) {
          setProfile({
            ...profile,
            avatar_url: publicUrl
          });
        }
        
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Logout", 
            onPress: async () => {
              try {
                await supabase.auth.signOut();
                // The auth state change will automatically redirect to Landing
              } catch (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing logout dialog:', error);
    }
  };
  
  const handleSubscribe = async () => {
    try {
      // You can implement in-app purchase logic here
      Alert.alert(
        "Premium Subscription",
        "Would you like to upgrade to premium for $4.99/month?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Subscribe",
            onPress: async () => {
              // Placeholder for subscription logic
              Alert.alert(
                "Coming Soon",
                "Premium subscriptions will be available soon. Thank you for your interest!"
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in subscription process:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again later.');
    }
  };
  
  const handleManageSubscription = async () => {
    try {
      // Placeholder for subscription management
      Alert.alert(
        "Manage Subscription",
        "Your premium subscription is active. Would you like to manage your subscription?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Manage",
            onPress: () => {
              // Placeholder for subscription management logic
              Alert.alert(
                "Coming Soon",
                "Subscription management will be available soon. Thank you for your patience!"
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error managing subscription:', error);
      Alert.alert('Error', 'Failed to manage subscription. Please try again later.');
    }
  };
  
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
        return;
      }
      
      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id);
        
      if (userError || convError) {
        throw new Error('Failed to fetch your data');
      }
      
      // Create export file
      const exportData = {
        user_preferences: userData,
        conversations: conversationsData,
        exported_at: new Date().toISOString()
      };
      
      const fileUri = FileSystem.documentDirectory + 'jung_data_export.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      // Share the file
      await Sharing.shareAsync(fileUri);
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Header */}
        <View style={tw`flex-row items-center p-4 border-b border-gray-200`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`p-2`}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={tw`ml-2 text-xl font-semibold`}>
            Account
          </Text>
        </View>
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#6b46c1" />
            <Text style={tw`mt-4 text-gray-600`}>Loading your profile...</Text>
          </View>
        ) : (
          <ScrollView style={tw`flex-1 p-4`}>
            {/* Profile Section */}
            <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-6`}>
              <View style={tw`flex-row items-center mb-4`}>
                <User size={24} color="#6b46c1" weight="duotone" />
                <Text style={tw`ml-2 text-lg font-semibold text-gray-800`}>
                  Profile
                </Text>
              </View>
              
              {/* Profile Picture */}
              <View style={tw`items-center mb-6`}>
                <View style={tw`relative`}>
                  {uploadingImage ? (
                    <View style={tw`w-24 h-24 rounded-full bg-gray-200 justify-center items-center`}>
                      <ActivityIndicator size="small" color="#6b46c1" />
                    </View>
                  ) : avatarUrl ? (
                    <Image
                      source={{ 
                        uri: supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
                      }}
                      style={tw`w-24 h-24 rounded-full bg-gray-200`}
                    />
                  ) : (
                    <View style={tw`w-24 h-24 rounded-full bg-gray-200 justify-center items-center`}>
                      <User size={40} color="#9CA3AF" weight="duotone" />
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={tw`absolute bottom-0 right-0 bg-jung-purple w-8 h-8 rounded-full justify-center items-center border-2 border-white`}
                    onPress={handlePickImage}
                  >
                    <Camera size={16} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={tw`mt-2`}
                  onPress={handlePickImage}
                >
                  <Text style={tw`text-jung-purple text-sm font-medium`}>
                    Change Profile Picture
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Name */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 mb-1`}>Name</Text>
                <TextInput
                  style={tw`bg-gray-100 rounded-lg p-3 text-gray-800`}
                  placeholder="Enter your name"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              
              {/* Email */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 mb-1`}>Email</Text>
                <TextInput
                  style={tw`bg-gray-100 rounded-lg p-3 text-gray-500`}
                  value={email}
                  editable={false}
                />
                <Text style={tw`text-xs text-gray-500 mt-1`}>
                  Email cannot be changed. Contact support for assistance.
                </Text>
              </View>
              
              {/* Premium Status */}
              <View style={tw`bg-gray-100 rounded-lg p-4 mb-2`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center`}>
                    <Crown size={20} color={profile?.is_premium ? "#FFD700" : "#9CA3AF"} weight="fill" />
                    <Text style={tw`ml-2 font-medium ${profile?.is_premium ? "text-gray-800" : "text-gray-600"}`}>
                      {profile?.is_premium ? "Premium Member" : "Free Account"}
                    </Text>
                  </View>
                  
                  {profile?.is_premium ? (
                    <TouchableOpacity 
                      style={tw`bg-gray-200 rounded-lg py-1 px-3`}
                      onPress={handleManageSubscription}
                    >
                      <Text style={tw`text-sm text-gray-700`}>Manage</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={tw`bg-jung-purple rounded-lg py-1 px-3`}
                      onPress={handleSubscribe}
                    >
                      <Text style={tw`text-sm text-white`}>Upgrade</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            
            {/* Subscription Section */}
            <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-6`}>
              <View style={tw`flex-row items-center mb-4`}>
                <CreditCard size={24} color="#6b46c1" weight="duotone" />
                <Text style={tw`ml-2 text-lg font-semibold text-gray-800`}>
                  Subscription
                </Text>
              </View>
              
              <View>
                {profile?.is_premium ? (
                  <View>
                    <View style={tw`flex-row items-center mb-4 bg-purple-50 p-3 rounded-lg`}>
                      <CheckCircle size={20} color="#6b46c1" weight="fill" />
                      <Text style={tw`ml-2 text-gray-800`}>Premium features unlocked</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={tw`bg-gray-100 rounded-lg py-3 px-4 items-center`}
                      onPress={handleManageSubscription}
                    >
                      <Text style={tw`text-gray-700 font-medium`}>Manage Subscription</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={tw`text-gray-700 mb-4`}>
                      Upgrade to premium to unlock all features:
                    </Text>
                    
                    <View style={tw`mb-4`}>
                      <View style={tw`flex-row items-center mb-2`}>
                        <Sparkle size={18} color="#6b46c1" weight="fill" />
                        <Text style={tw`ml-2 text-gray-700`}>Access to all premium avatars</Text>
                      </View>
                      
                      <View style={tw`flex-row items-center mb-2`}>
                        <Sparkle size={18} color="#6b46c1" weight="fill" />
                        <Text style={tw`ml-2 text-gray-700`}>Unlimited conversations</Text>
                      </View>
                      
                      <View style={tw`flex-row items-center mb-2`}>
                        <Sparkle size={18} color="#6b46c1" weight="fill" />
                        <Text style={tw`ml-2 text-gray-700`}>Advanced insights and analysis</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={tw`bg-jung-purple rounded-lg py-3 px-4 items-center`}
                      onPress={handleSubscribe}
                    >
                      <Text style={tw`text-white font-medium`}>Upgrade to Premium</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {/* Notification Preferences */}
            <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-6`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Bell size={24} color="#6b46c1" weight="duotone" />
                <Text style={tw`ml-2 text-lg font-semibold text-gray-800`}>
                  Notifications
                </Text>
              </View>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text style={tw`text-gray-700`}>Daily Reminders</Text>
                  <Switch
                    value={dailyReminders}
                    onValueChange={setDailyReminders}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : dailyReminders ? '#6b46c1' : '#F3F4F6'}
                  />
                </View>
                <Text style={tw`text-gray-500 text-sm`}>
                  Receive daily reminders to reflect and journal
                </Text>
              </View>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text style={tw`text-gray-700`}>New Features</Text>
                  <Switch
                    value={newFeatures}
                    onValueChange={setNewFeatures}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : newFeatures ? '#6b46c1' : '#F3F4F6'}
                  />
                </View>
                <Text style={tw`text-gray-500 text-sm`}>
                  Get notified about new app features and updates
                </Text>
              </View>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text style={tw`text-gray-700`}>Insights</Text>
                  <Switch
                    value={insights}
                    onValueChange={setInsights}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : insights ? '#6b46c1' : '#F3F4F6'}
                  />
                </View>
                <Text style={tw`text-gray-500 text-sm`}>
                  Receive personalized Jungian insights based on your reflections
                </Text>
              </View>
            </View>
            
            {/* Theme Preferences */}
            <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-6`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Gear size={24} color="#6b46c1" weight="duotone" />
                <Text style={tw`ml-2 text-lg font-semibold text-gray-800`}>
                  Appearance
                </Text>
              </View>
              
              <View style={tw`mb-2`}>
                <Text style={tw`text-gray-700 mb-3`}>Theme</Text>
                
                <TouchableOpacity 
                  style={tw`flex-row items-center p-3 rounded-lg ${themePreference === 'light' ? 'bg-purple-100' : 'bg-gray-100'} mb-2`}
                  onPress={() => setThemePreference('light')}
                >
                  <View style={tw`w-6 h-6 rounded-full border-2 border-gray-400 mr-3 items-center justify-center`}>
                    {themePreference === 'light' && (
                      <View style={tw`w-3 h-3 rounded-full bg-jung-purple`} />
                    )}
                  </View>
                  <Text style={tw`text-gray-800`}>Light</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`flex-row items-center p-3 rounded-lg ${themePreference === 'dark' ? 'bg-purple-100' : 'bg-gray-100'} mb-2`}
                  onPress={() => setThemePreference('dark')}
                >
                  <View style={tw`w-6 h-6 rounded-full border-2 border-gray-400 mr-3 items-center justify-center`}>
                    {themePreference === 'dark' && (
                      <View style={tw`w-3 h-3 rounded-full bg-jung-purple`} />
                    )}
                  </View>
                  <Text style={tw`text-gray-800`}>Dark</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`flex-row items-center p-3 rounded-lg ${themePreference === 'system' ? 'bg-purple-100' : 'bg-gray-100'} mb-2`}
                  onPress={() => setThemePreference('system')}
                >
                  <View style={tw`w-6 h-6 rounded-full border-2 border-gray-400 mr-3 items-center justify-center`}>
                    {themePreference === 'system' && (
                      <View style={tw`w-3 h-3 rounded-full bg-jung-purple`} />
                    )}
                  </View>
                  <Text style={tw`text-gray-800`}>System</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Your Data */}
            <View style={tw`mt-6 border-t border-gray-200 pt-6`}>
              <Text style={tw`text-lg font-bold mb-4`}>Your Data</Text>
              
              <TouchableOpacity 
                style={tw`flex-row items-center py-3 border-b border-gray-200`}
                onPress={handleExportData}
              >
                <Download size={24} color="#4a5568" />
                <Text style={tw`ml-3 text-base`}>Export My Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={tw`flex-row items-center py-3 border-b border-gray-200`}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Trash size={24} color="#e53e3e" />
                <Text style={tw`ml-3 text-base text-red-600`}>Delete My Account & Data</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};