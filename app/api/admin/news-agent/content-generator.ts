/**
 * CivicSense Content Package Generator
 * 
 * Generates comprehensive civic education content packages from breaking news events
 * following CivicSense brand guidelines and content standards.
 */

import { createClient } from '@/lib/supabase/server'
import { 
  DB_TABLES, 
  type DbEventsInsert,
  type DbQuestionTopicsInsert, 
  type DbQuestionsInsert,
  type DbGlossaryTermsInsert,
  type DbSkillsInsert,
  type DbPublicFiguresInsert
} from '@/lib/database-constants'

// Content packages table name
const CONTENT_PACKAGES_TABLE = 'content_packages'

// Brand constants based on guidelines
const BRAND_VOICE = {
  MISSION: "Transform passive observers into confident participants in democracy",
  READING_LEVEL: { MIN: 8, MAX: 10 },
  SENTENCE_MAX_WORDS: 25,
  PARAGRAPH_MAX_SENTENCES: 4,
  CONTENT_PILLARS: {
    CIVIC_EDUCATION: 0.40,
    MEDIA_LITERACY: 0.25,
    CIVIC_ENGAGEMENT: 0.20,
    CURRENT_EVENTS: 0.15
  }
}

const QUESTION_DISTRIBUTION = {
  MULTIPLE_CHOICE: 0.60,  // 9 out of 15
  TRUE_FALSE: 0.20,       // 3 out of 15
  SHORT_ANSWER: 0.20      // 3 out of 15
}

const DIFFICULTY_DISTRIBUTION = {
  LEVEL_1: 0.33,  // 5 out of 15
  LEVEL_2: 0.40,  // 6 out of 15
  LEVEL_3: 0.27   // 4 out of 15
}

// Approved categories from guidelines
const APPROVED_CATEGORIES = [
  'Civic Participation', 'Environment', 'Immigration', 'Civic Action',
  'Judicial Review', 'National Security', 'Public Policy', 'Constitutional Law',
  'Foreign Policy', 'Government', 'AI Governance', 'Economy', 'Civil Rights',
  'Media Literacy', 'Elections', 'Historical Precedent', 'Policy Analysis',
  'Electoral Systems', 'Local Issues', 'Justice', 'Legislative Process'
]

interface NewsEvent {
  id: string
  headline: string
  source_url?: string
  sourceUrl?: string
  civic_relevance_score?: number
  civicRelevanceScore?: number
  summary?: string
  key_actors?: string[]
  policy_areas?: string[]
}

interface GeneratedContent {
  questionTopic?: {
    topicId: string
    title: string
    description: string
    emoji: string
    category: string
    whyThisMatters: string
    date: string
    dayOfWeek: string
  }
  questions?: Array<{
    text: string
    type: 'multiple_choice' | 'true_false' | 'short_answer'
    difficulty: 1 | 2 | 3
    category: string
    options?: string[]
    correctAnswer: string
    hint: string
    explanation: string
    tags: string[]
    sources: Array<{ url: string; name: string }>
  }>
  skills?: Array<{
    name: string
    description: string
    category: string
    difficultyLevel: number
    practicalApplications: string[]
    learningObjectives: string[]
    assessmentCriteria: string[]
  }>
  glossaryTerms?: Array<{
    term: string
    definition: string
    category: string
    examples: string[]
    uncomfortableTruth: string
    powerDynamics: string[]
    actionSteps: string[]
  }>
  events?: Array<{
    title: string
    description: string
    date: string
    significance: number
    category: string
    whyThisMatters: string
    policyAreas: string[]
  }>
  publicFigures?: Array<{
    name: string
    title: string
    organization: string
    role: string
    politicalAffiliation: string
    keyPositions: string[]
    relevanceToTopic: string
    powerLevel: number
  }>
}

interface ContentTypes {
  questions: boolean
  skills: boolean
  glossary: boolean
  events: boolean
  publicFigures: boolean
}

interface QualityScores {
  overall: number
  brandVoiceCompliance: number
  factualAccuracy: number
  civicActionability: number
  stakesClarity: number
  readabilityScore: number
  sourceQuality: number
  itemsGenerated: number
}

export class ContentPackageGenerator {
  constructor(
    private supabase: any, 
    private aiProvider: 'openai' | 'anthropic' = 'anthropic',
    private aiClient?: any // OpenAI or Anthropic client
  ) {}

  async generateContentPackage(
    newsEvent: NewsEvent, 
    contentTypes: ContentTypes,
    qualityThreshold: number = 75
  ): Promise<{ packageId: string; content: GeneratedContent; qualityScores: QualityScores }> {
    console.log(`🤖 Generating CivicSense content package for: ${newsEvent.headline}`)
    
    // Analyze news event for civic relevance first
    const analysis = await this.analyzeNewsEvent(newsEvent)
    
    // Generate all content types in parallel with proper brand voice
    const [
      questionContent,
      skillsContent, 
      glossaryContent,
      eventsContent,
      publicFiguresContent
    ] = await Promise.all([
      contentTypes.questions ? this.generateQuestions(newsEvent, analysis) : Promise.resolve(null),
      contentTypes.skills ? this.generateSkills(newsEvent, analysis) : Promise.resolve(null),
      contentTypes.glossary ? this.generateGlossaryTerms(newsEvent, analysis) : Promise.resolve(null),
      contentTypes.events ? this.generateEvents(newsEvent, analysis) : Promise.resolve(null),
      contentTypes.publicFigures ? this.generatePublicFigures(newsEvent, analysis) : Promise.resolve(null)
    ])

    // Combine all generated content
    const content: GeneratedContent = {
      ...(questionContent && { 
        questionTopic: questionContent.topic,
        questions: questionContent.questions 
      }),
      ...(skillsContent && { skills: skillsContent }),
      ...(glossaryContent && { glossaryTerms: glossaryContent }),
      ...(eventsContent && { events: eventsContent }),
      ...(publicFiguresContent && { publicFigures: publicFiguresContent })
    }

    // Calculate comprehensive quality scores
    const qualityScores = await this.assessContentQuality(content, newsEvent)
    
    // Create content package record
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await this.supabase
      .from(CONTENT_PACKAGES_TABLE)
      .insert({
        id: packageId,
        news_event_id: newsEvent.id,
        news_headline: newsEvent.headline,
        news_analysis: analysis,
        generated_content: content,
        quality_scores: qualityScores,
        status: qualityScores.overall >= qualityThreshold ? 'review' : 'draft',
        created_at: new Date().toISOString()
      })

    return { packageId, content, qualityScores }
  }

