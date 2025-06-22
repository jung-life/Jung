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

export default function SimpleSubscriptionScreen() {
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

  const renderSubscriptionCard = (tier: any) => (
    <View key={tier.id} style={styles.card}>
      <LinearGradient
        colors={tier.id === 'basic' ? ['#667eea', '#764ba2'] : ['#f7fafc', '#edf2f7']}
        style={styles.cardGradient}
      >
        <Text style={[styles.cardTitle, tier.id === 'basic' && styles.whiteText]}>
          {tier.name}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.price, tier.id === 'basic' && styles.whiteText]}>
            {tier.priceCents === 0 ? 'Free' : `$${(tier.priceCents / 100).toFixed(2)}`}
          </Text>
          {tier.priceCents > 0 && (
            <Text style={[styles.period, tier.id === 'basic' && styles.lightText]}>
              /month
            </Text>
          )}
        </View>
        
        <Text style={[styles.credits, tier.id === 'basic' && styles.lightText]}>
          {tier.monthlyCredits} credits/month
        </Text>
        
        <TouchableOpacity
          style={[styles.button, tier.id === 'basic' && styles.whiteButton]}
          onPress={() => handleSubscriptionSelect(tier.id)}
        >
          <Text style={[styles.buttonText, tier.id === 'basic' && styles.purpleText]}>
            Select Plan
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Credit Status */}
        <View style={styles.creditSection}>
          <CreditDisplay variant="detailed" showUpgradeButton={false} />
        </View>

        {/* Header */}
        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>Transparent Pricing</Text>
          <Text style={styles.subtitle}>
            Choose credit packages for flexibility or monthly plans for convenience.
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
              Pay only for what you use. Credits never expire.
            </Text>
            
            {creditPackages.length > 0 ? (
              creditPackages.map(renderCreditPackageCard)
            ) : (
              <Text style={styles.noDataText}>No credit packages available</Text>
            )}
          </View>
        )}

        {activeTab === 'subscriptions' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Monthly Credit Plans</Text>
            <Text style={styles.sectionDescription}>
              Get monthly credits automatically with discounts.
            </Text>
            
            {subscriptionTiers.length > 0 ? (
              subscriptionTiers.map(renderSubscriptionCard)
            ) : (
              <Text style={styles.noDataText}>No subscription plans available</Text>
            )}
          </View>
        )}
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
