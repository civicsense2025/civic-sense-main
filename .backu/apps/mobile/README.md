# 🏛️ CivicSense Mobile App

> **Bold. Beautiful. Educational.** A stunning mobile app for civic education with modern design, advanced theming, and engaging multiplayer features.

## ✨ Features

### 🎨 **Advanced Theming System**
- **WCAG 2.2 AA Compliant** color system
- **Dynamic theme switching** (Light/Dark/System)
- **Persistent theme preferences** with AsyncStorage
- **Modern design tokens** with consistent spacing, typography, and shadows
- **Platform-specific optimizations** for iOS and Android

### 🎯 **Core Learning Features**
- **Interactive Quiz Engine** with explanations and scoring
- **Category-based Learning** with progress tracking
- **Study Guides** with detailed civic content
- **Difficulty Levels** (Beginner, Intermediate, Advanced)
- **Progress Statistics** and achievement tracking

### 🎮 **Multiplayer System**
- **Real-time Multiplayer Lobby** with room management
- **Room Creation & Joining** with 6-digit codes
- **Live Room Status** (Waiting, Starting, In Progress)
- **Player Management** with host controls
- **Category Selection** for themed quiz battles

### ⚙️ **Settings & Customization**
- **Comprehensive Settings Menu** with organized sections
- **Theme Toggle** with visual previews
- **Notification Controls** (Push, Sound, Haptics)
- **Account Management** (Progress, Export, Reset)
- **Privacy & Legal** links

### 🎭 **UI/UX Excellence**
- **Animated Components** with spring physics
- **Card-based Design** with multiple variants
- **Smooth Transitions** between screens
- **Touch Feedback** with haptic responses
- **Accessibility Support** with keyboard navigation

## 🏗️ Architecture

### **Theme System**
```typescript
// Comprehensive theme with light/dark modes
export const lightTheme = {
  primary: '#3B82F6',      // Authority Blue
  secondary: '#10B981',    // Empowerment Green
  accent: '#F59E0B',       // Insight Gold
  // ... 30+ semantic color tokens
}

// Advanced typography scale
export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  // ... 10 typography sizes
}
```

### **Component Library**
- **Themed Components** that adapt to light/dark modes
- **Reusable Cards** with elevation, outlines, and multiplayer variants
- **Enhanced Buttons** with multiple sizes and variants
- **Form Controls** with proper theming and validation

### **Screen Architecture**
```
app/
├── _layout.tsx          # Root layout with theme provider
├── index.tsx            # Modern dashboard with stats
├── categories.tsx       # Learning categories with filtering
├── quiz.tsx             # Interactive quiz engine
├── learn.tsx            # Study guide content
├── multiplayer.tsx      # Multiplayer lobby & room management
└── settings.tsx         # Comprehensive settings menu
```

## 🎨 Design System

### **Color Palette**
- **Primary**: `#3B82F6` (Authority Blue) - CivicSense brand color
- **Secondary**: `#10B981` (Empowerment Green) - Success and progress
- **Accent**: `#F59E0B` (Insight Gold) - Highlights and achievements
- **Semantic Colors**: Success, Error, Warning with proper contrast ratios

### **Typography Scale**
- **Display**: 60px/48px/36px for heroes and headers
- **Headings**: 30px/24px/20px for section titles
- **Body**: 18px/16px/14px for content and UI
- **Caption**: 12px for metadata and labels

### **Spacing System**
- **Consistent 4px grid** from 4px to 64px
- **Semantic spacing** (xs, sm, md, lg, xl, 2xl, etc.)
- **Apple-inspired spacing** for iOS feel

### **Component Variants**

#### Cards
- **Default**: Basic card with subtle shadow
- **Elevated**: Enhanced shadow for prominence
- **Outlined**: Border-based for light backgrounds
- **Multiplayer**: Specialized for game rooms

#### Buttons
- **Primary**: Solid background with brand color
- **Secondary**: Subtle background with secondary color
- **Outline**: Transparent with colored border
- **Sizes**: Small, Medium, Large with proper touch targets

## 📱 Screen Showcase

### 🏠 **Home Dashboard**
- **Welcome Header** with personalized greeting
- **Quick Stats** showing progress and achievements
- **Action Grid** with beautiful card-based navigation
- **Settings Access** via floating button

