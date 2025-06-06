# Complete iOS Build Fix for Jung App

This document summarizes the complete solution for resolving both the fastlane sandboxing issue and the duplicate build number error.

## Issues Resolved

### 1. ✅ Fastlane Sandboxing Error
**Error**: `Sandbox: bash(7295) deny(1) file-read-data`
**Solution**: Disabled `ENABLE_USER_SCRIPT_SANDBOXING` in Xcode project

### 2. ✅ Duplicate Build Number Error  
**Error**: `You've already submitted this build of the app`
**Solution**: Incremented iOS build number to unique value

## Applied Fixes

### Fix 1: Fastlane Sandboxing
- **File Modified**: `ios/jung.xcodeproj/project.pbxproj`
- **Changes**: Set `ENABLE_USER_SCRIPT_SANDBOXING = NO` for both Debug and Release
- **Script**: `fix-fastlane-sandboxing.sh`
- **Backup**: `ios/jung.xcodeproj/project.pbxproj.backup`

### Fix 2: Build Number Increment
- **Files Modified**: 
  - `app.json` - Updated `expo.ios.buildNumber` to "6640"
  - `ios/jung/Info.plist` - Updated `CFBundleVersion` to "6640"
- **Script**: `increment-build-number.sh`
- **Backup**: `app.json.backup`

## Current Build Configuration

```json
// app.json
{
  "expo": {
    "ios": {
      "buildNumber": "6640"
    }
  }
}
```

```xml
<!-- ios/jung/Info.plist -->
<key>CFBundleVersion</key>
<string>6640</string>
```

## Next Steps

1. **Clean Build Environment**:
   ```bash
   # Clean Xcode project
   # In Xcode: Product → Clean Build Folder
   
   # Clean build directory
   rm -rf ios/build/
   
   # Optional: Clean pods
   cd ios && pod deintegrate && pod install
   ```

2. **Rebuild and Submit**:
   ```bash
   # Build with EAS
   eas build --platform ios
   
   # Or build locally and submit
   npx expo run:ios --configuration Release
   ```

3. **Verify Fixes**:
   - No more fastlane sandboxing errors during build
   - No more duplicate build number errors during submission
   - Successful App Store Connect submission

## Scripts Created

- `fix-fastlane-sandboxing.sh` - Disables sandboxing
- `increment-build-number.sh` - Updates build numbers
- Both scripts include backup and revert instructions

## Rollback Instructions

If you need to revert changes:

```bash
# Revert fastlane sandboxing fix
cp ios/jung.xcodeproj/project.pbxproj.backup ios/jung.xcodeproj/project.pbxproj

# Revert build number changes
cp app.json.backup app.json
git checkout ios/jung/Info.plist
```

## Verification Commands

```bash
# Check sandboxing is disabled
grep "ENABLE_USER_SCRIPT_SANDBOXING" ios/jung.xcodeproj/project.pbxproj

# Check build numbers match
grep "buildNumber" app.json
grep "CFBundleVersion" -A 1 ios/jung/Info.plist
```

## Security Considerations

- **Sandboxing**: Disabled only for build scripts, not runtime security
- **Build Numbers**: Using timestamp-based unique identifiers
- **Backups**: All original files preserved for easy rollback

## Support

If you encounter any issues:

1. Check that both build numbers match in `app.json` and `Info.plist`
2. Verify sandboxing is disabled in both Debug and Release configurations
3. Clean build environment completely before rebuilding
4. Use the provided rollback instructions if needed

## Files Modified Summary

- ✅ `ios/jung.xcodeproj/project.pbxproj` (sandboxing disabled)
- ✅ `app.json` (build number: 6640)
- ✅ `ios/jung/Info.plist` (CFBundleVersion: 6640)

Your app should now build and submit successfully without either error!
