# CivicSense Mobile: App Store Implementation Guide

*A comprehensive guide for shipping the CivicSense mobile app to the App Store*

## 📋 Pre-submission Checklist

### 1. App Configuration
Ensure `app.config.ts` is properly configured with all required fields:

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CivicSense',
  slug: 'civicsense',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#3B82F6'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.civicsense.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'CivicSense needs camera access for profile photos',
      NSPhotoLibraryUsageDescription: 'CivicSense needs access to your photos to let you choose a profile picture',
      CFBundleAllowMixedLocalizations: true,
      UIBackgroundModes: ['fetch', 'remote-notification'],
      NSFaceIDUsageDescription: 'CivicSense uses Face ID for secure authentication',
    }
  }
});
```

### 2. EAS Build Configuration
Update `eas.json` with production settings:

```json
{
  "cli": {
    "version": ">= 5.2.0",
    "requireCommit": true,
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "medium",
        "buildConfiguration": "Release",
        "credentialsSource": "remote",
        "distribution": "store",
        "cache": {
          "key": "ios-production"
        }
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

## 🎨 App Store Assets

### Required Assets Checklist

#### 1. App Icon Sizes
- [ ] 1024x1024px (App Store)
- [ ] 180x180px (iPhone)
- [ ] 167x167px (iPad Pro)
- [ ] 152x152px (iPad)
- [ ] 120x120px (iPhone)

#### 2. Screenshots (All with Dark & Light Themes)
- [ ] iPhone 6.7" Display (1290x2796px)
  - Home screen
  - Quiz in progress
  - Quiz results
  - Profile/Progress
  - Multiplayer lobby
- [ ] iPhone 6.5" Display (1242x2688px)
  - Same screens as above
- [ ] iPad Pro (2048x2732px)
  - Same screens with tablet optimizations

#### 3. App Preview Videos
- [ ] 15-30 second preview showcasing:
  - Quiz interaction
  - Progress tracking
  - Multiplayer features
  - Accessibility features

## 📱 App Store Connect Setup

### 1. App Information
- [ ] App name: "CivicSense"
- [ ] Subtitle: "Civic Education That Matters"
- [ ] Category: Education
- [ ] Secondary Category: Reference

### 2. Description
```markdown
CivicSense: Understanding Power in Society

Learn how government and power actually work - not just how they're supposed to work. CivicSense provides practical civic education that helps you:

• Understand Real Power Dynamics
• Navigate Government Systems
• Make Informed Decisions
• Participate Effectively

Key Features:
✓ Interactive Quizzes & Assessments
✓ Progress Tracking
✓ Multiplayer Learning
✓ Offline Access
✓ Dark Mode Support

Download CivicSense and start building your civic knowledge today.
```

### 3. Keywords
```
civic education, government, democracy, politics, civics, quiz, learning, power, society, participation, engagement, knowledge
```

### 4. Support URLs
- Privacy Policy: https://civicsense.one/privacy
- Support URL: https://civicsense.one/support
- Marketing URL: https://civicsense.one

## 🔍 Pre-submission Testing

### 1. Functionality Testing
- [ ] Complete quiz flow
- [ ] Multiplayer functionality
- [ ] Progress tracking
- [ ] Offline capabilities
- [ ] Push notifications
- [ ] Deep linking

### 2. Performance Testing
- [ ] Cold start time < 2s
- [ ] Smooth animations (60fps)
- [ ] Memory usage < 150MB
- [ ] Network error handling
- [ ] Battery impact testing

### 3. UI/UX Testing
- [ ] Dark mode compatibility
- [ ] Dynamic type support
- [ ] VoiceOver functionality
- [ ] Proper keyboard handling
- [ ] Safe area compliance

### 4. Device Testing Matrix
- [ ] iPhone 14 Pro Max
- [ ] iPhone 14
- [ ] iPhone SE
- [ ] iPad Pro
- [ ] iPad Air
- [ ] Older iOS versions (iOS 13+)

## 🚀 Submission Process

### 1. Build Production Version
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit -p ios --latest
```

### 2. TestFlight Beta Testing
- [ ] Internal testing (1 week)
- [ ] External testing (2 weeks)
- [ ] Bug fixes and improvements
- [ ] Performance monitoring

### 3. App Store Review Guidelines
- [ ] [4.2 Design: Minimum Functionality](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)
- [ ] [5.1.1 Privacy: Data Collection and Storage](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [ ] [5.1.5 Privacy: Location Services](https://developer.apple.com/app-store/review/guidelines/#location-services)

### 4. Final Submission Checklist
- [ ] App meets all App Store Review Guidelines
- [ ] All required assets uploaded
- [ ] Privacy policy and support URLs active
- [ ] TestFlight testing completed
- [ ] Export compliance documentation ready
- [ ] App Store promotional text finalized
- [ ] Release notes prepared

## 📊 Post-Launch Monitoring

### 1. Analytics Setup
- [ ] App Store Connect analytics
- [ ] Crash reporting
- [ ] User engagement metrics
- [ ] Performance monitoring

### 2. Support Infrastructure
- [ ] Support email monitored
- [ ] Bug reporting system active
- [ ] User feedback collection
- [ ] Social media monitoring

### 3. Update Planning
- [ ] 1.0.1 bug fixes ready
- [ ] Feature roadmap defined
- [ ] Update schedule established

## 🎯 Success Metrics

### 1. Performance Metrics
- Cold start time: < 2 seconds
- Crash rate: < 0.1%
- ANR rate: < 0.1%
- Battery impact: < 5% per hour

### 2. User Metrics
- Day 1 retention: > 40%
- Day 7 retention: > 20%
- Day 30 retention: > 10%
- Quiz completion rate: > 60%

### 3. App Store Metrics
- Rating target: 4.5+
- Response time to reviews: < 24 hours
- Update frequency: Every 2-4 weeks

## 📝 Notes

### Common Rejection Reasons
1. Incomplete Information
2. Broken Functionality
3. Poor Performance
4. Privacy Concerns
5. Misleading Description

### Best Practices
1. Test thoroughly on all supported devices
2. Provide clear privacy explanations
3. Ensure accessibility compliance
4. Monitor TestFlight feedback
5. Prepare marketing materials early

---

*This guide is maintained by the CivicSense mobile team. For questions or updates, please contact the mobile team lead.* 