### 📚 **Categories Screen**
- **Filterable Categories** by difficulty level
- **Progress Indicators** with visual progress bars
- **Rich Category Cards** with icons, descriptions, and actions
- **Smooth Animations** between filter states

### ⚙️ **Settings Menu**
- **Theme Selector** with visual preview icons
- **Toggle Controls** for notifications and preferences
- **Organized Sections** (Appearance, Notifications, Account, About)
- **Proper Navigation** with back buttons and deep links

### 🎮 **Multiplayer Lobby**
- **Tab Navigation** between Join and Create modes
- **Room Code Input** with validation and formatting
- **Live Room List** with status indicators and player counts
- **Room Creation** with customizable settings

### 🧠 **Quiz Engine**
- **Question Display** with clear typography
- **Multiple Choice** with letter indicators (A, B, C, D)
- **Progress Tracking** with visual indicators
- **Explanation System** with detailed feedback

## 🛠️ Technical Implementation

### **Theme Management**
```typescript
// Context-based theme system
const { theme, themeMode, setThemeMode, isDark } = useTheme();

// Automatic persistence
await AsyncStorage.setItem('@civicsense_theme_mode', mode);

// System theme detection
const systemColorScheme = useColorScheme();
```

### **Component Theming**
```typescript
// Dynamic styling based on theme
style={[
  styles.card,
  {
    backgroundColor: theme.card,
    borderColor: theme.border,
    ...theme.shadow.md
  }
]}
```

### **Animation System**
```typescript
// Spring-based animations
Animated.spring(scaleValue, {
  toValue: 0.98,
  useNativeDriver: true,
  tension: 300,
  friction: 10,
}).start();
```

## 🎯 User Experience Features

### **Accessibility**
- **Keyboard Navigation** support for all interactive elements
- **Screen Reader** compatibility with proper semantic markup
- **High Contrast** support in dark mode
- **Touch Targets** meeting minimum 44pt iOS guidelines

### **Performance**
- **Optimized Animations** using native driver
- **Lazy Loading** for heavy components
- **Efficient Re-renders** with React.memo and proper state management
- **Smooth Scrolling** with optimized FlatLists

### **Responsive Design**
- **Safe Area** handling for modern devices
- **Flexible Layouts** that adapt to different screen sizes
- **Proper Typography** scaling for accessibility
- **Touch-friendly** interface with proper spacing

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## 📦 Dependencies

### **Core**
- `expo` - Development platform
- `react-native` - Mobile framework
- `expo-router` - File-based navigation

### **UI & Theming**
- `@react-native-async-storage/async-storage` - Theme persistence
- `react-native-safe-area-context` - Safe area handling

### **Future Integrations**
- `@supabase/supabase-js` - Backend integration
- `expo-secure-store` - Secure token storage
- `expo-local-authentication` - Biometric auth

## 🎨 Design Inspiration

This app draws inspiration from:
- **iOS Human Interface Guidelines** for native feel
- **Material Design 3** for Android consistency
- **Modern mobile apps** showcased on Mobbin
- **Accessibility best practices** from WCAG 2.2

## 🔮 Future Enhancements

- **Real-time Multiplayer** with WebSocket integration
- **Offline Mode** with local storage
- **Push Notifications** for reminders and challenges
- **Social Features** with friend systems
- **Advanced Analytics** with progress insights
- **Voice Commands** for accessibility

## Environment Variables

This project requires the following environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id
```

### Setting up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create OAuth 2.0 Client IDs for:
   - Web application (for web authentication)
   - iOS application (for iOS devices)
   - Android application (for Android devices)
5. Add the appropriate redirect URIs for each platform:
   - Web: `https://auth.expo.io/@your-username/your-app-slug`
   - iOS: Use the format `com.googleusercontent.apps.YOUR_CLIENT_ID:/oauth2redirect/google`
   - Android: Use the format `com.googleusercontent.apps.YOUR_CLIENT_ID:/oauth2redirect/google`
6. Copy the client IDs to your environment variables

---

**Built with ❤️ for civic education and democratic engagement.**

*CivicSense Mobile - Making civic knowledge accessible, engaging, and beautiful.* 