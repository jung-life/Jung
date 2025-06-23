
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
