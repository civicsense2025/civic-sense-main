/**
 * CivicSense Civic Action Generator
 * 
 * Generates specific, actionable civic engagement steps that connect 
 * individual learning to systemic democratic participation.
 * 
 * Mission: Transform passive civic consumers into active democratic participants
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

const ContactInfoSchema = z.object({
  type: z.enum(['elected_official', 'agency', 'organization', 'media']),
  name: z.string(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.array(z.string()).optional(),
  bestContactMethod: z.string(),
  expectedResponseTime: z.string(),
  notes: z.string().optional()
})

const ActionStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['immediate', 'moderate', 'advanced']),
  timeRequired: z.string(),
  impact: z.enum(['individual', 'community', 'systemic']),
  category: z.enum(['contact', 'organize', 'educate', 'vote', 'advocate', 'monitor']),
  specificInstructions: z.array(z.string()),
  contactInfo: ContactInfoSchema.optional(),
  deadlines: z.array(z.string()).optional(),
  leverage_points: z.array(z.string())
})

const ActionGenerationInputSchema = z.object({
  topic: z.string(),
  content: z.string(),
  config: z.object({
    userLocation: z.object({
      state: z.string(),
      district: z.string().optional(),
      city: z.string().optional()
    }).optional(),
    userCapacity: z.enum(['beginner', 'intermediate', 'advanced']),
    preferredActionTypes: z.array(z.enum(['contact', 'organize', 'educate', 'vote', 'advocate', 'monitor'])),
    timeAvailable: z.enum(['minimal', 'moderate', 'substantial']),
    issueUrgency: z.enum(['routine', 'urgent', 'crisis'])
  })
})

const CivicActionPlanSchema = z.object({
  topic: z.string(),
  immediateActions: z.array(ActionStepSchema),
  mediumTermActions: z.array(ActionStepSchema),
  longTermActions: z.array(ActionStepSchema),
  coalitionOpportunities: z.array(z.string()),
  monitoringActions: z.array(ActionStepSchema),
  powerLeveragePoints: z.array(z.string()),
  successMetrics: z.array(z.string()),
  metadata: z.object({
    total_actions_generated: z.number(),
    power_structures_identified: z.number(),
    leverage_points_found: z.number(),
    processing_time_ms: z.number()
  })
})

type ContactInfo = z.infer<typeof ContactInfoSchema>
type ActionStep = z.infer<typeof ActionStepSchema>
type ActionGenerationInput = z.infer<typeof ActionGenerationInputSchema>
type CivicActionPlan = z.infer<typeof CivicActionPlanSchema>

// =============================================================================
// CIVIC ACTION GENERATOR AI TOOL
// =============================================================================

export class CivicActionGeneratorAI extends BaseAITool<ActionGenerationInput, CivicActionPlan> {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private actionTemplates: Map<string, ActionStep[]>
  private officialContacts: Map<string, ContactInfo[]>

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Civic Action Generator',
      type: 'content_generator',
      provider: config?.provider || 'anthropic',
      model: config?.model || 'claude-3-7-sonnet',
      maxRetries: 3,
      retryDelay: 1500,
      timeout: 60000, // 1 minute for action generation
      ...config
    })

    this.actionTemplates = new Map()
    this.officialContacts = new Map()
    this.initializeActionTemplates()
    this.initializeContactDatabase()
  }

  // =============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // =============================================================================

  protected async validateInput(input: ActionGenerationInput): Promise<ActionGenerationInput> {
    return ActionGenerationInputSchema.parse(input)
  }

  protected async processWithAI(input: ActionGenerationInput): Promise<string> {
    await this.initializeProviders()
    
    const startTime = Date.now()
    
    // Step 1: Identify power structures and leverage points
    const powerStructures = this.identifyPowerStructures(input.content)
    const leveragePoints = this.identifyLeveragePoints(input.content, powerStructures)
    
    // Step 2: Generate different types of actions
    const urgentActions = await this.generateUrgentActions(input.topic, input.content, input.config)
    const systematicActions = await this.generateSystematicActions(input.topic, powerStructures, input.config)
    const monitoringActions = await this.generateMonitoringActions(input.topic, input.config)
    
    // Step 3: Identify coalition opportunities and success metrics
    const coalitionOpportunities = this.identifyCoalitionOpportunities(input.topic, powerStructures)
    const successMetrics = this.defineSuccessMetrics(input.topic, powerStructures)
    
    const processingTime = Date.now() - startTime
    
    return JSON.stringify({
      topic: input.topic,
      immediateActions: urgentActions.filter(a => a.difficulty === 'immediate'),
      mediumTermActions: systematicActions.filter(a => a.difficulty === 'moderate'),
      longTermActions: systematicActions.filter(a => a.difficulty === 'advanced'),
      coalitionOpportunities,
      monitoringActions,
      powerLeveragePoints: leveragePoints,
      successMetrics,
      metadata: {
        total_actions_generated: urgentActions.length + systematicActions.length + monitoringActions.length,
        power_structures_identified: powerStructures.length,
        leverage_points_found: leveragePoints.length,
        processing_time_ms: processingTime
      }
    })
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<CivicActionPlan> {
    const parsed = await this.parseJSON(rawOutput)
    return this.cleanOutput(parsed.content || parsed)
  }

  protected async validateOutput(output: CivicActionPlan): Promise<CivicActionPlan> {
    const validated = CivicActionPlanSchema.parse(output)
    
    // Quality validation
    if (validated.immediateActions.length === 0) {
      throw new Error('No immediate actions were generated - users need actionable steps')
    }
    
    if (validated.powerLeveragePoints.length === 0) {
      throw new Error('No leverage points identified - actions lack strategic focus')
    }
    
    // Ensure CivicSense action characteristics
    const allActions = [
      ...validated.immediateActions,
      ...validated.mediumTermActions,
      ...validated.longTermActions,
      ...validated.monitoringActions
    ]
    
    for (const action of allActions) {
      if (!action.specificInstructions || action.specificInstructions.length < 2) {
        throw new Error(`Action "${action.title}" lacks specific instructions`)
      }
      
      if (!action.leverage_points || action.leverage_points.length === 0) {
        throw new Error(`Action "${action.title}" doesn't identify leverage points`)
      }
    }
    
    return validated
  }

  protected async saveToSupabase(data: CivicActionPlan): Promise<CivicActionPlan> {
    try {
      const supabase = createServiceClient()

      // Save the civic action plan
      const { data: savedPlan, error: planError } = await supabase
        .from('civic_action_plans')
        .insert({
          topic: data.topic,
          immediate_actions: data.immediateActions,
          medium_term_actions: data.mediumTermActions,
          long_term_actions: data.longTermActions,
          coalition_opportunities: data.coalitionOpportunities,
          monitoring_actions: data.monitoringActions,
          power_leverage_points: data.powerLeveragePoints,
          success_metrics: data.successMetrics,
          metadata: data.metadata,
          generated_at: new Date().toISOString(),
          ai_tool_used: this.config.name,
          ai_model: this.config.model
        })
        .select()
        .single()

      if (planError) {
        console.error('Error saving action plan:', planError)
      }

      // Save individual action steps for easier querying
      const allActions = [
        ...data.immediateActions,
        ...data.mediumTermActions,
        ...data.longTermActions,
        ...data.monitoringActions
      ]

      for (const action of allActions) {
        const { error: actionError } = await supabase
          .from('action_steps')
          .insert({
            plan_id: savedPlan?.id,
            action_id: action.id,
            title: action.title,
            description: action.description,
            difficulty: action.difficulty,
            time_required: action.timeRequired,
            impact: action.impact,
            category: action.category,
            specific_instructions: action.specificInstructions,
            contact_info: action.contactInfo,
            deadlines: action.deadlines,
            leverage_points: action.leverage_points,
            is_active: true
          })

        if (actionError) {
          console.error('Error saving action step:', actionError)
        }
      }

      // Log activity
      await this.logActivity('civic_action_plan_generated', {
        topic: data.topic,
        total_actions: allActions.length,
        immediate_actions: data.immediateActions.length,
        medium_term_actions: data.mediumTermActions.length,
        long_term_actions: data.longTermActions.length,
        power_leverage_points: data.powerLeveragePoints.length
      })

      return data

    } catch (error) {
      console.error('Error saving civic action plan to Supabase:', error)
      throw new Error(`Failed to save civic action plan: ${error}`)
    }
  }

  // =============================================================================
  // CIVIC ACTION GENERATION
  // =============================================================================

  private async initializeProviders() {
    if (this.config.provider === 'openai' && !this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    
    if (this.config.provider === 'anthropic' && !this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
  }

  /**
   * Generate immediate action steps (can be done today)
   */
  private async generateUrgentActions(
    topic: string,
    content: string,
    config: any
  ): Promise<ActionStep[]> {
    const actions: ActionStep[] = []
    
    // Contact elected officials
    if (config.preferredActionTypes.includes('contact')) {
      const contacts = await this.getRelevantContacts(topic, config.userLocation)
      contacts.slice(0, 3).forEach((contact: ContactInfo, index: number) => {
        actions.push({
          id: `contact-${index}`,
          title: `Contact ${contact.name}`,
          description: `Voice your concerns about ${topic} directly to decision-makers`,
          difficulty: 'immediate',
          timeRequired: '10-15 minutes',
          impact: 'individual',
          category: 'contact',
          specificInstructions: [
            `Call ${contact.name} at ${contact.phone || 'their office'}`,
            'State your name and that you are a constituent',
            `Express your position on ${topic}`,
            'Ask for their specific position and voting record',
            'Request a written response to your concerns'
          ],
          contactInfo: contact,
          leverage_points: this.getContactLeveragePoints(contact, topic)
        })
      })
    }

    // Share knowledge with network
    if (config.preferredActionTypes.includes('educate')) {
      actions.push({
        id: 'educate-network',
        title: 'Educate Your Network',
        description: 'Share what you learned with friends and family',
        difficulty: 'immediate',
        timeRequired: '5 minutes',
        impact: 'community',
        category: 'educate',
        specificInstructions: [
          'Share this content with 3 people who would be affected',
          'Start a conversation about the power dynamics you learned',
          'Ask them to take one action too',
          'Focus on how this affects your community specifically'
        ],
        leverage_points: ['Network effects', 'Peer influence', 'Local impact']
      })
    }

    // Set up monitoring
    actions.push({
      id: 'monitor-setup',
      title: 'Set Up Monitoring',
      description: 'Stay informed about developments on this issue',
      difficulty: 'immediate',
      timeRequired: '5 minutes',
      impact: 'individual',
      category: 'monitor',
      specificInstructions: [
        'Sign up for alerts from relevant government agencies',
        'Follow key journalists covering this issue',
        'Set Google alerts for specific terms',
        'Join mailing lists of advocacy organizations'
      ],
      leverage_points: ['Information advantage', 'Early warning system']
    })

    return actions
  }

  /**
   * Generate systematic, long-term actions
   */
  private async generateSystematicActions(
    topic: string,
    powerStructures: string[],
    config: any
  ): Promise<ActionStep[]> {
    const actions: ActionStep[] = []

    // Organize with others
    if (config.preferredActionTypes.includes('organize')) {
      actions.push({
        id: 'organize-coalition',
        title: 'Build Local Coalition',
        description: 'Organize with others affected by this issue',
        difficulty: 'moderate',
        timeRequired: '2-4 hours per week',
        impact: 'community',
        category: 'organize',
        specificInstructions: [
          'Research existing organizations working on this issue',
          'Attend local meetings or events related to the topic',
          'Connect with neighbors and community members',
          'Start or join a local advocacy group',
          'Plan coordinated actions with other advocates'
        ],
        leverage_points: ['Collective action', 'Community pressure', 'Shared resources']
      })
    }

    // Monitor implementation
    actions.push({
      id: 'monitor-implementation',
      title: 'Monitor Policy Implementation',
      description: 'Track how decisions are actually implemented',
      difficulty: 'advanced',
      timeRequired: '1-2 hours per month',
      impact: 'systemic',
      category: 'monitor',
      specificInstructions: [
        'Attend public meetings where this issue is discussed',
        'Submit public records requests for relevant documents',
        'Track budget allocations related to this issue',
        'Document gaps between promises and implementation',
        'Report findings to media and advocacy organizations'
      ],
      leverage_points: ['Transparency', 'Accountability', 'Documentation']
    })

    // Advocate for systemic change
    if (config.preferredActionTypes.includes('advocate')) {
      actions.push({
        id: 'systemic-advocacy',
        title: 'Advocate for Systemic Reform',
        description: 'Push for changes to the underlying systems',
        difficulty: 'advanced',
        timeRequired: '4-6 hours per month',
        impact: 'systemic',
        category: 'advocate',
        specificInstructions: [
          'Research successful reforms in other locations',
          'Draft or support legislation addressing root causes',
          'Testify at hearings or public comment periods',
          'Build relationships with reform-minded officials',
          'Support candidates who prioritize systemic change'
        ],
        leverage_points: ['Policy change', 'Structural reform', 'Long-term impact']
      })
    }

    return actions
  }

  /**
   * Generate monitoring actions to track progress
   */
  private async generateMonitoringActions(
    topic: string,
    config: any
  ): Promise<ActionStep[]> {
    return [
      {
        id: 'track-voting-records',
        title: 'Track Official Voting Records',
        description: 'Monitor how your representatives vote on related issues',
        difficulty: 'moderate',
        timeRequired: '30 minutes per month',
        impact: 'community',
        category: 'monitor',
        specificInstructions: [
          'Check voting records on related bills',
          'Compare campaign promises to actual votes',
          'Document patterns in their voting behavior',
          'Share findings with other constituents',
          'Use this information in future elections'
        ],
        leverage_points: ['Electoral accountability', 'Informed voting', 'Public pressure']
      },
      {
        id: 'monitor-media-coverage',
        title: 'Monitor Media Coverage',
        description: 'Track how this issue is being covered in media',
        difficulty: 'immediate',
        timeRequired: '15 minutes per week',
        impact: 'community',
        category: 'monitor',
        specificInstructions: [
          'Set up news alerts for key terms',
          'Note which perspectives are included/excluded',
          'Identify which sources provide best coverage',
          'Challenge misleading coverage when you see it',
          'Share accurate information when coverage is lacking'
        ],
        leverage_points: ['Media literacy', 'Counter-narrative', 'Information quality']
      }
    ]
  }

  // =============================================================================
  // POWER ANALYSIS METHODS
  // =============================================================================

  /**
   * Identify power structures mentioned in content
   */
  private identifyPowerStructures(content: string): string[] {
    const powerKeywords = [
      'congress', 'senate', 'house', 'committee', 'agency', 'department',
      'supreme court', 'federal court', 'judge', 'prosecutor',
      'mayor', 'governor', 'state legislature', 'city council',
      'board', 'commission', 'authority', 'corporation',
      'lobby', 'pac', 'super pac', 'donor', 'industry'
    ]

    const structures = powerKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    )

    return structures
  }

  /**
   * Find leverage points where citizens can influence outcomes
   */
  private identifyLeveragePoints(content: string, powerStructures: string[]): string[] {
    const leveragePoints: string[] = []

    // Electoral pressure
    if (powerStructures.some(s => ['congress', 'senate', 'house', 'mayor', 'governor'].includes(s))) {
      leveragePoints.push('Electoral accountability')
      leveragePoints.push('Constituent pressure')
    }

    // Regulatory pressure
    if (powerStructures.some(s => ['agency', 'department', 'commission'].includes(s))) {
      leveragePoints.push('Public comment periods')
      leveragePoints.push('Regulatory oversight')
    }

    // Economic pressure
    if (powerStructures.some(s => ['corporation', 'industry'].includes(s))) {
      leveragePoints.push('Consumer boycotts')
      leveragePoints.push('Shareholder activism')
    }

    // Legal pressure
    if (powerStructures.some(s => ['court', 'judge'].includes(s))) {
      leveragePoints.push('Legal challenges')
      leveragePoints.push('Amicus briefs')
    }

    return leveragePoints
  }

  /**
   * Identify opportunities for coalition building
   */
  private identifyCoalitionOpportunities(topic: string, powerStructures: string[]): string[] {
    const opportunities: string[] = []

    // Issue-based coalitions
    if (topic.includes('environment')) {
      opportunities.push('Environmental groups', 'Public health advocates', 'Outdoor recreation groups')
    }
    if (topic.includes('education')) {
      opportunities.push('Parent groups', 'Teacher unions', 'Student organizations')
    }
    if (topic.includes('healthcare')) {
      opportunities.push('Patient advocacy groups', 'Healthcare workers', 'Senior organizations')
    }

    // Power structure-based coalitions
    if (powerStructures.includes('corporation')) {
      opportunities.push('Labor unions', 'Consumer groups', 'Community organizations')
    }

    return opportunities
  }

  /**
   * Get relevant contacts for the topic and location
   */
  private async getRelevantContacts(topic: string, location?: any): Promise<ContactInfo[]> {
    try {
      const supabase = createServiceClient()
      const contacts: ContactInfo[] = []

      // Get user's location-based representatives if location provided
      if (location?.state || location?.district) {
        const { data: representatives } = await supabase
          .from('congressional_members')
          .select(`
            full_name,
            title,
            party,
            state,
            district,
            phone,
            email,
            office_address,
            contact_form_url
          `)
          .or(`state.eq.${location.state},district.eq.${location.district}`)
          .eq('active', true)
          .order('title', { ascending: true })

                 if (representatives) {
           for (const rep of representatives) {
             contacts.push({
               type: 'elected_official',
               name: rep.full_name,
               title: rep.title,
               phone: rep.phone || undefined,
               email: rep.email || undefined,
               address: rep.office_address || undefined,
               bestContactMethod: rep.phone ? 'phone' : 'email',
               expectedResponseTime: '2-4 weeks'
             })
           }
         }
      }

      // Get topic-relevant agencies and officials
      const topicKeywords = this.extractTopicKeywords(topic)
      
             // Query government agencies relevant to topic
       if (topicKeywords.includes('environment') || topicKeywords.includes('climate')) {
         contacts.push({
           type: 'agency',
           name: 'Environmental Protection Agency',
           email: 'public-access@epa.gov',
           bestContactMethod: 'email',
           expectedResponseTime: '2-3 weeks'
         })
       }

       if (topicKeywords.includes('health') || topicKeywords.includes('medicare') || topicKeywords.includes('medicaid')) {
         contacts.push({
           type: 'agency',
           name: 'Department of Health and Human Services',
           email: 'info@hhs.gov',
           bestContactMethod: 'email',
           expectedResponseTime: '3-4 weeks'
         })
       }

       if (topicKeywords.includes('education') || topicKeywords.includes('student') || topicKeywords.includes('school')) {
         contacts.push({
           type: 'agency',
           name: 'Department of Education',
           email: 'customerservice@studentaid.gov',
           bestContactMethod: 'email',
           expectedResponseTime: '2-3 weeks'
         })
       }

       if (topicKeywords.includes('justice') || topicKeywords.includes('civil rights') || topicKeywords.includes('voting')) {
         contacts.push({
           type: 'agency',
           name: 'Department of Justice - Civil Rights Division',
           email: 'civilrights.complaint@usdoj.gov',
           bestContactMethod: 'email',
           expectedResponseTime: '4-6 weeks'
         })
       }

      // Add state and local contacts if location provided
      if (location?.state) {
        const { data: stateOfficials } = await supabase
          .from('state_officials')
          .select('*')
          .eq('state', location.state)
          .eq('active', true)
          .limit(3)

        if (stateOfficials) {
                     for (const official of stateOfficials) {
             contacts.push({
               type: 'elected_official',
               name: official.name,
               title: official.title,
               phone: official.phone,
               email: official.email,
               bestContactMethod: official.phone ? 'phone' : 'email',
               expectedResponseTime: '1-2 weeks'
             })
           }
        }
      }

      // If no specific contacts found, provide general federal contacts
      if (contacts.length === 0) {
        contacts.push(
          {
            type: 'elected_official',
            name: 'Your U.S. Representative',
            title: 'U.S. Representative',
            website: 'https://www.house.gov/representatives/find-your-representative',
            bestContactMethod: 'website',
            expectedResponseTime: '2-3 weeks',
            notes: 'Find your specific representative using your zip code'
          },
          {
            type: 'elected_official',
            name: 'Your U.S. Senators',
            title: 'U.S. Senator',
            website: 'https://www.senate.gov/senators/senators-contact.htm',
            bestContactMethod: 'website',
            expectedResponseTime: '3-4 weeks',
            notes: 'Find your state senators\' contact information'
          }
        )
      }

      return contacts.slice(0, 5) // Limit to top 5 most relevant contacts

    } catch (error) {
      console.error('Error getting relevant contacts:', error)
      // Fallback to basic federal contacts
      return [
        {
          type: 'elected_official',
          name: 'Your U.S. Representative',
          title: 'U.S. Representative',
          website: 'https://www.house.gov/representatives/find-your-representative',
          bestContactMethod: 'website',
          expectedResponseTime: '2-3 weeks'
        },
        {
          type: 'elected_official',
          name: 'Your U.S. Senators',
          title: 'U.S. Senator',
          website: 'https://www.senate.gov/senators/senators-contact.htm',
          bestContactMethod: 'website',
          expectedResponseTime: '3-4 weeks'
        }
      ]
    }
  }

  /**
   * Extract keywords from topic for agency matching
   */
  private extractTopicKeywords(topic: string): string[] {
    const keywords = topic.toLowerCase().split(/\s+/)
    const relevantKeywords = keywords.filter(keyword => 
      keyword.length > 3 && // Filter out short words
      !['the', 'and', 'for', 'with', 'this', 'that', 'they', 'have', 'been', 'will', 'from'].includes(keyword)
    )
    return relevantKeywords
  }

  /**
   * Get leverage points specific to contacting this official
   */
  private getContactLeveragePoints(contact: ContactInfo, topic: string): string[] {
    const points: string[] = []

    if (contact.type === 'elected_official') {
      points.push('Electoral pressure')
      points.push('Constituent services')
      points.push('Voting record accountability')
    }

    if (contact.type === 'agency') {
      points.push('Regulatory authority')
      points.push('Public accountability')
      points.push('Professional responsibility')
    }

    return points
  }

  /**
   * Define success metrics for tracking progress
   */
  private defineSuccessMetrics(topic: string, powerStructures: string[]): string[] {
    const metrics: string[] = [
      'Number of people contacted about this issue',
      'Response rate from officials contacted',
      'Media coverage generated',
      'Policy changes achieved',
      'Behavioral changes in targeted institutions'
    ]

    // Add topic-specific metrics
    if (topic.includes('voting')) {
      metrics.push('Voter registration increases', 'Turnout improvements')
    }

    if (powerStructures.includes('corporation')) {
      metrics.push('Corporate policy changes', 'Financial impact on bad actors')
    }

    return metrics
  }

  /**
   * Initialize action templates database
   */
  private initializeActionTemplates(): void {
    // Mock initialization - would load from database in real system
    this.actionTemplates.set('voting_rights', [
      // Template actions for voting rights issues
    ])
    this.actionTemplates.set('healthcare', [
      // Template actions for healthcare issues
    ])
    // Add more templates as needed
  }

  /**
   * Initialize contact database
   */
  private initializeContactDatabase(): void {
    // Mock initialization - would load from database in real system
    this.officialContacts.set('federal', [
      // Federal officials and agencies
    ])
    this.officialContacts.set('state', [
      // State officials and agencies  
    ])
    // Add more contact categories as needed
  }

  // =============================================================================
  // WORKFLOW ORCHESTRATION METHODS
  // =============================================================================

  /**
   * Generate action plans for multiple topics in batch
   */
  async generateBatch(inputs: ActionGenerationInput[]): Promise<AIToolResult<CivicActionPlan[]>> {
    const results: CivicActionPlan[] = []
    const errors: string[] = []

    for (const input of inputs) {
      try {
        const result = await this.process(input)
        if (result.success && result.data) {
          results.push(result.data)
        } else {
          errors.push(`Topic "${input.topic}": ${result.error}`)
        }
      } catch (error) {
        errors.push(`Topic "${input.topic}": ${error}`)
      }
    }

    // Log batch processing
    await this.logActivity('batch_action_generation', {
      topics_processed: inputs.length,
      successful_generations: results.length,
      failed_generations: errors.length
    })

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      metadata: {
        toolName: this.config.name,
        provider: this.config.provider,
        model: this.config.model,
        processingTime: 0,
        retryCount: 0
      }
    }
  }

  /**
   * Get workflow step configuration for orchestration
   */
  static getWorkflowStepConfig() {
    return {
      id: 'civic_action_generation',
      name: 'Generate Civic Action Plan',
      type: 'action_generator',
      inputs: ['civic_content', 'user_preferences'],
      outputs: ['action_plan', 'leverage_points'],
      config: {
        batch_processing: true,
        max_topics_per_batch: 5,
        include_power_analysis: true,
        generate_monitoring_actions: true
      }
    }
  }

  /**
   * Generate quick actions for urgent civic situations
   */
  async generateQuickActions(topic: string, urgency: 'routine' | 'urgent' | 'crisis'): Promise<ActionStep[]> {
    const config = {
      userCapacity: 'beginner' as const,
      preferredActionTypes: ['contact', 'educate'] as ('contact' | 'organize' | 'educate' | 'vote' | 'advocate' | 'monitor')[],
      timeAvailable: urgency === 'crisis' ? 'minimal' as const : 'moderate' as const,
      issueUrgency: urgency
    }

    const input: ActionGenerationInput = {
      topic,
      content: `Urgent civic action needed regarding ${topic}`,
      config
    }

    try {
      const result = await this.process(input)
      if (result.success && result.data) {
        return result.data.immediateActions
      }
      return []
    } catch (error) {
      console.error('Error generating quick actions:', error)
      return []
    }
  }
}

export default CivicActionGeneratorAI 