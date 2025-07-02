# 🎮 CivicSense Multiplayer Game Engine - Consolidated Architecture

## 📋 Table of Contents
1. [Engine Consolidation](#engine-consolidation)
2. [Quick Start Guide](#quick-start-guide)
3. [Database Integration](#database-integration)
4. [Architecture Overview](#architecture-overview)
5. [NPC System](#npc-system)
6. [Game Modes](#game-modes)
7. [Development Guidelines](#development-guidelines)

---

## ⚡ Engine Consolidation

**🎯 USE THESE FILES:**
- `universal-game-engine.ts` - **Main engine for ALL game modes**
- `npc-service.ts` - **Comprehensive NPC system with database integration**
- `useGameEngine.ts` - **React hooks for different game modes**

**⚠️ DEPRECATED/LEGACY FILES:**
- `comprehensive-game-engine.ts` - Consolidated into universal engine
- `npc-personality-engine.ts` - Replaced by npc-service.ts
- `mobile-multiplayer-engine.ts` - Merged into universal engine

**✅ SUPPORTING FILES (Still Active):**
- `game-state.ts` - Core game state management
- `live-leaderboard-manager.ts` - Real-time leaderboards
- `waiting-room-manager.ts` - Room management and matchmaking

---

## 🚀 Quick Start Guide

### Single Player Game
```typescript
import { useSinglePlayerGame } from '../hooks/useGameEngine';

function QuizScreen({ topicId }: { topicId: string }) {
  const { gameState, actions } = useSinglePlayerGame(topicId, {
    difficulty: 'medium',
    questionCount: 10,
    timePerQuestion: 30,
  });

  return (
    <div>
      {gameState.status === 'ready' && (
        <button onClick={actions.startGame}>Start Quiz</button>
      )}
      
      {gameState.currentQuestion && (
        <QuestionCard 
          question={gameState.currentQuestion}
          onAnswer={actions.submitAnswer}
        />
      )}
    </div>
  );
}
```

### Multiplayer Game with NPCs
```typescript
import { useMultiplayerGame } from '../hooks/useGameEngine';

function MultiplayerQuiz({ topicId, roomId }: { topicId: string; roomId: string }) {
  const { gameState, actions, getActiveNPCs } = useMultiplayerGame(topicId, roomId, {
    allowNPCs: true,
    maxNPCs: 2,
    difficulty: 'hard',
  }, {
    onNPCChat: (npcId, message) => {
      console.log(`NPC ${npcId}: ${message}`);
    },
  });

  const npcs = getActiveNPCs();

  return (
    <div>
      <div>NPCs in game: {npcs.length}</div>
      {/* Game UI */}
    </div>
  );
}
```

### Practice Mode
```typescript
import { usePracticeMode } from '../hooks/useGameEngine';

function PracticeScreen({ topicId }: { topicId: string }) {
  const { gameState, actions } = usePracticeMode(topicId, {
    difficulty: 'easy',
    questionCount: 5,
  });

  // Practice mode has unlimited time and allows skipping
  return (
    <div>
      <button onClick={actions.skipQuestion}>Skip Question</button>
      {/* Practice UI */}
    </div>
  );
}
```

---

## 🗄️ Database Integration

The system integrates with these database tables:

### Core Tables
- `questions` - Quiz questions and answers
- `user_progress` - User quiz results and progress
- `user_question_attempts` - Individual question attempts

### Multiplayer Tables
- `multiplayer_rooms` - Game rooms and settings
- `multiplayer_npc_players` - Active NPCs in games

### NPC System Tables
- `npc_personalities` - NPC character definitions
- `npc_category_specializations` - NPC topic expertise
- `npc_chat_templates` - Chat message templates
- `npc_conversation_history` - Chat history tracking
- `npc_learning_progression` - NPC learning and adaptation
- `npc_question_responses` - NPC answer tracking
- `npc_quiz_attempts` - NPC game participation
- `npc_vs_human_analytics` - Performance analytics

### Integration Example
```typescript
import { NPCService } from './npc-service';

const npcService = NPCService.getInstance();

// Get specialized NPC for constitutional law
const npc = await npcService.getRandomPersonality(
  'constitutional-law-topic-id',
  'constitutional-law-category-id'
);

// Generate contextual answer
const response = await npcService.generateAnswer(
  npc.id,
  questionId,
  question,
  topicId,
  categoryId
);

// Generate personality-appropriate chat
const chat = await npcService.generateChatMessage(
  npc.id,
  'correct_answer',
  { playerName: 'John' }
);
```

---

## 🏗️ Architecture Overview

```
UniversalGameEngine
├── Single Player Mode
│   ├── Question Loading
│   ├── Timer Management
│   ├── Progress Tracking
│   └── Results Calculation
│
├── Multiplayer Mode
│   ├── Real-time Synchronization
│   ├── NPC Integration
│   ├── Leaderboards
│   └── Room Management
│
└── Practice Mode
    ├── Unlimited Time
    ├── Skip Questions
    └── Immediate Feedback
```

### Key Features
- **Universal**: Handles all game modes with one engine
- **Database-First**: Full integration with all NPC tables
- **Real-time**: WebSocket support for multiplayer
- **Intelligent NPCs**: Learning, specialization, and personality
- **Type-Safe**: Full TypeScript support
- **Hook-Based**: React hooks for easy integration

---

## 🤖 NPC System

### Personality Types
- **Academic** (🎓) - High accuracy, scholarly responses
- **Civic** (🗳️) - Democracy-focused, encouraging
- **Competitive** (🏆) - Achievement-oriented, fast responses
- **Democratic** (🤝) - Collaborative, inclusive
- **Analytical** (📊) - Data-driven, evidence-based
- **Collaborative** (🤗) - Supportive, team-oriented

### NPC Features
- **Learning**: NPCs improve over time
- **Specialization**: Topic-specific expertise
- **Chat**: Contextual messages with personality
- **Adaptation**: Difficulty-based performance
- **Analytics**: Track NPC vs human performance

### NPC Configuration
```typescript
// Get NPC with specific traits
const npc = await npcService.getRandomPersonality(
  topicId,
  categoryId,
  excludeIds
);

// Add to multiplayer game
const npcPlayer = await npcService.addNPCToGame(
  roomId,
  npc.id,
  customName
);

// Generate dynamic responses
const response = await npcService.generateAnswer(
  npc.id,
  questionId,
  question,
  topicId,
  categoryId
);
```

---

## 🎯 Game Modes

### 1. Single Player
- Individual learning experience
- Progress tracking and achievements
- Immediate feedback and explanations
- Topic mastery calculation

### 2. Multiplayer with NPCs
- 2-6 players (including NPCs)
- Real-time competition
- Intelligent NPCs with personalities
- Live leaderboards and chat

### 3. Practice Mode
- Unlimited time per question
- Skip questions functionality
- Immediate explanations
- No pressure learning environment

### 4. Tournament Mode
- Competitive multiplayer
- No NPCs (human-only)
- Advanced scoring algorithms
- Leaderboard rankings

---

## 📝 Development Guidelines

### File Usage Rules

**✅ DO USE:**
```typescript
// Main engine
import { UniversalGameEngine } from './universal-game-engine';

// NPC system
import { NPCService } from './npc-service';

// React hooks
import { useSinglePlayerGame, useMultiplayerGame } from '../hooks/useGameEngine';
```

**❌ DON'T USE:**
```typescript
// These are deprecated
import { ComprehensiveMultiplayerEngine } from './comprehensive-game-engine';
import { NPCPersonalityEngine } from './npc-personality-engine';
```

### Best Practices

1. **Always use the appropriate hook** for your game mode
2. **Leverage the NPC service** for all NPC functionality
3. **Use TypeScript interfaces** for type safety
4. **Handle errors gracefully** with the error callbacks
5. **Clean up resources** when components unmount

### Performance Tips

1. **Cache NPC personalities** using NPCService singleton
2. **Use connection pooling** for database queries
3. **Implement message throttling** for real-time updates
4. **Optimize question loading** with proper indexing

### Testing Strategy

```typescript
// Example test setup
import { UniversalGameEngine } from './universal-game-engine';

describe('UniversalGameEngine', () => {
  it('should handle single player mode', async () => {
    const config = {
      mode: 'single',
      topicId: 'test-topic',
      difficultyLevel: 'medium',
      questionCount: 5,
      timePerQuestion: 30,
      userId: 'test-user',
    };

    const engine = new UniversalGameEngine(config);
    await engine.startGame();
    
    // Test assertions
  });
});
```

---

## 🔧 Migration Guide

If you're upgrading from the old engines:

### From ComprehensiveMultiplayerEngine
```typescript
// Old way
const engine = new ComprehensiveMultiplayerEngine(config, userId);

// New way
const { gameState, actions } = useMultiplayerGame(topicId, roomId, options);
```

### From NPCPersonalityEngine
```typescript
// Old way
const npcEngine = new NPCPersonalityEngine(roomId);
const personality = await npcEngine.getRandomPersonality();

// New way
const npcService = NPCService.getInstance();
const personality = await npcService.getRandomPersonality(topicId, categoryId);
```

---

**🎯 Remember: Use the UniversalGameEngine and NPCService for all new development. The old engines are deprecated and will be removed.** 