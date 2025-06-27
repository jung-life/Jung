import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Coins, Info, Calculator } from 'phosphor-react-native';
import tw from '../lib/tailwind';

interface MessageCostPreviewProps {
  messageLength: number;
  hasImages: boolean;
  conversationContext?: number;
  onCostUpdate?: (cost: number) => void;
  showDetails?: boolean;
}

export const MessageCostPreview: React.FC<MessageCostPreviewProps> = ({
  messageLength,
  hasImages,
  conversationContext = 0,
  onCostUpdate,
  showDetails: initialShowDetails = false
}) => {
  const [cost, setCost] = useState(1);
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [breakdown, setBreakdown] = useState<{
    baseCost: number;
    lengthSurcharge: number;
    imageCost: number;
    contextCost: number;
  }>({
    baseCost: 1,
    lengthSurcharge: 0,
    imageCost: 0,
    contextCost: 0
  });

  useEffect(() => {
    calculateCost();
  }, [messageLength, hasImages, conversationContext]);

  const calculateCost = () => {
    let baseCost = 1; // Base cost for any message
    let lengthSurcharge = 0;
    let imageCost = 0;
    let contextCost = 0;

    // Length-based pricing
    if (messageLength > 2000) {
      lengthSurcharge = 1; // +1 credit for long messages
    } else if (messageLength > 1000) {
      lengthSurcharge = 0.5; // +0.5 credit for medium messages
    }

    // Image analysis cost
    if (hasImages) {
      imageCost = 2; // +2 credits for image processing
    }

    // Context complexity cost
    if (conversationContext > 5000) {
      contextCost = 1; // +1 credit for complex context
    }

    const totalCost = Math.ceil(baseCost + lengthSurcharge + imageCost + contextCost);
    
    setCost(totalCost);
    setBreakdown({
      baseCost,
      lengthSurcharge,
      imageCost,
      contextCost
    });

    if (onCostUpdate) {
      onCostUpdate(totalCost);
    }
  };

  const CostBreakdown = () => (
    <View style={tw`mt-2 p-2 bg-gray-50 rounded-lg`}>
      <Text style={tw`text-xs font-medium text-gray-700 mb-1`}>Cost Breakdown:</Text>
      
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-xs text-gray-600`}>Base message cost</Text>
        <Text style={tw`text-xs font-medium text-gray-800`}>{breakdown.baseCost} credit</Text>
      </View>
      
      {breakdown.lengthSurcharge > 0 && (
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-xs text-gray-600`}>Length surcharge</Text>
          <Text style={tw`text-xs font-medium text-amber-600`}>+{breakdown.lengthSurcharge} credit</Text>
        </View>
      )}
      
      {breakdown.imageCost > 0 && (
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-xs text-gray-600`}>Image analysis</Text>
          <Text style={tw`text-xs font-medium text-blue-600`}>+{breakdown.imageCost} credits</Text>
        </View>
      )}
      
      {breakdown.contextCost > 0 && (
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-xs text-gray-600`}>Complex context</Text>
          <Text style={tw`text-xs font-medium text-purple-600`}>+{breakdown.contextCost} credit</Text>
        </View>
      )}
      
      <View style={tw`flex-row justify-between border-t border-gray-200 pt-1 mt-1`}>
        <Text style={tw`text-xs font-semibold text-gray-800`}>Total Cost</Text>
        <Text style={tw`text-xs font-bold text-jung-purple`}>{cost} credits</Text>
      </View>
    </View>
  );

  if (cost === 1 && !showDetails) {
    // Simple display for standard messages
    return (
      <View style={tw`flex-row items-center bg-jung-purple/10 rounded-lg px-3 py-2`}>
        <Coins size={16} color="#4A3B78" weight="fill" />
        <Text style={tw`ml-2 text-sm font-medium text-jung-purple`}>
          1 credit
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`bg-white border border-gray-200 rounded-lg p-3`}>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center`}>
          <Coins size={18} color="#4A3B78" weight="fill" />
          <Text style={tw`ml-2 text-sm font-semibold text-jung-purple`}>
            {cost} credit{cost !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {(cost > 1 || showDetails) && (
          <TouchableOpacity 
            style={tw`flex-row items-center`}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Calculator size={14} color="#6B7280" />
            <Text style={tw`ml-1 text-xs text-gray-500`}>Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {cost > 1 && (
        <View style={tw`mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200`}>
          <View style={tw`flex-row items-center`}>
            <Info size={14} color="#F59E0B" />
            <Text style={tw`ml-1 text-xs text-amber-800 font-medium`}>
              Higher cost due to:
            </Text>
          </View>
          <View style={tw`mt-1`}>
            {breakdown.lengthSurcharge > 0 && (
              <Text style={tw`text-xs text-amber-700`}>• Long message ({messageLength} characters)</Text>
            )}
            {breakdown.imageCost > 0 && (
              <Text style={tw`text-xs text-amber-700`}>• Image analysis required</Text>
            )}
            {breakdown.contextCost > 0 && (
              <Text style={tw`text-xs text-amber-700`}>• Complex conversation context</Text>
            )}
          </View>
        </View>
      )}

      {showDetails ? <CostBreakdown /> : null}
    </View>
  );
};

export default MessageCostPreview;
