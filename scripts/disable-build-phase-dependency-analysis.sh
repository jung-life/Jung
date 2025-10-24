#!/bin/bash

# Simple fix: Disable dependency analysis for problematic build phases
# This tells Xcode to run these scripts on every build instead of trying to analyze dependencies

echo "🔧 Disabling dependency analysis for problematic build phases..."

PROJECT_FILE="ios/Pods/Pods.xcodeproj/project.pbxproj"

if [[ ! -f "$PROJECT_FILE" ]]; then
    echo "❌ Pods project not found. Please run 'cd ios && pod install' first"
    exit 1
fi

# Create backup
cp "$PROJECT_FILE" "$PROJECT_FILE.backup"
echo "💾 Created backup"

# Disable dependency analysis for Hermes and React Native build phases
# This adds runOnlyForDeploymentPostprocessing = 0; which disables "Based on dependency analysis"

perl -i -pe '
    BEGIN { $in_hermes_phase = 0; $in_rn_phase = 0; }
    
    # Detect Hermes build phase
    if (/name = "\[CP-User\] \[Hermes\]/ && /PBXShellScriptBuildPhase/) {
        $in_hermes_phase = 1;
    }
    
    # Detect RN build phases
    if (/name = "\[CP-User\] \[RN\]/ && /PBXShellScriptBuildPhase/) {
        $in_rn_phase = 1;
    }
    
    # When we find the closing brace of these phases, add runOnlyForDeploymentPostprocessing = 0
    if (($in_hermes_phase || $in_rn_phase) && /^\s*};\s*$/) {
        # Check if runOnlyForDeploymentPostprocessing is already set
        unless ($already_set) {
            # Add the setting before the closing brace
            s/^(\s*)};\s*$/$1\trunOnlyForDeploymentPostprocessing = 0;\n$1};/;
        }
        $in_hermes_phase = 0;
        $in_rn_phase = 0;
        $already_set = 0;
    }
    
    # Track if runOnlyForDeploymentPostprocessing is already set
    if (($in_hermes_phase || $in_rn_phase) && /runOnlyForDeploymentPostprocessing/) {
        $already_set = 1;
    }
    
    print;
' "$PROJECT_FILE"

if [[ $? -eq 0 ]]; then
    echo "✅ Successfully disabled dependency analysis for build phases"
    echo ""
    echo "🎉 Next steps:"
    echo "   1. Open Xcode and clean build folder (Cmd+Shift+K)"
    echo "   2. Try building your project"
    echo ""
    echo "💡 This tells Xcode to run the scripts on every build instead of trying to analyze dependencies"
else
    echo "❌ Failed to modify project file, restoring backup"
    cp "$PROJECT_FILE.backup" "$PROJECT_FILE"
    exit 1
fi
