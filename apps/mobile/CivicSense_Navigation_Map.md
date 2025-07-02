# 📱 CivicSense Mobile App - Navigation Flow Map

## 🚀 App Launch Flow

```
App Launch
    ↓
Root Layout (_layout.tsx)
    ↓
Auth Check
    ↓
┌─────────────────┬─────────────────┐
│   Not Logged In │    Logged In    │
│        ↓        │        ↓        │
│  Onboarding     │   Main App      │
└─────────────────┴─────────────────┘
```

---

## 🎯 Onboarding Flow

```
(onboarding)/index.tsx
    ↓
onboarding/welcome.tsx
    ↓
onboarding/interests.tsx
    ↓
onboarding/complete.tsx
    ↓
Main App (tabs)
```

---

## 🔐 Authentication Flow

```
auth/login.tsx ←→ auth/signup.tsx
    ↓                   ↓
    └─── Success ───────┘
            ↓
    Main App (tabs)

auth/forgot-password.tsx
    ↓
auth/reset-password.tsx
    ↓
auth/login.tsx
```

---

## 🏠 Main App Navigation (Tab Structure)

```
                    Main App
                        ↓
    ┌─────────────┬─────────────┬─────────────┬─────────────┐
    │    Home     │    Quiz     │    Saved    │   Profile   │
    │  (index)    │             │             │             │
    └─────────────┴─────────────┴─────────────┴─────────────┘
         ↓               ↓               ↓               ↓
    [See Home Flow] [See Quiz Flow] [See Saved Flow] [See Profile Flow]
```

---

## 🏠 Home Screen Flow

```
(tabs)/index.tsx (Home)
    ↓
Daily Stack Topics (Featured/Regular)
    ↓
┌─────────────────┬─────────────────┐
│   "Play Quiz"   │  "Read More"    │
│       ↓         │       ↓         │
│ quiz-session/   │   topic/[id]    │
│    [id]/        │ (Topic Info +   │
│ (Direct Quiz)   │   Sharing)      │
│                 │       ↓         │
│                 │ "Start Quiz"    │
│                 │       ↓         │
│                 │ quiz-session/   │
│                 │    [id]/        │
└─────────────────┴─────────────────┘
```

---

## 🎯 Quiz Hub Flow

```
(tabs)/quiz.tsx (Quiz Hub)
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Practice  │    Daily    │ Rapid Fire  │  Challenge  │
│      ↓      │      ↓      │      ↓      │      ↓      │
│ Topic List  │ Daily Quiz  │ Rapid Quiz  │ Hard Quiz   │
│      ↓      │      ↓      │      ↓      │      ↓      │
│Quiz Session │Quiz Session │Quiz Session │Quiz Session │
└─────────────┴─────────────┴─────────────┴─────────────┘
    ↓
┌─────────────┬─────────────┬─────────────┐
│ NPC Battle  │ Multiplayer │ Civics Test │
│      ↓      │      ↓      │      ↓      │
│ NPC Select  │ Room Setup  │ Assessment  │
│      ↓      │      ↓      │      ↓      │
│Quiz Session │   Lobby     │Quiz Session │
└─────────────┴─────────────┴─────────────┘
```

---

## 🎮 Quiz Session Flow (Universal)

```
Quiz Mode Selection
    ↓
quiz-session/[id]/_layout.tsx (Game Engine)
    ↓
quiz-session/[id]/index.tsx (Quiz Interface)
    ↓
Question 1 → Question 2 → ... → Question N
    ↓
quiz-session/[id]/summary.tsx (Results)
    ↓
┌─────────────┬─────────────┬─────────────┐
│  Retake     │   Share     │ Continue    │
│      ↓      │      ↓      │   Learning  │
│Same Quiz    │ Share API   │      ↓      │
│             │             │  Back to    │
│             │             │   Tabs      │
└─────────────┴─────────────┴─────────────┘
```

---

## 🤖 NPC Battle Flow

```
quiz/ai-battle.tsx
    ↓
Select NPC Opponent
    ↓
Select Category
    ↓
Select Topic
    ↓
Configure Battle Settings
    ↓
quiz-session/[id]/_layout.tsx (NPC Battle Mode)
    ↓
Battle Interface (Player vs NPC)
    ↓
Battle Results
```

---

## 👥 Multiplayer Flow

