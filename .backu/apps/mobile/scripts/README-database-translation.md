# CivicSense Database Content Translation Tool

This CLI script translates content in your Supabase database using the DeepL API. It works with JSONB `translations` columns to store multilingual content.

## 🚀 Setup

### Environment Variables
```bash
export SUPABASE_URL="your-supabase-project-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Install Dependencies
```bash
npm install @supabase/supabase-js
```

## 📋 Supported Tables

The script currently supports these tables:

- **`categories`**: `name`, `description`
- **`question_topics`**: `topic_title`, `description`, `why_this_matters` 
- **`questions`**: `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `hint`, `explanation`

## 🌍 Supported Languages

- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`) 
- 🇩🇪 German (`de`)
- 🇮🇹 Italian (`it`)
- 🇵🇹 Portuguese (`pt`)
- 🇷🇺 Russian (`ru`)
- 🇯🇵 Japanese (`ja`)
- 🇰🇷 Korean (`ko`)
- 🇨🇳 Chinese (`zh`)
- 🇸🇦 Arabic (`ar`)
- 🇮🇳 Hindi (`hi`)
- 🇻🇳 Vietnamese (`vi`)

## 💻 Usage

### Show Translation Statistics
```bash
node scripts/translate-database-content.js --stats
```

### Interactive Translation (Recommended)
```bash
node scripts/translate-database-content.js
```
- Choose which tables to translate
- Select target languages
- Translates missing content only

### Translate Only [TRANSLATE] Placeholders
```bash
node scripts/translate-database-content.js --translate-only
```
- Only processes fields containing `[TRANSLATE]` placeholders
- Perfect for incremental updates
- Removes placeholders and translates the content

### Help
```bash
node scripts/translate-database-content.js --help
```

## 🔧 How It Works

### JSONB Structure
The script works with this JSONB structure in your `translations` column:

```json
{
  "explanation": {
    "es": "Explicación en español",
    "fr": "Explication en français"
  },
  "correct_answer": {
    "es": "Respuesta correcta",
    "fr": "Bonne réponse"
  }
}
```

### Translation Process
1. **Fetches records** that need translation
2. **Preserves existing translations** - only adds missing ones
3. **Protects placeholders** like `{{variable}}` during translation
4. **Merges results** with existing JSONB structure
5. **Rate limits** API calls (10 requests/second)

### Translation Modes

#### Normal Mode
- Translates any field that has original content but no translation
- Example: English `question` exists but no Spanish `question` in translations

#### `--translate-only` Mode  
- Only processes fields containing `[TRANSLATE]` placeholders
- Removes the placeholder and translates the cleaned content
- Perfect for updating specific fields that were manually marked

## 📊 Example Output

```
🌍 CivicSense Database Content Translation Tool

📊 Translation Statistics:

CATEGORIES:
  Total records: 6
  🇪🇸 Spanish: 4/6 (67%)
  🇫🇷 French: 2/6 (33%) (1 with [TRANSLATE])

QUESTIONS:
  Total records: 12
  🇪🇸 Spanish: 8/12 (67%)
  🇫🇷 French: 0/12 (0%) (5 with [TRANSLATE])

📋 Available tables:
  1. categories (Category Name, Description)
  2. question_topics (Topic Title, Description, Why This Matters)
  3. questions (Question Text, Option A, Option B, Option C, Option D, Correct Answer, Hint, Explanation)

Enter table numbers (comma-separated) or "all": 3

🌍 Available languages:
  1. 🇪🇸 Spanish (es)
  2. 🇫🇷 French (fr)
  3. 🇩🇪 German (de)

Enter language numbers (comma-separated) or "all": 1,2

🚀 Starting translation for 1 table(s) and 2 language(s)...

🔄 🇪🇸 Translating questions to es...
   Processing batch of 4 records...
   Translating questions record 97fac414-a537-4ba8-8bee-40ecdf799877...
     Translating field: Question Text
     Translating field: Option A
   ✅ Successfully saved translations for 97fac414-a537-4ba8-8bee-40ecdf799877
   ✅ Completed questions: 4 records translated

🎉 Translation complete! Total records translated: 8
```

## ⚠️ Important Notes

### Data Safety
- **Always backup your database** before running translations
- The script **merges** with existing translations, never overwrites
- Test with `--stats` first to see what will be translated

### Rate Limiting
- Built-in 100ms delay between API calls (10 requests/second)
- DeepL free tier: 500,000 characters/month
- DeepL Pro tier: Higher limits, faster processing

### Placeholder Protection
- `{{variable}}` patterns are protected during translation
- Restored exactly as they were after translation
- Works with interpolation variables like `{{count}}`, `{{name}}`

### Error Handling
- Failed translations return original text
- Database errors are logged but don't stop the process
- Graceful shutdown with Ctrl+C

## 🔍 Troubleshooting

### "Database connection failed"
- Check your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure the service role key has read/write permissions

### "DeepL API error: 403"
- Verify your DeepL API key is correct
- Check if you're using the right endpoint (free vs paid)

### "No records need translation"
- All content may already be translated
- Use `--stats` to see current translation status
- Try `--translate-only` if you have `[TRANSLATE]` placeholders

### Slow performance
- Reduce batch size if needed (currently 10 records/batch)
- Check your internet connection
- DeepL API may have temporary slowdowns

## 🎯 Best Practices

1. **Start with statistics**: Always run `--stats` first
2. **Test with one language**: Try a single language before translating all
3. **Use translate-only mode**: For incremental updates with placeholders
4. **Monitor API usage**: Track your DeepL character usage
5. **Backup regularly**: Database translations are valuable content

## 🔧 Extending the Script

To add new tables, update the `TABLE_CONFIGS` object:

```javascript
const TABLE_CONFIGS = {
  your_table: {
    primaryKey: 'id', // or whatever your primary key is
    fields: [
      { column: 'title', jsonKey: 'title', displayName: 'Title' },
      { column: 'content', jsonKey: 'content', displayName: 'Content' }
    ]
  }
};
```

To add new languages, update the `SUPPORTED_LANGUAGES` array with the appropriate DeepL language codes. 