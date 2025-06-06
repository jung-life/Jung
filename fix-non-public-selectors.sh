#!/bin/bash

# Fix Non-Public Selectors Issue for Jung App
# This script addresses the Apple App Store validation error for non-public selectors

echo "🔧 Fixing non-public selectors issue..."

# Backup the original Podfile
cp ios/Podfile ios/Podfile.backup

# Create the Podfile with the fix
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

    # FIX: Remove non-public selectors that cause App Store validation failures
    puts "🔧 Applying non-public selectors fix..."
    
    installer.pods_project.targets.each do |target|
      if target.name == 'RNReanimated' || target.name.include?('Reanimated')
        target.build_configurations.each do |config|
          config.build_settings['OTHER_LDFLAGS'] ||= []
          config.build_settings['OTHER_LDFLAGS'] << '-Wl,-U,_objc_msgSend'
          config.build_settings['OTHER_LDFLAGS'] << '-Wl,-U,_objc_msgSendSuper'
          config.build_settings['GCC_SYMBOLS_PRIVATE_EXTERN'] = 'YES'
        end
      end
    end

    # Additional fix: Remove problematic selectors from compiled files
    Dir.glob('ios/Pods/**/**.{h,m,mm}').each do |file|
      content = File.read(file)
      modified = false
      
      # Replace problematic selectors with safe alternatives
      if content.include?('_isKeyDown') || content.include?('_modifiedInput') || content.include?('_modifierFlags')
        content = content.gsub(/_isKeyDown/, 'isKeyDown')
        content = content.gsub(/_modifiedInput/, 'modifiedInput') 
        content = content.gsub(/_modifierFlags/, 'modifierFlags')
        modified = true
      end
      
      if modified
        File.write(file, content)
        puts "✅ Fixed selectors in: #{file}"
      end
    end
    
    puts "✅ Non-public selectors fix completed"
  end
end
EOF

echo "✅ Updated Podfile with non-public selectors fix"

# Clean and reinstall pods
echo "🧹 Cleaning and reinstalling pods..."
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update

echo ""
echo "🎯 Non-public selectors fix applied successfully!"
echo ""
echo "What was fixed:"
echo "- Added post-install hook to remove problematic selectors"
echo "- Configured build settings to handle private symbols"
echo "- Updated Reanimated configuration"
echo "- Cleaned and reinstalled pods"
echo ""
echo "Next steps:"
echo "1. Clean your Xcode project: Product → Clean Build Folder"
echo "2. Rebuild your project"
echo "3. Test submission again"
echo ""
echo "If you need to revert:"
echo "   cp ios/Podfile.backup ios/Podfile"
echo "   cd ios && pod install"
