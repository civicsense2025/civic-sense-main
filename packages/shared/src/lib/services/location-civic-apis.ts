// Location-Aware Civic Engagement API Services
// Based on updated 2025 API landscape

import { createClient } from '../supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

// Type definitions
interface Representative {
  id: string
  name: string
  office: string
  level: 'federal' | 'state' | 'local'
  party?: string
  state?: string
  district?: string | number
  chamber?: string
  phone?: string
  email?: string
  website?: string
  officeAddress?: string
  address?: string
  title?: string
  ocdId?: string
  jurisdiction?: string
  dataSource: string
  sourceId: string
  lastVerified: string
  needsManualVerification?: boolean
}

interface RepresentativeResults {
  federal: Representative[]
  state: Representative[]
  local: Representative[]
  coverage: {
    federal: 'complete' | 'partial' | 'missing' | 'error'
    state: 'complete' | 'partial' | 'missing' | 'error' 
    local: 'complete' | 'partial' | 'manual_lookup_required' | 'missing'
  }
  divisions: any
  errors: string[]
}

// Rate limiter utility
class APIRateLimiter {
  private lastRequest: number = 0
  private minInterval: number

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond
  }

  async wait(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequest = Date.now()
  }
}

// Congress.gov API Service (Official Library of Congress API)
export class CongressGovService {
  private apiKey: string
  private baseURL = 'https://api.congress.gov/v3'
  private rateLimiter = new APIRateLimiter(1.4) // 5,000/hour = ~1.4/second

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CONGRESS_GOV_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Congress.gov API key not provided')
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    await this.rateLimiter.wait()

    const queryParams = new URLSearchParams({
      ...params,
      api_key: this.apiKey,
      format: 'json'
    })

    const response = await fetch(`${this.baseURL}${endpoint}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    })

    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getMembers(congress = 119, chamber?: 'house' | 'senate') {
    const endpoint = chamber ? `/${chamber}/member` : '/member'
    return this.makeRequest(endpoint, { 
      currentMember: 'true',
      congress 
    })
  }

  async getMembersByState(state: string, chamber?: 'house' | 'senate') {
    const endpoint = chamber ? `/${chamber}/member` : '/member'
    return this.makeRequest(endpoint, {
      currentMember: 'true',
      stateCode: state.toUpperCase()
    })
  }

  async getMembersByDistrict(state: string, district: number) {
    return this.makeRequest('/house/member', {
      currentMember: 'true',
      stateCode: state.toUpperCase(),
      district
    })
  }

  async getBills(params: {
    congress?: number
    limit?: number
    offset?: number
    fromDateTime?: string
    toDateTime?: string
  } = {}) {
    return this.makeRequest('/bill', {
      limit: 20,
      ...params
    })
  }
}

// OpenStates API v3 Service (Now operated by Plural Policy)
export class OpenStatesService {
  private apiKey: string
  private baseURL = 'https://v3.openstates.org/api'
  private rateLimiter = new APIRateLimiter(0.16) // 10/minute = ~0.16/second

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENSTATES_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenStates API key not provided')
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    await this.rateLimiter.wait()

    const queryParams = new URLSearchParams({
      ...params,
      apikey: this.apiKey
    })

    const response = await fetch(`${this.baseURL}${endpoint}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    })

    if (!response.ok) {
      throw new Error(`OpenStates API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getLegislatorsByLocation(lat: number, lng: number) {
    return this.makeRequest('/people.geo', { lat, lng })
  }

  async getLegislatorsByState(state: string) {
    return this.makeRequest('/people', { jurisdiction: state })
  }

  async getBillsByState(state: string, session?: string) {
    return this.makeRequest('/bills', {
      jurisdiction: state,
      session
    })
  }

  async getCommitteesByState(state: string) {
    return this.makeRequest('/committees', { jurisdiction: state })
  }
}

// Google Civic Information API Service (Elections + Divisions Only)
export class CivicElectionsService {
  private apiKey: string
  private baseURL = 'https://www.googleapis.com/civicinfo/v2'
  private rateLimiter = new APIRateLimiter(6.9) // 25,000/day = ~6.9/second

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_CIVIC_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google Civic API key not provided')
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    await this.rateLimiter.wait()

    const queryParams = new URLSearchParams({
      ...params,
      key: this.apiKey
    })

    const response = await fetch(`${this.baseURL}${endpoint}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    })

    if (!response.ok) {
      throw new Error(`Google Civic API error: ${response.statusText}`)
    }

    return response.json()
  }

  // Get OCD-IDs by address (replacement for representatives endpoint)
  async getDivisionsByAddress(address: string) {
    return this.makeRequest('/divisions', { query: address })
  }

  // Still works: Election and voting info
  async getVoterInfo(address: string, electionId?: string) {
    const params: any = { address }
    if (electionId) params.electionId = electionId
    
    return this.makeRequest('/voterinfo', params)
  }

  // Get upcoming elections
  async getElections() {
    return this.makeRequest('/elections')
  }
}

