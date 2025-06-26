# CivicSense Feature Flag Gates for Statsig
# Use these with the Statsig MCP integration in Cursor

## Navigation Features

### civicsense_globalSearch
**Description**: Enable global search functionality across CivicSense
**Civic Context**: Helps users find civic content quickly
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_globalSearch" with description "Enable global search functionality across CivicSense". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_userMenu
**Description**: Show user menu in header navigation
**Civic Context**: Access to profile and account settings
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_userMenu" with description "Show user menu in header navigation". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_civicsTestMenuItem
**Description**: Show civics test menu item
**Civic Context**: Access to comprehensive civics assessment
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_civicsTestMenuItem" with description "Show civics test menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_quizMenuItem
**Description**: Show quiz menu item
**Civic Context**: Access to civic education quizzes
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_quizMenuItem" with description "Show quiz menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_scenariosMenuItem
**Description**: Show scenarios menu item
**Civic Context**: Access to real-world civic scenarios
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_scenariosMenuItem" with description "Show scenarios menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_progressMenuItem
**Description**: Show progress tracking menu item
**Civic Context**: View learning progress and achievements
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_progressMenuItem" with description "Show progress tracking menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_learningPodsMenuItem
**Description**: Show learning pods menu item
**Civic Context**: Access to collaborative learning groups
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_learningPodsMenuItem" with description "Show learning pods menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_dashboardMenuItem
**Description**: Show dashboard menu item
**Civic Context**: Access to personalized civic dashboard
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_dashboardMenuItem" with description "Show dashboard menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_settingsMenuItem
**Description**: Show settings menu item
**Civic Context**: Access to account and preference settings
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_settingsMenuItem" with description "Show settings menu item". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_adminMenuItem
**Description**: Show admin menu item (admin users only)
**Civic Context**: Access to platform administration
**Default Value**: false
**Category**: navigation

```
Create a feature gate named "civicsense_adminMenuItem" with description "Show admin menu item (admin users only)". Set the default value to false. Add tags: civicsense, navigation, civic-education.
```

### civicsense_themeToggleMenuItem
**Description**: Show theme toggle in menu
**Civic Context**: Allow users to switch between light/dark themes
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_themeToggleMenuItem" with description "Show theme toggle in menu". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

### civicsense_mobileMenu
**Description**: Enable mobile navigation menu
**Civic Context**: Responsive navigation for mobile users
**Default Value**: true
**Category**: navigation

```
Create a feature gate named "civicsense_mobileMenu" with description "Enable mobile navigation menu". Set the default value to true. Add tags: civicsense, navigation, civic-education.
```

## Premium Features

### civicsense_customDecks
**Description**: Enable custom quiz deck creation
**Civic Context**: Create personalized civic learning content
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_customDecks" with description "Enable custom quiz deck creation". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_historicalProgress
**Description**: Enable historical progress tracking
**Civic Context**: View long-term civic learning trends
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_historicalProgress" with description "Enable historical progress tracking". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_advancedAnalytics
**Description**: Enable advanced learning analytics
**Civic Context**: Detailed insights into civic knowledge growth
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_advancedAnalytics" with description "Enable advanced learning analytics". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_spacedRepetition
**Description**: Enable spaced repetition learning system
**Civic Context**: Optimized learning for retention
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_spacedRepetition" with description "Enable spaced repetition learning system". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_learningInsights
**Description**: Enable personalized learning insights
**Civic Context**: AI-powered civic education recommendations
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_learningInsights" with description "Enable personalized learning insights". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_prioritySupport
**Description**: Enable priority customer support
**Civic Context**: Faster response for civic education questions
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_prioritySupport" with description "Enable priority customer support". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_offlineMode
**Description**: Enable offline content access
**Civic Context**: Learn about civics without internet connection
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_offlineMode" with description "Enable offline content access". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_dataExport
**Description**: Enable personal data export
**Civic Context**: Export civic learning progress and data
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_dataExport" with description "Enable personal data export". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_premiumBadges
**Description**: Show premium achievement badges
**Civic Context**: Recognition for advanced civic engagement
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_premiumBadges" with description "Show premium achievement badges". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_upgradePrompts
**Description**: Show upgrade prompts to free users
**Civic Context**: Encourage investment in civic education
**Default Value**: true
**Category**: premium

```
Create a feature gate named "civicsense_upgradePrompts" with description "Show upgrade prompts to free users". Set the default value to true. Add tags: civicsense, premium, civic-education.
```

### civicsense_premiumOnboarding
**Description**: Enable premium user onboarding flow
**Civic Context**: Enhanced setup for paying subscribers
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_premiumOnboarding" with description "Enable premium user onboarding flow". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

