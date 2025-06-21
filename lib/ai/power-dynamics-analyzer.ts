/**
 * CivicSense Power Dynamics Analyzer
 * 
 * Analyzes power structures, influence patterns, and hidden dynamics
 * in civic content to reveal how power actually works.
 * 
 * Mission: Make power visible, traceable, and actionable for citizens
 */

export interface PowerActor {
  id: string
  name: string
  type: 'individual' | 'institution' | 'organization' | 'informal_network'
  category: 'government' | 'corporate' | 'nonprofit' | 'media' | 'civil_society'
  tier: 'local' | 'state' | 'federal' | 'international'
  formalPower: PowerSource[]
  informalPower: PowerSource[]
  resources: Resource[]
  relationships: Relationship[]
}

export interface PowerSource {
  type: 'legal' | 'economic' | 'informational' | 'social' | 'coercive' | 'moral'
  description: string
  scope: string
  limitations: string[]
  howExercised: string[]
}

export interface Resource {
  type: 'financial' | 'human' | 'informational' | 'network' | 'institutional' | 'symbolic'
  description: string
  estimated_value?: string
  source: string
  access_level: 'public' | 'limited' | 'private' | 'secret'
}

export interface Relationship {
  targetId: string
  type: 'formal' | 'informal' | 'adversarial' | 'alliance' | 'transactional'
  description: string
  powerDynamic: 'dominant' | 'subordinate' | 'equal' | 'complex'
  influence_mechanisms: string[]
}

export interface PowerPattern {
  name: string
  description: string
  participants: string[]
  mechanism: string
  outcomes: string[]
  citizenLeveragePoints: string[]
  hiddenFromPublic: boolean
}

export interface PowerAnalysis {
  topic: string
  keyActors: PowerActor[]
  powerPatterns: PowerPattern[]
  influenceFlows: InfluenceFlow[]
  hiddenDynamics: HiddenDynamic[]
  citizenAccessPoints: AccessPoint[]
  powerImbalances: PowerImbalance[]
  systemicIssues: SystemicIssue[]
}

export interface InfluenceFlow {
  fromActorId: string
  toActorId: string
  mechanism: string
  strength: 'weak' | 'moderate' | 'strong'
  transparency: 'public' | 'limited' | 'hidden'
  evidence: string[]
}

export interface HiddenDynamic {
  description: string
  participants: string[]
  hiddenMechanisms: string[]
  publicNarrative: string
  actualOperation: string
  citizenImpact: string
  howToExpose: string[]
}

export interface AccessPoint {
  description: string
  actorTargeted: string
  accessMethod: string
  requirements: string[]
  timeToImpact: string
  successProbability: 'low' | 'medium' | 'high'
  citizenResources: string[]
}

export interface PowerImbalance {
  description: string
  advantagedActor: string
  disadvantagedActor: string
  mechanism: string
  impact: string
  historicalContext: string
  potentialRemedies: string[]
}

export interface SystemicIssue {
  name: string
  description: string
  rootCauses: string[]
  perpetuatingFactors: string[]
  beneficiaries: string[]
  harmedGroups: string[]
  reformDifficulty: 'low' | 'medium' | 'high' | 'extreme'
  changeStrategies: string[]
}

export class PowerDynamicsAnalyzer {
  private powerActorDatabase: Map<string, PowerActor>
  private powerPatternLibrary: Map<string, PowerPattern>
  private systemicIssueDatabase: Map<string, SystemicIssue>

  constructor() {
    this.powerActorDatabase = new Map()
    this.powerPatternLibrary = new Map()
    this.systemicIssueDatabase = new Map()
    this.initializeDatabases()
  }

  /**
   * Analyze power dynamics in content
   */
  async analyzeContent(content: string, topic: string): Promise<PowerAnalysis> {
    const mentionedActors = this.extractPowerActors(content)
    const detectedPatterns = this.identifyPowerPatterns(content, mentionedActors)
    const influenceFlows = this.mapInfluenceFlows(mentionedActors, content)
    const hiddenDynamics = this.detectHiddenDynamics(content, detectedPatterns)
    const accessPoints = this.identifyAccessPoints(mentionedActors, topic)
    const powerImbalances = this.analyzePowerImbalances(mentionedActors, content)
    const systemicIssues = this.identifySystemicIssues(content, topic)

    return {
      topic,
      keyActors: mentionedActors,
      powerPatterns: detectedPatterns,
      influenceFlows,
      hiddenDynamics,
      citizenAccessPoints: accessPoints,
      powerImbalances,
      systemicIssues
    }
  }

