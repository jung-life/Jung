// Cache Metrics Dashboard for Jung Therapeutic AI
// Real-time monitoring of cache performance and system optimization

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { cacheManager } from '../lib/cacheManager';
import { cacheService } from '../lib/cacheService';
import { kvCacheService } from '../lib/kvCacheService';

interface CacheMetrics {
  healthScore: number;
  performanceMetrics: {
    hitRate: number;
    avgResponseTime: number;
    costSavings: number;
  };
  responseCacheStats: any;
  kvCacheStats: any;
  recommendations: string[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color = '#2196F3', onPress }) => (
  <TouchableOpacity
    style={[styles.metricCard, { borderLeftColor: color }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

const CacheMetricsDashboard: React.FC<{ userId?: string }> = ({ userId }) => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const [
        managementStats,
        healthScore,
        recommendations
      ] = await Promise.all([
        cacheManager.monitorCachePerformance(),
        cacheManager.getCacheHealthScore(userId),
        userId ? cacheManager.getInvalidationRecommendations(userId) : Promise.resolve([])
      ]);

      setMetrics({
        healthScore,
        performanceMetrics: managementStats.performanceMetrics,
        responseCacheStats: managementStats.responseCacheStats,
        kvCacheStats: managementStats.kvCacheStats,
        recommendations
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load cache metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleCacheCleanup = async () => {
    Alert.alert(
      'Cache Cleanup',
      'This will remove expired cache entries. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async () => {
            try {
              const cleaned = await cacheManager.manualInvalidation('global');
              Alert.alert('Success', `Cleaned up ${cleaned} cache entries`);
              loadMetrics(); // Refresh metrics
            } catch (error) {
              Alert.alert('Error', 'Failed to cleanup cache');
            }
          }
        }
      ]
    );
  };

  const handleUserCacheReset = async () => {
    if (!userId) return;

    Alert.alert(
      'Reset User Cache',
      'This will invalidate all cache entries for this user. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const invalidated = await cacheManager.manualInvalidation('user', userId);
              Alert.alert('Success', `Invalidated ${invalidated} user cache entries`);
              loadMetrics();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset user cache');
            }
          }
        }
      ]
    );
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getHealthStatus = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading cache metrics...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load cache metrics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMetrics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hitRatePercentage = Math.round(metrics.performanceMetrics.hitRate * 100);
  const healthColor = getHealthColor(metrics.healthScore);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cache Performance Dashboard</Text>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Health Score */}
      <View style={styles.section}>
        <MetricCard
          title="Cache Health Score"
          value={`${metrics.healthScore}/100`}
          subtitle={getHealthStatus(metrics.healthScore)}
          color={healthColor}
        />
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.row}>
          <MetricCard
            title="Hit Rate"
            value={`${hitRatePercentage}%`}
            subtitle={`${metrics.responseCacheStats.cacheHits} hits`}
            color="#2196F3"
          />
          <MetricCard
            title="Response Time"
            value={`${metrics.performanceMetrics.avgResponseTime}s`}
            subtitle="Average"
            color="#9C27B0"
          />
        </View>
        <View style={styles.row}>
          <MetricCard
            title="Cost Savings"
            value={`$${metrics.performanceMetrics.costSavings.toFixed(2)}`}
            subtitle="Last 7 days"
            color="#4CAF50"
          />
          <MetricCard
            title="Tokens Saved"
            value={metrics.responseCacheStats.totalTokensSaved.toLocaleString()}
            subtitle="Total"
            color="#FF9800"
          />
        </View>
      </View>

      {/* Cache Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Statistics</Text>
        <View style={styles.row}>
          <MetricCard
            title="Response Cache"
            value={metrics.responseCacheStats.totalRequests}
            subtitle={`${metrics.responseCacheStats.cacheMisses} misses`}
            color="#607D8B"
          />
          <MetricCard
            title="KV Cache Entries"
            value={metrics.kvCacheStats.totalEntries}
            subtitle={`${metrics.kvCacheStats.expiredEntries} expired`}
            color="#795548"
          />
        </View>
        <MetricCard
          title="Average Access Count"
          value={metrics.kvCacheStats.avgAccessCount}
          subtitle="Per KV entry"
          color="#3F51B5"
        />
      </View>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
          {metrics.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Text style={styles.recommendationText}>• {rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Management</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleCacheCleanup}>
          <Text style={styles.actionButtonText}>Cleanup Expired Entries</Text>
        </TouchableOpacity>
        {userId && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleUserCacheReset}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Reset User Cache
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.refreshButton} onPress={loadMetrics}>
          <Text style={styles.actionButtonText}>Refresh Metrics</Text>
        </TouchableOpacity>
      </View>

      {/* Technical Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Details</Text>
        <View style={styles.technicalDetail}>
          <Text style={styles.detailLabel}>Total Requests:</Text>
          <Text style={styles.detailValue}>{metrics.responseCacheStats.totalRequests}</Text>
        </View>
        <View style={styles.technicalDetail}>
          <Text style={styles.detailLabel}>Cache Hits:</Text>
          <Text style={styles.detailValue}>{metrics.responseCacheStats.cacheHits}</Text>
        </View>
        <View style={styles.technicalDetail}>
          <Text style={styles.detailLabel}>Cache Misses:</Text>
          <Text style={styles.detailValue}>{metrics.responseCacheStats.cacheMisses}</Text>
        </View>
        <View style={styles.technicalDetail}>
          <Text style={styles.detailLabel}>KV Total Entries:</Text>
          <Text style={styles.detailValue}>{metrics.kvCacheStats.totalEntries}</Text>
        </View>
        <View style={styles.technicalDetail}>
          <Text style={styles.detailLabel}>KV User Entries:</Text>
          <Text style={styles.detailValue}>{metrics.kvCacheStats.userEntries}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#888',
  },
  recommendation: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  recommendationText: {
    fontSize: 14,
    color: '#856404',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButtonText: {
    color: '#fff',
  },
  technicalDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#F44336',
    marginTop: 50,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 50,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CacheMetricsDashboard;