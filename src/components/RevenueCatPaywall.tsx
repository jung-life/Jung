import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { PurchasesPackage } from 'react-native-purchases';

interface RevenueCatPaywallProps {
  onPurchaseSuccess?: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export const RevenueCatPaywall: React.FC<RevenueCatPaywallProps> = ({
  onPurchaseSuccess,
  onClose,
  title = 'Upgrade to Premium',
  subtitle = 'Unlock all features and get unlimited access',
}) => {
  const {
    currentOffering,
    isLoading,
    purchasePackage,
    restorePurchases,
    error,
  } = useRevenueCat();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const success = await purchasePackage(packageToPurchase);
      if (success) {
        Alert.alert(
          'Purchase Successful!',
          'Thank you for upgrading to Premium. Enjoy all the features!',
          [
            {
              text: 'OK',
              onPress: () => onPurchaseSuccess?.(),
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', 'Please try again or contact support.');
      }
    } catch (err) {
      Alert.alert('Purchase Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert(
          'Purchases Restored!',
          'Your previous purchases have been restored.',
          [
            {
              text: 'OK',
              onPress: () => onPurchaseSuccess?.(),
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (err) {
      Alert.alert('Restore Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const formatPrice = (packageItem: PurchasesPackage): string => {
    const { product } = packageItem;
    return `${product.priceString}`;
  };

  const getPackageTitle = (packageItem: PurchasesPackage): string => {
    const { identifier } = packageItem;
    
    // Common package identifiers and their display names
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Annual';
    if (identifier.includes('weekly')) return 'Weekly';
    if (identifier.includes('lifetime')) return 'Lifetime';
    
    // Default to the identifier
    return identifier.replace('$rc_', '').replace('_', ' ').toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A3B78" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            Unable to load subscription options. Please check your connection and try again.
          </Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!currentOffering || !currentOffering.availablePackages.length) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Options Available</Text>
          <Text style={styles.errorText}>
            No subscription options are currently available. Please try again later.
          </Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.packagesContainer}>
          {currentOffering.availablePackages.map((packageItem, index) => (
            <TouchableOpacity
              key={packageItem.identifier}
              style={[
                styles.packageButton,
                index === 0 && styles.popularPackage, // Mark first package as popular
              ]}
              onPress={() => handlePurchase(packageItem)}
              disabled={purchasing}
            >
              {index === 0 && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              <View style={styles.packageContent}>
                <Text style={styles.packageTitle}>
                  {getPackageTitle(packageItem)}
                </Text>
                <Text style={styles.packagePrice}>
                  {formatPrice(packageItem)}
                </Text>
                {packageItem.product.introPrice && (
                  <Text style={styles.packageTrial}>
                    {`${packageItem.product.introPrice.periodNumberOfUnits} ${packageItem.product.introPrice.periodUnit} free trial`}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {purchasing && (
          <View style={styles.purchasingOverlay}>
            <ActivityIndicator size="large" color="#4A3B78" />
            <Text style={styles.purchasingText}>Processing purchase...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.restoreButtonText}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A3B78',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  packagesContainer: {
    marginBottom: 40,
  },
  packageButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  popularPackage: {
    borderColor: '#4A3B78',
    backgroundColor: '#f8f6ff',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#4A3B78',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageContent: {
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3B78',
    marginBottom: 4,
  },
  packageTrial: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A3B78',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  restoreButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#4A3B78',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default RevenueCatPaywall;
