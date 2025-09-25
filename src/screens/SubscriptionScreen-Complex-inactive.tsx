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
import tw from '../lib/tailwind';

interface SubscriptionCardProps {
  tier: any;
  isRecommended: boolean;
  onSelect: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  tier,
  isRecommended,
  onSelect
}) => (
  <View style={tw`bg-white/90 rounded-2xl mb-4 shadow-sm overflow-hidden ${isRecommended ? 'border-2 border-jung-purple' : ''}`}>
    {isRecommended && (
      <View style={tw`bg-jung-purple py-2`}>
        <Text style={tw`text-white text-center text-sm font-bold`}>✨ RECOMMENDED</Text>
      </View>
    )}
    
    <LinearGradient
      colors={isRecommended ? ['#667eea', '#764ba2'] : ['#f7fafc', '#edf2f7']}
      style={tw`p-6`}
    >
      <Text style={tw`text-xl font-bold ${isRecommended ? 'text-white' : 'text-jung-deep'} mb-2`}>
        {tier.name}
      </Text>
      
      <View style={tw`flex-row items-baseline mb-3`}>
        <Text style={tw`text-3xl font-bold ${isRecommended ? 'text-white' : 'text-jung-deep'}`}>
          {tier.priceCents === 0 ? 'Free' : `$${(tier.priceCents / 100).toFixed(2)}`}
        </Text>
        {tier.priceCents > 0 && (
          <Text style={tw`text-base ${isRecommended ? 'text-white/80' : 'text-gray-600'} ml-1`}>
            /month
          </Text>
        )}
      </View>
      
      <Text style={tw`text-base font-semibold ${isRecommended ? 'text-white/90' : 'text-gray-700'} mb-4`}>
        {tier.monthlyCredits} credits/month
      </Text>
      
      <View style={tw`space-y-2 mb-6`}>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-lg mr-2`}>✅</Text>
          <Text style={tw`text-sm ${isRecommended ? 'text-white/90' : 'text-gray-700'}`}>Unlimited chat sessions</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-lg mr-2`}>✅</Text>
          <Text style={tw`text-sm ${isRecommended ? 'text-white/90' : 'text-gray-700'}`}>Access to all therapists</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-lg mr-2`}>✅</Text>
          <Text style={tw`text-sm ${isRecommended ? 'text-white/90' : 'text-gray-700'}`}>Priority support</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={tw`py-3 px-6 rounded-xl ${isRecommended ? 'bg-white/20' : 'bg-jung-purple'} items-center`}
        onPress={onSelect}
      >
        <Text style={tw`text-base font-semibold ${isRecommended ? 'text-white' : 'text-white'}`}>
          Select Plan
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

interface CreditPackageCardProps {
  package: any;
  isPopular: boolean;
  onSelect: () => void;
}

const CreditPackageCard: React.FC<CreditPackageCardProps> = ({ package: pkg, isPopular, onSelect }) => (
  <View style={tw`bg-white/90 rounded-2xl mb-4 shadow-sm overflow-hidden ${isPopular ? 'border-2 border-green-500' : ''}`}>
    {isPopular && (
      <View style={tw`bg-green-500 py-2`}>
        <Text style={tw`text-white text-center text-sm font-bold`}>🏆 BEST VALUE</Text>
      </View>
    )}
    
    <LinearGradient
      colors={isPopular ? ['#10b981', '#047857'] : ['#f7fafc', '#edf2f7']}
      style={tw`p-6`}
    >
      <Text style={tw`text-lg font-bold ${isPopular ? 'text-white' : 'text-jung-deep'} mb-2`}>
        {pkg.name}
      </Text>
      
      <View style={tw`mb-3`}>
        <Text style={tw`text-base font-semibold ${isPopular ? 'text-white/90' : 'text-gray-700'}`}>
          {pkg.credits} credits
        </Text>
        {pkg.bonusCredits > 0 && (
          <Text style={tw`text-sm font-semibold ${isPopular ? 'text-white/80' : 'text-green-600'}`}>
            +{pkg.bonusCredits} bonus
          </Text>
        )}
        <Text style={tw`text-sm font-bold ${isPopular ? 'text-white' : 'text-jung-deep'}`}>
          = {pkg.totalCredits} total credits
        </Text>
      </View>
      
      <Text style={tw`text-2xl font-bold ${isPopular ? 'text-white' : 'text-jung-deep'} mb-2`}>
        ${(pkg.priceCents / 100).toFixed(2)}
      </Text>
      
      <Text style={tw`text-xs ${isPopular ? 'text-white/70' : 'text-gray-500'} mb-4`}>
        ${(pkg.priceCents / pkg.totalCredits / 100).toFixed(3)} per credit
      </Text>
      
      <TouchableOpacity
        style={tw`py-3 px-6 rounded-xl ${isPopular ? 'bg-white/20' : 'bg-jung-purple'} items-center`}
        onPress={onSelect}
      >
        <Text style={tw`text-base font-semibold text-white`}>
          Purchase
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

export default function ComplexSubscriptionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions'>('credits');
  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading subscription data...');
      
      // Load data directly from creditService
      const [tiers, packages] = await Promise.all([
        creditService.getSubscriptionTiers(),
        creditService.getCreditPackages()
      ]);
      
      console.log('Loaded tiers:', tiers.length);
      console.log('Loaded packages:', packages.length);
      
      setSubscriptionTiers(tiers);
      setCreditPackages(packages);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load pricing options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionSelect = (tierId: string) => {
    Alert.alert('Coming Soon', `Subscription plan "${tierId}" will be available soon!`);
  };

  const handleCreditPackageSelect = (packageId: string) => {
    Alert.alert('Coming Soon', `Credit package "${packageId}" will be available soon!`);
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1`}>
          <SymbolicBackground opacity={0.03} />
          <View style={tw`flex-1 justify-center items-center`}>
            <View style={tw`bg-white/90 rounded-2xl p-8 shadow-lg`}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={tw`mt-4 text-jung-deep text-lg font-semibold text-center`}>
                Loading premium options...
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
          <Text style={tw`text-xl font-bold text-jung-deep`}>Premium Plans</Text>
        </View>

        <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
          {/* Current Credit Status */}
          <View style={tw`mt-4 mb-6`}>
            <CreditDisplay variant="detailed" showUpgradeButton={false} />
          </View>

          {/* Header Section */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`bg-white/90 rounded-2xl p-6 shadow-sm`}>
              <View style={tw`items-center mb-4`}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={tw`w-20 h-20 rounded-full justify-center items-center`}
                >
                  <Text style={tw`text-4xl`}>💎</Text>
                </LinearGradient>
              </View>
              <Text style={tw`text-2xl font-bold text-jung-deep mb-2 text-center`}>
                Advanced Pricing Options
              </Text>
              <Text style={tw`text-base text-gray-600 text-center leading-6`}>
                Unlock premium features with our flexible credit packages or convenient monthly plans.
                Experience the full power of Jung's AI therapy.
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
                  💳 Premium Packages
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('subscriptions')}
                style={tw`flex-1 py-3 items-center rounded-lg ${activeTab === 'subscriptions' ? 'bg-jung-purple' : ''}`}
              >
                <Text style={tw`text-sm font-semibold ${activeTab === 'subscriptions' ? 'text-white' : 'text-gray-600'}`}>
                  📅 Monthly VIP
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'credits' && (
            <View style={tw`mb-6`}>
              <View style={tw`bg-white/90 rounded-xl p-4 mb-4 shadow-sm`}>
                <Text style={tw`text-xl font-bold text-jung-deep mb-2`}>Premium Credit Packages</Text>
                <Text style={tw`text-base text-gray-600 leading-6`}>
                  One-time purchases with bonus credits. Perfect for flexibility and maximum value.
                </Text>
              </View>
              
              {creditPackages.length > 0 ? (
                creditPackages.map((pkg, index) => (
                  <CreditPackageCard
                    key={pkg.id}
                    package={pkg}
                    isPopular={pkg.name.toLowerCase().includes('popular') || index === 1}
                    onSelect={() => handleCreditPackageSelect(pkg.id)}
                  />
                ))
              ) : (
                <View style={tw`bg-white/90 rounded-xl p-8 shadow-sm`}>
                  <Text style={tw`text-base text-gray-500 text-center`}>Loading premium packages...</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'subscriptions' && (
            <View style={tw`mb-6`}>
              <View style={tw`bg-white/90 rounded-xl p-4 mb-4 shadow-sm`}>
                <Text style={tw`text-xl font-bold text-jung-deep mb-2`}>VIP Monthly Plans</Text>
                <Text style={tw`text-base text-gray-600 leading-6`}>
                  Recurring plans with automatic credits and exclusive features for power users.
                </Text>
              </View>
              
              {subscriptionTiers.length > 0 ? (
                subscriptionTiers.map((tier, index) => (
                  <SubscriptionCard
                    key={tier.id}
                    tier={tier}
                    isRecommended={tier.id === 'basic' || index === 1}
                    onSelect={() => handleSubscriptionSelect(tier.id)}
                  />
                ))
              ) : (
                <View style={tw`bg-white/90 rounded-xl p-8 shadow-sm`}>
                  <Text style={tw`text-base text-gray-500 text-center`}>Loading VIP plans...</Text>
                </View>
              )}
            </View>
          )}

          {/* Enhanced Value Proposition */}
          <View style={tw`bg-white/90 rounded-xl p-6 mb-6 shadow-sm`}>
            <Text style={tw`text-lg font-bold text-jung-deep mb-4 text-center`}>🌟 Premium Experience</Text>
            <View style={tw`space-y-4`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-jung-purple/20 rounded-full p-2 mr-3`}>
                  <Text style={tw`text-lg`}>🧠</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-jung-deep`}>Advanced AI Insights</Text>
                  <Text style={tw`text-sm text-gray-600`}>Deep psychological analysis and personalized recommendations</Text>
                </View>
              </View>
              
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-jung-purple/20 rounded-full p-2 mr-3`}>
                  <Text style={tw`text-lg`}>🎯</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-jung-deep`}>Personalized Therapy</Text>
                  <Text style={tw`text-sm text-gray-600`}>Tailored conversations based on your unique needs</Text>
                </View>
              </View>
              
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-jung-purple/20 rounded-full p-2 mr-3`}>
                  <Text style={tw`text-lg`}>⚡</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-jung-deep`}>Instant Access</Text>
                  <Text style={tw`text-sm text-gray-600`}>24/7 availability with priority response times</Text>
                </View>
              </View>
              
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-jung-purple/20 rounded-full p-2 mr-3`}>
                  <Text style={tw`text-lg`}>🤝</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-jung-deep`}>Therapy Support</Text>
                  <Text style={tw`text-sm text-gray-600`}>Enhance your therapy journey with 24/7 AI assistance</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Testimonial Section */}
          <View style={tw`bg-gradient-to-br from-jung-purple/10 to-blue-100/50 rounded-xl p-6 mb-6`}>
            <Text style={tw`text-lg font-bold text-jung-deep mb-3 text-center`}>💬 What Users Say</Text>
            <Text style={tw`text-base text-gray-700 text-center italic leading-6`}>
              "Jung has been an amazing complement to my therapy sessions. Having 24/7 support between 
              appointments helps me process thoughts and maintain progress on difficult days."
            </Text>
            <Text style={tw`text-sm text-gray-500 text-center mt-2`}>- Sarah K., Premium User</Text>
          </View>

          {/* Footer spacer */}
          <View style={tw`h-8`} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
