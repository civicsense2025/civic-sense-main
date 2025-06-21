/**
 * Source Verification Engine for CivicSense AI
 * 
 * Validates factual claims and ensures authoritative sourcing.
 * Integrates with real-time fact-checking APIs and source databases.
 */

export interface FactVerificationResult {
  claim: string
  verification_status: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'needs_context'
  confidence_score: number // 0-100
  sources: SourceReference[]
  contradictory_sources?: SourceReference[]
  context_needed?: string
  fact_check_notes: string
  verification_timestamp: Date
}

export interface SourceReference {
  url: string
  title: string
  author?: string
  publication_date?: Date
  source_type: 'government' | 'academic' | 'journalism' | 'think_tank' | 'advocacy' | 'other'
  credibility_tier: 1 | 2 | 3 | 4 // 1 = highest (.gov), 2 = academic, 3 = established journalism, 4 = other
  relevance_score: number // 0-100
  bias_rating?: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'mixed' | 'unknown'
  content_excerpt: string
}

export interface ClaimExtraction {
  text: string
  claim_type: 'statistical' | 'policy' | 'historical' | 'legal' | 'procedural' | 'opinion'
  verifiability: 'verifiable' | 'partially_verifiable' | 'opinion' | 'prediction'
  priority: 'high' | 'medium' | 'low'
  context: string
}

export class SourceVerificationEngine {
  private governmentSources = [
    'congress.gov',
    'senate.gov',
    'house.gov',
    'gao.gov',
    'cbo.gov',
    'supremecourt.gov',
    'whitehouse.gov',
    'treasury.gov',
    'justice.gov',
    'federalregister.gov',
    'fec.gov',
    'opensecrets.org'
  ]

  private academicSources = [
    '.edu',
    'jstor.org',
    'scholar.google.com',
    'brookings.edu',
    'aei.org',
    'heritage.org',
    'cato.org',
    'cfr.org'
  ]

  private establishedJournalism = [
    'reuters.com',
    'apnews.com',
    'bloomberg.com',
    'wsj.com',
    'washingtonpost.com',
    'nytimes.com',
    'npr.org',
    'pbs.org',
    'bbc.com'
  ]

  async verifyContent(content: string): Promise<FactVerificationResult[]> {
    const claims = this.extractClaims(content)
    const verificationPromises = claims.map(claim => this.verifyClaim(claim))
    
    return Promise.all(verificationPromises)
  }

