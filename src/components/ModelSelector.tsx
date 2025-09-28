import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import { getActiveModels, ModelConfig, ModelStrategy } from '../config/models';
import tw from '../lib/tailwind';

interface ModelSelectorProps {
  selectedStrategy: ModelStrategy;
  onStrategyChange: (strategy: ModelStrategy) => void;
  showCosts?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedStrategy,
  onStrategyChange,
  showCosts = true
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const models = getActiveModels();

  const strategies: Array<{
    id: ModelStrategy;
    name: string;
    description: string;
    icon: string;
    color: string;
  }> = [
    {
      id: 'cost-optimized',
      name: 'Cost Optimized',
      description: 'Cheapest models, best for high volume',
      icon: 'CurrencyDollar',
      color: '#10B981'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good quality at reasonable cost',
      icon: 'ScaleBalance',
      color: '#6366F1'
    },
    {
      id: 'quality-first',
      name: 'Quality First',
      description: 'Best models, higher cost',
      icon: 'Star',
      color: '#F59E0B'
    }
  ];

  const formatCost = (cost: number) => {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(2)}/1K`;
    }
    return `$${cost.toFixed(4)}/1M`;
  };

  return (
    <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-lg font-bold text-jung-deep`}>AI Model Strategy</Text>
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={tw`p-2`}
        >
          <SafePhosphorIcon
            iconType={showDetails ? 'CaretUp' : 'CaretDown'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Strategy Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
        {strategies.map((strategy) => (
          <TouchableOpacity
            key={strategy.id}
            onPress={() => onStrategyChange(strategy.id)}
            style={[
              tw`mr-3 p-3 rounded-xl border-2 min-w-32`,
              selectedStrategy === strategy.id
                ? tw`border-jung-purple bg-jung-purple/10`
                : tw`border-gray-200 bg-gray-50`
            ]}
          >
            <View style={tw`items-center`}>
              <View
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center mb-2`,
                  { backgroundColor: strategy.color + '20' }
                ]}
              >
                <SafePhosphorIcon
                  iconType={strategy.icon as any}
                  size={16}
                  color={strategy.color}
                  weight="bold"
                />
              </View>
              <Text
                style={[
                  tw`text-sm font-bold text-center`,
                  selectedStrategy === strategy.id ? tw`text-jung-purple` : tw`text-gray-700`
                ]}
              >
                {strategy.name}
              </Text>
              <Text style={tw`text-xs text-gray-500 text-center mt-1`}>
                {strategy.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detailed Model Information */}
      {showDetails && (
        <View style={tw`border-t border-gray-200 pt-4`}>
          <Text style={tw`text-md font-semibold text-gray-700 mb-3`}>
            Available Models
          </Text>
          {models.map((model: ModelConfig) => (
            <View
              key={model.name}
              style={tw`flex-row items-center justify-between py-2 border-b border-gray-100`}
            >
              <View style={tw`flex-1`}>
                <Text style={tw`font-medium text-gray-800`}>{model.name}</Text>
                <Text style={tw`text-xs text-gray-500`}>{model.description}</Text>
                <View style={tw`flex-row mt-1`}>
                  {model.features.slice(0, 2).map((feature, idx) => (
                    <View
                      key={idx}
                      style={tw`bg-gray-100 px-2 py-0.5 rounded mr-2`}
                    >
                      <Text style={tw`text-xs text-gray-600`}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {showCosts && (
                <View style={tw`items-end ml-3`}>
                  <Text style={tw`text-xs text-gray-500`}>Input</Text>
                  <Text style={tw`text-sm font-medium`}>
                    {formatCost(model.inputCostPer1M)}
                  </Text>
                  <Text style={tw`text-xs text-gray-500 mt-1`}>Output</Text>
                  <Text style={tw`text-sm font-medium`}>
                    {formatCost(model.outputCostPer1M)}
                  </Text>
                </View>
              )}
            </View>
          ))}

          <View style={tw`mt-3 p-3 bg-blue-50 rounded-lg`}>
            <Text style={tw`text-xs text-blue-800 font-medium mb-1`}>
              💡 Cost Optimization Tips
            </Text>
            <Text style={tw`text-xs text-blue-700`}>
              • Cost-optimized uses cheapest models first{'\n'}
              • Quality-first prioritizes best responses{'\n'}
              • Balanced gives good quality at reasonable cost{'\n'}
              • System automatically falls back if a model fails
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};