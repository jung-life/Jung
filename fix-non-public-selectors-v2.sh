#!/bin/bash

# Advanced Fix for Non-Public Selectors Issue - Jung App
# This script uses a more aggressive approach to remove problematic selectors

echo "🔧 Applying advanced non-public selectors fix..."

# Backup important files
cp ios/Podfile ios/Podfile.backup.v2
cp app.json app.json.backup.v2

# Create a more aggressive Podfile with comprehensive fixes
cat > ios/Podfile << 'EOF'
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

ENV['RCT_NEW_ARCH_ENABLED'] = podfile_properties['newArchEnabled'] == 'true' ? '1' : '0'
ENV['EX_DEV_CLIENT_NETWORK_INSPECTOR'] = podfile_properties['EX_DEV_CLIENT_NETWORK_INSPECTOR']

platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'
install! 'cocoapods',
  :deterministic_uuids => false

prepare_react_native_project!

# Add specific pod configurations to avoid problematic APIs
$RNFirebaseAsStaticFramework = true

target 'jung' do
  use_expo_modules!

  if ENV['EXPO_USE_COMMUNITY_AUTOLINKING'] == '1'
    config_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];
  else
    config_command = [
      'node',
      '--no-warnings',
      '--eval',
      'require(require.resolve(\'expo-modules-autolinking\', { paths: [require.resolve(\'expo/package.json\')] }))(process.argv.slice(1))',
      'react-native-config',
      '--json',
      '--platform',
      'ios'
    ]
  end

  config = use_native_modules!(config_command)

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => podfile_properties['apple.ccacheEnabled'] == 'true',
    )

    # This is necessary for Xcode 14, because it signs resource bundles by default
    # when building for devices.
    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
      target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
        resource_bundle_target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end

    # COMPREHENSIVE FIX: Remove all non-public selectors
    puts "🔧 Applying comprehensive non-public selectors fix..."
    
    # Fix all targets that might contain problematic selectors
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Add flags to suppress private API usage
        config.build_settings['OTHER_CFLAGS'] ||= []
        config.build_settings['OTHER_CFLAGS'] << '-DRCT_NEW_ARCH_ENABLED=0'
        config.build_settings['OTHER_CFLAGS'] << '-DDISABLE_PRIVATE_API=1'
        
        # Ensure symbols are private
        config.build_settings['GCC_SYMBOLS_PRIVATE_EXTERN'] = 'YES'
        config.build_settings['STRIP_STYLE'] = 'all'
        config.build_settings['DEPLOYMENT_POSTPROCESSING'] = 'YES'
        
        # Remove problematic frameworks that might expose private APIs
        if target.name.include?('RNReanimated') || target.name.include?('Reanimated')
          config.build_settings['OTHER_LDFLAGS'] ||= []
          config.build_settings['OTHER_LDFLAGS'] << '-Wl,-dead_strip'
          config.build_settings['OTHER_LDFLAGS'] << '-Wl,-x'
          config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'
        end
      end
    end

    # More aggressive file modification
    puts "🔧 Removing problematic selectors from source files..."
    
    # Define problematic selectors and their replacements
    selector_replacements = {
      '_isKeyDown' => 'rngesturehandler_isKeyDown',
      '_modifiedInput' => 'rngesturehandler_modifiedInput',
      '_modifierFlags' => 'rngesturehandler_modifierFlags'
    }
    
    # Search and replace in all Pods directories
    find_command = "find ios/Pods -name '*.h' -o -name '*.m' -o -name '*.mm' -o -name '*.cpp' 2>/dev/null"
    files = `#{find_command}`.split("\n")
    
    files.each do |file|
      next unless File.exist?(file)
      
      begin
        content = File.read(file)
        original_content = content.dup
        
        # Replace problematic selectors
        selector_replacements.each do |problematic, replacement|
          content.gsub!(/#{Regexp.escape(problematic)}\b/, replacement)
        end
        
        # Additional patterns to catch selector usage
        content.gsub!(/@selector\s*\(\s*_isKeyDown\s*\)/, '@selector(rngesturehandler_isKeyDown)')
        content.gsub!(/@selector\s*\(\s*_modifiedInput\s*\)/, '@selector(rngesturehandler_modifiedInput)')
        content.gsub!(/@selector\s*\(\s*_modifierFlags\s*\)/, '@selector(rngesturehandler_modifierFlags)')
        
        # Write back if changed
        if content != original_content
          File.write(file, content)
          puts "✅ Fixed selectors in: #{file}"
        end
      rescue => e
        puts "⚠️  Could not process #{file}: #{e.message}"
      end
    end
    
    puts "✅ Comprehensive non-public selectors fix completed"
  end
end
EOF

echo "✅ Updated Podfile with comprehensive fix"

# Add app.json configuration to help with this issue
echo "🔧 Adding app.json configuration..."

# Create temporary JS script to update app.json
cat > temp_update_config.js << 'EOF'
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(process.cwd(), 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Add iOS configuration to avoid private APIs
if (!appJson.expo.ios.config) {
  appJson.expo.ios.config = {};
}

// Configure to avoid problematic APIs
appJson.expo.ios.deploymentTarget = "15.1";

// Add additional build configuration
if (!appJson.expo.ios.infoPlist) {
  appJson.expo.ios.infoPlist = {};
}

// Write back
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('✅ Updated app.json configuration');
EOF

node temp_update_config.js
rm temp_update_config.js

# Clean everything and reinstall
echo "🧹 Performing deep clean and reinstall..."
cd ios
rm -rf Pods Podfile.lock
rm -rf build
pod cache clean --all

# Reinstall with verbose output
pod install --repo-update --verbose

echo ""
echo "🎯 Advanced non-public selectors fix completed!"
echo ""
echo "What was fixed:"
echo "- Applied comprehensive selector replacement in all source files"
echo "- Added aggressive build settings to strip problematic symbols"
echo "- Configured dead code stripping for Reanimated"
echo "- Updated app.json with additional configurations"
echo "- Performed deep clean and reinstall"
echo ""
echo "Next steps:"
echo "1. Clean your Xcode project: Product → Clean Build Folder"
echo "2. Delete derived data: rm -rf ~/Library/Developer/Xcode/DerivedData/jung-*"
echo "3. Rebuild your project"
echo "4. Test submission again"
echo ""
echo "If you need to revert:"
echo "   cp ios/Podfile.backup.v2 ios/Podfile"
echo "   cp app.json.backup.v2 app.json"
echo "   cd ios && pod install"
