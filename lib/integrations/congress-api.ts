// Simple rate limiter for Congress API
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

interface CongressAPIConfig {
  baseUrl: string;
  apiKey: string;
  rateLimitPerSecond: number;
}

export class CongressAPIClient {
  private config: CongressAPIConfig;
  private rateLimiter: RateLimiter;
  
  constructor(config: CongressAPIConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimitPerSecond);
  }
  
  // Fetch bills with proper error handling
  async getBills(params: {
    congress?: number;
    billType?: string;
    offset?: number;
    limit?: number;
    fromDateTime?: string;
    toDateTime?: string;
  }) {
    await this.rateLimiter.wait();
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    queryParams.append('api_key', this.config.apiKey);
    queryParams.append('format', 'json');
    
    const response = await fetch(
      `${this.config.baseUrl}/bill?${queryParams}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CivicSense/1.0 (civic education platform)'
        }
      }
    );
    
    if (!response.ok) {
      throw new CongressAPIError(`Failed to fetch bills: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Fetch bill text with placeholder detection
  async getBillText(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    try {
      const response = await fetch(
        `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/text?api_key=${this.config.apiKey}&format=json`
      );
      
      if (!response.ok) {
        return { hasText: false, isPlaceholder: true, content: null };
      }
      
      const data = await response.json();
      const textVersions = data.textVersions || [];
      
      if (textVersions.length === 0) {
        return { hasText: false, isPlaceholder: true, content: null };
      }
      
      // Check for placeholder text patterns
      const latestVersion = textVersions[0];
      const isPlaceholder = this.detectPlaceholderText(latestVersion);
      
      return {
        hasText: true,
        isPlaceholder,
        content: latestVersion,
        allVersions: textVersions
      };
    } catch (error) {
      console.error('Error fetching bill text:', error);
      return { hasText: false, isPlaceholder: true, content: null };
    }
  }
  
  private detectPlaceholderText(textVersion: any): boolean {
    const placeholderPatterns = [
      /\[INSERT TEXT\]/i,
      /\[TO BE INSERTED\]/i,
      /text not available/i,
      /placeholder/i,
      /bill text will be available/i,
      /check back later/i,
      /text to follow/i,
      /coming soon/i
    ];
    
    const textContent = textVersion.text || '';
    return placeholderPatterns.some(pattern => pattern.test(textContent));
  }
  
  // Fetch member information
  async getMembers(params: {
    congress?: number;
    stateCode?: string;
    district?: number;
  }) {
    await this.rateLimiter.wait();
    
    let endpoint = '/member';
    if (params.congress) {
      endpoint += `/congress/${params.congress}`;
    }
    if (params.stateCode) {
      endpoint += `/${params.stateCode}`;
      if (params.district) {
        endpoint += `/${params.district}`;
      }
    }
    
    const response = await fetch(
      `${this.config.baseUrl}${endpoint}?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      throw new CongressAPIError(`Failed to fetch members: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Fetch voting records
  async getVotes(params: {
    congress: number;
    chamber: 'house' | 'senate';
    session?: number;
    voteNumber?: number;
  }) {
    await this.rateLimiter.wait();
    
    let endpoint = `/${params.chamber}-vote/${params.congress}`;
    if (params.session) {
      endpoint += `/${params.session}`;
      if (params.voteNumber) {
        endpoint += `/${params.voteNumber}`;
      }
    }
    
    const response = await fetch(
      `${this.config.baseUrl}${endpoint}?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      throw new CongressAPIError(`Failed to fetch votes: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Fetch bill summaries
  async getBillSummaries(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      return { summaries: [] };
    }
    
    return response.json();
  }
  
  // Fetch bill actions
  async getBillActions(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/actions?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      return { actions: [] };
    }
    
    return response.json();
  }
  
  // Fetch bill subjects
  async getBillSubjects(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/subjects?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      return { subjects: [] };
    }
    
    return response.json();
  }
  
  // Fetch bill cosponsors
  async getBillCosponsors(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/cosponsors?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      return { cosponsors: [] };
    }
    
    return response.json();
  }
  
  // Fetch related bills
  async getRelatedBills(congress: number, billType: string, billNumber: number) {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `${this.config.baseUrl}/bill/${congress}/${billType}/${billNumber}/relatedbills?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      return { relatedBills: [] };
    }
    
    return response.json();
  }
  
  // Fetch committees
  async getCommittees(params: {
    congress?: number;
    chamber?: 'house' | 'senate' | 'joint';
  }) {
    await this.rateLimiter.wait();
    
    let endpoint = '/committee';
    if (params.congress && params.chamber) {
      endpoint += `/${params.congress}/${params.chamber}`;
    } else if (params.congress) {
      endpoint += `/${params.congress}`;
    } else if (params.chamber) {
      endpoint += `/${params.chamber}`;
    }
    
    const response = await fetch(
      `${this.config.baseUrl}${endpoint}?api_key=${this.config.apiKey}&format=json`
    );
    
    if (!response.ok) {
      throw new CongressAPIError(`Failed to fetch committees: ${response.statusText}`);
    }
    
    return response.json();
  }
}

class CongressAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CongressAPIError';
  }
} 