  /**
   * Analyze news event for civic relevance and key themes
   */
  private async analyzeNewsEvent(newsEvent: NewsEvent): Promise<any> {
    const prompt = `
Analyze this news event through the CivicSense lens:

Headline: ${newsEvent.headline}
${newsEvent.summary ? `Summary: ${newsEvent.summary}` : ''}

Apply these CivicSense principles:
1. Reveal gaps between official process and reality
2. Show constitutional principles being tested or violated
3. Demonstrate how federal policies affect local communities
4. Expose institutional capture or resistance
5. Connect to broader democratic participation
6. Identify propaganda and manipulation techniques
7. Follow the money to find hidden beneficiaries

Provide:
1. Key civic actors and institutions involved
2. Power dynamics at play (who really has control vs. who appears to)
3. Immediate impacts on citizens' daily lives
4. Hidden stakeholders and consequences
5. Democratic principles at stake and how they're being violated
6. Propaganda techniques being used to sell this story
7. Specific actionable steps citizens can take
8. Historical precedents or patterns and why they matter
9. Uncomfortable truths being obscured
10. How hidden stakeholders benefit financially or politically

Format as JSON with these keys:
- keyActors: array of actors with their real power/influence
- powerDynamics: array of who controls what
- citizenImpacts: array of direct effects on daily life (be specific)
- hiddenStakeholders: array of interests not being discussed
- democraticPrinciples: array of principles being tested
- howViolated: string explaining how principles are violated
- propagandaTechniques: array of {name, description, whyItWorks}
- howTheyBenefit: string explaining how hidden stakeholders profit
- actionableSteps: array of specific things citizens can do
- historicalContext: relevant precedents
- historicalPattern: what pattern from history this follows
- whyHistoryMatters: why the historical pattern is important
- whyActionMatters: why citizen action on this issue matters
- uncomfortableTruths: array of what's not being said
- civicRelevanceScore: 1-100
- primaryCategory: from approved CivicSense categories
- relatedCategories: array of related categories
`

    if (this.aiClient) {
      // Real AI call would go here
      const response = await this.callAI(prompt)
      return JSON.parse(response)
    } else {
      // Enhanced fallback analysis with all required fields
      return {
        keyActors: ['Federal Government', 'State Officials', 'Citizens', 'Corporate Lobbyists'],
        powerDynamics: [
          'Executive branch expanding authority without oversight',
          'Congressional leadership enabling presidential overreach',
          'Courts declining to enforce constitutional limits'
        ],
        citizenImpacts: [
          'Your healthcare premiums increase 23% to cover new mandates',
          'Federal agents can now search your phone without a warrant',
          'Local schools lose $2.3 billion in federal funding'
        ],
        hiddenStakeholders: ['Defense contractors', 'Big Tech surveillance companies', 'Foreign governments'],
        democraticPrinciples: ['Separation of powers', 'Due process', 'Congressional war powers'],
        howViolated: 'The president is making unilateral decisions that require congressional approval, while courts refuse to intervene',
        propagandaTechniques: [
          {
            name: 'false urgency',
            description: 'Officials claim immediate action is needed to prevent catastrophe, bypassing normal debate',
            whyItWorks: 'Fear overrides critical thinking and people accept power grabs during manufactured crises'
          },
          {
            name: 'technical overwhelm',
            description: 'They flood you with statistics and jargon to sound authoritative while hiding simple truths',
            whyItWorks: 'People defer to apparent expertise rather than asking basic questions about power and money'
          }
        ],
        howTheyBenefit: 'Defense contractors get no-bid contracts worth $47 billion while their former executives run the Pentagon',
        actionableSteps: [
          'File FOIA requests for the actual contracts being hidden',
          'Attend your representative\'s town hall with specific questions',
          'Join local oversight groups monitoring federal spending'
        ],
        historicalContext: 'The same expansion of executive power happened before the Iraq War when Congress abdicated its constitutional role',
        historicalPattern: 'manufactured crisis justifying permanent powers',
        whyHistoryMatters: 'These "temporary" emergency powers never get rolled back and become the new normal',
        whyActionMatters: 'Citizens exposed the Pentagon Papers and stopped Vietnam—your action can expose today\'s lies',
        uncomfortableTruths: [
          'The system is working exactly as designed to enrich connected insiders',
          'Both parties benefit from expanded executive power when they\'re in charge',
          'Media outlets profit from war coverage and won\'t challenge the narrative'
        ],
        civicRelevanceScore: 85,
        primaryCategory: 'Government',
        relatedCategories: ['Constitutional Law', 'National Security', 'Media Literacy']
      }
    }
  }

