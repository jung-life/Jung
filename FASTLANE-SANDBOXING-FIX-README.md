# Fastlane Sandboxing Fix for Jung App

This document outlines the solution for resolving the "Sandbox: bash(7295) deny(1) file-read-data" error when running fastlane in Xcode builds.

## Problem Analysis

The error occurs because:
- `ENABLE_USER_SCRIPT_SANDBOXING = YES` is enabled in your Xcode project
- Fastlane scripts need to access files outside the sandbox restrictions
- The build system denies file access due to sandboxing policies

## Solutions Implemented

### Solution 1: Disable User Script Sandboxing (Recommended)

We've modified the Xcode project to disable `ENABLE_USER_SCRIPT_SANDBOXING` for fastlane compatibility while maintaining other security features.

**Changes Made:**
- Updated `ios/jung.xcodeproj/project.pbxproj`
- Set `ENABLE_USER_SCRIPT_SANDBOXING = NO` for both Debug and Release configurations
- This allows fastlane and other build scripts to access necessary files

### Solution 2: Clean Build Process

Additional steps to ensure clean builds:

```bash
# Clean build directory
rm -rf ios/build/

# Clean pods and reinstall
cd ios && pod deintegrate && pod install

# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/jung-*
```

### Solution 3: Verify Fastlane Setup

If you're using fastlane, ensure proper configuration:

```ruby
# Fastfile example
platform :ios do
  desc "Build and test"
  lane :build do
    build_app(
      scheme: "jung",
      workspace: "ios/jung.xcworkspace",
      export_method: "development"
    )
  end
end
```

## Alternative Solutions (If Sandboxing Must Stay Enabled)

### Option A: Configure Script Input/Output Files

If you must keep sandboxing enabled, configure proper input/output files in Xcode:

1. Select your target in Xcode
2. Go to Build Phases
3. Find the failing script phase
4. Add required files to "Input Files" and "Output Files"

### Option B: Use Build System Legacy Mode

Temporarily switch to legacy build system:
1. File → Workspace Settings (or Project Settings)
2. Change Build System to "Legacy Build System"

## Verification Steps

After applying the fix:

1. Clean your project: `Product → Clean Build Folder` in Xcode
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Rebuild your project
4. Run fastlane commands

## Files Modified

- `ios/jung.xcodeproj/project.pbxproj` - Disabled user script sandboxing

## Security Considerations

- Disabling user script sandboxing reduces some security restrictions
- Only affects build-time scripts, not runtime app security
- Consider re-enabling after fastlane issues are resolved
- Monitor build scripts for any security concerns

## Troubleshooting

If issues persist:

1. Check fastlane logs for specific file access errors
2. Verify all required certificates and provisioning profiles
3. Ensure Xcode command line tools are up to date
4. Try building with different schemes (Debug vs Release)

## Support

For additional support:
- Check fastlane documentation: https://docs.fastlane.tools/
- Review Xcode build settings documentation
- Consider alternative CI/CD solutions if fastlane continues to have issues
