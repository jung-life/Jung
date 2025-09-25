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
import { useCredits } from '../hooks/useCredits';
import { CreditDisplay } from '../components/CreditDisplay';
import { Coins, Crown, Lightning, Gift } from 'phosphor-react-native';
import tw from '../lib/tailwind';
import { SubscriptionTier, CreditPackage as CreditPkg } from '../lib/creditService';

const CreditSubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tiers' | 'packages'>('tiers');
  
  const {
    availableTiers,
    creditPackages,
    currentTier,
    creditBalance,
    loading: creditsLoading
  } = useCredits();

  useEffect(() => {
    // Simulate loading time for UI
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePurchaseTier = async (tierId: string) => {
    try {
      setPurchasing(tierId);
      // TODO: Implement subscription tier purchase
      Alert.alert('Coming Soon', 'Subscription tier purchases will be available soon!');
    } catch (error) {
      console.error('Tier purchase error:', error);
      Alert.alert('Purchase Failed', 'Unable to process your subscription. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchasePackage = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      // TODO: Implement credit package purchase
      Alert.alert('Coming Soon', 'Credit package purchases will be available soon!');
    } catch (error) {
      console.error('Package purchase error:', error);
      Alert.alert('Purchase Failed', 'Unable to process your purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const renderTierCard = (tier: SubscriptionTier) => {
    const isActive = currentTier?.id === tier.id;
    const isPurchasing = purchasing === tier.id;
    const price = tier.priceCents / 100;
    const pricePerCredit = (tier.priceCents / tier.monthlyCredits / 100).toFixed(3);

    return (
      <View key={tier.id} style={styles.card}>
        <LinearGradient
          colors={tier.isPopular ? ['#667eea', '#764ba2'] : ['#f7fafc', '#edf2f7']}
          style={[styles.cardGradient, tier.isPopular && styles.popularCard]}
        >
          {tier.isPopular && (
            <View style={styles.popularBadge}>
              <Crown size={16} color="#fff" weight="fill" />
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={styles.tierIcon}>
              <Coins size={24} color={tier.isPopular ? '#fff' : '#667eea'} weight="fill" />
            </View>
            <Text style={[styles.tierName, tier.isPopular && styles.whiteText]}>
              {tier.name}
            </Text>
            <View style={styles.creditsContainer}>
              <Text style={[styles.creditsAmount, tier.isPopular && styles.whiteText]}>
                {tier.monthlyCredits}
              </Text>
              <Text style={[styles.creditsLabel, tier.isPopular && styles.lightText]}>
                credits/month
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, tier.isPopular && styles.whiteText]}>
                ${price === 0 ? 'Free' : price.toFixed(2)}
              </Text>
              {price > 0 && (
                <Text style={[styles.pricePerCredit, tier.isPopular && styles.lightText]}>
                  ${pricePerCredit}/credit
                </Text>
              )}
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {Array.isArray(tier.features) && tier.features.map((feature: string, index: number) => (
              <View key={index} style={styles.feature}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={[styles.featureText, tier.isPopular && styles.lightText]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handlePurchaseTier(tier.id)}
            disabled={isPurchasing || isActive || price === 0}
            style={[
              styles.subscribeButton,
              isActive && styles.disabledButton,
              tier.isPopular && !isActive && styles.whiteButton,
              !tier.isPopular && !isActive && styles.purpleButton,
              price === 0 && styles.freeButton,
            ]}
          >
            {isPurchasing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={tier.isPopular ? '#667eea' : '#fff'} />
                <Text style={[styles.buttonText, tier.isPopular && styles.purpleText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.buttonText,
                isActive && styles.grayText,
                tier.isPopular && !isActive && styles.purpleText,
                !tier.isPopular && !isActive && styles.whiteText,
                price === 0 && styles.grayText,
              ]}>
                {isActive ? 'Current Plan' : price === 0 ? 'Current' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderPackageCard = (pkg: CreditPackage) => {
    const isPurchasing = purchasing === pkg.id;
    const price = pkg.priceCents / 100;
    const pricePerCredit = (pkg.priceCents / pkg.totalCredits / 100).toFixed(3);
    const totalCredits = pkg.totalCredits + (pkg.bonusCredits || 0);

    return (
      <View key={pkg.id} style={styles.packageCard}>
        <LinearGradient
          colors={pkg.popular ? ['#10b981', '#047857'] : ['#f7fafc', '#edf2f7']}
          style={[styles.cardGradient, pkg.popular && styles.popularPackageCard]}
        >
          {pkg.popular && (
            <View style={styles.popularBadge}>
              <Zap size={16} color="#fff" weight="fill" />
              <Text style={styles.popularBadgeText}>BEST VALUE</Text>
            </View>
          )}

          {pkg.bonusCredits && (
            <View style={styles.bonusBadge}>
              <Gift size={14} color="#fff" weight="fill" />
              <Text style={styles.bonusBadgeText}>+{pkg.bonusCredits} BONUS</Text>
            </View>
          )}

          <View style={styles.packageHeader}>
            <Text style={[styles.packageName, pkg.popular && styles.whiteText]}>
              {pkg.name}
            </Text>
            <Text style={[styles.packageDescription, pkg.popular && styles.lightText]}>
              {pkg.description}
            </Text>
          </View>

          <View style={styles.packageDetails}>
            <View style={styles.creditsDisplay}>
              <Text style={[styles.packageCredits, pkg.popular && styles.whiteText]}>
                {pkg.totalCredits}
              </Text>
              {pkg.bonusCredits && (
                <Text style={[styles.bonusCredits, pkg.popular && styles.greenLightText]}>
                  +{pkg.bonusCredits}
                </Text>
              )}
              <Text style={[styles.creditsLabel, pkg.popular && styles.lightText]}>
                credits
              </Text>
            </View>
            
            <View style={styles.packagePricing}>
              <Text style={[styles.packagePrice, pkg.popular && styles.whiteText]}>
                ${price.toFixed(2)}
              </Text>
              <Text style={[styles.pricePerCredit, pkg.popular && styles.lightText]}>
                ${pricePerCredit}/credit
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handlePurchasePackage(pkg.id)}
            disabled={isPurchasing}
            style={[
              styles.purchaseButton,
              pkg.popular ? styles.whiteButton : styles.greenButton,
            ]}
          >
            {isPurchasing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={pkg.popular ? '#10b981' : '#fff'} />
                <Text style={[styles.buttonText, pkg.popular && styles.greenText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.buttonText,
                pkg.popular ? styles.greenText : styles.whiteText,
              ]}>
                Purchase Credits
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (loading || creditsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading credit options...</Text>
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
        <Text style={styles.headerTitle}>Credits & Subscriptions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Current Credit Status */}
          <View style={styles.currentStatus}>
            <CreditDisplay variant="detailed" showUpgradeButton={false} />
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('tiers')}
              style={[styles.tab, activeTab === 'tiers' && styles.activeTab]}
            >
              <Crown size={20} color={activeTab === 'tiers' ? '#fff' : '#667eea'} weight="fill" />
              <Text style={[styles.tabText, activeTab === 'tiers' && styles.activeTabText]}>
                Monthly Plans
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('packages')}
              style={[styles.tab, activeTab === 'packages' && styles.activeTab]}
            >
              <Zap size={20} color={activeTab === 'packages' ? '#fff' : '#10b981'} weight="fill" />
              <Text style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>
                Credit Packages
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'tiers' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Subscription Plans</Text>
              <Text style={styles.sectionSubtitle}>
                Get monthly credits and unlock premium features
              </Text>
              {availableTiers?.map(renderTierCard)}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>One-Time Credit Packages</Text>
              <Text style={styles.sectionSubtitle}>
                Purchase credits when you need them, no monthly commitment
              </Text>
              {creditPackages?.map(renderPackageCard)}
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How Credits Work</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Each message to an AI therapist costs 1 credit</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Monthly plans renew credits automatically</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Credit packages never expire</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Unused monthly credits don't roll over</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfServiceScreen')}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicyScreen')}>
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
    fontSize: 18,
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
    padding: 20,
  },
  currentStatus: {
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#374151',
  },
  activeTabText: {
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
  },
  packageCard: {
    marginBottom: 16,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  popularPackageCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bonusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tierIcon: {
    marginBottom: 8,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  creditsContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceContainer: {
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  pricePerCredit: {
    fontSize: 12,
    color: '#6b7280',
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsDisplay: {
    alignItems: 'center',
  },
  packageCredits: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  bonusCredits: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  packagePricing: {
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  featuresContainer: {
    marginBottom: 20,
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  freeButton: {
    backgroundColor: '#e5e7eb',
  },
  whiteButton: {
    backgroundColor: '#fff',
  },
  purpleButton: {
    backgroundColor: '#667eea',
  },
  greenButton: {
    backgroundColor: '#10b981',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  grayText: {
    color: '#6b7280',
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
    color: '#d1d5db',
  },
  greenLightText: {
    color: '#a7f3d0',
  },
  infoSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoBullet: {
    color: '#667eea',
    fontWeight: 'bold',
    marginRight: 8,
  },
  infoText: {
    color: '#374151',
    flex: 1,
  },
  footer: {
    marginTop: 16,
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

export default CreditSubscriptionScreen;