  /**
   * Extract and analyze power actors mentioned in content
   */
  private extractPowerActors(content: string): PowerActor[] {
    const actors: PowerActor[] = []
    const contentLower = content.toLowerCase()

    // Government actors
    if (contentLower.includes('congress') || contentLower.includes('senate') || contentLower.includes('house')) {
      actors.push(this.createGovernmentActor('U.S. Congress', 'institution', 'federal'))
    }

    if (contentLower.includes('supreme court')) {
      actors.push(this.createGovernmentActor('Supreme Court', 'institution', 'federal'))
    }

    if (contentLower.includes('federal agency') || contentLower.includes('department')) {
      actors.push(this.createGovernmentActor('Federal Agencies', 'institution', 'federal'))
    }

    // Corporate actors
    const corporateTerms = ['corporation', 'company', 'industry', 'business']
    if (corporateTerms.some(term => contentLower.includes(term))) {
      actors.push(this.createCorporateActor('Corporate Interests', 'organization'))
    }

    // Lobby/influence actors
    if (contentLower.includes('lobby') || contentLower.includes('pac')) {
      actors.push(this.createInfluenceActor('Lobbying Groups', 'organization'))
    }

    return actors
  }

  /**
   * Identify power patterns in the content
   */
  private identifyPowerPatterns(content: string, actors: PowerActor[]): PowerPattern[] {
    const patterns: PowerPattern[] = []
    const contentLower = content.toLowerCase()

    // Regulatory capture pattern
    if (contentLower.includes('regulate') && actors.some(a => a.category === 'corporate')) {
      patterns.push({
        name: 'Regulatory Capture',
        description: 'Industry influences the agencies meant to regulate them',
        participants: ['Federal Agencies', 'Corporate Interests'],
        mechanism: 'Revolving door, lobbying, industry expertise claims',
        outcomes: ['Weak enforcement', 'Industry-friendly rules', 'Consumer harm'],
        citizenLeveragePoints: ['Public comment periods', 'Congressional oversight', 'Media exposure'],
        hiddenFromPublic: true
      })
    }

    // Money in politics pattern
    if (contentLower.includes('campaign') || contentLower.includes('donation')) {
      patterns.push({
        name: 'Money in Politics',
        description: 'Wealthy interests gain outsized political influence through donations',
        participants: ['Wealthy Donors', 'Politicians', 'PACs'],
        mechanism: 'Campaign contributions, Super PACs, lobbying expenditures',
        outcomes: ['Policy favoring donors', 'Reduced citizen influence', 'Democratic deficit'],
        citizenLeveragePoints: ['Campaign finance reform', 'Public financing', 'Transparency requirements'],
        hiddenFromPublic: false
      })
    }

    // Information asymmetry pattern
    if (contentLower.includes('classified') || contentLower.includes('secret')) {
      patterns.push({
        name: 'Information Asymmetry',
        description: 'Government withholds information that would enable citizen oversight',
        participants: ['Government Agencies', 'Citizens'],
        mechanism: 'Classification, executive privilege, slow FOIA responses',
        outcomes: ['Reduced accountability', 'Uninformed public', 'Policy errors'],
        citizenLeveragePoints: ['FOIA requests', 'Whistleblower protection', 'Congressional oversight'],
        hiddenFromPublic: true
      })
    }

    return patterns
  }

  /**
   * Map influence flows between actors
   */
  private mapInfluenceFlows(actors: PowerActor[], content: string): InfluenceFlow[] {
    const flows: InfluenceFlow[] = []

    // Corporate to government influence
    const corporateActor = actors.find(a => a.category === 'corporate')
    const govActor = actors.find(a => a.category === 'government')

    if (corporateActor && govActor) {
      flows.push({
        fromActorId: corporateActor.id,
        toActorId: govActor.id,
        mechanism: 'Lobbying, campaign contributions, revolving door',
        strength: 'strong',
        transparency: 'limited',
        evidence: ['Lobbying disclosure reports', 'Campaign finance records']
      })
    }

    return flows
  }

