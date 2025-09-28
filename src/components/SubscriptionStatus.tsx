import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { useSubscription } from '../hooks/useSubscription';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { UsageLimitPrompt } from './UsageLimitPrompt';
import { useNavigation } from '@react-navigation/native';
import { revenueCatService } from '../lib/revenueCatService';
import tw from '../lib/tailwind';

interface SubscriptionStatusProps {
  variant?: 'card' | 'banner' | 'detailed';
  showManageButton?: boolean;
  style?: any;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  variant = 'card',
  showManageButton = true,
  style
}) => {
  const navigation = useNavigation();
  const { subscriptionStatus, isPremiumUser, loading, isRevenueCatAvailable } = useSubscription();
  const { usageStats, getUsageSummary, FREE_USER_LIMITS } = useUsageTracking();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isTrialPeriod, setIsTrialPeriod] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);

  const usageSummary = getUsageSummary();

  // Subscription plan mapping
  const subscriptionPlans = {
    'org.name.jung.Weekly': { title: 'Weekly', price: '$4.99', period: 'week' },
    'org.name.jung.Monthly': { title: 'Monthly', price: '$12.99', period: 'month' },
    'org.name.jung.Annual': { title: 'Annual', price: '$99.99', period: 'year' },
    'premium': { title: 'Premium', price: 'Premium', period: 'subscription' },
  };

  useEffect(() => {
    loadSubscriptionDetails();
  }, [subscriptionStatus, isRevenueCatAvailable]);

  const loadSubscriptionDetails = async () => {
    if (!isPremiumUser) return;

    try {
      if (isRevenueCatAvailable) {
        const expDate = await revenueCatService.getSubscriptionExpirationDate();
        const inTrial = await revenueCatService.isInTrialPeriod();
        const customerInfo = await revenueCatService.getCustomerInfo();

        setExpirationDate(expDate);
        setIsTrialPeriod(inTrial);

        // Try to get the specific subscription plan
        if (customerInfo?.entitlements?.active) {
          const activeEntitlements = Object.values(customerInfo.entitlements.active);
          if (activeEntitlements.length > 0) {
            const entitlement = activeEntitlements[0] as any;
            const productId = entitlement.productIdentifier;
            setSubscriptionPlan(subscriptionPlans[productId] || subscriptionPlans['premium']);
          }
        }
      } else {
        setExpirationDate(subscriptionStatus?.expirationDate || null);
        setIsTrialPeriod(subscriptionStatus?.isTrialPeriod || false);

        // Use productId from subscription status
        const productId = subscriptionStatus?.productId;
        if (productId) {
          setSubscriptionPlan(subscriptionPlans[productId] || subscriptionPlans['premium']);
        }
      }
    } catch (error) {
      console.error('Error loading subscription details:', error);
      // Set default premium plan if error
      setSubscriptionPlan(subscriptionPlans['premium']);
    }
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
      'To manage your subscription, billing, or cancel, please visit your App Store account settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // In a real app, you'd open the App Store subscription management
            Alert.alert(
              'App Store Settings',
              'Go to Settings > [Your Name] > Subscriptions to manage your Jung Premium subscription.'
            );
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('Subscription' as never);
  };

  // Check if user is approaching limits and should see upgrade suggestions
  const getUpgradeUrgency = () => {
    if (isPremiumUser) return null;

    const dailyPercent = usageStats.conversationsToday / FREE_USER_LIMITS.conversationsPerDay;
    const weeklyPercent = usageStats.messagesThisWeek / FREE_USER_LIMITS.messagesPerWeek;
    const monthlyPercent = usageStats.conversationsThisMonth / FREE_USER_LIMITS.conversationsPerMonth;

    if (dailyPercent >= 0.8 || weeklyPercent >= 0.8 || monthlyPercent >= 0.8) {
      return 'high';
    }
    if (dailyPercent >= 0.5 || weeklyPercent >= 0.5 || monthlyPercent >= 0.5) {
      return 'medium';
    }
    return 'low';
  };

  if (loading) {
    return (
      <View style={[tw`bg-gray-100 rounded-xl p-4 mx-4 mb-4`, style]}>
        <Text style={tw`text-gray-600 text-center`}>Loading subscription status...</Text>
      </View>
    );
  }

  // Free user banner
  if (!isPremiumUser && variant === 'banner') {
    const urgency = getUpgradeUrgency();
    const bannerColors = urgency === 'high'
      ? ['#EF4444', '#DC2626']
      : urgency === 'medium'
      ? ['#F59E0B', '#D97706']
      : ['#667eea', '#764ba2'];

    const getMessage = () => {
      if (urgency === 'high') {
        return 'You\'re almost at your limit! Upgrade now';
      }
      if (urgency === 'medium') {
        return 'You\'re using Jung frequently. Consider upgrading';
      }
      return 'Upgrade to unlock premium features';
    };

    return (
      <>
        <TouchableOpacity onPress={handleUpgrade} style={[tw`mx-4 mb-4`, style]}>
          <LinearGradient
            colors={bannerColors}
            style={tw`rounded-xl p-4 flex-row items-center`}
          >
            <Text style={tw`text-2xl mr-3`}>👑</Text>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white font-bold text-lg`}>Jung Free</Text>
              <Text style={tw`text-white/80 text-sm`}>{getMessage()}</Text>
              {urgency === 'high' && (
                <Text style={tw`text-white/90 text-xs mt-1`}>
                  {usageStats.conversationsToday}/{FREE_USER_LIMITS.conversationsPerDay} daily conversations used
                </Text>
              )}
            </View>
            <SafePhosphorIcon iconType="ArrowRight" size={20} color="#FFFFFF" weight="bold" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Usage Limit Prompt */}
        <UsageLimitPrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          limitType="daily"
        />
      </>
    );
  }

  // Premium user detailed view
  if (isPremiumUser && variant === 'detailed') {
    const daysUntilExpiration = expirationDate ? getDaysUntilExpiration(expirationDate) : null;

    return (
      <View style={[tw`bg-white rounded-xl p-6 mx-4 mb-4 shadow-sm border border-gray-100`, style]}>
        <View style={tw`flex-row items-center mb-4`}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={tw`rounded-full p-3 mr-4`}
          >
            <Text style={tw`text-white text-xl`}>👑</Text>
          </LinearGradient>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xl font-bold text-gray-800`}>
              Jung {subscriptionPlan?.title || 'Premium'} {isTrialPeriod ? '(Trial)' : ''}
            </Text>
            <Text style={tw`text-gray-600`}>
              {subscriptionPlan ? `${subscriptionPlan.price}/${subscriptionPlan.period}` : 'Active subscription'}
            </Text>
          </View>
          <View style={tw`bg-green-100 rounded-full px-3 py-1`}>
            <Text style={tw`text-green-800 font-bold text-xs`}>ACTIVE</Text>
          </View>
        </View>

        {expirationDate && (
          <View style={tw`bg-gray-50 rounded-lg p-4 mb-4`}>
            <Text style={tw`text-gray-800 font-medium mb-2`}>Subscription Details</Text>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-600`}>
                {isTrialPeriod ? 'Trial ends' : 'Renews on'}:
              </Text>
              <Text style={tw`font-medium text-gray-800`}>
                {formatDate(expirationDate)}
              </Text>
            </View>
            {daysUntilExpiration !== null && (
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-gray-600`}>Time remaining:</Text>
                <Text style={tw`font-medium ${daysUntilExpiration <= 7 ? 'text-amber-600' : 'text-gray-800'}`}>
                  {daysUntilExpiration > 0 ? `${daysUntilExpiration} days` : 'Expires today'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-800 font-medium mb-3`}>Usage This Month</Text>
          <View style={tw`bg-gray-50 rounded-lg p-4 mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-600`}>Conversations:</Text>
              <Text style={tw`font-medium text-gray-800`}>
                {usageStats.conversationsThisMonth}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-600`}>Messages this week:</Text>
              <Text style={tw`font-medium text-gray-800`}>
                {usageStats.messagesThisWeek}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-600`}>Features explored:</Text>
              <Text style={tw`font-medium text-gray-800`}>
                {usageStats.featuresUsed.length}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-gray-600`}>Engagement level:</Text>
              <View style={tw`${usageSummary.engagementLevel === 'high' ? 'bg-green-100' : usageSummary.engagementLevel === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full px-2 py-1`}>
                <Text style={tw`${usageSummary.engagementLevel === 'high' ? 'text-green-800' : usageSummary.engagementLevel === 'medium' ? 'text-yellow-800' : 'text-gray-800'} font-medium text-xs capitalize`}>
                  {usageSummary.engagementLevel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-800 font-medium mb-3`}>Premium Features</Text>
          <View style={tw`space-y-2`}>
            {[
              'Unlimited conversations',
              'Advanced analytics & insights',
              'Export conversation data',
              'Priority support',
              'Early access to new features'
            ].map((feature, index) => (
              <View key={index} style={tw`flex-row items-center`}>
                <SafePhosphorIcon iconType="Plus" size={16} color="#10B981" weight="bold" />
                <Text style={tw`ml-3 text-gray-700`}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {showManageButton && (
          <TouchableOpacity
            onPress={handleManageSubscription}
            style={tw`bg-gray-100 rounded-lg py-3 px-4 flex-row items-center justify-center`}
          >
            <SafePhosphorIcon iconType="User" size={16} color="#6B7280" weight="bold" />
            <Text style={tw`ml-2 text-gray-700 font-medium`}>Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Premium user card view
  if (isPremiumUser && variant === 'card') {
    return (
      <TouchableOpacity onPress={showManageButton ? handleManageSubscription : undefined} style={[tw`mx-4 mb-4`, style]}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={tw`rounded-xl p-4 flex-row items-center`}
        >
          <Text style={tw`text-2xl mr-3`}>👑</Text>
          <View style={tw`flex-1`}>
            <Text style={tw`text-white font-bold text-lg`}>
              Jung {subscriptionPlan?.title || 'Premium'} {isTrialPeriod ? '(Trial)' : ''}
            </Text>
            <Text style={tw`text-white/80 text-sm`}>
              {subscriptionPlan && `${subscriptionPlan.price}/${subscriptionPlan.period} • `}
              {expirationDate ?
                `${isTrialPeriod ? 'Trial ends' : 'Renews'} ${formatDate(expirationDate)}` :
                'Active subscription'
              }
            </Text>
          </View>
          {showManageButton && (
            <SafePhosphorIcon iconType="User" size={20} color="#FFFFFF" weight="bold" />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Free user card
  return (
    <TouchableOpacity onPress={handleUpgrade} style={[tw`mx-4 mb-4`, style]}>
      <View style={tw`bg-gray-100 rounded-xl p-4 flex-row items-center border border-gray-200`}>
        <Text style={tw`text-2xl mr-3`}>🆓</Text>
        <View style={tw`flex-1`}>
          <Text style={tw`text-gray-800 font-bold text-lg`}>Jung Free</Text>
          <Text style={tw`text-gray-600 text-sm`}>Limited access to features</Text>
        </View>
        <View style={tw`bg-jung-purple rounded-lg px-3 py-2`}>
          <Text style={tw`text-white font-bold text-xs`}>UPGRADE</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Specialized components for different use cases
export const SubscriptionBanner: React.FC<{ style?: any }> = ({ style }) => (
  <SubscriptionStatus variant="banner" showManageButton={false} style={style} />
);

export const SubscriptionCard: React.FC<{ style?: any }> = ({ style }) => (
  <SubscriptionStatus variant="card" style={style} />
);

export const SubscriptionDetails: React.FC<{ style?: any }> = ({ style }) => (
  <SubscriptionStatus variant="detailed" style={style} />
);