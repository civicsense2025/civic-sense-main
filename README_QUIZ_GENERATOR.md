# CivicSense Quiz Generator - Enhanced CLI

An AI-powered quiz content generator that follows strict @questions-topics.mdc guidelines for creating educational civic content.

## Features

- **Interactive CLI Mode**: Guided setup with provider selection and configuration
- **Multiple AI Providers**: OpenAI GPT-4, Anthropic Claude, Perplexity (with web access)
- **Flexible Generation Modes**: Topic-only, Questions-only, or Complete quiz
- **Strict Guidelines Compliance**: Follows @questions-topics.mdc requirements
- **Enhanced Validation**: Ensures proper question distribution and source citations
- **Database Integration**: Direct import to Supabase database

## Quick Start

### Interactive Mode (Recommended)
```bash
npm run generate-quiz
```

This launches an interactive CLI that guides you through:
1. Selecting AI provider and model
2. Choosing generation mode
3. Configuring output options
4. Auto-import settings

### Non-Interactive Mode
```bash
# Generate complete quiz
npm run generate-quiz -- --topic "Supreme Court Immunity Decision 2024" --provider anthropic

# Topic only for review
npm run generate-quiz -- --topic "TikTok Ban Debate" --mode topic-only --output ./my-topics

# Auto-import to database
npm run generate-quiz -- --topic "Infrastructure Bill 2024" --auto-import
```

## CLI Options

| Option | Description | Values |
|--------|-------------|---------|
| `--topic` | Current U.S. event/issue | Any specific current event |
| `--provider` | AI provider | `openai`, `anthropic`, `perplexity` |
| `--mode` | Generation mode | `complete`, `topic-only`, `questions-only` |
| `--output` | Output directory | Any valid path (default: `./generated`) |
| `--auto-import` | Import to database | Flag (no value needed) |
| `--help` | Show help | Flag |

## Generation Modes

### 1. Complete Quiz (`complete`)
- Generates topic metadata + 15-20 questions
- Best for new topics
- Follows full @questions-topics guidelines

### 2. Topic Only (`topic-only`)
- Generates only topic metadata
- Good for review before question generation
- Creates topic_id, description, why_this_matters

### 3. Questions Only (`questions-only`)
- Generates questions for existing topic
- Requires topic context
- Maintains question distribution requirements

## AI Provider Selection

### OpenAI GPT-4
- **Best for**: Instruction following, consistent formatting
- **Model**: `gpt-4-1106-preview` (default)
- **Strengths**: Reliable JSON output, good civic knowledge

### Anthropic Claude
- **Best for**: Balanced political content, nuanced analysis
- **Model**: `claude-3-sonnet-20240229` (default)
- **Strengths**: Non-partisan perspective, thoughtful explanations

### Perplexity
- **Best for**: Real-time current events, recent sources
- **Model**: `llama-3.1-sonar-large-128k-online` (default)
- **Strengths**: Web access, up-to-date information

## @questions-topics Guidelines Compliance

The enhanced generator strictly follows these requirements:

### Content Principles
- ✅ **Educational & Informative**: Clear civic education focus
- ✅ **Balanced & Non-Partisan**: Fair representation of viewpoints
- ✅ **Accurate & Verifiable**: 2-3 reputable sources per question
- ✅ **Critical Thinking**: Analysis and evaluation questions
- ✅ **Engaging & Accessible**: 8th-10th grade reading level
- ✅ **Progressively Complex**: Proper difficulty distribution

### Question Requirements
- ✅ **15-20 questions** per quiz
- ✅ **Distribution**: 70% Multiple Choice, 20% True/False, 10% Short Answer
- ✅ **Difficulty**: 20% Recall, 40% Comprehension, 30% Analysis, 10% Evaluation
- ✅ **Sources**: Exact URLs to specific articles/documents
- ✅ **Categories**: Proper civic education categories

### Topic Requirements
- ✅ **Specific Events**: One current U.S. event per quiz
- ✅ **Citizen Impact**: Clear "why this matters" explanations
- ✅ **Democratic Connection**: Links to civic principles
- ✅ **Proper Format**: HTML bullet lists, structured metadata

## Configuration

### API Keys
Create `ai-config.json`:
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

### Environment Variables (Alternative)
```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export PERPLEXITY_API_KEY="pplx-..."
```

## Output Files

Generated content includes:

### **Primary Output: SQL INSERT Statements (`{topic_id}_insert.sql`)**
Ready-to-execute SQL that matches your database schema:

