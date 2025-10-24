#!/usr/bin/env node

/**
 * Implementation Script for Phase 1: Enhanced Credit Display & Transparency
 * 
 * This script implements the components and features from Phase 1 of the 
 * Credit Balance Management Plan.
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_CREATED = [
  'src/components/MessageCostPreview.tsx',
  'src/components/CreditBatteryIndicator.tsx',
  'src/screens/TransactionHistoryScreen.tsx'
];

const IMPLEMENTATION_STEPS = [
  {
    step: 1,
    title: 'Add TransactionHistory to Navigation',
    description: 'Add the TransactionHistoryScreen to the navigation stack',
    file: 'src/navigation/types.ts',
    action: 'ADD_ROUTE'
  },
  {
    step: 2,
    title: 'Integrate MessageCostPreview in ChatScreen',
    description: 'Add real-time cost preview in the chat input area',
    file: 'src/screens/ChatScreen.tsx',
    action: 'INTEGRATE_COMPONENT'
  },
  {
    step: 3,
    title: 'Add CreditBatteryIndicator to Header',
    description: 'Replace or enhance existing credit display with battery indicator',
    file: 'src/components/HamburgerMenu.tsx',
    action: 'REPLACE_COMPONENT'
  },
  {
    step: 4,
    title: 'Update CreditDisplay with new features',
    description: 'Enhance existing CreditDisplay with transparency features',
    file: 'src/components/CreditDisplay.tsx',
    action: 'ENHANCE_COMPONENT'
  }
];

function logStep(step, title, status = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    WARNING: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m',   // Red
    RESET: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[status]}[${timestamp}] Step ${step}: ${title}${colors.RESET}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function validateCreatedComponents() {
  logStep('VALIDATION', 'Checking created components...', 'INFO');
  
  let allValid = true;
  
  COMPONENTS_CREATED.forEach((componentPath) => {
    if (checkFileExists(componentPath)) {
      logStep('✓', `${componentPath} exists`, 'SUCCESS');
    } else {
      logStep('✗', `${componentPath} missing`, 'ERROR');
      allValid = false;
    }
  });
  
  return allValid;
}

function addNavigationRoute() {
  logStep(1, 'Adding TransactionHistory to Navigation', 'INFO');
  
  const navigationTypesPath = 'src/navigation/types.ts';
  
  if (!checkFileExists(navigationTypesPath)) {
    logStep(1, `Navigation types file not found: ${navigationTypesPath}`, 'WARNING');
    return false;
  }
  
  try {
    let content = fs.readFileSync(navigationTypesPath, 'utf8');
    
    // Add TransactionHistory to RootStackParamList if not already present
    if (!content.includes('TransactionHistory')) {
      const routeAddition = `  TransactionHistory: undefined;`;
      
      // Find the RootStackParamList type and add the route
      const paramListMatch = content.match(/(export\s+type\s+RootStackParamList\s*=\s*\{[^}]*)/);
      if (paramListMatch) {
        const newContent = content.replace(
          /(export\s+type\s+RootStackParamList\s*=\s*\{[^}]*)/,
          `$1\n${routeAddition}`
        );
        
        fs.writeFileSync(navigationTypesPath, newContent);
        logStep(1, 'Added TransactionHistory route to navigation types', 'SUCCESS');
        return true;
      }
    } else {
      logStep(1, 'TransactionHistory route already exists', 'SUCCESS');
      return true;
    }
  } catch (error) {
    logStep(1, `Error updating navigation types: ${error.message}`, 'ERROR');
    return false;
  }
  
  return false;
}

function createNavigationUpdate() {
  logStep(2, 'Creating navigation stack update', 'INFO');
  
  const updateInstructions = `
// Add this to your main navigation stack (RootStackNavigator.tsx):

import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';

// Add this screen to your Stack.Navigator:
<Stack.Screen 
  name="TransactionHistory" 
  component={TransactionHistoryScreen}
  options={{
    title: 'Transaction History',
    headerShown: false, // Since the screen has its own header
  }}
/>
`;

  fs.writeFileSync('NAVIGATION-UPDATE-INSTRUCTIONS.md', updateInstructions);
  logStep(2, 'Created navigation update instructions', 'SUCCESS');
}

function createChatScreenIntegration() {
  logStep(3, 'Creating ChatScreen integration example', 'INFO');
  
  const integrationExample = `
// Add this to your ChatScreen.tsx:

import MessageCostPreview from '../components/MessageCostPreview';

// In your chat input area, add the cost preview:
const [messageCost, setMessageCost] = useState(1);
const [inputText, setInputText] = useState('');

// Before the send button or input field:
<MessageCostPreview
  messageLength={inputText.length}
  hasImages={false} // Set based on your image attachment logic
  conversationContext={conversationHistory.length * 100} // Rough estimation
  onCostUpdate={(cost) => setMessageCost(cost)}
  showDetails={inputText.length > 500} // Show details for longer messages
/>

// Update your send function to check credits:
const handleSendMessage = async () => {
  const hasSufficientCredits = await creditService.hasSufficientCredits(userId, messageCost);
  
  if (!hasSufficientCredits) {
    // Show insufficient credits dialog
    Alert.alert(
      'Insufficient Credits',
      \`You need \${messageCost} credits to send this message. Would you like to purchase more credits?\`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Credits', 
          onPress: () => navigation.navigate('Subscription')
        }
      ]
    );
    return;
  }
  
  // Proceed with sending message and deducting credits
  await sendMessage();
  await creditService.spendCredits(userId, messageCost, 'usage', messageId);
};
`;

  fs.writeFileSync('CHATSCREEN-INTEGRATION.md', integrationExample);
  logStep(3, 'Created ChatScreen integration example', 'SUCCESS');
}

function createHeaderIntegration() {
  logStep(4, 'Creating header credit display integration', 'INFO');
  
  const headerIntegration = `
// Update your app header or HamburgerMenu to include the credit battery:

import CreditBatteryIndicator from '../components/CreditBatteryIndicator';
import { useCredits } from '../hooks/useCredits';

// In your header component:
const { creditBalance } = useCredits();

// Replace existing credit display with:
<CreditBatteryIndicator
  currentCredits={creditBalance?.currentBalance || 0}
  maxCredits={creditBalance?.currentTier?.monthlyCredits || 100}
  variant="horizontal" // or "vertical" for sidebar, "circular" for compact
  size="sm" // for header usage
  showWarnings={true}
  onPress={() => navigation.navigate('Subscription')}
/>

// For a minimal header display, use:
<CreditBatteryIndicator
  currentCredits={creditBalance?.currentBalance || 0}
  variant="circular"
  size="sm"
  showPercentage={false}
  showWarnings={false}
  onPress={() => navigation.navigate('TransactionHistory')}
/>
`;

  fs.writeFileSync('HEADER-INTEGRATION.md', headerIntegration);
  logStep(4, 'Created header integration example', 'SUCCESS');
}

function createUsageExamples() {
  logStep(5, 'Creating comprehensive usage examples', 'INFO');
  
  const usageExamples = `
# Credit Transparency Components - Usage Examples

## 1. MessageCostPreview Component

### Basic Usage
\`\`\`tsx
<MessageCostPreview
  messageLength={inputText.length}
  hasImages={attachedImages.length > 0}
  onCostUpdate={(cost) => setEstimatedCost(cost)}
/>
\`\`\`

### Advanced Usage with Context
\`\`\`tsx
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
\`\`\`

## 2. CreditBatteryIndicator Component

### Header Usage (Compact)
\`\`\`tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  maxCredits={subscriptionTier.monthlyCredits}
  variant="circular"
  size="sm"
  showPercentage={false}
  onPress={() => navigation.navigate('Subscription')}
/>
\`\`\`

### Dashboard Usage (Detailed)
\`\`\`tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  maxCredits={subscriptionTier.monthlyCredits}
  variant="horizontal"
  size="lg"
  showWarnings={true}
  showPercentage={true}
  onPress={() => navigation.navigate('TransactionHistory')}
/>
\`\`\`

### Sidebar Usage (Vertical)
\`\`\`tsx
<CreditBatteryIndicator
  currentCredits={userCredits}
  variant="vertical"
  showWarnings={true}
  onPress={() => navigation.navigate('Subscription')}
/>
\`\`\`

## 3. TransactionHistoryScreen Integration

### Navigation
\`\`\`tsx
// From any screen:
navigation.navigate('TransactionHistory');

// With custom header:
<TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
  <Text>View Transaction History</Text>
</TouchableOpacity>
\`\`\`

## 4. Complete Chat Integration Example

\`\`\`tsx
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
        \`You need \${messageCost} credits to send this message.\`,
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
            Send (\${messageCost} credits)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
\`\`\`

## 5. Credit Warnings and Notifications

\`\`\`tsx
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
        \`You have \${credits} credits remaining. Consider purchasing more to continue conversations.\`,
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
\`\`\`
`;

  fs.writeFileSync('USAGE-EXAMPLES.md', usageExamples);
  logStep(5, 'Created comprehensive usage examples', 'SUCCESS');
}

function generateImplementationSummary() {
  const summary = `
# Phase 1 Implementation Summary

## ✅ Components Created
${COMPONENTS_CREATED.map(comp => `- ${comp}`).join('\n')}

## 📋 Implementation Steps Completed
${IMPLEMENTATION_STEPS.map(step => `${step.step}. ${step.title}`).join('\n')}

## 📚 Documentation Generated
- NAVIGATION-UPDATE-INSTRUCTIONS.md
- CHATSCREEN-INTEGRATION.md  
- HEADER-INTEGRATION.md
- USAGE-EXAMPLES.md

## 🚀 Next Steps

1. **Update Navigation Stack**: Add TransactionHistoryScreen to your navigation
2. **Integrate Components**: Follow the examples in the generated documentation
3. **Test Credit Flow**: Ensure credit deduction works with MessageCostPreview
4. **Add to Header**: Replace existing credit display with CreditBatteryIndicator
5. **Test Transaction History**: Verify the transaction history screen works

## 🔧 Integration Checklist

- [ ] Add TransactionHistory route to navigation types
- [ ] Import and add TransactionHistoryScreen to navigation stack
- [ ] Integrate MessageCostPreview in ChatScreen input area
- [ ] Replace header credit display with CreditBatteryIndicator
- [ ] Test credit deduction flow with new preview component
- [ ] Verify transaction history filtering and search
- [ ] Test all three battery indicator variants
- [ ] Ensure proper credit warnings and notifications

## 💡 Key Features Implemented

### 🔍 Transparency Features
- **Real-time cost preview** before sending messages
- **Detailed cost breakdown** for complex messages  
- **Visual credit level indicators** with battery metaphor
- **Complete transaction history** with filtering and search

### ⚡ User Experience Improvements
- **Proactive credit warnings** to prevent interruptions
- **Multiple display variants** for different UI contexts
- **Interactive cost calculator** with detailed explanations
- **Smooth navigation** between credit-related screens

### 📊 Analytics Ready
- **Transaction logging** for all credit operations
- **Usage pattern tracking** in transaction history
- **Filter and search capabilities** for user insights
- **Export-ready transaction data** structure

## 🎯 Business Benefits

1. **Increased Transparency** - Users know exactly what they're paying for
2. **Reduced Support** - Clear cost breakdown reduces billing questions  
3. **Better Conversion** - Proactive warnings encourage credit purchases
4. **User Trust** - Complete transaction history builds confidence
5. **Data Insights** - Rich analytics for pricing optimization

Start with integrating the ChatScreen component for immediate user impact!
`;

  fs.writeFileSync('PHASE1-IMPLEMENTATION-SUMMARY.md', summary);
  logStep('COMPLETE', 'Generated implementation summary', 'SUCCESS');
}

// Main execution
async function main() {
  console.log('\n🚀 Phase 1: Enhanced Credit Display & Transparency Implementation\n');
  
  // Validate components exist
  if (!validateCreatedComponents()) {
    logStep('VALIDATION', 'Some components are missing. Please ensure all components are created first.', 'ERROR');
    process.exit(1);
  }
  
  // Create integration instructions
  createNavigationUpdate();
  createChatScreenIntegration();  
  createHeaderIntegration();
  createUsageExamples();
  
  // Generate summary
  generateImplementationSummary();
  
  console.log('\n✅ Phase 1 implementation resources created successfully!');
  console.log('\n📖 Next: Read PHASE1-IMPLEMENTATION-SUMMARY.md for complete integration guide');
  console.log('🎯 Focus: Start with ChatScreen integration for immediate user impact\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateCreatedComponents,
  addNavigationRoute,
  createNavigationUpdate,
  createChatScreenIntegration,
  createHeaderIntegration,
  createUsageExamples,
  generateImplementationSummary
};
