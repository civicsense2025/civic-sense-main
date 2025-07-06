import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CongressAPIClient } from '@/lib/integrations/congress-api';
import { CivicSenseBillAnalyzer } from '@/lib/ai/bill-analyzer';
import { CongressionalPhotoService } from './congressional-photo-service';
import { OpenAI } from 'openai';

// ANSI color codes for CLI output
const color = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    brightCyan: '\x1b[96m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightRed: '\x1b[91m',
    brightBlue: '\x1b[94m',
  }
};

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

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
    
    // Use service role client to bypass RLS policies for administrative operations
    this.supabase = createServiceClient();
    
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
      
      console.log(`${color.fg.brightCyan}\n==== SYNCING BILLS ====\n${color.reset}`);
      console.log(`Processing ${bills.bills?.length || 0} bills from last ${daysBack} days`);
      
      for (const billData of bills.bills || []) {
        await this.processBill(billData);
      }
    } catch (error) {
      console.error('Error syncing recent bills:', error);
      throw error;
    }
  }
  
  async syncRecentBillsWithLimit(limit: number = 10) {
    try {
      const bills = await this.api.getBills({
        limit: Math.min(limit, 250) // Max per request, but respect user limit
      });
      
      console.log(`${color.fg.brightCyan}\n==== SYNCING BILLS ====\n${color.reset}`);
      console.log(`Processing ${Math.min(bills.bills?.length || 0, limit)} bills (limit: ${limit})`);
      
      const billsToProcess = (bills.bills || []).slice(0, limit);
      
      for (const billData of billsToProcess) {
        await this.processBill(billData);
      }
    } catch (error) {
      console.error('Error syncing recent bills with limit:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced bill title with bill type and number for SEO
   */
  private formatBillTitle(billData: any): string {
    const billTypeFormatted = this.formatBillType(billData.type);
    const billNumber = billData.number;
    const originalTitle = billData.title || billData.shortTitle || billData.officialTitle;
    
    // If title already includes bill type/number, don't duplicate
    if (originalTitle?.includes(billTypeFormatted) && originalTitle?.includes(billNumber.toString())) {
      return originalTitle;
    }
    
    // Prepend bill type and number for SEO
    return `${billTypeFormatted} ${billNumber}: ${originalTitle}`;
  }
  
  /**
   * Format bill type for display (H.R., S., etc.)
   */
  private formatBillType(type: string): string {
    const typeMap: Record<string, string> = {
      'hr': 'H.R.',
      's': 'S.',
      'hjres': 'H.J.Res.',
      'sjres': 'S.J.Res.',
      'hconres': 'H.Con.Res.',
      'sconres': 'S.Con.Res.',
      'hres': 'H.Res.',
      'sres': 'S.Res.'
    };
    
    return typeMap[type.toLowerCase()] || type.toUpperCase();
  }
  
  /**
   * Helper to fetch Brave Search results for a query (primary/fallback key logic)
   * Returns top N results (title, snippet, url)
   */
  private async getBraveSearchResults(query: string, topN: number = 5): Promise<any[]> {
    const apiKeys = [
      process.env.BRAVE_SEARCH_API_KEY_PRO,
      process.env.BRAVE_SEARCH_API_KEY_FREE
    ].filter(Boolean);
    let lastError = null;
    for (const key of apiKeys) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': key!
            }
          }
        );
        if (!response.ok) {
          lastError = `Brave API error: ${response.status} ${response.statusText}`;
          continue;
        }
        const data = await response.json();
        return (data.web?.results || []).slice(0, topN).map((r: any) => ({
          title: r.title,
          snippet: r.description || r.snippet || '',
          url: r.url
        }));
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    console.error('Brave Search failed:', lastError);
    return [];
  }

  /**
   * Helper to format Brave results as a markdown reference list
   */
  private formatBraveReferences(results: any[]): string {
    if (!results.length) return '';
    return '\n\n**References:**\n' + results.map((r, i) => `- [${r.title}](${r.url})${r.snippet ? ': ' + r.snippet : ''}`).join('\n');
  }

  /**
   * Enhanced: For bills, combine o4-mini and Brave facts, prefer Brave for factual claims, always cite Brave
   */
  private async searchBillInformation(billData: any): Promise<string | null> {
    try {
      console.log(`${color.fg.brightCyan}🔍 Searching web for additional information about ${billData.title}${color.reset}`);
      // Create search query
      const billTypeFormatted = this.formatBillType(billData.type);
      const searchQuery = `${billTypeFormatted} ${billData.number} ${billData.congress}th congress summary`;
      // 1. Brave Search (primary)
      const braveResults = await this.getBraveSearchResults(searchQuery, 5);
      let braveSummary = '';
      if (braveResults.length) {
        braveSummary = braveResults.map(r => `${r.title}: ${r.snippet}`).join('\n\n');
      }
      // 2. o4-mini (AI synthesis)
      let aiSummary = '';
      if (process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
          });
          const response = await openai.chat.completions.create({
            model: 'o4-mini',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that can search the web for information about U.S. Congressional bills. Provide accurate, factual information from reliable sources.' },
              { role: 'user', content: `Search the web for: ${searchQuery}\n\nPlease find and summarize information about this bill, including its purpose, key provisions, and current status. Focus on official government sources and reputable news outlets.` }
            ],
            temperature: 1,
            max_completion_tokens: 1024,
          });
          aiSummary = response.choices[0]?.message?.content || '';
        } catch (err) {
          console.error('o4-mini search failed:', err);
        }
      }
      // Prefer Brave for factual claims, but include both
      let combined = '';
      if (braveSummary) {
        combined += `**Brave Search Summary:**\n${braveSummary}\n`;
      }
      if (aiSummary) {
        combined += `\n**AI Synthesis (o4-mini):**\n${aiSummary}\n`;
      }
      // Always append Brave references
      combined += this.formatBraveReferences(braveResults);
      return combined || null;
    } catch (error) {
      console.error(`${color.fg.brightRed}❌ Error searching web for bill ${billData.title}:${color.reset}`, error);
      return null;
    }
  }
  
  private async processBill(billData: any) {
    try {
      console.log(`${color.fg.brightCyan}🔍 Processing bill: ${billData.title}${color.reset}`);
      
      // Check if bill already exists
      const { data: existingBill } = await this.supabase
        .from('congressional_bills')
        .select('id, last_content_update, has_placeholder_text')
        .eq('congress_api_id', billData.url)
        .single();
      
      if (existingBill && this.isRecentlyUpdated(existingBill.last_content_update)) {
        console.log(`⏭️  Skipping ${billData.title} - recently updated`);
        return; // Skip if recently processed
      }
      
      console.log(`${color.fg.brightCyan}📡 Fetching additional data for: ${billData.title}${color.reset}`);
      
      // Get comprehensive bill data from Congress API
      const [textData, summariesData, actionsData, subjectsData, cosponsorsData] = await Promise.all([
        this.api.getBillText(billData.congress, billData.type, billData.number),
        this.api.getBillSummaries(billData.congress, billData.type, billData.number),
        this.api.getBillActions(billData.congress, billData.type, billData.number),
        this.api.getBillSubjects(billData.congress, billData.type, billData.number),
        this.api.getBillCosponsors(billData.congress, billData.type, billData.number)
      ]);
      
      console.log(`💾 Saving bill record: ${billData.title}`);
      
      // Enhanced title with bill type and number for SEO
      const enhancedTitle = this.formatBillTitle(billData);
      
      // Map comprehensive bill data
      const billRecord = {
        congress_api_id: billData.url,
        congress_number: billData.congress,
        bill_type: billData.type.toLowerCase(),
        bill_number: billData.number,
        title: enhancedTitle, // Enhanced title for SEO
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
        console.error('❌ Error saving bill:', error);
        return;
      }
      
      console.log(`${color.fg.green}✅ Saved bill: ${enhancedTitle} (ID: ${savedBill.id})${color.reset}`);
      
      // Process related data
      console.log(`🔗 Processing related data for: ${enhancedTitle}`);
      await Promise.all([
        this.processBillSummaries(savedBill.id, summariesData),
        this.processBillActions(savedBill.id, actionsData),
        this.processBillSubjects(savedBill.id, subjectsData),
        this.processBillCosponsors(savedBill.id, cosponsorsData)
      ]);
      
      // ALWAYS generate content analysis - even for placeholder text
      console.log(`🤖 Generating comprehensive AI analysis for: ${enhancedTitle}`);
      await this.generateComprehensiveBillContent(savedBill, textData, summariesData);
      
      console.log(`🎉 Completed processing: ${enhancedTitle}`);
      
    } catch (error) {
      console.error(`${color.fg.brightRed}❌ Error processing bill ${billData.title}:${color.reset}`, error);
    }
  }
  
  /**
   * Enhanced content generation that handles all bills, including those with placeholder text
   */
  private async generateComprehensiveBillContent(bill: any, textData: any, summariesData: any) {
    try {
      let contentForAnalysis = '';
      
      // Gather all available content
      if (textData.content && !textData.isPlaceholder) {
        contentForAnalysis += `Bill Text: ${textData.content.text || ''}\n\n`;
      }
      
      if (bill.summary_text) {
        contentForAnalysis += `Summary: ${bill.summary_text}\n\n`;
      }
      
      if (summariesData?.summaries?.length > 0) {
        summariesData.summaries.forEach((summary: any, index: number) => {
          contentForAnalysis += `Summary ${index + 1}: ${summary.text}\n\n`;
        });
      }
      
      // If still no content, search the web for information
      if (!contentForAnalysis.trim()) {
        console.log(`🔍 No direct content available, searching web for: ${bill.title}`);
        const webContent = await this.searchBillInformation({
          title: bill.title,
          type: bill.bill_type,
          number: bill.bill_number,
          congress: bill.congress_number
        });
        
        if (webContent) {
          contentForAnalysis = `Web Search Results: ${webContent}`;
        }
      }
      
      // If STILL no content, create basic analysis from title and metadata
      if (!contentForAnalysis.trim()) {
        contentForAnalysis = `Bill Title: ${bill.title}\nBill Type: ${bill.bill_type}\nStatus: ${bill.current_status}\nIntroduced: ${bill.introduced_date}`;
      }
      
      // Generate analysis using enhanced bill data
      const analysis = await this.billAnalyzer.analyzeBill({
        id: bill.id,
        title: bill.title,
        bill_type: bill.bill_type,
        bill_number: bill.bill_number,
        congress_number: bill.congress_number,
        summary_text: bill.summary_text,
        current_status: bill.current_status,
        introduced_date: bill.introduced_date,
        last_action_date: bill.last_action_date,
        last_action_text: bill.last_action_text
      }, contentForAnalysis);
      
      // Enhanced constituent impact analysis
      const constituentImpacts = await this.analyzeConstituentImpacts(bill, analysis);
      
      const contentAnalysis = {
        bill_id: bill.id,
        plain_english_summary: analysis.plainEnglishSummary,
        uncomfortable_truths: analysis.uncomfortableTruths,
        action_items: analysis.actionItems,
        stake_analysis: analysis.stakeAnalysis,
        key_provisions: analysis.keyProvisions,
        affected_populations: constituentImpacts, // Enhanced constituent analysis
        economic_impact: analysis.economicImpact,
        power_dynamics: analysis.powerDynamics,
        content_quality_score: this.calculateContentQuality(contentForAnalysis, analysis),
        fact_check_status: 'pending'
      };
      
      // Upsert content analysis (create or update)
      const { error } = await this.supabase
        .from('bill_content_analysis')
        .upsert(contentAnalysis, { onConflict: 'bill_id' });
      
      if (error) {
        console.error('❌ Error saving content analysis:', error);
      } else {
        console.log(`${color.fg.green}✅ Generated comprehensive content analysis for: ${bill.title}${color.reset}`);
      }
        
    } catch (error) {
      console.error(`${color.fg.brightRed}❌ Error generating content for bill ${bill.title}:${color.reset}`, error);
      
      // Create minimal analysis even if AI fails
      await this.createMinimalAnalysis(bill);
    }
  }
  
  /**
   * Analyze constituent impacts by connecting to constituent groups
   */
  private async analyzeConstituentImpacts(bill: any, analysis: any): Promise<any> {
    try {
      // Get constituent groups from database
      const { data: constituents } = await this.supabase
        .from('content_constituents')
        .select('*')
        .eq('is_active', true);
      
      if (!constituents || constituents.length === 0) {
        return analysis.constituentImpacts || [];
      }
      
      const impacts = [];
      const billContent = `${bill.title} ${bill.summary_text || ''} ${analysis.plainEnglishSummary || ''}`.toLowerCase();
      
      // Analyze impact on each constituent group
      for (const constituent of constituents) {
        const impact = this.assessConstituentImpact(billContent, constituent, analysis);
        if (impact.impactLevel !== 'none') {
          impacts.push(impact);
        }
      }
      
      return impacts;
    } catch (error) {
      console.error('Error analyzing constituent impacts:', error);
      return analysis.constituentImpacts || [];
    }
  }
  
  /**
   * Assess impact of bill on specific constituent group
   */
  private assessConstituentImpact(billContent: string, constituent: any, analysis: any): any {
    const keywords = constituent.keywords || [];
    const demographics = constituent.demographics || {};
    
    let impactScore = 0;
    let relevantKeywords = [];
    
    // Check for keyword matches
    for (const keyword of keywords) {
      if (billContent.includes(keyword.toLowerCase())) {
        impactScore += 1;
        relevantKeywords.push(keyword);
      }
    }
    
    // Determine impact level
    let impactLevel = 'none';
    if (impactScore >= 3) {
      impactLevel = 'high';
    } else if (impactScore >= 2) {
      impactLevel = 'medium';
    } else if (impactScore >= 1) {
      impactLevel = 'low';
    }
    
    if (impactLevel === 'none') {
      return { impactLevel: 'none' };
    }
    
    return {
      constituentName: constituent.name,
      constituentSlug: constituent.slug,
      impactLevel,
      impactDescription: `This bill may affect ${constituent.name} through: ${relevantKeywords.join(', ')}`,
      relevantKeywords,
      demographics: demographics,
      priority: impactLevel === 'high' ? 1 : impactLevel === 'medium' ? 2 : 3
    };
  }
  
  /**
   * Calculate content quality score based on available information
   */
  private calculateContentQuality(contentForAnalysis: string, analysis: any): number {
    let score = 0;
    
    // Base score for having any content
    if (contentForAnalysis.length > 100) score += 20;
    if (contentForAnalysis.length > 500) score += 20;
    if (contentForAnalysis.length > 1000) score += 20;
    
    // Score for analysis completeness
    if (analysis.plainEnglishSummary?.length > 100) score += 10;
    if (analysis.uncomfortableTruths?.length > 0) score += 10;
    if (analysis.actionItems?.length > 0) score += 10;
    if (analysis.constituentImpacts?.length > 0) score += 10;
    
    return Math.min(score, 100);
  }
  
  /**
   * Create minimal analysis when AI generation fails
   */
  private async createMinimalAnalysis(bill: any) {
    try {
      const minimalAnalysis = {
        bill_id: bill.id,
        plain_english_summary: `This is ${bill.bill_type.toUpperCase()} ${bill.bill_number} from the ${bill.congress_number}th Congress. Current status: ${bill.current_status}`,
        uncomfortable_truths: ['Full analysis pending - limited information available'],
        action_items: ['Monitor bill progress', 'Contact representatives for more information'],
        stake_analysis: 'Analysis pending due to limited bill content availability',
        key_provisions: { provisions: ['Analysis pending'] },
        affected_populations: [],
        economic_impact: { impact: 'To be determined' },
        power_dynamics: { dynamics: 'Analysis pending' },
        content_quality_score: 25,
        fact_check_status: 'pending'
      };
      
      await this.supabase
        .from('bill_content_analysis')
        .upsert(minimalAnalysis, { onConflict: 'bill_id' });
      
      console.log(`${color.fg.green}✅ Created minimal analysis for: ${bill.title}${color.reset}`);
    } catch (error) {
      console.error(`${color.fg.brightRed}❌ Error creating minimal analysis for ${bill.title}:${color.reset}`, error);
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
    
    try {
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
    } catch (error) {
      // Handle missing table gracefully
      if (error instanceof Error && error.message?.includes('relation "public.bill_subjects" does not exist')) {
        console.log(`⚠️  bill_subjects table does not exist, skipping subject processing for bill ${billId}`);
        return;
      }
      console.error(`Error processing bill subjects for ${billId}:`, error);
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

  /**
   * Helper method to extract terms array from Congress API response
   * Sometimes terms is an object, sometimes it's an array
   */
  private extractTermsArray(terms: any): any[] | null {
    if (!terms) return null;
    
    // If it's already an array, return it
    if (Array.isArray(terms)) {
      return terms;
    }
    
    // If it's an object, check if it has an array property
    if (typeof terms === 'object') {
      // Sometimes the API returns { items: [...] } or similar
      if (terms.items && Array.isArray(terms.items)) {
        return terms.items;
      }
      
      // Sometimes the API returns the term object directly
      // Convert single object to array
      return [terms];
    }
    
    return null;
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
      console.log(`🔄 Starting comprehensive member sync for ${currentCongress}th Congress with pagination...`);
      
      // Use getAllMembers to fetch ALL members with pagination
      const members = await this.api.getAllMembers({ congress: currentCongress });
      
      console.log(`📊 Found ${members.members?.length || 0} members to process`);
      
      if (!members.members || members.members.length === 0) {
        throw new Error(`No members found for Congress ${currentCongress}`);
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const memberData of members.members) {
        try {
          await this.processMember(memberData);
          successCount++;
        } catch (error) {
          console.error(`Failed to process member ${memberData.firstName} ${memberData.lastName}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ Member sync completed: ${successCount} successful, ${errorCount} failed`);
      
      return {
        total_members: members.members.length,
        successful: successCount,
        failed: errorCount,
        congress: currentCongress
      };
      
    } catch (error) {
      console.error('Error syncing members:', error);
      throw error;
    }
  }
  
  /**
   * Helper to validate a URL by checking if it returns a 200–399 status
   */
  private async validateUrl(url: string): Promise<boolean> {
    if (!url) return false;
    try {
      // Use HEAD if possible, fallback to GET
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (response.status >= 200 && response.status < 400) return true;
      // Some servers don't support HEAD, try GET
      if (response.status === 405 || response.status === 403) {
        const getResponse = await fetch(url, { method: 'GET', redirect: 'follow' });
        return getResponse.status >= 200 && getResponse.status < 400;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Helper to cross-reference a URL with Brave Search API results for a given query
   * Returns true if the URL appears in the top N Brave results
   */
  private async braveUrlAppearsInSearch(url: string, query: string, topN: number = 10): Promise<boolean> {
    const apiKeys = [
      process.env.BRAVE_SEARCH_API_KEY_PRO,
      process.env.BRAVE_SEARCH_API_KEY_FREE
    ].filter(Boolean);
    let lastError = null;
    for (const key of apiKeys) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': key!
            }
          }
        );
        if (!response.ok) {
          lastError = `Brave API error: ${response.status} ${response.statusText}`;
          continue;
        }
        const data = await response.json();
        const results = data.web?.results || [];
        // Normalize URLs for comparison
        const normalize = (u: string) => u.replace(/https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        const target = normalize(url);
        for (let i = 0; i < Math.min(results.length, topN); i++) {
          if (normalize(results[i].url).includes(target) || target.includes(normalize(results[i].url))) {
            return true;
          }
        }
        return false;
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    console.error('Brave Search cross-reference failed:', lastError);
    return false;
  }

  /**
   * Enhanced: For public figures, fetch Brave results and include as references in profile markdown
   */
  private async getPublicFigureBraveReferences(fullName: string, office: string): Promise<string> {
    const query = `${fullName} ${office}`.trim();
    const braveResults = await this.getBraveSearchResults(query, 5);
    return this.formatBraveReferences(braveResults);
  }

  private async processMember(memberData: any) {
    try {
      // Robust name extraction (from scripts/public_figures-sync.js)
      let firstName = memberData.firstName || '';
      let lastName = memberData.lastName || '';
      let middleName = '';
      // If missing, try to parse from .name
      if ((!firstName || !lastName) && memberData.name) {
        const nameParts = memberData.name.trim().split(/\s+/);
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = '';
          middleName = '';
        } else if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
          middleName = '';
        } else if (nameParts.length > 2) {
          firstName = nameParts[0];
          lastName = nameParts[nameParts.length - 1];
          middleName = nameParts.slice(1, -1).join(' ');
        }
      }
      // Fallback to bioguideId if still missing
      if (!firstName) firstName = memberData.bioguideId || 'Unknown';
      if (!lastName) lastName = '';
      if (!middleName) middleName = '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
      if (!memberData || !memberData.bioguideId) {
        console.warn('Skipping member with missing bioguideId:', memberData);
        return;
      }
      if (!firstName && !lastName) {
        console.warn('Skipping member with no name data:', memberData.bioguideId);
        return;
      }
      // Check if member exists in public_figures
      const { data: existingFigure } = await this.supabase
        .from('public_figures')
        .select('id')
        .eq('bioguide_id', memberData.bioguideId)
        .single();
      // Extract and validate contact info fields
      let contactInfo: any = {};
      // Website
      if (memberData.url && await this.validateUrl(memberData.url)) {
        const braveQuery = `${fullName} ${memberData.office || ''}`.trim();
        if (await this.braveUrlAppearsInSearch(memberData.url, braveQuery)) {
          contactInfo.website = { url: memberData.url, verified: true };
        }
      }
      // Social
      contactInfo.social = {};
      if (memberData.twitterAccount || memberData.twitter_account) {
        const twitterUrl = `https://twitter.com/${memberData.twitterAccount || memberData.twitter_account}`;
        if (await this.validateUrl(twitterUrl)) {
          const braveQuery = `${fullName} Twitter ${memberData.office || ''}`.trim();
          if (await this.braveUrlAppearsInSearch(twitterUrl, braveQuery)) {
            contactInfo.social.twitter = { url: twitterUrl, verified: true };
          }
        }
      }
      if (memberData.facebookAccount || memberData.facebook_account) {
        const facebookUrl = `https://www.facebook.com/${memberData.facebookAccount || memberData.facebook_account}`;
        if (await this.validateUrl(facebookUrl)) {
          const braveQuery = `${fullName} Facebook ${memberData.office || ''}`.trim();
          if (await this.braveUrlAppearsInSearch(facebookUrl, braveQuery)) {
            contactInfo.social.facebook = { url: facebookUrl, verified: true };
          }
        }
      }
      if (memberData.youtubeAccount || memberData.youtube_account) {
        const youtubeUrl = `https://www.youtube.com/${memberData.youtubeAccount || memberData.youtube_account}`;
        if (await this.validateUrl(youtubeUrl)) {
          const braveQuery = `${fullName} YouTube ${memberData.office || ''}`.trim();
          if (await this.braveUrlAppearsInSearch(youtubeUrl, braveQuery)) {
            contactInfo.social.youtube = { url: youtubeUrl, verified: true };
          }
        }
      }
      // Remove empty social
      if (Object.keys(contactInfo.social).length === 0) delete contactInfo.social;
      // Offices (array)
      contactInfo.offices = [];
      if (memberData.office || memberData.phone) {
        const officeObj: any = {
          name: memberData.office || 'Washington, DC Office',
          phone: memberData.phone || null,
          address: memberData.office || null
        };
        contactInfo.offices.push(officeObj);
      }
      if (contactInfo.offices.length && memberData.fax) {
        contactInfo.offices[0].fax = memberData.fax;
      }
      if (contactInfo.offices.length === 0) delete contactInfo.offices;
      // Contact form
      if (memberData.contactForm || memberData.contact_form) {
        const contactFormUrl = memberData.contactForm || memberData.contact_form;
        if (await this.validateUrl(contactFormUrl)) {
          const braveQuery = `${fullName} contact form ${memberData.office || ''}`.trim();
          if (await this.braveUrlAppearsInSearch(contactFormUrl, braveQuery)) {
            contactInfo.contact_form = { url: contactFormUrl, verified: true };
          }
        }
      }
      // Remove empty contactInfo
      if (Object.keys(contactInfo).length === 0) contactInfo = null;
      // Only upsert main content columns + contact_info
      const memberRecord = {
        bioguide_id: memberData.bioguideId,
        full_name: fullName,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        party_affiliation: memberData.partyName,
        current_state: memberData.state,
        current_district: memberData.district,
        congress_member_type: this.extractTermsArray(memberData.terms)?.[0]?.chamber === 'House of Representatives' ? 'representative' : 'senator',
        congressional_tenure_start: this.extractTermsArray(memberData.terms)?.[0]?.startYear?.toString(),
        is_active: true,
        is_politician: true,
        office: memberData.directOrderName || `${this.extractTermsArray(memberData.terms)?.[0]?.chamber === 'House of Representatives' ? 'Representative' : 'Senator'} from ${memberData.state}`,
        display_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contact_info: contactInfo
      };
      let figureId: string;
      if (existingFigure) {
        // Update existing member
        const { data: updatedFigure, error: updateError } = await this.supabase
          .from('public_figures')
          .update(memberRecord)
          .eq('id', existingFigure.id)
          .select('id')
          .single();
        if (updateError || !updatedFigure) {
          console.error('Failed to update member:', memberData.bioguideId, updateError);
          return;
        }
        figureId = updatedFigure.id;
      } else {
        // Insert new member
        const { data: newFigure, error: insertError } = await this.supabase
          .from('public_figures')
          .insert(memberRecord)
          .select('id')
          .single();
        if (insertError || !newFigure) {
          console.error('Failed to insert member:', memberData.bioguideId, insertError);
          console.error('Member data:', memberRecord);
          return;
        }
        figureId = newFigure.id;
      }
      // Process congressional terms
      const termsArray = this.extractTermsArray(memberData.terms);
      if (termsArray && termsArray.length > 0) {
        for (const term of termsArray) {
          await this.processCongressionalTerm(figureId, term);
        }
      }
      // --- ENRICH PUBLIC FIGURE PROFILE WITH BRAVE REFERENCES ---
      // If you generate a markdown profile, always append Brave references:
      // const braveRefs = await this.getPublicFigureBraveReferences(fullName, memberRecord.office);
      // profileMarkdown += braveRefs;
      console.log(`✅ Processed member: ${fullName} (${memberData.bioguideId})`);
    } catch (error) {
      const memberName = memberData?.firstName && memberData?.lastName 
        ? `${memberData.firstName} ${memberData.lastName}`
        : `${memberData?.bioguideId || 'Unknown ID'}`;
      console.error(`Failed to process member ${memberName}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
      }
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

  /**
   * Generate a full markdown profile for a bill, including Brave and AI enrichment
   */
  public async generateBillMarkdownProfile(billData: any): Promise<string> {
    // Fetch Brave+AI enrichment
    const enrichment = await this.searchBillInformation(billData);
    // Compose markdown
    let md = `# ${billData.title || billData.short_title || billData.official_title || 'Bill'}\n`;
    md += `\n**Bill Number:** ${billData.bill_type?.toUpperCase() || ''} ${billData.bill_number || ''}`;
    md += `\n**Congress:** ${billData.congress_number || ''}`;
    md += `\n**Status:** ${billData.current_status || 'Unknown'}`;
    if (billData.introduced_date) md += `\n**Introduced:** ${billData.introduced_date}`;
    if (billData.primary_sponsor_name) md += `\n**Primary Sponsor:** ${billData.primary_sponsor_name}`;
    if (billData.summary_text) md += `\n\n**Summary:**\n${billData.summary_text}`;
    if (enrichment) md += `\n\n${enrichment}`;
    return md.trim();
  }

  /**
   * Generate a full markdown profile for a public figure, including all related info and Brave references
   */
  public async generatePublicFigureMarkdownProfile(memberData: any): Promise<string> {
    // Parse name and office
    let firstName = memberData.firstName || '';
    let lastName = memberData.lastName || '';
    let middleName = '';
    if ((!firstName || !lastName) && memberData.name) {
      const nameParts = memberData.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = '';
        middleName = '';
      } else if (nameParts.length === 2) {
        firstName = nameParts[0];
        lastName = nameParts[1];
        middleName = '';
      } else if (nameParts.length > 2) {
        firstName = nameParts[0];
        lastName = nameParts[nameParts.length - 1];
        middleName = nameParts.slice(1, -1).join(' ');
      }
    }
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    const office = memberData.office || '';
    // Compose markdown
    let md = `# ${fullName}\n`;
    // Official photo
    if (memberData.official_photo_url) {
      md += `\n![${fullName}](${memberData.official_photo_url})\n`;
    }
    if (office) md += `\n**Current Role:** ${office}`;
    if (memberData.party_affiliation) md += `\n**Party:** ${memberData.party_affiliation}`;
    if (memberData.current_state) md += `\n**State:** ${memberData.current_state}`;
    if (memberData.current_district) md += `\n**District:** ${memberData.current_district}`;
    if (memberData.congress_member_type) md += `\n**Chamber:** ${memberData.congress_member_type}`;
    // Contact info
    if (memberData.contact_info && memberData.contact_info.website) {
      const w = memberData.contact_info.website;
      md += `\n**Website:** [${w.url}](${w.url})`;
    }
    if (memberData.contact_info && memberData.contact_info.social) {
      const s = memberData.contact_info.social;
      if (s.twitter) md += `\n**Twitter:** [${s.twitter.url}](${s.twitter.url})`;
      if (s.facebook) md += `\n**Facebook:** [${s.facebook.url}](${s.facebook.url})`;
      if (s.youtube) md += `\n**YouTube:** [${s.youtube.url}](${s.youtube.url})`;
    }
    if (memberData.contact_info && memberData.contact_info.offices) {
      for (const office of memberData.contact_info.offices) {
        md += `\n**Office:** ${office.name}`;
        if (office.address) md += `, ${office.address}`;
        if (office.phone) md += `, Phone: ${office.phone}`;
        if (office.fax) md += `, Fax: ${office.fax}`;
      }
    }
    // --- Fetch related data from DB ---
    const supabase = createServiceClient();
    // Bills sponsored
    let billsMd = '';
    if (memberData.id) {
      const { data: sponsoredBills } = await supabase
        .from('congressional_bills')
        .select('id, bill_type, bill_number, title, current_status')
        .eq('primary_sponsor_id', memberData.id)
        .order('introduced_date', { ascending: false })
        .limit(5);
      if (Array.isArray(sponsoredBills) && sponsoredBills.length) {
        billsMd += '\n\n## Sponsored Bills';
        sponsoredBills.forEach((bill: any) => {
          billsMd += `\n- **${bill.bill_type?.toUpperCase() || ''} ${bill.bill_number || ''}**: ${bill.title || ''} (_${bill.current_status || ''}_)`;
        });
      }
      // Cosponsored bills
      const { data: cosponsored } = await supabase
        .from('bill_cosponsors')
        .select('bill:congressional_bills(id, bill_type, bill_number, title, current_status)')
        .eq('cosponsor_id', memberData.id)
        .limit(5);
      if (Array.isArray(cosponsored) && cosponsored.length) {
        billsMd += '\n\n## Cosponsored Bills';
        cosponsored.forEach((c: any) => {
          if (c.bill) {
            billsMd += `\n- **${c.bill.bill_type?.toUpperCase() || ''} ${c.bill.bill_number || ''}**: ${c.bill.title || ''} (_${c.bill.current_status || ''}_)`;
          }
        });
      }
    }
    md += billsMd;
    // Recent votes
    let votesMd = '';
    if (memberData.id) {
      const { data: votes } = await supabase
        .from('congressional_member_votes')
        .select('vote_position, voted_at, vote:congressional_votes(bill_id, question, date), bill:congressional_bills(title, bill_type, bill_number)')
        .eq('member_id', memberData.id)
        .order('voted_at', { ascending: false })
        .limit(5);
      if (Array.isArray(votes) && votes.length) {
        votesMd += '\n\n## Recent Votes';
        votes.forEach((v: any) => {
          const billTitle = v.bill?.title || '';
          const billNum = v.bill?.bill_type ? `${v.bill.bill_type.toUpperCase()} ${v.bill.bill_number}` : '';
          const voteDate = v.vote?.date || v.voted_at || '';
          votesMd += `\n- **${billNum}**: ${billTitle} — **${v.vote_position?.toUpperCase() || ''}** (${voteDate})`;
        });
      }
    }
    md += votesMd;
    // Committees
    let committeesMd = '';
    if (memberData.id) {
      const { data: committees } = await supabase
        .from('congressional_member_committees')
        .select('committee_name')
        .eq('member_id', memberData.id);
      if (Array.isArray(committees) && committees.length) {
        committeesMd += '\n\n## Committees';
        committees.forEach((c: any) => {
          committeesMd += `\n- ${c.committee_name || ''}`;
        });
      }
    }
    md += committeesMd;
    // Advocacy / Public Statements
    let advocacyMd = '';
    if (memberData.id) {
      const { data: advocacy } = await supabase
        .from('congressional_advocacy_records')
        .select('date, type, content')
        .eq('member_id', memberData.id)
        .order('date', { ascending: false })
        .limit(3);
      if (Array.isArray(advocacy) && advocacy.length) {
        advocacyMd += '\n\n## Advocacy & Public Statements';
        advocacy.forEach((a: any) => {
          advocacyMd += `\n- (${a.date || ''}) [${a.type || ''}]: ${a.content || ''}`;
        });
      }
    }
    md += advocacyMd;
    // Add Brave references
    const braveRefs = await this.getPublicFigureBraveReferences(fullName, office);
    md += `\n${braveRefs}`;
    return md.trim();
  }
}