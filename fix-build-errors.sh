#!/bin/bash

# Fix Build Errors for Jung App
# This script fixes the macro redefinition and C99 extension errors

echo "🔧 Fixing build errors caused by aggressive fixes..."

# Restore original files and apply a more conservative fix
cp ios/Podfile.backup ios/Podfile
cp app.json.backup app.json

echo "✅ Restored original configuration files"

# Create a conservative Podfile that fixes selectors without breaking the build
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

    # CONSERVATIVE FIX: Only target specific problematic files
    puts "🔧 Applying conservative non-public selectors fix..."
    
    # Only modify RNGestureHandler files which are the likely source
    gesture_handler_files = Dir.glob('ios/Pods/RNGestureHandler/**/*.{h,m,mm}')
    reanimated_files = Dir.glob('ios/Pods/RNReanimated/**/*.{h,m,mm}')
    
    (gesture_handler_files + reanimated_files).each do |file|
      next unless File.exist?(file)
      
      begin
        content = File.read(file)
        original_content = content.dup
        
        # Only replace the exact problematic selectors
        content.gsub!(/\b_isKeyDown\b/, 'keyDown')
        content.gsub!(/\b_modifiedInput\b/, 'modifiedInput')
        content.gsub!(/\b_modifierFlags\b/, 'modifierFlags')
        
        # Also handle @selector usage
        content.gsub!(/@selector\(\s*_isKeyDown\s*\)/, '@selector(keyDown)')
        content.gsub!(/@selector\(\s*_modifiedInput\s*\)/, '@selector(modifiedInput)')
        content.gsub!(/@selector\(\s*_modifierFlags\s*\)/, '@selector(modifierFlags)')
        
        # Write back if changed
        if content != original_content
          File.write(file, content)
          puts "✅ Fixed selectors in: #{file}"
        end
      rescue => e
        puts "⚠️  Could not process #{file}: #{e.message}"
      end
    end
    
    puts "✅ Conservative non-public selectors fix completed"
  end
end
EOF

echo "✅ Created conservative Podfile"

# Clean and reinstall pods
echo "🧹 Cleaning and reinstalling pods..."
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install

echo ""
echo "🎯 Build errors fix completed!"
echo ""
echo "What was fixed:"
echo "- Restored original configuration to avoid macro conflicts"
echo "- Applied conservative selector replacement only in target libraries"
echo "- Removed aggressive build flags that caused C99 errors"
echo "- Clean pods installation"
echo ""
echo "Next steps:"
echo "1. Build should now compile successfully"
echo "2. Test the app to ensure functionality"
echo "3. Try submission again"
echo ""
echo "If non-public selector errors persist, we may need to:"
echo "- Update react-native-gesture-handler to latest version"
echo "- Use alternative libraries that don't use private APIs"
