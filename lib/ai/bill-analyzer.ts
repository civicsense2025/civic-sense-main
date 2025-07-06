// ============================================================================
// ENHANCED BILL ANALYZER (AI-POWERED WITH CONSTITUENT IMPACT ANALYSIS)
// ============================================================================

// External dependencies
import { OpenAI } from 'openai';

// Internal dependencies
import { createClient } from '@supabase/supabase-js';

// Database types
import type { Database } from '@/lib/database.types';

// -----------------------------------------------------------------------------
// CivicSense Language & Tone Rules (from scripts)
// -----------------------------------------------------------------------------

/**
 * CIVICSENSE CONTENT PRINCIPLES:
 * 
 * 1. ACCURACY OVER COMPLETENESS - better to miss a detail than create false information
 * 2. EXTRACT ONLY VERIFIED INFORMATION - no speculation, no "could happen" statements
 * 3. SPECIFICITY REQUIRED - exact names, numbers, dates from sources
 * 4. NO GENERIC ADVICE - be specific or say nothing
 * 5. CONSERVATIVE SIGNIFICANCE RATINGS - use 1-3 scale
 * 6. REAL-WORLD IMPACT FOCUS - how it affects people's lives concretely
 * 
 * BANNED PHRASES - NEVER USE:
 * - "stay informed about" → Instead: specific information sources
 * - "contact your representatives" → Instead: exact office/committee names  
 * - "various stakeholders" → Instead: specific organizations named
 * - "in a timely manner" → Instead: specific deadlines if known
 * - "relevant authorities" → Instead: exact agency names
 * - "important developments" → Instead: specific changes described
 * - "consider the impact" → Instead: exact consequences shown
 * 
 * LANGUAGE STYLE:
 * - Direct, evidence-based tone
 * - Cut through political theater
 * - Reveal uncomfortable truths about power
 * - Focus on what citizens absolutely need to know
 * - Use plain English that high schoolers can understand
 * - Include specific examples of power in action
 * - Concrete ways citizens can respond
 */

// -----------------------------------------------------------------------------
// Types (matching actual database schema)
// -----------------------------------------------------------------------------

/**
 * Structured result returned by {@link CivicSenseBillAnalyzer.analyzeBill}
 */
export interface BillAnalysis {
  /** Plain-English TL;DR that a high-schooler can understand */
  plainEnglishSummary: string;
  /** Hidden or inconvenient facts revealed by the bill */
  uncomfortableTruths: string[];
  /** Concrete actions citizens can take */
  actionItems: string[];
  /** Key figures, numbers, and statistics extracted from the bill */
  keyFigures: KeyFigure[];
  /** Comprehensive takeaways organized by category */
  takeaways: TakeawaySection[];
  /** Constituent groups most impacted by this legislation */
  constituentImpacts: ConstituentImpact[];
  /** Overall complexity and civic impact scores */
  scores: {
    complexity: number;
    civicImpact: number;
    controversyLevel: number;
  };
  /** Who wins and who loses from this bill */
  stakeAnalysis: string;
  /** Most critical provisions citizens need to know */
  keyProvisions: string[];
  /** Economic impact in plain language */
  economicImpact: string;
  /** Power dynamics and lobbying influence revealed */
  powerDynamics: string;
  /** Quality score for civic education value (1-10) */
  qualityScore: number;
}

/**
 * Key numerical data extracted from legislation
 */
export interface KeyFigure {
  /** The actual number or statistic */
  figure: string;
  /** What this figure represents */
  description: string;
  /** Context about why this matters */
  significance: string;
  /** Category of the figure (budget, timeline, population, etc.) */
  category: 'budget' | 'timeline' | 'population' | 'regulatory' | 'economic' | 'other';
}

/**
 * Organized takeaways by category
 */
