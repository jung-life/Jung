# Error Handling System Documentation

## Overview

The Jung app now includes a comprehensive error handling system that provides meaningful UI feedback for various types of errors, including network issues, database problems, authentication errors, and the specific Supabase realtime connection errors you mentioned.

## Components

### 1. ErrorHandler Component (`src/components/ErrorHandler.tsx`)

The main error handling component that provides:
- **Error Classification**: Automatically categorizes errors into types (network, database, realtime, authentication, etc.)
- **User-Friendly Messages**: Converts technical error messages into understandable user language
- **Action Buttons**: Provides contextual actions like "Retry", "Log In", or "Continue Offline"
- **Visual Feedback**: Shows appropriate icons and colors for different error types
- **Auto-Dismissal**: Automatically removes non-critical errors after a timeout

### 2. Error Types Handled

#### Realtime Errors
- **Pattern**: `realtime`, `channel_error`
- **User Message**: "Live updates are temporarily unavailable. Your messages will still be saved."
- **Action**: "Continue Offline"
- **Auto-dismiss**: Yes (10 seconds)

#### Network Errors
- **Pattern**: `network`, `fetch`
- **User Message**: "Network connection issue. Please check your internet connection."
- **Action**: "Retry"

#### Database Errors
- **Pattern**: `database`, `postgres`
- **User Message**: "Database temporarily unavailable. Please try again in a moment."
- **Action**: "Retry"

#### Authentication Errors
- **Pattern**: `auth`, `unauthorized`
- **User Message**: "Session expired. Please log in again."
- **Action**: "Log In" (automatically signs out user)

#### Storage Errors
- **Pattern**: `storage`, `bucket`
- **User Message**: "File storage temporarily unavailable. Please try again later."
- **Action**: "Retry"

#### API Errors
- **Pattern**: `api`, `openai`
- **User Message**: "AI service temporarily unavailable. Please try again in a moment."
- **Action**: "Retry"

## Integration

### 1. App-Level Integration

The ErrorHandler is integrated at the app level in `src/App.tsx`:

```tsx
import { ErrorHandler } from './components/ErrorHandler';

const AppContent = () => {
  return (
    <ErrorHandler>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </ErrorHandler>
  );
};
```

### 2. Screen-Level Usage

In any screen (example from `src/screens/ConversationsScreen.tsx`):

```tsx
import { useErrorReporting } from '../components/ErrorHandler';

export const ConversationsScreen = () => {
  const { reportError } = useErrorReporting();

  const fetchConversations = useCallback(async () => {
    try {
      // ... your code
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      reportError(error, 'fetchConversations');
      // ... handle error locally if needed
    }
  }, []);
};
```

## Usage Examples

### 1. Handling Supabase Realtime Errors

```tsx
// When setting up realtime subscriptions
const channel = supabase
  .channel('chat-messages')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    // Handle changes
  })
  .subscribe((status, error) => {
    if (error) {
      reportError(error, 'realtime_subscription');
    }
  });
```

### 2. Handling API Errors

```tsx
const generateResponse = async () => {
  try {
    const response = await fetch('/api/generate');
    // ... handle response
  } catch (error) {
    reportError(error, 'ai_generation');
  }
};
```

### 3. Handling Database Errors

```tsx
const saveData = async () => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert(newData);
    
    if (error) {
      reportError(error, 'save_conversation');
    }
  } catch (error) {
    reportError(error, 'save_conversation');
  }
};
```

## Error Banner UI

The error banners appear at the top of the screen with:
- **Icon**: Contextual icon based on error type
- **Title**: Clear, descriptive title
- **Message**: User-friendly explanation
- **Action Button**: Contextual action (Retry, Log In, etc.)
- **Dismiss Button**: X button to manually dismiss

### Visual Design
- **Realtime errors**: Yellow background (warning)
- **Network/Database/API errors**: Orange background (caution)
- **Auth/Permission errors**: Red background (critical)
- **Other errors**: Gray background (neutral)

## Benefits

### 1. User Experience
- **Clear Communication**: Users understand what went wrong
- **Actionable Feedback**: Users know what they can do about it
- **Non-Intrusive**: Errors don't block the entire app
- **Contextual**: Different error types get appropriate treatment

### 2. Developer Experience
- **Centralized**: All error handling logic in one place
- **Consistent**: Same error types always handled the same way
- **Easy Integration**: Simple `reportError()` function
- **Debugging**: All errors logged with context

### 3. Specific Benefits for Your Use Case

For the Supabase realtime errors you mentioned:
- **Graceful Degradation**: App continues to work offline
- **User Awareness**: Users know live updates are paused
- **Automatic Recovery**: Errors auto-dismiss when connection resumes
- **No App Crashes**: Realtime failures don't break the app

## Best Practices

### 1. When to Use Error Reporting
- **Always** for network/API calls
- **Always** for database operations
- **Always** for authentication operations
- **Selectively** for user input validation (use local error states for immediate feedback)

### 2. Error Context
Always provide context when reporting errors:
```tsx
reportError(error, 'fetchConversations'); // Good
reportError(error, 'user_action_in_specific_screen'); // Better
```

### 3. Combining with Local Error Handling
```tsx
try {
  // ... operation
} catch (error) {
  // Report to global error handler
  reportError(error, 'operation_context');
  
  // Handle locally if needed
  setLocalError('Operation failed');
  setLoading(false);
}
```

## Future Enhancements

1. **Error Analytics**: Track error patterns for debugging
2. **Retry Logic**: Automatic retry with exponential backoff
3. **Offline Support**: Queue operations when offline
4. **Error Recovery**: Automatic recovery strategies
5. **Custom Error Types**: App-specific error categories

## Testing

To test the error handling system:

1. **Network Errors**: Disable internet connection
2. **Database Errors**: Use invalid Supabase credentials
3. **Realtime Errors**: Disconnect from Supabase realtime
4. **Auth Errors**: Use expired tokens
5. **API Errors**: Use invalid API endpoints

The error banners should appear with appropriate messages and actions for each scenario.
