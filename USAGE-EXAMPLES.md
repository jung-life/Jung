
# Credit Transparency Components - Usage Examples

## 1. MessageCostPreview Component

### Basic Usage
```tsx
<MessageCostPreview
  messageLength={inputText.length}
  hasImages={attachedImages.length > 0}
  onCostUpdate={(cost) => setEstimatedCost(cost)}
/>
```

### Advanced Usage with Context
```tsx
<MessageCostPreview
  messageLength={inputText.length}
  hasImages={attachedImages.length > 0}
  conversationContext={conversationHistory.reduce((total, msg) => total + msg.content.length, 0)}
  showDetails={true}
  onCostUpdate={(cost) => {
    setEstimatedCost(cost);
    // Update UI state based on cost
    setCanAffordMessage(userCredits >= cost);
  }}
/>
```

## 2. CreditBatteryIndicator Component

### Header Usage (Compact)
```tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  maxCredits={subscriptionTier.monthlyCredits}
  variant="circular"
  size="sm"
  showPercentage={false}
  onPress={() => navigation.navigate('Subscription')}
/>
```

### Dashboard Usage (Detailed)
```tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  maxCredits={subscriptionTier.monthlyCredits}
  variant="horizontal"
  size="lg"
  showWarnings={true}
  showPercentage={true}
  onPress={() => navigation.navigate('TransactionHistory')}
/>
```

### Sidebar Usage (Vertical)
```tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  variant="vertical"
  showWarnings={true}
  onPress={() => navigation.navigate('Subscription')}
/>
```

## 3. TransactionHistoryScreen Integration

### Navigation
```tsx
// From any screen:
navigation.navigate('TransactionHistory');

// With custom header:
<TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
  <Text>View Transaction History</Text>
</TouchableOpacity>
```

## 4. Complete Chat Integration Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import MessageCostPreview from '../components/MessageCostPreview';
import { useCredits } from '../hooks/useCredits';
import { creditService } from '../lib/creditService';

const ChatInput = ({ onSendMessage, userId }) => {
  const [inputText, setInputText] = useState('');
  const [messageCost, setMessageCost] = useState(1);
  const [canAfford, setCanAfford] = useState(true);
  const { creditBalance } = useCredits();

  useEffect(() => {
    setCanAfford((creditBalance?.currentBalance || 0) >= messageCost);
  }, [creditBalance, messageCost]);

  const handleSend = async () => {
    if (!canAfford) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${messageCost} credits to send this message.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    try {
      // Send message
      const messageId = await onSendMessage(inputText);
      
      // Deduct credits
      await creditService.spendCredits(userId, messageCost, 'usage', messageId);
      
      // Reset input
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View>
      <MessageCostPreview
        messageLength={inputText.length}
        hasImages={false}
        onCostUpdate={setMessageCost}
      />
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          style={{ flex: 1 }}
        />
        
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canAfford || !inputText.trim()}
          style={{
            backgroundColor: canAfford ? '#4A3B78' : '#9CA3AF',
            padding: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white' }}>
            Send (${messageCost} credits)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

## 5. Credit Warnings and Notifications

```tsx
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useCredits } from '../hooks/useCredits';

const CreditMonitor = () => {
  const { creditBalance } = useCredits();

  useEffect(() => {
    const credits = creditBalance?.currentBalance || 0;
    
    // Show warning for low credits
    if (credits <= 5 && credits > 0) {
      Alert.alert(
        'Low Credits',
        `You have ${credits} credits remaining. Consider purchasing more to continue conversations.`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Buy Now', onPress: () => navigation.navigate('Subscription') }
        ]
      );
    }
    
    // Show critical warning for very low credits
    if (credits === 0) {
      Alert.alert(
        'Out of Credits',
        'You have no credits remaining. Purchase credits to continue using the app.',
        [{ text: 'Buy Credits', onPress: () => navigation.navigate('Subscription') }]
      );
    }
  }, [creditBalance]);

  return null;
};
```
