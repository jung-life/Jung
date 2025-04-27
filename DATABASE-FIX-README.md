# Database Error Fix for User Registration

This document explains the fix for the database error that occurs during user registration in the Jung app.

## Problem Description

When a new user registers for the app, the following error may appear in the redirect URL:

```
(NOBRIDGE) WARN Error found in redirect URL: exp://localhost:8081?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user#error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

This error occurs because the database trigger that creates a user profile after registration is not properly handling errors or data type issues. The user account is successfully created in the `auth.users` table, but the trigger fails when trying to create the associated profile record.

While the app already has some error handling in place that allows users to proceed to the PostLoginScreen despite this error, fixing the root cause will provide a better user experience and prevent potential data inconsistencies.

## Solution

The fix consists of three parts:

1. **Database Migration for User Creation**: An improved database trigger with better error handling
2. **Database Migration for Disclaimer Status**: A new RPC function to properly check if a user has seen the disclaimer
3. **Client-Side Handling**: Enhanced error handling in the AuthUrlHandler component

### 1. Database Migration for User Creation

The migration file `supabase/migrations/20250427110500_fix_new_user_database_error.sql` contains an improved version of the `handle_new_user` function that:

- Properly handles NULL values in user metadata
- Uses explicit error handling for each database operation
- Continues execution even if one part fails
- Logs errors without failing the entire user creation process

### 2. Database Migration for Disclaimer Status

The migration file `supabase/migrations/20250427113100_add_check_disclaimer_status_function.sql` adds a missing RPC function that:

- Properly checks if a user has seen the current disclaimer version
- Is used by the `checkDisclaimerStatusDirect` function in the app
- Ensures the isNewUser flag is correctly set, which controls whether new users see the DisclaimerScreen

### 2. Client-Side Handling

The `AuthUrlHandler.tsx` component has been enhanced to:

- Show a more user-friendly message when the database error occurs
- Maintain compatibility with the existing navigation flow in App-enhanced.tsx
- Add appropriate logging to match the existing app behavior
- Better handle the authentication flow after the error

The updated component works with the app's existing error handling that already allows users to proceed to the PostLoginScreen despite the database error.

## How to Apply the Fix

### Option 1: Using the Automated Script

1. Ensure you have the Supabase service key in your environment variables:

```bash
# Add to your .env file
SUPABASE_SERVICE_KEY=your_service_key_here
```

2. Run the application script:

```bash
node apply-db-fix.js
```

The script will:
- Read both migration SQL files
- Apply them to your Supabase database
- Verify that the trigger and RPC function were created successfully

### Option 2: Manual Application

If the automated script doesn't work, you can apply the fix manually:

1. Log in to the Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase/migrations/20250427110500_fix_new_user_database_error.sql`
4. Paste it into the SQL Editor and run it

## Verifying the Fix

To verify that the fix has been applied correctly:

1. Register a new user in the app
2. Check that no database error appears in the redirect URL
3. Verify that the user can log in successfully
4. Check that the user's profile has been created in the `profiles` table

**Note:** If a database error is detected but the app proceeds to the next screen, this behavior is expected due to enhanced error handling. The session should still trigger navigation, ensuring a seamless user experience.

### User Flow After Registration

When a new user registers and logs in for the first time:

1. The app checks if the user has seen and accepted the disclaimer
2. If the user is new (hasn't accepted the disclaimer), they are shown the DisclaimerScreen first
3. After accepting the disclaimer, the user is redirected to the PostLoginScreen
4. On subsequent logins, the user goes directly to the PostLoginScreen

This flow is controlled by the `isNewUser` flag in the AuthContext, which is set based on whether the user has accepted the disclaimer. The MainStackNavigator in App-enhanced.tsx uses this flag to determine the initial route:

```tsx
<Stack.Navigator 
  initialRouteName={isNewUser ? 'DisclaimerScreen' : 'PostLoginScreen'}
  screenOptions={{ headerShown: false }}
>
```

## Additional Notes

- The fix is backward compatible with existing users
- No data migration is needed for existing users
- The improved error handling ensures that even if there are issues with profile creation, the user account itself will still be created successfully
