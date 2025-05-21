# Location Permissions Fix

## Issue

The Jung app is encountering an error related to location permissions:

```
This app is missing usage descriptions, so location services will fail. Add one of the `NSLocation*UsageDescription` keys to your bundle's Info.plist.
```

This error occurs despite the fact that the necessary keys are already present in the `Info.plist` file:
- NSLocationWhenInUseUsageDescription
- NSLocationAlwaysAndWhenInUseUsageDescription
- NSLocationAlwaysUsageDescription

The issue is likely due to a build configuration problem where the location permission descriptions in the `Info.plist` file are not being properly included in the app bundle during development builds.

## Solution

Two fixes have been implemented:

### 1. Direct Configuration Fix

The `app.json` file has been updated to include the necessary location permission descriptions:

- For iOS:
  - Added `NSLocationWhenInUseUsageDescription`
  - Added `NSLocationAlwaysAndWhenInUseUsageDescription`
  - Added `NSLocationAlwaysUsageDescription`

- For Android:
  - Added `ACCESS_FINE_LOCATION` permission
  - Added `ACCESS_COARSE_LOCATION` permission

This ensures that the permissions are properly included in the app bundle during development builds.

### 2. Build Process Fix

A script has been created to fix this issue by:

1. Verifying the presence of location permission keys in `Info.plist` and `app.json`
2. Cleaning the iOS build cache
3. Cleaning the Expo cache
4. Reinstalling CocoaPods dependencies
5. Rebuilding the iOS app

## How to Use

Run the following command from the project root:

```bash
./fix-location-permissions.sh
```

This will clean and rebuild the app with the correct permissions.

## Technical Details

The Jung app uses location services in the `PostLoginScreen.tsx` file to fetch the user's location and save it to the `user_locations` table in the Supabase database. This functionality is important for providing location-based features and tracking mood patterns in different environments.

The location permissions are configured in three places:
1. `ios/jung/Info.plist` - The native iOS configuration file
2. `app.config.js` - The Expo configuration file that dynamically sets permissions
3. `app.json` - The static Expo configuration file

The script ensures that all these configurations are properly applied during the build process.

## Verification

After running the script, the app should be able to request location permissions and access the user's location without errors. You can verify this by:

1. Running the app on an iOS device or simulator
2. Logging in to the app
3. Navigating to the Mood Tracker screen
4. Tapping the "Test Location Permissions" button
5. Checking the displayed location status and console logs for successful location permission requests and location fetching
6. Verifying that location data is being saved to the `user_locations` table in the Supabase database

## Testing Location Permissions

A "Test Location Permissions" button has been added to the Mood Tracker screen to allow easy verification of location permissions. This button:

1. Requests location permissions from the user
2. Displays the permission status
3. If permissions are granted, fetches the current location
4. Displays the latitude, longitude, and accuracy of the location

This provides a simple way to verify that the location permissions are working correctly without having to check the console logs.

Additionally, a standalone test script has been created that can be run from the command line:

```bash
./run-location-test.sh
```

This script will test the location permissions and display the results in the terminal.