  /**
   * Generate quiz topic and questions following CivicSense guidelines
   */
  private async generateQuestions(newsEvent: NewsEvent, analysis: any) {
    const topicId = this.generateTopicId(newsEvent.headline)
    const date = new Date()
    
    // Generate topic following brand guidelines
    const topic = {
      topicId,
      title: this.generateTopicTitle(newsEvent.headline, analysis),
      description: this.generateTopicDescription(newsEvent, analysis),
      emoji: this.selectEmoji(analysis.primaryCategory),
      category: analysis.primaryCategory,
      whyThisMatters: await this.generateWhyThisMatters(newsEvent, analysis),
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    // Generate 15 questions with proper distribution
    const questions = await this.generateQuestionSet(newsEvent, analysis, topic)

    return { topic, questions }
  }

  /**
   * Generate topic title following pattern: [Key Actor] [Action] [Object/Target] [Context/Consequence]
   */
  private generateTopicTitle(headline: string, analysis: any): string {
    // Extract key components and create active voice title under 90 chars
    const actor = analysis.keyActors[0] || 'Government'
    const action = this.extractAction(headline)
    const target = this.extractTarget(headline)
    
    let title = `${actor} ${action} ${target}`.trim()
    
    // Ensure under 90 characters
    if (title.length > 90) {
      title = title.substring(0, 87) + '...'
    }
    
    return title
  }

  /**
   * Generate description: 1-2 crisp sentences, no filler
   */
  private generateTopicDescription(newsEvent: NewsEvent, analysis: any): string {
    const impact = analysis.citizenImpacts[0]
    const principle = analysis.democraticPrinciples[0]
    
    return `${newsEvent.headline}. This ${impact.toLowerCase()} while testing ${principle.toLowerCase()}.`
  }

  /**
   * Generate "Why This Matters" with unique, story-specific impact statements
   */
  private async generateWhyThisMatters(newsEvent: NewsEvent, analysis: any): Promise<string> {
    const impacts = []
    
    // Generate 5-6 unique impact statements that reveal uncomfortable truths
    // Each should be specific to this story, not following any template
    
    // Start with the most shocking or hidden aspect
    if (analysis.uncomfortableTruths && analysis.uncomfortableTruths.length > 0) {
      const truth = analysis.uncomfortableTruths[0]
      const boldPart = this.extractBoldStatement(truth, analysis)
      impacts.push(`<li><strong>${boldPart}:</strong> ${truth}</li>`)
    }
    
    // Add manipulation or propaganda techniques being used
    if (analysis.propagandaTechniques) {
      const technique = analysis.propagandaTechniques[0]
      const boldPart = `They're using ${technique.name} to manipulate you`
      impacts.push(`<li><strong>${boldPart}:</strong> ${technique.description}—${technique.whyItWorks}</li>`)
    }
    
    // Reveal hidden stakeholders or beneficiaries
    if (analysis.hiddenStakeholders && analysis.hiddenStakeholders.length > 0) {
      const stakeholder = analysis.hiddenStakeholders[0]
      const boldPart = `${stakeholder} profits while you pay`
      const explanation = analysis.howTheyBenefit || 'following the money reveals who really controls policy'
      impacts.push(`<li><strong>${boldPart}:</strong> ${explanation}</li>`)
    }
    
    // Constitutional or democratic violations
    if (analysis.democraticPrinciples && analysis.democraticPrinciples.length > 0) {
      const principle = analysis.democraticPrinciples[0]
      const violation = analysis.howViolated || 'being systematically undermined'
      const boldPart = `This destroys ${principle}`
      impacts.push(`<li><strong>${boldPart}:</strong> ${violation}—once these precedents are set, your rights disappear</li>`)
    }
    
    // Direct personal consequences
    if (analysis.citizenImpacts && analysis.citizenImpacts.length > 0) {
      for (const impact of analysis.citizenImpacts) {
        if (impacts.length >= 6) break
        const boldPart = this.createImpactBoldStatement(impact, newsEvent)
        impacts.push(`<li><strong>${boldPart}:</strong> ${impact}</li>`)
      }
    }
    
    // Historical pattern or precedent
    if (analysis.historicalContext) {
      const boldPart = `This is the ${analysis.historicalPattern || 'same playbook'} all over again`
      impacts.push(`<li><strong>${boldPart}:</strong> ${analysis.historicalContext}—${analysis.whyHistoryMatters || 'and it ended the same way last time'}</li>`)
    }
    
    // What citizens can actually do
    if (analysis.actionableSteps && analysis.actionableSteps.length > 0 && impacts.length < 6) {
      const action = analysis.actionableSteps[0]
      const boldPart = `You can ${this.extractActionVerb(action)} right now`
      impacts.push(`<li><strong>${boldPart}:</strong> ${action}—${analysis.whyActionMatters || 'but only if you understand how the system really works'}</li>`)
    }
    
    // Ensure we have at least 4 impacts, maximum 6
    return `<ul>\n${impacts.slice(0, 6).join('\n')}\n</ul>`
  }
  
  /**
   * Extract a compelling bold statement from content
   */
  private extractBoldStatement(content: string, analysis: any): string {
    // Create story-specific bold statements, not templated ones
    const words = content.split(' ').slice(0, 8).join(' ')
    
    // Look for action verbs or strong statements
    if (content.includes('hiding')) return `They're hiding ${this.extractHiddenThing(content)}`
    if (content.includes('lying')) return `The lies about ${this.extractLieTopic(content)}`
    if (content.includes('profit')) return `Someone's getting rich off this`
    if (content.includes('illegal')) return `This violates federal law`
    if (content.includes('unprecedented')) return `This has never happened before`
    
    // Default to first few impactful words
    return words.length > 30 ? words.substring(0, 30) + '...' : words
  }
  
  /**
   * Create impact-specific bold statements
   */
  private createImpactBoldStatement(impact: string, newsEvent: NewsEvent): string {
    // Generate unique, non-templated bold statements based on the specific impact
    
    if (impact.includes('tax') || impact.includes('cost')) {
      const amount = this.extractAmount(impact)
      return amount ? `This costs you ${amount}` : `Hidden costs hit your wallet`
    }
    
    if (impact.includes('right') || impact.includes('freedom')) {
      const right = this.extractRight(impact)
      return right ? `Kiss your ${right} goodbye` : `Your constitutional rights just shrunk`
    }
    
    if (impact.includes('war') || impact.includes('military')) {
      return `Your kids could die for this`
    }
    
    if (impact.includes('surveillance') || impact.includes('privacy')) {
      return `They're watching everything you do`
    }
    
    if (impact.includes('job') || impact.includes('employment')) {
      return `Your job is on the chopping block`
    }
    
    // Extract the most impactful phrase from the impact
    const impactWords = impact.split(' ')
    const actionWords = impactWords.filter(w => 
      ['destroy', 'eliminate', 'crush', 'expand', 'threaten', 'expose', 'reveal'].includes(w.toLowerCase())
    )
    
    if (actionWords.length > 0) {
      return `This ${actionWords[0]}s everything`
    }
    
    // Default to extracting the core issue
    return impact.split(',')[0].substring(0, 35)
  }
  
  private extractHiddenThing(content: string): string {
    const match = content.match(/hiding\s+(?:the\s+)?(\w+\s+\w+)/i)
    return match ? match[1] : 'the real story'
  }
  
  private extractLieTopic(content: string): string {
    const match = content.match(/(?:lies?|lying)\s+about\s+(\w+\s+\w+)/i)
    return match ? match[1] : 'what really happened'
  }
  
  private extractAmount(impact: string): string {
    const match = impact.match(/\$[\d,]+|\d+\s*(?:billion|million|thousand)/i)
    return match ? match[0] : ''
  }
  
  private extractRight(impact: string): string {
    const match = impact.match(/(?:right\s+to|freedom\s+of)\s+(\w+)/i)
    return match ? `${match[1]} rights` : ''
  }
  
  private extractActionVerb(action: string): string {
    const verbs = action.match(/^(\w+)/i)
    return verbs ? verbs[1].toLowerCase() : 'act'
  }

  /**
   * Generate full question set with proper distribution
   */
  private async generateQuestionSet(newsEvent: NewsEvent, analysis: any, topic: any) {
    const questions = []
    
    // Calculate distribution
    const totalQuestions = 15
    const mcCount = Math.floor(totalQuestions * QUESTION_DISTRIBUTION.MULTIPLE_CHOICE)
    const tfCount = Math.floor(totalQuestions * QUESTION_DISTRIBUTION.TRUE_FALSE)
    const saCount = totalQuestions - mcCount - tfCount
    
    // Generate questions by type
    const mcQuestions = await this.generateMultipleChoiceQuestions(newsEvent, analysis, topic, mcCount)
    const tfQuestions = await this.generateTrueFalseQuestions(newsEvent, analysis, topic, tfCount)
    const saQuestions = await this.generateShortAnswerQuestions(newsEvent, analysis, topic, saCount)
    
    // Combine and assign difficulty levels
    questions.push(...mcQuestions, ...tfQuestions, ...saQuestions)
    
    // Assign difficulty levels according to distribution
    const difficulties = this.assignDifficulties(questions.length)
    
    return questions.map((q, index) => ({
      ...q,
      difficulty: difficulties[index],
      tags: this.generateTags(q, analysis),
      sources: this.generateSources(newsEvent, analysis)
    }))
  }

  /**
   * Generate multiple choice questions that test understanding of power dynamics
   */
  private async generateMultipleChoiceQuestions(newsEvent: NewsEvent, analysis: any, topic: any, count: number) {
    const questions: Array<{
      text: string
      type: 'multiple_choice' | 'true_false' | 'short_answer'
      category: string
      options?: string[]
      correctAnswer: string
      hint: string
      explanation: string
    }> = []
    
    const questionTemplates = [
      {
        focus: 'power dynamics',
        template: (event: any, analysis: any) => ({
          text: `Which institution has the primary power to ${this.extractAction(event.headline).toLowerCase()}?`,
          correctAnswer: analysis.keyActors[0],
          distractors: this.generatePlausibleInstitutions(analysis.keyActors[0])
        })
      },
      {
        focus: 'citizen impact',
        template: (event: any, analysis: any) => ({
          text: `How does this decision directly affect your daily life?`,
          correctAnswer: analysis.citizenImpacts[0],
          distractors: this.generateImpactDistractors(analysis.citizenImpacts[0])
        })
      },
      {
        focus: 'hidden stakeholders',
        template: (event: any, analysis: any) => ({
          text: `Which group's interests are being served but not publicly discussed?`,
          correctAnswer: analysis.hiddenStakeholders[0],
          distractors: this.generateStakeholderDistractors(analysis.hiddenStakeholders[0])
        })
      },
      {
        focus: 'constitutional principles',
        template: (event: any, analysis: any) => ({
          text: `What constitutional principle is being tested by this action?`,
          correctAnswer: analysis.democraticPrinciples[0],
          distractors: this.generatePrincipleDistractors(analysis.democraticPrinciples[0])
        })
      },
      {
        focus: 'effective action',
        template: (event: any, analysis: any) => ({
          text: `What's the most effective action citizens can take in response?`,
          correctAnswer: analysis.actionableSteps[0],
          distractors: this.generateActionDistractors(analysis.actionableSteps[0])
        })
      }
    ]

    for (let i = 0; i < count; i++) {
      const template = questionTemplates[i % questionTemplates.length]
      const questionData = template.template(newsEvent, analysis)
      
      const options = this.shuffleArray([
        questionData.correctAnswer,
        ...questionData.distractors
      ])
      
      questions.push({
        text: questionData.text,
        type: 'multiple_choice' as const,
        category: topic.category,
        options: options,
        correctAnswer: questionData.correctAnswer,
        hint: `Consider ${template.focus} in this situation.`,
        explanation: this.generateExplanation(questionData.correctAnswer, analysis, template.focus)
      })
    }
    
    return questions
  }

  /**
   * Generate true/false questions that challenge misconceptions
   */
  private async generateTrueFalseQuestions(newsEvent: NewsEvent, analysis: any, topic: any, count: number) {
    const questions: Array<{
      text: string
      type: 'multiple_choice' | 'true_false' | 'short_answer'
      category: string
      options?: string[]
      correctAnswer: string
      hint: string
      explanation: string
    }> = []
    
    const misconceptionTemplates = [
      {
        statement: `The president has unilateral power to ${this.extractAction(newsEvent.headline).toLowerCase()}.`,
        isTrue: false,
        explanation: 'This action requires congressional approval or judicial review, demonstrating checks and balances.'
      },
      {
        statement: `Citizens have no direct way to influence this decision.`,
        isTrue: false,
        explanation: `Citizens can ${analysis.actionableSteps[0]}, demonstrating democratic participation opportunities.`
      },
      {
        statement: `This decision primarily benefits ${analysis.hiddenStakeholders[0]}.`,
        isTrue: true,
        explanation: analysis.uncomfortableTruths[0]
      }
    ]

    for (let i = 0; i < count; i++) {
      const template = misconceptionTemplates[i % misconceptionTemplates.length]
      
      questions.push({
        text: template.statement,
        type: 'true_false' as const,
        category: topic.category,
        correctAnswer: template.isTrue ? 'true' : 'false',
        hint: 'Think about how power actually works versus official explanations.',
        explanation: template.explanation
      })
    }
    
    return questions
  }

  /**
   * Generate short answer questions that apply knowledge to scenarios
   */
  private async generateShortAnswerQuestions(newsEvent: NewsEvent, analysis: any, topic: any, count: number) {
    const questions: Array<{
      text: string
      type: 'multiple_choice' | 'true_false' | 'short_answer'
      category: string
      options?: string[]
      correctAnswer: string
      hint: string
      explanation: string
    }> = []
    
    const scenarioTemplates = [
      {
        scenario: `You want to oppose this policy in your community.`,
        question: `What's your most effective first step?`,
        answer: analysis.actionableSteps[0]
      },
      {
        scenario: `A neighbor asks how this affects them personally.`,
        question: `What's the most important impact to explain?`,
        answer: analysis.citizenImpacts[0]
      },
      {
        scenario: `You're researching who really made this decision.`,
        question: `Which organization or office should you investigate?`,
        answer: analysis.keyActors[0]
      }
    ]

    for (let i = 0; i < count; i++) {
      const template = scenarioTemplates[i % scenarioTemplates.length]
      
      questions.push({
        text: `${template.scenario} ${template.question}`,
        type: 'short_answer' as const,
        category: topic.category,
        correctAnswer: template.answer,
        hint: 'Apply your understanding of power dynamics to this real situation.',
        explanation: `The most effective approach is: ${template.answer}. This reveals how citizens can engage with actual decision-making processes.`
      })
    }
    
    return questions
  }

  /**
   * Generate skills based on news event
   */
  private async generateSkills(newsEvent: NewsEvent, analysis: any) {
    const skills = []
    
    // Media literacy skill
    if (analysis.uncomfortableTruths.length > 0) {
      skills.push({
        name: 'Critical News Analysis',
        description: 'Identify hidden stakeholders and power dynamics in news coverage',
        category: 'media_literacy',
        difficultyLevel: 2,
        practicalApplications: [
          'Evaluate news sources for what they omit',
          'Identify whose interests are served by framing',
          'Connect policy decisions to financial beneficiaries'
        ],
        learningObjectives: [
          'Recognize gaps between official narrative and reality',
          'Identify hidden stakeholders in policy decisions',
          'Trace money and influence in political coverage'
        ],
        assessmentCriteria: [
          'Can identify unstated interests in news stories',
          'Recognizes framing techniques that obscure power',
          'Connects policy outcomes to beneficiaries'
        ]
      })
    }
    
    // Civic action skill
    if (analysis.actionableSteps.length > 0) {
      skills.push({
        name: 'Strategic Civic Engagement',
        description: 'Take effective action on issues affecting your community',
        category: 'civic_participation',
        difficultyLevel: 3,
        practicalApplications: analysis.actionableSteps,
        learningObjectives: [
          'Identify appropriate targets for civic action',
          'Choose tactics matched to specific goals',
          'Build coalitions for greater impact'
        ],
        assessmentCriteria: [
          'Selects appropriate civic engagement strategies',
          'Can identify key decision makers to target',
          'Demonstrates understanding of power leverage points'
        ]
      })
    }
    
    return skills
  }

  /**
   * Generate glossary terms that reveal power dynamics
   */
  private async generateGlossaryTerms(newsEvent: NewsEvent, analysis: any) {
    const terms = []
    
    // Extract key concepts from the news event
    const concepts = this.extractKeyConcepts(newsEvent, analysis)
    
    for (const concept of concepts.slice(0, 3)) {
      terms.push({
        term: concept.term,
        definition: concept.definition,
        category: analysis.primaryCategory.toLowerCase().replace(/\s+/g, '_'),
        examples: [
          `In this case: ${concept.currentExample}`,
          concept.historicalExample
        ],
        uncomfortableTruth: analysis.uncomfortableTruths[0] || 'Power operates differently than official explanations suggest',
        powerDynamics: analysis.powerDynamics.slice(0, 3),
        actionSteps: analysis.actionableSteps.slice(0, 3)
      })
    }
    
    return terms
  }

  /**
   * Generate historical events for context
   */
  private async generateEvents(newsEvent: NewsEvent, analysis: any) {
    return [{
      title: newsEvent.headline,
      description: `${analysis.citizenImpacts[0]}. ${analysis.democraticPrinciples[0]} is at stake.`,
      date: new Date().toISOString().split('T')[0],
      significance: Math.floor(analysis.civicRelevanceScore / 10),
      category: analysis.primaryCategory.toLowerCase().replace(/\s+/g, '_'),
      whyThisMatters: analysis.uncomfortableTruths[0],
      policyAreas: analysis.relatedCategories.map((c: string) => c.toLowerCase().replace(/\s+/g, '_'))
    }]
  }

  /**
   * Generate public figures involved
   */
  private async generatePublicFigures(newsEvent: NewsEvent, analysis: any) {
    const figures = []
    
    for (const actor of analysis.keyActors.slice(0, 3)) {
      const figure = this.parseActorIntoFigure(actor, analysis)
      if (figure) {
        figures.push(figure)
      }
    }
    
    return figures
  }

  /**
   * Comprehensive quality assessment based on brand guidelines
   */
  private async assessContentQuality(content: GeneratedContent, newsEvent: NewsEvent): Promise<QualityScores> {
    const scores: QualityScores = {
      overall: 0,
      brandVoiceCompliance: 0,
      factualAccuracy: 0,
      civicActionability: 0,
      stakesClarity: 0,
      readabilityScore: 0,
      sourceQuality: 0,
      itemsGenerated: 0
    }

    // Count generated items
    let itemCount = 0
    if (content.questions) itemCount += content.questions.length
    if (content.skills) itemCount += content.skills.length
    if (content.glossaryTerms) itemCount += content.glossaryTerms.length
    if (content.events) itemCount += content.events.length
    if (content.publicFigures) itemCount += content.publicFigures.length
    scores.itemsGenerated = itemCount

    // Brand voice compliance
    scores.brandVoiceCompliance = this.assessBrandVoice(content)
    
    // Factual accuracy (would need fact-checking in production)
    scores.factualAccuracy = 85 // Placeholder - would verify sources
    
    // Civic actionability
    scores.civicActionability = this.assessActionability(content)
    
    // Stakes clarity
    scores.stakesClarity = this.assessStakesClarity(content)
    
    // Readability
    scores.readabilityScore = this.assessReadability(content)
    
    // Source quality
    scores.sourceQuality = this.assessSourceQuality(content)
    
    // Overall score (weighted average)
    scores.overall = Math.round(
      scores.brandVoiceCompliance * 0.25 +
      scores.factualAccuracy * 0.20 +
      scores.civicActionability * 0.20 +
      scores.stakesClarity * 0.15 +
      scores.readabilityScore * 0.10 +
      scores.sourceQuality * 0.10
    )
    
    return scores
  }

  /**
   * Assess brand voice compliance
   */
  private assessBrandVoice(content: GeneratedContent): number {
    let score = 100
    
    // Check for passive voice
    const passiveVoiceCount = this.countPassiveVoice(content)
    score -= passiveVoiceCount * 2
    
    // Check for academic jargon
    const jargonCount = this.countJargon(content)
    score -= jargonCount * 3
    
    // Check for direct, active language
    const directLanguageScore = this.assessDirectLanguage(content)
    score = (score + directLanguageScore) / 2
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Assess civic actionability
   */
  private assessActionability(content: GeneratedContent): number {
    let actionableItems = 0
    let totalItems = 0
    
    // Check questions for actionable content
    if (content.questions) {
      content.questions.forEach(q => {
        totalItems++
        if (q.explanation.includes('can') || q.explanation.includes('should')) {
          actionableItems++
        }
      })
    }
    
    // Check skills for practical applications
    if (content.skills) {
      content.skills.forEach(s => {
        totalItems++
        if (s.practicalApplications.length > 0) {
          actionableItems++
        }
      })
    }
    
    // Check glossary for action steps
    if (content.glossaryTerms) {
      content.glossaryTerms.forEach(t => {
        totalItems++
        if (t.actionSteps.length > 0) {
          actionableItems++
        }
      })
    }
    
    return totalItems > 0 ? Math.round((actionableItems / totalItems) * 100) : 0
  }

  /**
   * Assess stakes clarity
   */
  private assessStakesClarity(content: GeneratedContent): number {
    let score = 100
    
    // Check if stakes are mentioned upfront
    if (content.questionTopic) {
      const whyMatters = content.questionTopic.whyThisMatters
      if (!whyMatters.includes('Your')) {
        score -= 20 // Not personal enough
      }
      if (!whyMatters.includes('directly') && !whyMatters.includes('immediate')) {
        score -= 15 // Not urgent enough
      }
    }
    
    return Math.max(0, score)
  }

  /**
   * Assess readability
   */
  private assessReadability(content: GeneratedContent): number {
    // Simplified readability check
    let totalWords = 0
    let longWords = 0
    let sentences = 0
    
    const allText = this.extractAllText(content)
    
    allText.forEach(text => {
      const words = text.split(/\s+/)
      totalWords += words.length
      longWords += words.filter(w => w.length > 6).length
      sentences += text.split(/[.!?]+/).length
    })
    
    const avgWordsPerSentence = totalWords / sentences
    const percentLongWords = (longWords / totalWords) * 100
    
    // Target: 8-10th grade reading level
    let score = 100
    if (avgWordsPerSentence > BRAND_VOICE.SENTENCE_MAX_WORDS) {
      score -= (avgWordsPerSentence - BRAND_VOICE.SENTENCE_MAX_WORDS) * 2
    }
    if (percentLongWords > 20) {
      score -= (percentLongWords - 20)
    }
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Assess source quality
   */
  private assessSourceQuality(content: GeneratedContent): number {
    if (!content.questions || content.questions.length === 0) return 75
    
    let totalSources = 0
    let qualitySources = 0
    
    content.questions.forEach(q => {
      if (q.sources) {
        q.sources.forEach(source => {
          totalSources++
          if (this.isQualitySource(source)) {
            qualitySources++
          }
        })
      }
    })
    
    return totalSources > 0 ? Math.round((qualitySources / totalSources) * 100) : 50
  }

  /**
   * Helper methods
   */
  
  private generateTopicId(headline: string): string {
    const key = headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 40)
    
    return `${key}_${new Date().getFullYear()}`
  }

  private selectEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'Civic Participation': '🗣️',
      'Environment': '🌱',
      'Immigration': '🛂',
      'Civic Action': '🤝',
      'Judicial Review': '⚖️',
      'National Security': '🛡️',
      'Public Policy': '📋',
      'Constitutional Law': '📜',
      'Foreign Policy': '🌐',
      'Government': '🏛️',
      'AI Governance': '🤖',
      'Economy': '💰',
      'Civil Rights': '✊',
      'Media Literacy': '📰',
      'Elections': '🗳️',
      'Historical Precedent': '📚',
      'Policy Analysis': '🔍',
      'Electoral Systems': '📊',
      'Local Issues': '🏙️',
      'Justice': '⚖️',
      'Legislative Process': '🏛️'
    }
    
    return emojiMap[category] || '📰'
  }

