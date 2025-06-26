/**
 * GovInfo API Client for CivicSense Platform
 * Integrates with existing congressional infrastructure
 * Supports hearings, committee documents, Federal Register, Supreme Court decisions
 */

interface GovInfoAPIConfig {
  baseUrl: string;
  rateLimitPerSecond: number;
}

interface GovInfoPackage {
  packageId: string;
  title: string;
  congress?: number;
  chamber?: string;
  committee?: string;
  publishedDate: string;
  lastModifiedDate: string;
  packageLink: string;
  docClass: string;
  category: string;
}

interface GovInfoDocument {
  download: {
    txtLink?: string;
    pdfLink?: string;
    xmlLink?: string;
  };
  title: string;
  congress?: number;
  session?: number;
  chamber?: string;
  committee?: string;
  witnesses?: Witness[];
  testimony?: Testimony[];
  qaExchanges?: QAExchange[];
  keyPoints?: string[];
  topics?: string[];
  relatedBills?: string[];
}

interface Witness {
  name: string;
  title?: string;
  organization?: string;
  witnessType: 'government' | 'expert' | 'advocate' | 'industry' | 'other';
  credibilityScore?: number;
  politicalLeanings?: string;
  testimonySummary?: string;
}

interface Testimony {
  witness: string;
  organizationRepresented?: string;
  keyPoints: string[];
  uncomfortableTruths?: string[];
  contradictions?: string[];
  lobbingConnections?: string[];
}

interface QAExchange {
  questioner: string;
  questionerParty?: string;
  question: string;
  respondent: string;
  response: string;
  significance: number;
  civicEducationValue: string;
}

export class GovInfoAPIClient {
  private config: GovInfoAPIConfig;
  private rateLimiter: RateLimiter;

  constructor(config?: Partial<GovInfoAPIConfig>) {
    this.config = {
      baseUrl: 'https://api.govinfo.gov',
      rateLimitPerSecond: 2, // Conservative rate limiting
      ...config
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerSecond);
  }

