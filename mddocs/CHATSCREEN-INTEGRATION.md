
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
      `You need ${messageCost} credits to send this message. Would you like to purchase more credits?`,
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
