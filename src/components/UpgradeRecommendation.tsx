import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHybridSubscription } from '../hooks/useHybridSubscription';

const { width } = Dimensions.get('window');

interface UpgradeRecommendationBannerProps {
  style?: any;
}

export const UpgradeRecommendationBanner: React.FC<UpgradeRecommendationBannerProps> = ({ style }) => {
  const navigation = useNavigation();
  const {
    upgradeRecommendation,
    shouldShowUpgradePrompt,
    dismissUpgradePrompt
  } = useHybridSubscription();

  if (!shouldShowUpgradePrompt || !upgradeRecommendation) {
    return null;
  }

  const handleUpgradePress = () => {
    navigation.navigate('SubscriptionScreen' as never);
  };

  const handleDismiss = () => {
    dismissUpgradePrompt();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={20} color="#FF9800" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Save with a Subscription</Text>
          <Text style={styles.description}>
            {upgradeRecommendation.reason}
          </Text>
          {upgradeRecommendation.potential_savings > 0 && (
            <Text style={styles.savings}>
              Save ${upgradeRecommendation.potential_savings}/month
            </Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#BF360C',
    lineHeight: 16,
  },
  savings: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  dismissButton: {
    padding: 4,
  },
});