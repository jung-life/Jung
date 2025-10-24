# Manual Fix for Hermes Build Phase Error

## Current Error:
```
❌  error: Cycle inside jung; building could produce unreliable results.

Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'hermes-engine' from project 'Pods')
```

## Manual Fix Steps in Xcode:

### Detailed Navigation:
1. In Xcode, make sure you're looking at the **Project Navigator** (left sidebar - folder icon)
2. Look for the **Pods** project (blue icon with "Pods" text)
3. Click the disclosure triangle next to **Pods** to expand it
4. Scroll down in the list to find **hermes-engine** (it's a target, not a folder)
5. **Single-click** on **hermes-engine** to select it
6. In the main area (center), you should see tabs: **General**, **Build Settings**, **Build Phases**, **Build Rules**
7. Click on the **Build Phases** tab

### Option 1: Add Output Dependencies (Recommended)
Once you're in Build Phases:
1. Scroll down to find the script named **`[CP-User] [Hermes] Replace Hermes for the right configuration, if needed`**
2. Click the disclosure triangle (►) next to it to expand the script details
3. You'll see sections like **Input Files** and **Output Files**
4. In the **Output Files** section, click the **+** button
5. Add this path: `$(BUILT_PRODUCTS_DIR)/hermes.framework`
6. Press Enter to confirm

### If you can't find Build Phases tab:
- Make sure you clicked on **hermes-engine** target (not a folder)
- The target should be highlighted in blue
- The tabs should appear in the main content area (not the sidebar)

### Option 2: Disable Dependency Analysis (Alternative)
1. Follow steps 1-6 above
2. **Uncheck** the box that says **"Based on dependency analysis"**
3. This tells Xcode to run the script on every build

### After Making Changes:
1. Clean the build folder: **Product → Clean Build Folder** (Cmd+Shift+K)
2. Close Xcode
3. Run `cd ios && pod install && cd ..` in terminal
4. Reopen Xcode and try building again

## Why This Happens:
- Xcode's incremental build system needs to know what files a script produces
- Without output dependencies, Xcode can't determine when to run the script
- This creates potential build cycles and unreliable results

## Verification:
After applying the fix, the build should complete without the cycle error.
