import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CongressAPIClient } from '@/lib/integrations/congress-api';
import { CivicSenseBillAnalyzer } from '@/lib/ai/bill-analyzer';
import { CongressionalPhotoService } from './congressional-photo-service';

export class CongressSyncService {
  private api: CongressAPIClient;
  private supabase: SupabaseClient;
  private billAnalyzer: CivicSenseBillAnalyzer;
  private photoService: CongressionalPhotoService;
  
  constructor() {
    this.api = new CongressAPIClient({
      baseUrl: process.env.NEXT_PUBLIC_CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3',
      apiKey: process.env.CONGRESS_API_KEY!,
      rateLimitPerSecond: 1 // Congress API rate limits
    });
    this.supabase = createClient();
    this.billAnalyzer = new CivicSenseBillAnalyzer();
    this.photoService = new CongressionalPhotoService();
  }
  
  async syncRecentBills(daysBack: number = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    try {
      const bills = await this.api.getBills({
        fromDateTime: fromDate.toISOString(),
        limit: 250 // Max per request
      });
      
      console.log(`Processing ${bills.bills?.length || 0} bills from last ${daysBack} days`);
      
      for (const billData of bills.bills || []) {
        await this.processBill(billData);
      }
    } catch (error) {
      console.error('Error syncing recent bills:', error);
      throw error;
    }
  }
  
  private async processBill(billData: any) {
    try {
      // Check if bill already exists
      const { data: existingBill } = await this.supabase
        .from('congressional_bills')
        .select('id, last_content_update, has_placeholder_text')
        .eq('congress_api_id', billData.url)
        .single();
      
      if (existingBill && this.isRecentlyUpdated(existingBill.last_content_update)) {
        return; // Skip if recently processed
      }
      
      // Get comprehensive bill data from Congress API
      const [textData, summariesData, actionsData, subjectsData, cosponsorsData] = await Promise.all([
        this.api.getBillText(billData.congress, billData.type, billData.number),
        this.api.getBillSummaries(billData.congress, billData.type, billData.number),
        this.api.getBillActions(billData.congress, billData.type, billData.number),
        this.api.getBillSubjects(billData.congress, billData.type, billData.number),
        this.api.getBillCosponsors(billData.congress, billData.type, billData.number)
      ]);
      
      // Map comprehensive bill data
      const billRecord = {
        congress_api_id: billData.url,
        congress_number: billData.congress,
        bill_type: billData.type.toLowerCase(),
        bill_number: billData.number,
        title: billData.title,
        short_title: billData.shortTitle,
        official_title: billData.officialTitle,
        current_status: billData.latestAction?.text || 'Unknown',
        introduced_date: billData.introducedDate,
        last_action_date: billData.latestAction?.actionDate,
        last_action_text: billData.latestAction?.text,
        summary_text: summariesData?.summaries?.[0]?.text, // Latest summary
        has_placeholder_text: textData.isPlaceholder,
        last_content_update: new Date().toISOString(),
        primary_sponsor_id: await this.findMemberByBioguide(billData.sponsors?.[0]?.bioguideId)
      };
      
      // Upsert bill
      const { data: savedBill, error } = await this.supabase
        .from('congressional_bills')
        .upsert(billRecord, { 
          onConflict: 'congress_api_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving bill:', error);
        return;
      }
      
      // Process related data
      await Promise.all([
        this.processBillSummaries(savedBill.id, summariesData),
        this.processBillActions(savedBill.id, actionsData),
        this.processBillSubjects(savedBill.id, subjectsData),
        this.processBillCosponsors(savedBill.id, cosponsorsData)
      ]);
      
      // Generate content if not placeholder text
      if (!textData.isPlaceholder && textData.content) {
        await this.generateBillContent(savedBill, textData.content);
      } else {
        console.log(`Skipping content generation for ${billData.title} - placeholder text detected`);
      }
      
    } catch (error) {
      console.error(`Error processing bill ${billData.title}:`, error);
    }
  }
  
