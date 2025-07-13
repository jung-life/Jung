import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import { GradientBackground } from '../components/GradientBackground';
import { Typography } from '../components/Typography';
import { DisclaimerRejectionModal } from '../components/DisclaimerRejectionModal';
import tw from '../lib/tailwind';
import { supabase, ensureUserPreferences, CURRENT_DISCLAIMER_VERSION } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const DisclaimerScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [healthDisclaimerChecked, setHealthDisclaimerChecked] = useState(false);
  const { setIsNewUser, handleDisclaimerAccepted, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    const routes = navigation.getState()?.routes || [];
    console.log('Available routes:', routes.map(route => route.name));
  }, []);

  const handleAccept = async () => {
    try {
      console.log('Accept button pressed, healthDisclaimerChecked:', healthDisclaimerChecked);
      setLoading(true);
      
      // Get the current user
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        setLoading(false);
        return;
      }
      
      console.log('Updating preferences for user:', user.id, '(type:', typeof user.id, ')');
      
      // Ensure the user_preferences record exists
      await ensureUserPreferences();
      
      // Try direct SQL approach to avoid type issues
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          INSERT INTO public.user_preferences (user_id, has_seen_disclaimer, disclaimer_version)
          VALUES ('${user.id}', true, ${CURRENT_DISCLAIMER_VERSION})
          ON CONFLICT (user_id) DO UPDATE SET 
            has_seen_disclaimer = true, 
            disclaimer_version = ${CURRENT_DISCLAIMER_VERSION},
            updated_at = now();
        `
      });
      
      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }
      
      console.log('Successfully updated user preferences');
      
      // Update the auth context
      if (setIsNewUser) {
        setIsNewUser(false);
      }
      if (handleDisclaimerAccepted) {
        handleDisclaimerAccepted();
      }
      
      // Navigate to PostLoginScreen after accepting the disclaimer
      console.log('Disclaimer accepted, navigating to PostLoginScreen');
      navigation.reset({
        index: 0,
        routes: [{ name: 'PostLoginScreen' }]
      });
      
    } catch (error) {
      console.error('Error accepting disclaimer:', error);
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const handleReconsider = () => {
    setShowRejectionModal(false);
  };

  const handleConfirmReject = async () => {
    try {
      console.log('User confirmed rejection, signing out...');
      setLoading(true);
      
      // Use AuthContext signOut method to ensure proper state management
      const { signOut } = useAuth();
      await signOut();
      console.log('User signed out successfully via AuthContext');
      
      // Close modal
      setShowRejectionModal(false);
      
    } catch (error) {
      console.error('Error signing out after rejection:', error);
      // Force sign out even if there's an error
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (fallbackError) {
        console.error('Fallback sign out also failed:', fallbackError);
      }
      setShowRejectionModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 px-6 py-4`}>
          {/* Header with logo */}
          <View style={tw`items-center mb-4`}>
            <Image 
              source={{ uri: supabase?.storage.from('assets').getPublicUrl('logo/jung-logo.png').data.publicUrl || '' }}
              style={tw`w-16 h-16 mb-2`}
              resizeMode="contain"
            />
            <Text style={tw`text-2xl font-bold text-jung-purple text-center`}>
              Terms of Use
            </Text>
            <Text style={tw`text-sm text-gray-500 text-center`}>
              Please read carefully before proceeding
            </Text>
          </View>
          
          {/* Card container for disclaimer content */}
          <View style={tw`bg-white rounded-2xl shadow-md overflow-hidden mb-4 flex-1`}>
            {/* Section tabs */}
            <View style={tw`flex-row border-b border-gray-200`}>
              <View style={tw`flex-1 py-3 px-4 bg-jung-purple-light`}>
                <Text style={tw`text-jung-purple font-bold text-center`}>
                  Important Information
                </Text>
              </View>
            </View>
            
            {/* Scrollable content */}
            <ScrollView 
              style={tw`p-5`}
              showsVerticalScrollIndicator={true}
            >
              <View style={tw`mb-6`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="information-circle" size={24} color="#4A3B78" />
                  <Text style={tw`text-lg font-bold text-jung-purple ml-2`}>
                    Not a Healthcare Service
                  </Text>
                </View>
                <Text style={tw`text-base leading-6 text-gray-700`}>
                  Jung is designed for self-reflection and personal growth. It is not a substitute for professional mental health services, medical advice, diagnosis, or treatment.
                </Text>
              </View>
              
              <View style={tw`mb-6`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="warning" size={24} color="#E67E22" />
                  <Text style={tw`text-lg font-bold text-amber-700 ml-2`}>
                    Emergency Situations
                  </Text>
                </View>
                <Text style={tw`text-base leading-6 text-gray-700`}>
                  If you're experiencing a mental health emergency, please contact emergency services immediately or reach out to a mental health professional. Jung is not equipped to handle crisis situations.
                </Text>
              </View>
              
              <View style={tw`mb-6`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="shield-checkmark" size={24} color="#27AE60" />
                  <Text style={tw`text-lg font-bold text-green-700 ml-2`}>
                    Privacy & Data
                  </Text>
                </View>
                <Text style={tw`text-base leading-6 text-gray-700`}>
                  Your conversations are stored securely, but please be mindful about sharing sensitive personal information. Review our privacy policy for more details on how your data is handled.
                </Text>
              </View>
              
              {/* Health notice card - moved inside ScrollView */}
              <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 mb-6`}>
                <View style={tw`flex-row items-start`}>
                  <Ionicons name="medkit" size={24} color="#E74C3C" style={tw`mt-1 mr-3`} />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-lg font-bold text-red-800 mb-1`}>
                      Important Health Notice
                    </Text>
                    <Text style={tw`text-red-700 leading-5`}>
                      Jung is not a healthcare provider and does not offer medical advice, diagnosis, or treatment. 
                      This app is designed for self-reflection and exploration only. If you're experiencing mental 
                      health concerns, please consult with a qualified healthcare professional.
                    </Text>
                  </View>
                </View>
              </View>
              
              <Text style={tw`text-base italic text-gray-600 mb-4`}>
                By continuing to use this application, you acknowledge that you understand and agree to these terms.
              </Text>
            </ScrollView>
          </View>
          
          {/* Checkbox agreement - outside scroll view but above buttons */}
          <View style={tw`flex-row items-start mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200`}>
            <TouchableOpacity 
              style={tw`p-2 mr-2`} 
              onPress={() => setHealthDisclaimerChecked(!healthDisclaimerChecked)}
            >
              <View style={tw`w-6 h-6 border-2 border-jung-purple rounded-md items-center justify-center`}>
                {healthDisclaimerChecked && (
                  <Ionicons name="checkmark" size={18} color="#4A3B78" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={tw`flex-1 text-gray-700`}>
              I understand that Jung is not a healthcare provider and does not offer medical advice. 
              I will seek professional help for any mental health concerns.
            </Text>
          </View>
          
          {/* Action buttons */}
          <View style={tw`flex-row justify-between w-full mb-2`}>
            <TouchableOpacity
              style={tw`rounded-xl py-4 px-6 w-[48%] items-center shadow-md bg-white border border-red-300`}
              onPress={handleReject}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#E74C3C" />
              ) : (
                <Text style={tw`text-red-600 font-bold text-lg`}>I Reject</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                tw`rounded-xl py-4 px-6 w-[48%] items-center shadow-md bg-jung-purple border-2 border-indigo-300`,
                (!healthDisclaimerChecked) && tw`opacity-50 border-gray-300`,
              ]}
              onPress={handleAccept}
              disabled={!healthDisclaimerChecked || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#A5B4FC" />
              ) : (
                <Text style={tw`text-indigo-300 font-bold text-lg`}>I Accept</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={tw`items-center`}>
            <Text style={tw`text-xs text-gray-500`}>
              Disclaimer Version: {CURRENT_DISCLAIMER_VERSION}
            </Text>
          </View>
        </View>

        {/* Custom Rejection Modal */}
        <DisclaimerRejectionModal
          visible={showRejectionModal}
          onReconsider={handleReconsider}
          onConfirmReject={handleConfirmReject}
          loading={loading}
        />
      </SafeAreaView>
    </GradientBackground>
  );
};