export interface TakeawaySection {
  /** Category name */
  category: string;
  /** List of key points in this category */
  points: string[];
  /** Priority level for this category */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Impact analysis for specific constituent groups
 */
export interface ConstituentImpact {
  /** Constituent group ID from the database */
  constituentId: string;
  /** Name of the constituent group */
  constituentName: string;
  /** Type of impact */
  impactType: 'direct' | 'indirect' | 'potential' | 'historical';
  /** Severity of impact */
  impactSeverity: 'low' | 'medium' | 'high' | 'critical';
  /** Detailed explanation of the impact */
  impactDescription: string;
  /** Areas of impact */
  impactAreas: string[];
  /** Timeframe for impact */
  impactTimeframe: 'immediate' | 'short_term' | 'long_term' | 'generational';
  /** Estimated number of people affected */
  estimatedPeopleAffected?: number;
  /** Economic impact if applicable */
  economicImpact?: number;
  /** Confidence level in this analysis */
  confidenceLevel: number;
}

/**
 * Bill data structure matching congressional_bills table
 */
export interface BillData {
  id: string;
  title: string;
  bill_type: string;
  bill_number: string;
  congress_number: number;
  summary_text?: string | null;
  current_status: string;
  introduced_date?: string | null;
  last_action_date?: string | null;
  last_action_text?: string | null;
}

/**
 * Constituent data from database (matching actual schema)
 */
interface ConstituentData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  constituent_type: string;
  category: string | null;
  estimated_size: number | null;
  is_vulnerable_population: boolean | null;
  keywords: string[] | null;
  characteristics: any; // JSONB field
}

/**
 * Database insert type for bill_content_analysis
 */
type BillContentAnalysisInsert = Database['public']['Tables']['bill_content_analysis']['Insert'];

/**
 * Database insert type for content_constituents
 */
type ContentConstituentsInsert = Database['public']['Tables']['content_constituents']['Insert'];

// -----------------------------------------------------------------------------
// Main Analyzer Class
// -----------------------------------------------------------------------------

/**
 * AI-powered bill analyzer that provides comprehensive analysis including
 * constituent impact assessment, key figures extraction, and actionable takeaways.
 * 
 * Follows CivicSense principles:
 * - Accuracy over completeness
 * - Extract only verified information  
 * - Use specific details, not generic advice
 * - Reveal power dynamics and uncomfortable truths
 * - Focus on real-world impact for citizens
 */
