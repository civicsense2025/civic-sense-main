import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CongressAPIClient } from '@/lib/integrations/congress-api';
import { GovInfoAPIClient } from '@/lib/integrations/govinfo-api';
import { CivicSenseBillAnalyzer } from '@/lib/ai/bill-analyzer';

export class EntityBasedCongressSync {
  private supabase: SupabaseClient;
  private congressAPI: CongressAPIClient;
  private govInfoAPI: GovInfoAPIClient;
  private billAnalyzer: CivicSenseBillAnalyzer;
  
  constructor() {
    this.supabase = createClient();
    this.congressAPI = new CongressAPIClient({
      baseUrl: process.env.NEXT_PUBLIC_CONGRESS_API_BASE_URL || 'https://api.congress.gov/v3',
      apiKey: process.env.CONGRESS_API_KEY!,
      rateLimitPerSecond: 1
    });
    this.govInfoAPI = new GovInfoAPIClient({
      baseUrl: 'https://api.govinfo.gov',
      apiKey: process.env.GOVINFO_API_KEY!,
      rateLimitPerSecond: 1
    });
    this.billAnalyzer = new CivicSenseBillAnalyzer();
  }
  
  /**
   * Sync bills from Congress.gov API
   */
  async syncBillsFromCongressAPI(daysBack: number = 7): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const results = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };
    
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);
      
      const bills = await this.congressAPI.getBills({
        fromDateTime: fromDate.toISOString(),
        limit: 250
      });
      
      for (const billData of bills.bills || []) {
        results.processed++;
        
        try {
          await this.processBillFromCongressAPI(billData);
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Bill ${billData.title}: ${error.message}`);
        }
      }
      
    } catch (error: any) {
      results.errors.push(`API fetch failed: ${error.message}`);
    }
    
    return results;
  }
  
  /**
   * Sync hearings from GovInfo API
   */
  async syncHearingsFromGovInfo(dateRange: { start: string; end: string }): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const results = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };
    
    try {
      const hearings = await this.govInfoAPI.searchHearings({
        publishedDate: `${dateRange.start}:${dateRange.end}`,
        rows: 100
      });
      
      for (const hearingData of hearings.packages || []) {
        results.processed++;
        
        try {
          await this.processHearingFromGovInfo(hearingData);
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Hearing ${hearingData.title}: ${error.message}`);
        }
      }
      
    } catch (error: any) {
      results.errors.push(`GovInfo API fetch failed: ${error.message}`);
    }
    
    return results;
  }
  
  /**
   * Process a bill from Congress.gov API into entity-based schema
   */
  private async processBillFromCongressAPI(billData: any): Promise<void> {
    // 1. Create or update the legislative document
    const documentRecord = {
      document_type: 'bill',
      document_number: `${billData.type.toUpperCase()}-${billData.number}`,
      congress_number: billData.congress,
      chamber: this.mapBillTypeToChamber(billData.type),
      title: billData.title,
      short_title: billData.shortTitle,
      official_title: billData.officialTitle,
      current_status: billData.latestAction?.text || 'Unknown',
      introduced_date: billData.introducedDate,
      last_action_date: billData.latestAction?.actionDate,
      last_action_text: billData.latestAction?.text,
      primary_sponsor_id: await this.findMemberByBioguide(billData.sponsors?.[0]?.bioguideId)
    };
    
    const { data: document, error: docError } = await this.supabase
      .from('legislative_documents')
      .upsert(documentRecord, { 
        onConflict: 'document_type,document_number,congress_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (docError) throw docError;
    
    // 2. Track the Congress API source
    await this.trackDocumentSource(document.id, {
      source_system: 'congress_api',
      source_id: billData.url,
      source_url: billData.url,
      source_metadata: {
        congress_number: billData.congress,
        bill_type: billData.type,
        bill_number: billData.number,
        api_version: 'v3'
      }
    });
    
    // 3. Get additional data from Congress API
    const [textData, summariesData, actionsData, subjectsData, cosponsorsData] = await Promise.all([
      this.congressAPI.getBillText(billData.congress, billData.type, billData.number),
      this.congressAPI.getBillSummaries(billData.congress, billData.type, billData.number),
      this.congressAPI.getBillActions(billData.congress, billData.type, billData.number),
      this.congressAPI.getBillSubjects(billData.congress, billData.type, billData.number),
      this.congressAPI.getBillCosponsors(billData.congress, billData.type, billData.number)
    ]);
    
    // 4. Process related data
    await Promise.all([
      this.processDocumentActions(document.id, actionsData),
      this.processDocumentSubjects(document.id, subjectsData),
      this.processBillCosponsors(document.id, cosponsorsData),
      this.processBillSummaries(document.id, summariesData)
    ]);
    
    // 5. Generate CivicSense content analysis
    if (!textData.isPlaceholder && textData.content) {
      await this.generateCivicAnalysis('legislative_document', document.id, {
        title: document.title,
        content: textData.content.text,
        metadata: {
          document_type: 'bill',
          congress: billData.congress,
          bill_type: billData.type,
          number: billData.number
        }
      });
    }
    
    // 6. Extract entities and relationships
    await this.extractEntitiesFromDocument(document.id, {
      title: document.title,
      summary: document.summary_text || '',
      fullText: textData.content?.text || ''
    });
  }
  
  /**
   * Process a hearing from GovInfo API into entity-based schema
   */
  private async processHearingFromGovInfo(hearingData: any): Promise<void> {
    // Get detailed hearing data
    const hearingDetails = await this.govInfoAPI.getPackageDetails(hearingData.packageId);
    const hearingText = await this.govInfoAPI.getPackageFullText(hearingData.packageId);
    
    // 1. Create the congressional proceeding
    const proceedingRecord = {
      proceeding_type: 'hearing',
      proceeding_number: hearingData.packageId,
      title: hearingData.title,
      description: hearingDetails.summary,
      scheduled_date: hearingData.dateIssued,
      actual_date: hearingData.dateIssued,
      committee_id: await this.findCommitteeByName(hearingDetails.committees?.[0]),
      proceeding_status: 'completed'
    };
    
    const { data: proceeding, error: procError } = await this.supabase
      .from('congressional_proceedings')
      .upsert(proceedingRecord, { onConflict: 'proceeding_number' })
      .select()
      .single();
    
    if (procError) throw procError;
    
    // 2. Track the GovInfo source
    await this.trackProceedingSource(proceeding.id, {
      source_system: 'govinfo_api',
      source_id: hearingData.packageId,
      source_url: hearingData.packageLink,
      source_metadata: {
        collection: hearingData.collection,
        doc_class: hearingData.docClass,
        government_author: hearingData.governmentAuthor,
        congress_number: hearingDetails.congress
      }
    });
    
    // 3. Extract and process witnesses/participants
    if (hearingText.witnesses) {
      await this.processHearingWitnesses(proceeding.id, hearingText.witnesses);
    }
    
    // 4. Extract Q&A exchanges
    if (hearingText.qaExchanges) {
      await this.processQAExchanges(proceeding.id, hearingText.qaExchanges);
    }
    
    // 5. Generate CivicSense analysis
    await this.generateCivicAnalysis('congressional_proceeding', proceeding.id, {
      title: proceeding.title,
      content: hearingText.fullText || '',
      metadata: {
        proceeding_type: 'hearing',
        committee: hearingDetails.committees?.[0],
        date: proceeding.actual_date
      }
    });
    
    // 6. Extract entities from hearing content
    await this.extractEntitiesFromProceeding(proceeding.id, {
      title: proceeding.title,
      description: proceeding.description || '',
      fullText: hearingText.fullText || ''
    });
  }
  
  /**
   * Track document source information
   */
  private async trackDocumentSource(documentId: string, sourceInfo: {
    source_system: string;
    source_id: string;
    source_url: string;
    source_metadata: any;
  }): Promise<void> {
    await this.supabase
      .from('document_sources')
      .upsert({
        document_id: documentId,
        ...sourceInfo,
        last_sync_at: new Date().toISOString(),
        sync_status: 'active'
      }, { onConflict: 'document_id,source_system,source_id' });
  }
  
  /**
   * Process document actions from any source
   */
  private async processDocumentActions(documentId: string, actionsData: any): Promise<void> {
    if (!actionsData?.actions) return;
    
    for (const action of actionsData.actions) {
      const actionRecord = {
        document_id: documentId,
        action_date: action.actionDate,
        action_text: action.text,
        action_type: this.normalizeActionType(action.type),
        action_code: action.code, // Source-specific code stored here
        chamber: action.chamber,
        significance_score: this.calculateActionSignificance(action.text)
      };
      
      await this.supabase
        .from('document_actions')
        .upsert(actionRecord, { onConflict: 'document_id,action_date,action_text' });
    }
  }
  
  /**
   * Process document subjects from any source
   */
  private async processDocumentSubjects(documentId: string, subjectsData: any): Promise<void> {
    if (!subjectsData?.subjects) return;
    
    for (const subject of subjectsData.subjects) {
      const subjectRecord = {
        document_id: documentId,
        subject_name: subject.name,
        is_primary_subject: subject.primary || false,
        subject_category: 'legislative_subject'
      };
      
      await this.supabase
        .from('document_subjects')
        .upsert(subjectRecord, { onConflict: 'document_id,subject_name' });
    }
  }
  
  /**
   * Generate CivicSense analysis for any entity
   */
  private async generateCivicAnalysis(
    entityType: string, 
    entityId: string, 
    content: { title: string; content: string; metadata: any }
  ): Promise<void> {
    try {
      const analysis = await this.billAnalyzer.analyzeBill(content);
      
      const analysisRecord = {
        entity_type: entityType,
        entity_id: entityId,
        plain_english_summary: analysis.plainEnglishSummary,
        uncomfortable_truths: analysis.uncomfortableTruths,
        power_dynamics: analysis.powerDynamics,
        affected_populations: analysis.affectedPopulations,
        economic_impact: analysis.economicImpact,
        action_items: analysis.actionItems,
        stake_analysis: analysis.stakeAnalysis,
        content_quality_score: analysis.qualityScore,
        fact_check_status: 'pending'
      };
      
      await this.supabase
        .from('civic_content_analysis')
        .upsert(analysisRecord, { onConflict: 'entity_type,entity_id,version_number' });
        
    } catch (error) {
      console.error(`Error generating civic analysis for ${entityType} ${entityId}:`, error);
    }
  }
  
  /**
   * Extract entities from document content
   */
  private async extractEntitiesFromDocument(documentId: string, content: {
    title: string;
    summary: string;
    fullText: string;
  }): Promise<void> {
    // This would use NLP/AI to extract entities
    // For now, placeholder implementation
    const fullContent = `${content.title} ${content.summary} ${content.fullText}`.substring(0, 10000);
    
    // Extract entities using AI service (placeholder)
    const entities = await this.extractEntitiesWithAI(fullContent);
    
    for (const entity of entities) {
      const entityRecord = {
        source_entity_type: 'legislative_document',
        source_entity_id: documentId,
        entity_type: entity.type,
        entity_name: entity.name,
        entity_description: entity.description,
        extraction_confidence: entity.confidence,
        context_description: entity.context
      };
      
      await this.supabase
        .from('extracted_entities')
        .upsert(entityRecord, { onConflict: 'source_entity_type,source_entity_id,entity_name' });
    }
  }
  
  /**
   * Helper functions
   */
  private mapBillTypeTochamber(billType: string): string {
    if (billType.toLowerCase().startsWith('h')) return 'house';
    if (billType.toLowerCase().startsWith('s')) return 'senate';
    return 'joint';
  }
  
  private normalizeActionType(actionType: string): string {
    // Normalize action types across different sources
    const typeMap: Record<string, string> = {
      'IntroReferral': 'introduced',
      'Committee': 'committee_action',
      'Floor': 'floor_action',
      'BecameLaw': 'became_law'
    };
    
    return typeMap[actionType] || actionType.toLowerCase();
  }
  
  private calculateActionSignificance(actionText: string): number {
    // Calculate significance based on action text
    const highSignificance = ['passed', 'approved', 'enacted', 'vetoed'];
    const mediumSignificance = ['reported', 'ordered', 'committee'];
    
    const lowerText = actionText.toLowerCase();
    
    if (highSignificance.some(term => lowerText.includes(term))) return 9;
    if (mediumSignificance.some(term => lowerText.includes(term))) return 6;
    return 3;
  }
  
  private async findMemberByBioguide(bioguideId: string): Promise<string | null> {
    if (!bioguideId) return null;
    
    const { data } = await this.supabase
      .from('public_figures')
      .select('id')
      .eq('bioguide_id', bioguideId)
      .single();
    
    return data?.id || null;
  }
  
  private async findCommitteeByName(committeeName: string): Promise<string | null> {
    if (!committeeName) return null;
    
    const { data } = await this.supabase
      .from('congressional_committees')
      .select('id')
      .ilike('name', `%${committeeName}%`)
      .single();
    
    return data?.id || null;
  }
  
  private async extractEntitiesWithAI(content: string): Promise<Array<{
    type: string;
    name: string;
    description: string;
    confidence: number;
    context: string;
  }>> {
    // Placeholder for AI entity extraction
    // Would use OpenAI, spaCy, or other NLP service
    return [];
  }
  
  private async processHearingWitnesses(proceedingId: string, witnesses: any[]): Promise<void> {
    for (const witness of witnesses) {
      const participantRecord = {
        proceeding_id: proceedingId,
        participant_name: witness.name,
        participant_title: witness.title,
        participant_organization: witness.organization,
        participation_type: 'witness',
        testimony_text: witness.testimony,
        credibility_score: 5 // Default, could be calculated
      };
      
      await this.supabase
        .from('proceeding_participants')
        .upsert(participantRecord, { onConflict: 'proceeding_id,participant_name' });
    }
  }
  
  private async processQAExchanges(proceedingId: string, exchanges: any[]): Promise<void> {
    for (const exchange of exchanges) {
      const exchangeRecord = {
        proceeding_id: proceedingId,
        question_text: exchange.question,
        response_text: exchange.answer,
        topic_tags: exchange.topics || [],
        significance_score: 5 // Default
      };
      
      await this.supabase
        .from('proceeding_exchanges')
        .insert(exchangeRecord);
    }
  }
  
  private async processBillCosponsors(documentId: string, cosponsorsData: any): Promise<void> {
    // Store cosponsors as document relationships or separate table
    // Implementation depends on how you want to model this
  }
  
  private async processBillSummaries(documentId: string, summariesData: any): Promise<void> {
    // Update the main document with the latest summary
    if (summariesData?.summaries?.length > 0) {
      const latestSummary = summariesData.summaries[0];
      
      await this.supabase
        .from('legislative_documents')
        .update({ summary_text: latestSummary.text })
        .eq('id', documentId);
    }
  }
  
  private async trackProceedingSource(proceedingId: string, sourceInfo: any): Promise<void> {
    // Similar to trackDocumentSource but for proceedings
    // Would need a proceeding_sources table or generalize the approach
  }
  
  private async extractEntitiesFromProceeding(proceedingId: string, content: any): Promise<void> {
    // Similar to extractEntitiesFromDocument but for proceedings
  }
} 