# 🤖 CivicSense AI Quiz Generator - Complete System

You now have a comprehensive AI-powered quiz content generator that follows your detailed civic education guidelines!

## 🎯 What We Built

### Core Generator Script (`scripts/generate-quiz-content.ts`)
- **Multi-AI Support**: OpenAI GPT-4, Anthropic Claude, Perplexity (with web access)
- **Structured Prompts**: Uses your exact guidelines for 15-20 question sets
- **Database Integration**: Outputs formatted for your database schema
- **Quality Control**: Enforces source citations, balanced perspectives, civic connections

### System Components

1. **Quiz Content Generator** - Main AI generation script
2. **Test Suite** - Validates functionality without API calls
3. **Configuration System** - Secure API key management
4. **Database Integration** - Direct import to Supabase
5. **File Outputs** - SQL INSERT statements, CSV, JSON config, and debug files
6. **Documentation** - Comprehensive guides and examples

## 🚀 Quick Start Guide

### 1. Set Up API Keys

```bash
# Copy the example config
cp ai-config.json.example ai-config.json

# Edit with your actual API keys
nano ai-config.json
```

Add your API keys:
```json
{
  "openai": {
    "apiKey": "sk-your-actual-openai-key",
    "model": "gpt-4-1106-preview"
  },
  "anthropic": {
    "apiKey": "sk-ant-your-actual-anthropic-key",
    "model": "claude-3-sonnet-20240229"
  },
  "perplexity": {
    "apiKey": "pplx-your-actual-perplexity-key",
    "model": "llama-3.1-sonar-large-128k-online"
  }
}
```

### 2. Test the System

```bash
# Run the test suite (no API calls needed)
npm run test-generator
```

### 3. Generate Your First Quiz

```bash
# Generate quiz content (creates files for review)
npm run generate-quiz "Supreme Court Presidential Immunity Decision 2024"

# Or generate and import directly to database
npm run generate-quiz-import "TikTok Congressional Hearing 2024" anthropic
```

## 📋 Example Usage Commands

### Generate Content Only (for review)
```bash
# Use OpenAI (default)
npm run generate-quiz "Congressional AI Regulation Hearings 2024"

# Use Anthropic (good for sensitive political topics)
npm run generate-quiz "Abortion Rights Ballot Measures 2024" anthropic

# Use Perplexity (best for very recent events)
npm run generate-quiz "Current Immigration Policy Changes" perplexity
```

### Generate and Import to Database
```bash
# Direct to database (skips manual review)
npm run generate-quiz-import "Student Loan Forgiveness Legal Challenge"

# With specific provider
npm run generate-quiz-import "Climate Change Legislation Updates" anthropic
```

### Import Previously Generated Content
```bash
# If you generated files and want to import later
npm run import-quiz generated/your_topic_questions.csv generated/your_topic_config.json
```

## 🎓 Recommended Topics for Generation

### Current Events (2024-2025)
- "Supreme Court Presidential Immunity Decision 2024"
- "Congressional AI Regulation Hearings"
- "TikTok Ban Congressional Debate 2024"  
- "Immigration Border Policy Updates"
- "Student Loan Forgiveness Legal Challenges"
- "Climate Change Legislation Progress"
- "Election Security Measures 2024"

### Ongoing Civic Issues
- "Social Media Content Moderation Policies"
- "Congressional Ethics Investigations"
- "Voting Rights Act Implementation"
- "Healthcare Policy Debate"
- "Infrastructure Investment Progress"
- "Campaign Finance Reform Proposals"

## 📊 What Gets Generated

Each quiz generation creates:

1. **Topic Metadata**: Title, description, categories, dates
2. **15-20 Questions**: Multiple choice, true/false, fill-in-blank
3. **Educational Content**: Hints, explanations connecting to civic concepts
4. **Source Citations**: Verifiable references for all claims
5. **Database Records**: Properly formatted for immediate import

## 🔧 Configuration Options

### AI Provider Selection
- **OpenAI**: Best for consistent output, complex reasoning
- **Anthropic**: Excellent for balanced political content
- **Perplexity**: Only option with real-time web access

### Model Customization
You can specify different models in `ai-config.json`:

```json
{
  "openai": {
    "apiKey": "your-key",
    "model": "gpt-4-turbo-preview"  // Use latest model
  },
  "anthropic": {
    "apiKey": "your-key", 
    "model": "claude-3-opus-20240229"  // Use most capable model
  }
}
```

## 📁 Generated File Structure

```
generated/
├── your_topic_id_2024_insert.sql       # SQL INSERT statements (PRIMARY OUTPUT)
├── your_topic_id_2024_config.json      # Topic configuration
├── your_topic_id_2024_questions.csv    # Questions for review
└── your_topic_id_2024_full.json        # Complete debug info
```