// Hybrid Representative Service - Combines all APIs
export class HybridRepresentativeService {
  private congressAPI: CongressGovService
  private statesAPI: OpenStatesService
  private civicAPI: CivicElectionsService
  private supabase = createClient()

  constructor() {
    this.congressAPI = new CongressGovService()
    this.statesAPI = new OpenStatesService()
    this.civicAPI = new CivicElectionsService()
  }

  async getAllRepresentatives(address: string, lat?: number, lng?: number): Promise<RepresentativeResults> {
    try {
      const results: RepresentativeResults = {
        federal: [],
        state: [],
        local: [],
        coverage: {
          federal: 'complete',
          state: 'complete',
          local: 'manual_lookup_required'
        },
        divisions: null,
        errors: []
      }

      // 1. Get OCD-IDs from Google Civic
      try {
        results.divisions = await this.civicAPI.getDivisionsByAddress(address)
        const { state, congressionalDistrict } = this.parseOCDIds(results.divisions)

        // 2. Fetch federal representatives from Congress.gov
        if (state) {
          try {
            const federalReps = await this.congressAPI.getMembersByState(state)
            results.federal = this.formatFederalRepresentatives(federalReps.members || [])
          } catch (error) {
            results.errors.push(`Federal data error: ${error}`)
            results.coverage.federal = 'error'
          }
        }

        // 3. Fetch state legislators from OpenStates
        if (lat && lng) {
          try {
            const stateReps = await this.statesAPI.getLegislatorsByLocation(lat, lng)
            results.state = this.formatStateRepresentatives(stateReps.results || [])
          } catch (error) {
            results.errors.push(`State data error: ${error}`)
            results.coverage.state = 'error'
          }
        } else if (state) {
          try {
            const stateReps = await this.statesAPI.getLegislatorsByState(state)
            results.state = this.formatStateRepresentatives(stateReps.results || [])
          } catch (error) {
            results.errors.push(`State data error: ${error}`)
            results.coverage.state = 'partial'
          }
        }

        // 4. For local officials: use cached data or manual lookup
        const localReps = await this.getLocalOfficials(address)
        results.local = localReps
        if (localReps.length > 0) {
          results.coverage.local = 'partial'
        }

      } catch (error) {
        results.errors.push(`Address lookup error: ${error}`)
      }

      return results
    } catch (error) {
      throw new Error(`Failed to get representatives: ${error}`)
    }
  }

