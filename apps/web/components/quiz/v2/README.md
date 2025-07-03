# Quiz Engine V2

A simplified, high-performance quiz system with three core game modes and customizable settings.

## Architecture Overview

The V2 system features a clean architecture with:
- **3 Core Game Modes**: Standard, AI Battle, and PVP
- **Customizable Settings**: Each mode can be configured to create different experiences
- **Multi-Topic Support**: Mix questions from multiple topics (coming soon)
- **Simple Integration**: No complex plugin system or circular dependencies

## Game Modes

### 1. Standard Mode (Solo Play)
The fully customizable single-player experience that replaces multiple separate modes.

**Default Settings:**
```typescript
{
  timeLimit: null,              // No time pressure
  totalTimeLimit: null,         // No overall time limit
  allowHints: false,            // No hints
  allowSkip: false,             // Can't skip questions
  allowReview: true,            // Can review at end
  showExplanations: true,       // See explanations after
  instantFeedback: false,       // Wait until end for feedback
  scoringMode: 'standard',      // Regular scoring
  streakBonus: true,            // Bonus for consecutive correct
  questionCount: undefined,     // All questions
  shuffleQuestions: false,      // Original order
  difficulty: 'mixed',          // All difficulties
  topics: [],                   // Single topic default
  mixTopics: false              // Don't mix topics
}
```

**Preset Configurations:**
- **Classic**: Standard quiz experience
- **Timed Challenge**: 30 seconds per question with speed bonus
- **Practice**: Hints, skips, and instant feedback for learning
- **Survival**: One wrong answer ends the quiz
- **Speed Run**: 15 seconds per question, 5 minute total limit

### 2. AI Battle Mode
Challenge AI opponents with unique personalities.

**Available NPCs:**
- **The Civic Sage**: Wise and methodical
- **Democracy Defender**: Energetic and competitive
- **Political Pundit**: Sarcastic and quick
- **History Hawk**: Academic and precise

**Settings:**
```typescript
{
  npcId: 'civic-sage',         // Which opponent
  npcDifficulty: 'medium',     // easy/medium/hard/adaptive
  timeLimit: 30,               // Seconds per question
  powerupsEnabled: true,       // Use special abilities
  topics: []                   // Topics to play
}
```

### 3. PVP Mode (Multiplayer)
Real-time competitive play with other users.

**Settings:**
```typescript
{
  roomSize: 4,                 // 2-8 players
  timeLimit: 30,               // Seconds per question
  chatEnabled: true,           // In-game chat
  spectatorMode: false,        // Allow spectators
  topics: [],                  // Topics to play
  isPrivate: false,            // Private room
  roomCode?: string            // For private rooms
}
```

## Usage

### Basic Implementation
```typescript
import { QuizEngineV2 } from '@/components/quiz/v2/engine/quiz-engine-v2'
import type { StandardModeSettings } from '@/components/quiz/v2/modes'

// Standard mode with default settings
<QuizEngineV2
  topicId="constitution"
  questions={questions}
  mode="standard"
  onComplete={handleComplete}
/>

// Timed challenge configuration
const timedSettings: StandardModeSettings = {
  ...standardMode.defaultSettings,
  timeLimit: 30,
  scoringMode: 'speed-bonus'
}

<QuizEngineV2
  topicId="constitution"
  questions={questions}
  mode="standard"
  settings={timedSettings}
  onComplete={handleComplete}
/>

// AI Battle mode
<QuizEngineV2
  topicId="constitution"
  questions={questions}
  mode="ai-battle"
  settings={{
    npcId: 'political-pundit',
    npcDifficulty: 'hard',
    timeLimit: 20,
    powerupsEnabled: false,
    topics: ['constitution']
  }}
  onComplete={handleComplete}
/>
```

### Multi-Topic Support (Coming Soon)
```typescript
// Mix questions from multiple topics
<QuizEngineV2
  topics={['constitution', 'civil-rights', 'voting']}
  allQuestions={{
    'constitution': constitutionQuestions,
    'civil-rights': civilRightsQuestions,
    'voting': votingQuestions
  }}
  mode="standard"
  settings={{
    ...standardMode.defaultSettings,
    mixTopics: true,
    questionCount: 20
  }}
  onComplete={handleComplete}
/>
```

## Creating Custom Experiences

You can create any quiz experience by customizing Standard mode:

### Practice Mode Experience
```typescript
const practiceSettings: StandardModeSettings = {
  timeLimit: null,
  allowHints: true,
  allowSkip: true,
  allowReview: true,
  showExplanations: true,
  instantFeedback: true,
  scoringMode: 'standard',
  streakBonus: false
}
```

### Speed Quiz Experience
```typescript
const speedSettings: StandardModeSettings = {
  timeLimit: 15,
  totalTimeLimit: 300,
  allowHints: false,
  allowSkip: false,
  showExplanations: false,
  instantFeedback: false,
  scoringMode: 'speed-bonus',
  streakBonus: true
}
```

### Survival Challenge
```typescript
const survivalSettings: StandardModeSettings = {
  timeLimit: 45,
  scoringMode: 'survival',
  allowSkip: false,
  allowReview: false,
  instantFeedback: true
}
```

## Progress Tracking

The engine automatically saves progress for all modes:
- Question answers
- Time spent
- Current position
- Streak information

Progress is restored if the user navigates away and returns.

## Customization Hooks

Each mode provides hooks for custom behavior:
- `onModeStart`: Called when quiz begins
- `onQuestionStart`: Called for each new question
- `onAnswerSubmit`: Called when answer is submitted
- `onQuizComplete`: Called when quiz ends

## Migration from V1

If you're using V1 modes, here's how to migrate:

| V1 Mode | V2 Configuration |
|---------|------------------|
| `timed` | Standard mode with `timeLimit: 30` |
| `practice` | Standard mode with `allowHints: true, allowSkip: true` |
| `speed` | Standard mode with `timeLimit: 15, scoringMode: 'speed-bonus'` |
| `classic` | Standard mode with default settings |

## Future Enhancements

- **Multi-topic sessions**: Mix questions from multiple topics
- **Advanced AI opponents**: More sophisticated NPC behaviors
- **Team PVP**: Team-based multiplayer modes
- **Custom scoring**: Define your own scoring algorithms
- **Achievement system**: Unlock rewards and badges

## Performance

V2 improvements:
- No circular dependencies
- Simplified state management
- Efficient re-renders
- Smaller bundle size
- Better TypeScript inference