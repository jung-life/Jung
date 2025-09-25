import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCredits } from '../hooks/useCredits';
import { CreditDisplay } from '../components/CreditDisplay';
import { creditService } from '../lib/creditService';
import { useAuth } from '../contexts/AuthContext';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import tw from '../lib/tailwind';

export default function SimpleSubscriptionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions'>('credits');
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  
  // Use RevenueCat for subscriptions
  const {
    currentOffering,
    isLoading: isLoadingRevenueCat,
    purchasePackage,
    error: revenueCatError,
  } = useRevenueCat();

  useEffect(() => {
    loadCreditPackages();
  }, []);

  const loadCreditPackages = async () => {
    try {
      setIsLoadingCredits(true);
      console.log('Loading credit packages...');
      
      const packages = await creditService.getCreditPackages();
      
      console.log('Loaded packages:', packages.length);
      setCreditPackages(packages);
    } catch (error) {
      console.error('Error loading credit packages:', error);
      Alert.alert('Error', 'Failed to load credit packages. Please try again.');
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleSubscriptionSelect = async (packageToPurchase: PurchasesPackage) => {
    try {
      const success = await purchasePackage(packageToPurchase);
      if (success) {
        Alert.alert(
          'Purchase Successful!',
          'Thank you for upgrading to Premium. Enjoy all the features!'
        );
      } else {
        Alert.alert('Purchase Failed', 'Please try again or contact support.');
      }
    } catch (err) {
      Alert.alert('Purchase Error', 'Something went wrong. Please try again.');
    }
  };

  const handleCreditPackageSelect = (packageId: string) => {
    Alert.alert('Coming Soon', `Credit package "${packageId}" will be available soon!`);
  };

  const getPackageTitle = (packageItem: PurchasesPackage): string => {
    const { identifier } = packageItem;
    
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Annual';
    if (identifier.includes('weekly')) return 'Weekly';
    if (identifier.includes('lifetime')) return 'Lifetime';
    
    return identifier.replace('$rc_', '').replace('_', ' ').toUpperCase();
  };

  const getPricePeriod = (packageItem: PurchasesPackage): string => {
    const { identifier } = packageItem;
    
    if (identifier.includes('monthly')) return '/month';
    if (identifier.includes('annual') || identifier.includes('yearly')) return '/year';
    if (identifier.includes('weekly')) return '/week';
    
    return '';
  };

  const renderSubscriptionCard = (packageItem: PurchasesPackage, index: number) => {
    const isPopular = index === 0;
    
    return (
      <View key={packageItem.identifier} style={styles.card}>
        <LinearGradient
          colors={isPopular ? ['#667eea', '#764ba2'] : ['#f7fafc', '#edf2f7']}
          style={styles.cardGradient}
        >
          <Text style={[styles.cardTitle, isPopular && styles.whiteText]}>
            {getPackageTitle(packageItem)}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, isPopular && styles.whiteText]}>
              {packageItem.product.priceString}
            </Text>
            <Text style={[styles.period, isPopular && styles.lightText]}>
              {getPricePeriod(packageItem)}
            </Text>
          </View>
          
          {packageItem.product.introPrice && (
            <Text style={[styles.credits, isPopular && styles.whiteText]}>
              {packageItem.product.introPrice.periodNumberOfUnits}{' '}
              {packageItem.product.introPrice.periodUnit} free trial
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.button, isPopular && styles.whiteButton]}
            onPress={() => handleSubscriptionSelect(packageItem)}
          >
            <Text style={[styles.buttonText, isPopular && styles.purpleText]}>
              Select Plan
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderCreditPackageCard = (pkg: any) => (
    <View key={pkg.id} style={styles.card}>
      <LinearGradient
        colors={pkg.name.toLowerCase().includes('popular') ? ['#10b981', '#047857'] : ['#f7fafc', '#edf2f7']}
        style={styles.cardGradient}
      >
        <Text style={[styles.cardTitle, pkg.name.toLowerCase().includes('popular') && styles.whiteText]}>
          {pkg.name}
        </Text>
        
        <View style={styles.creditsInfo}>
          <Text style={[styles.credits, pkg.name.toLowerCase().includes('popular') && styles.whiteText]}>
            {pkg.credits} credits
          </Text>
          {pkg.bonusCredits > 0 && (
            <Text style={[styles.bonus, pkg.name.toLowerCase().includes('popular') && styles.lightText]}>
              +{pkg.bonusCredits} bonus
            </Text>
          )}
          <Text style={[styles.total, pkg.name.toLowerCase().includes('popular') && styles.lightText]}>
            = {pkg.totalCredits} total
          </Text>
        </View>
        
        <Text style={[styles.price, pkg.name.toLowerCase().includes('popular') && styles.whiteText]}>
          ${(pkg.priceCents / 100).toFixed(2)}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, pkg.name.toLowerCase().includes('popular') && styles.whiteButton]}
          onPress={() => handleCreditPackageSelect(pkg.id)}
        >
          <Text style={[styles.buttonText, pkg.name.toLowerCase().includes('popular') && styles.greenText]}>
            Purchase
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const isLoading = isLoadingRevenueCat || isLoadingCredits;

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <SymbolicBackground opacity={0.03} />
          <View style={tw`flex-1 justify-center items-center`}>
            <View style={tw`bg-white/90 rounded-2xl p-8 shadow-lg`}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={tw`mt-4 text-jung-deep text-lg font-semibold text-center`}>
                Loading pricing options...
              </Text>
            </View>
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
        <View style={tw`flex-row items-center px-5 py-4 bg-white/10 backdrop-blur-sm`}>
          <TouchableOpacity
            style={tw`mr-4 bg-white/20 rounded-full p-2`}
            onPress={() => navigation.goBack()}
          >
            <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#2D2B55" weight="bold" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Choose Your Plan</Text>
        </View>

        <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
          {/* Current Credit Status */}
          <View style={tw`mt-4 mb-6`}>
            <CreditDisplay variant="detailed" showUpgradeButton={false} />
          </View>

          {/* Header */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`bg-white/90 rounded-2xl p-6 shadow-sm`}>
              <View style={tw`items-center mb-4`}>
                <SafePhosphorIcon iconType="Heart" size={40} color="#667eea" weight="fill" />
              </View>
              <Text style={tw`text-2xl font-bold text-jung-deep mb-2 text-center`}>
                Transparent Pricing
              </Text>
              <Text style={tw`text-base text-gray-600 text-center leading-6`}>
                Choose credit packages for flexibility or monthly plans for convenience.
                Always know exactly what you're paying for.
              </Text>
            </View>
          </View>

          {/* Tab Container */}
          <View style={tw`bg-white/90 rounded-xl p-1 mb-6 shadow-sm`}>
            <View style={tw`flex-row`}>
              <TouchableOpacity
                onPress={() => setActiveTab('credits')}
                style={tw`flex-1 py-3 items-center rounded-lg ${activeTab === 'credits' ? 'bg-jung-purple' : ''}`}
              >
                <Text style={tw`text-sm font-semibold ${activeTab === 'credits' ? 'text-white' : 'text-gray-600'}`}>
                  💳 Credit Packages
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('subscriptions')}
                style={tw`flex-1 py-3 items-center rounded-lg ${activeTab === 'subscriptions' ? 'bg-jung-purple' : ''}`}
              >
                <Text style={tw`text-sm font-semibold ${activeTab === 'subscriptions' ? 'text-white' : 'text-gray-600'}`}>
                  📅 Monthly Plans
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'credits' && (
            <View style={tw`mb-6`}>
              <View style={tw`bg-white/90 rounded-xl p-4 mb-4 shadow-sm`}>
                <Text style={tw`text-xl font-bold text-jung-deep mb-2`}>One-Time Credit Packages</Text>
                <Text style={tw`text-base text-gray-600 leading-6`}>
                  Pay only for what you use. Credits never expire. No monthly commitment.
                </Text>
              </View>
              
              {creditPackages.length > 0 ? (
                creditPackages.map(renderCreditPackageCard)
              ) : (
                <View style={tw`bg-white/90 rounded-xl p-8 shadow-sm`}>
                  <Text style={tw`text-base text-gray-500 text-center`}>No credit packages available</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'subscriptions' && (
            <View style={tw`mb-6`}>
              <View style={tw`bg-white/90 rounded-xl p-4 mb-4 shadow-sm`}>
                <Text style={tw`text-xl font-bold text-jung-deep mb-2`}>Subscription Plans</Text>
                <Text style={tw`text-base text-gray-600 leading-6`}>
                  Choose a subscription plan that works best for you.
                </Text>
              </View>
              
              {revenueCatError && (
                <View style={tw`bg-red-50 rounded-xl p-4 mb-4`}>
                  <Text style={tw`text-red-600 text-center`}>
                    Unable to load subscription options. Please check your connection.
                  </Text>
                </View>
              )}
              
              {currentOffering && currentOffering.availablePackages.length > 0 ? (
                currentOffering.availablePackages.map((pkg, index) => renderSubscriptionCard(pkg, index))
              ) : (
                <View style={tw`bg-white/90 rounded-xl p-8 shadow-sm`}>
                  <Text style={tw`text-base text-gray-500 text-center`}>No subscription plans available</Text>
                </View>
              )}
            </View>
          )}

          {/* Value Proposition */}
          <View style={tw`bg-white/90 rounded-xl p-6 mb-6 shadow-sm`}>
            <Text style={tw`text-lg font-bold text-jung-deep mb-4 text-center`}>Why Choose Jung?</Text>
            <View style={tw`space-y-3`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xl mr-3`}>✅</Text>
                <Text style={tw`text-base text-gray-700`}>Complete price transparency</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xl mr-3`}>⏰</Text>
                <Text style={tw`text-base text-gray-700`}>Credits never expire</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xl mr-3`}>🤝</Text>
                <Text style={tw`text-base text-gray-700`}>Support between therapy sessions</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xl mr-3`}>🌟</Text>
                <Text style={tw`text-base text-gray-700`}>Enhance your therapy journey</Text>
              </View>
            </View>
          </View>

          {/* Footer spacer */}
          <View style={tw`h-8`} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  creditSection: {
    margin: 20,
  },
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardGradient: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  credits: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  creditsInfo: {
    marginBottom: 8,
  },
  bonus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  total: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  whiteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  purpleText: {
    color: '#667eea',
  },
  greenText: {
    color: '#10b981',
  },
  whiteText: {
    color: '#fff',
  },
  lightText: {
    color: '#e0e0e0',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});