### Primary Output: SQL Format
The main output is now SQL INSERT statements that directly match your database schema:
- `question_topics` table inserts with proper JSONB formatting
- `questions` table inserts with all required fields
- Proper SQL escaping for special characters
- Ready to execute against your Supabase database

## ✅ Quality Assurance Features

### Built-in Validation
- JSON structure validation
- Required field checking
- Source citation verification
- Question type consistency

### Educational Standards
- Non-partisan balance requirement
- Civic concept connections
- Source credibility standards
- Age-appropriate language

### Database Compatibility
- Automatic schema mapping
- Foreign key relationships
- Category standardization
- Date/time formatting

## 🛟 Troubleshooting

### Common Issues

**API Key Errors**
```bash
Error: API key not found for openai
```
- Check `ai-config.json` exists and has valid keys
- Verify environment variables if using that method

**JSON Parsing Errors**
```bash
Failed to parse AI response: Unexpected token
```
- Try a different AI provider
- Simplify the topic description
- Check debug output for malformed JSON

**Import Failures**
```bash
Database connection failed
```
- Ensure Supabase environment variables are set
- Check database migrations are applied
- Verify database permissions

### Debug Commands
```bash
# Test system without API calls
npm run test-generator

# Check generated files
ls -la generated/

# Validate JSON output
cat generated/topic_full.json | jq .
```

## 🎯 Next Steps

1. **Set up API keys** in `ai-config.json`
2. **Generate your first quiz** with a current topic
3. **Review generated content** in CSV format
4. **Import to database** when satisfied
5. **Test in the app** to see your quiz live

## 🔗 Related Documentation

- **`README_QUIZ_GENERATOR.md`** - Detailed usage guide
- **`README_DATABASE.md`** - Database schema documentation
- **`ai-config.json.example`** - Configuration template
- **`scripts/generate-quiz-content.ts`** - Main generator code

## 🎉 System Benefits

✅ **Rapid Content Creation**: Generate 15-20 quality questions in minutes
✅ **Educational Standards**: Built-in civic education guidelines
✅ **Source Verification**: Required citations for all claims
✅ **Multi-Provider Options**: Choose best AI for each topic
✅ **Database Ready**: Immediate import to live system
✅ **Quality Control**: Review before publishing
✅ **Cost Effective**: Use different APIs based on needs

You now have a complete AI-powered content generation system that follows your educational guidelines and integrates seamlessly with your CivicSense database!

## 🚀 Major Enhancements

### 1. Interactive Command-Line Interface
- **Guided Setup**: Step-by-step configuration with prompts
- **Provider Selection**: Choose between OpenAI, Anthropic, or Perplexity with model options
- **Mode Selection**: Topic-only, Questions-only, or Complete quiz generation
- **Smart Defaults**: Sensible fallbacks for all options

### 2. Strict @questions-topics Guidelines Compliance
- **Content Principles**: Educational, balanced, non-partisan, accurate, engaging
- **Question Distribution**: 70% Multiple Choice, 20% True/False, 10% Short Answer
- **Difficulty Levels**: 20% Recall, 40% Comprehension, 30% Analysis, 10% Evaluation
- **Source Requirements**: 2-3 reputable sources per question with exact URLs
- **Reading Level**: 8th-10th grade, conversational tone

### 3. Enhanced Validation System
- **Topic Validation**: Proper format, categories, HTML structure
- **Question Validation**: Distribution checks, source verification, completeness
- **Real-time Feedback**: Warnings and errors during generation
- **Quality Assurance**: Comprehensive checks before database import

### 4. Flexible Generation Modes
- **Complete Quiz**: Full topic + questions (recommended for new content)
- **Topic Only**: Generate metadata for review before questions
- **Questions Only**: Add questions to existing topics

### 5. Multi-Provider AI Support
- **OpenAI GPT-4**: Best instruction following, consistent formatting
- **Anthropic Claude**: Balanced political content, nuanced analysis  
- **Perplexity**: Real-time web access, current events expertise

## 🎯 Usage Examples

### Interactive Mode (New!)
```bash
npm run generate-quiz
# Launches guided CLI interface
```

### Non-Interactive Mode (New!)
```bash
# Complete quiz with specific provider
npm run generate-quiz -- --topic "Supreme Court Immunity Decision 2024" --provider anthropic

# Topic-only for review workflow
npm run generate-quiz -- --topic "TikTok Ban Debate" --mode topic-only

# Auto-import to database
npm run generate-quiz -- --topic "Infrastructure Bill 2024" --auto-import
```

### Legacy Commands (Still Supported)
```bash
npm run generate-quiz generate "Topic Name" anthropic
npm run generate-quiz-import "Topic Name" openai
```

## 📋 @questions-topics Guidelines Implementation

