import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { revenueCatService } from '../lib/revenueCatService';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { useSubscription } from '../hooks/useSubscription';
import tw from '../lib/tailwind';

export const RevenueCatDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const { currentOffering, error: revenueCatError, isLoading } = useRevenueCat();
  const { isRevenueCatAvailable, subscriptionStatus } = useSubscription();

  const collectDebugInfo = async () => {
    try {
      const customerInfo = await revenueCatService.getCustomerInfo();
      const isSubscribed = await revenueCatService.isUserSubscribed();
      const offerings = await revenueCatService.getOfferings();

      setDebugInfo({
        isRevenueCatAvailable,
        customerInfo: customerInfo ? 'Available' : 'Not available',
        isSubscribed,
        currentOffering: currentOffering ? 'Available' : 'Not available',
        offeringsCount: offerings.length,
        error: revenueCatError,
        isLoading,
        subscriptionStatus: subscriptionStatus ? 'Available' : 'Not available',
        environment: __DEV__ ? 'Development' : 'Production',
        apiKeys: {
          iOS: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ? 'Set' : 'Not set',
          Android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ? 'Set' : 'Not set',
        },
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        collectionFailed: true,
      });
    }
  };

  useEffect(() => {
    if (showDebug) {
      collectDebugInfo();
    }
  }, [showDebug, isRevenueCatAvailable, currentOffering, revenueCatError]);

  if (!__DEV__) return null;

  return (
    <View style={tw`mx-4 mb-4`}>
      <TouchableOpacity
        onPress={() => setShowDebug(!showDebug)}
        style={tw`bg-gray-100 border border-gray-300 rounded-lg p-3 flex-row items-center justify-between`}
      >
        <Text style={tw`text-gray-700 font-medium`}>🔧 RevenueCat Debug</Text>
        <SafePhosphorIcon
          iconType={showDebug ? 'Minus' : 'Plus'}
          size={16}
          color="#6B7280"
          weight="bold"
        />
      </TouchableOpacity>

      {showDebug && (
        <View style={tw`bg-gray-50 border border-gray-200 rounded-lg mt-2 p-4`}>
          <Text style={tw`font-bold text-gray-800 mb-3`}>RevenueCat Status</Text>

          {debugInfo ? (
            <View style={tw`space-y-2`}>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Available:</Text> {isRevenueCatAvailable ? '✅' : '❌'}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Loading:</Text> {isLoading ? '🔄' : '✅'}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Error:</Text> {revenueCatError || 'None'}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Current Offering:</Text> {debugInfo.currentOffering}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Subscribed:</Text> {debugInfo.isSubscribed ? '✅' : '❌'}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>Environment:</Text> {debugInfo.environment}
              </Text>
              <Text style={tw`text-sm`}>
                <Text style={tw`font-medium`}>API Keys:</Text> iOS: {debugInfo.apiKeys?.iOS}, Android: {debugInfo.apiKeys?.Android}
              </Text>

              {debugInfo.collectionFailed && (
                <Text style={tw`text-red-600 text-sm mt-2`}>
                  Failed to collect debug info: {debugInfo.error}
                </Text>
              )}
            </View>
          ) : (
            <Text style={tw`text-gray-600 text-sm`}>Collecting debug information...</Text>
          )}

          <TouchableOpacity
            onPress={() => {
              collectDebugInfo();
              Alert.alert('Debug Info', JSON.stringify(debugInfo, null, 2));
            }}
            style={tw`bg-blue-500 rounded-lg p-2 mt-3`}
          >
            <Text style={tw`text-white text-center font-medium`}>Refresh & Show Full Info</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};