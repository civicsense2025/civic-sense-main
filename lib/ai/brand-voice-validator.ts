/**
 * Brand Voice Validator for CivicSense AI
 * 
 * Ensures all content follows CivicSense's brand voice standards:
 * - Truth over comfort
 * - Clarity over politeness
 * - Action over passive consumption
 * - Evidence over opinion
 */

export interface BrandVoiceConfig {
  uncomfortableTruthRequired: boolean
  activeVoiceMinimum: number // percentage
  specificActorsRequired: number // minimum count
  powerDynamicsRequired: boolean
  diplomaticSofteningForbidden: boolean
}

export interface BrandVoiceAssessment {
  overall_compliance: number // 0-100
  uncomfortable_truth_score: number
  active_voice_score: number
  specific_actors_score: number
  power_dynamics_score: number
  directness_score: number
  
  violations: BrandVoiceViolation[]
  recommendations: string[]
  passes_minimum_standards: boolean
}

export interface BrandVoiceViolation {
  type: 'diplomatic_softening' | 'passive_voice' | 'vague_language' | 'missing_uncomfortable_truth' | 'weak_power_analysis'
  severity: 'critical' | 'major' | 'minor'
  location: string
  explanation: string
  suggested_fix: string
}

export class BrandVoiceValidator {
  private config: BrandVoiceConfig

  constructor(config: BrandVoiceConfig) {
    this.config = config
  }

  async validateContent(content: string): Promise<BrandVoiceAssessment> {
    const violations: BrandVoiceViolation[] = []
    
    // Check for uncomfortable truths
    const uncomfortableTruthScore = this.assessUncomfortableTruths(content, violations)
    
    // Check for active voice usage
    const activeVoiceScore = this.assessActiveVoice(content, violations)
    
    // Check for specific actor naming
    const specificActorsScore = this.assessSpecificActors(content, violations)
    
    // Check for power dynamics analysis
    const powerDynamicsScore = this.assessPowerDynamics(content, violations)
    
    // Check for directness (no diplomatic softening)
    const directnessScore = this.assessDirectness(content, violations)
    
    const overallCompliance = Math.round(
      (uncomfortableTruthScore + activeVoiceScore + specificActorsScore + powerDynamicsScore + directnessScore) / 5
    )
    
    const passesMinimum = this.assessMinimumStandards(
      uncomfortableTruthScore,
      activeVoiceScore,
      specificActorsScore,
      powerDynamicsScore,
      directnessScore
    )
    
    return {
      overall_compliance: overallCompliance,
      uncomfortable_truth_score: uncomfortableTruthScore,
      active_voice_score: activeVoiceScore,
      specific_actors_score: specificActorsScore,
      power_dynamics_score: powerDynamicsScore,
      directness_score: directnessScore,
      violations,
      recommendations: this.generateRecommendations(violations),
      passes_minimum_standards: passesMinimum
    }
  }

