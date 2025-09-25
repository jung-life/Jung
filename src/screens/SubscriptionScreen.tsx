import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import tw from '../lib/tailwind';


// Subscription data with correct App Store pricing
const subscriptionPlans = [
  {
    id: 'org.name.jung.Weekly',
    title: 'Weekly',
    subtitle: 'Perfect for trying out',
    price: '$4.99',
    period: '/week',
    features: ['Unlimited conversations', 'Basic insights', 'Weekly reports'],
    isPopular: false,
    color: ['#E8F4FD', '#DBEAFE'],
    textColor: '#1E40AF',
    savings: null,
  },
  {
    id: 'org.name.jung.Monthly',
    title: 'Monthly',
    subtitle: 'Great for regular users',
    price: '$12.99',
    period: '/month',
    features: ['Everything in Weekly', 'Advanced insights', 'Priority support', 'Export conversations'],
    isPopular: false,
    color: ['#F3E8FF', '#EDE9FE'],
    textColor: '#7C3AED',
    savings: 'Save 35% vs Weekly',
  },
  {
    id: 'org.name.jung.Annual',
    title: 'Annual',
    subtitle: 'Most popular choice',
    price: '$99.99',
    period: '/year',
    features: ['Everything in Monthly', 'Premium analytics', 'Custom avatars', 'Unlimited exports'],
    isPopular: true,
    color: ['#6366F1', '#4F46E5'],
    textColor: '#FFFFFF',
    savings: 'Save 36% vs Monthly',
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState('org.name.jung.Annual');

  // Use RevenueCat for subscriptions (with fallback)
  const {
    currentOffering,
    isLoading: isLoadingRevenueCat,
    purchasePackage,
    error: revenueCatError,
  } = useRevenueCat();

  const handleSubscriptionSelect = async (planId: string) => {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) return;

      // If we have a real RevenueCat package, use it
      const revenueCatPackage = currentOffering?.availablePackages?.find(
        (pkg: PurchasesPackage) => pkg.identifier === planId
      );

      if (revenueCatPackage) {
        const success = await purchasePackage(revenueCatPackage);
        if (success) {
          Alert.alert(
            'Purchase Successful! 🎉',
            'Welcome to Jung Premium! Enjoy unlimited access to all features.',
            [{ text: 'Start Exploring', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Please try again or contact support.');
        }
      } else {
        // Fallback for StoreKit testing
        Alert.alert(
          'Test Mode Active',
          `You selected the ${plan.title} plan (${plan.price}${plan.period}). This is a test purchase in development mode.`,
          [{ text: 'Got it' }]
        );
      }
    } catch (err) {
      Alert.alert('Purchase Error', 'Something went wrong. Please try again.');
    }
  };

  const renderPlanCard = (plan: typeof subscriptionPlans[0]) => {
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => setSelectedPlan(plan.id)}
        style={tw`mb-4 relative`}
        activeOpacity={0.9}
      >
        {/* Popular badge */}
        {plan.isPopular && (
          <View style={tw`absolute -top-3 left-1/2 transform -translate-x-1/2 z-10`}>
            <LinearGradient
              colors={['#10B981', '#059669'] as const}
              style={tw`px-4 py-1.5 rounded-full shadow-sm`}
            >
              <Text style={tw`text-white text-sm font-bold`}>MOST POPULAR</Text>
            </LinearGradient>
          </View>
        )}

        <LinearGradient
          colors={plan.color as readonly [string, string, ...string[]]}
          style={[
            tw`rounded-2xl p-6 relative overflow-hidden`,
            isSelected && tw`ring-2 ring-jung-purple shadow-xl`,
          ]}
        >
          {/* Selection indicator */}
          {isSelected && (
            <View style={tw`absolute top-4 right-4`}>
              <View style={tw`bg-jung-purple rounded-full p-1`}>
                <SafePhosphorIcon iconType="Check" size={16} color="#FFFFFF" weight="bold" />
              </View>
            </View>
          )}

          <View style={tw`flex-row items-start justify-between mb-4`}>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: plan.textColor }]}>
                {plan.title}
              </Text>
              <Text style={[tw`text-sm opacity-80`, { color: plan.textColor }]}>
                {plan.subtitle}
              </Text>
              {plan.savings && (
                <View style={tw`bg-green-100 px-3 py-1 rounded-full mt-2 self-start`}>
                  <Text style={tw`text-green-800 text-xs font-bold`}>
                    💰 {plan.savings}
                  </Text>
                </View>
              )}
            </View>

            <View style={tw`items-end`}>
              <Text style={[tw`text-3xl font-bold`, { color: plan.textColor }]}>
                {plan.price}
              </Text>
              <Text style={[tw`text-sm opacity-80`, { color: plan.textColor }]}>
                {plan.period}
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={tw`mb-4`}>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={tw`flex-row items-center mb-2`}>
                <SafePhosphorIcon
                  iconType="Check"
                  size={16}
                  color={plan.isPopular ? "#A7F3D0" : "#10B981"}
                  weight="bold"
                />
                <Text style={[tw`ml-3 text-sm`, { color: plan.textColor, opacity: 0.9 }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />

        {/* Header */}
        <View style={tw`px-6 pt-2 pb-4`}>
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`p-2 -ml-2`}
            >
              <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold text-jung-deep`}>Premium Plans</Text>
            <View style={tw`w-8`} />
          </View>

          <Text style={tw`text-center text-gray-600 text-base mb-2`}>
            Unlock the full potential of Jung AI
          </Text>
          <Text style={tw`text-center text-jung-deep text-lg font-bold`}>
            Choose your perfect plan ✨
          </Text>
        </View>

        {/* Loading State */}
        {isLoadingRevenueCat && !revenueCatError && (
          <View style={tw`flex-1 justify-center items-center px-6`}>
            <View style={tw`bg-white/90 rounded-3xl p-8 shadow-lg`}>
              <ActivityIndicator size="large" color="#4A3B78" />
              <Text style={tw`mt-4 text-jung-deep text-lg font-semibold text-center`}>
                Loading premium options...
              </Text>
            </View>
          </View>
        )}

        {/* Subscription Plans */}
        {(!isLoadingRevenueCat || revenueCatError) && (
          <>
            <ScrollView
              style={tw`flex-1`}
              contentContainerStyle={tw`px-6 pb-4`}
              showsVerticalScrollIndicator={false}
            >
              {/* Test Mode Banner */}
              {revenueCatError && (
                <View style={tw`bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex-row items-center`}>
                  <SafePhosphorIcon iconType="Info" size={20} color="#2563EB" />
                  <View style={tw`ml-3 flex-1`}>
                    <Text style={tw`text-blue-800 font-bold text-sm`}>
                      Test Mode Active
                    </Text>
                    <Text style={tw`text-blue-700 text-sm mt-1`}>
                      Using local configuration for testing. No real charges.
                    </Text>
                  </View>
                </View>
              )}

              {/* Plans */}
              {subscriptionPlans.map(plan => renderPlanCard(plan))}

              {/* Features Highlight */}
              <View style={tw`mt-6 bg-white/90 rounded-3xl p-6 shadow-sm`}>
                <Text style={tw`text-jung-deep text-xl font-bold mb-6 text-center`}>
                  🚀 Premium Features
                </Text>

                <View style={tw`space-y-4`}>
                  <View style={tw`flex-row items-start`}>
                    <View style={tw`bg-jung-purple/10 rounded-full p-2 mr-4`}>
                      <SafePhosphorIcon iconType="Brain" size={24} color="#4A3B78" weight="fill" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-jung-deep text-base`}>Deep Psychological Insights</Text>
                      <Text style={tw`text-gray-600 text-sm mt-1`}>
                        Advanced AI analysis of your conversations and mental patterns
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row items-start`}>
                    <View style={tw`bg-jung-purple/10 rounded-full p-2 mr-4`}>
                      <SafePhosphorIcon iconType="Infinity" size={24} color="#4A3B78" weight="bold" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-jung-deep text-base`}>Unlimited Access</Text>
                      <Text style={tw`text-gray-600 text-sm mt-1`}>
                        Chat without limits with all psychological guides
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row items-start`}>
                    <View style={tw`bg-jung-purple/10 rounded-full p-2 mr-4`}>
                      <SafePhosphorIcon iconType="Download" size={24} color="#4A3B78" weight="bold" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-jung-deep text-base`}>Export & Archive</Text>
                      <Text style={tw`text-gray-600 text-sm mt-1`}>
                        Save and export your conversations for personal records
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Purchase Button */}
            <View style={tw`px-6 pb-6 bg-white/90`}>
              <TouchableOpacity
                style={tw`bg-jung-purple rounded-2xl py-4 px-6 shadow-lg`}
                onPress={() => handleSubscriptionSelect(selectedPlan)}
                disabled={isLoadingRevenueCat}
              >
                <Text style={tw`text-center font-bold text-lg text-white`}>
                  {isLoadingRevenueCat ? 'Loading...' : 'Continue with Premium'}
                </Text>
                <Text style={tw`text-center text-jung-light text-sm mt-1`}>
                  {subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                  {subscriptionPlans.find(p => p.id === selectedPlan)?.period}
                </Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={tw`text-center text-gray-500 text-xs mt-4 leading-5`}>
                By continuing, you agree to our Terms of Service and Privacy Policy.{'\n'}
                Subscriptions auto-renew unless canceled 24h before next billing cycle.
              </Text>
            </View>
          </>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}