```
quiz/pvp.tsx OR quiz/create-room.tsx
    ↓
Create Room
    ↓
multiplayer/room/[code].tsx (Room Lobby)
    ↓
Wait for Players
    ↓
quiz-session/[id]/_layout.tsx (Multiplayer Mode)
    ↓
Live Quiz Battle
    ↓
Multiplayer Results
```

---

## 💾 Saved Content Flow

```
(tabs)/saved.tsx
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Bookmarks   │ In Progress │  Completed  │
│      ↓      │      ↓      │      ↓      │
│ Topic View  │Resume Quiz  │View Results │
│      ↓      │      ↓      │      ↓      │
│Quiz Session │Quiz Session │Stats/Review │
└─────────────┴─────────────┴─────────────┘
```

---

## 👤 Profile Flow

```
(tabs)/profile.tsx
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Stats     │Achievements │ Leaderboard │  Settings   │
│      ↓      │      ↓      │      ↓      │      ↓      │
│stats/index  │achievements │leaderboard  │settings/    │
│             │   /index    │   /index    │   index     │
└─────────────┴─────────────┴─────────────┴─────────────┘
                                              ↓
                                    ┌─────────────┬─────────────┐
                                    │Edit Profile │   Privacy   │
                                    │      ↓      │      ↓      │
                                    │ settings/   │ settings/   │
                                    │edit-profile │  privacy    │
                                    └─────────────┴─────────────┘
```

---

## ⚙️ Settings Flow

```
settings/index.tsx
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│Edit Profile │   Privacy   │    Help     │  Feedback   │
│      ↓      │      ↓      │      ↓      │      ↓      │
│ settings/   │ settings/   │ support/    │ support/    │
│edit-profile │  privacy    │    help     │  feedback   │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 📊 Assessment Flow

```
civics-test/index.tsx
    ↓
Assessment Setup
    ↓
assessment-session/[id]/_layout.tsx
    ↓
Assessment Questions
    ↓
assessment-results.tsx
    ↓
Detailed Analysis & Recommendations
```

---

## 🎯 Topic/Category Flow

```
Topic Discovery
    ↓
category/[id].tsx (Category View)
    ↓
Topic List
    ↓
┌─────────────────┬─────────────────┐
│   "Play Quiz"   │  "Read More"    │
│       ↓         │       ↓         │
│ quiz-session/   │   topic/[id]    │
│    [id]/        │  (Topic Info    │
│ (Direct to      │  with Sharing)  │
│  Quiz Engine)   │       ↓         │
└─────────────────│  "Start Quiz"   │
                  │       ↓         │
                  │ quiz-session/   │
                  │    [id]/        │
                  └─────────────────┘
```

---

## 📅 Daily Challenges Flow

```
daily-challenges.tsx
    ↓
Calendar View
    ↓
Select Date
    ↓
Daily Challenge Questions
    ↓
quiz-session/[id]/ (Daily Mode)
    ↓
Progress Tracking
```

---

## 🔄 Common Exit Points

### From Any Quiz:
```
Any Quiz Session
    ↓
┌─────────────┬─────────────┬─────────────┐
│   Back to   │   Share     │   Retry     │
│    Tabs     │  Results    │    Quiz     │
│      ↓      │      ↓      │      ↓      │
│ (tabs)/     │ Social      │Same Session │
│   index     │   Share     │             │
└─────────────┴─────────────┴─────────────┘
```

### Deep Linking:
```
External Link/Notification
    ↓
Direct to Specific Screen
    ↓
Normal Navigation Flow
```

---

## 🏗️ Technical Architecture Notes

### Route Patterns:
- **Static Routes:** `/auth/login`, `/settings/privacy`
- **Dynamic Routes:** `/quiz-session/[id]`, `/topic/[id]`
- **Route Groups:** `(tabs)/`, `(onboarding)/`
- **Nested Layouts:** `_layout.tsx` files provide shared layouts

### Navigation Features:
- **Deep Linking:** Direct access to any screen
- **Tab Persistence:** Tab state maintained across navigation
- **Modal Routes:** Some screens can overlay others
- **Back Navigation:** Consistent back button behavior
- **Progress Saving:** Quiz progress preserved across sessions

### Universal Game Engine:
- **Single Entry Point:** `quiz-session/[id]/_layout.tsx`
- **Multiple Modes:** Practice, Daily, NPC Battle, Multiplayer, Assessment
- **Real-time Features:** Live multiplayer, NPC chat, progress sync
- **Offline Support:** Content caching, progress persistence