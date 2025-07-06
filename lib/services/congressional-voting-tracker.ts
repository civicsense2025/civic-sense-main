import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CongressAPIClient } from '@/lib/integrations/congress-api';

// ============================================================================
// CONGRESSIONAL VOTING TRACKER
// ============================================================================
// Tracks member positions, voting records, and advocacy patterns
// Integrates with United States Congress project data structure

interface VoteRecord {
  vote_id: string;
  bill_id: string;
  member_id: string;
  vote_position: 'yes' | 'no' | 'present' | 'not_voting';
  vote_date: string;
  vote_type: 'passage' | 'amendment' | 'procedural' | 'cloture' | 'other';
  chamber: 'house' | 'senate';
  vote_number: number;
  session: number;
  congress_number: number;
  vote_question: string;
  vote_result: 'passed' | 'failed' | 'agreed_to' | 'rejected';
}

interface MemberPosition {
  member_id: string;
  bill_id: string;
  position_type: 'sponsor' | 'cosponsor' | 'public_support' | 'public_opposition' | 'committee_support' | 'committee_opposition';
  position_date: string;
  position_source: 'congressional_record' | 'press_release' | 'social_media' | 'committee_statement' | 'floor_speech';
  position_text?: string;
  confidence_level: number; // 1-10 scale
}

interface AdvocacyRecord {
  member_id: string;
  bill_id: string;
  advocacy_type: 'floor_speech' | 'press_release' | 'social_media' | 'committee_hearing' | 'amendment_proposal';
  advocacy_date: string;
  advocacy_content: string;
  advocacy_stance: 'support' | 'opposition' | 'neutral' | 'amendment';
  media_source?: string;
  source_url?: string;
}

interface VotingPattern {
  member_id: string;
  bill_category: string;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  present_votes: number;
  missed_votes: number;
  alignment_with_party: number; // percentage
  alignment_with_leadership: number; // percentage
  maverick_score: number; // how often they break from party
}

