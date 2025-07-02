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
  
  constructor(config?: Partial<CongressAPIConfig>) {
    this.config = {
      baseUrl: 'https://api.congress.gov/v3',
      apiKey: process.env.CONGRESS_API_KEY || '',
      rateLimitPerSecond: 1, // Congress.gov allows 1 request per second
      ...config
    };
    
    // Validate API key is configured
    if (!this.config.apiKey) {
      console.error('❌ CONGRESS_API_KEY environment variable is not set!');
      console.error('📝 Get your API key from: https://api.congress.gov/sign-up/');
      console.error('💡 Add CONGRESS_API_KEY=your_key_here to your .env.local file');
      throw new Error('Congress API key is required. Please set CONGRESS_API_KEY environment variable.');
    }
    
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerSecond);
    console.log('🏛️ Congress API client initialized successfully');
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
    
    // If congress is specified, use the congress-specific endpoint
    let endpoint = '/bill';
    if (params.congress) {
      endpoint = `/bill/${params.congress}`;
    }
    
    const queryParams = new URLSearchParams();
    // Only add non-congress parameters to query params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && key !== 'congress') {
        queryParams.append(key, value.toString());
      }
    });
    queryParams.append('api_key', this.config.apiKey);
    queryParams.append('format', 'json');
    
    const url = `${this.config.baseUrl}${endpoint}?${queryParams}`;
    console.log('Bills API URL:', url); // Debug log
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bills API Error:', response.status, response.statusText, errorText);
      throw new CongressAPIError(`Failed to fetch bills: ${response.status} ${response.statusText} - ${errorText}`);
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
  
  // Fetch member information with pagination support
  async getMembers(params: {
    congress?: number;
    stateCode?: string;
    district?: number;
    offset?: number;
    limit?: number;
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
    
    const queryParams = new URLSearchParams();
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('api_key', this.config.apiKey);
    queryParams.append('format', 'json');
    
    const url = `${this.config.baseUrl}${endpoint}?${queryParams}`;
    console.log('Members API URL:', url); // Debug log
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicSense/1.0 (civic education platform)'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Members API Error:', response.status, response.statusText, errorText);
      throw new CongressAPIError(`Failed to fetch members: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Members API Response structure:', {
      hasMembers: !!data.members,
      membersLength: data.members?.length,
      pagination: data.pagination,
      count: data.count,
      firstMemberKeys: data.members?.[0] ? Object.keys(data.members[0]) : [],
      sampleMember: data.members?.[0] ? {
        bioguideId: data.members[0].bioguideId,
        firstName: data.members[0].firstName,
        lastName: data.members[0].lastName,
        hasTerms: !!data.members[0].terms,
        termsType: typeof data.members[0].terms,
        termsLength: Array.isArray(data.members[0].terms) ? data.members[0].terms.length : 'not array'
      } : null
    });
    
    return data;
  }
  
  // Fetch ALL members with automatic pagination
  async getAllMembers(params: {
    congress?: number;
    stateCode?: string;
    district?: number;
  }) {
    console.log(`🔄 Fetching ALL members for congress ${params.congress || 'current'}...`);
    
    const allMembers = [];
    let offset = 0;
    const limit = 250; // Maximum allowed by Congress.gov API
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📄 Fetching page at offset ${offset}...`);
      
      const response = await this.getMembers({
        ...params,
        offset,
        limit
      });
      
      const members = response.members || [];
      allMembers.push(...members);
      
      console.log(`✅ Got ${members.length} members (total so far: ${allMembers.length})`);
      
      // Check if we have more pages
      hasMore = members.length === limit;
      offset += limit;
      
      // Safety break to prevent infinite loops
      if (offset > 2000) {
        console.warn('⚠️ Safety break: stopping at offset 2000 to prevent infinite loop');
        break;
      }
    }
    
    console.log(`🎉 Completed pagination: ${allMembers.length} total members found`);
    
    return {
      members: allMembers,
      count: allMembers.length,
      pagination: {
        total: allMembers.length,
        pages: Math.ceil(allMembers.length / limit)
      }
    };
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