  private assessUncomfortableTruths(content: string, violations: BrandVoiceViolation[]): number {
    let score = 0
    
    // Positive indicators (what politicians don't want people to know)
    const uncomfortablePatterns = [
      /don't want (you|people|citizens) to know/i,
      /politicians (hide|conceal|avoid mentioning)/i,
      /what they're not telling you/i,
      /uncomfortable truth/i,
      /here's what they hope you won't notice/i,
      /reality is different/i,
      /behind the political theater/i
    ]
    
    let uncomfortableCount = 0
    uncomfortablePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        uncomfortableCount++
        score += 20
      }
    })
    
    // Check for power structure revelations
    const powerRevelationPatterns = [
      /who actually (controls|decides|benefits)/i,
      /real reason.*is/i,
      /follow the money/i,
      /hidden interests/i,
      /behind closed doors/i
    ]
    
    powerRevelationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        score += 15
      }
    })
    
    if (this.config.uncomfortableTruthRequired && uncomfortableCount === 0) {
      violations.push({
        type: 'missing_uncomfortable_truth',
        severity: 'critical',
        location: 'Throughout content',
        explanation: 'Content lacks uncomfortable truths that politicians don\'t want people to know',
        suggested_fix: 'Add revelations about how power actually works vs. how it appears to work'
      })
    }
    
    return Math.min(100, score)
  }

  private assessActiveVoice(content: string, violations: BrandVoiceViolation[]): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0) return 0
    
    let activeCount = 0
    const passiveViolations: string[] = []
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim()
      
      // Check for passive voice indicators
      const passivePatterns = [
        /\b(was|were|is|are|am|been|being)\s+\w+ed\b/i,
        /mistakes were made/i,
        /decisions were taken/i,
        /it was decided/i,
        /there are concerns/i
      ]
      
      const hasPassive = passivePatterns.some(pattern => pattern.test(trimmed))
      
      if (!hasPassive) {
        activeCount++
      } else {
        passiveViolations.push(trimmed.substring(0, 100) + '...')
      }
    })
    
    const activePercentage = (activeCount / sentences.length) * 100
    
    if (activePercentage < this.config.activeVoiceMinimum) {
      violations.push({
        type: 'passive_voice',
        severity: 'major',
        location: `${passiveViolations.length} sentences`,
        explanation: `Only ${Math.round(activePercentage)}% active voice (minimum: ${this.config.activeVoiceMinimum}%)`,
        suggested_fix: 'Replace passive constructions with active voice that assigns responsibility'
      })
    }
    
    return Math.round(activePercentage)
  }

  private assessSpecificActors(content: string, violations: BrandVoiceViolation[]): number {
    const specificActorPatterns = [
      // Government officials
      /(?:Senator|Rep\.|Representative|Congressman|Congresswoman)\s+[A-Z][a-z]+/g,
      /President\s+[A-Z][a-z]+/g,
      /Justice\s+[A-Z][a-z]+/g,
      /Secretary\s+[A-Z][a-z]+/g,
      /Governor\s+[A-Z][a-z]+/g,
      
      // Institutions
      /[A-Z][a-z]+\s+Committee/g,
      /[A-Z][a-z]+\s+Department/g,
      /[A-Z][a-z]+\s+Administration/g,
      /[A-Z][a-z]+\s+Agency/g,
      
      // Specific companies/organizations
      /[A-Z][a-z]+\s+Corporation/g,
      /[A-Z][a-z]+\s+Industries/g
    ]
    
    let actorCount = 0
    const actors = new Set<string>()
    
    specificActorPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => actors.add(match.toLowerCase()))
      }
    })
    
    actorCount = actors.size
    
    // Check for vague language
    const vaguePatterns = [
      /\bgovernment\b(?!\s+\w+)/gi, // "government" without specifics
      /\bofficials\b/gi,
      /\bauthorities\b/gi,
      /\bthey\b/gi,
      /\bsome experts\b/gi,
      /\bmany believe\b/gi
    ]
    
    let vagueCount = 0
    vaguePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) vagueCount += matches.length
    })
    
    if (actorCount < this.config.specificActorsRequired) {
      violations.push({
        type: 'vague_language',
        severity: 'major',
        location: 'Throughout content',
        explanation: `Only ${actorCount} specific actors named (minimum: ${this.config.specificActorsRequired})`,
        suggested_fix: 'Replace vague references like "government" with specific officials, committees, or departments'
      })
    }
    
    if (vagueCount > actorCount) {
      violations.push({
        type: 'vague_language',
        severity: 'minor',
        location: `${vagueCount} instances`,
        explanation: 'More vague references than specific actor names',
        suggested_fix: 'Replace "officials," "authorities," "they" with specific names and titles'
      })
    }
    
    // Score based on ratio of specific to vague
    const score = Math.min(100, (actorCount / Math.max(1, vagueCount)) * 50)
    return Math.round(score)
  }

  private assessPowerDynamics(content: string, violations: BrandVoiceViolation[]): number {
    let score = 0
    
    // Strong power dynamics indicators
    const strongPowerPatterns = [
      /who (actually|really) (makes|controls|decides)/i,
      /behind the scenes/i,
      /real power lies with/i,
      /follow the money/i,
      /financial interests/i,
      /lobbying pressure/i,
      /unofficial influence/i,
      /backdoor negotiations/i
    ]
    
    // Moderate power dynamics indicators
    const moderatePowerPatterns = [
      /influence of/i,
      /pressure from/i,
      /interests of/i,
      /benefits.*while/i,
      /costs.*while/i,
      /winners and losers/i
    ]
    
    strongPowerPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 25
    })
    
    moderatePowerPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 15
    })
    
    if (this.config.powerDynamicsRequired && score < 25) {
      violations.push({
        type: 'weak_power_analysis',
        severity: 'major',
        location: 'Throughout content',
        explanation: 'Content lacks analysis of how power actually works',
        suggested_fix: 'Explain who actually makes decisions, who benefits, and what interests are at stake'
      })
    }
    
    return Math.min(100, score)
  }

  private assessDirectness(content: string, violations: BrandVoiceViolation[]): number {
    let score = 100 // Start with perfect score, deduct for violations
    
    // Diplomatic softening patterns (forbidden)
    const diplomaticPatterns = [
      { pattern: /some would say/gi, deduction: 15, phrase: 'some would say' },
      { pattern: /it could be argued/gi, deduction: 15, phrase: 'it could be argued' },
      { pattern: /many experts believe/gi, deduction: 10, phrase: 'many experts believe' },
      { pattern: /there are concerns/gi, deduction: 10, phrase: 'there are concerns' },
      { pattern: /mistakes were made/gi, deduction: 20, phrase: 'mistakes were made' },
      { pattern: /both sides/gi, deduction: 15, phrase: 'both sides' },
      { pattern: /perhaps/gi, deduction: 5, phrase: 'perhaps' },
      { pattern: /might/gi, deduction: 5, phrase: 'might' },
      { pattern: /possibly/gi, deduction: 5, phrase: 'possibly' },
      { pattern: /allegedly/gi, deduction: 10, phrase: 'allegedly' }
    ]
    
    diplomaticPatterns.forEach(({ pattern, deduction, phrase }) => {
      const matches = content.match(pattern)
      if (matches) {
        score -= deduction * matches.length
        
        if (this.config.diplomaticSofteningForbidden) {
          violations.push({
            type: 'diplomatic_softening',
            severity: deduction >= 15 ? 'major' : 'minor',
            location: `${matches.length} instances`,
            explanation: `Uses diplomatic softening phrase: "${phrase}"`,
            suggested_fix: `Replace "${phrase}" with direct, assertive language that assigns responsibility`
          })
        }
      }
    })
    
    return Math.max(0, score)
  }

  private assessMinimumStandards(
    uncomfortableTruth: number,
    activeVoice: number,
    specificActors: number,
    powerDynamics: number,
    directness: number
  ): boolean {
    return (
      uncomfortableTruth >= 40 &&  // Must have some uncomfortable truth
      activeVoice >= this.config.activeVoiceMinimum &&
      specificActors >= 30 &&      // Must name some specific actors
      powerDynamics >= 25 &&       // Must have some power analysis
      directness >= 70             // Must be reasonably direct
    )
  }

  private generateRecommendations(violations: BrandVoiceViolation[]): string[] {
    const recommendations: string[] = []
    
    const criticalViolations = violations.filter(v => v.severity === 'critical')
    const majorViolations = violations.filter(v => v.severity === 'major')
    
    if (criticalViolations.length > 0) {
      recommendations.push('CRITICAL: Add uncomfortable truths that politicians don\'t want people to know')
    }
    
    if (majorViolations.some(v => v.type === 'passive_voice')) {
      recommendations.push('Convert passive voice to active voice that assigns responsibility')
    }
    
    if (majorViolations.some(v => v.type === 'vague_language')) {
      recommendations.push('Replace vague references with specific officials, committees, and institutions')
    }
    
    if (majorViolations.some(v => v.type === 'weak_power_analysis')) {
      recommendations.push('Add analysis of who actually makes decisions and who benefits')
    }
    
    if (majorViolations.some(v => v.type === 'diplomatic_softening')) {
      recommendations.push('Remove diplomatic language and use direct, assertive statements')
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Content meets basic brand voice standards')
      recommendations.push('Consider adding more power dynamics analysis for stronger impact')
    }
    
    return recommendations
  }

  // Utility methods
  
  enhanceContent(content: string): string {
    // This would implement automatic content enhancement
    // For now, return content as-is
    return content
  }
  
  generateBrandVoiceReport(assessment: BrandVoiceAssessment): string {
    let report = `Brand Voice Compliance Report\n`
    report += `Overall Score: ${assessment.overall_compliance}/100\n\n`
    
    report += `Component Scores:\n`
    report += `- Uncomfortable Truth: ${assessment.uncomfortable_truth_score}/100\n`
    report += `- Active Voice: ${assessment.active_voice_score}/100\n`
    report += `- Specific Actors: ${assessment.specific_actors_score}/100\n`
    report += `- Power Dynamics: ${assessment.power_dynamics_score}/100\n`
    report += `- Directness: ${assessment.directness_score}/100\n\n`
    
    if (assessment.violations.length > 0) {
      report += `Violations (${assessment.violations.length}):\n`
      assessment.violations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.type.toUpperCase()} (${violation.severity})\n`
        report += `   ${violation.explanation}\n`
        report += `   Fix: ${violation.suggested_fix}\n\n`
      })
    }
    
    if (assessment.recommendations.length > 0) {
      report += `Recommendations:\n`
      assessment.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`
      })
    }
    
    report += `\nPasses Minimum Standards: ${assessment.passes_minimum_standards ? 'YES' : 'NO'}`
    
    return report
  }
} 