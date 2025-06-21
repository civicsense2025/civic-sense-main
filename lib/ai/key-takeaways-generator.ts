/**
 * AI-Powered Key Takeaways Generator for CivicSense
 * Uses both Anthropic and OpenAI to extract key insights from civic topics
 * Follows CivicSense content principles: truth over comfort, specific actors, power dynamics
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { 
  KeyTakeaways, 
  validateKeyTakeaways, 
  validateKeyTakeawaysQuality, 
  KeyTakeawaysGenerationResponse,
  QuestionMetadata 
} from '../types/key-takeaways'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// CivicSense brand voice and content principles
const CIVICSENSE_PROMPT_BASE = `
You are a civic education expert working for CivicSense, a platform that reveals uncomfortable truths about American power structures. Our mission is to transform passive observers into confident, effective participants in democracy.

CORE PRINCIPLES:
- Truth over comfort: Reveal uncomfortable truths politicians don't want people to know
- Clarity over politeness: Use active voice, name specific actors and institutions  
- Action over passive consumption: Provide actionable insights for civic engagement
- Evidence over opinion: Focus on verifiable facts and power dynamics
- Systems thinking: Connect individual events to broader patterns of power
- Current events priority: Always prioritize recent developments and their immediate implications

CONTENT STANDARDS:
- Never use vague "government" references - name specific institutions, officials, and agencies
- Reveal how power actually flows vs. how it appears to flow
- Include uncomfortable truths that challenge common assumptions
- Provide actionable insights that help citizens understand leverage points
- Connect events to broader precedents and patterns in American power structures
- Use active voice that assigns responsibility to specific actors
- PRIORITIZE RECENT EVENTS: Focus on what's happening NOW, not just historical context
`

const TOPIC_ANALYSIS_PROMPT = `
${CIVICSENSE_PROMPT_BASE}

Your task is to analyze a civic topic and extract the most important key takeaways that citizens need to understand. This goes beyond just summarizing - you need to reveal the power dynamics, uncomfortable truths, and actionable insights.

CRITICAL: PRIORITIZE THE SPECIFIC TOPIC CONTENT FIRST
1. START with the specific topic/question being asked - what do citizens need to know about THIS EXACT ISSUE?
2. Focus on the immediate implications and current state of THIS SPECIFIC topic
3. Only AFTER covering the specific topic, connect it to broader patterns and historical context
4. Make sure citizens understand THIS issue before expanding to related precedents

REQUIRED OUTPUT FORMAT (JSON):
{
  "core_facts": [
    "3-5 fundamental facts about THIS SPECIFIC topic/question",
    "Start with what citizens need to know about THIS EXACT issue",
    "THEN connect to broader context and historical patterns"
  ],
  "uncomfortable_truths": [
    "1-3 uncomfortable truths about THIS SPECIFIC situation",
    "Focus on what THIS case reveals about power dynamics",
    "Connect to broader patterns only after specific revelations"
  ],
  "power_dynamics": [
    "2-4 insights about how power flows in THIS SPECIFIC case",
    "Start with the immediate power players and their current actions",
    "Then show how this fits broader patterns of influence"
  ],
  "specific_actors": [
    "2-5 specific institutions/officials involved in THIS EXACT situation",
    "Focus on current decision-makers for this specific issue",
    "Include historical figures only if directly relevant to current situation"
  ],
  "actionable_insights": [
    "2-4 insights that reveal specific patterns in THIS situation",
    "Use direct imperative language - NOT 'you can' or 'you should' phrases",
    "Start with immediate tactics for THIS issue before broader strategies",
    "Examples of CORRECT direct language:",
    "- 'Watch for sudden facility transfers before congressional visits - a classic tactic to hide conditions from oversight'",
    "- 'Track which lobbyists register just before key committee votes to reveal hidden influence networks'",
    "- 'Notice when agencies bury controversial decisions in holiday weekend document dumps'",
    "- 'Monitor emergency room closure patterns in immigrant-heavy neighborhoods to recognize how hospitals avoid uncompensated care obligations'",
    "- 'Spot coordinated healthcare restriction efforts by watching for simultaneous state-level bills using identical exclusionary language provided by industry lobbyists'"
  ],
  "precedent_implications": [
    "1-3 ways THIS SPECIFIC case connects to broader patterns",
    "How THIS situation reveals ongoing power dynamics",
    "What THIS case means for future democratic participation"
  ],
  "sources": [
    {
      "id": 1,
      "url": "URL to authoritative source",
      "title": "Title of source document/article",
      "organization": "Organization that published the source",
      "date": "YYYY-MM-DD",
      "type": "One of: government_document, news_report, academic_study, congressional_record, legal_filing, press_release, court_document, market_data, scientific_research, economic_analysis, sociopolitical_research, primary_source, social_media_post, direct_quote, platform_data, intelligence_report, regulatory_filing, public_testimony"
    }
  ]
}

QUALITY REQUIREMENTS:
- Each item should be 20-200 characters
- Use active voice and specific language
- Challenge assumptions and reveal hidden dynamics
- Connect to broader patterns of power and democratic participation
- Write actionable insights with direct imperatives - NO "you can/should/must/need to" language
- Include at least one authoritative source (government, academic, or legal)
- Include at least one source from the past 2 years
- PRIORITIZE sources from 2024-2025 when available
- Each source must have complete metadata (id, url, title, organization, date, type)
- Source types must match the schema EXACTLY - no variations allowed

Remember: We succeed when people become harder to manipulate, more difficult to ignore, and impossible to fool.
`

export class KeyTakeawaysGenerator {
  private async searchForSources(topicTitle: string, questionContent: string[]): Promise<string> {
    console.log(`   🔍 Searching web for authoritative sources and direct quotes on: ${topicTitle}`)
    
    try {
      const searchResponse = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Search the web for authoritative sources, direct quotes, and social media posts about: ${topicTitle}

CRITICAL PRIORITY: Focus on CURRENT EVENTS and RECENT DEVELOPMENTS from 2024-2025
- Prioritize sources from the past 2 years, especially 2024-2025
- Look for recent policy changes, executive actions, legislative developments
- Find current news coverage and recent analysis
- Search for latest government documents and regulatory changes

Focus on finding:
1. Recent government documents (.gov sites) - especially from 2024-2025
2. Recent congressional records (congress.gov) from current sessions
3. Current news reports from 2024-2025 about this topic
4. Recent academic and scientific research papers
5. Latest legal filings and court documents
6. Recent major news reports from established outlets
7. Current official press releases and announcements
8. Recent market data and economic analysis
9. Current sociopolitical research and analysis
10. Recent primary source documents and records
11. Direct quotes from key figures in 2024-2025 (speeches, interviews, testimony)
12. Recent social media posts from verified accounts
13. Current public statements and official communications

For each source, I need:
- Complete URL
- Full title
- Publishing organization
- Exact publication date (YYYY-MM-DD format)
- Source type (MUST be one of: government_document, news_report, academic_study, congressional_record, legal_filing, press_release, court_document, market_data, scientific_research, economic_analysis, sociopolitical_research, primary_source, social_media_post, direct_quote, platform_data, intelligence_report, regulatory_filing, public_testimony)

For direct quotes and social media posts, also include:
- Exact quote text
- Speaker/author name
- Platform (for social media)
- Verified account status (for social media)
- Context of when/where the quote was made

CRITICAL REQUIREMENTS:
- PRIORITIZE sources from 2024-2025 - these should be the majority of results
- Only return sources you actually find through web search
- Verify each URL is accessible
- Focus on RECENT developments and current events
- At least one source must be a government document, congressional record, academic study, or legal filing
- Format dates as YYYY-MM-DD
- Double-check all metadata is accurate
- Source type MUST match one of the allowed types exactly
- For quotes and social media posts, include EXACT text - no paraphrasing
- Verify authenticity of social media posts and accounts
- When searching for "${topicTitle}", prioritize what's happening NOW in 2025

Return the sources in a clear, organized format with complete metadata, starting with the most recent sources first.`
        }]
      })

      const content = searchResponse.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Anthropic')
      }

      return content.text
    } catch (error) {
      console.warn('Web search failed:', error)
      return 'Web search unavailable - proceeding with generation without source verification'
    }
  }

  async generateWithAnthropic(
    topicTitle: string, 
    questionContent: string[] = [],
    existingContent: string = '',
    questionMetadata: QuestionMetadata
  ): Promise<KeyTakeaways> {
    // First, search for authoritative sources
    const sourceResults = await this.searchForSources(topicTitle, questionContent)

    const contextContent = [
      `Topic: ${topicTitle}`,
      existingContent && `Additional Context: ${existingContent}`,
      questionContent.length > 0 && `Related Questions: ${questionContent.join('\n')}`,
      `\nAUTHORITATIVE SOURCES FROM WEB SEARCH:\n${sourceResults}`
    ].filter(Boolean).join('\n\n')

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `${TOPIC_ANALYSIS_PROMPT}

TOPIC TO ANALYZE:
${contextContent}

CRITICAL ANALYSIS PRIORITIES:
1. START with what's happening NOW in 2025 - prioritize current events and recent developments
2. Show how recent actions and policies reveal broader power dynamics  
3. Connect current events to historical patterns, but lead with the present
4. Focus on immediate implications for citizens' daily lives and civic participation

CRITICAL SOURCE REQUIREMENTS:
- Use ONLY sources from the web search results provided
- PRIORITIZE the most recent sources from 2024-2025 when available
- Include complete source metadata (id, url, title, organization, date, type)
- At least one source must be authoritative (government, academic, or legal)
- At least one source must be from the past 2 years
- Verify all source URLs are valid and accessible

LANGUAGE REQUIREMENTS FOR ACTIONABLE INSIGHTS:
- Use direct imperative language (start with action verbs)
- NEVER use "You can", "You should", "You must", or "You need to"
- Examples: "Watch for", "Track", "Notice", "Monitor", "Spot", "Identify"

Generate key takeaways that reveal the uncomfortable truths and power dynamics of this topic, with emphasis on current events and recent developments. Return ONLY the JSON object with no additional text.`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic')
    }

    try {
      const parsed = JSON.parse(content.text)
      if (!validateKeyTakeaways(parsed)) {
        throw new Error('Generated content does not match required schema')
      }
      
      const validation = validateKeyTakeawaysQuality(parsed)
      if (!validation.isValid) {
        throw new Error(`Quality validation failed: ${validation.issues.join(', ')}`)
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse Anthropic response:', content.text)
      throw new Error(`Failed to parse AI response: ${error}`)
    }
  }

  async generateWithOpenAI(
    topicTitle: string, 
    questionContent: string[] = [],
    existingContent: string = '',
    questionMetadata: QuestionMetadata
  ): Promise<KeyTakeaways> {
    // First, search for authoritative sources
    const sourceResults = await this.searchForSources(topicTitle, questionContent)

    const contextContent = [
      `Topic: ${topicTitle}`,
      existingContent && `Additional Context: ${existingContent}`,
      questionContent.length > 0 && `Related Questions: ${questionContent.join('\n')}`,
      `\nAUTHORITATIVE SOURCES FROM WEB SEARCH:\n${sourceResults}`
    ].filter(Boolean).join('\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: TOPIC_ANALYSIS_PROMPT
      }, {
        role: 'user',
        content: `TOPIC TO ANALYZE:
${contextContent}

CRITICAL ANALYSIS PRIORITIES:
1. START with what's happening NOW in 2025 - prioritize current events and recent developments
2. Show how recent actions and policies reveal broader power dynamics  
3. Connect current events to historical patterns, but lead with the present
4. Focus on immediate implications for citizens' daily lives and civic participation

CRITICAL SOURCE REQUIREMENTS:
- Use ONLY sources from the web search results provided
- PRIORITIZE the most recent sources from 2024-2025 when available
- Include complete source metadata (id, url, title, organization, date, type)
- At least one source must be authoritative (government, academic, or legal)
- At least one source must be from the past 2 years
- Verify all source URLs are valid and accessible

LANGUAGE REQUIREMENTS FOR ACTIONABLE INSIGHTS:
- Use direct imperative language (start with action verbs)
- NEVER use "You can", "You should", "You must", or "You need to"
- Examples: "Watch for", "Track", "Notice", "Monitor", "Spot", "Identify"

Generate key takeaways that reveal the uncomfortable truths and power dynamics of this topic, with emphasis on current events and recent developments. Return ONLY the JSON object with no additional text.`
      }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      const parsed = JSON.parse(content)
      if (!validateKeyTakeaways(parsed)) {
        throw new Error('Generated content does not match required schema')
      }
      
      const validation = validateKeyTakeawaysQuality(parsed)
      if (!validation.isValid) {
        throw new Error(`Quality validation failed: ${validation.issues.join(', ')}`)
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error(`Failed to parse AI response: ${error}`)
    }
  }

  async generateKeyTakeaways(
    topicId: string,
    topicTitle: string,
    questionContent: string[] = [],
    existingContent: string = '',
    provider: 'anthropic' | 'openai' | 'both' = 'both'
  ): Promise<KeyTakeawaysGenerationResponse | KeyTakeawaysGenerationResponse[]> {
    // First, analyze the questions and extract metadata
    const questionMetadata = await this.analyzeQuestions(questionContent)
    
    if (provider === 'anthropic') {
      const keyTakeaways = await this.generateWithAnthropic(topicTitle, questionContent, existingContent, questionMetadata)
      return {
        topic_id: topicId,
        key_takeaways: keyTakeaways,
        generation_metadata: {
          provider: 'anthropic',
          model: 'claude-3-7-sonnet-20250219',
          timestamp: new Date().toISOString(),
          question_metadata: questionMetadata
        }
      }
    }

    if (provider === 'openai') {
      const keyTakeaways = await this.generateWithOpenAI(topicTitle, questionContent, existingContent, questionMetadata)
      return {
        topic_id: topicId,
        key_takeaways: keyTakeaways,
        generation_metadata: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          timestamp: new Date().toISOString(),
          question_metadata: questionMetadata
        }
      }
    }

    // Generate with both providers for comparison
    const [anthropicResult, openaiResult] = await Promise.allSettled([
      this.generateWithAnthropic(topicTitle, questionContent, existingContent, questionMetadata),
      this.generateWithOpenAI(topicTitle, questionContent, existingContent, questionMetadata)
    ])

    const results: KeyTakeawaysGenerationResponse[] = []

    if (anthropicResult.status === 'fulfilled') {
      results.push({
        topic_id: topicId,
        key_takeaways: anthropicResult.value,
        generation_metadata: {
          provider: 'anthropic',
          model: 'claude-3-7-sonnet-20250219',
          timestamp: new Date().toISOString(),
          question_metadata: questionMetadata
        }
      })
    } else {
      console.error(`Anthropic generation failed for ${topicId}:`, anthropicResult.reason)
    }

    if (openaiResult.status === 'fulfilled') {
      results.push({
        topic_id: topicId,
        key_takeaways: openaiResult.value,
        generation_metadata: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          timestamp: new Date().toISOString(),
          question_metadata: questionMetadata
        }
      })
    } else {
      console.error(`OpenAI generation failed for ${topicId}:`, openaiResult.reason)
    }

    if (results.length === 0) {
      throw new Error(`Failed to generate key takeaways from any provider for topic: ${topicId}`)
    }

    return results
  }

  private async analyzeQuestions(questions: string[]): Promise<QuestionMetadata> {
    if (questions.length === 0) {
      return this.getDefaultMetadata()
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze these civic education questions and extract metadata about their content, focus, and quality. Return a JSON object matching the QuestionMetadata interface.

Questions to analyze:
${questions.join('\n')}

Focus on:
1. Temporal distribution (current vs historical content)
2. Skill areas and proficiency levels
3. Key political figures and their current roles
4. Policy areas covered
5. Bias analysis (political balance, factual accuracy, etc.)
6. Content timeline and currency

Return ONLY the JSON object with no additional text.`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic')
    }

    try {
      return JSON.parse(content.text)
    } catch (error) {
      console.error('Failed to parse question analysis:', error)
      return this.getDefaultMetadata()
    }
  }

  private getDefaultMetadata(): QuestionMetadata {
    return {
      temporal_distribution: {
        current_events: 70,  // Default to prioritizing current events
        recent_history: 20,
        historical: 10
      },
      skill_focus_areas: [
        {
          name: "Critical Analysis",
          proficiency_level: 2,
          frequency: 50
        },
        {
          name: "Systems Thinking",
          proficiency_level: 2,
          frequency: 50
        }
      ],
      key_figures: [],
      policy_areas: [],
      bias_analysis: {
        political_balance: 0,
        factual_accuracy: 0.9,
        sensationalism_level: 0.1,
        source_diversity: 0.8,
        citation_quality: {
          government_sources: 0.3,
          academic_sources: 0.3,
          news_sources: 0.2,
          primary_sources: 0.2
        }
      },
      content_timeline: {
        is_ongoing: true
      }
    }
  }

  // Method to compare and select best result when using both providers
  selectBestKeyTakeaways(results: KeyTakeawaysGenerationResponse[]): KeyTakeawaysGenerationResponse {
    if (results.length === 1) return results[0]

    // Enhanced scoring based on content quality metrics and source quality
    const scoredResults = results.map(result => {
      const takeaways = result.key_takeaways
      let score = 0
      
      // Prefer more uncomfortable truths (core CivicSense principle)
      score += takeaways.uncomfortable_truths.length * 3
      
      // Prefer more specific actors (avoids vague language)
      score += takeaways.specific_actors.length * 2
      
      // Prefer more power dynamics insights
      score += takeaways.power_dynamics.length * 2
      
      // Prefer more actionable insights
      score += takeaways.actionable_insights.length * 2

      // Source quality scoring
      if (takeaways.sources) {
        // Bonus for having sources
        score += 5

        // Bonus for authoritative sources
        const authoritativeSources = takeaways.sources.filter(source => 
          ['government_document', 'congressional_record', 'academic_study', 'legal_filing'].includes(source.type)
        )
        score += authoritativeSources.length * 3

        // Bonus for recent sources
        const currentYear = new Date().getFullYear()
        const recentSources = takeaways.sources.filter(source => {
          const sourceYear = new Date(source.date).getFullYear()
          return currentYear - sourceYear <= 2
        })
        score += recentSources.length * 2

        // Bonus for source diversity
        const uniqueTypes = new Set(takeaways.sources.map(s => s.type)).size
        score += uniqueTypes * 2
      }
      
      // Bonus for meeting minimum requirements
      const validation = validateKeyTakeawaysQuality(takeaways)
      if (validation.isValid) score += 10
      
      return { ...result, score }
    })

    // Return the highest scored result
    return scoredResults.sort((a, b) => b.score - a.score)[0]
  }
}

export const keyTakeawaysGenerator = new KeyTakeawaysGenerator() 