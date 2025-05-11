import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, ArrowLeft, Gear } from 'phosphor-react-native'; // Added Gear
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import TouchableJung from '../components/TouchableJung';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';

export const ProfileScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view your profile');
        navigation.navigate('LandingScreen'); // Corrected from 'Landing'
        return;
      }
      
      // Set the user's name from their email
      setUserName(user.email?.split('@')[0] || 'User');
      
      // Check if profiles table exists
      try {
        // Create profiles table if it doesn't exist
        await supabase.rpc('create_profiles_if_not_exists');
        
        // Fetch the user's profile
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data && data.avatar_url) {
          // Get the public URL for the avatar
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
            
          setAvatarUrl(publicUrlData.publicUrl);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload an avatar');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadAvatar(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const takePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a photo');
        return;
      }
      
      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadAvatar(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  
  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to upload an avatar');
        return;
      }
      
      // Create a unique file name
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Fetch the image data
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Ensure avatars bucket exists
      try {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        });
      } catch (error) {
        // Bucket might already exist, continue
        console.log('Bucket creation error (might already exist):', error);
      }
      
      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, blob);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Create profiles table if it doesn't exist
      await supabase.rpc('create_profiles_if_not_exists');
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        });
        
      if (updateError) {
        throw updateError;
      }
      
      // Update the UI
      setAvatarUrl(publicUrlData.publicUrl);
      
      Alert.alert('Success', 'Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <View style={tw`flex-row items-center justify-between px-5 py-4 border-b border-gray-200/50`}>
          <View style={tw`flex-row items-center`}>
            <TouchableJung
              onPress={() => navigation.goBack()}
              style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-gold`}
            >
              <ArrowLeft size={24} color="#D4AF37" weight="light" />
            </TouchableJung>
            <Typography variant="title" style={tw`ml-4`}>Your Profile</Typography>
          </View>
          {/* Settings Icon Button in Header */}
          <TouchableJung
            onPress={() => navigation.navigate('SettingsScreen')}
            style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-gold`}
          >
            <Gear size={24} color="#D4AF37" weight="light" />
          </TouchableJung>
        </View>
        
        <ScrollView contentContainerStyle={tw`p-6 items-center`}>
          {loading ? (
            <ActivityIndicator size="large" color="#8A2BE2" />
          ) : (
            <View style={tw`w-full items-center`}>
              <View style={tw`mb-8 items-center`}>
                <View style={tw`relative`}>
                  {avatarUrl ? (
                    <Image 
                      source={{ uri: avatarUrl }} 
                      style={tw`w-32 h-32 rounded-full`} 
                    />
                  ) : (
                    <View style={tw`w-32 h-32 rounded-full bg-gray-200 items-center justify-center`}>
                      <Text style={tw`text-4xl text-gray-400`}>
                        {userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={tw`absolute bottom-0 right-0 bg-jung-purple w-10 h-10 rounded-full items-center justify-center border-2 border-white`}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    <Camera size={20} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>
                
                <Text style={tw`text-2xl font-bold mt-4`}>{userName}</Text>
              </View>
              
              <View style={tw`w-full`}>
                <TouchableOpacity 
                  style={tw`bg-jung-purple py-3 px-6 rounded-lg shadow-sm mb-4`}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Text style={tw`text-white font-semibold text-center`}>
                    {uploading ? 'Uploading...' : 'Choose from Gallery'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`bg-white border border-jung-purple py-3 px-6 rounded-lg shadow-sm`}
                  onPress={takePhoto}
                  disabled={uploading}
                >
                  <Text style={tw`text-jung-purple font-semibold text-center`}>
                    {uploading ? 'Uploading...' : 'Take a Photo'}
                  </Text>
                </TouchableOpacity>

                {/* Separator */}
                <View style={tw`h-px bg-gray-200 w-full my-6`} />

                {/* Settings Button Option */}
                <TouchableOpacity 
                  style={tw`bg-gray-100 border border-gray-300 py-3 px-6 rounded-lg shadow-sm w-full flex-row items-center justify-center`}
                  onPress={() => navigation.navigate('SettingsScreen')}
                >
                  <Gear size={20} color={tw.color('jung-purple')} style={tw`mr-2`} />
                  <Text style={tw`text-jung-purple font-semibold text-center`}>
                    App Settings
                  </Text>
                </TouchableOpacity>

              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};
