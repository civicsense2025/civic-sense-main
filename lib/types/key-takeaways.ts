/**
 * Key Takeaways Structure for CivicSense Topics
 * Follows CivicSense content principles: truth over comfort, specific actors, power dynamics
 */

export interface KeyTakeaways {
  /** Core facts that form the foundation of understanding this topic */
  core_facts: string[]
  
  /** Uncomfortable truths about power that politicians don't want people to know */
  uncomfortable_truths: string[]
  
  /** How power actually flows vs. how it appears to - revealing hidden influence */
  power_dynamics: string[]
  
  /** Specific institutions, officials, and actors - never vague "government" references */
  specific_actors: string[]
  
  /** Actionable insights that help citizens understand leverage points and next steps */
  actionable_insights: string[]
  
  /** How this topic sets precedent or reveals patterns in American power structures */
  precedent_implications: string[]

  /** Sources used to verify and support the key takeaways */
  sources?: Array<{
    id: number
    url: string
    title: string
    organization: string
    date: string
    type: SourceTypeValue
    /** For direct quotes and social media posts */
    quote_text?: string
    /** Speaker/author of the quote */
    speaker?: string
    /** Platform for social media posts */
    platform?: string
    /** Verified status of the social media account */
    verified_account?: boolean
    /** Context around the quote */
    quote_context?: string
  }>
}

export interface TopicWithKeyTakeaways {
  topic_id: string
  topic_title: string
  emoji: string
  key_takeaways: KeyTakeaways | null
}

export interface KeyTakeawaysGenerationRequest {
  topic_id: string
  topic_title: string
  questions_content?: string[]
  existing_content?: string
}

export interface KeyTakeawaysGenerationResponse {
  topic_id: string
  key_takeaways: KeyTakeaways
  generation_metadata: {
    provider: 'anthropic' | 'openai'
    model: string
    timestamp: string
    confidence_score?: number
    question_metadata: QuestionMetadata
  }
}

export const SourceType = {
  // Government & Official Sources
  GOVERNMENT_DOCUMENT: 'government_document',
  CONGRESSIONAL_RECORD: 'congressional_record',
  REGULATORY_FILING: 'regulatory_filing',
  PUBLIC_TESTIMONY: 'public_testimony',
  INTELLIGENCE_REPORT: 'intelligence_report',
  
  // Legal Sources
  LEGAL_FILING: 'legal_filing',
  COURT_DOCUMENT: 'court_document',
  
  // News & Media Sources
  NEWS_ARTICLE: 'news_article',           // Added: General news articles
  INVESTIGATIVE_REPORT: 'investigative_report', // Added: In-depth investigative journalism
  OPINION_PIECE: 'opinion_piece',         // Added: Opinion articles, columns
  BLOG_POST: 'blog_post',                 // Added: Blog posts from credible authors
  PRESS_RELEASE: 'press_release',
  MEDIA_TRANSCRIPT: 'media_transcript',   // Added: Transcripts from TV, radio, podcasts
  
  // Research & Analysis
  ACADEMIC_STUDY: 'academic_study',
  SCIENTIFIC_RESEARCH: 'scientific_research',
  ECONOMIC_ANALYSIS: 'economic_analysis',
  SOCIOPOLITICAL_RESEARCH: 'sociopolitical_research',
  THINK_TANK_REPORT: 'think_tank_report', // Added: Reports from policy institutes
  POLICY_BRIEF: 'policy_brief',           // Added: Policy analysis documents
  
  // Data Sources
  MARKET_DATA: 'market_data',
  PLATFORM_DATA: 'platform_data',
  STATISTICAL_REPORT: 'statistical_report', // Added: Statistical analysis and reports
  
  // Primary Sources
  PRIMARY_SOURCE: 'primary_source',
  DIRECT_QUOTE: 'direct_quote',
  INTERVIEW_TRANSCRIPT: 'interview_transcript', // Added: Direct interview transcripts
  SPEECH_TRANSCRIPT: 'speech_transcript',      // Added: Transcripts of speeches
  
  // Social & Digital Media
  SOCIAL_MEDIA_POST: 'social_media_post',
  NEWSLETTER: 'newsletter',               // Added: Subscription newsletters
  PODCAST_TRANSCRIPT: 'podcast_transcript', // Added: Podcast episode transcripts
  SUBSTACK_POST: 'substack_post',         // Added: Posts from verified Substack authors
} as const

export type SourceTypeValue = typeof SourceType[keyof typeof SourceType]

