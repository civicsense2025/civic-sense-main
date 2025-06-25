import { BaseAITool } from './base-ai-tool';
import OpenAI from 'openai';

export class CivicSenseBillAnalyzer extends BaseAITool<BillAnalysisInput, BillAnalysis> {
  private openaiClient: OpenAI;

  constructor() {
    super({
      name: 'CivicSenseBillAnalyzer',
      type: 'content_generator',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      maxRetries: 3,
      retryDelay: 1000
    });
    
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  async analyzeBill(params: BillAnalysisInput): Promise<BillAnalysis> {
    const result = await this.process(params);
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze bill');
    }
    return result.data!;
  }

  protected async validateInput(input: BillAnalysisInput): Promise<BillAnalysisInput> {
    if (!input.title || !input.content || !input.metadata) {
      throw new Error('Missing required input fields: title, content, or metadata');
    }
    return input;
  }

  protected async processWithAI(input: BillAnalysisInput): Promise<string> {
    const prompt = this.buildAnalysisPrompt(input);
    
    const response = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: CIVIC_SENSE_BILL_ANALYSIS_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });
    
    return response.choices[0].message.content || '';
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<BillAnalysis> {
    const parsed = await this.parseJSON(rawOutput);
    if (!parsed.isValid) {
      throw new Error('Failed to parse AI response: ' + parsed.errors.join(', '));
    }
    
    const analysis = parsed.content;
    
    // Clean and structure the output
    return {
      plainEnglishSummary: this.cleanOutput(analysis.plainEnglishSummary || ''),
      uncomfortableTruths: (analysis.uncomfortableTruths || []).map((t: string) => this.cleanOutput(t)),
      stakeAnalysis: this.cleanOutput(analysis.stakeAnalysis || ''),
      keyProvisions: analysis.keyProvisions || [],
      affectedPopulations: analysis.affectedPopulations || {},
      economicImpact: analysis.economicImpact || {},
      powerDynamics: analysis.powerDynamics || {},
      actionItems: (analysis.actionItems || []).map((item: string) => this.cleanOutput(item)),
      qualityScore: analysis.qualityScore || 50
    };
  }

  protected async validateOutput(output: BillAnalysis): Promise<BillAnalysis> {
    // Validate required fields
    const requiredFields = [
      'plainEnglishSummary',
      'uncomfortableTruths',
      'stakeAnalysis',
      'actionItems'
    ];
    
    for (const field of requiredFields) {
      if (!output[field as keyof BillAnalysis]) {
        throw new Error(`Missing required field in analysis: ${field}`);
      }
    }
    
    // Validate quality
    if (output.uncomfortableTruths.length < 2) {
      throw new Error('Analysis must include at least 2 uncomfortable truths');
    }
    
    if (output.actionItems.length < 3) {
      throw new Error('Analysis must include at least 3 action items');
    }
    
    return output;
  }

  protected async saveToSupabase(data: BillAnalysis): Promise<BillAnalysis> {
    // The sync service handles saving to the database
    // This method returns the data as-is
    return data;
  }
  
  private buildAnalysisPrompt(params: BillAnalysisInput): string {
    return `
Analyze this congressional bill and provide CivicSense-style content that reveals uncomfortable truths about power:

BILL: ${params.title}
CONGRESS: ${params.metadata.congress}
TYPE: ${params.metadata.billType.toUpperCase()} ${params.metadata.number}

FULL TEXT:
${params.content.substring(0, 8000)}${params.content.length > 8000 ? '\n\n[TRUNCATED - Full text exceeds limit]' : ''}

Provide analysis in the following JSON format:
{
  "plainEnglishSummary": "What this bill actually does, in clear language",
  "uncomfortableTruths": ["Truth 1", "Truth 2", "Truth 3"],
  "stakeAnalysis": "Why this matters to your daily life",
  "keyProvisions": [
    {
      "provision": "What it says",
      "realImpact": "What it actually means",
      "whoWins": "Who benefits",
      "whoLoses": "Who pays the price"
    }
  ],
  "affectedPopulations": {
    "primarylyAffected": ["Group 1", "Group 2"],
    "economicImpact": "How much money is involved",
    "geographicImpact": "Which regions are affected"
  },
  "powerDynamics": {
    "corporateInterests": "Which industries win/lose",
    "politicalInterests": "Which politicians benefit",
    "lobbyingConnections": "Likely lobbying influences"
  },
  "actionItems": [
    "Specific action 1",
    "Specific action 2", 
    "Specific action 3"
  ],
  "qualityScore": 85
}

Remember the CivicSense voice:
- Truth over comfort
- Specific actors, not vague "government"
- Connect to personal impact
- Reveal how power actually works
- Provide actionable next steps
    `;
  }
}

const CIVIC_SENSE_BILL_ANALYSIS_SYSTEM_PROMPT = `
You are CivicSense's bill analysis AI. Your job is to cut through political theater and reveal how power actually works in Congress.

CORE PRINCIPLES:
1. Truth over comfort - Say what politicians don't want voters to know
2. Clarity over politeness - Use direct, active language
3. Name specific actors - Not "government" but "Senator Smith (R-TX)"  
4. Connect to personal impact - Show how this affects rent, healthcare, jobs
5. Reveal power dynamics - Who profits, who pays, who decides

FORBIDDEN PATTERNS:
- "Both sides" false equivalencies
- Passive voice that obscures responsibility
- Vague action suggestions
- Treating politics like entertainment
- Academic jargon

REQUIRED ELEMENTS:
- At least 3 uncomfortable truths politicians don't want revealed
- Specific stakeholder analysis (who wins/loses money/power)
- Personal impact for different income levels
- Actionable steps with specific contacts/deadlines
- Power mapping showing real influence networks

Write like you're explaining power to a smart friend who's tired of being lied to.
`;

interface BillAnalysisInput {
  title: string;
  content: string;
  metadata: BillMetadata;
}

interface BillMetadata {
  congress: number;
  billType: string;
  number: number;
}

interface BillAnalysis {
  plainEnglishSummary: string;
  uncomfortableTruths: string[];
  stakeAnalysis: string;
  keyProvisions: any[];
  affectedPopulations: any;
  economicImpact: any;
  powerDynamics: any;
  actionItems: string[];
  qualityScore: number;
} 