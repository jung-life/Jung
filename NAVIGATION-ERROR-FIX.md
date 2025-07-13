# Navigation Error Fix & Disclaimer Flow Enhancement

## Problem
The app was showing this error:
```
(NOBRIDGE) ERROR  The action 'NAVIGATE' with payload {"name":"LandingScreen"} was not handled by any navigator.
```

Additionally, the user requested that new users must see the disclaimer screen and cannot bypass it until they accept it.

## Root Cause
The issue was that several screens were trying to navigate to `LandingScreen` when the user was authenticated (in the `MainAppStack`), but `LandingScreen` is only available in the `AuthStack` (when user is not authenticated).

## Files Fixed

### 1. App.tsx
- **Issue**: The linking configuration included `LandingScreen: 'landing'` which could cause navigation conflicts
- **Fix**: Removed `LandingScreen` from the linking configuration since it's only available in AuthStack

### 2. AccountScreen.tsx
- **Issue**: Two functions were trying to navigate to `LandingScreen` after logout:
  - `handleDeleteAccount()` 
  - `handleSignOut()`
- **Fix**: Removed manual navigation calls. When `supabase.auth.signOut()` is called, the auth state change automatically redirects to the AuthStack

### 3. DisclaimerScreen.tsx
- **Issue**: `handleReject()` function was trying to navigate to `LandingScreen` after signing out
- **Fix**: Removed manual navigation call. The auth state change handles the redirect automatically

### 4. AppNavigator.tsx (Enhanced Disclaimer Flow)
- **Enhancement**: Created a separate `DisclaimerStack` that only contains the disclaimer screen
- **Improvement**: Added three distinct navigation states:
  1. **AuthStack**: For unauthenticated users (login/register flow)
  2. **DisclaimerStack**: For authenticated users who haven't accepted the disclaimer
  3. **MainAppStack**: For authenticated users who have accepted the disclaimer
- **Security**: Added `gestureEnabled: false` to prevent users from swiping back from the disclaimer

## Enhanced Solution Summary

### Navigation Flow
1. **Unauthenticated users**: See `AuthStack` (LandingScreen → Login/Register)
2. **New authenticated users**: See `DisclaimerStack` (forced to stay on disclaimer until accepted)
3. **Existing authenticated users**: See `MainAppStack` (normal app experience)

### Disclaimer Enforcement
- New users cannot access any part of the main app until they accept the disclaimer
- The disclaimer screen has no back button and gesture navigation is disabled
- If users reject the disclaimer, they are signed out and returned to the auth flow
- The `AuthContext` properly tracks disclaimer status via `isNewUser` flag

### Auth State Management
When a user signs out:
1. `supabase.auth.signOut()` is called
2. The auth context detects the session change
3. `AppNavigator` automatically switches to the appropriate stack based on auth state
4. User is automatically shown the correct screen

## Testing
After these fixes, the app should properly handle:
- ✅ New user login → forced disclaimer acceptance
- ✅ Disclaimer rejection → sign out and return to auth flow
- ✅ Disclaimer acceptance → access to main app
- ✅ Sign out from Account screen without navigation errors
- ✅ Delete account and proper redirect to login flow
- ✅ Existing users bypass disclaimer and go straight to main app

## Additional Notes
- The TypeScript errors about `supabase` being possibly null are separate issues that need to be addressed with proper null checking
- The lighthouse image error mentioned in the original task is a separate storage issue unrelated to navigation
- Users cannot bypass the disclaimer through deep links or other navigation methods