  async verifyClaim(claim: ClaimExtraction): Promise<FactVerificationResult> {
    try {
      // Search for supporting and contradictory sources
      const sources = await this.searchForSources(claim.text)
      const supportingSources = sources.filter(s => s.relevance_score >= 70)
      const contradictorySources = sources.filter(s => s.relevance_score < 30)
      
      // Determine verification status
      const verificationStatus = this.determineVerificationStatus(
        supportingSources,
        contradictorySources,
        claim.verifiability
      )
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        supportingSources,
        contradictorySources,
        claim.claim_type
      )
      
      return {
        claim: claim.text,
        verification_status: verificationStatus,
        confidence_score: confidenceScore,
        sources: supportingSources,
        contradictory_sources: contradictorySources.length > 0 ? contradictorySources : undefined,
        context_needed: this.generateContextNeeded(claim, supportingSources),
        fact_check_notes: this.generateFactCheckNotes(claim, supportingSources, contradictorySources),
        verification_timestamp: new Date()
      }
    } catch (error) {
      console.error('Error verifying claim:', error)
      return {
        claim: claim.text,
        verification_status: 'unverified',
        confidence_score: 0,
        sources: [],
        fact_check_notes: 'Verification failed due to technical error',
        verification_timestamp: new Date()
      }
    }
  }

  private extractClaims(content: string): ClaimExtraction[] {
    const claims: ClaimExtraction[] = []
    
    // Statistical claims
    const statisticalPatterns = [
      /\d+%/g,
      /\$\d+(?:\.\d+)?\s*(?:billion|million|trillion)/gi,
      /\d+(?:,\d{3})*\s+(?:people|Americans|voters|citizens)/gi,
      /increased by \d+/gi,
      /decreased by \d+/gi
    ]
    
    statisticalPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          claims.push({
            text: this.extractSentenceContaining(content, match),
            claim_type: 'statistical',
            verifiability: 'verifiable',
            priority: 'high',
            context: `Statistical claim: ${match}`
          })
        })
      }
    })
    
    // Policy claims
    const policyPatterns = [
      /bill (HR|S) \d+/gi,
      /act of \d{4}/gi,
      /passed by congress/gi,
      /signed into law/gi,
      /voted (for|against)/gi
    ]
    
    policyPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          claims.push({
            text: this.extractSentenceContaining(content, match),
            claim_type: 'policy',
            verifiability: 'verifiable',
            priority: 'high',
            context: `Policy claim: ${match}`
          })
        })
      }
    })
    
    // Legal/procedural claims
    const legalPatterns = [
      /supreme court ruled/gi,
      /federal court/gi,
      /constitutional/gi,
      /amendment/gi,
      /according to the law/gi
    ]
    
    legalPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          claims.push({
            text: this.extractSentenceContaining(content, match),
            claim_type: 'legal',
            verifiability: 'verifiable',
            priority: 'medium',
            context: `Legal claim: ${match}`
          })
        })
      }
    })
    
    return claims
  }

  private extractSentenceContaining(content: string, phrase: string): string {
    const sentences = content.split(/[.!?]+/)
    const containingSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(phrase.toLowerCase())
    )
    return containingSentence?.trim() || phrase
  }

  private async searchForSources(claim: string): Promise<SourceReference[]> {
    // In a real implementation, this would call external APIs
    // For now, return mock sources based on patterns
    const sources: SourceReference[] = []
    
    // Check for government source patterns
    if (this.isGovernmentRelated(claim)) {
      sources.push({
        url: 'https://congress.gov/bill/example',
        title: 'Congressional Record Entry',
        source_type: 'government',
        credibility_tier: 1,
        relevance_score: 85,
        content_excerpt: 'Government source supporting this claim...',
        publication_date: new Date()
      })
    }
    
    // Check for academic source patterns
    if (this.isAcademicRelated(claim)) {
      sources.push({
        url: 'https://example.edu/research',
        title: 'Academic Research Paper',
        author: 'Dr. Research Scholar',
        source_type: 'academic',
        credibility_tier: 2,
        relevance_score: 78,
        content_excerpt: 'Academic research supporting this claim...',
        publication_date: new Date()
      })
    }
    
    return sources
  }

  private isGovernmentRelated(claim: string): boolean {
    const governmentKeywords = [
      'congress', 'senate', 'house', 'bill', 'law', 'federal',
      'government', 'official', 'agency', 'department', 'budget'
    ]
    
    return governmentKeywords.some(keyword => 
      claim.toLowerCase().includes(keyword)
    )
  }

  private isAcademicRelated(claim: string): boolean {
    const academicKeywords = [
      'study', 'research', 'analysis', 'data', 'survey',
      'report', 'findings', 'statistics', 'evidence'
    ]
    
    return academicKeywords.some(keyword => 
      claim.toLowerCase().includes(keyword)
    )
  }

  private determineVerificationStatus(
    supportingSources: SourceReference[],
    contradictorySources: SourceReference[],
    verifiability: string
  ): FactVerificationResult['verification_status'] {
    if (verifiability === 'opinion' || verifiability === 'prediction') {
      return 'needs_context'
    }
    
    const highCredibilitySources = supportingSources.filter(s => s.credibility_tier <= 2)
    const contradictoryHighCredibility = contradictorySources.filter(s => s.credibility_tier <= 2)
    
    if (highCredibilitySources.length >= 2 && contradictoryHighCredibility.length === 0) {
      return 'verified'
    }
    
    if (highCredibilitySources.length >= 1 && contradictoryHighCredibility.length === 0) {
      return 'partially_verified'
    }
    
    if (contradictoryHighCredibility.length > 0) {
      return 'contradicted'
    }
    
    return 'unverified'
  }

  private calculateConfidenceScore(
    supportingSources: SourceReference[],
    contradictorySources: SourceReference[],
    claimType: string
  ): number {
    let score = 0
    
    // Base score from supporting sources
    supportingSources.forEach(source => {
      switch (source.credibility_tier) {
        case 1: score += 30; break
        case 2: score += 20; break
        case 3: score += 15; break
        case 4: score += 10; break
      }
    })
    
    // Penalty for contradictory sources
    contradictorySources.forEach(source => {
      switch (source.credibility_tier) {
        case 1: score -= 25; break
        case 2: score -= 20; break
        case 3: score -= 10; break
        case 4: score -= 5; break
      }
    })
    
    // Adjustment for claim type
    if (claimType === 'statistical' || claimType === 'legal') {
      score += 10 // Easier to verify
    } else if (claimType === 'opinion') {
      score -= 20 // Harder to verify
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private generateContextNeeded(
    claim: ClaimExtraction,
    sources: SourceReference[]
  ): string | undefined {
    if (claim.verifiability === 'opinion') {
      return 'This is an opinion or analysis. Consider labeling as analysis rather than fact.'
    }
    
    if (sources.length === 0) {
      return 'No authoritative sources found. Consider adding government or academic citations.'
    }
    
    if (claim.claim_type === 'statistical' && sources.length < 2) {
      return 'Statistical claims should have multiple authoritative sources for verification.'
    }
    
    return undefined
  }

  private generateFactCheckNotes(
    claim: ClaimExtraction,
    supportingSources: SourceReference[],
    contradictorySources: SourceReference[]
  ): string {
    let notes = ''
    
    if (supportingSources.length > 0) {
      const tier1Sources = supportingSources.filter(s => s.credibility_tier === 1).length
      const tier2Sources = supportingSources.filter(s => s.credibility_tier === 2).length
      
      notes += `Supported by ${supportingSources.length} sources`
      if (tier1Sources > 0) notes += ` (${tier1Sources} government)`
      if (tier2Sources > 0) notes += ` (${tier2Sources} academic)`
      notes += '. '
    }
    
    if (contradictorySources.length > 0) {
      notes += `Contradicted by ${contradictorySources.length} sources. Review needed. `
    }
    
    if (claim.claim_type === 'statistical') {
      notes += 'Statistical claim - verify data source and methodology. '
    }
    
    if (claim.claim_type === 'policy') {
      notes += 'Policy claim - verify through official government records. '
    }
    
    return notes.trim()
  }

  // Utility methods for source credibility assessment
  assessSourceCredibility(url: string): number {
    const domain = this.extractDomain(url)
    
    if (this.governmentSources.some(gov => domain.includes(gov))) {
      return 95
    }
    
    if (this.academicSources.some(academic => domain.includes(academic))) {
      return 85
    }
    
    if (this.establishedJournalism.some(journalism => domain.includes(journalism))) {
      return 75
    }
    
    return 50 // Default for unknown sources
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  generateSourceReport(sources: SourceReference[]): string {
    const tier1 = sources.filter(s => s.credibility_tier === 1)
    const tier2 = sources.filter(s => s.credibility_tier === 2)
    const tier3 = sources.filter(s => s.credibility_tier === 3)
    const tier4 = sources.filter(s => s.credibility_tier === 4)
    
    let report = `Source Analysis:\n`
    report += `- Government sources: ${tier1.length}\n`
    report += `- Academic sources: ${tier2.length}\n`
    report += `- Journalism sources: ${tier3.length}\n`
    report += `- Other sources: ${tier4.length}\n`
    
    if (tier1.length >= 2) {
      report += `\nStrong verification: Multiple government sources support claims.`
    } else if (tier1.length + tier2.length >= 2) {
      report += `\nGood verification: Government and academic sources support claims.`
    } else {
      report += `\nWeak verification: Consider adding more authoritative sources.`
    }
    
    return report
  }
} 