  /**
   * Detect hidden dynamics not visible in public narrative
   */
  private detectHiddenDynamics(content: string, patterns: PowerPattern[]): HiddenDynamic[] {
    const hiddenDynamics: HiddenDynamic[] = []

    // Regulatory capture dynamic
    if (patterns.some(p => p.name === 'Regulatory Capture')) {
      hiddenDynamics.push({
        description: 'Agencies are captured by the industries they regulate',
        participants: ['Federal Agencies', 'Industry Groups', 'Revolving Door Personnel'],
        hiddenMechanisms: [
          'Industry experts become regulators',
          'Regulators expect future industry jobs',
          'Industry provides "technical expertise"',
          'Enforcement becomes negotiation'
        ],
        publicNarrative: 'Expert regulators protect public interest',
        actualOperation: 'Industry insiders minimize regulation to protect profits',
        citizenImpact: 'Reduced protection, higher costs, environmental harm',
        howToExpose: [
          'Track personnel movements between agencies and industry',
          'Analyze enforcement patterns and penalties',
          'Compare regulations to industry positions',
          'FOIA internal communications'
        ]
      })
    }

    return hiddenDynamics
  }

  /**
   * Identify access points where citizens can influence power
   */
  private identifyAccessPoints(actors: PowerActor[], topic: string): AccessPoint[] {
    const accessPoints: AccessPoint[] = []

    actors.forEach(actor => {
      if (actor.category === 'government') {
        accessPoints.push({
          description: `Influence ${actor.name} through democratic processes`,
          actorTargeted: actor.id,
          accessMethod: 'Electoral pressure, public comment, congressional oversight',
          requirements: ['Voting eligibility', 'Time for civic engagement'],
          timeToImpact: '1-4 years',
          successProbability: 'medium',
          citizenResources: ['Vote', 'Public comment', 'Constituent communication']
        })
      }

      if (actor.category === 'corporate') {
        accessPoints.push({
          description: `Influence ${actor.name} through economic pressure`,
          actorTargeted: actor.id,
          accessMethod: 'Consumer boycotts, shareholder activism, regulatory pressure',
          requirements: ['Economic resources', 'Organized collective action'],
          timeToImpact: '6 months - 2 years',
          successProbability: 'medium',
          citizenResources: ['Consumer choice', 'Investment decisions', 'Regulatory advocacy']
        })
      }
    })

    return accessPoints
  }

  /**
   * Analyze power imbalances and their impacts
   */
  private analyzePowerImbalances(actors: PowerActor[], content: string): PowerImbalance[] {
    const imbalances: PowerImbalance[] = []

    const corporateActor = actors.find(a => a.category === 'corporate')
    const citizenGroup = { id: 'citizens', name: 'Citizens', category: 'civil_society' }

    if (corporateActor) {
      imbalances.push({
        description: 'Corporations have vastly more political influence than individual citizens',
        advantagedActor: corporateActor.id,
        disadvantagedActor: 'citizens',
        mechanism: 'Resource asymmetry, professional lobbying, concentrated interests vs. diffuse costs',
        impact: 'Policy outcomes favor corporate interests over public interest',
        historicalContext: 'Corporate political power has grown since Citizens United decision',
        potentialRemedies: [
          'Campaign finance reform',
          'Stronger lobbying restrictions',
          'Public financing of campaigns',
          'Citizen organizing and coalition building'
        ]
      })
    }

    return imbalances
  }

  /**
   * Identify systemic issues that create ongoing problems
   */
  private identifySystemicIssues(content: string, topic: string): SystemicIssue[] {
    const issues: SystemicIssue[] = []

    // Money in politics system
    if (content.toLowerCase().includes('campaign') || content.toLowerCase().includes('lobby')) {
      issues.push({
        name: 'Money in Politics System',
        description: 'The current system allows unlimited political spending that drowns out citizen voices',
        rootCauses: [
          'Citizens United decision allowing unlimited corporate spending',
          'Weak enforcement of existing rules',
          'Revolving door between government and lobbying'
        ],
        perpetuatingFactors: [
          'Politicians depend on wealthy donors for campaigns',
          'Complex rules favor those who can afford compliance',
          'Lack of public awareness about influence operations'
        ],
        beneficiaries: ['Wealthy individuals', 'Corporations', 'Lobbying firms'],
        harmedGroups: ['Average citizens', 'Public interest', 'Democratic legitimacy'],
        reformDifficulty: 'high',
        changeStrategies: [
          'Constitutional amendment overturning Citizens United',
          'Public financing of campaigns',
          'Stronger lobbying disclosure and restrictions',
          'Grassroots organizing to build political will'
        ]
      })
    }

    return issues
  }