### civicsense_billingManagement
**Description**: Enable billing and subscription management
**Civic Context**: Manage payments for civic education
**Default Value**: false
**Category**: premium

```
Create a feature gate named "civicsense_billingManagement" with description "Enable billing and subscription management". Set the default value to false. Add tags: civicsense, premium, civic-education.
```

## Core Features

### civicsense_multiplayer
**Description**: Enable multiplayer civic quizzes and competitions
**Civic Context**: Collaborative civic learning experiences
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_multiplayer" with description "Enable multiplayer civic quizzes and competitions". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_learningPods
**Description**: Enable learning pods (group study features)
**Civic Context**: Community-based civic education
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_learningPods" with description "Enable learning pods (group study features)". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_scenarios
**Description**: Enable real-world civic scenarios
**Civic Context**: Practice civic engagement with realistic situations
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_scenarios" with description "Enable real-world civic scenarios". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_civicsTest
**Description**: Enable comprehensive civics assessment
**Civic Context**: Measure and improve civic knowledge
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_civicsTest" with description "Enable comprehensive civics assessment". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_quizzes
**Description**: Enable civic education quizzes
**Civic Context**: Interactive learning about government and democracy
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_quizzes" with description "Enable civic education quizzes". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_surveys
**Description**: Enable user surveys and feedback collection
**Civic Context**: Gather insights to improve civic education
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_surveys" with description "Enable user surveys and feedback collection". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_adminAccess
**Description**: Enable admin panel access (admin users only)
**Civic Context**: Platform administration and content management
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_adminAccess" with description "Enable admin panel access (admin users only)". Set the default value to false. Add tags: civicsense, core, civic-education.
```

### civicsense_debugRoutes
**Description**: Enable debug and development routes
**Civic Context**: Development tools and testing interfaces
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_debugRoutes" with description "Enable debug and development routes". Set the default value to false. Add tags: civicsense, core, civic-education.
```

### civicsense_debugPanels
**Description**: Enable debug panels and developer tools
**Civic Context**: Advanced debugging for development team
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_debugPanels" with description "Enable debug panels and developer tools". Set the default value to false. Add tags: civicsense, core, civic-education.
```

### civicsense_signUpFlow
**Description**: Enable user registration and sign-up
**Civic Context**: Allow new users to join civic education platform
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_signUpFlow" with description "Enable user registration and sign-up". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_socialLogin
**Description**: Enable social media login (Google, etc.)
**Civic Context**: Simplified login for civic education access
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_socialLogin" with description "Enable social media login (Google, etc.)". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_guestAccess
**Description**: Enable guest/anonymous user access
**Civic Context**: Try civic content without account creation
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_guestAccess" with description "Enable guest/anonymous user access". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_notifications
**Description**: Enable push notifications and alerts
**Civic Context**: Keep users engaged with civic learning reminders
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_notifications" with description "Enable push notifications and alerts". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_emailMarketing
**Description**: Enable email marketing and newsletters
**Civic Context**: Share civic education updates and content
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_emailMarketing" with description "Enable email marketing and newsletters". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_chatSupport
**Description**: Enable live chat customer support
**Civic Context**: Real-time help with civic education questions
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_chatSupport" with description "Enable live chat customer support". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_analyticsTracking
**Description**: Enable user analytics and tracking
**Civic Context**: Understand how users engage with civic content
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_analyticsTracking" with description "Enable user analytics and tracking". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_errorReporting
**Description**: Enable automatic error reporting
**Civic Context**: Monitor and fix civic education platform issues
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_errorReporting" with description "Enable automatic error reporting". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_performanceMonitoring
**Description**: Enable performance monitoring
**Civic Context**: Ensure fast, reliable civic education experience
**Default Value**: true
**Category**: core

```
Create a feature gate named "civicsense_performanceMonitoring" with description "Enable performance monitoring". Set the default value to true. Add tags: civicsense, core, civic-education.
```

### civicsense_experimentalFeatures
**Description**: Enable experimental civic education features
**Civic Context**: Beta test new ways to learn about democracy
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_experimentalFeatures" with description "Enable experimental civic education features". Set the default value to false. Add tags: civicsense, core, civic-education.
```

### civicsense_betaFeatures
**Description**: Enable beta features for testing
**Civic Context**: Preview upcoming civic education improvements
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_betaFeatures" with description "Enable beta features for testing". Set the default value to false. Add tags: civicsense, core, civic-education.
```

### civicsense_alphaFeatures
**Description**: Enable alpha features (very early testing)
**Civic Context**: Cutting-edge civic education experiments
**Default Value**: false
**Category**: core

```
Create a feature gate named "civicsense_alphaFeatures" with description "Enable alpha features (very early testing)". Set the default value to false. Add tags: civicsense, core, civic-education.
```

