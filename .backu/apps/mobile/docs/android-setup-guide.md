# Android Development Setup for CivicSense

## 🎯 **Quick Start Guide**

Follow these steps to set up Android development and get your Google OAuth working.

### Step 1: ✅ Install Android Studio (In Progress)

Android Studio is currently installing via Homebrew. Wait for it to complete.

### Step 2: 🛠️ **Complete Android Studio Setup**

1. **Open Android Studio**:
   ```bash
   open /Applications/Android\ Studio.app
   ```

2. **Follow Setup Wizard**:
   - ✅ Accept all license agreements
   - ✅ Choose **"Standard"** installation type
   - ✅ Let it download:
     - Android SDK
     - Android SDK Platform-Tools  
     - Android Emulator
     - Android SDK Build-Tools
   - ✅ Wait for downloads to complete (takes 5-10 minutes)

### Step 3: 🔧 **Set Up Environment Variables**

After Android Studio setup completes, run this script:

```bash
./setup-android-env.sh
```

Then restart your terminal or run:
```bash
source ~/.zshrc
```

### Step 4: 📱 **Create Android Virtual Device (AVD)**

1. **Open AVD Manager**:
   - In Android Studio: **Tools > AVD Manager**
   - Or click the phone icon in the toolbar

2. **Create New AVD**:
   - Click **"Create Virtual Device"**
   - Choose **Phone > Pixel 7** (recommended)
   - Download system image: **API 34 (Android 14)** with Google APIs
   - Configure AVD:
     - Name: `CivicSense_Pixel_7`
     - Startup size: `Cold Boot`
     - Graphics: `Hardware - GLES 2.0`
   - Click **"Finish"**

3. **Start Emulator**:
   - Click the ▶️ play button next to your AVD
   - Wait for Android to boot up

### Step 5: 🧪 **Test Your Setup**

```bash
# Check if ADB is working
adb devices

# List available emulators
emulator -list-avds

# Test Expo with Android
npx expo start --android
```

### Step 6: 🔐 **Get SHA-1 Certificate Fingerprint**

Now you can get your SHA-1 fingerprint for Google OAuth:

```bash
./scripts/get-android-sha1.sh
```

Or manually:
```bash
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android | grep "SHA1:"
```

### Step 7: 🎯 **Complete Google OAuth Setup**

1. **Use this info in Google Cloud Console**:
   - Package name: `com.civicsense.app`
   - SHA-1 fingerprint: (from step 6)

2. **Update your .env file**:
   ```env
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
   ```

---

## 🔧 **Troubleshooting**

### Common Issues:

**❌ "ANDROID_HOME not set"**
```bash
# Run the setup script
./setup-android-env.sh
# Then restart terminal
```

**❌ "adb command not found"** 
```bash
# Check if Android SDK is installed
ls ~/Library/Android/sdk/platform-tools/
# If empty, re-run Android Studio setup
```

**❌ "Emulator won't start"**
```bash
# Check virtualization is enabled
# In Android Studio: Tools > SDK Manager > SDK Tools
# Ensure "Intel x86 Emulator Accelerator (HAXM installer)" is checked
```

**❌ "App won't install on emulator"**
```bash
# Clear Metro cache
npx expo start --clear

# Or try
adb uninstall com.civicsense.app
npx expo run:android
```

### Performance Tips:

1. **Allocate more RAM** to emulator (4GB+ recommended)
2. **Enable hardware acceleration** in AVD settings
3. **Close other apps** while running emulator
4. **Use ARM64 system images** on Apple Silicon Macs

---

## 📱 **Alternative: Use Physical Device**

If emulator is too slow:

1. **Enable Developer Options** on your Android phone:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

2. **Connect via USB**:
   ```bash
   adb devices
   # Should show your device
   ```

3. **Install app directly**:
   ```bash
   npx expo run:android --device
   ```

---

## 🎯 **Next Steps After Setup**

Once Android is working:

1. ✅ Test Google Calendar integration
2. ✅ Verify OAuth authentication flow  
3. ✅ Test on both emulator and physical device
4. ✅ Set up production signing for Google Play Store

---

## 📋 **Quick Reference**

### Useful Commands:
```bash
# Start emulator
emulator -avd CivicSense_Pixel_7

# Check connected devices  
adb devices

# View logs
adb logcat

# Install APK
adb install app-debug.apk

# Uninstall app
adb uninstall com.civicsense.app

# Start Metro bundler
npx expo start

# Run on Android
npx expo run:android
```

### File Locations:
- Android SDK: `~/Library/Android/sdk`
- AVDs: `~/.android/avd`
- Debug keystore: `~/.android/debug.keystore`
- ADB: `~/Library/Android/sdk/platform-tools/adb`

---

*This guide will get your Android development environment fully set up for CivicSense! 🚀* 