  // Process bill summaries from Congress API
  private async processBillSummaries(billId: string, summariesData: any) {
    if (!summariesData?.summaries) return;
    
    for (const summary of summariesData.summaries) {
      const summaryRecord = {
        bill_id: billId,
        version_code: summary.versionCode,
        summary_text: summary.text,
        action_date: summary.actionDate,
        action_description: summary.actionDesc,
        congress_api_last_update: summary.updateDate
      };
      
      await this.supabase
        .from('bill_summaries')
        .upsert(summaryRecord, { onConflict: 'bill_id,version_code' });
    }
  }
  
  // Process bill subjects from Congress API
  private async processBillSubjects(billId: string, subjectsData: any) {
    if (!subjectsData?.subjects) return;
    
    for (const subject of subjectsData.subjects) {
      const subjectRecord = {
        bill_id: billId,
        subject_name: subject.name,
        is_primary_subject: subject.primary || false
      };
      
      await this.supabase
        .from('bill_subjects')
        .upsert(subjectRecord, { onConflict: 'bill_id,subject_name' });
    }
  }
  
  // Helper to find member by bioguide ID
  private async findMemberByBioguide(bioguideId: string): Promise<string | null> {
    if (!bioguideId) return null;
    
    const { data } = await this.supabase
      .from('public_figures')
      .select('id')
      .eq('bioguide_id', bioguideId)
      .single();
    
    return data?.id || null;
  }
  
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  private async processBillCosponsors(billId: string, cosponsorsData: any) {
    if (!cosponsorsData?.cosponsors) return;
    
    for (const cosponsor of cosponsorsData.cosponsors) {
      const cosponsorId = await this.findMemberByBioguide(cosponsor.bioguideId);
      if (!cosponsorId) continue;
      
      const cosponsorRecord = {
        bill_id: billId,
        cosponsor_id: cosponsorId,
        date_cosponsored: cosponsor.dateCosponsored,
        is_original_cosponsor: cosponsor.isOriginalCosponsor
      };
      
      await this.supabase
        .from('bill_cosponsors')
        .upsert(cosponsorRecord, { onConflict: 'bill_id,cosponsor_id' });
    }
  }
  
  private async processBillActions(billId: string, actionsData: any) {
    if (!actionsData?.actions) return;
    
    for (const action of actionsData.actions) {
      const actionRecord = {
        bill_id: billId,
        action_date: action.actionDate,
        action_text: action.text,
        action_code: action.code,
        action_type: action.type,
        chamber: action.chamber,
        committee_id: action.committeeId,
        significance_score: action.significanceScore,
        ai_interpretation: action.aiInterpretation
      };
      
      await this.supabase
        .from('bill_actions')
        .upsert(actionRecord, { onConflict: 'bill_id,action_date' });
    }
  }
  
  private async generateBillContent(bill: any, textContent: any) {
    try {
      // Use CivicSense AI agent to analyze bill
      const analysis = await this.billAnalyzer.analyzeBill({
        title: bill.title,
        content: textContent.text,
        metadata: {
          congress: bill.congress_number,
          billType: bill.bill_type,
          number: bill.bill_number
        }
      });
      
      const contentAnalysis = {
        bill_id: bill.id,
        plain_english_summary: analysis.plainEnglishSummary,
        uncomfortable_truths: analysis.uncomfortableTruths,
        action_items: analysis.actionItems,
        stake_analysis: analysis.stakeAnalysis,
        key_provisions: analysis.keyProvisions,
        affected_populations: analysis.affectedPopulations,
        economic_impact: analysis.economicImpact,
        power_dynamics: analysis.powerDynamics,
        content_quality_score: analysis.qualityScore,
        fact_check_status: 'pending'
      };
      
      await this.supabase
        .from('bill_content_analysis')
        .upsert(contentAnalysis, { onConflict: 'bill_id' });
        
      console.log(`Generated content analysis for bill: ${bill.title}`);
      
    } catch (error) {
      console.error(`Error generating content for bill ${bill.title}:`, error);
    }
  }
  
  private isRecentlyUpdated(lastUpdate: string | null): boolean {
    if (!lastUpdate) return false;
    
    const lastUpdateDate = new Date(lastUpdate);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return lastUpdateDate > oneDayAgo;
  }
  