```sql
-- Generated quiz content for: Supreme Court Presidential Immunity Decision
-- Topic ID: supreme_court_immunity_2024
-- Generated on: 2024-01-15T10:30:00.000Z
-- Questions: 18

-- Insert topic
INSERT INTO question_topics (
    topic_id, topic_title, description, why_this_matters, emoji,
    date, day_of_week, categories, is_active
) VALUES (
    'supreme_court_immunity_2024',
    'Supreme Court Presidential Immunity Decision',
    'The Supreme Court ruled on presidential immunity...',
    '<ul><li><strong>Personal Impact:</strong> This affects...</li></ul>',
    '⚖️',
    '2024-01-15',
    'Monday',
    '["Government", "Justice", "Constitutional Law"]',
    true
);

-- Insert questions
INSERT INTO questions (
    topic_id, question_number, question_type, category, question,
    option_a, option_b, option_c, option_d, correct_answer,
    hint, explanation, tags, sources, difficulty_level, is_active
) VALUES (
    'supreme_court_immunity_2024',
    1,
    'multiple_choice',
    'Constitutional Law',
    'What does presidential immunity protect against?',
    'All criminal charges',
    'Official acts only', 
    'Personal conduct',
    'Civil lawsuits only',
    'option_b',
    'Think about the difference between official and personal actions.',
    'Presidential immunity protects official acts...',
    '["presidential immunity", "constitutional law"]',
    '[{"name": "Supreme Court Decision", "url": "https://supremecourt.gov/..."}]',
    2,
    true
);
```

### Topic Config (`{topic_id}_config.json`)
```json
{
  "topic_id": "supreme_court_immunity_2024",
  "topic_title": "Supreme Court Presidential Immunity Decision",
  "description": "...",
  "why_this_matters": "<ul><li>...</li></ul>",
  "emoji": "⚖️",
  "date": "2024-01-15",
  "categories": ["Constitutional Law", "Government"]
}
```

### Questions CSV (`{topic_id}_questions.csv`)
Human-readable format for review and validation.

### Debug JSON (`{topic_id}_full.json`)
Complete generation data for debugging and review.

## Validation & Quality Assurance

The generator includes comprehensive validation:

### Topic Validation
- ✅ Required fields present
- ✅ Proper topic_id format (`lowercase_with_underscores_year`)
- ✅ Valid categories from approved list
- ✅ HTML format for `why_this_matters`

### Question Validation
- ✅ 15-20 questions total
- ✅ Proper type distribution (70/20/10)
- ✅ At least 2 sources per question
- ✅ Valid source URLs
- ✅ Complete multiple choice options

## Examples

### Interactive Session
```bash
$ npm run generate-quiz

🏛️  CivicSense Enhanced Quiz Generator
=====================================

Enter the current U.S. event/issue: Supreme Court Immunity Decision 2024

Available AI Providers:
1. OpenAI GPT-4 (excellent instruction following)
2. Anthropic Claude (balanced political content)  
3. Perplexity (real-time web access)

Select provider (1-3): 2

Generation Modes:
1. Complete Quiz (topic + questions)
2. Topic Only (for review before questions)
3. Questions Only (for existing topic)

Select mode (1-3): 1

Output directory (./generated): 
Auto-import to database? (y/N): y

🚀 Starting generation...
🤖 Calling anthropic with model claude-3-sonnet-20240229...
✅ Generated topic: Supreme Court Presidential Immunity Decision
   Categories: Constitutional Law, Government
❓ Generating questions...
✅ Generated 18 questions
   Distribution: 13 MC (72%), 4 T/F (22%), 1 SA (6%)
💾 Files saved:
   SQL: ./generated/supreme_court_immunity_2024_insert.sql
   Config: ./generated/supreme_court_immunity_2024_config.json
   CSV: ./generated/supreme_court_immunity_2024_questions.csv
   Full JSON: ./generated/supreme_court_immunity_2024_full.json
📊 Importing to database...
✅ Successfully imported to database

🎉 Generation completed successfully!
```

### Command Line Usage
```bash
# Quick generation with defaults
npm run generate-quiz -- --topic "Infrastructure Bill Debate 2024"

# Specific provider and mode
npm run generate-quiz -- --topic "TikTok Ban Supreme Court Case" --provider perplexity --mode complete

# Topic review workflow
npm run generate-quiz -- --topic "Election Security Measures" --mode topic-only
# Review output, then:
npm run generate-quiz -- --topic "Election Security Measures" --mode questions-only --auto-import
```

## Troubleshooting

### Common Issues

**API Key Not Found**
```bash
❌ API key not found for openai. Please set it in ./ai-config.json or environment variable.
```
Solution: Add API key to config file or set environment variable.

**Invalid Topic Response**
```bash
❌ topic_id must be lowercase_with_underscores_year format
```
Solution: The AI generated an invalid topic_id. Try regenerating or use a different provider.

**Question Distribution Warning**
```bash
⚠️  Multiple Choice percentage: 65.0% (target: 70%)
```
This is a warning - the content will still be generated but may not perfectly match guidelines.

### Debug Mode
For detailed debugging, check the `{topic_id}_full.json` file which contains:
- Original AI response
- Parsed data structures
- Conversion steps
- Validation results

## Legacy Commands

The original commands are still supported:

```bash
# Legacy generate command
npm run generate-quiz generate "Topic Name" anthropic ./output

# Legacy generate and import
npm run generate-quiz-import "Topic Name" openai
```

## Integration with Database

Generated content integrates seamlessly with the CivicSense database:

- **Topics** → `question_topics` table
- **Questions** → `questions` table  
- **Categories** → Proper emoji mapping
- **Sources** → JSON format with name/URL pairs

Use `--auto-import` flag or run `npm run import-quiz` after generation. 