export class CivicSenseBillAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  /**
   * Create service role Supabase client for server-side operations
   */
  private createServiceClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Analyzes a congressional bill and returns comprehensive analysis
   * including constituent impact assessment and database storage
   */
  async analyzeBill(billData: BillData, fullBillText?: string): Promise<BillAnalysis> {
    try {
      // Get constituent data for impact analysis
      const constituents = await this.getConstituents();
      
      // Determine content quality and adjust analysis approach
      const contentQuality = this.assessContentQuality(fullBillText || billData.summary_text || '');
      console.log(`📊 Content quality for ${billData.title}: ${contentQuality}`);
      
      // Perform AI analysis using CivicSense principles
      const analysis = await this.performAIAnalysis(billData, constituents, fullBillText, contentQuality);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing bill:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Assess the quality of available content
   */
  private assessContentQuality(content: string): 'high' | 'medium' | 'low' {
    const length = content.length;
    
    if (length > 2000 && !this.isPlaceholderContent(content)) {
      return 'high';
    } else if (length > 500) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Check if content appears to be placeholder text
   */
  private isPlaceholderContent(content: string): boolean {
    const placeholderPatterns = [
      'text will be available',
      'coming soon',
      'not yet available',
      'pending',
      'placeholder',
      'to be determined',
      'analysis pending'
    ];
    
    const lowerContent = content.toLowerCase();
    return placeholderPatterns.some(pattern => lowerContent.includes(pattern));
  }

  /**
   * Retrieves constituent data from the database
   */
  private async getConstituents(): Promise<ConstituentData[]> {
    try {
      const supabase = this.createServiceClient();
      const { data: constituents } = await supabase
        .from('constituents')
        .select(`
          id,
          name,
          slug,
          description,
          constituent_type,
          category,
          estimated_size,
          is_vulnerable_population,
          keywords,
          characteristics
        `)
        .eq('is_active', true)
        .order('estimated_size', { ascending: false });

      return constituents || [];
    } catch (error) {
      console.error('Error fetching constituents:', error);
      return [];
    }
  }

  /**
   * Performs comprehensive AI analysis using CivicSense principles
   */
  private async performAIAnalysis(
    billData: BillData,
    constituents: ConstituentData[],
    fullBillText?: string,
    contentQuality?: 'high' | 'medium' | 'low'
  ): Promise<BillAnalysis> {
    // Check if o4-mini is available, otherwise use gpt-4o-mini
    const modelToUse = this.getModelForAnalysis(contentQuality || 'medium');
    
    console.log(`🤖 Using ${modelToUse} for ${contentQuality} quality content analysis`);
    
    const systemPrompt = `You are CivicSense, a no-nonsense civic education AI that cuts through political theater to reveal how power actually works.

CORE PRINCIPLES:
- Accuracy over completeness - better to miss a detail than create false information
- Extract ONLY verified information from the bill text - no speculation
- Use specific details: exact names, numbers, dates, dollar amounts
- Reveal uncomfortable truths about who really benefits
- Focus on concrete impact on people's daily lives
- Conservative significance ratings (1-3 scale)
- Plain English that high schoolers can understand

BANNED PHRASES - NEVER USE:
- "stay informed about" → specific information sources instead
- "contact your representatives" → exact office/committee names instead  
- "various stakeholders" → specific organizations named instead
- "in a timely manner" → specific deadlines if known instead
- "relevant authorities" → exact agency names instead
- "important developments" → specific changes described instead

LANGUAGE STYLE:
- Direct, evidence-based tone
- Cut through political theater
- Reveal power structures and uncomfortable truths
- Focus on what citizens absolutely need to know
- Include specific examples of power in action
- Provide concrete ways citizens can respond

Return analysis as valid JSON matching the BillAnalysis interface.`;

    const userPrompt = this.buildEnhancedAnalysisPrompt(billData, constituents, fullBillText, contentQuality);

    try {
      let response;
      
      if (modelToUse === 'o4-mini') {
        // o4-mini doesn't support system messages or response_format
        // Do NOT set temperature for o4-mini!
        response = await this.openai.chat.completions.create({
          model: 'o4-mini',
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ],
          max_completion_tokens: 3000,
        });
      } else {
        // gpt-4o-mini supports all features
        response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          ...this.getModelParameters(contentQuality || 'medium'),
        });
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      try {
        // Try to parse as JSON first
        const analysis = JSON.parse(content) as BillAnalysis;
        
        // Validate analysis follows CivicSense principles
        this.validateAnalysisQuality(analysis);
        
        return analysis;
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]) as BillAnalysis;
          this.validateAnalysisQuality(analysis);
          return analysis;
        }
        
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', content.substring(0, 500) + '...');
        return this.getDefaultAnalysis();
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Determine which model to use based on content quality and availability
   */
  private getModelForAnalysis(contentQuality: 'high' | 'medium' | 'low'): string {
    // Check if o4-mini model is configured
    const useO4Mini = process.env.USE_O4_MINI === 'true' || contentQuality === 'low';
    
    // List of available models in order of preference
    const models = useO4Mini 
      ? ['o4-mini', 'gpt-4o-mini', 'gpt-4-turbo-preview']
      : ['gpt-4o-mini', 'gpt-4-turbo-preview'];
    
    // For now, default to gpt-4o-mini which is widely available
    // You can implement model availability checking here if needed
    return models[0];
  }

  /**
   * Validate analysis follows CivicSense quality standards
   */
  private validateAnalysisQuality(analysis: BillAnalysis): void {
    // Check for banned phrases
    const bannedPhrases = [
      'stay informed about', 'contact your representatives', 'various stakeholders',
      'in a timely manner', 'relevant authorities', 'important developments'
    ];
    
    const textToCheck = `${analysis.plainEnglishSummary} ${analysis.stakeAnalysis}`.toLowerCase();
    const foundBanned = bannedPhrases.filter(phrase => textToCheck.includes(phrase));
    
    if (foundBanned.length > 0) {
      console.warn('⚠️ Analysis contains banned phrases:', foundBanned);
    }
    
    // Ensure minimum quality thresholds
    if (!analysis.plainEnglishSummary || analysis.plainEnglishSummary.length < 50) {
      console.warn('⚠️ Plain English summary too short or missing');
    }
    
    if (!analysis.uncomfortableTruths || analysis.uncomfortableTruths.length === 0) {
      console.warn('⚠️ No uncomfortable truths identified');
    }
  }

  /**
   * Get model parameters based on content quality
   */
  private getModelParameters(contentQuality: 'high' | 'medium' | 'low') {
    switch (contentQuality) {
      case 'high':
        return { temperature: 0.3, max_completion_tokens: 3000 };
      case 'medium':
        return { temperature: 0.4, max_completion_tokens: 2000 };
      case 'low':
        return { temperature: 0.5, max_completion_tokens: 1500 };
      default:
        return { temperature: 0.4, max_completion_tokens: 2000 };
    }
  }

  /**
   * Enhanced analysis prompt that leverages advanced reasoning capabilities
   */
  private buildEnhancedAnalysisPrompt(
    billData: BillData, 
    constituents: ConstituentData[], 
    fullBillText?: string,
    contentQuality?: 'high' | 'medium' | 'low'
  ): string {
    const constituentList = constituents.map(c => 
      `- ${c.name} (${c.estimated_size?.toLocaleString() || 'Unknown'} people): ${c.description || 'No description available'}`
    ).join('\n');

    const reasoningNote = contentQuality === 'low' 
      ? '\n🧠 DEEP REASONING MODE: Limited content available. Think step-by-step through the implications. Consider: 1) What type of bill this typically is, 2) Historical precedents, 3) Likely stakeholders, 4) Implementation challenges, 5) Unintended consequences. Reason through each aspect systematically.'
      : contentQuality === 'medium'
      ? '\n🧠 ENHANCED REASONING: Moderate content available. Use reasoning to connect the dots between provided text and broader implications. Think through cause-and-effect relationships.'
      : '\n📚 COMPREHENSIVE ANALYSIS: Full content available. Use reasoning to identify non-obvious connections and implications beyond what is explicitly stated.';

    return `
CIVICSENSE ENHANCED BILL ANALYSIS - Use Deep Reasoning and Knowledge${reasoningNote}

BILL INFORMATION:
- Title: ${billData.title}
- Bill Number: ${billData.bill_type.toUpperCase()} ${billData.bill_number}
- Congress: ${billData.congress_number}th Congress
- Status: ${billData.current_status}
- Introduced: ${billData.introduced_date || 'Unknown'}
- Last Action: ${billData.last_action_text || 'Unknown'}
- Summary: ${billData.summary_text || 'No summary available'}

${fullBillText ? `FULL BILL TEXT:\n${fullBillText.substring(0, 12000)}` : ''}

CONSTITUENT GROUPS TO ANALYZE:
${constituentList}

ENHANCED ANALYSIS INSTRUCTIONS:

🧠 REASONING APPROACH:
1. Use your knowledge of similar legislation and precedents
2. Analyze patterns in congressional bill naming and structure
3. Consider the political and economic context of the ${billData.congress_number}th Congress
4. Analyze the bill type (${billData.bill_type}) for typical scope and impact
5. Use your understanding of federal agencies and implementation processes
6. Consider historical outcomes of similar legislation

🔍 DEEP ANALYSIS REQUIREMENTS:
- Identify bills with similar titles or purposes from your knowledge
- Determine typical stakeholders for this type of legislation
- Identify the committees that typically handle such bills
- Consider implementation challenges and historical precedents
- Analyze potential unintended consequences based on similar laws

📊 COMPREHENSIVE OUTPUT (JSON format):
{
  "plainEnglishSummary": "Clear, detailed explanation using your knowledge and reasoning about what this bill does and why it matters",
  "uncomfortableTruths": [
    "Specific uncomfortable reality revealed through analysis",
    "Hidden power dynamic or benefit uncovered through reasoning",
    "Historical precedent that reveals concerning patterns"
  ],
  "actionItems": [
    "Specific committee names based on bill type and content",
    "Exact government agencies that would implement this",
    "Specific websites and resources for tracking",
    "Congressional representatives likely to be key players"
  ],
  "keyFigures": [
    {
      "figure": "Specific number, date, or amount found or reasonably estimated",
      "description": "What this figure represents",
      "significance": "Why this matters to citizens",
      "category": "budget|timeline|population|regulatory|economic|other"
    }
  ],
  "takeaways": [
    {
      "category": "Political Context",
      "points": ["Key political dynamics at play", "Historical precedents"],
      "priority": "high"
    },
    {
      "category": "Implementation Reality", 
      "points": ["How this would actually work", "Likely challenges"],
      "priority": "high"
    }
  ],
  "constituentImpacts": [
    {
      "constituentId": "ID from list above",
      "constituentName": "Group name",
      "impactType": "direct|indirect|potential|historical",
      "impactSeverity": "low|medium|high|critical",
      "impactDescription": "Detailed explanation based on reasoning and knowledge",
      "impactAreas": ["specific areas affected"],
      "impactTimeframe": "immediate|short_term|long_term|generational",
      "estimatedPeopleAffected": 1000000,
      "economicImpact": 500.00,
      "confidenceLevel": 8
    }
  ],
  "scores": {
    "complexity": 7,
    "civicImpact": 8,
    "controversyLevel": 6
  },
  "stakeAnalysis": "Detailed analysis of who wins/loses based on knowledge and reasoning",
  "keyProvisions": ["Critical provisions identified through analysis"],
  "economicImpact": "Specific economic effects with reasoning and context",
  "powerDynamics": "How power flows, which agencies gain authority, lobbying implications",
  "qualityScore": 85
}

🎯 QUALITY ENHANCEMENT TARGETS:
- Aim for quality scores of 75+ by using deep reasoning
- Include specific agency names and committee jurisdictions
- Reference historical precedents and similar legislation
- Provide concrete implementation details based on knowledge
- Reveal non-obvious power dynamics and beneficiaries
- Connect to broader political and economic trends

Remember: Even with limited text, use your extensive knowledge of congressional processes, federal agencies, and similar legislation to provide comprehensive, valuable analysis that citizens need.
`;
  }

  /**
   * Stores comprehensive bill analysis in bill_content_analysis table
   * (matching exact database schema)
   */
  private async storeBillAnalysis(billId: string, analysis: BillAnalysis): Promise<void> {
    try {
      const supabase = this.createServiceClient();
      
      // Match exact database schema from types
      const contentAnalysis: BillContentAnalysisInsert = {
        bill_id: billId,
        plain_english_summary: analysis.plainEnglishSummary,
        uncomfortable_truths: analysis.uncomfortableTruths,
        action_items: analysis.actionItems,
        stake_analysis: analysis.stakeAnalysis,
        key_provisions: analysis.keyProvisions as any, // JSONB field
        affected_populations: analysis.constituentImpacts.map(c => c.constituentName) as any, // JSONB field
        economic_impact: analysis.economicImpact as any, // JSONB field
        power_dynamics: analysis.powerDynamics as any, // JSONB field
        content_quality_score: analysis.qualityScore,
        fact_check_status: 'ai_generated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('bill_content_analysis')
        .upsert(contentAnalysis, { onConflict: 'bill_id' });

      console.log(`✅ Stored bill analysis for: ${billId}`);
    } catch (error) {
      console.error('Error storing bill analysis:', error);
    }
  }

  /**
   * Stores constituent impact relationships in content_constituents table
   * (matching exact database schema)
   */
  private async storeConstituentImpacts(billId: string, impacts: ConstituentImpact[]): Promise<void> {
    try {
      const supabase = this.createServiceClient();
      
      // Match exact database schema from types
      const impactRecords: ContentConstituentsInsert[] = impacts.map(impact => ({
        content_type: 'congressional_bill',
        content_id: billId,
        constituent_id: impact.constituentId,
        impact_type: impact.impactType,
        impact_severity: impact.impactSeverity,
        impact_description: impact.impactDescription,
        impact_areas: impact.impactAreas,
        impact_timeframe: impact.impactTimeframe,
        estimated_people_affected: impact.estimatedPeopleAffected || null,
        economic_impact_amount: impact.economicImpact || null,
        economic_impact_currency: 'USD',
        confidence_level: impact.confidenceLevel,
        impact_source: 'ai_analysis',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Remove existing impacts for this bill
      await supabase
        .from('content_constituents')
        .delete()
        .eq('content_type', 'congressional_bill')
        .eq('content_id', billId);

      // Insert new impacts
      if (impactRecords.length > 0) {
        await supabase
          .from('content_constituents')
          .insert(impactRecords);
      }

      console.log(`✅ Stored ${impactRecords.length} constituent impacts for bill: ${billId}`);
    } catch (error) {
      console.error('Error storing constituent impacts:', error);
    }
  }

  /**
   * Stores bill cosponsors in bill_cosponsors table
   */
  async storeBillCosponsors(billId: string, cosponsors: any[]): Promise<void> {
    try {
      const supabase = this.createServiceClient();
      
      for (const cosponsor of cosponsors) {
        const cosponsorRecord = {
          bill_id: billId,
          cosponsor_id: cosponsor.member_id, // Foreign key to public_figures
          date_cosponsored: cosponsor.date_cosponsored,
          is_original_cosponsor: cosponsor.is_original_cosponsor || false,
          withdrawal_date: cosponsor.withdrawal_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase
          .from('bill_cosponsors')
          .upsert(cosponsorRecord, { onConflict: 'bill_id,cosponsor_id' });
      }

      console.log(`✅ Stored ${cosponsors.length} cosponsors for bill: ${billId}`);
    } catch (error) {
      console.error('Error storing bill cosponsors:', error);
    }
  }

  /**
   * Stores bill relationships in bill_relationships table
   */
  async storeBillRelationships(billId: string, relationships: any[]): Promise<void> {
    try {
      const supabase = this.createServiceClient();
      
      for (const relationship of relationships) {
        const relationshipRecord = {
          bill_id: billId, // Foreign key to congressional_bills
          related_bill_id: relationship.related_bill_id, // Foreign key to congressional_bills
          relationship_type: relationship.relationship_type, // 'identical', 'related', 'supersedes', etc.
          relationship_description: relationship.description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase
          .from('bill_relationships')
          .upsert(relationshipRecord, { onConflict: 'bill_id,related_bill_id' });
      }

      console.log(`✅ Stored ${relationships.length} bill relationships for: ${billId}`);
    } catch (error) {
      console.error('Error storing bill relationships:', error);
    }
  }

  /**
   * Stores bill actions in bill_actions table
   */
  async storeBillActions(billId: string, actions: any[]): Promise<void> {
    try {
      const supabase = this.createServiceClient();
      
      for (const action of actions) {
        const actionRecord = {
          bill_id: billId, // Foreign key to congressional_bills
          action_date: action.action_date,
          action_text: action.action_text,
          action_code: action.action_code || null,
          action_type: action.action_type || null,
          chamber: action.chamber || null,
          committee_id: action.committee_id || null,
          significance_score: action.significance_score || 3,
          ai_interpretation: action.ai_interpretation || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase
          .from('bill_actions')
          .upsert(actionRecord, { 
            onConflict: 'bill_id,action_date,action_text',
            ignoreDuplicates: false 
          });
      }

      console.log(`✅ Stored ${actions.length} actions for bill: ${billId}`);
    } catch (error) {
      console.error('Error storing bill actions:', error);
    }
  }

  /**
   * Returns default analysis structure if AI analysis fails
   */
  private getDefaultAnalysis(): BillAnalysis {
    return {
      plainEnglishSummary: "This bill requires further analysis to provide a comprehensive summary.",
      uncomfortableTruths: ["Analysis unavailable at this time"],
      actionItems: ["Track this bill on congress.gov for updates"],
      keyFigures: [],
      takeaways: [{
        category: "Analysis Status",
        points: ["Detailed analysis is currently unavailable"],
        priority: "medium"
      }],
      constituentImpacts: [],
      scores: {
        complexity: 5,
        civicImpact: 5,
        controversyLevel: 3
      },
      stakeAnalysis: "Stakeholder analysis unavailable",
      keyProvisions: ["Analysis pending"],
      economicImpact: "Economic impact analysis unavailable",
      powerDynamics: "Power dynamics analysis unavailable",
      qualityScore: 3
    };
  }

  /**
   * Retrieves stored constituent impacts for a bill
   */
  async getConstituentImpacts(billId: string): Promise<ConstituentImpact[]> {
    try {
      const supabase = this.createServiceClient();
      const { data: impacts } = await supabase
        .from('content_constituents')
        .select(`
          *,
          constituents!inner(
            id,
            name,
            estimated_size
          )
        `)
        .eq('content_type', 'congressional_bill')
        .eq('content_id', billId)
        .eq('is_active', true)
        .order('impact_severity', { ascending: false });

      return impacts?.map((impact: any) => ({
        constituentId: impact.constituent_id,
        constituentName: impact.constituents.name,
        impactType: impact.impact_type,
        impactSeverity: impact.impact_severity,
        impactDescription: impact.impact_description,
        impactAreas: impact.impact_areas || [],
        impactTimeframe: impact.impact_timeframe,
        estimatedPeopleAffected: impact.estimated_people_affected,
        economicImpact: impact.economic_impact_amount,
        confidenceLevel: impact.confidence_level || 5
      })) || [];
    } catch (error) {
      console.error('Error retrieving constituent impacts:', error);
      return [];
    }
  }

  /**
   * Analyzes multiple bills for patterns and trends
   */
  async analyzeBillTrends(billIds: string[]): Promise<{
    commonThemes: string[];
    affectedConstituents: { name: string; billCount: number; totalImpact: number }[];
    policyAreas: string[];
  }> {
    try {
      const supabase = this.createServiceClient();
      const { data: impacts } = await supabase
        .from('content_constituents')
        .select(`
          *,
          constituents!inner(name, estimated_size)
        `)
        .eq('content_type', 'congressional_bill')
        .in('content_id', billIds)
        .eq('is_active', true);

      // Analyze patterns
      const constituentCounts = new Map<string, { count: number; totalImpact: number }>();
      const impactAreas = new Set<string>();

      impacts?.forEach((impact: any) => {
        const name = impact.constituents.name;
        const current = constituentCounts.get(name) || { count: 0, totalImpact: 0 };
        constituentCounts.set(name, {
          count: current.count + 1,
          totalImpact: current.totalImpact + (impact.estimated_people_affected || 0)
        });

        impact.impact_areas?.forEach((area: string) => impactAreas.add(area));
      });

      const affectedConstituents = Array.from(constituentCounts.entries())
        .map(([name, data]) => ({ name, billCount: data.count, totalImpact: data.totalImpact }))
        .sort((a, b) => b.billCount - a.billCount);

      return {
        commonThemes: [], // Would be populated by more sophisticated analysis
        affectedConstituents,
        policyAreas: Array.from(impactAreas)
      };
    } catch (error) {
      console.error('Error analyzing bill trends:', error);
      return {
        commonThemes: [],
        affectedConstituents: [],
        policyAreas: []
      };
    }
  }
}

// Export singleton instance
export const billAnalyzer = new CivicSenseBillAnalyzer();