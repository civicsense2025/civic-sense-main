# CivicSense Facebook SDK Integration for Instagram/Facebook Stories

## 🎯 Complete Implementation Guide

This document outlines the complete implementation of official Instagram and Facebook Story sharing using the Facebook SDK, integrated with CivicSense's dynamic image generation system.

---

## ✅ What's Been Implemented

### 1. **Facebook SDK Configuration** (`mobile/lib/facebook-sdk.ts`)
- **Official Instagram Story sharing** using `instagram-stories://` URL scheme
- **Official Facebook Story sharing** using `facebook-stories://` URL scheme
- **Facebook App ID integration** (required since January 2023)
- **Platform detection** to check Instagram/Facebook availability
- **Background asset sharing** with dynamic image generation
- **Fallback sharing** for when apps aren't installed
- **Error handling** and user feedback

### 2. **Enhanced Story Share Component** (`mobile/components/ui/InstagramStoryShareV2.tsx`)
- **Facebook SDK integration** with platform detection
- **Dynamic image generation** for different content types
- **Preview functionality** before sharing
- **Loading states** and error handling
- **Platform availability indicators**
- **CivicSense branding** and styling

### 3. **App Configuration** (`mobile/app.json`)
- **URL scheme registration** for Instagram and Facebook
- **Facebook App ID configuration**
- **Platform-specific settings** for iOS and Android
- **Permissions** for external storage and app queries

### 4. **Dependencies** (`apps/mobile/package.json`)
- **`react-native-fbsdk-next`** added for Facebook SDK functionality

---

## 🔧 Setup Requirements

### 1. **Facebook App Configuration**

#### Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add Instagram and Facebook products
4. Configure Basic Settings

#### Required Settings
```javascript
// In your environment variables (.env)
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here

// In Facebook App Dashboard:
// - Enable Instagram Story Sharing
// - Enable Facebook Story Sharing
// - Add your app bundle identifiers:
//   iOS: com.civicsense.mobile
//   Android: com.civicsense.mobile
```

### 2. **iOS Configuration**

#### Info.plist Requirements (Already configured in app.json)
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>instagram</string>
    <string>instagram-stories</string>
    <string>facebook</string>
    <string>facebook-stories</string>
</array>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>CivicSense Facebook Integration</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>fb{FACEBOOK_APP_ID}</string>
        </array>
    </dict>
</array>
```

### 3. **Android Configuration**

#### Manifest Queries (Already configured in app.json)
```xml
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="instagram" />
    </intent>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="facebook" />
    </intent>
</queries>
```

---

## 📱 Usage Examples

### Basic Implementation
```tsx
import { InstagramStoryShareV2 } from '../components/ui/InstagramStoryShareV2';

// Share quiz completion
<InstagramStoryShareV2
  type="result"
  topic={{
    id: "constitutional-rights",
    title: "Constitutional Rights",
    emoji: "⚖️",
    category: "Law"
  }}
  userProgress={{
    score: 85,
    totalQuestions: 10,
    completedAt: new Date()
  }}
  userName="Alex"
  contentUrl="https://civicsense.com/quiz/constitutional-rights"
  onShareStart={() => console.log('Sharing started')}
  onShareComplete={(result) => {
    console.log('Share result:', result);
    // Track sharing analytics
  }}
  onError={(error) => {
    console.error('Share error:', error);
    // Handle error reporting
  }}
/>

// Share learning streak
<InstagramStoryShareV2
  type="streak"
  streakCount={7}
  userName="Alex"
  contentUrl="https://civicsense.com"
  customMessage="7 days of learning about how democracy works! 🇺🇸"
/>

// Share achievement
<InstagramStoryShareV2
  type="achievement"
  achievement={{
    title: "Constitution Expert",
    description: "Mastered all constitutional rights quizzes",
    badge: "🏆",
    unlockedAt: new Date()
  }}
  userName="Alex"
  contentUrl="https://civicsense.com/achievements"
/>
```

### Advanced Integration with Analytics
```tsx
import { InstagramStoryShareV2 } from '../components/ui/InstagramStoryShareV2';
import { analytics } from '../lib/analytics';

