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
import { useTheme, ThemeType } from '../contexts/ThemeContext'; // Import useTheme and ThemeType

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
  // Wrap useTheme in a try/catch to help debug any context issues
  const { theme: currentTheme, setTheme } = useTheme();
  console.log('[AccountScreen] Current theme:', currentTheme); // Add logging

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
      // Theme is now managed by context, but we might still load it into formState initially
      // setThemePreference(formState.theme_preference); // Remove this line
      setDailyReminders(formState.notification_preferences.daily_reminders);
      setNewFeatures(formState.notification_preferences.new_features);
      setInsights(formState.notification_preferences.insights);
    }
  }, [formState]);

  const fetchUserProfile = async () => {
    setLoading(true);
    console.log('[AccountScreen] Starting profile fetch...');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('[AccountScreen] User fetch error:', userError);
        throw userError;
      }

      if (!user?.id) {
        console.log('[AccountScreen] No authenticated user ID found.');
        Alert.alert('Error', 'Could not find user information. Please try logging in again.');
        setLoading(false);
        return;
      }

      console.log(`[AccountScreen] Fetching profile for user ID: ${user.id}`);
      console.log(`[AccountScreen] User email: ${user.email}`);
      console.log(`[AccountScreen] User metadata:`, user.user_metadata);

      // Query using the 'user_id' column which should match auth.users.id (UUID)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id) // Query by user_id (UUID) matching auth.users.id
        .maybeSingle();

      if (profileError) {
        console.error('[AccountScreen] Error fetching profile by ID:', profileError);
        // Don't immediately create profile, maybe it exists but query failed?
        // Let's check if the error indicates the table doesn't exist or similar critical issue
        if (profileError.code === '42P01') { // undefined_table
           Alert.alert('Database Error', 'Profiles table not found. Please contact support.');
        } else {
           Alert.alert('Error', `Failed to load profile data: ${profileError.message}`);
        }
        // Fallback: Try to use auth data directly for display
        setFormState({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          username: user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || null, // Use metadata avatar if available
          theme_preference: 'system', // Default
          notification_preferences: { daily_reminders: false, new_features: true, insights: true } // Defaults
        });
        setProfile(null); // Indicate profile wasn't loaded from DB
      } else if (profileData) {
        console.log('[AccountScreen] Profile found:', profileData);
        setProfile(profileData); // Store the fetched profile

        // Set form state using profile data, falling back to auth data if needed
        setFormState({
          full_name: profileData.full_name || user.user_metadata?.full_name || '',
          email: profileData.email || user.email || '', // Prefer profile email, fallback to auth email
          username: profileData.username || user.email?.split('@')[0] || '',
          avatar_url: profileData.avatar_url, // This is the path in storage
          theme_preference: profileData.theme_preference || currentTheme, // Use profile theme or context theme
          notification_preferences: {
            daily_reminders: profileData.notification_preferences?.daily_reminders ?? false,
            new_features: profileData.notification_preferences?.new_features ?? true,
            insights: profileData.notification_preferences?.insights ?? true
          }
        });

        // Get public URL for display if avatar_url exists in profile
        if (profileData.avatar_url) {
          console.log(`[AccountScreen] Getting public URL for avatar path: ${profileData.avatar_url}`);
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(profileData.avatar_url); // Use the path from profile
          console.log('[AccountScreen] Public URL data:', publicUrlData);
          setAvatarUrl(publicUrlData?.publicUrl || null); // Set the display URL
        } else {
           // If no avatar_url in profile, check user_metadata from auth (e.g., Google avatar)
           setAvatarUrl(user.user_metadata?.avatar_url || null);
           console.log(`[AccountScreen] No avatar path in profile, using metadata URL: ${user.user_metadata?.avatar_url}`);
        }

      } else {
        // Profile does not exist in the database for this user ID
        console.log('[AccountScreen] No profile found for this user ID. Trigger should have created one.');
         // Attempt to create profile explicitly as a fallback (though the trigger should handle this)
         // Alert.alert('Profile Issue', 'User profile not found. Attempting to create one.');
         // await createUserProfile(user.id); // Consider if this is needed or if trigger is reliable

         // For now, just use auth data for display
         Alert.alert('Profile Not Found', 'Your profile data could not be loaded. Displaying information from your login provider.');
         setFormState({
           full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
           email: user.email || '',
           username: user.email?.split('@')[0] || '',
           avatar_url: user.user_metadata?.avatar_url || null, // Use metadata avatar
           theme_preference: currentTheme, // Use context theme
           notification_preferences: { daily_reminders: false, new_features: true, insights: true }
         });
         setAvatarUrl(user.user_metadata?.avatar_url || null); // Set display URL from metadata
         setProfile(null);
      }
    } catch (error) {
      console.error('[AccountScreen] Unexpected error in fetchUserProfile:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading your profile.');
      // Attempt to set form state from auth data as a last resort
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            setFormState({
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              email: user.email || '',
              username: user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              theme_preference: currentTheme, // Use context theme
              notification_preferences: { daily_reminders: false, new_features: true, insights: true }
            });
            setAvatarUrl(user.user_metadata?.avatar_url || null);
         }
       } catch (authError) {
         console.error('[AccountScreen] Failed to get auth user data on error fallback:', authError);
       }
    } finally {
      setLoading(false);
      console.log('[AccountScreen] Profile fetch finished.');
    }
  };

  // Helper function to create a user profile
  const createUserProfile = async (userId: string) => {
    try {
      console.log('Creating new profile for user ID:', userId);
      
      // Get the user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found when creating profile');
      }
      
      // Create a default profile
      const newProfile = {
        // Remove id field which is causing the integer type error
        user_id: userId, // This is the foreign key to auth.users (UUID)
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: null,
        theme_preference: 'system',
        notification_preferences: {
          daily_reminders: false,
          new_features: true,
          insights: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert the profile
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating profile:', error);
        
        // Show error but don't throw, so we can still use the app
        Alert.alert(
          'Profile Creation Issue',
          'There was an issue creating your profile. Some features may not work properly.',
          [{ text: 'OK' }]
        );
        
        // Set the local profile state anyway so the app is usable
        // Need to ensure email is never undefined for type compatibility
        const safeProfile = {
          ...newProfile,
          email: newProfile.email || ''
        };
        setProfile(safeProfile);
        setFormState({
        full_name: newProfile.full_name,
        email: newProfile.email || '',
        username: newProfile.full_name,
        avatar_url: null,
        theme_preference: currentTheme, // Use context theme
        notification_preferences: {
          daily_reminders: false,
          new_features: true,
            insights: true
          }
        });
        return;
      }
      
      console.log('Profile created successfully:', data);
      setProfile(data);
      
      // Update form state with the newly created profile
      setFormState({
        full_name: data.full_name || '',
        email: data.email || '',
        username: data.username || data.email?.split('@')[0] || '',
        avatar_url: data.avatar_url,
        theme_preference: data.theme_preference || currentTheme, // Use context theme
        notification_preferences: {
          daily_reminders: data.notification_preferences?.daily_reminders || false,
          new_features: data.notification_preferences?.new_features || true,
          insights: data.notification_preferences?.insights || true
        }
      });
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      // Show error but don't throw
      Alert.alert(
        'Profile Error',
        'An error occurred while setting up your profile. Please try again later.',
        [{ text: 'OK' }]
      );
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
          user_id: user.id, // Use user_id (UUID) instead of id
          avatar_url: filePath,
          updated_at: new Date().toISOString()
        });
        
      if (updateError) {
        throw updateError;
      }
      
      // Update the UI
      setAvatarUrl(publicUrlData.publicUrl); // Update display URL
      // Update the form state's avatar_url which stores the *path*
      setFormState(prev => ({
        ...prev,
        avatar_url: filePath // Store the path, not the public URL
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
      
      // Prepare the profile data for upsert
        // Ensure we use the correct avatar_url (path) from formState
        // Also save the theme preference from the context
        const profileDataToSave = {
          // Remove id field which is causing the integer type error
          user_id: user.id, // Use user_id as the primary identifier (UUID)
          full_name: fullName,
          // email: email, // Email usually shouldn't be updated here, handle separately if needed
          avatar_url: formState.avatar_url, // Use the path stored in formState
          theme_preference: currentTheme, // Save the theme from context
          notification_preferences: {
            daily_reminders: dailyReminders,
            new_features: newFeatures,
          insights: insights
        },
        updated_at: new Date().toISOString()
      };
      
      // Update the profile using upsert
      const { data: upsertData, error: upsertError } = await supabase // Renamed error variable
        .from('profiles')
        .upsert(profileDataToSave)
        .select() // Select the updated/inserted row
        .single(); // Expect a single row back

      if (upsertError) { // Use the renamed error variable
        console.error('[AccountScreen] Error saving profile:', upsertError);
        throw upsertError; // Throw the renamed error variable
      }

      console.log('[AccountScreen] Profile saved successfully:', upsertData);

      // Update the local profile state with the data returned from upsert
      setProfile(upsertData);

      // Optionally update formState as well if upsert returned different values
      // (though ideally upsertData should match profileDataToSave)
      setFormState(prev => ({
         ...prev,
         full_name: upsertData.full_name || prev.full_name,
         avatar_url: upsertData.avatar_url || prev.avatar_url,
         theme_preference: upsertData.theme_preference || prev.theme_preference,
         notification_preferences: upsertData.notification_preferences || prev.notification_preferences,
      }));
      // Update display avatar URL if it changed
      if (upsertData.avatar_url) {
         const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(upsertData.avatar_url);
         setAvatarUrl(publicUrlData?.publicUrl || null);
      } else {
         setAvatarUrl(null);
      }


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
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData?.user?.id) {
        console.log('No user ID found');
        setIsLoading(false);
        return;
      }
      
      // Fetch user data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.user.id) // Use user_id (UUID) instead of id
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Fetch conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userData.user.id);
        
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
      Alert.alert('Error', 'Failed to export data');
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
      
      // Delete the user's data using user_id
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id); // Match on user_id (UUID)
        
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
            // Remove id field which is causing the integer type error
            user_id: user.id, // Use user_id as the primary identifier (UUID)
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
      setIsLoading(true);
      await supabase.auth.signOut();
      navigation.navigate('LandingScreen');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
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
                      currentTheme === 'light' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => {
                      console.log('[AccountScreen] Setting theme to light');
                      setTheme('light' as ThemeType);
                    }}
                  >
                    <Text style={[
                      tw`font-medium`,
                      currentTheme === 'light' ? tw`text-white` : tw`text-gray-700`
                    ]}>Light</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      tw`flex-1 items-center p-3 rounded-lg mr-2`,
                      currentTheme === 'dark' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => {
                      console.log('[AccountScreen] Setting theme to dark');
                      setTheme('dark' as ThemeType);
                    }}
                  >
                    <Text style={[
                      tw`font-medium`,
                      currentTheme === 'dark' ? tw`text-white` : tw`text-gray-700`
                    ]}>Dark</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      tw`flex-1 items-center p-3 rounded-lg`,
                      currentTheme === 'system' ? tw`bg-jung-purple` : tw`bg-gray-100`
                    ]}
                    onPress={() => {
                      console.log('[AccountScreen] Setting theme to system');
                      setTheme('system' as ThemeType);
                    }}
                  >
                    <Text style={[
                      tw`font-medium`,
                      currentTheme === 'system' ? tw`text-white` : tw`text-gray-700`
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