  async syncMembers() {
    try {
      const currentCongress = 118; // Update as needed
      const members = await this.api.getMembers({ congress: currentCongress });
      
      for (const memberData of members.members || []) {
        await this.processMember(memberData);
      }
    } catch (error) {
      console.error('Error syncing members:', error);
      throw error;
    }
  }
  
  private async processMember(memberData: any) {
    try {
      // Check if member exists in public_figures
      const { data: existingFigure } = await this.supabase
        .from('public_figures')
        .select('id')
        .eq('bioguide_id', memberData.bioguideId)
        .single();
      
      // Map ALL Congress API fields to our schema
      const memberRecord = {
        bioguide_id: memberData.bioguideId,
        full_name: `${memberData.firstName} ${memberData.lastName}`,
        display_name: memberData.firstName && memberData.lastName 
          ? `${memberData.firstName} ${memberData.lastName}` 
          : memberData.name,
        congress_member_type: memberData.terms?.[0]?.chamber === 'House of Representatives' ? 'representative' : 'senator',
        current_state: memberData.state,
        current_district: memberData.district,
        party_affiliation: memberData.partyName,
        congressional_tenure_start: memberData.terms?.[0]?.startYear ? `${memberData.terms[0].startYear}-01-01` : null,
        is_active: true,
        is_politician: true,
        office: memberData.terms?.[0]?.chamber || 'Congress',
        current_positions: memberData.terms?.map((term: any) => 
          `${term.chamber === 'House of Representatives' ? 'Representative' : 'Senator'} (${term.startYear}-${term.endYear || 'present'})`
        ) || [],
        description: `${memberData.partyName} ${memberData.terms?.[0]?.chamber === 'House of Representatives' ? 'Representative' : 'Senator'} from ${memberData.state}`,
        region: memberData.state,
        congress_api_last_sync: new Date().toISOString()
      };
      
      let figureId: string;
      
      if (existingFigure) {
        // Update existing figure
        await this.supabase
          .from('public_figures')
          .update(memberRecord)
          .eq('id', existingFigure.id);
        figureId = existingFigure.id;
      } else {
        // Insert new figure
        const { data: newFigure } = await this.supabase
          .from('public_figures')
          .insert({
            ...memberRecord,
            slug: this.generateSlug(`${memberData.firstName} ${memberData.lastName}`)
          })
          .select('id')
          .single();
        figureId = newFigure!.id;
      }
      
      // Process congressional terms
      if (memberData.terms && memberData.terms.length > 0) {
        for (const term of memberData.terms) {
          await this.processCongressionalTerm(figureId, term);
        }
      }
      
      // Download and store official photo
      const photoResult = await this.photoService.downloadAndStorePhoto(
        memberData.bioguideId, 
        figureId
      );
      
      if (photoResult.success) {
        console.log(`✅ Member and photo processed: ${memberData.firstName} ${memberData.lastName} (${memberData.bioguideId})`);
      } else {
        console.log(`⚠️ Member processed but photo failed: ${memberData.firstName} ${memberData.lastName} (${memberData.bioguideId}) - ${photoResult.error}`);
      }
      
    } catch (error) {
      console.error(`Error processing member ${memberData.firstName} ${memberData.lastName}:`, error);
    }
  }
  
  private async processCongressionalTerm(memberId: string, termData: any) {
    const termRecord = {
      member_id: memberId,
      congress_number: termData.congress,
      chamber: termData.chamber === 'House of Representatives' ? 'house' : 'senate',
      state_code: termData.stateCode,
      district: termData.district || null,
      start_year: termData.startYear,
      end_year: termData.endYear || null,
      party_affiliation: termData.party,
      member_type: termData.memberType || (termData.chamber === 'House of Representatives' ? 'representative' : 'senator')
    };
    
    await this.supabase
      .from('congressional_terms')
      .upsert(termRecord, { 
        onConflict: 'member_id,congress_number,chamber',
        ignoreDuplicates: false 
      });
  }
} 