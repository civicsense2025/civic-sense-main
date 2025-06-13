# Question Content Optimizer

This tool helps optimize, refine, and fact-check question content for the Civic Sense quiz platform.

## Features

🔍 **Content Quality Analysis**
- Evaluates question text length and clarity
- Assesses explanation depth and reasoning
- Checks hint helpfulness
- Validates factual claims against sources

🔗 **Source Validation**
- Verifies source URLs are reachable
- Checks domain trustworthiness
- Identifies broken or redirected links
- Suggests trusted source alternatives

🏷️ **Tag Optimization**
- Analyzes existing tags for relevance
- Suggests improved tags based on content
- Removes redundant or excessive tags
- Categorizes by content and difficulty

📊 **Quality Scoring**
- Assigns quality scores (0-100) to each question
- Identifies questions needing immediate attention
- Tracks improvement metrics
- Provides prioritized recommendations

## Usage

### Basic Usage

```bash
npm run optimize-questions
```

### Available Modes

1. **All Questions** - Comprehensive analysis of entire question database
2. **Specific Topic** - Focused analysis on a single topic
3. **Low Quality Questions** - Quick fixes for poorly performing questions
4. **Fact-Check Mode** - Verification focus for questionable content

### Configuration Options

1. **Source Validation** - Check URL validity and trustworthiness
2. **Report Generation** - Create detailed analysis reports
3. **Auto-Fix** - Automatically apply common improvements
4. **Default Settings** - Fast analysis with standard checks

## Quality Metrics

### Scoring Criteria

- **Question Length** (10 points): Too short (<20 chars) or too long (>200 chars)
- **Explanation Quality** (25 points): Brevity, causal reasoning, context
- **Source Reliability** (35 points): Presence, trustworthiness, quantity
- **Tag Relevance** (10 points): Appropriate number and relevance
- **Hint Usefulness** (5 points): Length and helpfulness
- **Factual Accuracy** (15 points): Claims verification and documentation

### Quality Ranges

- **Excellent (90-100)**: High-quality, well-sourced content
- **Good (80-89)**: Minor improvements needed
- **Fair (70-79)**: Moderate issues to address
- **Poor (60-69)**: Significant problems requiring attention
- **Critical (<60)**: Immediate review and fixes needed

## Trusted Source Domains

The optimizer validates sources against a curated list of trusted domains:

### Government Sources
- `whitehouse.gov`, `congress.gov`, `supremecourt.gov`
- `archives.gov`, `federalregister.gov`, `senate.gov`
- `house.gov`, `epa.gov`, `ed.gov`, `dhs.gov`

### Academic & Research
- `law.cornell.edu`, `constitutioncenter.org`
- `brookings.edu`, `cbpp.org`, `americanprogress.org`

### News Organizations
- `npr.org`, `pbs.org`, `reuters.com`, `apnews.com`
- `washingtonpost.com`, `nytimes.com`, `wsj.com`
- `bbc.com`, `economist.com`

## Generated Reports

The optimizer creates comprehensive reports including:

### JSON Report (`question-optimization-report-[timestamp].json`)
- Complete analysis data
- Individual question assessments
- Optimization recommendations
- Quality scores and metrics

### Markdown Summary (`optimization-summary-[timestamp].md`)
- Executive summary statistics
- Most common issues identified
- Topic performance breakdown
- Prioritized recommendations
- Quality distribution analysis

## Common Issues & Fixes

### Automatically Fixed Issues
- Brief explanations → Extended with civic impact context
- Missing tags → Generated based on content and category
- Poor formatting → Standardized structure

### Manual Review Required
- Unreachable sources → Replace with working alternatives
- Untrusted domains → Add authoritative sources
- Factual inaccuracies → Verify against primary sources
- Overly complex language → Simplify for broader audience

## Integration with Existing Workflow

The optimizer integrates with:
- **Database Operations**: Direct updates to question content
- **Feedback System**: Incorporates user ratings and reports
- **Content Generation**: Enhances AI-generated questions
- **Quality Assurance**: Provides metrics for editorial review

## Best Practices

1. **Regular Optimization**: Run monthly to maintain quality
2. **Source Verification**: Always validate claims with multiple sources
3. **User Feedback**: Incorporate community reports and ratings
4. **Iterative Improvement**: Use reports to guide content strategy
5. **Educational Focus**: Ensure civic learning objectives are met

## Example Output

```
🔍 CIVIC SENSE - QUESTION CONTENT OPTIMIZER
==========================================

📊 Analyzing 450 questions...

🔍 Analyzing Question 1/450: "What percentage of the Senate must approve..."
  🔗 Validating 2 sources...
  ✅ Quality Score: 85/100 (1% complete)

[... processing continues ...]

✅ OPTIMIZATION COMPLETE
========================
Questions analyzed: 450
Average quality score: 78/100
Questions needing work: 89
Questions needing fact-check: 23

🚨 Questions needing immediate attention:
1. Question 45 (Topic: federal_employee_terminations) - Score: 42/100
   Issues: No sources provided, Explanation is too brief
```

## Advanced Features

### Batch Processing
- Configurable batch sizes for large datasets
- Progress tracking and resumable operations
- Memory-efficient processing for thousands of questions

### Custom Validation Rules
- Topic-specific quality criteria
- Category-based scoring adjustments
- Difficulty-level appropriate standards

### Integration APIs
- Programmatic access to optimization functions
- Webhook support for automated workflows
- Export capabilities for external tools

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Ensure `.env.local` has correct Supabase credentials
- Verify network connectivity
- Check database permissions

**Source Validation Timeouts**
- Increase timeout settings for slow connections
- Skip source validation for faster processing
- Use batch mode for large datasets

**Memory Issues with Large Datasets**
- Reduce batch size in configuration
- Process by topic instead of all questions
- Enable garbage collection between batches

### Performance Tips

- Use topic-specific analysis for faster iteration
- Enable auto-fix only for trusted improvements
- Schedule full analysis during off-peak hours
- Cache source validation results for repeated runs 