  // ===== CORE API METHODS =====

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    await this.rateLimiter.wait();

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.config.baseUrl}${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    });

    if (!response.ok) {
      throw new Error(`GovInfo API error: ${response.statusText} (${response.status})`);
    }

    return response.json();
  }

  // ===== CONGRESSIONAL DOCUMENTS =====

  /**
   * Search for congressional bills across all collections
   */
  async searchBills(params: {
    congress?: number;
    publishedDate?: string;
    lastModifiedDate?: string;
    collections?: string[]; // ['BILLS', 'BILLSTATUS']
    query?: string;
    offset?: number;
    pageSize?: number;
  }) {
    const collections = params.collections || ['BILLS', 'BILLSTATUS'];
    
    return this.makeRequest('/collections', {
      offset: params.offset || 0,
      pageSize: params.pageSize || 100,
      congress: params.congress,
      publishedDate: params.publishedDate,
      lastModifiedDate: params.lastModifiedDate,
      query: params.query,
      collection: collections.join(',')
    });
  }

  /**
   * Get bill package details with full text
   */
  async getBillPackage(packageId: string): Promise<GovInfoDocument | null> {
    try {
      const packageData = await this.makeRequest(`/packages/${packageId}`);
      
      // Get document content if available
      let content = null;
      if (packageData.download?.txtLink) {
        content = await this.downloadDocumentText(packageData.download.txtLink);
      }

      return {
        ...packageData,
        content,
        keyPoints: content ? await this.extractKeyPoints(content) : [],
        topics: content ? await this.extractTopics(content) : []
      };
    } catch (error) {
      console.error(`Error fetching bill package ${packageId}:`, error);
      return null;
    }
  }

  // ===== CONGRESSIONAL HEARINGS =====

  /**
   * Search congressional hearings
   */
  async searchHearings(params: {
    congress?: number;
    chamber?: 'house' | 'senate';
    committee?: string;
    publishedDate?: string;
    query?: string;
    offset?: number;
    pageSize?: number;
  }) {
    return this.makeRequest('/collections/CHRG', {
      offset: params.offset || 0,
      pageSize: params.pageSize || 100,
      congress: params.congress,
      publishedDate: params.publishedDate,
      query: params.query
    });
  }

  /**
   * Get hearing package with comprehensive analysis
   */
  async getHearingPackage(packageId: string): Promise<GovInfoDocument | null> {
    try {
      const packageData = await this.makeRequest(`/packages/${packageId}`);
      
      // Get full text content
      let content = null;
      if (packageData.download?.txtLink) {
        content = await this.downloadDocumentText(packageData.download.txtLink);
      }

      if (!content) return packageData;

      // Extract structured information from hearing content
      const structuredData = await this.parseHearingContent(content, packageData);

      return {
        ...packageData,
        content,
        witnesses: structuredData.witnesses,
        testimony: structuredData.testimony,
        qaExchanges: structuredData.qaExchanges,
        keyPoints: structuredData.keyPoints,
        topics: structuredData.topics,
        relatedBills: structuredData.relatedBills
      };
    } catch (error) {
      console.error(`Error fetching hearing package ${packageId}:`, error);
      return null;
    }
  }

  // ===== COMMITTEE DOCUMENTS =====

  /**
   * Search committee reports and prints
   */
  async searchCommitteeDocuments(params: {
    congress?: number;
    chamber?: 'house' | 'senate';
    docClass?: 'CRPT' | 'CPRT'; // Committee Reports | Committee Prints
    query?: string;
    publishedDate?: string;
    offset?: number;
    pageSize?: number;
  }) {
    const collection = params.docClass || 'CRPT';
    
    return this.makeRequest(`/collections/${collection}`, {
      offset: params.offset || 0,
      pageSize: params.pageSize || 100,
      congress: params.congress,
      publishedDate: params.publishedDate,
      query: params.query
    });
  }

  /**
   * Get committee document with analysis
   */
  async getCommitteeDocument(packageId: string): Promise<GovInfoDocument | null> {
    try {
      const packageData = await this.makeRequest(`/packages/${packageId}`);
      
      let content = null;
      if (packageData.download?.txtLink) {
        content = await this.downloadDocumentText(packageData.download.txtLink);
      }

      return {
        ...packageData,
        content,
        keyPoints: content ? await this.extractKeyPoints(content) : [],
        topics: content ? await this.extractTopics(content) : [],
        relatedBills: content ? await this.extractRelatedBills(content) : []
      };
    } catch (error) {
      console.error(`Error fetching committee document ${packageId}:`, error);
      return null;
    }
  }

  // ===== FEDERAL REGISTER =====

  /**
   * Search Federal Register documents
   */
  async searchFederalRegister(params: {
    publishedDate?: string;
    agency?: string;
    documentType?: string;
    query?: string;
    offset?: number;
    pageSize?: number;
  }) {
    return this.makeRequest('/collections/FR', {
      offset: params.offset || 0,
      pageSize: params.pageSize || 100,
      publishedDate: params.publishedDate,
      query: params.query
    });
  }

  // ===== SUPREME COURT DECISIONS =====

  /**
   * Search Supreme Court decisions
   */
  async searchSupremeCourtDecisions(params: {
    term?: string; // Court term (e.g., "2023")
    query?: string;
    publishedDate?: string;
    offset?: number;
    pageSize?: number;
  }) {
    return this.makeRequest('/collections/USCOURTS', {
      offset: params.offset || 0,
      pageSize: params.pageSize || 100,
      publishedDate: params.publishedDate,
      query: params.query
    });
  }

  // ===== DOCUMENT PARSING AND ANALYSIS =====

  private async downloadDocumentText(url: string): Promise<string | null> {
    try {
      await this.rateLimiter.wait();
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Failed to download document text: ${response.statusText}`);
        return null;
      }
      
      return response.text();
    } catch (error) {
      console.error('Error downloading document text:', error);
      return null;
    }
  }

  private async parseHearingContent(content: string, metadata: any): Promise<{
    witnesses: Witness[];
    testimony: Testimony[];
    qaExchanges: QAExchange[];
    keyPoints: string[];
    topics: string[];
    relatedBills: string[];
  }> {
    const witnesses = this.extractWitnesses(content);
    const testimony = this.extractTestimony(content, witnesses);
    const qaExchanges = this.extractQAExchanges(content);
    const keyPoints = await this.extractKeyPoints(content);
    const topics = await this.extractTopics(content);
    const relatedBills = await this.extractRelatedBills(content);

    return {
      witnesses,
      testimony,
      qaExchanges,
      keyPoints,
      topics,
      relatedBills
    };
  }

  private extractWitnesses(content: string): Witness[] {
    const witnesses: Witness[] = [];
    
    // Pattern to match witness information in hearings
    const witnessPatterns = [
      /WITNESS(?:ES)?:?\s*([^\n]+)/gi,
      /PANEL\s+(?:OF\s+)?WITNESS(?:ES)?:?\s*([^\n]+)/gi,
      /(?:Dr\.|Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];

    for (const pattern of witnessPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const witnessText = match[1] || match[0];
        const witness = this.parseWitnessInfo(witnessText);
        if (witness && !witnesses.find(w => w.name === witness.name)) {
          witnesses.push(witness);
        }
      }
    }

    return witnesses;
  }

  private parseWitnessInfo(text: string): Witness | null {
    // Extract name, title, and organization from witness text
    const nameMatch = text.match(/(?:Dr\.|Mr\.|Ms\.|Mrs\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (!nameMatch) return null;

    const name = nameMatch[1].trim();
    
    // Extract title and organization (simplified parsing)
    const titleMatch = text.match(/,\s*([^,]+?)(?:,|$)/);
    const orgMatch = text.match(/(?:of|from)\s+([^,\n]+)/i);

    return {
      name,
      title: titleMatch?.[1]?.trim(),
      organization: orgMatch?.[1]?.trim(),
      witnessType: this.categorizeWitnessType(text),
      credibilityScore: this.calculateCredibilityScore(text)
    };
  }

  private categorizeWitnessType(text: string): Witness['witnessType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('department') || lowerText.includes('agency') || lowerText.includes('government')) {
      return 'government';
    } else if (lowerText.includes('professor') || lowerText.includes('university') || lowerText.includes('institute')) {
      return 'expert';
    } else if (lowerText.includes('association') || lowerText.includes('coalition') || lowerText.includes('advocacy')) {
      return 'advocate';
    } else if (lowerText.includes('company') || lowerText.includes('corporation') || lowerText.includes('industry')) {
      return 'industry';
    }
    
    return 'other';
  }

  private calculateCredibilityScore(text: string): number {
    // Simplified credibility scoring based on affiliations and credentials
    let score = 5; // Base score
    
    const indicators = {
      positive: ['phd', 'professor', 'university', 'institute', 'government', 'department'],
      negative: ['lobby', 'consultant', 'former']
    };

    const lowerText = text.toLowerCase();
    
    indicators.positive.forEach(indicator => {
      if (lowerText.includes(indicator)) score += 1;
    });
    
    indicators.negative.forEach(indicator => {
      if (lowerText.includes(indicator)) score -= 1;
    });

    return Math.max(1, Math.min(10, score));
  }

  private extractTestimony(content: string, witnesses: Witness[]): Testimony[] {
    // Extract testimony sections for each witness
    return witnesses.map(witness => ({
      witness: witness.name,
      organizationRepresented: witness.organization,
      keyPoints: this.extractWitnessKeyPoints(content, witness.name),
      uncomfortableTruths: this.extractUncomfortableTruths(content, witness.name),
      contradictions: this.extractContradictions(content, witness.name),
      lobbingConnections: this.extractLobbyingConnections(content, witness.name)
    }));
  }

  private extractQAExchanges(content: string): QAExchange[] {
    const exchanges: QAExchange[] = [];
    
    // Pattern to match Q&A sections
    const qaPattern = /(?:Mr\.|Ms\.|Mrs\.|Chairman|Senator|Representative)\s+([A-Z][a-z]+)[:\.]?\s*([^?]+\?)\s*(?:Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+)[:\.]?\s*([^\.]+\.)/gi;
    
    let match;
    while ((match = qaPattern.exec(content)) !== null) {
      exchanges.push({
        questioner: match[1],
        question: match[2].trim(),
        respondent: match[3],
        response: match[4].trim(),
        significance: this.calculateExchangeSignificance(match[2], match[4]),
        civicEducationValue: this.extractCivicEducationValue(match[2], match[4])
      });
    }

    return exchanges;
  }

  private async extractKeyPoints(content: string): Promise<string[]> {
    // Extract key policy points and decisions from document
    const keyPoints: string[] = [];
    
    // Look for policy-related statements
    const policyPatterns = [
      /(?:policy|proposal|recommendation|conclusion|finding):?\s*([^\.]+\.)/gi,
      /(?:we|this committee|congress)\s+(?:recommend|propose|find|conclude):?\s*([^\.]+\.)/gi
    ];

    for (const pattern of policyPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const point = match[1]?.trim();
        if (point && point.length > 20 && point.length < 200) {
          keyPoints.push(point);
        }
      }
    }

    return [...new Set(keyPoints)].slice(0, 10); // Remove duplicates, limit to 10
  }

  private async extractTopics(content: string): Promise<string[]> {
    const topics = new Set<string>();
    
    // CivicSense-specific topic patterns
    const topicPatterns = {
      'Healthcare Policy': /health(?:care)?|medicare|medicaid|insurance|medical/gi,
      'Climate Policy': /climate|environment|carbon|emission|green|renewable/gi,
      'Immigration': /immigration|border|asylum|visa|deportation/gi,
      'National Security': /security|defense|military|terrorism|cybersecurity/gi,
      'Economic Policy': /economy|economic|budget|tax|fiscal|spending/gi,
      'Civil Rights': /civil rights|discrimination|equality|voting rights/gi,
      'Gun Policy': /gun|firearm|second amendment|weapon/gi,
      'Technology Policy': /technology|tech|artificial intelligence|privacy|data/gi,
      'Foreign Policy': /foreign|international|trade|diplomacy/gi,
      'Judiciary': /court|judicial|justice|legal|constitutional/gi
    };

    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(content)) {
        topics.add(topic);
      }
    }

    return Array.from(topics);
  }

  private async extractRelatedBills(content: string): Promise<string[]> {
    const bills: string[] = [];
    
    // Pattern to match bill references
    const billPattern = /(?:H\.R\.|S\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.|H\.Res\.|S\.Res\.)\s*(\d+)/gi;
    
    let match;
    while ((match = billPattern.exec(content)) !== null) {
      bills.push(match[0]);
    }

    return [...new Set(bills)];
  }

  // Helper methods for testimony analysis
  private extractWitnessKeyPoints(content: string, witnessName: string): string[] {
    // Extract key points from a specific witness's testimony
    return []; // Implementation would involve parsing witness-specific sections
  }

  private extractUncomfortableTruths(content: string, witnessName: string): string[] {
    // Extract statements that reveal uncomfortable truths about power
    return []; // Implementation would analyze for CivicSense-style revelations
  }

  private extractContradictions(content: string, witnessName: string): string[] {
    // Find contradictions with previous statements or official positions
    return []; // Implementation would cross-reference against known positions
  }

  private extractLobbyingConnections(content: string, witnessName: string): string[] {
    // Identify lobbying connections and conflicts of interest
    return []; // Implementation would check against lobbying databases
  }

  private calculateExchangeSignificance(question: string, response: string): number {
    // Score Q&A exchanges for civic education value
    let significance = 1;
    
    const importantTopics = ['budget', 'policy', 'constitutional', 'oversight', 'accountability'];
    const questionText = question.toLowerCase();
    
    importantTopics.forEach(topic => {
      if (questionText.includes(topic)) significance += 1;
    });

    return Math.min(10, significance);
  }

  private extractCivicEducationValue(question: string, response: string): string {
    // Extract the civic education value from Q&A exchanges
    return `This exchange reveals how ${question.split(' ')[0]} works in practice and demonstrates the oversight function of Congress.`;
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Get multiple packages in batch
   */
  async batchGetPackages(packageIds: string[]): Promise<(GovInfoDocument | null)[]> {
    const results = [];
    
    for (const packageId of packageIds) {
      try {
        const document = await this.getBillPackage(packageId);
        results.push(document);
      } catch (error) {
        console.error(`Error fetching package ${packageId}:`, error);
        results.push(null);
      }
      
      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Search across multiple document types
   */
  async searchMultipleCollections(
    collections: string[],
    params: Record<string, any>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const collection of collections) {
      try {
        const collectionResults = await this.makeRequest(`/collections/${collection}`, params);
        results[collection] = collectionResults;
             } catch (error) {
         console.error(`Error searching collection ${collection}:`, error);
         results[collection] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return results;
  }
}

// Rate limiter class (reused from existing code)
class RateLimiter {
  private lastRequest: number = 0;
  private minInterval: number;
  
  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }
  
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }
}

// Default export for easier importing
export default GovInfoAPIClient; 