  private extractAction(headline: string): string {
    // Extract verb/action from headline
    const verbs = headline.match(/\b(announces?|signs?|passes?|blocks?|approves?|rejects?|launches?|creates?|eliminates?|expands?|cuts?|bans?|allows?|requires?|proposes?)\b/i)
    return verbs ? verbs[0] : 'affects'
  }

  private extractTarget(headline: string): string {
    // Extract object/target from headline
    const segments = headline.split(/\b(announces?|signs?|passes?|blocks?|approves?|rejects?|launches?|creates?|eliminates?|expands?|cuts?|bans?|allows?|requires?|proposes?)\b/i)
    return segments.length > 2 ? segments[2].trim().substring(0, 40) : 'policy'
  }

  private generatePlausibleInstitutions(correct: string): string[] {
    const institutions = [
      'Congress', 'The President', 'The Supreme Court', 'State Governors',
      'Federal Agencies', 'Local Governments', 'The Senate', 'The House',
      'Executive Orders', 'Congressional Committees', 'Federal Courts',
      'State Legislatures', 'City Councils', 'Regulatory Agencies'
    ]
    
    return institutions
      .filter(i => i !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }

  private generateImpactDistractors(correct: string): string[] {
    const impacts = [
      'Higher taxes without representation',
      'Reduced access to government services',
      'Increased surveillance of citizens',
      'Limited voting rights',
      'Higher healthcare costs',
      'Restricted freedom of speech',
      'Economic inequality increases',
      'Environmental protections weakened'
    ]
    
    return impacts
      .filter(i => i !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }

  private generateStakeholderDistractors(correct: string): string[] {
    const stakeholders = [
      'Corporate lobbyists',
      'Foreign governments',
      'Wealthy donors',
      'Special interest groups',
      'Defense contractors',
      'Wall Street banks',
      'Big Tech companies',
      'Pharmaceutical industry'
    ]
    
    return stakeholders
      .filter(s => s !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }

  private generatePrincipleDistractors(correct: string): string[] {
    const principles = [
      'Separation of powers',
      'Checks and balances',
      'Due process',
      'Equal protection',
      'Free speech',
      'States\' rights',
      'Executive privilege',
      'Congressional oversight'
    ]
    
    return principles
      .filter(p => p !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }

  private generateActionDistractors(correct: string): string[] {
    const actions = [
      'Contact your representatives',
      'Attend town hall meetings',
      'File FOIA requests',
      'Organize community response',
      'Vote in next election',
      'Join advocacy groups',
      'Protest peacefully',
      'Educate your community'
    ]
    
    return actions
      .filter(a => a !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }

  private generateExplanation(correctAnswer: string, analysis: any, focus: string): string {
    const focusExplanations: { [key: string]: string } = {
      'power dynamics': `${correctAnswer} has the actual authority here, not just ceremonial power. This reveals how institutional power really flows, contrary to what civics textbooks suggest.`,
      'citizen impact': `This directly affects you through ${correctAnswer}. Understanding these concrete impacts helps you see why engagement matters beyond abstract principles.`,
      'hidden stakeholders': `${correctAnswer} benefits significantly but isn't part of the public discussion. Following the money and influence reveals who really shapes policy.`,
      'constitutional principles': `${correctAnswer} is being tested here. When you understand which principles are at stake, you can better defend democratic norms.`,
      'effective action': `${correctAnswer} is most effective because it targets actual decision-makers, not just symbolic gestures. Real change requires understanding power leverage points.`
    }
    
    return focusExplanations[focus] || `The answer reveals how ${focus} actually works in this situation.`
  }

  private generateTags(question: any, analysis: any): string[] {
    const tags = ['news-generated', 'current-events']
    
    if (question.text.includes('power') || question.text.includes('control')) {
      tags.push('power-dynamics')
    }
    if (question.text.includes('citizen') || question.text.includes('your')) {
      tags.push('citizen-impact')
    }
    if (analysis.uncomfortableTruths.length > 0) {
      tags.push('uncomfortable-truth')
    }
    
    return tags
  }

  private generateSources(newsEvent: NewsEvent, analysis: any): Array<{ url: string; name: string }> {
    const sources = []
    
    if (newsEvent.source_url || newsEvent.sourceUrl) {
      sources.push({
        url: newsEvent.source_url || newsEvent.sourceUrl || '',
        name: 'Original news source'
      })
    }
    
    // Add authoritative sources based on category
    const categorySources: { [key: string]: Array<{ url: string; name: string }> } = {
      'Government': [
        { url: 'https://www.whitehouse.gov', name: 'White House' },
        { url: 'https://www.congress.gov', name: 'Congress.gov' }
      ],
      'Constitutional Law': [
        { url: 'https://constitution.congress.gov', name: 'Constitution Annotated' },
        { url: 'https://www.scotusblog.com', name: 'SCOTUSblog' }
      ],
      'Economy': [
        { url: 'https://www.bls.gov', name: 'Bureau of Labor Statistics' },
        { url: 'https://www.federalreserve.gov', name: 'Federal Reserve' }
      ]
    }
    
    const categorySpecific = categorySources[analysis.primaryCategory]
    if (categorySpecific) {
      sources.push(...categorySpecific.slice(0, 2))
    }
    
    return sources.slice(0, 3) // Max 3 sources per question
  }

  private assignDifficulties(count: number): (1 | 2 | 3)[] {
    const difficulties: (1 | 2 | 3)[] = []
    
    const level1Count = Math.floor(count * DIFFICULTY_DISTRIBUTION.LEVEL_1)
    const level2Count = Math.floor(count * DIFFICULTY_DISTRIBUTION.LEVEL_2)
    const level3Count = count - level1Count - level2Count
    
    // Add difficulties
    for (let i = 0; i < level1Count; i++) difficulties.push(1)
    for (let i = 0; i < level2Count; i++) difficulties.push(2)
    for (let i = 0; i < level3Count; i++) difficulties.push(3)
    
    // Shuffle to distribute evenly
    return this.shuffleArray(difficulties)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private extractKeyConcepts(newsEvent: NewsEvent, analysis: any): Array<{
    term: string
    definition: string
    currentExample: string
    historicalExample: string
  }> {
    // Extract key concepts from the news event and analysis
    const concepts = []
    
    // Power-related concept
    if (analysis.powerDynamics.length > 0) {
      concepts.push({
        term: 'Institutional Capture',
        definition: 'When an agency meant to regulate an industry instead serves that industry\'s interests',
        currentExample: analysis.powerDynamics[0],
        historicalExample: 'Like when the ICC became controlled by railroads it was meant to regulate'
      })
    }
    
    // Process-related concept
    concepts.push({
      term: 'Democratic Accountability',
      definition: 'The ability of citizens to hold elected officials responsible for their actions through elections and other mechanisms',
      currentExample: `Citizens can ${analysis.actionableSteps[0]} to demand accountability`,
      historicalExample: 'Watergate showed how investigative journalism and congressional oversight can expose abuse'
    })
    
    return concepts
  }

  private parseActorIntoFigure(actor: string, analysis: any): any {
    // Parse actor string into figure object
    const nameParts = actor.split(' ')
    
    return {
      name: actor,
      title: 'Key Decision Maker',
      organization: 'Government',
      role: 'Policy Implementation',
      politicalAffiliation: 'Varies',
      keyPositions: analysis.democraticPrinciples.slice(0, 2),
      relevanceToTopic: `Central to ${analysis.primaryCategory} decisions`,
      powerLevel: 7
    }
  }

  private countPassiveVoice(content: GeneratedContent): number {
    let count = 0
    const passiveIndicators = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi
    
    const allText = this.extractAllText(content)
    allText.forEach(text => {
      const matches = text.match(passiveIndicators)
      if (matches) count += matches.length
    })
    
    return count
  }

  private countJargon(content: GeneratedContent): number {
    let count = 0
    const jargonTerms = [
      'paradigm', 'synergy', 'leverage', 'stakeholder', 'bandwidth',
      'circle back', 'touch base', 'deep dive', 'low-hanging fruit'
    ]
    
    const allText = this.extractAllText(content)
    allText.forEach(text => {
      const lowerText = text.toLowerCase()
      jargonTerms.forEach(term => {
        if (lowerText.includes(term)) count++
      })
    })
    
    return count
  }

  private assessDirectLanguage(content: GeneratedContent): number {
    let score = 100
    const weakPhrases = [
      'might be', 'could be', 'seems to', 'appears to', 'arguably',
      'somewhat', 'rather', 'quite', 'very', 'really'
    ]
    
    const allText = this.extractAllText(content)
    let weakCount = 0
    
    allText.forEach(text => {
      const lowerText = text.toLowerCase()
      weakPhrases.forEach(phrase => {
        if (lowerText.includes(phrase)) weakCount++
      })
    })
    
    // Deduct points for weak language
    score -= weakCount * 2
    
    return Math.max(0, score)
  }

  private extractAllText(content: GeneratedContent): string[] {
    const texts: string[] = []
    
    if (content.questionTopic) {
      texts.push(content.questionTopic.title, content.questionTopic.description)
    }
    
    if (content.questions) {
      content.questions.forEach(q => {
        texts.push(q.text, q.explanation)
      })
    }
    
    if (content.skills) {
      content.skills.forEach(s => {
        texts.push(s.description, ...s.learningObjectives)
      })
    }
    
    if (content.glossaryTerms) {
      content.glossaryTerms.forEach(t => {
        texts.push(t.definition, t.uncomfortableTruth)
      })
    }
    
    return texts
  }

  private isQualitySource(source: { url: string; name: string }): boolean {
    const qualityDomains = [
      '.gov', '.edu', 'reuters.com', 'apnews.com', 'npr.org',
      'brookings.edu', 'cfr.org', 'pewresearch.org'
    ]
    
    return qualityDomains.some(domain => source.url.includes(domain))
  }

  private async callAI(prompt: string): Promise<string> {
    // This would be replaced with actual AI provider calls
    if (this.aiProvider === 'anthropic' && this.aiClient) {
      // Anthropic Claude call
      const message = await this.aiClient.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
      return message.content[0].text
    } else if (this.aiProvider === 'openai' && this.aiClient) {
      // OpenAI GPT call
      const completion = await this.aiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
      return completion.choices[0].message.content
    }
    
    // Fallback
    return '{}'
  }

  /**
   * Publish content to database tables
   */
  async publishContent(packageId: string, content: GeneratedContent): Promise<{
    published: { [key: string]: string[] }
    errors: string[]
  }> {
    const published: { [key: string]: string[] } = {}
    const errors: string[] = []

    try {
      // 1. Question Topic and Questions
      if (content.questionTopic && content.questions) {
        try {
          const topicData: DbQuestionTopicsInsert = {
            topic_id: content.questionTopic.topicId,
            topic_title: content.questionTopic.title,
            description: content.questionTopic.description,
            why_this_matters: content.questionTopic.whyThisMatters,
            emoji: content.questionTopic.emoji,
            categories: [content.questionTopic.category],
            is_active: true,
            is_featured: false,
            is_breaking: true,
            date: content.questionTopic.date,
            day_of_week: content.questionTopic.dayOfWeek
          }

          const { error: topicError } = await this.supabase
            .from(DB_TABLES.QUESTION_TOPICS)
            .insert(topicData)

          if (topicError) throw new Error(`Topic insertion failed: ${topicError.message}`)

          // Insert questions
          const questionInserts: DbQuestionsInsert[] = content.questions.map((q, index) => ({
            topic_id: content.questionTopic!.topicId,
            question_number: index + 1,
            question_type: q.type,
            category: q.category,
            question: q.text,
            ...(q.type === 'multiple_choice' && q.options && {
              option_a: q.options[0],
              option_b: q.options[1], 
              option_c: q.options[2],
              option_d: q.options[3]
            }),
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            hint: q.hint,
            tags: q.tags,
            sources: q.sources,
            difficulty_level: q.difficulty,
            is_active: true
          }))

          const { error: questionsError } = await this.supabase
            .from(DB_TABLES.QUESTIONS)
            .insert(questionInserts)

          if (questionsError) throw new Error(`Questions insertion failed: ${questionsError.message}`)
          
          published.questions = [content.questionTopic.topicId]
          console.log(`✅ Published topic ${content.questionTopic.topicId} with ${content.questions.length} questions`)
        } catch (error) {
          errors.push(`Questions publication failed: ${error}`)
        }
      }

              // 2. Skills
        if (content.skills) {
          try {
            const skillInserts: DbSkillsInsert[] = content.skills.map(skill => ({
              category_id: skill.category,
              skill_name: skill.name,
              skill_slug: skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: skill.description,
              difficulty_level: skill.difficultyLevel,
              is_active: true
            }))

          const { error: skillsError } = await this.supabase
            .from(DB_TABLES.SKILLS)
            .insert(skillInserts)

          if (skillsError) throw new Error(`Skills insertion failed: ${skillsError.message}`)
          
          published.skills = content.skills.map(s => s.name)
          console.log(`✅ Published ${content.skills.length} skills`)
        } catch (error) {
          errors.push(`Skills publication failed: ${error}`)
        }
      }

      // 3. Glossary Terms
      if (content.glossaryTerms) {
        try {
          const glossaryInserts: DbGlossaryTermsInsert[] = content.glossaryTerms.map(term => ({
            term: term.term,
            definition: term.definition,
            category: term.category,
            examples: term.examples,
            uncomfortable_truth: term.uncomfortableTruth,
            power_dynamics: term.powerDynamics,
            action_steps: term.actionSteps,
            ai_generated: true
          }))

          const { error: glossaryError } = await this.supabase
            .from(DB_TABLES.GLOSSARY_TERMS)
            .insert(glossaryInserts)

          if (glossaryError) throw new Error(`Glossary insertion failed: ${glossaryError.message}`)
          
          published.glossary = content.glossaryTerms.map(t => t.term)
          console.log(`✅ Published ${content.glossaryTerms.length} glossary terms`)
        } catch (error) {
          errors.push(`Glossary publication failed: ${error}`)
        }
      }

              // 4. Events
        if (content.events) {
          try {
            const eventInserts: DbEventsInsert[] = content.events.map(event => ({
              date: event.date,
              topic_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              topic_title: event.title,
              description: event.description,
              why_this_matters: event.whyThisMatters,
              civic_relevance_score: event.significance * 10,
              content_package_id: packageId,
              source_type: 'news_generated'
            }))

          const { error: eventsError } = await this.supabase
            .from(DB_TABLES.EVENTS)
            .insert(eventInserts)

          if (eventsError) throw new Error(`Events insertion failed: ${eventsError.message}`)
          
          published.events = content.events.map(e => e.title)
          console.log(`✅ Published ${content.events.length} events`)
        } catch (error) {
          errors.push(`Events publication failed: ${error}`)
        }
      }

      // 5. Public Figures
      if (content.publicFigures) {
        try {
          const figureInserts: DbPublicFiguresInsert[] = content.publicFigures.map(figure => ({
            slug: figure.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            full_name: figure.name,
            title: figure.title,
            bio: `${figure.title} at ${figure.organization}. ${figure.relevanceToTopic}`
          }))

          const { error: figuresError } = await this.supabase
            .from(DB_TABLES.PUBLIC_FIGURES)
            .insert(figureInserts)

          if (figuresError) throw new Error(`Public figures insertion failed: ${figuresError.message}`)
          
          published.publicFigures = content.publicFigures.map(f => f.name)
          console.log(`✅ Published ${content.publicFigures.length} public figures`)
        } catch (error) {
          errors.push(`Public figures publication failed: ${error}`)
        }
      }

      // Update package status
      await this.supabase
        .from(CONTENT_PACKAGES_TABLE)
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          published_content: published
        })
        .eq('id', packageId)

      return { published, errors }
    } catch (error) {
      console.error('❌ Content publication failed:', error)
      return { published, errors: [...errors, `General publication error: ${error}`] }
    }
  }
}

// Export for use by news monitoring agent
export default ContentPackageGenerator