function QuizCompletionScreen({ quiz, results }) {
  const handleShareStart = () => {
    analytics.track('story_share_started', {
      quiz_id: quiz.id,
      score: results.score,
      platform: 'unknown' // Will be determined by SDK
    });
  };

  const handleShareComplete = (result) => {
    analytics.track('story_share_completed', {
      quiz_id: quiz.id,
      score: results.score,
      platform: result.method,
      success: result.success
    });

    if (result.success) {
      // Award sharing achievement points
      awardPoints('social_sharing', 10);
    }
  };

  return (
    <View>
      {/* Quiz results display */}
      
      <InstagramStoryShareV2
        type="result"
        topic={quiz}
        userProgress={results}
        userName={user.name}
        contentUrl={`https://civicsense.com/quiz/${quiz.id}`}
        onShareStart={handleShareStart}
        onShareComplete={handleShareComplete}
        onError={(error) => {
          analytics.track('story_share_error', {
            quiz_id: quiz.id,
            error: error
          });
        }}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
```

---

## 🔄 Sharing Flow

### 1. **Instagram Stories Flow**
```
User clicks share → 
Generate dynamic image → 
Download image locally → 
Check Instagram availability → 
Open instagram-stories:// with Facebook App ID → 
Instagram opens with pre-filled background → 
User adds text/stickers and shares
```

### 2. **Facebook Stories Flow**
```
User clicks share → 
Generate dynamic image → 
Download image locally → 
Check Facebook availability → 
Open facebook-stories:// with Facebook App ID → 
Facebook opens with pre-filled background → 
User adds text/stickers and shares
```

### 3. **Fallback Flow**
```
User clicks share → 
Generate dynamic image → 
No Instagram/Facebook available → 
Show native share dialog → 
User chooses app to share to → 
Share with generated image + text
```

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. **"App doesn't support sharing to Stories" Error**
```javascript
// Issue: Facebook App ID not configured
// Solution: Set EXPO_PUBLIC_FACEBOOK_APP_ID in environment
EXPO_PUBLIC_FACEBOOK_APP_ID=123456789012345

// Verify in app:
console.log('Facebook App ID:', process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);
```

#### 2. **Instagram/Facebook Not Opening**
```javascript
// Issue: URL schemes not registered
// Solution: Check app.json configuration
{
  "ios": {
    "infoPlist": {
      "LSApplicationQueriesSchemes": [
        "instagram-stories",
        "facebook-stories"
      ]
    }
  }
}
```

#### 3. **Image Not Appearing in Stories**
```javascript
// Issue: Image download or format problem
// Solution: Check image URL and format
const debugImageDownload = async (imageUrl) => {
  console.log('Downloading:', imageUrl);
  const result = await downloadImageForSharing(imageUrl);
  console.log('Downloaded to:', result);
  return result;
};
```

#### 4. **Development vs Production**
```javascript
// Issue: Different Facebook App IDs for dev/prod
// Solution: Use environment-specific configuration
const FACEBOOK_APP_ID = __DEV__ 
  ? process.env.EXPO_PUBLIC_FACEBOOK_APP_ID_DEV
  : process.env.EXPO_PUBLIC_FACEBOOK_APP_ID_PROD;
```

---

## 📊 Analytics Integration

### Track Sharing Events
```typescript
// Track sharing attempts
analytics.track('story_share_attempted', {
  content_type: 'quiz_completion',
  quiz_id: quiz.id,
  user_score: score,
  platforms_available: ['instagram', 'facebook']
});

// Track successful shares
analytics.track('story_share_success', {
  content_type: 'quiz_completion',
  platform: 'instagram', // or 'facebook', 'fallback'
  quiz_id: quiz.id,
  user_score: score
});

// Track civic engagement via sharing
analytics.track('civic_content_shared', {
  topic: quiz.category,
  learning_outcome: 'constitutional_rights',
  social_platform: 'instagram_stories'
});
```

---

## 🔐 Security Considerations

### Data Privacy
- **Image URLs**: Generated images are temporary and auto-deleted
- **User Data**: No personal information sent to Facebook/Instagram
- **App ID**: Public identifier, safe to include in client code
- **Content URLs**: Only point to public CivicSense content

### Content Guidelines
- **Educational Content**: All shared content promotes civic education
- **Non-partisan**: Content maintains political neutrality
- **Fact-based**: All shared information is verified and sourced

---

## 🚀 Testing

### Manual Testing Checklist
- [ ] **Facebook App ID configured** in environment
- [ ] **Instagram app installed** on test device
- [ ] **Facebook app installed** on test device
- [ ] **Image generation working** with API
- [ ] **Platform detection working** correctly
- [ ] **Share flow completes** successfully
- [ ] **Fallback sharing works** when apps not installed
- [ ] **Error handling displays** helpful messages

### Automated Testing
```javascript
// Test Facebook SDK integration
describe('Facebook SDK Integration', () => {
  it('should detect Instagram availability', async () => {
    const available = await isInstagramAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should generate valid sharing URLs', () => {
    const options = {
      backgroundAsset: { type: 'background', uri: 'file://test.jpg' },
      contentUrl: 'https://civicsense.com',
      appId: 'test123'
    };
    
    const url = generateInstagramShareURL(options);
    expect(url).toContain('instagram-stories://share');
    expect(url).toContain('source_application=test123');
  });
});
```

---

## 🔄 Next Steps

### Future Enhancements
1. **Video Story Support**: Add support for video background assets
2. **Custom Stickers**: Create CivicSense-branded sticker assets
3. **Template Library**: Expand image generation templates
4. **Analytics Dashboard**: Track sharing impact on civic engagement
5. **A/B Testing**: Test different sharing CTAs and designs

### Content Expansion
1. **Topic-specific Images**: Custom designs for different civic topics
2. **Achievement Badges**: Visual achievements for sharing milestones
3. **Progress Visualizations**: Charts and graphs for learning progress
4. **Quote Cards**: Shareable civic education quotes and facts

---

## 🔄 Instagram Login Integration

### Instagram Business Login Implementation

In addition to Facebook SDK for story sharing, we've implemented **Instagram Business Login** using the [Instagram Platform API](https://developers.facebook.com/docs/instagram-platform/overview) for direct Instagram authentication.

#### **Instagram Authentication Service** (`mobile/lib/instagram-auth.ts`)
- **Business Login for Instagram** using Instagram credentials (not Facebook)
- **Instagram User access tokens** for Instagram-specific API calls
- **Long-lived token management** (60-day validity with refresh)
- **Business/Creator account validation** required for API access
- **Instagram Insights integration** for civic engagement analytics
- **Secure token storage** with expo-secure-store

#### **Instagram Login Component** (`mobile/components/auth/InstagramLoginButton.tsx`)
- **Ready-to-use React component** with Instagram branding
- **useInstagramAuth hook** for authentication state management
- **Accessibility compliant** with proper ARIA labels
- **Error handling** with user-friendly messages
- **Loading states** and disabled state support

#### **Instagram Platform Permissions**
```typescript
// Required permissions for CivicSense
const INSTAGRAM_SCOPES = [
  'instagram_basic',           // Basic profile info
  'instagram_content_publish', // Publishing content for sharing
  'instagram_manage_insights', // Analytics for civic engagement
];
```

#### **Authentication Flow**
```typescript
// Instagram Login Implementation Example
import { InstagramLoginButton, useInstagramAuth } from '../components/auth/InstagramLoginButton';

function AuthScreen() {
  const { isAuthenticated, user, validateBusinessAccount } = useInstagramAuth();

  const handleInstagramSuccess = async (user: any, accessToken: string) => {
    console.log('Instagram login successful:', user);
    
    // Validate business account for full features
    const validation = await validateBusinessAccount();
    if (!validation.isValid) {
      console.warn('Account validation issues:', validation.issues);
    }
  };

  return (
    <InstagramLoginButton
      onSuccess={handleInstagramSuccess}
      onError={(error) => console.error('Instagram login failed:', error)}
      disabled={isAuthenticated}
    />
  );
}
```

---

## 🔧 **Complete Environment Setup**

### **Required Environment Variables**
```bash
# .env file - Add these for Instagram Login
EXPO_PUBLIC_INSTAGRAM_APP_ID=your_instagram_app_id_here
EXPO_PUBLIC_INSTAGRAM_APP_SECRET=your_instagram_app_secret_here

# For Facebook Story sharing (already configured)
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here
```

### **Instagram App Dashboard Setup**
1. **Create Instagram App** in [Meta App Dashboard](https://developers.facebook.com/apps/)
2. **Add Instagram Product** → "Instagram API setup with Instagram login"
3. **Configure Business Login for Instagram**:
   - Valid OAuth Redirect URIs: `civicsense://auth/instagram`
   - Deauthorize Callback URL: `https://civicsense.com/auth/instagram/deauthorize`
   - App Domains: `civicsense.com`
4. **Request Permissions**:
   - `instagram_basic` (Standard Access)
   - `instagram_content_publish` (Advanced Access required)
   - `instagram_manage_insights` (Advanced Access required)

### **App Review Requirements**
For production use, you'll need **Advanced Access** from Meta:
- **App Review submission** required for `instagram_content_publish` and `instagram_manage_insights`
- **Business Verification** may be required
- **Use case documentation** explaining civic education purpose

---

## 📱 **Integration Examples**

### **Combined Authentication Screen**
```typescript
// Example: Auth screen with both Google and Instagram login
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { InstagramLoginButton } from '../components/auth/InstagramLoginButton';

export function AuthOptionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Accounts</Text>
      <Text style={styles.subtitle}>
        Link your social accounts to share civic content and track engagement
      </Text>
      
      {/* Google Login for general authentication */}
      <GoogleSignInButton
        onSuccess={(user) => console.log('Google user:', user)}
        style={styles.authButton}
      />
      
      {/* Instagram Login for content sharing */}
      <InstagramLoginButton
        onSuccess={(user, token) => console.log('Instagram connected:', user)}
        style={styles.authButton}
      />
      
      <Text style={styles.note}>
        Instagram Business/Creator account required for full features
      </Text>
    </View>
  );
}
```

### **Civic Content Sharing with Instagram**
```typescript
// Example: Share civic quiz results to Instagram Story
import { InstagramStoryShareV2 } from '../components/ui/InstagramStoryShareV2';
import { useInstagramAuth } from '../components/auth/InstagramLoginButton';

export function QuizResultsScreen({ topic, userProgress }: Props) {
  const { isAuthenticated, user } = useInstagramAuth();

  return (
    <View>
      {/* Quiz results content */}
      
      {isAuthenticated && user?.account_type === 'BUSINESS' && (
        <InstagramStoryShareV2
          type="completion"
          topic={topic}
          userProgress={userProgress}
          userName={user.username}
        />
      )}
    </View>
  );
}
```

---

## 🎯 **Civic Engagement Features**

### **Instagram Insights for Democracy**
The Instagram integration enables unique civic engagement tracking:

```typescript
// Track civic content performance
const insights = await InstagramAuthService.getInsights(mediaId);
const civicMetrics = {
  democratic_reach: insights.reach,
  civic_engagement: insights.engagement,
  political_impressions: insights.impressions,
  activism_conversion: calculateCivicConversion(insights)
};
```

### **Business Account Validation**
```typescript
// Ensure proper account type for civic outreach
const validation = await InstagramAuthService.validateBusinessAccount();
if (validation.isValid) {
  // Full civic engagement features available
  enableAdvancedSharing();
  enableInsightsTracking();
} else {
  // Guide user to upgrade account
  showBusinessAccountPrompt(validation.issues);
}
```

---

## 🚀 **Future Enhancements**

### **Planned Instagram Features**
- **Instagram Reels sharing** for civic education videos
- **IGTV content publishing** for long-form civic discussions  
- **Instagram Shopping** integration for civic merchandise
- **Instagram Live integration** for town halls and civic events
- **Hashtag tracking** for civic movements and campaigns

### **Advanced Analytics**
- **Civic engagement scoring** based on Instagram interactions
- **Democratic participation correlation** with social media activity
- **Community building metrics** for local civic groups
- **Political awareness tracking** through content engagement

---

## ⚠️ **Important Notes**

### **Instagram Business Requirements**
- **Business or Creator account** required for Instagram Platform API
- **Facebook Page connection** NOT required (unlike Facebook Login approach)
- **Standard Access** sufficient for basic features during development
- **Advanced Access** required for production content publishing

### **Rate Limits**
- **Instagram Business Use Case** rate limiting applies
- **4800 calls per 24 hours** × number of impressions
- **Messaging endpoints** have separate rate limits

### **Compliance**
- **Instagram Platform Terms** must be followed
- **Content guidelines** for civic/political content
- **User privacy** and data handling requirements
- **Automated experience disclosure** for political content

**This implementation provides a complete, production-ready solution for Instagram and Facebook Story sharing that follows Facebook's official guidelines and enhances CivicSense's social sharing capabilities.** 