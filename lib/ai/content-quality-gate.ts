/**
 * Content Quality Gate for CivicSense AI
 * 
 * Enforces our content quality rubric and brand voice standards.
 * All content must pass these gates before publication.
 */

export interface ContentQualityAssessment {
  overall_score: number
  brand_voice_score: number
  power_dynamics_score: number  
  civic_engagement_score: number
  accuracy_score: number
  
  // Detailed breakdown
  uncomfortable_truths_detected: number
  specific_actors_named: number
  action_steps_count: number
  primary_sources_count: number
  active_voice_percentage: number
  readability_score: number
  
  // Quality flags
  has_uncomfortable_truth: boolean
  names_specific_institutions: boolean
  provides_action_steps: boolean
  challenges_assumptions: boolean
  uses_primary_sources: boolean
  
  // Brand voice compliance
  avoids_diplomatic_softening: boolean
  uses_direct_language: boolean
  assigns_responsibility: boolean
  
  // Content type specific
  civics_education_value: number
  misconception_correction_potential: number
  democratic_engagement_potential: number
}

export interface QualityThresholds {
  minimumOverallScore: number
  minimumBrandVoiceScore: number
  minimumPowerDynamicsScore: number
  minimumCivicEngagementScore: number
  minimumAccuracyScore: number
}

export class ContentQualityGate {
  private thresholds: QualityThresholds

  constructor(thresholds: QualityThresholds) {
    this.thresholds = thresholds
  }

  async assessContentQuality(content: string, context?: any): Promise<ContentQualityAssessment> {
    const brandVoiceScore = await this.analyzeBrandVoice(content)
    const powerDynamicsScore = await this.analyzePowerDynamics(content)
    const civicEngagementScore = await this.analyzeCivicEngagement(content)
    const accuracyScore = await this.analyzeAccuracy(content)
    
    const uncomfortableTruths = this.detectUncomfortableTruths(content)
    const actionSteps = this.countActionSteps(content)
    const primarySources = this.countPrimarySources(content)
    const specificActors = this.extractSpecificActors(content)
    const activeVoicePercentage = this.calculateActiveVoicePercentage(content)
    const readabilityScore = this.calculateReadabilityScore(content)
    
    const overallScore = Math.round(
      (brandVoiceScore + powerDynamicsScore + civicEngagementScore + accuracyScore) / 4
    )
    
    return {
      overall_score: overallScore,
      brand_voice_score: brandVoiceScore,
      power_dynamics_score: powerDynamicsScore,
      civic_engagement_score: civicEngagementScore,
      accuracy_score: accuracyScore,
      
      uncomfortable_truths_detected: uncomfortableTruths.length,
      specific_actors_named: specificActors.length,
      action_steps_count: actionSteps,
      primary_sources_count: primarySources,
      active_voice_percentage: activeVoicePercentage,
      readability_score: readabilityScore,
      
      has_uncomfortable_truth: uncomfortableTruths.length > 0,
      names_specific_institutions: specificActors.length >= 2,
      provides_action_steps: actionSteps >= 3,
      challenges_assumptions: this.challengesAssumptions(content),
      uses_primary_sources: primarySources >= 2,
      
      avoids_diplomatic_softening: this.avoidsUndercutLanguage(content),
      uses_direct_language: activeVoicePercentage >= 80,
      assigns_responsibility: this.assignsResponsibility(content),
      
      civics_education_value: this.calculateEducationalValue(content),
      misconception_correction_potential: this.calculateMisconceptionCorrection(content),
      democratic_engagement_potential: this.calculateEngagementPotential(content)
    }
  }

  async analyzeBrandVoice(content: string): Promise<number> {
    let score = 0
    
    // Active voice usage (0-25 points)
    const activeVoicePercentage = this.calculateActiveVoicePercentage(content)
    score += Math.min(25, Math.round(activeVoicePercentage / 4))
    
    // Specific institution naming (0-20 points)
    const specificActors = this.extractSpecificActors(content)
    score += Math.min(20, specificActors.length * 5)
    
    // Direct language (0-15 points)
    if (this.avoidsUndercutLanguage(content)) score += 15
    
    // Uncomfortable truth (0-15 points)
    if (this.hasUncomfortableTruth(content)) score += 15
    
    // Assumption challenging (0-25 points)
    if (this.challengesAssumptions(content)) score += 25
    
    return Math.min(100, score)
  }

