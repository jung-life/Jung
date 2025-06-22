import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHybridSubscription } from '../hooks/useHybridSubscription';
import { useCredits } from '../hooks/useCredits';
import { CreditDisplay } from '../components/CreditDisplay';
import { UpgradeRecommendationBanner } from '../components/UpgradeRecommendation';

const { width } = Dimensions.get('window');

interface SubscriptionCardProps {
  tier: any;
  isCurrentTier: boolean;
  isRecommended: boolean;
  onSelect: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  tier,
  isCurrentTier,
  isRecommended,
  onSelect
}) => (
  <View style={[
    styles.subscriptionCard,
    isRecommended && styles.recommendedCard,
    isCurrentTier && styles.currentTierCard
  ]}>
    <LinearGradient
      colors={isRecommended ? ['#FF9800', '#F57C00'] : isCurrentTier ? ['#4CAF50', '#388E3C'] : ['#f7fafc', '#edf2f7']}
      style={styles.cardGradient}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}
      
      {isCurrentTier && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentText}>CURRENT PLAN</Text>
        </View>
      )}
      
      <Text style={[styles.tierName, (isRecommended || isCurrentTier) && styles.whiteText]}>
        {tier.name}
      </Text>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.price, (isRecommended || isCurrentTier) && styles.whiteText]}>
          {tier.price_cents === 0 ? 'Free' : `$${(tier.price_cents / 100).toFixed(2)}`}
        </Text>
        {tier.price_cents > 0 && (
          <Text style={[styles.priceFrequency, (isRecommended || isCurrentTier) && styles.lightText]}>
            /month
          </Text>
        )}
      </View>
      
      <View style={styles.creditsContainer}>
        <Text style={[styles.creditsText, (isRecommended || isCurrentTier) && styles.lightText]}>
          {tier.monthly_credits} credits/month
        </Text>
        {tier.max_rollover > 0 && (
          <Text style={[styles.rolloverText, (isRecommended || isCurrentTier) && styles.lightText]}>
            Up to {tier.max_rollover} credits rollover
          </Text>
        )}
      </View>
      
      <View style={styles.featuresContainer}>
        {tier.features.map((feature: string, index: number) => (
          <View key={index} style={styles.feature}>
            <Ionicons 
              name="checkmark" 
              size={16} 
              color={isRecommended || isCurrentTier ? "#fff" : "#4CAF50"} 
            />
            <Text style={[styles.featureText, (isRecommended || isCurrentTier) && styles.lightText]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          isCurrentTier && styles.currentTierButton,
          isRecommended && styles.recommendedButton,
          !isRecommended && !isCurrentTier && styles.defaultButton
        ]}
        onPress={onSelect}
        disabled={isCurrentTier}
      >
        <Text style={[
          styles.selectButtonText,
          isCurrentTier && styles.currentTierButtonText,
          isRecommended && styles.recommendedButtonText
        ]}>
          {isCurrentTier ? 'Current Plan' : 'Select Plan'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

interface CreditPackageCardProps {
  package: any;
  onSelect: () => void;
}

const CreditPackageCard: React.FC<CreditPackageCardProps> = ({ package: pkg, onSelect }) => {
  const isPopular = pkg.name.toLowerCase().includes('popular');
  
  return (
    <View style={[styles.creditPackageCard, isPopular && styles.popularPackageCard]}>
      <LinearGradient
        colors={isPopular ? ['#10b981', '#047857'] : ['#f7fafc', '#edf2f7']}
        style={styles.cardGradient}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>BEST VALUE</Text>
          </View>
        )}
        
        <Text style={[styles.packageName, isPopular && styles.whiteText]}>
          {pkg.name}
        </Text>
        
        <View style={styles.packageCreditsContainer}>
          <Text style={[styles.packageCredits, isPopular && styles.whiteText]}>
            {pkg.credits} credits
          </Text>
          {pkg.bonus_credits > 0 && (
            <Text style={[styles.bonusCredits, isPopular && styles.lightText]}>
              + {pkg.bonus_credits} bonus
            </Text>
          )}
          <Text style={[styles.totalCredits, isPopular && styles.lightText]}>
            = {pkg.total_credits} total credits
          </Text>
        </View>
        
        <Text style={[styles.packagePrice, isPopular && styles.whiteText]}>
          ${(pkg.price_cents / 100).toFixed(2)}
        </Text>
        
        <Text style={[styles.pricePerCredit, isPopular && styles.lightText]}>
          ${(pkg.price_cents / pkg.total_credits / 100).toFixed(3)} per credit
        </Text>
        
        <Text style={[styles.packageDescription, isPopular && styles.lightText]}>
          {pkg.description}
        </Text>
        
        <TouchableOpacity
          style={[styles.packageButton, isPopular && styles.popularPackageButton]}
          onPress={onSelect}
        >
          <Text style={[styles.packageButtonText, isPopular && styles.popularPackageButtonText]}>
            Purchase
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default function HybridSubscriptionScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>('credits');
  
  const {
    subscriptionTiers,
    currentSubscription,
    upgradeRecommendation,
    createSubscription,
    isLoading
  } = useHybridSubscription();
  
  const { creditPackages } = useCredits();

  const handleSubscriptionSelect = async (tierId: string) => {
    try {
      await createSubscription(tierId);
      Alert.alert('Success', 'Subscription activated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to activate subscription. Please try again.');
    }
  };

  const handleCreditPackageSelect = (packageId: string) => {
    // Navigate to purchase flow
    Alert.alert('Coming Soon', 'Credit package purchases will be available soon!');
  };

  const renderUpgradeRecommendation = () => {
    if (!upgradeRecommendation) return null;
    
    return (
      <View style={styles.recommendationContainer}>
        <View style={styles.recommendationHeader}>
          <Ionicons name="bulb" size={24} color="#FF9800" />
          <Text style={styles.recommendationTitle}>Recommendation for You</Text>
        </View>
        
        <Text style={styles.recommendationText}>
          {upgradeRecommendation.reason}
        </Text>
        
        {upgradeRecommendation.potential_savings > 0 && (
          <Text style={styles.savingsText}>
            Potential monthly savings: ${upgradeRecommendation.potential_savings}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading pricing options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Credit Status */}
        <View style={styles.creditSection}>
          <CreditDisplay variant="detailed" showUpgradeButton={false} />
        </View>

        {/* Upgrade Recommendation Banner */}
        <UpgradeRecommendationBanner />

        {/* Header */}
        <View style={styles.introSection}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.iconContainer}
          >
            <Text style={styles.crownIcon}>💎</Text>
          </LinearGradient>
          <Text style={styles.mainTitle}>
            Transparent Pricing
          </Text>
          <Text style={styles.subtitle}>
            Choose credit packages for flexibility or monthly plans for convenience. 
            Always know exactly what you're paying for.
          </Text>
        </View>

        {/* Tab Container */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('credits')}
            style={[styles.tab, activeTab === 'credits' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'credits' && styles.activeTabText]}>
              Credit Packages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('subscriptions')}
            style={[styles.tab, activeTab === 'subscriptions' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.activeTabText]}>
              Monthly Plans
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'credits' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>One-Time Credit Packages</Text>
            <Text style={styles.sectionDescription}>
              Pay only for what you use. Credits never expire. No monthly commitment.
            </Text>
            
            <View style={styles.packagesGrid}>
              {creditPackages && creditPackages.length > 0 ? (
                creditPackages.map((pkg) => (
                  <CreditPackageCard
                    key={pkg.id}
                    package={pkg}
                    onSelect={() => handleCreditPackageSelect(pkg.id)}
                  />
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Loading credit packages...</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'subscriptions' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Monthly Credit Plans</Text>
            <Text style={styles.sectionDescription}>
              Get monthly credits automatically plus discounts on additional purchases.
            </Text>
            
            {renderUpgradeRecommendation()}
            
            <View style={styles.subscriptionsContainer}>
              {subscriptionTiers && subscriptionTiers.length > 0 ? (
                subscriptionTiers.map((tier) => (
                  <SubscriptionCard
                    key={tier.id}
                    tier={tier}
                    isCurrentTier={currentSubscription?.tier_id === tier.id}
                    isRecommended={upgradeRecommendation?.recommended_tier === tier.id}
                    onSelect={() => handleSubscriptionSelect(tier.id)}
                  />
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Loading subscription tiers...</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <Text style={styles.valueTitle}>Why Choose Jung?</Text>
          <View style={styles.valuePoints}>
            <View style={styles.valuePoint}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.valueText}>Complete price transparency</Text>
            </View>
            <View style={styles.valuePoint}>
              <Ionicons name="time" size={20} color="#4CAF50" />
              <Text style={styles.valueText}>Credits never expire</Text>
            </View>
            <View style={styles.valuePoint}>
              <Ionicons name="trending-down" size={20} color="#4CAF50" />
              <Text style={styles.valueText}>95% cheaper than traditional therapy</Text>
            </View>
            <View style={styles.valuePoint}>
              <Ionicons name="people" size={20} color="#4CAF50" />
              <Text style={styles.valueText}>Chat with famous psychologists</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService' as never)}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy' as never)}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    color: '#6b7280',
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
    paddingHorizontal: 20,
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
  recommendationContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
  },
  packagesGrid: {
    gap: 16,
  },
  subscriptionsContainer: {
    gap: 16,
  },
  subscriptionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  creditPackageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  popularPackageCard: {
    transform: [{ scale: 1.02 }],
  },
  recommendedCard: {
    transform: [{ scale: 1.02 }],
  },
  currentTierCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardGradient: {
    padding: 20,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -45 }],
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -35 }],
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  priceFrequency: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  creditsContainer: {
    marginBottom: 16,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  rolloverText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  packageCreditsContainer: {
    marginBottom: 8,
  },
  packageCredits: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  bonusCredits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  totalCredits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  pricePerCredit: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  packageButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  popularPackageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  currentTierButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recommendedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  defaultButton: {
    backgroundColor: '#667eea',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  packageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  popularPackageButtonText: {
    color: '#fff',
  },
  currentTierButtonText: {
    color: '#fff',
  },
  recommendedButtonText: {
    color: '#fff',
  },
  whiteText: {
    color: '#fff',
  },
  lightText: {
    color: '#e0e0e0',
  },
  valueSection: {
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  valuePoints: {
    gap: 12,
  },
  valuePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
