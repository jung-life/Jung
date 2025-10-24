#!/bin/bash

# Xcode Build Phase Fixer Script
# Fixes the "Based on dependency analysis" warnings for React Native builds

set -e

echo "🚀 Xcode Build Phase Fixer"
echo "=================================="

# Check if we're in the right directory
if [[ ! -d "ios" ]] || [[ ! -f "app.json" ]]; then
    echo "❌ This script must be run from your React Native/Expo project root"
    echo "   Make sure you're in the directory containing 'ios' folder and 'app.json'"
    exit 1
fi

PROJECT_FILE="ios/Pods/Pods.xcodeproj/project.pbxproj"

# Check if Pods project exists
if [[ ! -f "$PROJECT_FILE" ]]; then
    echo "❌ Pods project not found at $PROJECT_FILE"
    echo "   Please run 'cd ios && pod install' first"
    exit 1
fi

echo "🔍 Found Pods project file"

# Create a backup
cp "$PROJECT_FILE" "$PROJECT_FILE.backup"
echo "💾 Created backup at $PROJECT_FILE.backup"

# Function to add output dependencies to build phases
fix_build_phase() {
    local phase_name="$1"
    local output_files="$2"
    
    echo "🔧 Fixing build phase: $phase_name"
    
    # Find the build phase and add output files
    perl -i -pe "
        BEGIN { \$in_phase = 0; \$phase_found = 0; }
        
        # Detect when we enter the target build phase
        if (/name = \"$phase_name\"/ && /PBXShellScriptBuildPhase/) {
            \$in_phase = 1;
            \$phase_found = 1;
            print;
            next;
        }
        
        # If we're in the phase and find the closing brace, add output files before it
        if (\$in_phase && /^\s*};\s*$/) {
            # Add output files if not already present
            unless (\$output_added) {
                print \"\t\t\toutputPaths = (\n\";
                for my \$file (split /,/, \"$output_files\") {
                    \$file =~ s/^\s+|\s+$//g;  # trim whitespace
                    print \"\t\t\t\t\\\"\$file\\\",\n\";
                }
                print \"\t\t\t);\n\";
                \$output_added = 1;
            }
            \$in_phase = 0;
        }
        
        # Skip existing outputPaths to avoid duplicates
        if (\$in_phase && /outputPaths = \(/) {
            \$in_output = 1;
        }
        if (\$in_output && /\);/) {
            \$in_output = 0;
            \$output_added = 1;
            next;
        }
        if (\$in_output) {
            next;
        }
        
        print;
    " "$PROJECT_FILE"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Fixed build phase: $phase_name"
    else
        echo "⚠️  Warning: Could not automatically fix $phase_name"
    fi
}

# Fix Hermes build phase
echo ""
echo "🔧 Fixing Hermes build phases..."
fix_build_phase "\[CP-User\] \[Hermes\] Replace Hermes for the right configuration, if needed" "\$(BUILT_PRODUCTS_DIR)/hermes.framework"

# Fix React Native build phases
echo ""
echo "🔧 Fixing React Native build phases..."
fix_build_phase "\[CP-User\] \[RN\]Check rncore" "\$(DERIVED_FILE_DIR)/rncore_check.stamp,\$(TARGET_BUILD_DIR)/rncore_validation"

# Alternative approach: Enable dependency analysis by adding runOnlyForDeploymentPostprocessing
echo ""
echo "🔧 Enabling dependency analysis for build phases..."

# Add runOnlyForDeploymentPostprocessing = 0 to problematic build phases
perl -i -pe "
    BEGIN { \$in_problem_phase = 0; }
    
    # Detect problematic build phases
    if (/name = \"\[CP-User\] \[(Hermes|RN)\]/ && /PBXShellScriptBuildPhase/) {
        \$in_problem_phase = 1;
    }
    
    # If we're in a problem phase and find the closing brace, add runOnlyForDeploymentPostprocessing
    if (\$in_problem_phase && /^\s*};\s*$/) {
        unless (\$run_only_added) {
            print \"\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\";
            \$run_only_added = 1;
        }
        \$in_problem_phase = 0;
        \$run_only_added = 0;
    }
    
    # Skip existing runOnlyForDeploymentPostprocessing to avoid duplicates
    if (\$in_problem_phase && /runOnlyForDeploymentPostprocessing/) {
        \$run_only_added = 1;
    }
    
    print;
" "$PROJECT_FILE"

echo ""
echo "✅ All build phase fixes applied!"
echo ""
echo "🎉 Next steps:"
echo "   1. cd ios"
echo "   2. pod install"
echo "   3. cd .."
echo "   4. eas build --platform ios --clear-cache"
echo ""
echo "💡 If you encounter issues, restore the backup:"
echo "   cp $PROJECT_FILE.backup $PROJECT_FILE"

# Validate the project file
if ! plutil -lint "$PROJECT_FILE" >/dev/null 2>&1; then
    echo "⚠️  Warning: Project file might have syntax issues"
    echo "   Restoring backup..."
    cp "$PROJECT_FILE.backup" "$PROJECT_FILE"
    echo "❌ Failed to apply fixes. Please try the manual approach."
    exit 1
fi

echo "✅ Project file validation passed!"
