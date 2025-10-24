# Fix Hermes Xcode Build Issues

## Step 1: Updated Podfile (Already Complete)
The ios/Podfile has been updated with proper Hermes configuration for Expo:
- `:hermes_enabled => true` explicitly enables Hermes
- Expo-compatible autolinking and module setup
- All required Expo modules and dependencies properly configured
- Successfully installed with `pod install` ✅

## Step 2: Automated Fix (Recommended)

Run the automated script to fix build phases:
```bash
./fix-xcode-build-phases.sh
```

This script will:
- Automatically add output files to Hermes and React Native build phases
- Enable dependency analysis for problematic build phases
- Create a backup of your project file before making changes
- Validate the changes to ensure no corruption

## Step 3: Manual Xcode Fixes (If Automated Fix Fails)

### Fix for hermes-engine Build Phase
1. Open `ios/jung.xcworkspace` in Xcode
2. Go to Project Navigator → Pods → hermes-engine
3. Select the hermes-engine target
4. Go to Build Phases tab
5. Find the script `[CP-User] [Hermes] Replace Hermes...`
6. Either:
   - **Option A**: Check "Based on dependency analysis" checkbox
   - **Option B**: Add output files by clicking the "+" and adding:
     ```
     $(BUILT_PRODUCTS_DIR)/hermes.framework
     ```

### Fix for React-FabricComponents
1. In Project Navigator → Pods → React-FabricComponents
2. Select the React-FabricComponents target
3. Go to Build Phases tab
4. Find the script `[CP-User] [RN]Check rncore scripts`
5. Check "Based on dependency analysis" checkbox

### Fix for React-Fabric
1. In Project Navigator → Pods → React-Fabric
2. Select the React-Fabric target
3. Go to Build Phases tab
4. Find the script `[CP-User] [RN]Check rncore scripts`
5. Check "Based on dependency analysis" checkbox

## Step 3: Clean and Rebuild
After making these changes:
1. In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
2. Close Xcode
3. Run in terminal:
   ```bash
   cd ios
   pod install --repo-update
   ```
4. Open `ios/jung.xcworkspace` in Xcode
5. Build the project

## Troubleshooting Notes
- These fixes resolve Xcode's incremental build system issues with Hermes and React Native Fabric
- "Based on dependency analysis" tells Xcode to automatically determine when to run the script
- The output files specification helps Xcode understand what the script produces
- If issues persist, try switching to the legacy build system in Xcode → File → Workspace Settings → Build System → Legacy Build System

## Verification
After successful build, you can verify Hermes is working by:
1. Running the app in simulator/device
2. Checking Metro logs for Hermes-related messages
3. Performance should be improved compared to JSC (JavaScript Core)