  /**
   * Create a government actor with typical power sources
   */
  private createGovernmentActor(name: string, type: PowerActor['type'], tier: PowerActor['tier']): PowerActor {
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      type,
      category: 'government',
      tier,
      formalPower: [
        {
          type: 'legal',
          description: 'Constitutional and statutory authority',
          scope: 'Within defined jurisdiction',
          limitations: ['Constitutional constraints', 'Judicial review', 'Legislative oversight'],
          howExercised: ['Laws and regulations', 'Enforcement actions', 'Budget allocation']
        }
      ],
      informalPower: [
        {
          type: 'informational',
          description: 'Access to information and expertise',
          scope: 'Government operations and data',
          limitations: ['Classification rules', 'FOIA requirements'],
          howExercised: ['Information sharing', 'Public statements', 'Briefings']
        }
      ],
      resources: [
        {
          type: 'financial',
          description: 'Government budget allocation',
          source: 'Taxpayer funds',
          access_level: 'public'
        },
        {
          type: 'institutional',
          description: 'Government apparatus and staff',
          source: 'Civil service system',
          access_level: 'limited'
        }
      ],
      relationships: []
    }
  }

  /**
   * Create a corporate actor with typical power sources
   */
  private createCorporateActor(name: string, type: PowerActor['type']): PowerActor {
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      type,
      category: 'corporate',
      tier: 'federal',
      formalPower: [
        {
          type: 'economic',
          description: 'Market power and financial resources',
          scope: 'Market operations and investment',
          limitations: ['Antitrust laws', 'Securities regulations', 'Labor laws'],
          howExercised: ['Investment decisions', 'Pricing', 'Employment', 'Lobbying']
        }
      ],
      informalPower: [
        {
          type: 'informational',
          description: 'Industry expertise and technical knowledge',
          scope: 'Specialized industry knowledge',
          limitations: ['Trade secrets', 'Competitive advantage'],
          howExercised: ['Regulatory input', 'Congressional testimony', 'Media relations']
        }
      ],
      resources: [
        {
          type: 'financial',
          description: 'Corporate profits and investment capital',
          source: 'Business operations',
          access_level: 'private'
        },
        {
          type: 'network',
          description: 'Industry connections and revolving door relationships',
          source: 'Business networks',
          access_level: 'limited'
        }
      ],
      relationships: []
    }
  }

  /**
   * Create an influence actor (lobbyists, PACs, etc.)
   */
  private createInfluenceActor(name: string, type: PowerActor['type']): PowerActor {
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      type,
      category: 'civil_society',
      tier: 'federal',
      formalPower: [
        {
          type: 'legal',
          description: 'Right to petition government and advocate positions',
          scope: 'Political advocacy and lobbying',
          limitations: ['Lobbying disclosure requirements', 'Campaign finance laws'],
          howExercised: ['Direct lobbying', 'Campaign contributions', 'Grassroots organizing']
        }
      ],
      informalPower: [
        {
          type: 'social',
          description: 'Access to political networks and decision-makers',
          scope: 'Political relationships',
          limitations: ['Disclosure requirements', 'Conflict of interest rules'],
          howExercised: ['Relationship building', 'Information sharing', 'Access provision']
        }
      ],
      resources: [
        {
          type: 'financial',
          description: 'Funding from clients and supporters',
          source: 'Membership dues and client fees',
          access_level: 'limited'
        },
        {
          type: 'network',
          description: 'Political and professional connections',
          source: 'Career relationships',
          access_level: 'private'
        }
      ],
      relationships: []
    }
  }

  /**
   * Initialize power actor and pattern databases
   */
  private initializeDatabases(): void {
    // Mock initialization - would load from comprehensive database in real system
    
    // Power patterns
    this.powerPatternLibrary.set('regulatory_capture', {
      name: 'Regulatory Capture',
      description: 'Industries capture their regulators',
      participants: ['Regulatory Agency', 'Industry Group'],
      mechanism: 'Revolving door, technical expertise claims, industry funding',
      outcomes: ['Weak enforcement', 'Industry-friendly rules'],
      citizenLeveragePoints: ['Public comment', 'Congressional oversight'],
      hiddenFromPublic: true
    })

    // Systemic issues
    this.systemicIssueDatabase.set('money_in_politics', {
      name: 'Money in Politics',
      description: 'Wealthy interests have outsized political influence',
      rootCauses: ['Citizens United decision', 'Weak enforcement'],
      perpetuatingFactors: ['Politician dependence on donors'],
      beneficiaries: ['Wealthy donors', 'Corporations'],
      harmedGroups: ['Average citizens', 'Democratic legitimacy'],
      reformDifficulty: 'high',
      changeStrategies: ['Constitutional amendment', 'Public financing']
    })
  }
}

export default PowerDynamicsAnalyzer 