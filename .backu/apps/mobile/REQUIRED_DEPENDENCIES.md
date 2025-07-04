# Required Dependencies for CivicSense Export Feature

## 📋 Overview
The enhanced CivicSense learning analytics export feature requires several Expo packages to generate professional, branded PDF reports with comprehensive user data.

## 🔧 Installation Commands

Run the following commands in your project root to install all required dependencies:

```bash
# Core Expo packages for PDF generation and file sharing
npx expo install expo-print expo-sharing expo-file-system

# Additional utilities (if not already installed)
npx expo install expo-constants expo-device

# Verify installation
npm list expo-print expo-sharing expo-file-system
```

## 📦 Package Details

### expo-print
- **Purpose**: Generate PDF documents from HTML content
- **Version**: Latest compatible with Expo SDK 51
- **Usage**: Creates the branded CivicSense learning analytics reports

### expo-sharing
- **Purpose**: Share files across apps and platforms
- **Version**: Latest compatible with Expo SDK 51  
- **Usage**: Allows users to share their learning reports via email, messaging, cloud storage, etc.

### expo-file-system
- **Purpose**: File system operations and temporary file management
- **Version**: Latest compatible with Expo SDK 51
- **Usage**: Manages temporary PDF files and cleanup operations

## 🏗️ Platform Compatibility

### iOS
- ✅ Full support for PDF generation
- ✅ Native sharing sheet integration
- ✅ File system access with proper permissions

### Android
- ✅ Full support for PDF generation
- ✅ Android sharing intents
- ✅ External storage access (with permissions)

## 🔒 Permissions Required

### iOS (automatically handled)
- No additional permissions required
- Uses native iOS sharing capabilities

### Android (app.json configuration)
```json
{
  "expo": {
    "android": {
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## 🧪 Testing the Export Feature

After installation, test the export functionality:

1. **Development**: Works in Expo Go and development builds
2. **Production**: Requires proper build configuration
3. **Testing Steps**:
   - Complete some quizzes to generate data
   - Navigate to Profile or Settings
   - Tap "Export Learning Analytics"
   - Verify PDF generation and sharing options

## 🚨 Troubleshooting

### Common Issues

#### "expo-print not found"
```bash
# Solution: Reinstall the package
npx expo install expo-print --fix
```

#### "Permission denied" on Android
- Ensure proper permissions in app.json
- Test on physical device (not just emulator)

#### "PDF generation failed"
- Check that user has completed at least one quiz
- Verify internet connection for data fetching
- Check console logs for specific error details

#### "Sharing failed"
- Test on physical device (sharing may not work in simulators)
- Ensure the PDF file was created successfully first

## 🔄 Update Instructions

To update the export packages:

```bash
# Update all Expo packages
npx expo install --fix

# Or update specific packages
npx expo install expo-print@latest expo-sharing@latest expo-file-system@latest
```

## 🎯 Feature Integration

The export feature is now integrated into:

1. **Profile Screen** (`app/(tabs)/profile.tsx`)
   - Main export button in progress section
   - Comprehensive analytics report

2. **Settings Screen** (`app/settings/edit-profile.tsx`) 
   - Secondary export option in data management
   - Same functionality as profile screen

3. **Export Service** (`lib/services/learning-export-service.ts`)
   - Centralized PDF generation logic
   - Branded template with CivicSense styling
   - Real analytics calculations

## 💡 Success Criteria

When properly installed, users should be able to:
- ✅ Generate PDF reports with full CivicSense branding
- ✅ Include comprehensive learning analytics and insights
- ✅ Share reports via native platform sharing
- ✅ Save reports locally for personal reference
- ✅ Access civicsense.one domain links within reports

---

*This export feature reinforces the CivicSense mission of empowering democratic participation through civic education analytics.* 