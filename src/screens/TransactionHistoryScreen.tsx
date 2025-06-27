import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  MagnifyingGlass,
  FunnelSimple,
  Download,
  Coins,
  TrendUp,
  TrendDown,
  Gift,
  CreditCard,
  Clock,
  X,
} from 'phosphor-react-native';
import tw from '../lib/tailwind';
import { creditService, CreditTransaction } from '../lib/creditService';
import { useAuth } from '../hooks/useAuth';

interface FilterOptions {
  transactionType: string[];
  sourceType: string[];
  dateRange: '7d' | '30d' | '90d' | 'all';
}

export const TransactionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    transactionType: [],
    sourceType: [],
    dateRange: '30d',
  });

  useEffect(() => {
    if (session?.user) {
      loadTransactions();
    }
  }, [session?.user, filters]);

  const loadTransactions = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const data = await creditService.getCreditTransactions(session.user.id, 100);
      setTransactions(applyFilters(data));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const applyFilters = (data: CreditTransaction[]): CreditTransaction[] => {
    let filtered = [...data];

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(t => new Date(t.createdAt) >= cutoffDate);
    }

    // Apply transaction type filter
    if (filters.transactionType.length > 0) {
      filtered = filtered.filter(t => filters.transactionType.includes(t.transactionType));
    }

    // Apply source type filter
    if (filters.sourceType.length > 0) {
      filtered = filtered.filter(t => filters.sourceType.includes(t.sourceType));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.transactionType.toLowerCase().includes(query) ||
        t.sourceType.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getTransactionIcon = (transaction: CreditTransaction) => {
    switch (transaction.transactionType) {
      case 'earned':
      case 'granted':
        return <Gift size={20} color="#10B981" weight="fill" />;
      case 'purchased':
        return <CreditCard size={20} color="#3B82F6" weight="fill" />;
      case 'spent':
        return <TrendDown size={20} color="#EF4444" weight="fill" />;
      case 'expired':
        return <Clock size={20} color="#6B7280" weight="fill" />;
      case 'refunded':
        return <TrendUp size={20} color="#10B981" weight="fill" />;
      default:
        return <Coins size={20} color="#4A3B78" weight="fill" />;
    }
  };

  const getTransactionColor = (transaction: CreditTransaction) => {
    switch (transaction.transactionType) {
      case 'earned':
      case 'granted':
      case 'refunded':
        return 'text-green-600';
      case 'purchased':
        return 'text-blue-600';
      case 'spent':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number) => {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1 p-4`}>
          {/* Date Range Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold text-gray-900 mb-3`}>Date Range</Text>
            {['7d', '30d', '90d', 'all'].map((range) => (
              <TouchableOpacity
                key={range}
                style={tw`flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg border ${
                  filters.dateRange === range ? 'border-jung-purple bg-jung-purple/10' : 'border-gray-200'
                }`}
                onPress={() => setFilters(prev => ({ ...prev, dateRange: range as any }))}
              >
                <Text style={tw`text-gray-700`}>
                  {range === '7d' ? 'Last 7 days' : 
                   range === '30d' ? 'Last 30 days' : 
                   range === '90d' ? 'Last 90 days' : 
                   range === 'all' ? 'All time' : ''}
                </Text>
                {filters.dateRange === range && (
                  <View style={tw`w-5 h-5 rounded-full bg-jung-purple`} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction Type Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold text-gray-900 mb-3`}>Transaction Type</Text>
            {['earned', 'spent', 'purchased', 'granted', 'expired', 'refunded'].map((type) => (
              <TouchableOpacity
                key={type}
                style={tw`flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg border ${
                  filters.transactionType.includes(type) ? 'border-jung-purple bg-jung-purple/10' : 'border-gray-200'
                }`}
                onPress={() => {
                  setFilters(prev => ({
                    ...prev,
                    transactionType: prev.transactionType.includes(type)
                      ? prev.transactionType.filter(t => t !== type)
                      : [...prev.transactionType, type]
                  }));
                }}
              >
                <Text style={tw`text-gray-700 capitalize`}>{type}</Text>
                {filters.transactionType.includes(type) && (
                  <View style={tw`w-5 h-5 rounded-full bg-jung-purple`} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={tw`p-4 border-t border-gray-200`}>
          <TouchableOpacity
            style={tw`bg-jung-purple rounded-lg py-3 px-4 mb-2`}
            onPress={() => setShowFilters(false)}
          >
            <Text style={tw`text-white text-center font-semibold`}>Apply Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw`bg-gray-100 rounded-lg py-3 px-4`}
            onPress={() => {
              setFilters({
                transactionType: [],
                sourceType: [],
                dateRange: '30d',
              });
              setSearchQuery('');
            }}
          >
            <Text style={tw`text-gray-700 text-center font-medium`}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#4A3B78" />
          <Text style={tw`mt-4 text-gray-600`}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between p-4 bg-white border-b border-gray-200`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-gray-900`}>Transaction History</Text>
        <TouchableOpacity>
          <Download size={24} color="#4A3B78" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={tw`flex-row items-center p-4 bg-white border-b border-gray-200`}>
        <View style={tw`flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mr-3`}>
          <MagnifyingGlass size={20} color="#6B7280" />
          <TextInput
            style={tw`flex-1 ml-2 text-gray-700`}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={tw`p-2 bg-jung-purple rounded-lg`}
          onPress={() => setShowFilters(true)}
        >
          <FunnelSimple size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {transactions.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center py-20`}>
            <Coins size={48} color="#D1D5DB" />
            <Text style={tw`mt-4 text-lg font-semibold text-gray-500`}>No transactions found</Text>
            <Text style={tw`mt-2 text-gray-400 text-center`}>
              {searchQuery || filters.transactionType.length > 0
                ? 'Try adjusting your filters'
                : 'Your transaction history will appear here'}
            </Text>
          </View>
        ) : (
          <View style={tw`p-4`}>
            {transactions.map((transaction) => (
              <View
                key={transaction.id}
                style={tw`bg-white rounded-lg p-4 mb-3 border border-gray-200`}
              >
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <View style={tw`flex-row items-center`}>
                    {getTransactionIcon(transaction)}
                    <View style={tw`ml-3`}>
                      <Text style={tw`font-semibold text-gray-900 capitalize`}>
                        {transaction.transactionType} Credits
                      </Text>
                      <Text style={tw`text-sm text-gray-500`}>
                        {transaction.sourceType}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={tw`items-end`}>
                    <Text style={tw`font-bold text-lg ${getTransactionColor(transaction)}`}>
                      {formatAmount(transaction.amount)}
                    </Text>
                    <Text style={tw`text-sm text-gray-500`}>
                      Balance: {transaction.balanceAfter}
                    </Text>
                  </View>
                </View>

                {transaction.description && (
                  <Text style={tw`text-sm text-gray-600 mb-2`}>
                    {transaction.description}
                  </Text>
                )}

                <Text style={tw`text-xs text-gray-400`}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FilterModal />
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;
