# CivicSense AI Content Generation Improvements

## Overview
We've completely overhauled the AI content generation system to produce content that sounds like "a really intelligent political savvy friend" rather than a textbook or C-SPAN.

## Key Improvements Made

### 1. ✨ Conversational Tone Transformation
**Before:** Formal, textbook-style explanations
**After:** Direct, conversational language that feels like a smart friend explaining politics

#### Examples of the New Tone:
- ❌ OLD: "The legislation faces challenges due to the narrow Republican majority in the Senate."
- ✅ NEW: "Senate Republicans can only lose three votes before their tax cut for billionaires dies. That's why K Street lobbyists are literally camping outside Susan Collins' office."

### 2. 📰 Genuine Source Diversity
**Before:** Repetitive .gov sources and fake URLs
**After:** 2-3 unique sources per question from diverse, real outlets

#### Source Types Now Included:
- **Investigative Journalism**: ProPublica, Reveal News, ICIJ
- **Wire Services**: AP News, Reuters (with different angles)
- **Local Investigative**: Tampa Bay Times, Seattle Times, Texas Tribune
- **Nonprofit News**: Mother Jones, Common Dreams, The Intercept
- **Financial Tracking**: OpenSecrets, Follow the Money
- **International Perspectives**: BBC, Al Jazeera
- **Think Tanks**: Brookings, American Progress, Cato Institute

### 3. 🎯 Content Requirements
Every piece of generated content now:
- Starts with why regular people should care
- Uses specific names, numbers, dates - no vague "officials say"
- Reveals uncomfortable truths politicians don't want discussed
- Keeps explanations punchy and direct
- Includes 2-3 diverse sources without explicitly talking about them

### 4. 🛠️ Technical Implementation

#### Updated System Prompts (`lib/ai/civicsense-system-prompts.ts`)
```typescript
// New conversational examples guide the AI
GOOD: "Here's what's actually happening: Musk just got handed control of a $2 trillion budget knife..."
BAD: "There are concerns about potential conflicts of interest..."
```

#### Enhanced Source Generation (`lib/ai/ugc-content-generator.ts`)
- Real-time source gathering from 20+ diverse outlet types
- Randomized selection ensures genuine variety
- URL validation prevents fake sources

#### Admin Tool (`app/admin/generate-questions.tsx`)
- Direct database generation for admins
- Preview questions before saving
- Automatic source diversity enforcement

### 5. 📊 Success Metrics
The new system succeeds when content:
- Sounds like it could be texted to a group chat with "holy shit, look what they're doing now"
- Names specific people and dollar amounts
- Connects abstract policies to personal impact
- Makes readers harder to manipulate, more difficult to ignore, and impossible to fool

## Testing the Improvements

Run a quick test to see the improvements:
```bash
node -e "
const { UGCContentGenerator } = require('./lib/ai/ugc-content-generator');
const gen = new UGCContentGenerator();
gen.process({
  topic: 'Senate tax bill negotiations',
  questionCount: 1,
  isPremium: true
}).then(r => console.log(JSON.stringify(r.data.questions[0], null, 2)));
"
```

## Next Steps
1. Monitor generated content for tone consistency
2. Gather user feedback on the conversational style
3. Continue expanding source diversity
4. Fine-tune the balance between accessible and informative

## Configuration
All improvements work with your existing API keys:
- `EXPO_PUBLIC_OPENAI_API_KEY` - For OpenAI generation
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` - For Claude generation with web search

The system automatically detects which keys are available and uses the appropriate provider. 