// Create service role client for admin operations
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export class CongressionalVotingTracker {
  private supabase: SupabaseClient;
  private congressApi: CongressAPIClient;
  
  constructor() {
    this.supabase = createServiceClient();
    this.congressApi = new CongressAPIClient({
      baseUrl: process.env.NEXT_PUBLIC_CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3',
      apiKey: process.env.CONGRESS_API_KEY!,
      rateLimitPerSecond: 1
    });
  }
  
  /**
   * Sync voting records from Congress API
   */
  async syncVotingRecords(params: {
    congress: number;
    chamber: 'house' | 'senate';
    limit?: number;
  }): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    console.log(`🗳️ Syncing ${params.chamber} voting records for ${params.congress}th Congress...`);
    
    const results = { processed: 0, successful: 0, failed: 0 };
    
    try {
      // Get votes from Congress API
      const votes = await this.congressApi.getVotes({
        congress: params.congress,
        chamber: params.chamber
      });
      
      if (!votes?.votes) {
        console.log('No votes found');
        return results;
      }
      
      for (const voteData of votes.votes.slice(0, params.limit || 100)) {
        results.processed++;
        
        try {
          await this.processVoteRecord(voteData, params.congress, params.chamber);
          results.successful++;
        } catch (error) {
          console.error(`Failed to process vote ${voteData.voteNumber}:`, error);
          results.failed++;
        }
      }
      
      console.log(`✅ Voting sync completed: ${results.successful}/${results.processed} successful`);
      return results;
      
    } catch (error) {
      console.error('Error syncing voting records:', error);
      throw error;
    }
  }
  
  /**
   * Process individual vote record and member positions
   */
  private async processVoteRecord(voteData: any, congress: number, chamber: 'house' | 'senate'): Promise<void> {
    try {
      // Create vote record
      const voteRecord = {
        congress_api_id: voteData.url,
        congress_number: congress,
        chamber: chamber,
        vote_number: voteData.voteNumber,
        session: voteData.session,
        vote_date: voteData.date,
        vote_question: voteData.question,
        vote_type: this.categorizeVoteType(voteData.question),
        vote_result: voteData.result?.toLowerCase() || 'unknown',
        bill_id: await this.findBillByVote(voteData),
        total_yes: voteData.totals?.yeas || 0,
        total_no: voteData.totals?.nays || 0,
        total_present: voteData.totals?.present || 0,
        total_not_voting: voteData.totals?.notVoting || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Upsert vote record
      const { data: savedVote, error: voteError } = await this.supabase
        .from('congressional_votes')
        .upsert(voteRecord, { onConflict: 'congress_api_id' })
        .select()
        .single();
      
      if (voteError || !savedVote) {
        console.error('Error saving vote record:', voteError);
        return;
      }
      
      // Process individual member votes
      if (voteData.members) {
        await this.processMemberVotes(savedVote.id, voteData.members);
      }
      
      console.log(`✅ Processed vote: ${chamber} ${voteData.voteNumber} - ${voteData.question}`);
      
    } catch (error) {
      console.error('Error processing vote record:', error);
      throw error;
    }
  }
  
  /**
   * Process individual member votes within a roll call
   */
  private async processMemberVotes(voteId: string, memberVotes: any[]): Promise<void> {
    try {
      for (const memberVote of memberVotes) {
        const memberId = await this.findMemberByBioguide(memberVote.bioguideId);
        if (!memberId) {
          console.warn(`Member not found: ${memberVote.bioguideId}`);
          continue;
        }
        
        const voteRecord = {
          vote_id: voteId,
          member_id: memberId,
          vote_position: memberVote.vote?.toLowerCase() || 'not_voting',
          party_affiliation: memberVote.party,
          state: memberVote.state,
          created_at: new Date().toISOString()
        };
        
        await this.supabase
          .from('congressional_member_votes')
          .upsert(voteRecord, { onConflict: 'vote_id,member_id' });
      }
    } catch (error) {
      console.error('Error processing member votes:', error);
    }
  }
  
  /**
   * Track member positions on bills (sponsorship, public statements)
   */
  async trackMemberPosition(params: {
    memberId: string;
    billId: string;
    positionType: MemberPosition['position_type'];
    positionDate: string;
    positionSource: MemberPosition['position_source'];
    positionText?: string;
    confidenceLevel?: number;
  }): Promise<void> {
    try {
      const positionRecord = {
        member_id: params.memberId,
        bill_id: params.billId,
        position_type: params.positionType,
        position_date: params.positionDate,
        position_source: params.positionSource,
        position_text: params.positionText,
        confidence_level: params.confidenceLevel || 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.supabase
        .from('congressional_member_positions')
        .upsert(positionRecord, { 
          onConflict: 'member_id,bill_id,position_type',
          ignoreDuplicates: false 
        });
      
      console.log(`✅ Tracked position: ${params.positionType} for member ${params.memberId} on bill ${params.billId}`);
      
    } catch (error) {
      console.error('Error tracking member position:', error);
      throw error;
    }
  }
  
  /**
   * Record advocacy activities (speeches, statements, social media)
   */
  async recordAdvocacyActivity(params: {
    memberId: string;
    billId: string;
    advocacyType: AdvocacyRecord['advocacy_type'];
    advocacyDate: string;
    advocacyContent: string;
    advocacyStance: AdvocacyRecord['advocacy_stance'];
    mediaSource?: string;
    sourceUrl?: string;
  }): Promise<void> {
    try {
      const advocacyRecord = {
        member_id: params.memberId,
        bill_id: params.billId,
        advocacy_type: params.advocacyType,
        advocacy_date: params.advocacyDate,
        advocacy_content: params.advocacyContent,
        advocacy_stance: params.advocacyStance,
        media_source: params.mediaSource,
        source_url: params.sourceUrl,
        created_at: new Date().toISOString()
      };
      
      await this.supabase
        .from('congressional_advocacy_records')
        .insert(advocacyRecord);
      
      console.log(`✅ Recorded advocacy: ${params.advocacyType} by member ${params.memberId}`);
      
    } catch (error) {
      console.error('Error recording advocacy activity:', error);
      throw error;
    }
  }
  
  /**
   * Analyze voting patterns for a member
   */
  async analyzeVotingPatterns(memberId: string, options: {
    congress?: number;
    billCategory?: string;
    timeframe?: 'current_session' | 'current_congress' | 'all_time';
  } = {}): Promise<VotingPattern | null> {
    try {
      // Get member's voting record
      let query = this.supabase
        .from('congressional_member_votes')
        .select(`
          *,
          congressional_votes!inner (
            congress_number,
            vote_type,
            bill_id,
            congressional_bills (
              categories
            )
          )
        `)
        .eq('member_id', memberId);
      
      if (options.congress) {
        query = query.eq('congressional_votes.congress_number', options.congress);
      }
      
      const { data: votes } = await query;
      
      if (!votes || votes.length === 0) {
        return null;
      }
      
      // Calculate voting statistics
      const totalVotes = votes.length;
      const yesVotes = votes.filter(v => v.vote_position === 'yes').length;
      const noVotes = votes.filter(v => v.vote_position === 'no').length;
      const presentVotes = votes.filter(v => v.vote_position === 'present').length;
      const missedVotes = votes.filter(v => v.vote_position === 'not_voting').length;
      
      // Calculate party alignment (would need party vote data)
      const partyAlignment = await this.calculatePartyAlignment(memberId, votes);
      
      // Calculate maverick score (how often they break from party)
      const maverickScore = 100 - partyAlignment;
      
      return {
        member_id: memberId,
        bill_category: options.billCategory || 'all',
        total_votes: totalVotes,
        yes_votes: yesVotes,
        no_votes: noVotes,
        present_votes: presentVotes,
        missed_votes: missedVotes,
        alignment_with_party: partyAlignment,
        alignment_with_leadership: partyAlignment, // Simplified for now
        maverick_score: maverickScore
      };
      
    } catch (error) {
      console.error('Error analyzing voting patterns:', error);
      return null;
    }
  }
  
  /**
   * Get member positions on a specific bill
   */
  async getMemberPositionsOnBill(billId: string): Promise<{
    sponsors: any[];
    cosponsors: any[];
    supporters: any[];
    opponents: any[];
    votes: any[];
  }> {
    try {
      // Get sponsorship data
      const { data: sponsors } = await this.supabase
        .from('congressional_bills')
        .select(`
          primary_sponsor:public_figures!primary_sponsor_id (*)
        `)
        .eq('id', billId)
        .single();
      
      // Get cosponsors
      const { data: cosponsors } = await this.supabase
        .from('bill_cosponsors')
        .select(`
          *,
          cosponsor:public_figures!cosponsor_id (*)
        `)
        .eq('bill_id', billId);
      
      // Get public positions
      const { data: positions } = await this.supabase
        .from('congressional_member_positions')
        .select(`
          *,
          member:public_figures!member_id (*)
        `)
        .eq('bill_id', billId);
      
      // Get voting records
      const { data: votes } = await this.supabase
        .from('congressional_member_votes')
        .select(`
          *,
          member:public_figures!member_id (*),
          congressional_votes!inner (
            bill_id,
            vote_question
          )
        `)
        .eq('congressional_votes.bill_id', billId);
      
      const supporters = positions?.filter(p => 
        ['sponsor', 'cosponsor', 'public_support', 'committee_support'].includes(p.position_type)
      ) || [];
      
      const opponents = positions?.filter(p => 
        ['public_opposition', 'committee_opposition'].includes(p.position_type)
      ) || [];
      
      return {
        sponsors: sponsors?.primary_sponsor ? [sponsors.primary_sponsor] : [],
        cosponsors: cosponsors || [],
        supporters,
        opponents,
        votes: votes || []
      };
      
    } catch (error) {
      console.error('Error getting member positions on bill:', error);
      return { sponsors: [], cosponsors: [], supporters: [], opponents: [], votes: [] };
    }
  }
  
  /**
   * Generate voting scorecards for members
   */
  async generateVotingScorecard(memberId: string, criteria: {
    issueAreas: string[];
    congress: number;
  }): Promise<{
    member: any;
    overallScore: number;
    issueScores: { issue: string; score: number; voteCount: number }[];
    keyVotes: any[];
    partyAlignment: number;
    maverickMoments: any[];
  }> {
    try {
      // Get member info
      const { data: member } = await this.supabase
        .from('public_figures')
        .select('*')
        .eq('id', memberId)
        .single();
      
      // Get voting pattern analysis
      const votingPattern = await this.analyzeVotingPatterns(memberId, { 
        congress: criteria.congress 
      });
      
      // Get advocacy records
      const { data: advocacy } = await this.supabase
        .from('congressional_advocacy_records')
        .select(`
          *,
          congressional_bills!inner (
            title,
            categories
          )
        `)
        .eq('member_id', memberId);
      
      // Calculate issue-specific scores
      const issueScores = criteria.issueAreas.map(issue => ({
        issue,
        score: Math.floor(Math.random() * 100), // Placeholder - would calculate based on actual votes
        voteCount: Math.floor(Math.random() * 20) + 5
      }));
      
      // Find maverick moments (votes against party)
      const maverickMoments = advocacy?.filter(a => 
        a.advocacy_stance === 'opposition' && 
        a.advocacy_type === 'floor_speech'
      ) || [];
      
      return {
        member,
        overallScore: votingPattern?.alignment_with_party || 0,
        issueScores,
        keyVotes: [], // Would be populated with significant votes
        partyAlignment: votingPattern?.alignment_with_party || 0,
        maverickMoments: maverickMoments.slice(0, 5) // Top 5 maverick moments
      };
      
    } catch (error) {
      console.error('Error generating voting scorecard:', error);
      throw error;
    }
  }
  
  // Helper methods
  
  private async findMemberByBioguide(bioguideId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('public_figures')
      .select('id')
      .eq('bioguide_id', bioguideId)
      .single();
    
    return data?.id || null;
  }
  
  private async findBillByVote(voteData: any): Promise<string | null> {
    // Try to match vote to a bill based on vote question
    const { data } = await this.supabase
      .from('congressional_bills')
      .select('id')
      .ilike('title', `%${voteData.question?.substring(0, 50)}%`)
      .limit(1)
      .single();
    
    return data?.id || null;
  }
  
  private categorizeVoteType(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('passage')) return 'passage';
    if (lowerQuestion.includes('amendment')) return 'amendment';
    if (lowerQuestion.includes('cloture')) return 'cloture';
    if (lowerQuestion.includes('motion') || lowerQuestion.includes('procedural')) return 'procedural';
    
    return 'other';
  }
  
  private async calculatePartyAlignment(memberId: string, votes: any[]): Promise<number> {
    // Simplified calculation - would need actual party vote data
    // For now, return a placeholder based on vote patterns
    const partyVotes = votes.filter(v => v.vote_position === 'yes').length;
    const totalVotes = votes.filter(v => v.vote_position !== 'not_voting').length;
    
    return totalVotes > 0 ? Math.round((partyVotes / totalVotes) * 100) : 0;
  }
} 