  private parseOCDIds(divisions: any) {
    const ocdIds = divisions?.results || []
    let state = ''
    let congressionalDistrict = null

    for (const division of ocdIds) {
      const ocdId = division.ocdId || ''
      
      // Extract state from OCD-ID (e.g., ocd-division/country:us/state:tx)
      const stateMatch = ocdId.match(/state:([a-z]{2})/)
      if (stateMatch) {
        state = stateMatch[1].toUpperCase()
      }

      // Extract congressional district (e.g., ocd-division/country:us/state:tx/cd:21)
      const districtMatch = ocdId.match(/cd:(\d+)/)
      if (districtMatch) {
        congressionalDistrict = parseInt(districtMatch[1])
      }
    }

    return { state, congressionalDistrict }
  }

  private formatFederalRepresentatives(members: any[]): Representative[] {
    return members.map(member => ({
      id: member.bioguideId,
      name: `${member.firstName} ${member.lastName}`,
      office: member.terms?.[0]?.chamber === 'House of Representatives' ? 'Representative' : 'Senator',
      level: 'federal' as const,
      party: member.partyName,
      state: member.state,
      district: member.district,
      phone: member.terms?.[0]?.phone,
      email: member.terms?.[0]?.email,
      website: member.terms?.[0]?.website,
      officeAddress: member.terms?.[0]?.address,
      dataSource: 'congress_gov',
      sourceId: member.bioguideId,
      lastVerified: new Date().toISOString()
    }))
  }

  private formatStateRepresentatives(legislators: any[]): Representative[] {
    return legislators.map(legislator => ({
      id: legislator.id,
      name: legislator.name,
      office: legislator.party,
      level: 'state' as const,
      party: legislator.party,
      chamber: legislator.current_role?.chamber,
      district: legislator.current_role?.district,
      phone: legislator.contact_details?.find((c: any) => c.type === 'voice')?.value,
      email: legislator.contact_details?.find((c: any) => c.type === 'email')?.value,
      website: legislator.links?.find((l: any) => l.note === 'Official Website')?.url,
      dataSource: 'openstates',
      sourceId: legislator.id,
      lastVerified: new Date().toISOString()
    }))
  }

  private async getLocalOfficials(address: string): Promise<Representative[]> {
    // For now, return empty array - this would be populated by:
    // 1. Cached scraped data
    // 2. User-contributed data
    // 3. Manual lookup guidance
    return []
  }

  // Generate local lookup guidance when automated data isn't available
  generateLocalLookupGuide(address: string) {
    const { city, county, state } = this.parseAddress(address)
    
    return {
      suggestions: [
        `Visit ${city} city website`,
        `Check ${county} county website`,
        `Search Ballotpedia: https://ballotpedia.org/Who_represents_me`
      ],
      manualEntryForm: '/admin/representatives/add-local',
      helpText: "Can't find your local officials? Help us improve by adding them!"
    }
  }

  private parseAddress(address: string) {
    // Simple address parsing - could be enhanced with geocoding service
    const parts = address.split(',').map(p => p.trim())
    return {
      city: parts[0] || '',
      county: parts[1] || '',
      state: parts[parts.length - 1] || ''
    }
  }

  // Save representatives to database
  async saveRepresentatives(userId: string, representatives: Representative[], locationHash: string) {
    // TODO: Uncomment when database migration is complete
    /*
    const supabase = this.supabase

    // Clear existing representatives for this user
    await supabase
      .from('user_representatives')
      .delete()
      .eq('user_id', userId)

    // Insert new representatives
    const representativeRecords = representatives.map(rep => ({
      user_id: userId,
      name: rep.name,
      office: rep.office,
      level: rep.level,
      party: rep.party,
      phone: rep.phone,
      email: rep.email,
      website_url: rep.website,
      office_address: rep.officeAddress,
      ocd_id: rep.ocdId,
      district_name: rep.district?.toString(),
      jurisdiction: rep.jurisdiction,
      data_source: rep.dataSource,
      source_id: rep.sourceId,
      last_verified: rep.lastVerified,
      needs_manual_verification: rep.needsManualVerification || false
    }))

    if (representativeRecords.length > 0) {
      const { error } = await supabase
        .from('user_representatives')
        .insert(representativeRecords)

      if (error) {
        throw new Error(`Failed to save representatives: ${error.message}`)
      }
    }

    // Update location coverage tracking
    await this.updateLocationCoverage(locationHash, representatives)
    */
    
    // For now, just log the data that would be saved
    console.log('Would save representatives:', { userId, count: representatives.length, locationHash })
  }

