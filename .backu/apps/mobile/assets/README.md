# CivicSense Mobile Assets

This directory contains all the assets for the CivicSense mobile app.

## Required Assets

### Icons
- `icon.png` - App icon (1024x1024)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024)
- `adaptive-icon-monochrome.png` - Android monochrome icon (1024x1024)
- `favicon.png` - Web favicon (48x48)

### Splash Screen
- `splash.png` - Splash screen image (1284x2778 for iPhone 13 Pro Max)

### Brand Colors
- Authority Blue: #3B82F6
- Empowerment Green: #10B981
- Insight Gold: #F59E0B

## Generating Icons

You can use the Expo CLI to generate icons:

```bash
npx expo install @expo/image-utils
# Then use your design tool to create the base icon and run:
npx expo customize
```

## Asset Optimization

All images should be optimized for mobile:
- Use WebP format when possible
- Provide @2x and @3x variants for iOS
- Use appropriate Android density folders 