// Source type-specific validation rules
export const sourceTypeValidation = {
  // Government & Official Sources
  [SourceType.GOVERNMENT_DOCUMENT]: (source: any) => {
    return source.url.includes('.gov') || source.organization.toLowerCase().includes('government')
  },
  [SourceType.CONGRESSIONAL_RECORD]: (source: any) => {
    return source.url.includes('congress.gov') || source.organization.toLowerCase().includes('congress')
  },
  [SourceType.REGULATORY_FILING]: (source: any) => {
    return source.url.includes('sec.gov') || source.url.includes('regulations.gov')
  },
  [SourceType.PUBLIC_TESTIMONY]: (source: any) => {
    return source.title.toLowerCase().includes('testimony') || source.title.toLowerCase().includes('hearing')
  },
  [SourceType.INTELLIGENCE_REPORT]: (source: any) => {
    const intelOrgs = ['cia', 'fbi', 'nsa', 'dni', 'intelligence']
    return intelOrgs.some(org => source.organization.toLowerCase().includes(org))
  },

  // Legal Sources
  [SourceType.LEGAL_FILING]: (source: any) => {
    return source.url.includes('court') || source.url.includes('justice') || source.organization.toLowerCase().includes('court')
  },
  [SourceType.COURT_DOCUMENT]: (source: any) => {
    return source.url.includes('court') || source.url.includes('justice') || source.organization.toLowerCase().includes('court')
  },

  // News & Media Sources
  [SourceType.NEWS_ARTICLE]: (source: any) => {
    const newsOrgs = ['news', 'times', 'post', 'journal', 'tribune', 'gazette', 'reuters', 'ap', 'bbc', 'cnn', 'npr', 'bloomberg']
    return newsOrgs.some(org => source.organization.toLowerCase().includes(org)) || 
           source.url.match(/\.(com|org|net)\/[^/]+\/(news|article)/)
  },
  [SourceType.INVESTIGATIVE_REPORT]: (source: any) => {
    const investigativeOrgs = ['propublica', 'reveal', 'icij', 'center for investigative reporting']
    return investigativeOrgs.some(org => source.organization.toLowerCase().includes(org)) ||
           source.title.toLowerCase().includes('investigation')
  },
  [SourceType.OPINION_PIECE]: (source: any) => {
    return source.url.includes('/opinion/') || 
           source.title.toLowerCase().match(/opinion:|op-ed:|commentary:/) ||
           source.organization.toLowerCase().includes('opinion')
  },
  [SourceType.BLOG_POST]: (source: any) => {
    return source.url.includes('/blog/') || 
           source.url.match(/\.(com|org|net)\/[^/]+\/blog/) ||
           source.title.toLowerCase().includes('blog')
  },
  [SourceType.PRESS_RELEASE]: (source: any) => {
    return source.title.toLowerCase().includes('press release') || 
           source.title.toLowerCase().includes('statement') ||
           source.url.includes('/press-release/')
  },
  [SourceType.MEDIA_TRANSCRIPT]: (source: any) => {
    return source.title.toLowerCase().includes('transcript') ||
           source.url.includes('/transcript/')
  },

  // Research & Analysis
  [SourceType.ACADEMIC_STUDY]: (source: any) => {
    return source.url.includes('.edu') || 
           source.organization.toLowerCase().includes('university') ||
           source.url.match(/doi\.org|jstor\.org|academia\.edu/)
  },
  [SourceType.SCIENTIFIC_RESEARCH]: (source: any) => {
    return source.url.includes('doi.org') || 
           source.organization.toLowerCase().includes('research') ||
           source.url.match(/science|nature|research/)
  },
  [SourceType.ECONOMIC_ANALYSIS]: (source: any) => {
    const econSources = ['fed', 'federal reserve', 'imf', 'world bank', 'treasury', 'economic']
    return econSources.some(src => source.organization.toLowerCase().includes(src))
  },
  [SourceType.SOCIOPOLITICAL_RESEARCH]: (source: any) => {
    return source.organization.toLowerCase().includes('institute') || 
           source.organization.toLowerCase().includes('foundation')
  },
  [SourceType.THINK_TANK_REPORT]: (source: any) => {
    const thinkTanks = ['brookings', 'heritage', 'cato', 'rand', 'center for']
    return thinkTanks.some(org => source.organization.toLowerCase().includes(org))
  },
  [SourceType.POLICY_BRIEF]: (source: any) => {
    return source.title.toLowerCase().includes('policy brief') ||
           source.title.toLowerCase().includes('policy analysis')
  },

  // Data Sources
  [SourceType.MARKET_DATA]: (source: any) => {
    const marketSources = ['bloomberg', 'reuters', 'marketwatch', 'yahoo finance', 'sec.gov']
    return marketSources.some(src => source.organization.toLowerCase().includes(src))
  },
  [SourceType.PLATFORM_DATA]: (source: any) => {
    return source.url.includes('api') || source.url.includes('data')
  },
  [SourceType.STATISTICAL_REPORT]: (source: any) => {
    return source.title.toLowerCase().includes('statistics') ||
           source.title.toLowerCase().includes('data report')
  },

  // Primary Sources
  [SourceType.PRIMARY_SOURCE]: (source: any) => {
    return true // No specific validation, but must have base fields
  },
  [SourceType.DIRECT_QUOTE]: (source: any) => {
    return source.quote_text && source.speaker
  },
  [SourceType.INTERVIEW_TRANSCRIPT]: (source: any) => {
    return source.title.toLowerCase().includes('interview') ||
           source.url.includes('/interview/')
  },
  [SourceType.SPEECH_TRANSCRIPT]: (source: any) => {
    return source.title.toLowerCase().includes('speech') ||
           source.url.includes('/speech/')
  },

  // Social & Digital Media
  [SourceType.SOCIAL_MEDIA_POST]: (source: any) => {
    const platforms = ['twitter', 'x.com', 'facebook', 'instagram', 'linkedin', 'threads', 'mastodon']
    return source.platform && platforms.includes(source.platform.toLowerCase())
  },
  [SourceType.NEWSLETTER]: (source: any) => {
    return source.url.includes('newsletter') ||
           source.title.toLowerCase().includes('newsletter')
  },
  [SourceType.PODCAST_TRANSCRIPT]: (source: any) => {
    return source.title.toLowerCase().includes('podcast') ||
           source.url.includes('/podcast/')
  },
  [SourceType.SUBSTACK_POST]: (source: any) => {
    return source.url.includes('substack.com')
  }
}

