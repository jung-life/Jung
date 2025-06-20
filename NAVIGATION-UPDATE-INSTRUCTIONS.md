
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
