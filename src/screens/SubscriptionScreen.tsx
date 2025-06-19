import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { inAppPurchaseService, SUBSCRIPTION_PRODUCTS, SubscriptionStatus } from '../lib/inAppPurchaseService';
import { CreditDisplay } from '../components/CreditDisplay';
import { useCredits } from '../hooks/useCredits';

// Use our own interface instead of importing from react-native-iap
interface IAPSubscription {
  productId: string;
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
  subscriptionPeriod: string;
}

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availableSubscriptions, setAvailableSubscriptions] = useState<IAPSubscription[]>([]);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: SUBSCRIPTION_PRODUCTS.WEEKLY,
      title: 'Weekly Premium',
      price: '$2.99',
      period: 'per week',
      features: [
        'Unlimited AI conversations',
        'All premium avatars',
        'Advanced mood tracking',
        'Personalized insights',
        'Priority support'
      ],
    },
    {
      id: SUBSCRIPTION_PRODUCTS.MONTHLY,
      title: 'Monthly Premium',
      price: '$9.99',
      period: 'per month',
      popular: true,
      features: [
        'Unlimited AI conversations',
        'All premium avatars',
        'Advanced mood tracking',
        'Personalized insights',
        'Priority support',
        'Export conversation history'
      ],
    },
    {
      id: SUBSCRIPTION_PRODUCTS.YEARLY,
      title: 'Yearly Premium',
      price: '$79.99',
      originalPrice: '$119.88',
      period: 'per year',
      savings: 'Save 33%',
      features: [
        'Unlimited AI conversations',
        'All premium avatars',
        'Advanced mood tracking',
        'Personalized insights',
        'Priority support',
        'Export conversation history',
        'Early access to new features'
      ],
    },
  ];

  useEffect(() => {
    initializeSubscriptions();
  }, []);

  const initializeSubscriptions = async () => {
    try {
      setLoading(true);
      await inAppPurchaseService.initialize();
      
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      const subscriptions = inAppPurchaseService.getAvailableSubscriptions();
      setAvailableSubscriptions(subscriptions);
    } catch (error) {
      console.error('Error initializing subscriptions:', error);
      Alert.alert(
        'Error',
        'Unable to load subscription information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (productId: string) => {
    try {
      setPurchasing(productId);
      await inAppPurchaseService.purchaseSubscription(productId);
      
      // Refresh subscription status
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Failed',
        'Unable to process your subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      await inAppPurchaseService.restorePurchases();
      
      // Refresh subscription status
      const status = await inAppPurchaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubscriptionCard = (plan: SubscriptionPlan) => {
    const isActive = subscriptionStatus?.isActive && subscriptionStatus.productId === plan.id;
    const isPurchasing = purchasing === plan.id;
    
    // Find actual pricing from available subscriptions
    const actualSubscription = availableSubscriptions.find(sub => sub.productId === plan.id);
    const displayPrice = (actualSubscription as any)?.localizedPrice || plan.price;

    return (
      <View key={plan.id} style={styles.subscriptionCard}>
        <LinearGradient
          colors={plan.popular ? ['#667eea', '#764ba2'] : ['#f7fafc', '#edf2f7']}
          style={[styles.cardGradient, plan.popular && styles.popularCard]}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <View style={styles.popularBadgeInner}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            </View>
          )}

          {plan.savings && (
            <View style={styles.savingsBadge}>
              <View style={styles.savingsBadgeInner}>
                <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
              </View>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={styles.priceContainer}>
              <Text style={[styles.planTitle, plan.popular && styles.whiteText]}>
                {plan.title}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, plan.popular && styles.whiteText]}>
                  {displayPrice}
                </Text>
                <Text style={[styles.period, plan.popular && styles.lightText]}>
                  {plan.period}
                </Text>
              </View>
              {plan.originalPrice && (
                <Text style={[styles.originalPrice, plan.popular && styles.lightText]}>
                  {plan.originalPrice}
                </Text>
              )}
            </View>
            
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={[styles.featureText, plan.popular && styles.lightText]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleSubscribe(plan.id)}
            disabled={isPurchasing || isActive}
            style={[
              styles.subscribeButton,
              isActive && styles.disabledButton,
              plan.popular && !isActive && styles.whiteButton,
              !plan.popular && !isActive && styles.purpleButton,
            ]}
          >
            {isPurchasing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator
                  size="small"
                  color={plan.popular ? '#667eea' : '#fff'}
                />
                <Text style={[styles.buttonText, plan.popular && styles.purpleText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.buttonText,
                isActive && styles.grayText,
                plan.popular && !isActive && styles.purpleText,
                !plan.popular && !isActive && styles.whiteText,
              ]}>
                {isActive ? 'Current Plan' : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Current Credit Status */}
          <View style={styles.creditSection}>
            <CreditDisplay variant="detailed" showUpgradeButton={false} />
          </View>

          {/* Header */}
          <View style={styles.introSection}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.iconContainer}
            >
              <Text style={styles.crownIcon}>👑</Text>
            </LinearGradient>
            <Text style={styles.mainTitle}>
              Credit-Based Subscriptions
            </Text>
            <Text style={styles.subtitle}>
              Choose a monthly plan to get credits automatically, or buy credit packages as needed
            </Text>
          </View>

          {/* Current Subscription Status */}
          {subscriptionStatus?.isActive && (
            <View style={styles.activeStatus}>
              <View style={styles.activeStatusHeader}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.activeStatusTitle}>Premium Active</Text>
              </View>
              <Text style={styles.activeStatusText}>
                Your premium subscription is active
                {subscriptionStatus.expirationDate && 
                  ` until ${subscriptionStatus.expirationDate.toLocaleDateString()}`
                }
              </Text>
            </View>
          )}

          {/* Subscription Plans */}
          {subscriptionPlans.map(renderSubscriptionCard)}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleRestorePurchases}
              style={styles.restoreButton}
            >
              <Text style={styles.restoreButtonText}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  creditSection: {
    marginBottom: 24,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  activeStatus: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  activeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 20,
    color: '#10b981',
    marginRight: 8,
  },
  activeStatusTitle: {
    fontWeight: '600',
    color: '#065f46',
  },
  activeStatusText: {
    color: '#047857',
    marginTop: 4,
  },
  subscriptionCard: {
    marginBottom: 24,
    marginTop: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'visible',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  popularBadgeInner: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
  },
  savingsBadgeInner: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    alignItems: 'center',
  },
  savingsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  period: {
    fontSize: 14,
    marginLeft: 4,
    color: '#6b7280',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 12,
  },
  featureText: {
    color: '#374151',
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  whiteButton: {
    backgroundColor: '#fff',
  },
  purpleButton: {
    backgroundColor: '#7c3aed',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 18,
  },
  grayText: {
    color: '#6b7280',
  },
  purpleText: {
    color: '#7c3aed',
    marginLeft: 8,
  },
  whiteText: {
    color: '#fff',
  },
  lightText: {
    color: '#d1d5db',
  },
  footer: {
    marginTop: 32,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    textAlign: 'center',
    color: '#374151',
    fontWeight: '500',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  linkText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SubscriptionScreen;