  private async updateLocationCoverage(locationHash: string, representatives: Representative[]) {
    // TODO: Uncomment when database migration is complete
    /*
    const coverage = {
      federal: representatives.some(r => r.level === 'federal') ? 'complete' : 'missing',
      state: representatives.some(r => r.level === 'state') ? 'complete' : 'missing', 
      local: representatives.some(r => r.level === 'local') ? 'partial' : 'manual'
    }

    await this.supabase
      .from('location_coverage')
      .upsert({
        location_hash: locationHash,
        coverage_level: coverage,
        last_updated: new Date().toISOString(),
        needs_attention: coverage.local === 'manual' || coverage.federal === 'missing'
      }, {
        onConflict: 'location_hash'
      })
    */
    
    // For now, just log the coverage that would be saved
    const coverage = {
      federal: representatives.some(r => r.level === 'federal') ? 'complete' : 'missing',
      state: representatives.some(r => r.level === 'state') ? 'complete' : 'missing', 
      local: representatives.some(r => r.level === 'local') ? 'partial' : 'manual'
    }
    console.log('Would update location coverage:', { locationHash, coverage })
  }
}

// Address geocoding utility
export class AddressGeocodingService {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || ''
  }

  async geocodeAddress(address: string) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key required for geocoding')
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results.length) {
      throw new Error('Address not found')
    }

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      components: result.address_components
    }
  }
}

/**
 * Service for connecting representatives to CivicSense educational content
 * This bridges the gap between civic data and civic education
 */
export class RepresentativeContentService {
  /**
   * Generate action steps specific to contacting a representative
   * This embodies CivicSense's "action over passive consumption" principle
   */
  generateActionSteps(representative: Representative, userIssues: string[] = []): ActionStep[] {
    const steps: ActionStep[] = []

    // Phone contact (most effective)
    if (representative.phone) {
      steps.push({
        type: 'phone_call',
        title: `Call ${representative.name}'s office`,
        description: `Most effective way to influence ${representative.name}'s position`,
        contact: representative.phone,
        difficulty: 'moderate',
        impact: 'high',
        script: this.generateCallScript(representative, userIssues)
      })
    }

    // Email contact
    if (representative.email) {
      steps.push({
        type: 'email',
        title: `Email ${representative.name}`,
        description: 'Follow up your call with a written record',
        contact: representative.email,
        difficulty: 'easy',
        impact: 'medium',
        template: this.generateEmailTemplate(representative, userIssues)
      })
    }

    // Public engagement (always available)
    steps.push({
      type: 'public_engagement',
      title: 'Attend public events',
      description: `Show up to ${representative.name}'s town halls and public appearances`,
      difficulty: 'advanced',
      impact: 'very_high',
      guidance: 'Public pressure is most effective. Come prepared with specific questions.'
    })

    // Letter writing (traditional but effective)
    if (representative.address || representative.officeAddress) {
      steps.push({
        type: 'letter',
        title: 'Send a formal letter',
        description: 'Physical mail gets attention in a digital world',
        contact: representative.address || representative.officeAddress || '',
        difficulty: 'moderate',
        impact: 'medium',
        template: this.generateLetterTemplate(representative, userIssues)
      })
    }

    return steps
  }