// Enhanced source validation function
function validateSource(source: any): boolean {
  // Basic field validation
  const baseValid = typeof source === 'object' &&
    typeof source.id === 'number' &&
    typeof source.url === 'string' &&
    typeof source.title === 'string' &&
    typeof source.organization === 'string' &&
    typeof source.date === 'string' &&
    Object.values(SourceType).includes(source.type)

  if (!baseValid) return false

  // URL validation
  try {
    new URL(source.url)
  } catch {
    return false
  }

  // Date validation
  const date = new Date(source.date)
  if (isNaN(date.getTime())) return false

  // Type-specific validation
  const typeValidator = sourceTypeValidation[source.type as SourceTypeValue]
  if (!typeValidator(source)) return false

  // Additional validation for quotes and social media posts
  if (source.type === SourceType.DIRECT_QUOTE || source.type === SourceType.SOCIAL_MEDIA_POST) {
    const quoteValid = typeof source.quote_text === 'string' &&
      typeof source.speaker === 'string' &&
      (typeof source.quote_context === 'string' || source.quote_context === undefined)

    if (!quoteValid) return false

    // Additional validation for social media posts
    if (source.type === SourceType.SOCIAL_MEDIA_POST) {
      return typeof source.platform === 'string' &&
        (typeof source.verified_account === 'boolean' || source.verified_account === undefined)
    }
  }

  return true
}

export function validateKeyTakeaways(data: any): data is KeyTakeaways {
  if (!data || typeof data !== 'object') return false

  const requiredArrays = [
    'core_facts',
    'uncomfortable_truths',
    'power_dynamics',
    'specific_actors',
    'actionable_insights',
    'precedent_implications'
  ]

  const isValid = requiredArrays.every(key => 
    Array.isArray(data[key]) && 
    data[key].every((item: any) => typeof item === 'string')
  )

  // Validate sources if present
  if (data.sources) {
    if (!Array.isArray(data.sources)) return false
    return isValid && data.sources.every(validateSource)
  }

  return isValid
}

