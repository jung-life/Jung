import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { initializeGoogleSignIn } from '../lib/googleSignIn';
import tw from '../lib/tailwind';

interface GoogleSignInTroubleshootProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  error?: string;
}

export const GoogleSignInTroubleshoot: React.FC<GoogleSignInTroubleshootProps> = ({
  visible,
  onClose,
  onRetry,
  error
}) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      runDiagnostics();
    }
  }, [visible]);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results = {
        initialized: false,
        hasPlayServices: false,
        isSignedIn: false,
        currentUser: null,
        configurationStatus: false,
        timestamp: new Date().toISOString()
      };

      // Check initialization
      try {
        results.initialized = initializeGoogleSignIn();
      } catch (error) {
        console.error('Initialization error:', error);
      }

      // Check Google Play Services
      try {
        await GoogleSignin.hasPlayServices();
        results.hasPlayServices = true;
      } catch (error) {
        console.error('Play Services error:', error);
      }

      // Check if user is signed in and get current user
      try {
        results.currentUser = await GoogleSignin.getCurrentUser();
        results.isSignedIn = !!results.currentUser;
      } catch (error) {
        console.error('Current user check error:', error);
        results.isSignedIn = false;
        results.currentUser = null;
      }

      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAndRetry = async () => {
    try {
      setLoading(true);

      // Sign out from Google
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('No Google session to clear');
      }

      // Re-initialize
      initializeGoogleSignIn();

      Alert.alert(
        'Reset Complete',
        'Google Sign-In has been reset. Please try signing in again.',
        [{ text: 'OK', onPress: () => { onClose(); onRetry(); } }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  const getTroubleshootingSteps = () => {
    const steps = [];

    if (!diagnostics?.hasPlayServices) {
      steps.push({
        title: 'Google Play Services',
        description: 'Google Play Services are not available on this device.',
        action: 'This is required for Google Sign-In on Android devices.',
        severity: 'high'
      });
    }

    if (!diagnostics?.initialized) {
      steps.push({
        title: 'Configuration Issue',
        description: 'Google Sign-In is not properly configured.',
        action: 'Check that OAuth client IDs are correctly set in the app configuration.',
        severity: 'high'
      });
    }

    if (error?.includes('No ID token')) {
      steps.push({
        title: 'OAuth Configuration',
        description: 'The OAuth client is not configured to return ID tokens.',
        action: 'In Google Cloud Console, ensure your OAuth client has the correct configuration.',
        severity: 'high'
      });
    }

    if (steps.length === 0) {
      steps.push({
        title: 'General Troubleshooting',
        description: 'Try the following steps to resolve sign-in issues.',
        action: 'Clear the Google session and try again.',
        severity: 'medium'
      });
    }

    return steps;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return 'Warning';
      case 'medium': return 'Info';
      default: return 'CheckCircle';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl max-h-5/6`}>
          {/* Header */}
          <View style={tw`p-6 border-b border-gray-200`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-xl font-bold text-gray-800`}>
                Google Sign-In Troubleshoot
              </Text>
              <TouchableOpacity onPress={onClose}>
                <SafePhosphorIcon iconType="X" size={24} color="#6B7280" weight="bold" />
              </TouchableOpacity>
            </View>
            {error && (
              <View style={tw`mt-3 p-3 bg-red-50 border border-red-200 rounded-lg`}>
                <Text style={tw`text-red-800 text-sm`}>{error}</Text>
              </View>
            )}
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
            {/* Diagnostics */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>System Diagnostics</Text>

              {loading ? (
                <View style={tw`bg-gray-50 rounded-lg p-4`}>
                  <Text style={tw`text-gray-600 text-center`}>Running diagnostics...</Text>
                </View>
              ) : diagnostics ? (
                <View style={tw`space-y-3`}>
                  <DiagnosticItem
                    label="Google Sign-In Initialized"
                    status={diagnostics.initialized}
                  />
                  <DiagnosticItem
                    label="Google Play Services Available"
                    status={diagnostics.hasPlayServices}
                  />
                  <DiagnosticItem
                    label="Currently Signed In"
                    status={diagnostics.isSignedIn}
                  />
                  {diagnostics.currentUser && (
                    <View style={tw`bg-blue-50 border border-blue-200 rounded-lg p-3`}>
                      <Text style={tw`text-blue-800 font-medium text-sm`}>
                        Current User: {diagnostics.currentUser.user?.email}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

            {/* Troubleshooting Steps */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Troubleshooting Steps</Text>

              {getTroubleshootingSteps().map((step, index) => (
                <View key={index} style={tw`mb-4 border border-gray-200 rounded-lg p-4`}>
                  <View style={tw`flex-row items-start mb-2`}>
                    <SafePhosphorIcon
                      iconType={getSeverityIcon(step.severity) as any}
                      size={20}
                      color={step.severity === 'high' ? '#DC2626' : step.severity === 'medium' ? '#D97706' : '#059669'}
                      weight="bold"
                    />
                    <Text style={tw`font-bold text-gray-800 ml-2 flex-1`}>
                      {step.title}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-600 mb-2 text-sm`}>
                    {step.description}
                  </Text>
                  <Text style={tw`${getSeverityColor(step.severity)} text-sm font-medium`}>
                    Solution: {step.action}
                  </Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={tw`space-y-3`}>
              <TouchableOpacity
                onPress={runDiagnostics}
                disabled={loading}
                style={tw`bg-blue-600 rounded-xl py-4 px-6 ${loading ? 'opacity-50' : ''}`}
              >
                <Text style={tw`text-white font-bold text-center`}>
                  Run Diagnostics Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearAndRetry}
                disabled={loading}
                style={tw`bg-jung-purple rounded-xl py-4 px-6 ${loading ? 'opacity-50' : ''}`}
              >
                <Text style={tw`text-white font-bold text-center`}>
                  Clear Session & Retry
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { onClose(); onRetry(); }}
                style={tw`bg-gray-100 border border-gray-200 rounded-xl py-4 px-6`}
              >
                <Text style={tw`text-gray-700 font-bold text-center`}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface DiagnosticItemProps {
  label: string;
  status: boolean;
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ label, status }) => (
  <View style={tw`flex-row items-center justify-between bg-gray-50 rounded-lg p-3`}>
    <Text style={tw`text-gray-700 font-medium`}>{label}</Text>
    <View style={tw`flex-row items-center`}>
      <SafePhosphorIcon
        iconType={status ? "CheckCircle" : "XCircle"}
        size={20}
        color={status ? "#059669" : "#DC2626"}
        weight="bold"
      />
      <Text style={tw`ml-2 font-bold ${status ? 'text-green-600' : 'text-red-600'}`}>
        {status ? 'OK' : 'Error'}
      </Text>
    </View>
  </View>
);