### Topic Generation
- ✅ **Specific Events**: One current U.S. event per quiz
- ✅ **Citizen Impact**: Clear "why this matters" with HTML bullet points
- ✅ **Democratic Connection**: Links to civic principles and engagement
- ✅ **Proper Categories**: From approved CivicSense category list
- ✅ **Format Validation**: topic_id format, required fields, structure

### Question Generation  
- ✅ **15-20 Questions**: Proper count validation
- ✅ **Type Distribution**: 70/20/10 split with warnings for deviations
- ✅ **Difficulty Progression**: Bloom's taxonomy levels
- ✅ **Source Citations**: Minimum 2 sources with exact URLs
- ✅ **Civic Connections**: Explanations link to democratic principles
- ✅ **Accessibility**: 8th-10th grade reading level

### Content Quality
- ✅ **Non-Partisan**: Balanced representation of viewpoints
- ✅ **Factual Accuracy**: Verifiable information with citations
- ✅ **Educational Value**: Clear learning objectives and explanations
- ✅ **Engagement**: Conversational tone, relevant examples

## 🔧 Configuration Options

### AI Provider Configuration
```json
{
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4-1106-preview"
  },
  "anthropic": {
    "apiKey": "sk-ant-...", 
    "model": "claude-3-sonnet-20240229"
  },
  "perplexity": {
    "apiKey": "pplx-...",
    "model": "llama-3.1-sonar-large-128k-online"
  }
}
```

### CLI Options
| Option | Description | Example |
|--------|-------------|---------|
| `--topic` | Current U.S. event | `"Supreme Court Decision 2024"` |
| `--provider` | AI provider | `anthropic`, `openai`, `perplexity` |
| `--mode` | Generation mode | `complete`, `topic-only`, `questions-only` |
| `--output` | Output directory | `./my-quizzes` |
| `--auto-import` | Import to database | Flag (no value) |

## 📊 Output Files

### 1. Topic Configuration (`{topic_id}_config.json`)
- Topic metadata for database import
- Proper emoji mapping
- Category assignments
- "Why this matters" HTML content

### 2. Questions CSV (`{topic_id}_questions.csv`)
- Ready-to-import format
- All question data and metadata
- Source citations in JSON format
- Proper answer mapping

### 3. Debug JSON (`{topic_id}_full.json`)
- Complete generation data
- Original AI responses
- Validation results
- Conversion steps

## ✅ Quality Assurance Features

### Validation Checks
- **Topic Format**: Validates topic_id, categories, required fields
- **Question Distribution**: Warns if type percentages deviate from guidelines
- **Source Quality**: Ensures valid URLs and proper citation format
- **Content Completeness**: Checks for missing options, explanations, hints

### Error Handling
- **API Failures**: Clear error messages with provider-specific guidance
- **Parsing Errors**: Shows raw response for debugging
- **Validation Failures**: Specific field-level error reporting
- **Configuration Issues**: Helpful setup instructions

### Review Workflow
1. **Generate Topic**: Review metadata before questions
2. **Validate Content**: Check against guidelines
3. **Generate Questions**: Add questions to approved topic
4. **Final Review**: CSV format for easy editing
5. **Database Import**: Seamless integration

## 🎓 Educational Standards Compliance

### Civic Education Categories
- Government (🏛️), Elections (🗳️), Economy (💰)
- Foreign Policy (🌐), Justice (⚖️), Civil Rights (✊)
- Environment (🌱), Local Issues (🏙️), Constitutional Law (📜)
- National Security (🛡️), Public Policy (📋), Historical Precedent (📚)
- Civic Action (🤝), Electoral Systems (📊), Legislative Process (🏛️)
- Judicial Review (⚖️), Policy Analysis (🔍), Civic Participation (🗣️)
- Media Literacy (📰)

### Question Types & Difficulty
- **Multiple Choice**: 4 plausible options, clear correct answer
- **True/False**: Challenges common misconceptions
- **Short Answer**: Precise factual responses
- **Recall**: Basic facts and definitions (20%)
- **Comprehension**: Cause/effect, processes (40%)
- **Analysis**: Patterns, comparisons (30%)
- **Evaluation**: Judgment, predictions (10%)

## 🚀 Next Steps

1. **Test Interactive Mode**: Run `npm run generate-quiz` to experience the guided interface
2. **Try Different Providers**: Compare outputs from OpenAI, Anthropic, and Perplexity
3. **Review Generated Content**: Check CSV files for quality and guideline compliance
4. **Import to Database**: Use `--auto-import` or manual import workflow
5. **Iterate and Improve**: Use feedback to refine prompts and validation

The enhanced quiz generator now provides a professional, guideline-compliant tool for creating high-quality civic education content that truly serves the CivicSense mission of turning passive citizens into informed democratic participants. 