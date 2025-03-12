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
  id?: string;
  user_id?: string;
  email: string;
  username?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  [key: string]: any; // Allow any other properties
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
  const [formState, setFormState] = useState<{
    full_name: string;
    email: string;
    username?: string;
    avatar_url: string | null;
    theme_preference: 'light' | 'dark' | 'system';
    notification_preferences: {
      daily_reminders: boolean;
      new_features: boolean;
      insights: boolean;
    };
  }>({
    full_name: '',
    email: '',
    username: '',
    avatar_url: null,
    theme_preference: 'system',
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
      setDailyReminders(formState.notification_preferences.daily_reminders);
      setNewFeatures(formState.notification_preferences.new_features);
      setInsights(formState.notification_preferences.insights);
    }
  }, [formState]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Fetch the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormState({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          email: data.email || user?.email || '',
          username: data.username || user?.email?.split('@')[0] || '',
          avatar_url: data.avatar_url,
          theme_preference: data.theme_preference || 'system',
          notification_preferences: {
            daily_reminders: data.notification_preferences?.daily_reminders || false,
            new_features: data.notification_preferences?.new_features || true,
            insights: data.notification_preferences?.insights || true
          }
        });

        if (data.avatar_url) {
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          setAvatarUrl(publicUrlData.publicUrl);
        }
      } else {
        setFormState({
          full_name: user.user_metadata?.full_name || '',
          email: user?.email || '',
          username: '',
          avatar_url: null,
          theme_preference: 'system',
          notification_preferences: {
            daily_reminders: false,
            new_features: true,
            insights: true
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload an avatar.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingImage(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        return;
      }
      
      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique file path
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, blob);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString()
        });
        
      if (updateError) {
        throw updateError;
      }
      
      // Update the UI
      setAvatarUrl(publicUrlData.publicUrl);
      setFormState(prev => ({
        ...prev,
        avatar_url: filePath
      }));
      
      Alert.alert('Success', 'Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        return;
      }
      
      // Prepare the profile data
      const profileData = {
        id: user.id,
        full_name: fullName,
        email: email,
        avatar_url: formState.avatar_url,
        theme_preference: themePreference,
        notification_preferences: {
          daily_reminders: dailyReminders,
          new_features: newFeatures,
          insights: insights
        },
        updated_at: new Date().toISOString()
      };
      
      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);
        
      if (error) {
        throw error;
      }
      
      // Update the local state
      setProfile({
        ...profile,
        ...profileData
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        return;
      }
      
      // Fetch user data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Fetch conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id);
        
      if (conversationsError) {
        throw conversationsError;
      }
      
      // Prepare the export data
      const exportData = {
        profile: profileData || {},
        conversations: conversationsData || [],
        exportDate: new Date().toISOString()
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Save to a temporary file
      const fileUri = `${FileSystem.documentDirectory}jung-data-export.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Your Jung Data',
        UTI: 'public.json'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        return;
      }
      
      // Delete the user's data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      // Delete the user's conversations
      await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);
        
      // Delete the user's account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        throw error;
      }
      
      // Sign out
      await supabase.auth.signOut();
      
      // Navigate to the landing screen
      navigation.navigate('LandingScreen');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleSubscribe = async () => {
    try {
      Alert.alert(
        "Premium Subscription",
        "Would you like to upgrade to a premium subscription?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Subscribe",
            onPress: () => {
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
      console.error('Error initiating subscription:', error);
      Alert.alert('Error', 'Failed to initiate subscription process. Please try again later.');
    }
  };
  
  const handleCreateProfile = async () => {
    try {
      setSaving(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        return;
      }
      
      // Create a new profile
      const { data: insertData, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            theme_preference: 'system',
            notification_preferences: {
              daily_reminders: false,
              new_features: true,
              insights: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) {
        console.error('Error creating profile:', error);
        Alert.alert('Error', 'Failed to create profile. Please try again.');
      } else {
        console.log('Profile created successfully:', insertData);
        if (insertData && insertData.length > 0) {
          setProfile(insertData[0]);
          Alert.alert('Success', 'Profile created successfully!');
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigation.navigate('LandingScreen'); // Navigate to an existing screen
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        {/* Header */}
        <View style={tw`flex-row items-center justify-between px-4 py-2`}>
          <TouchableOpacity
            style={tw`p-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#4A3B78" weight="bold" />
          </TouchableOpacity>
          
          <Text style={tw`text-xl font-bold text-jung-purple`}>My Account</Text>
          
          <View style={tw`w-10`} />
        </View>
        
        {loading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>Loading your profile...</Text>
          </View>
        ) : (
          <ScrollView 
            style={tw`flex-1 px-4`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-10`}
          >
            {/* Profile Card */}
            <View style={tw`bg-white rounded-2xl shadow-md p-6 mb-6 mt-2`}>
              <View style={tw`items-center mb-4`}>
                <View style={tw`relative`}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={tw`w-24 h-24 rounded-full bg-gray-200`}
                    />
                  ) : (
                    <View style={tw`w-24 h-24 rounded-full bg-gray-200 items-center justify-center`}>
                      <Text style={tw`text-3xl text-gray-400`}>
                        {profile?.username ? profile.username.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={tw`absolute bottom-0 right-0 bg-jung-purple w-8 h-8 rounded-full items-center justify-center border-2 border-white`}
                    onPress={handlePickImage}
                  >
                    <Camera size={16} color="#FFFFFF" weight="bold" />
                  </TouchableOpacity>
                </View>
                
                <Text style={tw`mt-4 text-xl font-bold text-gray-800`}>
                  {profile?.full_name || email?.split('@')[0] || 'User'}
                </Text>
                <Text style={tw`text-gray-500`}>{email}</Text>
                
                {/* Premium Badge or Upgrade Button */}
                {profile?.is_premium ? (
                  <View style={tw`flex-row items-center mt-2 bg-yellow-100 px-3 py-1 rounded-full`}>
                    <Crown size={16} color="#D4AF37" weight="fill" />
                    <Text style={tw`ml-1 text-yellow-800 font-medium text-sm`}>Premium Member</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      tw`flex-row items-center justify-center rounded-xl py-3 px-4 shadow-md mt-2`,
                      {
                        backgroundImage: 'linear-gradient(to right, #FF0080, #FF8C00, #FFD700, #00FF00, #00BFFF, #8A2BE2)',
                        backgroundSize: '200% 100%',
                        animation: 'rainbow-animation 6s linear infinite'
                      }
                    ]}
                    onPress={handleSubscribe}
                  >
                    <Crown size={20} color="#ffffff" weight="fill" />
                    <Text style={tw`ml-2 text-white font-bold`}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Profile Form */}
              <View style={tw`mt-6`}>
                <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Profile Information</Text>
                
                <View style={tw`mb-4`}>
                  <Text style={tw`text-gray-600 mb-1`}>Full Name</Text>
                  <TextInput
                    style={tw`bg-gray-100 rounded-lg px-4 py-3 text-gray-800`}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                  />
                </View>
                
                <View style={tw`mb-4`}>
                  <Text style={tw`text-gray-600 mb-1`}>Email</Text>
                  <TextInput
                    style={tw`bg-gray-100 rounded-lg px-4 py-3 text-gray-800`}
                    value={email}
                    editable={false}
                    placeholder="Your email address"
                  />
                </View>
                
                <TouchableOpacity
                  style={tw`bg-jung-purple rounded-xl py-3 px-4 items-center mt-2`}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={tw`text-white font-bold`}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Preferences Card */}
            <View style={tw`bg-white rounded-2xl shadow-md p-6 mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Preferences</Text>
              
              {/* Theme Preference */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-600 mb-2`}>Theme</Text>
                
                <View style={tw`flex-row justify-between`}>
                  <TouchableOpacity
                    style={[
                      tw`flex-1 items-center p-3 rounded-lg mr-2`,
                      themePreference === 'light' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => setThemePreference('light')}
                  >
                    <Text style={[
                      tw`font-medium`,
                      themePreference === 'light' ? tw`text-white` : tw`text-gray-700`
                    ]}>Light</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      tw`flex-1 items-center p-3 rounded-lg mr-2`,
                      themePreference === 'dark' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => setThemePreference('dark')}
                  >
                    <Text style={[
                      tw`font-medium`,
                      themePreference === 'dark' ? tw`text-white` : tw`text-gray-700`
                    ]}>Dark</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      tw`flex-1 items-center p-3 rounded-lg`,
                      themePreference === 'system' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => setThemePreference('system')}
                  >
                    <Text style={[
                      tw`font-medium`,
                      themePreference === 'system' ? tw`text-white` : tw`text-gray-700`
                    ]}>System</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Notifications */}
              <Text style={tw`text-gray-600 mb-2`}>Notifications</Text>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <Bell size={20} color="#4A3B78" />
                    <Text style={tw`ml-2 text-gray-700`}>Daily Reminders</Text>
                  </View>
                  <Switch
                    value={dailyReminders}
                    onValueChange={setDailyReminders}
                    trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                    thumbColor={dailyReminders ? '#4A3B78' : '#F9FAFB'}
                  />
                </View>
              </View>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <Sparkle size={20} color="#4A3B78" />
                    <Text style={tw`ml-2 text-gray-700`}>New Features</Text>
                  </View>
                  <Switch
                    value={newFeatures}
                    onValueChange={setNewFeatures}
                    trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                    thumbColor={newFeatures ? '#4A3B78' : '#F9FAFB'}
                  />
                </View>
              </View>
              
              <View style={tw`mb-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <Gear size={20} color="#4A3B78" />
                    <Text style={tw`ml-2 text-gray-700`}>Insights</Text>
                  </View>
                  <Switch
                    value={insights}
                    onValueChange={setInsights}
                    trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                    thumbColor={insights ? '#4A3B78' : '#F9FAFB'}
                  />
                </View>
              </View>
            </View>
            
            {/* Data Management Card */}
            <View style={tw`bg-white rounded-2xl shadow-md p-6 mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Data Management</Text>
              
              <TouchableOpacity 
                style={tw`flex-row items-center py-3`}
                onPress={handleExportData}
              >
                <Download size={20} color="#4A3B78" />
                <Text style={tw`ml-3 text-gray-700`}>Export My Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={tw`flex-row items-center py-3`}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Trash size={20} color="#E53E3E" />
                <Text style={tw`ml-3 text-red-600`}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
            
            {/* Create Profile Button (if needed) */}
            {!profile?.id && (
              <TouchableOpacity
                style={tw`bg-jung-purple rounded-xl py-4 px-6 shadow-md mb-6`}
                onPress={handleCreateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={tw`text-white font-bold text-center text-lg`}>Create Profile</Text>
                )}
              </TouchableOpacity>
            )}
            
            {/* Sign Out Button */}
            <TouchableOpacity
              style={tw`flex-row items-center justify-center py-3 mb-10`}
              onPress={handleSignOut}
            >
              <SignOut size={20} color="#4A3B78" />
              <Text style={tw`ml-2 text-jung-purple font-medium`}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};