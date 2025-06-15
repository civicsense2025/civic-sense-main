# PWA (Progressive Web App) Setup Guide

## Overview
CivicSense is now configured as a Progressive Web App (PWA) with offline capabilities, home screen installation, and push notifications support.

## Required Icons

To complete the PWA setup, you need to create the following icon files in the `/public/icons/` directory:

### App Icons
- `icon-16x16.png` - Favicon
- `icon-32x32.png` - Favicon  
- `icon-72x72.png` - App icon
- `icon-96x96.png` - App icon
- `icon-128x128.png` - App icon
- `icon-144x144.png` - App icon
- `icon-152x152.png` - Apple touch icon
- `icon-167x167.png` - Apple touch icon (iPad)
- `icon-180x180.png` - Apple touch icon (iPhone)
- `icon-192x192.png` - Android icon
- `icon-384x384.png` - Android icon
- `icon-512x512.png` - Android icon

### Splash Screens (iOS)
- `splash-640x1136.png` - iPhone 5/5s/5c/SE
- `splash-750x1334.png` - iPhone 6/6s/7/8
- `splash-1125x2436.png` - iPhone X/XS/11 Pro
- `splash-1242x2208.png` - iPhone 6/6s/7/8 Plus
- `splash-1536x2048.png` - iPad (portrait)
- `splash-1668x2224.png` - iPad Pro 10.5" (portrait)
- `splash-2048x2732.png` - iPad Pro 12.9" (portrait)

### Screenshots (Optional)
- `screenshot-wide.png` - Desktop screenshot (1280x720)
- `screenshot-narrow.png` - Mobile screenshot (720x1280)

## Icon Design Guidelines

### Design Requirements
- **Simple and recognizable**: The icon should be easily identifiable at small sizes
- **Maskable**: Design should work with Android's adaptive icon system
- **Consistent branding**: Use CivicSense brand colors and style
- **High contrast**: Ensure visibility on both light and dark backgrounds

### Recommended Approach
1. Create a master icon at 512x512px
2. Use the CivicSense logo or "CS" monogram
3. Use brand colors: Primary blue (#1e40af), white, and dark variants
4. Include safe areas for maskable icons (center 80% of the icon)

### Color Scheme
- Primary: `#1e40af` (Blue)
- Background: `#ffffff` (White) / `#000000` (Dark)
- Text: `#000000` (Dark) / `#ffffff` (Light)

## PWA Features Implemented

### 1. Web App Manifest (`/public/manifest.json`)
- App metadata and branding
- Icon definitions
- Display modes and orientation
- Shortcuts for quick actions
- Screenshots for app stores

### 2. Service Worker (`/public/sw.js`)
- **Offline functionality**: Cache key resources for offline access
- **Background sync**: Sync quiz submissions when online
- **Push notifications**: Support for future notification features
- **Update handling**: Automatic updates with user control

### 3. PWA Prompt Component (`/components/pwa-prompt.tsx`)
- **Smart prompting**: Shows install prompt after user engagement
- **Cross-platform**: Works on both Android and iOS
- **Dismissal handling**: Respects user choice with smart retry logic
- **Fallback instructions**: Manual installation guide for unsupported browsers

### 4. PWA Status Component
- **Development tool**: Shows PWA status in development mode
- **Debug information**: Display mode, installation status, and installability

## Installation Behavior

### Android (Chrome/Edge)
- Automatic "Add to Home Screen" prompt after user engagement
- Banner notification with install button
- Full app-like experience when installed

### iOS (Safari)
- Manual installation via Share menu → "Add to Home Screen"
- Fallback instructions modal for users
- Standalone app experience

### Desktop (Chrome/Edge)
- Install button in address bar
- App window with custom controls
- Native-like experience

## Offline Functionality

### Cached Resources
- Static assets (HTML, CSS, JS, images)
- API responses (with network-first strategy)
- Quiz data and user progress

### Background Sync
- Quiz submissions sync when connection restored
- Progress updates sync automatically
- Retry failed network requests

## Push Notifications (Future)

The PWA is prepared for push notifications with:
- Notification permission handling
- Message display with actions
- Click handling for app navigation
- Badge and icon support

## Testing the PWA

### Local Testing
1. Run the app in development mode
2. Open Chrome DevTools → Application → Service Workers
3. Check "Offline" to test offline functionality
4. Use "Add to Home Screen" to test installation

### Lighthouse Audit
Run a Lighthouse audit to check PWA score:
- Performance
- Accessibility  
- Best Practices
- SEO
- PWA compliance

### Required Lighthouse PWA Criteria
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Contains a web app manifest
- ✅ Installable
- ✅ Provides a valid theme color
- ✅ Has a viewport meta tag
- ✅ Contains icons for add to home screen

## Deployment Considerations

### HTTPS Required
- PWAs require HTTPS in production
- Service workers only work over HTTPS
- Ensure SSL certificate is properly configured

### Headers
Set appropriate headers for PWA resources:
```
# Manifest
/manifest.json
  Cache-Control: max-age=86400

# Service Worker  
/sw.js
  Cache-Control: no-cache

# Icons
/icons/*
  Cache-Control: max-age=31536000
```

### CDN Configuration
- Ensure service worker is served from same origin
- Configure proper MIME types for manifest and icons
- Set appropriate cache headers

## Monitoring and Analytics

### PWA-Specific Analytics
Track PWA usage with:
- Installation events
- Standalone usage vs browser
- Offline usage patterns
- Push notification engagement

### Service Worker Updates
- Monitor service worker update success/failure
- Track cache hit/miss ratios
- Log offline functionality usage

## Troubleshooting

### Common Issues
1. **Icons not showing**: Check file paths and formats
2. **Install prompt not appearing**: Verify HTTPS and manifest validity
3. **Offline not working**: Check service worker registration
4. **iOS installation issues**: Provide manual instructions

### Debug Tools
- Chrome DevTools → Application tab
- Service Worker debug console
- Manifest validation tools
- PWA testing tools

## Future Enhancements

### Planned Features
- Push notifications for quiz reminders
- Background sync for content updates
- Offline quiz mode
- App shortcuts for quick actions
- Share target API integration

### Performance Optimizations
- Precache critical resources
- Implement smart caching strategies
- Optimize bundle sizes
- Add resource hints 