export function validateKeyTakeawaysQuality(takeaways: KeyTakeaways): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check minimum lengths
  if (takeaways.core_facts.length < 3) issues.push('Need at least 3 core facts')
  if (takeaways.uncomfortable_truths.length < 1) issues.push('Need at least 1 uncomfortable truth')
  if (takeaways.power_dynamics.length < 2) issues.push('Need at least 2 power dynamics insights')
  if (takeaways.specific_actors.length < 2) issues.push('Need at least 2 specific actors')
  if (takeaways.actionable_insights.length < 2) issues.push('Need at least 2 actionable insights')
  if (takeaways.precedent_implications.length < 1) issues.push('Need at least 1 precedent implication')

  // Check for passive voice (common words that indicate passive voice)
  const passiveIndicators = ['was', 'were', 'been', 'being', 'is being', 'are being', 'will be']
  for (const array of Object.values(takeaways)) {
    if (!Array.isArray(array)) continue // Skip non-array properties like sources
    for (const item of array) {
      if (passiveIndicators.some(word => item.toLowerCase().includes(` ${word} `))) {
        issues.push(`Passive voice detected: "${item}"`)
      }
    }
  }

  // Check for vague terms
  const vagueTerms = ['government', 'officials', 'politicians', 'lawmakers', 'leaders']
  for (const array of Object.values(takeaways)) {
    if (!Array.isArray(array)) continue // Skip non-array properties like sources
    for (const item of array) {
      if (vagueTerms.some(term => item.toLowerCase().includes(term))) {
        issues.push(`Vague term detected: "${item}"`)
      }
    }
  }

  // Check for specific data points in core facts
  const hasNumbers = (str: string) => /\d/.test(str)
  if (!takeaways.core_facts.some(hasNumbers)) {
    issues.push('Core facts should include at least one specific number or date')
  }

  // Check for specific names in actors
  const hasFullName = (str: string) => /[A-Z][a-z]+ [A-Z][a-z]+/.test(str)
  if (!takeaways.specific_actors.some(hasFullName)) {
    issues.push('Specific actors should include at least one full name')
  }

  // Check actionable insights for pattern-focused language
  const patternIndicators = ['watch for', 'track', 'notice', 'pay attention to', 'look for', 'monitor', 'observe']
  const hasPatternLanguage = takeaways.actionable_insights.some(insight =>
    patternIndicators.some(indicator => insight.toLowerCase().includes(indicator))
  )
  if (!hasPatternLanguage) {
    issues.push('Actionable insights should reveal specific patterns to watch for')
  }

  // Check actionable insights for tactical examples
  const tacticalIndicators = ['before', 'when', 'after', 'during', 'between', 'while']
  const hasTacticalExample = takeaways.actionable_insights.some(insight =>
    tacticalIndicators.some(indicator => insight.toLowerCase().includes(indicator))
  )
  if (!hasTacticalExample) {
    issues.push('Actionable insights should include tactical timing examples')
  }

  // Avoid formulaic language in actionable insights
  const formulaicPhrases = ['you can', 'you should', 'you must', 'you need to']
  for (const insight of takeaways.actionable_insights) {
    if (formulaicPhrases.some(phrase => insight.toLowerCase().includes(phrase))) {
      issues.push(`Formulaic language detected in insight: "${insight}"`)
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

export interface Topic {
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  categories: string[]
  source_analysis_id: string
  metadata: TopicMetadata
}

export interface TopicMetadata {
  temporal_distribution: {
    current_events: number
    recent_history: number
    historical: number
  }
  skill_focus_areas: QuestionSkill[]
  key_figures: QuestionFigure[]
  policy_areas: string[]
  bias_analysis: BiasAnalysis
  content_timeline: {
    start_date?: string
    end_date?: string
    is_ongoing: boolean
  }
}

export interface Question {
  question_number: number
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank'
  category: string
  question: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  hint: string
  explanation: string
  tags: string[]
  sources: Source[]
  difficulty_level: 1 | 2 | 3
  metadata: QuestionMetadata
}

export interface QuestionMetadata {
  skill_focus: {
    name: string
    proficiency_level: 1 | 2 | 3
  }
  key_figures: {
    name: string
    role: string
    relevance: string
  }[]
  policy_areas: string[]
  temporal_focus: 'current_events' | 'recent_history' | 'historical'
}

export interface QuestionSkill {
  name: string            // e.g. "Critical Analysis", "Systems Thinking"
  proficiency_level: 1 | 2 | 3  // 1=Basic, 2=Intermediate, 3=Advanced
  frequency: number       // How often this skill appears (percentage)
}

export interface QuestionFigure {
  name: string
  role: string
  current_position?: string
  relevance: string
  first_appearance_date: string  // YYYY-MM-DD
  last_appearance_date: string   // YYYY-MM-DD
}

export interface BiasAnalysis {
  political_balance: number     // -1 to 1 scale
  factual_accuracy: number     // 0 to 1 scale
  sensationalism_level: number // 0 to 1 scale
  source_diversity: number     // 0 to 1 scale
  citation_quality: {
    government_sources: number
    academic_sources: number
    news_sources: number
    primary_sources: number
  }
}

export interface Source {
  name: string
  url: string
} 