  /**
   * Generate a call script tailored to the representative and issues
   */
  private generateCallScript(representative: Representative, issues: string[]): string {
    const issueText = issues.length > 0 ? issues[0] : '[SPECIFIC ISSUE]'
    
    return `
Hi, I'm [YOUR NAME], a constituent from [YOUR AREA]. 

I'm calling to ask ${representative.name} to take action on ${issueText}.

Here's what I want to see:
- [SPECIFIC POLICY POSITION]
- [SPECIFIC VOTE REQUEST]

This matters to me because [PERSONAL IMPACT].

Will ${representative.name} commit to [SPECIFIC ACTION]?

Thank you for your time.
    `.trim()
  }

  /**
   * Generate an email template for constituent outreach
   */
  private generateEmailTemplate(representative: Representative, issues: string[]): string {
    const issueText = issues.length > 0 ? issues[0] : '[ISSUE]'
    
    return `
Subject: Constituent Request: Action Needed on ${issueText}

Dear ${representative.name},

I am writing as your constituent to request your action on ${issueText}.

[BRIEF PERSONAL STORY OF IMPACT]

I urge you to:
1. [SPECIFIC ACTION 1]
2. [SPECIFIC ACTION 2]
3. [SPECIFIC ACTION 3]

I will be watching your votes and actions on this issue.

Thank you for your service.

[YOUR NAME]
[YOUR ADDRESS - proves you're a constituent]
[YOUR PHONE NUMBER]
    `.trim()
  }

  /**
   * Generate a formal letter template
   */
  private generateLetterTemplate(representative: Representative, issues: string[]): string {
    const issueText = issues.length > 0 ? issues[0] : '[ISSUE]'
    const address = representative.address || representative.officeAddress || '[REPRESENTATIVE ADDRESS]'
    const title = representative.title || (representative.office.includes('Senator') ? 'Senator' : 'Representative')
    
    return `
[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[DATE]

The Honorable ${representative.name}
${address}

Dear ${title} ${representative.name},

I am writing to you as a constituent regarding ${issueText}.

[EXPLAIN THE ISSUE AND YOUR POSITION]

[SHARE YOUR PERSONAL STORY OR LOCAL IMPACT]

I respectfully request that you:
1. [SPECIFIC ACTION 1]
2. [SPECIFIC ACTION 2]
3. [SPECIFIC ACTION 3]

I look forward to your response and will be following your actions on this matter.

Sincerely,
[YOUR SIGNATURE]
[YOUR PRINTED NAME]
    `.trim()
  }

  /**
   * Get civic education talking points for an issue
   * This would integrate with CivicSense's content system
   */
  getCivicEducationTalkingPoints(issue: string): {
    powerDynamicsRevealed: string[]
    uncomfortableTruths: string[]
    historicalContext: string[]
    actionableInsights: string[]
  } {
    // This is a placeholder - would integrate with CivicSense's AI content generation
    return {
      powerDynamicsRevealed: [
        'How committee assignments affect which bills get heard',
        'The role of party leadership in vote scheduling',
        'How lobbying shapes legislative priorities'
      ],
      uncomfortableTruths: [
        'Most bills never receive a vote',
        'Committee chairs have enormous gatekeeping power',
        'Public opinion often differs from voting records'
      ],
      historicalContext: [
        'How this issue has evolved over decades',
        'Previous successful advocacy campaigns',
        'Key legislative moments that shaped current policy'
      ],
      actionableInsights: [
        'When to time your outreach for maximum impact',
        'Which specific committee members to target',
        'How to frame your message for this representative\'s priorities'
      ]
    }
  }
}

interface ActionStep {
  type: 'phone_call' | 'email' | 'public_engagement' | 'letter' | 'petition'
  title: string
  description: string
  contact?: string
  difficulty: 'easy' | 'moderate' | 'advanced'
  impact: 'low' | 'medium' | 'high' | 'very_high'
  script?: string
  template?: string
  guidance?: string
}

// Export the main services
export const locationCivicService = new HybridRepresentativeService()
export const geocodingService = new AddressGeocodingService()
export const representativeContentService = new RepresentativeContentService()

// Export types for external use
export type { Representative, RepresentativeResults, ActionStep } 