  async analyzePowerDynamics(content: string): Promise<number> {
    let score = 0
    
    // Power structure analysis patterns
    const powerPatterns = [
      /who (actually|really) (makes|controls|decides)/i,
      /(behind the scenes|informal power|real influence)/i,
      /(financial interests|money trail|lobbying)/i,
      /(official process vs|appears to.*actually)/i,
      /(hidden|unofficial|backdoor) (meetings|negotiations|agreements)/i
    ]
    
    powerPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 20
    })
    
    return Math.min(100, score)
  }

  async analyzeCivicEngagement(content: string): Promise<number> {
    let score = 0
    
    const actionSteps = this.countActionSteps(content)
    score += Math.min(40, actionSteps * 10)
    
    // Contact information provided
    if (/\(\d{3}\)\s?\d{3}-\d{4}|@\w+\.gov/i.test(content)) score += 20
    
    // Specific timing guidance
    if (/(before|by|within) (monday|tuesday|wednesday|thursday|friday|today|tomorrow)/i.test(content)) score += 20
    
    // Escalation steps
    if (/(if.*don't respond|follow up|escalate|next step)/i.test(content)) score += 20
    
    return Math.min(100, score)
  }

  async analyzeAccuracy(content: string): Promise<number> {
    let score = 0
    
    const primarySources = this.countPrimarySources(content)
    score += Math.min(50, primarySources * 15)
    
    // Proper citations
    if (/\[.*\]\(http/i.test(content)) score += 25
    
    // Fact vs. analysis distinction
    if (/(according to|data shows|records indicate)/i.test(content)) score += 25
    
    return Math.min(100, score)
  }

  private detectUncomfortableTruths(content: string): string[] {
    const patterns = [
      /don't want (you|people|citizens) to know/i,
      /politicians (hide|conceal|don't mention)/i,
      /what they're not telling you/i,
      /uncomfortable truth/i,
      /reality is different/i
    ]
    
    return patterns.filter(pattern => pattern.test(content)).map(pattern => {
      const match = content.match(pattern)
      return match ? match[0] : ''
    }).filter(Boolean)
  }

  private countActionSteps(content: string): number {
    const actionVerbs = [
      'call', 'contact', 'write', 'track', 'monitor', 'attend', 
      'demand', 'request', 'visit', 'email', 'testify'
    ]
    
    let count = 0
    actionVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi')
      const matches = content.match(regex)
      if (matches) count += matches.length
    })
    
    return count
  }

  private countPrimarySources(content: string): number {
    const sourcePatterns = [
      /\b\w+\.gov\b/g,
      /\b\w+\.edu\b/g,
      /congressional record/gi,
      /government report/gi,
      /official document/gi
    ]
    
    let count = 0
    sourcePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) count += matches.length
    })
    
    return count
  }

  private extractSpecificActors(content: string): string[] {
    const patterns = [
      /senator \w+/gi,
      /representative \w+/gi,
      /congressman \w+/gi,
      /congresswoman \w+/gi,
      /president \w+/gi,
      /justice \w+/gi,
      /secretary \w+/gi,
      /governor \w+/gi,
      /\w+ administration/gi,
      /\w+ committee/gi,
      /\w+ department/gi
    ]
    
    const actors = new Set<string>()
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => actors.add(match.toLowerCase()))
      }
    })
    
    return Array.from(actors)
  }

  private calculateActiveVoicePercentage(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0) return 0
    
    let activeCount = 0
    sentences.forEach(sentence => {
      // Simple heuristic: sentences starting with subject + action verb
      if (!/\b(was|were|been|being|is|are|am)\b/i.test(sentence.trim())) {
        activeCount++
      }
    })
    
    return Math.round((activeCount / sentences.length) * 100)
  }

  private calculateReadabilityScore(content: string): number {
    // Simple Flesch-Kincaid approximation
    const words = content.split(/\s+/).length
    const sentences = content.split(/[.!?]+/).length
    const syllables = this.countSyllables(content)
    
    const avgWordsPerSentence = words / sentences
    const avgSyllablesPerWord = syllables / words
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .length
  }

  private challengesAssumptions(content: string): boolean {
    const patterns = [
      /contrary to popular belief/i,
      /not what you'd expect/i,
      /assumption.*wrong/i,
      /think again/i,
      /reality is/i
    ]
    
    return patterns.some(pattern => pattern.test(content))
  }

  private avoidsUndercutLanguage(content: string): boolean {
    const undercutPatterns = [
      /some would say/i,
      /it could be argued/i,
      /many experts believe/i,
      /there are concerns/i,
      /mistakes were made/i,
      /both sides/i
    ]
    
    return !undercutPatterns.some(pattern => pattern.test(content))
  }

  private assignsResponsibility(content: string): boolean {
    const responsibilityPatterns = [
      /\w+ voted to/i,
      /\w+ decided to/i,
      /\w+ chose to/i,
      /\w+ blocked/i,
      /\w+ opposed/i,
      /\w+ supported/i
    ]
    
    return responsibilityPatterns.some(pattern => pattern.test(content))
  }

  private hasUncomfortableTruth(content: string): boolean {
    return this.detectUncomfortableTruths(content).length > 0
  }

  private calculateEducationalValue(content: string): number {
    let score = 0
    
    // Educational patterns
    if (/how .* works/i.test(content)) score += 25
    if (/process of/i.test(content)) score += 20
    if (/(step by step|sequence|timeline)/i.test(content)) score += 20
    if (/(because|therefore|as a result)/i.test(content)) score += 15
    if (/(example|for instance)/i.test(content)) score += 20
    
    return Math.min(100, score)
  }

  private calculateMisconceptionCorrection(content: string): number {
    let score = 0
    
    if (/(not what|different from|actually)/i.test(content)) score += 30
    if (/(myth|misconception|false belief)/i.test(content)) score += 40
    if (/(truth is|reality is|fact is)/i.test(content)) score += 30
    
    return Math.min(100, score)
  }

  private calculateEngagementPotential(content: string): number {
    let score = 0
    
    const actionCount = this.countActionSteps(content)
    score += Math.min(50, actionCount * 12)
    
    if (/(you can|take action|get involved)/i.test(content)) score += 25
    if (/(contact|call|write|visit)/i.test(content)) score += 25
    
    return Math.min(100, score)
  }

  generateImprovementSuggestions(assessment: ContentQualityAssessment): string[] {
    const suggestions: string[] = []
    
    if (assessment.brand_voice_score < this.thresholds.minimumBrandVoiceScore) {
      suggestions.push("Add uncomfortable truths that politicians don't want people to know")
      suggestions.push("Name specific institutions and officials instead of vague 'government' references")
      suggestions.push("Use more active voice and direct language")
    }
    
    if (assessment.power_dynamics_score < this.thresholds.minimumPowerDynamicsScore) {
      suggestions.push("Reveal who actually makes decisions vs. who appears to make them")
      suggestions.push("Explain financial interests and hidden influence networks")
      suggestions.push("Show gaps between official process and actual process")
    }
    
    if (assessment.civic_engagement_score < this.thresholds.minimumCivicEngagementScore) {
      suggestions.push("Add 3-5 specific action steps with contact information")
      suggestions.push("Include timing guidance for maximum impact")
      suggestions.push("Provide escalation steps if officials don't respond")
    }
    
    if (assessment.accuracy_score < this.thresholds.minimumAccuracyScore) {
      suggestions.push("Add primary source citations from government or academic sources")
      suggestions.push("Distinguish clearly between facts and analysis")
      suggestions.push("Include verifiable data and statistics")
    }
    
    return suggestions
  }
} 