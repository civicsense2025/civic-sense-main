#!/bin/bash

# Script to set up Android environment variables for CivicSense development
# Run this after installing Android Studio

echo "🤖 Setting up Android Environment Variables"
echo "=========================================="

# Define Android SDK path
ANDROID_SDK_PATH="$HOME/Library/Android/sdk"

# Check if Android SDK exists
if [ -d "$ANDROID_SDK_PATH" ]; then
    echo "✅ Android SDK found at: $ANDROID_SDK_PATH"
else
    echo "❌ Android SDK not found. Please complete Android Studio setup first."
    echo "   Open Android Studio and go through the initial setup wizard."
    exit 1
fi

# Determine shell configuration file
if [ -f ~/.zshrc ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    echo "📝 Using Zsh configuration: $SHELL_CONFIG"
elif [ -f ~/.bash_profile ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
    echo "📝 Using Bash configuration: $SHELL_CONFIG"
else
    SHELL_CONFIG="$HOME/.zshrc"
    echo "📝 Creating new Zsh configuration: $SHELL_CONFIG"
    touch "$SHELL_CONFIG"
fi

# Backup existing config
cp "$SHELL_CONFIG" "${SHELL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Backed up existing shell configuration"

# Add Android environment variables
echo "" >> "$SHELL_CONFIG"
echo "# Android Development Environment (added by CivicSense setup)" >> "$SHELL_CONFIG"
echo "export ANDROID_HOME=$ANDROID_SDK_PATH" >> "$SHELL_CONFIG"
echo "export ANDROID_SDK_ROOT=$ANDROID_SDK_PATH" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> "$SHELL_CONFIG"

echo "✅ Added Android environment variables to $SHELL_CONFIG"
echo ""
echo "🔄 Reload your shell configuration:"
echo "   source $SHELL_CONFIG"
echo ""
echo "🧪 Test your setup:"
echo "   adb version"
echo "   emulator -list-avds"
echo ""
echo "🎯 Next steps:"
echo "1. Restart your terminal or run: source $SHELL_CONFIG"
echo "2. Create an Android Virtual Device (AVD) in Android Studio"
echo "3. Test with: npm run android" 