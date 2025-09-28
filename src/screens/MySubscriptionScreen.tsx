import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { useSubscription } from '../hooks/useSubscription';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { revenueCatService } from '../lib/revenueCatService';
import tw from '../lib/tailwind';

export default function MySubscriptionScreen() {
  const navigation = useNavigation();
  const { subscriptionStatus, isPremiumUser, loading, isRevenueCatAvailable } = useSubscription();
  const { usageStats, getUsageSummary } = useUsageTracking();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const usageSummary = getUsageSummary();

  // Subscription plan mapping with full details
  const subscriptionPlans = {
    'org.name.jung.Weekly': {
      title: 'Weekly Premium',
      price: '$4.99',
      period: 'week',
      billingCycle: 'Billed weekly',
      features: ['Unlimited conversations', 'Basic insights', 'Weekly reports'],
      savings: null,
    },
    'org.name.jung.Monthly': {
      title: 'Monthly Premium',
      price: '$12.99',
      period: 'month',
      billingCycle: 'Billed monthly',
      features: ['Everything in Weekly', 'Advanced insights', 'Priority support', 'Export conversations'],
      savings: 'Save 35% vs Weekly',
    },
    'org.name.jung.Annual': {
      title: 'Annual Premium',
      price: '$99.99',
      period: 'year',
      billingCycle: 'Billed yearly',
      features: ['Everything in Monthly', 'Premium analytics', 'Custom avatars', 'Unlimited exports'],
      savings: 'Save 36% vs Monthly',
    },
    'premium': {
      title: 'Premium',
      price: 'Premium',
      period: 'subscription',
      billingCycle: 'Active subscription',
      features: ['All premium features'],
      savings: null,
    },
  };

  useEffect(() => {
    loadSubscriptionDetails();
  }, [subscriptionStatus, isRevenueCatAvailable]);

  const loadSubscriptionDetails = async () => {
    setLoadingDetails(true);
    try {
      let details = {
        isActive: isPremiumUser,
        planType: 'premium',
        expirationDate: null,
        isTrialPeriod: false,
        productId: null,
        originalPurchaseDate: null,
      };

      if (isPremiumUser) {
        if (isRevenueCatAvailable) {
          const expDate = await revenueCatService.getSubscriptionExpirationDate();
          const inTrial = await revenueCatService.isInTrialPeriod();
          const customerInfo = await revenueCatService.getCustomerInfo();

          details.expirationDate = expDate;
          details.isTrialPeriod = inTrial;

          if (customerInfo?.entitlements?.active) {
            const activeEntitlements = Object.values(customerInfo.entitlements.active);
            if (activeEntitlements.length > 0) {
              const entitlement = activeEntitlements[0] as any;
              details.productId = entitlement.productIdentifier;
              details.originalPurchaseDate = entitlement.originalPurchaseDate;
            }
          }
        } else {
          details.expirationDate = subscriptionStatus?.expirationDate || null;
          details.isTrialPeriod = subscriptionStatus?.isTrialPeriod || false;
          details.productId = subscriptionStatus?.productId;
        }
      }

      setSubscriptionDetails(details);
    } catch (error) {
      console.error('Error loading subscription details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscriptionDetails?.productId) return subscriptionPlans['premium'];
    return subscriptionPlans[subscriptionDetails.productId] || subscriptionPlans['premium'];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiration = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, billing, or cancel, you need to visit your App Store account settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open App Store',
          onPress: () => {
            // Open App Store subscription management
            const url = 'https://apps.apple.com/account/subscriptions';
            Linking.openURL(url).catch(() => {
              Alert.alert(
                'Manual Instructions',
                'Go to Settings > [Your Name] > Subscriptions to manage your Jung Premium subscription.'
              );
            });
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('Subscription' as never);
  };

  const currentPlan = getCurrentPlan();

  if (loading || loadingDetails) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={tw`mt-4 text-jung-purple`}>Loading subscription details...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />

        {/* Header */}
        <View style={tw`px-6 pt-2 pb-4`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`p-2 -ml-2`}
            >
              <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#4A3B78" weight="bold" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold text-jung-deep`}>My Subscription</Text>
            <View style={tw`w-10`} />
          </View>
        </View>

        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-8`}
        >
          {/* Current Plan Status */}
          <View style={tw`mx-6 mb-6`}>
            <LinearGradient
              colors={isPremiumUser ? ['#F59E0B', '#D97706'] : ['#6B7280', '#4B5563']}
              style={tw`rounded-2xl p-6`}
            >
              <View style={tw`flex-row items-center mb-4`}>
                <Text style={tw`text-white text-3xl mr-4`}>
                  {isPremiumUser ? '👑' : '🆓'}
                </Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-white text-2xl font-bold`}>
                    Jung {isPremiumUser ? currentPlan.title : 'Free'}
                  </Text>
                  <Text style={tw`text-white/80`}>
                    {isPremiumUser ? currentPlan.billingCycle : 'Basic features only'}
                  </Text>
                </View>
                <View style={tw`${isPremiumUser ? 'bg-green-500' : 'bg-gray-500'} rounded-full px-3 py-1`}>
                  <Text style={tw`text-white font-bold text-xs`}>
                    {isPremiumUser ? 'ACTIVE' : 'FREE'}
                  </Text>
                </View>
              </View>

              {isPremiumUser && subscriptionDetails?.expirationDate && (
                <View style={tw`bg-white/20 rounded-lg p-4`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-white font-medium`}>
                      {subscriptionDetails.isTrialPeriod ? 'Trial ends:' : 'Next billing:'}
                    </Text>
                    <Text style={tw`text-white font-bold`}>
                      {formatDate(new Date(subscriptionDetails.expirationDate))}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-white font-medium`}>Amount:</Text>
                    <Text style={tw`text-white font-bold`}>
                      {currentPlan.price}/{currentPlan.period}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Usage Statistics */}
          <View style={tw`mx-6 mb-6`}>
            <View style={tw`bg-white rounded-2xl p-6 shadow-sm`}>
              <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Your Usage</Text>

              <View style={tw`flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-jung-purple`}>
                    {usageStats.conversationsThisMonth}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>Conversations this month</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-jung-purple`}>
                    {usageStats.messagesThisWeek}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>Messages this week</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-2xl font-bold text-jung-purple`}>
                    {usageStats.featuresUsed.length}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm text-center`}>Features explored</Text>
                </View>
              </View>

              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-gray-700 font-medium`}>Engagement Level:</Text>
                <View style={tw`${usageSummary.engagementLevel === 'high' ? 'bg-green-100' : usageSummary.engagementLevel === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full px-3 py-1`}>
                  <Text style={tw`${usageSummary.engagementLevel === 'high' ? 'text-green-800' : usageSummary.engagementLevel === 'medium' ? 'text-yellow-800' : 'text-gray-800'} font-bold text-sm capitalize`}>
                    {usageSummary.engagementLevel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Plan Features */}
          <View style={tw`mx-6 mb-6`}>
            <View style={tw`bg-white rounded-2xl p-6 shadow-sm`}>
              <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>
                {isPremiumUser ? 'Your Premium Features' : 'Available in Premium'}
              </Text>

              {(isPremiumUser ? currentPlan.features : [
                'Unlimited conversations',
                'Advanced analytics & insights',
                'Export conversation data',
                'Priority support',
                'Early access to new features'
              ]).map((feature, index) => (
                <View key={index} style={tw`flex-row items-center mb-3`}>
                  <SafePhosphorIcon
                    iconType="Plus"
                    size={16}
                    color={isPremiumUser ? "#10B981" : "#6B7280"}
                    weight="bold"
                  />
                  <Text style={tw`ml-3 ${isPremiumUser ? 'text-gray-700' : 'text-gray-500'}`}>
                    {feature}
                  </Text>
                </View>
              ))}

              {currentPlan.savings && isPremiumUser && (
                <View style={tw`bg-green-50 border border-green-200 rounded-lg p-3 mt-4`}>
                  <Text style={tw`text-green-800 font-medium text-center`}>
                    💰 {currentPlan.savings}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={tw`mx-6 space-y-4`}>
            {isPremiumUser ? (
              <>
                <TouchableOpacity
                  onPress={handleManageSubscription}
                  style={tw`bg-jung-purple rounded-xl py-4 px-6 flex-row items-center justify-center`}
                >
                  <SafePhosphorIcon iconType="User" size={20} color="#FFFFFF" weight="bold" />
                  <Text style={tw`text-white font-bold text-lg ml-2`}>Manage Subscription</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUpgrade}
                  style={tw`bg-gray-100 border border-gray-200 rounded-xl py-4 px-6 flex-row items-center justify-center`}
                >
                  <SafePhosphorIcon iconType="TrendUp" size={20} color="#6B7280" weight="bold" />
                  <Text style={tw`text-gray-700 font-bold text-lg ml-2`}>View Other Plans</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleUpgrade}
                style={tw`bg-jung-purple rounded-xl py-4 px-6 flex-row items-center justify-center`}
              >
                <Text style={tw`text-white text-2xl mr-3`}>👑</Text>
                <Text style={tw`text-white font-bold text-lg`}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Billing Information */}
          {isPremiumUser && subscriptionDetails?.originalPurchaseDate && (
            <View style={tw`mx-6 mt-6`}>
              <View style={tw`bg-gray-50 rounded-2xl p-6`}>
                <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Billing Information</Text>
                <View style={tw`space-y-2`}>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-gray-600`}>First subscribed:</Text>
                    <Text style={tw`text-gray-800 font-medium`}>
                      {formatDate(new Date(subscriptionDetails.originalPurchaseDate))}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-gray-600`}>Plan:</Text>
                    <Text style={tw`text-gray-800 font-medium`}>
                      {currentPlan.title}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-gray-600`}>Status:</Text>
                    <Text style={tw`text-green-600 font-medium`}>
                      {subscriptionDetails.isTrialPeriod ? 'Trial Active' : 'Active'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}