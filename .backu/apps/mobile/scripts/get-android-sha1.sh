#!/bin/bash

# Script to get Android SHA-1 certificate fingerprint for Google OAuth setup
# Usage: ./scripts/get-android-sha1.sh

echo "🔐 Getting Android SHA-1 Certificate Fingerprint for CivicSense"
echo "=================================================="

# Check if keytool is available
if command -v keytool &> /dev/null; then
    echo "✅ Java keytool found"
    
    # Check if debug keystore exists
    if [ -f ~/.android/debug.keystore ]; then
        echo "✅ Debug keystore found"
        echo ""
        echo "📋 SHA-1 Certificate Fingerprint:"
        echo "=================================================="
        
        # Get SHA-1 fingerprint
        keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android | grep "SHA1:"
        
        echo ""
        echo "📝 Copy the SHA-1 fingerprint above to Google Cloud Console"
        echo "📦 Package name: com.civicsense.app"
        
    else
        echo "❌ Debug keystore not found at ~/.android/debug.keystore"
        echo "💡 Try running your app in Android Studio first to generate the keystore"
    fi
    
else
    echo "❌ Java keytool not found"
    echo ""
    echo "🔧 Install Java using one of these methods:"
    echo "   • Homebrew: brew install openjdk@11"
    echo "   • Download from: https://www.oracle.com/java/technologies/downloads/"
    echo ""
    echo "📱 Alternative methods:"
    echo "   • Use Android Studio: View > Tool Windows > Terminal, then run './gradlew signingReport'"
    echo "   • Use Expo online: https://expo.dev/accounts/[username]/projects/civicsense/credentials"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Use the SHA-1 fingerprint in Google Cloud Console"
echo "2. Create Android OAuth Client ID"
echo "3. Copy the client ID to your .env file"
echo "4. Test the Google Calendar integration" 