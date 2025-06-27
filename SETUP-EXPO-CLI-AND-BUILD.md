# Setup Expo CLI and Build Commands

## Install Expo CLI

You're getting `command not found: expo` because Expo CLI isn't installed globally. Here are the options:

### Option 1: Install Expo CLI Globally (Recommended)
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

### Option 2: Use npx (No Installation Required)
```bash
# Use npx to run expo commands directly
npx expo run:ios --device
```

### Option 3: Use Local Package Scripts
```bash
# Use npm scripts defined in your package.json
npm run ios
```

## Building for Device Testing

Once you have Expo CLI installed, here are your build options:

### Method 1: Direct Device Build (USB Cable)
```bash
# Make sure your iPhone is connected via USB
expo run:ios --device

# Alternative with npx
npx expo run:ios --device
```

### Method 2: EAS Build (Wireless)
```bash
# First install EAS CLI if not already installed
npm install -g eas-cli

# Login to your Expo account
eas login

# Register your device
eas device:create

# Build development version
eas build --profile development --platform ios
```

## Step-by-Step Setup

### 1. Install Required Tools
```bash
# Install Expo CLI
npm install -g @expo/cli

# Install EAS CLI (for wireless builds)
npm install -g eas-cli

# Verify installations
expo --version
eas --version
```

### 2. Check Your Current Setup
```bash
# Check if you have the right dependencies
npm list expo
npm list @expo/cli
```

### 3. Update Your Project (if needed)
```bash
# Update Expo SDK if needed
npx expo update

# Install any missing dependencies
npm install
```

## For Your Specific Project

Based on your package.json, you should be able to use:

### Using Package Scripts:
```bash
# These should work with your current setup
npm run ios          # Runs: expo run:ios
npm run start        # Runs: expo start
```

### Using Expo CLI Directly:
```bash
# After installing Expo CLI globally
expo run:ios --device
expo prebuild --clean
expo start
```

### Using npx (No Installation):
```bash
# If you don't want to install globally
npx expo run:ios --device
npx expo prebuild --clean
npx expo start
```

## Apple Sign In Testing Commands

Once you have Expo CLI working:

### Quick Device Testing:
```bash
# Connect iPhone via USB and run:
expo run:ios --device

# Or use npx:
npx expo run:ios --device
```

### EAS Development Build:
```bash
# Register device first
eas device:create

# Build for device
eas build --profile development --platform ios

# Check build status
eas build:list
```

## Troubleshooting

### If `expo` command still not found after installation:
```bash
# Check your PATH
echo $PATH

# Restart your terminal
# Or reload your shell profile
source ~/.zshrc
# or
source ~/.bash_profile
```

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Try installing with sudo (if on Mac/Linux)
sudo npm install -g @expo/cli
```

### If you get permission errors:
```bash
# Fix npm permissions (Mac/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

## Quick Start for Apple Sign In Testing

1. **Install Expo CLI:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Connect iPhone via USB**

3. **Build and test:**
   ```bash
   expo run:ios --device
   ```

4. **Test Apple Sign In on your device!**

## Alternative: Use Your Package Scripts

If you don't want to install Expo CLI globally, check your package.json scripts:

```bash
# Check what scripts are available
npm run

# Try using the ios script
npm run ios
```

This should work with your current setup since your package.json already has Expo configured!
