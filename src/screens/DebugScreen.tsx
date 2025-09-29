import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { appLogger } from '../lib/debugger';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { GradientBackground } from '../components/GradientBackground';
import tw from '../lib/tailwind';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

export const DebugScreen = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter]);

  const loadLogs = async () => {
    try {
      let categoryFilter = filter === 'all' ? undefined : filter;
      const debugLogs = await appLogger.getLogs(categoryFilter, undefined, 100);
      setLogs(debugLogs);
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const exportLogs = async () => {
    try {
      const exportData = await appLogger.exportLogs();
      await Share.share({
        message: exportData,
        title: 'Jung App Debug Logs'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const clearLogs = () => {
    Alert.alert(
      'Clear Debug Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await appLogger.clearLogs();
            setLogs([]);
          }
        }
      ]
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'supabase': return 'bg-purple-100 text-purple-800';
      case 'auth': return 'bg-green-100 text-green-800';
      case 'storage': return 'bg-blue-100 text-blue-800';
      case 'network': return 'bg-orange-100 text-orange-800';
      case 'environment': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return 'XCircle';
      case 'warn': return 'Warning';
      default: return 'Info';
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Logs' },
    { key: 'supabase', label: 'Supabase' },
    { key: 'auth', label: 'Authentication' },
    { key: 'storage', label: 'Storage' },
    { key: 'network', label: 'Network' },
    { key: 'environment', label: 'Environment' }
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4 bg-white/95 border-b border-gray-200`}>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={tw`bg-gray-100 rounded-xl p-2`}
              onPress={() => navigation.goBack()}
            >
              <SafePhosphorIcon iconType="ArrowLeft" size={20} color="#4A3B78" weight="bold" />
            </TouchableOpacity>

            <Text style={tw`text-xl font-bold text-jung-purple`}>Debug Logs</Text>

            <View style={tw`flex-row space-x-2`}>
              <TouchableOpacity
                style={tw`bg-jung-purple/10 rounded-xl p-2`}
                onPress={exportLogs}
              >
                <SafePhosphorIcon iconType="Export" size={20} color="#4A3B78" weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-red-100 rounded-xl p-2`}
                onPress={clearLogs}
              >
                <SafePhosphorIcon iconType="Trash" size={20} color="#EF4444" weight="bold" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls */}
          <View style={tw`mt-4 space-y-3`}>
            {/* Auto-refresh toggle */}
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-gray-700 font-medium`}>Auto-refresh logs</Text>
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
                trackColor={{ false: '#D1D5DB', true: '#4A3B78' }}
                thumbColor={autoRefresh ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>

            {/* Filter buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw`flex-row space-x-2`}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={tw`${
                      filter === option.key
                        ? 'bg-jung-purple'
                        : 'bg-gray-100'
                    } rounded-xl px-4 py-2`}
                    onPress={() => setFilter(option.key)}
                  >
                    <Text
                      style={tw`${
                        filter === option.key
                          ? 'text-white'
                          : 'text-gray-700'
                      } font-medium text-sm`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Log count */}
            <Text style={tw`text-gray-500 text-sm`}>
              {logs.length} logs • Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Logs */}
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-6`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {logs.length === 0 ? (
            <View style={tw`bg-white rounded-2xl p-8 items-center`}>
              <SafePhosphorIcon iconType="MagnifyingGlass" size={48} color="#D1D5DB" weight="thin" />
              <Text style={tw`text-gray-500 text-lg font-medium mt-4 text-center`}>
                No Debug Logs
              </Text>
              <Text style={tw`text-gray-400 text-center mt-2`}>
                {filter === 'all'
                  ? 'No logs have been recorded yet'
                  : `No ${filter} logs found`
                }
              </Text>
            </View>
          ) : (
            <View style={tw`space-y-3`}>
              {logs.map((log, index) => (
                <View key={index} style={tw`bg-white rounded-2xl p-4 border border-gray-100`}>
                  <View style={tw`flex-row items-start justify-between mb-2`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <SafePhosphorIcon
                        iconType={getLogIcon(log.level) as any}
                        size={16}
                        color={log.level === 'error' ? '#EF4444' : log.level === 'warn' ? '#F59E0B' : '#3B82F6'}
                        weight="fill"
                      />
                      <View style={tw`ml-2 flex-1`}>
                        <View style={tw`flex-row items-center space-x-2`}>
                          <Text style={tw`${getLevelColor(log.level)} px-2 py-1 rounded-full text-xs font-bold uppercase`}>
                            {log.level}
                          </Text>
                          <Text style={tw`${getCategoryColor(log.category)} px-2 py-1 rounded-full text-xs font-medium`}>
                            {log.category}
                          </Text>
                        </View>
                        <Text style={tw`text-gray-800 font-medium mt-1`}>{log.message}</Text>
                      </View>
                    </View>
                    <Text style={tw`text-gray-400 text-xs`}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>

                  {/* Additional data */}
                  {log.data && (
                    <TouchableOpacity
                      style={tw`mt-2 p-3 bg-gray-50 rounded-xl`}
                      onPress={() => setShowDetails(!showDetails)}
                    >
                      <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-gray-600 text-sm font-medium`}>
                          Additional Details
                        </Text>
                        <SafePhosphorIcon
                          iconType={showDetails ? "CaretUp" : "CaretDown"}
                          size={16}
                          color="#6B7280"
                          weight="bold"
                        />
                      </View>
                      {showDetails && (
                        <Text style={tw`text-gray-700 text-xs mt-2 font-mono`}>
                          {JSON.stringify(log.data, null, 2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};