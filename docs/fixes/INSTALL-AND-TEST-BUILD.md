# Install and Test Your EAS Build on Device

## Congratulations! 🎉
You have a successful EAS build ready to test Apple Sign In on your registered device.

## Step-by-Step Installation

### Method 1: Get Installation Link from EAS

#### 1. Check Your Build Status
```bash
# View your recent builds
eas build:list

# Look for your successful build with status "finished"
```

#### 2. Get Installation Link
```bash
# Get details of your latest build (replace with your build ID if needed)
eas build:view

# This will show the installation URL
```

#### 3. Install on Your iPhone
**Option A: QR Code (Easiest)**
- The build details will show a QR code
- Open Camera app on your iPhone
- Point camera at QR code
- Tap the notification to install

**Option B: Direct Link**
- Copy the installation URL from the build details
- Send it to your iPhone (text, email, AirDrop)
- Open the link on your iPhone
- Tap "Install" when prompted

### Method 2: Install via Expo Dashboard

#### 1. Go to Expo Dashboard
- Open: https://expo.dev/accounts/infinitydata.ai/projects/jung/builds
- Sign in with your Expo account

#### 2. Find Your Build
- Look for your latest successful iOS build
- Click on the build

#### 3. Install on Device
- You'll see a QR code and install button
- Scan QR code with your iPhone camera
- Or tap "Install on device" if viewing on your phone

## Installation Steps on iPhone

### 1. Trust the Developer
After downloading, you might see "Untrusted Developer" error:
- Go to **Settings** → **General** → **VPN & Device Management**
- Find your developer profile (infinitydata.ai@gmail.com)
- Tap **"Trust infinitydata.ai@gmail.com"**
- Tap **"Trust"** again to confirm

### 2. Enable Developer Mode (iOS 16+)
If prompted for Developer Mode:
- Go to **Settings** → **Privacy & Security** → **Developer Mode**
- Toggle **Developer Mode** ON
- Restart your iPhone when prompted
- Enter your passcode when it restarts

## Testing Apple Sign In

### 1. Open the App
- Find the "jung" app on your iPhone home screen
- Tap to open

### 2. Navigate to Login
- Navigate to the login screen
- You should see the "Sign in with Apple" button

### 3. Test Apple Sign In
- Tap **"Sign in with Apple"**
- You should see Apple's authentication modal
- **Expected Result:** Currently will show improved error messages
- **After Apple Developer setup:** Will work completely

### 4. Check Console Logs
The app now has enhanced logging with 🍎 emojis:
- Any errors will show detailed information
- You'll see helpful error messages for configuration issues

## What to Expect Right Now

### ✅ What Will Work:
- App installs and opens successfully
- Login screen appears with Apple Sign In button
- Button responds when tapped
- Detailed error logging shows helpful messages

### ❌ What Won't Work Yet:
- Apple Sign In authentication (needs Apple Developer Console setup)
- You'll see configuration error messages

### 🔧 To Make Apple Sign In Fully Work:
1. **Apple Developer Console Setup:**
   - Enable Apple Sign In capability on App ID: `org.name.jung`
   - Create Service ID: `org.name.jung.web`
   - Generate private key (.p8 file)

2. **Supabase Configuration:**
   - Enable Apple provider
   - Add Apple credentials

## Quick Commands Reference

```bash
# Check your builds
eas build:list

# View specific build details
eas build:view [build-id]

# Get installation URL
eas build:view --json
```

## Installation Troubleshooting

### "App Cannot Be Installed"
- Make sure your device is registered: `eas device:list`
- Check that you're using the development build (not production)

### "Untrusted Developer"
- Go to Settings → General → VPN & Device Management
- Trust your developer profile

### "Developer Mode Required"
- Settings → Privacy & Security → Developer Mode
- Enable and restart device

### QR Code Won't Scan
- Make sure you're using the iPhone Camera app (not a QR reader app)
- Try copying the direct installation URL instead

## Success Indicators

### ✅ Installation Successful:
- App appears on home screen
- App opens without crashing
- Login screen loads properly

### ✅ Ready for Apple Sign In Testing:
- Apple Sign In button appears
- Button is tappable
- Shows improved error messages when tapped

### 🎯 Next Steps:
- Complete Apple Developer Console setup
- Configure Supabase Apple provider
- Test fully working Apple Sign In

## Getting Installation URL

If you need the installation URL again:

```bash
# Method 1: Command line
eas build:list
eas build:view [your-build-id]

# Method 2: Expo dashboard
# Go to: https://expo.dev/accounts/infinitydata.ai/projects/jung/builds
```

**Your app is ready to install and test Apple Sign In functionality!**
