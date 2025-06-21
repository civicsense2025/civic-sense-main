/**
 * CivicSense Civic Action Generator
 * 
 * Generates specific, actionable civic engagement steps that connect 
 * individual learning to systemic democratic participation.
 * 
 * Mission: Transform passive civic consumers into active democratic participants
 */

export interface ActionStep {
  id: string
  title: string
  description: string
  difficulty: 'immediate' | 'moderate' | 'advanced'
  timeRequired: string
  impact: 'individual' | 'community' | 'systemic'
  category: 'contact' | 'organize' | 'educate' | 'vote' | 'advocate' | 'monitor'
  specificInstructions: string[]
  contactInfo?: ContactInfo
  deadlines?: string[]
  leverage_points: string[]
}

export interface ContactInfo {
  type: 'elected_official' | 'agency' | 'organization' | 'media'
  name: string
  title?: string
  email?: string
  phone?: string
  address?: string
  socialMedia?: string[]
  bestContactMethod: string
  expectedResponseTime: string
}

export interface CivicActionPlan {
  topic: string
  immediateActions: ActionStep[]
  mediumTermActions: ActionStep[]
  longTermActions: ActionStep[]
  coalitionOpportunities: string[]
  monitoringActions: ActionStep[]
  powerLeveragePoints: string[]
  successMetrics: string[]
}

export interface ActionGenerationConfig {
  userLocation?: {
    state: string
    district?: string
    city?: string
  }
  userCapacity: 'beginner' | 'intermediate' | 'advanced'
  preferredActionTypes: ActionStep['category'][]
  timeAvailable: 'minimal' | 'moderate' | 'substantial'
  issueUrgency: 'routine' | 'urgent' | 'crisis'
}

export class CivicActionGenerator {
  private actionTemplates: Map<string, ActionStep[]>
  private officialContacts: Map<string, ContactInfo[]>

  constructor() {
    this.actionTemplates = new Map()
    this.officialContacts = new Map()
    this.initializeActionTemplates()
    this.initializeContactDatabase()
  }

  /**
   * Generate comprehensive action plan for civic topic
   */
  async generateActionPlan(
    topic: string,
    content: string,
    config: ActionGenerationConfig
  ): Promise<CivicActionPlan> {
    const powerStructures = this.identifyPowerStructures(content)
    const leveragePoints = this.identifyLeveragePoints(content, powerStructures)
    const urgentActions = this.generateUrgentActions(topic, content, config)
    const systematicActions = this.generateSystematicActions(topic, powerStructures, config)
    
    return {
      topic,
      immediateActions: urgentActions.filter(a => a.difficulty === 'immediate'),
      mediumTermActions: systematicActions.filter(a => a.difficulty === 'moderate'),
      longTermActions: systematicActions.filter(a => a.difficulty === 'advanced'),
      coalitionOpportunities: this.identifyCoalitionOpportunities(topic, powerStructures),
      monitoringActions: this.generateMonitoringActions(topic, config),
      powerLeveragePoints: leveragePoints,
      successMetrics: this.defineSuccessMetrics(topic, powerStructures)
    }
  }

  /**
   * Generate immediate action steps (can be done today)
   */
  generateUrgentActions(
    topic: string,
    content: string,
    config: ActionGenerationConfig
  ): ActionStep[] {
    const actions: ActionStep[] = []
    
    // Contact elected officials
    if (config.preferredActionTypes.includes('contact')) {
      const contacts = this.getRelevantContacts(topic, config.userLocation)
      contacts.slice(0, 3).forEach((contact, index) => {
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

    // Sign up for alerts
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
  generateSystematicActions(
    topic: string,
    powerStructures: string[],
    config: ActionGenerationConfig
  ): ActionStep[] {
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
  generateMonitoringActions(
    topic: string,
    config: ActionGenerationConfig
  ): ActionStep[] {
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
  private getRelevantContacts(topic: string, location?: ActionGenerationConfig['userLocation']): ContactInfo[] {
    // Mock implementation - in real system would query database
    const mockContacts: ContactInfo[] = [
      {
        type: 'elected_official',
        name: 'Representative [Your Rep]',
        title: 'U.S. Representative',
        phone: '(555) 123-4567',
        email: 'contact@yourrepresentative.gov',
        bestContactMethod: 'phone',
        expectedResponseTime: '2-3 weeks'
      },
      {
        type: 'elected_official',
        name: 'Senator [Your Senator]',
        title: 'U.S. Senator',
        phone: '(555) 234-5678',
        email: 'contact@yoursenator.gov',
        bestContactMethod: 'phone',
        expectedResponseTime: '3-4 weeks'
      },
      {
        type: 'agency',
        name: 'Relevant Agency',
        email: 'public.affairs@agency.gov',
        bestContactMethod: 'email',
        expectedResponseTime: '2-3 weeks'
      }
    ]

    return mockContacts
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
}

export default CivicActionGenerator 