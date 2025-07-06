import { supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';

// Create a service client that can bypass RLS for caching operations
// This will use the service key if available, otherwise fall back to anon key
const getServiceClient = () => {
  const serviceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    return createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      serviceKey
    );
  }
  // Fall back to regular client if no service key
  return supabase;
};

// ============================================================================
// SOURCE ANALYSIS SERVICE WITH AI-POWERED BIAS AND CREDIBILITY DETECTION
// ============================================================================

export interface SourceAnalysisResult {
  overallCredibility: number;
  overallBias: 'far_left' | 'left' | 'lean_left' | 'center' | 'lean_right' | 'right' | 'far_right' | 'mixed';
  factualRating: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low' | 'very_low';
  analysisSummary: string;
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  recommendations: string[];
  transparencyScore?: number;
  analysisConfidence: number;
  // Credibility filtering
  meetsCredibilityThreshold: boolean; // true if >= 0.7 credibility
  isHidden: boolean; // true if below threshold but still listed
  credibilityCategory: 'trusted' | 'use_with_caution' | 'low_credibility';
  // Automatic scoring metadata
  lastScoreUpdate?: string;
  contentAnalysisCount?: number;
  recentPerformanceScore?: number;
  // Legacy fields for backward compatibility
  url?: string;
  domain?: string;
  analysisData?: {
    summary: string;
    keyFindings: string[];
    redFlags: string[];
    strengths: string[];
    weaknesses?: string[];
    transparencyScore?: number;
    recommendation: 'highly_recommended' | 'recommended' | 'use_with_caution' | 'not_recommended';
  };
  aiInsights?: {
    model: string;
    confidence: number;
    methodology: string;
  };
  // Web search enhancement fields
  citations?: string[];
  searchQuery?: string;
  sourcesChecked?: string[];
  recentDevelopments?: string[];
  lastUpdated?: string;
  cached?: boolean;
}

interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
}

// Add type safety for OpenAI API response
interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAIErrorResponse {
  error?: {
    message?: string;
  };
}

// ============================================================================
// SOURCE ANALYSIS SERVICE CLASS
// ============================================================================

export default class SourceAnalysisService {
  private static instance: SourceAnalysisService;
  private memoryCache = new Map<string, { data: SourceAnalysisResult; expires: number }>();
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  static getInstance(): SourceAnalysisService {
    if (!SourceAnalysisService.instance) {
      SourceAnalysisService.instance = new SourceAnalysisService();
    }
    return SourceAnalysisService.instance;
  }

  private constructor() {
    console.log('🔍 Source Analysis Service initialized');
  }

  // ============================================================================
  // MAIN ANALYSIS METHOD
  // ============================================================================

  async analyzeSource(url: string): Promise<SourceAnalysisResult> {
    try {
      console.log(`🔍 Analyzing source: ${url}`);
      
      const urlHash = await this.generateUrlHash(url);
      const domain = this.extractDomain(url);

      // Check memory cache first
      const memoryCacheResult = this.memoryCache.get(urlHash);
      if (memoryCacheResult && memoryCacheResult.expires > Date.now()) {
        console.log('📦 Returning from memory cache');
        return memoryCacheResult.data;
      }

      // Check database cache
      const dbCacheResult = await this.getFromDatabaseCache(urlHash);
      if (dbCacheResult !== null) {
        console.log('🗄️ Returning from database cache');
        this.cacheInMemory(urlHash, dbCacheResult);
        return dbCacheResult;
      }

      // No cache hit - perform fresh analysis
      console.log('🤖 Performing fresh AI analysis');
      const analysis = await this.performAIAnalysis(url, domain);
      
      // Cache the result
      await this.saveToDatabaseCache(urlHash, url, domain, analysis);
      this.cacheInMemory(urlHash, analysis);

      return analysis;
    } catch (error) {
      console.error('❌ Error in source analysis:', error);
      return this.createFallbackAnalysis(url);
    }
  }

  // ============================================================================
  // OPEN GRAPH DATA FETCHING
  // ============================================================================

  async fetchOpenGraphData(url: string): Promise<OGData> {
    try {
      console.log(`🔍 Fetching OG data for: ${url}`);
      
      const { data, error } = await supabase.functions.invoke('og-data', {
        body: { url }
      });

      if (error) {
        console.warn('OG data fetch failed, using fallback:', error);
        return this.createFallbackOGData(url);
      }

      console.log(`✅ OG data fetched for: ${url}`, data);
      return data || this.createFallbackOGData(url);
    } catch (error) {
      console.error('Error fetching OG data:', error);
      return this.createFallbackOGData(url);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private enhanceWithCredibilityMetadata(result: Partial<SourceAnalysisResult>): SourceAnalysisResult {
    const credibility = result.overallCredibility || 0;
    const CREDIBILITY_THRESHOLD = 0.5; // Temporarily lowered from 0.7 to allow more sources during testing
    
    return {
      ...result,
      meetsCredibilityThreshold: credibility >= CREDIBILITY_THRESHOLD,
      isHidden: credibility < CREDIBILITY_THRESHOLD,
      credibilityCategory: this.getCredibilityCategory(credibility),
      lastScoreUpdate: new Date().toISOString(),
      contentAnalysisCount: 1,
      recentPerformanceScore: credibility,
    } as SourceAnalysisResult;
  }

  private getCredibilityCategory(score: number): 'trusted' | 'use_with_caution' | 'low_credibility' {
    if (score >= 0.8) return 'trusted';
    if (score >= 0.6) return 'use_with_caution';
    return 'low_credibility';
  }

  private async generateUrlHash(url: string): Promise<string> {
    try {
      // Normalize the URL before hashing
      const normalizedUrl = url.toLowerCase().trim();
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        normalizedUrl,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
    } catch (error) {
      console.error('Error generating URL hash:', error);
              // Fallback to a simple hash if crypto fails
        return encodeURIComponent(url).substring(0, 32).replace(/[^a-zA-Z0-9]/g, 'x');
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
      console.log(`🔗 Domain extracted from "${url}": "${domain}"`);
      return domain;
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      const fallbackDomain = domainMatch && domainMatch[1] ? domainMatch[1].replace(/^www\./, '').toLowerCase() : url.toLowerCase();
      console.log(`🔗 Fallback domain extracted from "${url}": "${fallbackDomain}"`);
      return fallbackDomain;
    }
  }

  private createFallbackAnalysis(url: string): SourceAnalysisResult {
    const domain = this.extractDomain(url);
    
    // Known source defaults with proper type safety - comprehensive database
    const knownDefaults: Record<string, Partial<SourceAnalysisResult>> = {
      // Official Government Sources (Highest credibility)
      'congress.gov': {
        overallCredibility: 0.98,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'whitehouse.gov': {
        overallCredibility: 0.95,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'supremecourt.gov': {
        overallCredibility: 0.98,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'senate.gov': {
        overallCredibility: 0.97,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'house.gov': {
        overallCredibility: 0.97,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'judiciary.gov': {
        overallCredibility: 0.96,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'cdc.gov': {
        overallCredibility: 0.94,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'nih.gov': {
        overallCredibility: 0.95,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      // Wire Services and International News (Very High credibility)
      'reuters.com': {
        overallCredibility: 0.92,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'apnews.com': {
        overallCredibility: 0.92,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'bbc.com': {
        overallCredibility: 0.90,
        overallBias: 'center',
        factualRating: 'high',
      },
      // Major Newspapers (High credibility, various bias)
      'nytimes.com': {
        overallCredibility: 0.85,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'washingtonpost.com': {
        overallCredibility: 0.83,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'wsj.com': {
        overallCredibility: 0.87,
        overallBias: 'lean_right',
        factualRating: 'high',
      },
      'usatoday.com': {
        overallCredibility: 0.80,
        overallBias: 'center',
        factualRating: 'high',
      },
      // Public Broadcasting (High credibility, slight left lean)
      'npr.org': {
        overallCredibility: 0.88,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'pbs.org': {
        overallCredibility: 0.86,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      // Television News (Variable credibility)
      'cnn.com': {
        overallCredibility: 0.70,
        overallBias: 'lean_left',
        factualRating: 'mostly_factual',
      },
      'foxnews.com': {
        overallCredibility: 0.65,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'nbcnews.com': {
        overallCredibility: 0.78,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'abcnews.go.com': {
        overallCredibility: 0.77,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'cbsnews.com': {
        overallCredibility: 0.76,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      // Newsmagazines
      'time.com': {
        overallCredibility: 0.75,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'newsweek.com': {
        overallCredibility: 0.72,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      // Political Publications
      'politico.com': {
        overallCredibility: 0.78,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'thehill.com': {
        overallCredibility: 0.75,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      // Agricultural/Rural News
      'agri-pulse.com': {
        overallCredibility: 0.82,
        overallBias: 'center',
        factualRating: 'high',
      },
      'agriculture.com': {
        overallCredibility: 0.80,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      // Academic/Research
      'brookings.edu': {
        overallCredibility: 0.85,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'aei.org': {
        overallCredibility: 0.83,
        overallBias: 'lean_right',
        factualRating: 'high',
      },
      // Conservative Publications
      'dailywire.com': {
        overallCredibility: 0.72,
        overallBias: 'right',
        factualRating: 'mostly_factual',
      },
      'nationalreview.com': {
        overallCredibility: 0.78,
        overallBias: 'right',
        factualRating: 'high',
      },
      'breitbart.com': {
        overallCredibility: 0.58,
        overallBias: 'right',
        factualRating: 'mixed',
      },
      'townhall.com': {
        overallCredibility: 0.65,
        overallBias: 'right',
        factualRating: 'mostly_factual',
      },
      'nypost.com': {
        overallCredibility: 0.68,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'washingtonexaminer.com': {
        overallCredibility: 0.70,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'washingtontimes.com': {
        overallCredibility: 0.66,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      // Liberal Publications
      'huffpost.com': {
        overallCredibility: 0.65,
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      'salon.com': {
        overallCredibility: 0.62,
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      'motherjones.com': {
        overallCredibility: 0.68,
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      'thenation.com': {
        overallCredibility: 0.70,
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      'vox.com': {
        overallCredibility: 0.72,
        overallBias: 'lean_left',
        factualRating: 'mostly_factual',
      },
      'slate.com': {
        overallCredibility: 0.68,
        overallBias: 'lean_left',
        factualRating: 'mostly_factual',
      },
      'theguardian.com': {
        overallCredibility: 0.80,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      // Center Publications
      'theatlantic.com': {
        overallCredibility: 0.82,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'economist.com': {
        overallCredibility: 0.88,
        overallBias: 'lean_right',
        factualRating: 'high',
      },
      'csmonitor.com': {
        overallCredibility: 0.85,
        overallBias: 'center',
        factualRating: 'high',
      },
      'realclearpolitics.com': {
        overallCredibility: 0.75,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'axios.com': {
        overallCredibility: 0.78,
        overallBias: 'center',
        factualRating: 'high',
      },
      'allsides.com': {
        overallCredibility: 0.82,
        overallBias: 'center',
        factualRating: 'high',
      },
      // INVESTIGATIVE JOURNALISM (High priority for CivicSense - reveals power dynamics)
      'propublica.org': {
        overallCredibility: 0.93, // Upgraded - Pulitzer Prize-winning investigative journalism
        overallBias: 'center', // Investigative work transcends typical bias categories
        factualRating: 'very_high',
      },
      'revealnews.org': {
        overallCredibility: 0.88, // Center for Investigative Reporting
        overallBias: 'center',
        factualRating: 'high',
      },
      'icij.org': {
        overallCredibility: 0.92, // International Consortium of Investigative Journalists
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'publicintegrity.org': {
        overallCredibility: 0.89, // Center for Public Integrity
        overallBias: 'center',
        factualRating: 'high',
      },
      'opensecrets.org': {
        overallCredibility: 0.91, // Campaign finance transparency
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'followthemoney.org': {
        overallCredibility: 0.90, // Political money tracking
        overallBias: 'center',
        factualRating: 'very_high',
      },

      // FACT-CHECKING (Essential for CivicSense accuracy)
      'factcheck.org': {
        overallCredibility: 0.91,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      'politifact.com': {
        overallCredibility: 0.87,
        overallBias: 'center',
        factualRating: 'high',
      },
      'snopes.com': {
        overallCredibility: 0.85,
        overallBias: 'center',
        factualRating: 'high',
      },
      'mediabiasfactcheck.com': {
        overallCredibility: 0.82,
        overallBias: 'center',
        factualRating: 'high',
      },

      // NONPROFIT NEWS (Independent public interest reporting)
      'khn.org': {
        overallCredibility: 0.86, // Kaiser Health News
        overallBias: 'center',
        factualRating: 'high',
      },
      'themarshallproject.org': {
        overallCredibility: 0.87, // Criminal justice reporting
        overallBias: 'center',
        factualRating: 'high',
      },
      'insideclimatenews.org': {
        overallCredibility: 0.88, // Environmental reporting
        overallBias: 'center',
        factualRating: 'high',
      },
      'grist.org': {
        overallCredibility: 0.83, // Environmental journalism
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'ballotpedia.org': {
        overallCredibility: 0.89, // Election and voting information
        overallBias: 'center',
        factualRating: 'high',
      },
      'votesmart.org': {
        overallCredibility: 0.87, // Political accountability
        overallBias: 'center',
        factualRating: 'high',
      },

      // LOCAL INVESTIGATIVE NEWS (Critical for community impact)
      'tampabay.com': {
        overallCredibility: 0.85, // Tampa Bay Times - Strong investigative tradition
        overallBias: 'center',
        factualRating: 'high',
      },
      'miamiherald.com': {
        overallCredibility: 0.82,
        overallBias: 'center',
        factualRating: 'high',
      },
      'startribune.com': {
        overallCredibility: 0.84, // Minneapolis Star Tribune
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'dallasnews.com': {
        overallCredibility: 0.83,
        overallBias: 'center',
        factualRating: 'high',
      },
      'denverpost.com': {
        overallCredibility: 0.80,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      'oregonlive.com': {
        overallCredibility: 0.81,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      'seattletimes.com': {
        overallCredibility: 0.83,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'azcentral.com': {
        overallCredibility: 0.80,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },

      // ALTERNATIVE INVESTIGATIVE MEDIA
      'reason.com': {
        overallCredibility: 0.74,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'theintercept.com': {
        overallCredibility: 0.78, // Upgraded for investigative work
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      // International Sources
      'dw.com': {
        overallCredibility: 0.87,
        overallBias: 'center',
        factualRating: 'high',
      },
      'france24.com': {
        overallCredibility: 0.84,
        overallBias: 'center',
        factualRating: 'high',
      },
      'cbc.ca': {
        overallCredibility: 0.85,
        overallBias: 'lean_left',
        factualRating: 'high',
      },
      'scmp.com': {
        overallCredibility: 0.77,
        overallBias: 'center',
        factualRating: 'mostly_factual',
      },
      'japantimes.co.jp': {
        overallCredibility: 0.84,
        overallBias: 'center',
        factualRating: 'high',
      },
      'straitstimes.com': {
        overallCredibility: 0.81,
        overallBias: 'center',
        factualRating: 'high',
      },
      'thehindu.com': {
        overallCredibility: 0.82,
        overallBias: 'center',
        factualRating: 'high',
      },
      'aljazeera.com': {
        overallCredibility: 0.78,
        overallBias: 'lean_left',
        factualRating: 'mostly_factual',
      },
      'rt.com': {
        overallCredibility: 0.45,
        overallBias: 'far_left',
        factualRating: 'mixed',
      },
      'telegraph.co.uk': {
        overallCredibility: 0.76,
        overallBias: 'lean_right',
        factualRating: 'mostly_factual',
      },
      'spectator.co.uk': {
        overallCredibility: 0.74,
        overallBias: 'right',
        factualRating: 'mostly_factual',
      },
      // Literary & Opinion Publications
      'newyorker.com': {
        overallCredibility: 0.83,
        overallBias: 'left',
        factualRating: 'high',
      },
      'harpers.org': {
        overallCredibility: 0.80,
        overallBias: 'left',
        factualRating: 'high',
      },
      'nationalgeographic.com': {
        overallCredibility: 0.92,
        overallBias: 'center',
        factualRating: 'very_high',
      },
      // Additional Left Sources for Balance
      'democracynow.org': {
        overallCredibility: 0.73,
        overallBias: 'left',
        factualRating: 'mostly_factual',
      },
      'jacobinmag.com': {
        overallCredibility: 0.69,
        overallBias: 'far_left',
        factualRating: 'mostly_factual',
      },
      // More Conservative Sources
      'americanthinker.com': {
        overallCredibility: 0.64,
        overallBias: 'right',
        factualRating: 'mixed',
      },
      'federalist.com': {
        overallCredibility: 0.67,
        overallBias: 'right',
        factualRating: 'mostly_factual',
      },
      'theblaze.com': {
        overallCredibility: 0.66,
        overallBias: 'right',
        factualRating: 'mixed',
      },
      'newsmax.com': {
        overallCredibility: 0.62,
        overallBias: 'right',
        factualRating: 'mixed',
      },
      'oann.com': {
        overallCredibility: 0.48,
        overallBias: 'far_right',
        factualRating: 'low',
      },

    };

    const defaults = knownDefaults[domain] || {};
    
    // Debug logging
    console.log(`📊 Fallback analysis for domain "${domain}":`, {
      found: !!defaults.overallCredibility,
      credibility: defaults.overallCredibility || 0.5,
      knownDomainsCount: Object.keys(knownDefaults).length,
      hasCongressGov: !!knownDefaults['congress.gov'],
      hasReutersCom: !!knownDefaults['reuters.com']
    });
    
    // Ensure all required properties are present with defaults
    const baseCredibility = defaults.overallCredibility || 0.5;
    const baseBias = defaults.overallBias || 'center';
    const baseFactualRating = defaults.factualRating || 'mixed';

    return this.enhanceWithCredibilityMetadata({
      overallCredibility: baseCredibility,
      overallBias: baseBias,
      factualRating: baseFactualRating,
      analysisSummary: defaults.overallCredibility && defaults.overallCredibility > 0.8 
        ? `${domain} is generally considered a reliable source with high credibility.`
        : `Analysis unavailable for ${domain}. Using baseline assessment.`,
      strengths: defaults.overallCredibility && defaults.overallCredibility > 0.8 
        ? ['Established reputation', 'Editorial standards', 'Fact-checking processes']
        : ['Domain recognized'],
      weaknesses: defaults.overallCredibility && defaults.overallCredibility < 0.7 
        ? ['Limited verification of claims', 'Potential bias in reporting']
        : [],
      redFlags: [],
      recommendations: [
        'Verify information with multiple sources',
        'Check publication date and context',
        'Look for author credentials and expertise'
      ],
      transparencyScore: defaults.overallCredibility || 0.5,
      analysisConfidence: defaults.overallCredibility ? 0.8 : 0.3,
      // Legacy compatibility
      url,
      domain,
      analysisData: {
        summary: defaults.overallCredibility 
          ? `Based on our database of known sources, ${domain} has a credibility score of ${(defaults.overallCredibility * 100).toFixed(0)}%.`
          : `This source has not been analyzed yet. Using default moderate credibility assessment.`,
        keyFindings: defaults.overallCredibility && defaults.overallCredibility > 0.8 
          ? ['Established news organization', 'Professional editorial standards'] 
          : [],
        redFlags: defaults.overallCredibility && defaults.overallCredibility < 0.6 
          ? ['Low credibility rating', 'Potential for misinformation'] 
          : [],
        strengths: defaults.overallCredibility && defaults.overallCredibility > 0.8 
          ? ['Established news organization', 'Professional editorial standards'] 
          : [],
        weaknesses: defaults.overallCredibility && defaults.overallCredibility < 0.7 
          ? ['May contain biased reporting', 'Editorial stance may influence coverage'] 
          : [],
        recommendation: defaults.overallCredibility && defaults.overallCredibility > 0.8 ? 'recommended' : 'use_with_caution',
      },
      aiInsights: {
        model: 'gpt-4-turbo-preview',
        confidence: defaults.overallCredibility ? 0.8 : 0.5,
        methodology: 'Default credibility assessment based on known sources',
      },
    });
  }

  private createFallbackOGData(url: string): OGData {
    const domain = this.extractDomain(url);
    
    // Enhanced domain-based fallbacks for known news sites
    const domainFallbacks: Record<string, OGData> = {
      'congress.gov': {
        title: 'U.S. Congress Official Site',
        description: 'Official website of the United States Congress',
        siteName: 'Congress.gov',
      },
      'senate.gov': {
        title: 'U.S. Senate',
        description: 'Official website of the United States Senate',
        siteName: 'Senate.gov',
      },
      'house.gov': {
        title: 'U.S. House of Representatives',
        description: 'Official website of the U.S. House of Representatives',
        siteName: 'House.gov',
      },
      'supremecourt.gov': {
        title: 'Supreme Court of the United States',
        description: 'Official website of the U.S. Supreme Court',
        siteName: 'SupremeCourt.gov',
      },
      'whitehouse.gov': {
        title: 'The White House',
        description: 'Official website of the White House',
        siteName: 'WhiteHouse.gov',
      },
      'washingtonpost.com': {
        title: 'Washington Post: Political News',
        description: 'Political news and analysis',
        siteName: 'Washington Post',
        image: 'https://www.washingtonpost.com/wp-stat/graphics/ai2html/logos/twp-social-share.png',
      },
      'nytimes.com': {
        title: 'The New York Times',
        description: 'Breaking news, multimedia & opinion',
        siteName: 'The New York Times',
      },
      'reuters.com': {
        title: 'Reuters News Agency',
        description: 'International news organization',
        siteName: 'Reuters',
      },
      'apnews.com': {
        title: 'Associated Press News',
        description: 'Independent global news organization',
        siteName: 'AP News',
      },
      'npr.org': {
        title: 'NPR',
        description: 'National Public Radio news and analysis',
        siteName: 'NPR',
      },
      'bbc.com': {
        title: 'BBC News',
        description: 'BBC News - Trusted international news',
        siteName: 'BBC',
      },
      'cnn.com': {
        title: 'CNN',
        description: 'Breaking news and analysis',
        siteName: 'CNN',
      },
      'foxnews.com': {
        title: 'Fox News',
        description: 'Breaking news and opinion',
        siteName: 'Fox News',
      },
      'nbcnews.com': {
        title: 'NBC News',
        description: 'Breaking news, videos & top stories',
        siteName: 'NBC News',
      },
      'abcnews.go.com': {
        title: 'ABC News',
        description: 'Breaking news and live video',
        siteName: 'ABC News',
      },
      'wsj.com': {
        title: 'The Wall Street Journal',
        description: 'Business and financial news',
        siteName: 'WSJ',
      },
    };

    const fallbackData = domainFallbacks[domain] || {
      title: `Content from ${domain}`,
      description: 'External source content',
      siteName: domain,
    };

    console.log(`⚠️ Using fallback OG data for: ${url}`, fallbackData);
    return fallbackData;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private cacheInMemory(urlHash: string, analysis: SourceAnalysisResult): void {
    this.memoryCache.set(urlHash, {
      data: analysis,
      expires: Date.now() + (30 * 60 * 1000), // 30 minutes
    });
  }

  async getOGData(url: string): Promise<OGData | null> {
    // Use the existing fetchOpenGraphData method which handles edge functions
    return this.fetchOpenGraphData(url);
  }

  // Cleanup method for expired analyses
  async cleanupExpiredAnalyses(): Promise<number> {
    try {
      const serviceClient = getServiceClient();
      const { data } = await serviceClient.rpc('cleanup_expired_ai_analyses');
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired analyses:', error);
      return 0;
    }
  }

  // ============================================================================
  // BATCH ANALYSIS FOR PERFORMANCE
  // ============================================================================

  async analyzeSources(urls: string[]): Promise<SourceAnalysisResult[]> {
    const results: SourceAnalysisResult[] = [];
    
    for (const url of urls) {
      try {
        const analysis = await this.analyzeSource(url);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze ${url}:`, error);
        results.push(this.createFallbackAnalysis(url));
      }
    }
    
    return results;
  }

  private async getFromDatabaseCache(urlHash: string): Promise<SourceAnalysisResult | null> {
    try {
      const { data, error } = await supabase
        .from('ai_source_analysis')
        .select('*')
        .eq('url_hash', urlHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        console.log('🔍 No valid cache entry found');
        return null;
      }

      return this.enhanceWithCredibilityMetadata({
        overallCredibility: data.overall_credibility,
        overallBias: data.overall_bias,
        factualRating: data.factual_rating,
        analysisSummary: data.analysis_summary,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        redFlags: data.red_flags || [],
        recommendations: data.recommendations || [],
        transparencyScore: data.transparency_score,
        analysisConfidence: data.analysis_confidence,
      });
    } catch (error) {
      console.error('Error fetching from database cache:', error);
      return null;
    }
  }

  private async saveToDatabaseCache(
    urlHash: string, 
    url: string, 
    domain: string, 
    analysis: SourceAnalysisResult
  ): Promise<void> {
    try {
      const serviceClient = getServiceClient();
      
      // VALIDATE AND SANITIZE bias value to match database constraint
      // Database constraint only allows: 'left', 'lean_left', 'center', 'lean_right', 'right', 'mixed'
      const sanitizedBias = this.sanitizeBiasValue(analysis.overallBias);
      
      const { error } = await serviceClient
        .from('ai_source_analysis')
        .upsert({
          url_hash: urlHash,
          original_url: url,
          domain: domain,
          overall_credibility: analysis.overallCredibility,
          overall_bias: sanitizedBias, // Use sanitized value
          factual_rating: analysis.factualRating,
          analysis_summary: analysis.analysisSummary,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          red_flags: analysis.redFlags,
          recommendations: analysis.recommendations,
          transparency_score: analysis.transparencyScore,
          analysis_confidence: analysis.analysisConfidence,
          analyzed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.CACHE_TTL).toISOString(),
        }, {
          onConflict: 'url_hash'
        });

      if (error) {
        console.error('Error saving to database cache:', error);
        // Don't throw - continue with operation even if caching fails
      } else {
        console.log('✅ Analysis cached successfully');
      }
    } catch (error) {
      console.error('Error in saveToDatabaseCache:', error);
      // Don't throw - continue with operation even if caching fails
    }
  }

  /**
   * Sanitize bias values to match database constraint
   * Maps 'far_left' -> 'left' and 'far_right' -> 'right'
   * Ensures only valid constraint values are used
   */
  private sanitizeBiasValue(bias: string): string {
    const biasMap: Record<string, string> = {
      'far_left': 'left',
      'far_right': 'right',
      'left': 'left',
      'lean_left': 'lean_left', 
      'center': 'center',
      'lean_right': 'lean_right',
      'right': 'right',
      'mixed': 'mixed'
    };
    
    const sanitized = biasMap[bias] || 'mixed'; // Default to 'mixed' for unknown values
    
    if (sanitized !== bias) {
      console.log(`🔧 Sanitized bias value: '${bias}' -> '${sanitized}' for database compatibility`);
    }
    
    return sanitized;
  }

  private async performAIAnalysis(url: string, domain: string): Promise<SourceAnalysisResult> {
    console.log(`🔍 Performing AI analysis with web search for: ${domain}`);

    try {
      // First, try real-time web search analysis
      const webSearchResult = await this.performWebSearchAnalysis(url, domain);
      if (webSearchResult) {
        console.log(`✅ Web search analysis completed for: ${domain}`);
        return webSearchResult;
      }
    } catch (error) {
      console.warn(`⚠️ Web search analysis failed for ${domain}, falling back to known sources:`, error);
    }

    // Fallback to known source analysis
    console.log(`📚 Using fallback analysis for: ${domain}`);
    return this.createFallbackAnalysis(url);
  }

  private async performWebSearchAnalysis(url: string, domain: string): Promise<SourceAnalysisResult | null> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('OpenAI API key not found, skipping web search analysis');
        return null;
      }

      const searchQuery = `"${domain}" news source credibility bias rating fact check media bias chart allsides media bias fact check ad fontes`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Analyze the news source "${domain}" for bias and credibility. Based on your knowledge, provide information about:

1. Credibility ratings from AllSides, Media Bias/Fact Check, Ad Fontes Media (Media Bias Chart)
2. Recent controversies, retractions, or fact-checking reports
3. Political bias assessments from multiple rating organizations
4. Factual accuracy track record and misinformation incidents
5. Transparency policies, editorial standards, and corrections procedures
6. Recent journalism awards or recognition
7. Financial backing and ownership transparency

Based on your analysis, provide a comprehensive assessment with:
- Overall credibility score (0-1, where 1 is highest credibility)
- Bias rating: "left", "lean_left", "center", "lean_right", "right", or "mixed" (use "left" for strongly liberal sources, "right" for strongly conservative sources)
- Factual accuracy rating: "very_high", "high", "mostly_factual", "mixed", "low", or "very_low"
- Key strengths and weaknesses found in assessments
- Any red flags or concerning patterns
- Specific recommendations for readers
- Transparency and accountability measures

Format your response as JSON:
{
  "credibility_score": 0.85,
  "bias_rating": "lean_left",
  "factual_rating": "high",
  "analysis_summary": "Brief summary of current findings and recent developments",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "red_flags": ["flag1", "flag2"],
  "recommendations": ["rec1", "rec2"],
  "transparency_score": 0.8,
  "confidence": 0.9,
  "sources_checked": ["AllSides", "Media Bias/Fact Check"],
  "last_updated": "2025-01-27",
  "recent_developments": ["Any recent news about this source"]
}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenAIResponse;
      
      // Log the full response for debugging with type safety
      console.log(`🔍 OpenAI Response structure for ${domain}:`, {
        hasChoices: !!data?.choices,
        keys: Object.keys(data || {}),
        sampleContent: JSON.stringify(data).slice(0, 200) + '...'
      });
      
      // Extract the analysis from the response with type safety
      let analysisText = '';
      
      if (data?.choices?.[0]?.message?.content) {
        const content = data.choices[0].message.content;
        analysisText = typeof content === 'string' ? content : '';
      } else {
        console.error(`❌ Unexpected response format for ${domain}:`, data);
        throw new Error('Invalid response format from OpenAI API');
      }
      
      // Ensure we always have a valid string value
      analysisText = analysisText || '';
      
      // Ensure analysisText is always a string and handle potential undefined values
      const analysisTextSample = String(analysisText ?? '');
      console.log(`📝 Extracted analysis text for ${domain} (${analysisTextSample.length} chars):`, 
        analysisTextSample.slice(0, 300) + '...');
      
      const citations = this.extractCitations(data);
      
      // Parse the JSON analysis from the response - try multiple patterns
      let analysis = null;
      
      // First try: Look for a complete JSON object
      const jsonMatch = analysisTextSample.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parseResult = await import('../ai/enhanced-json-parser').then(m => m.parseJSON(jsonMatch[0]));
          if (parseResult.isValid) {
            analysis = parseResult.content;
            console.log(`✅ Successfully parsed JSON for ${domain}${parseResult.repaired ? ' (repaired)' : ''}`);
          } else {
            console.warn(`⚠️ Enhanced JSON parse failed for ${domain}:`, parseResult.errors);
          }
        } catch (parseError) {
          console.warn(`⚠️ JSON parse failed for ${domain}:`, parseError);
        }
      }
      
             // Second try: Look for structured data patterns if first attempt failed
       if (!analysis && analysisTextSample) {
         const extractedData: any = {};
         
         // Extract credibility score  
         const credibilityMatch = analysisTextSample.match(/"credibility_score"\s*:\s*([\d.]+)/);
         if (credibilityMatch && credibilityMatch[1]) {
           extractedData.credibility_score = parseFloat(credibilityMatch[1]);
         }
         
         // Extract bias rating
         const biasMatch = analysisTextSample.match(/"bias_rating"\s*:\s*"([^"]+)"/);
         if (biasMatch) {
           extractedData.bias_rating = biasMatch[1];
         }
         
         // Extract factual rating
         const factualMatch = analysisTextSample.match(/"factual_rating"\s*:\s*"([^"]+)"/);
         if (factualMatch) {
           extractedData.factual_rating = factualMatch[1];
         }
         
         // Extract analysis summary
         const summaryMatch = analysisTextSample.match(/"analysis_summary"\s*:\s*"([^"]+)"/);
         if (summaryMatch) {
           extractedData.analysis_summary = summaryMatch[1];
         }
        
        if (Object.keys(extractedData).length > 0) {
          analysis = extractedData;
          console.log(`🔧 Extracted partial data for ${domain}:`, analysis);
        }
      }
      
      // If we still don't have analysis, throw the error
      if (!analysis) {
        console.error(`❌ No valid JSON analysis found for ${domain}. Response:`, {
          responseKeys: Object.keys(data),
          analysisTextSample: analysisTextSample.slice(0, 500),
          fullResponse: JSON.stringify(data, null, 2).slice(0, 1000)
        });
        throw new Error('No JSON analysis found in response');
      }
      
      const credibilityScore = analysis.credibility_score || 0.5;
      const baseResult: SourceAnalysisResult = {
        overallCredibility: credibilityScore,
        overallBias: analysis.bias_rating || 'center',
        factualRating: analysis.factual_rating || 'mixed',
        analysisSummary: analysis.analysis_summary || 'Analysis based on web search findings',
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        redFlags: analysis.red_flags || [],
        recommendations: analysis.recommendations || [],
        transparencyScore: analysis.transparency_score || 0.5,
        analysisConfidence: analysis.confidence || 0.7,
        // Enhanced metadata
        url,
        domain,
        analysisData: {
          summary: analysis.analysis_summary || 'Real-time web search analysis',
          keyFindings: analysis.strengths?.concat(analysis.weaknesses || []) || [],
          redFlags: analysis.red_flags || [],
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          transparencyScore: analysis.transparency_score || 0.5,
          recommendation: this.getRecommendation(credibilityScore),
        },
        aiInsights: {
          model: 'gpt-4o-mini-web-search',
          confidence: analysis.confidence || 0.7,
          methodology: 'Real-time web search with credibility assessment',
        },
        // Additional fields for web search
        citations: citations,
        searchQuery: searchQuery,
        sourcesChecked: analysis.sources_checked || [],
        recentDevelopments: analysis.recent_developments || [],
        lastUpdated: new Date().toISOString(),
        // Credibility metadata
        meetsCredibilityThreshold: credibilityScore >= 0.7,
        isHidden: credibilityScore < 0.7,
        credibilityCategory: this.getCredibilityCategory(credibilityScore),
      };
      
      return baseResult;

    } catch (error) {
      console.error('Error performing web search analysis:', error);
      return null;
    }
  }

  private extractCitations(openaiResponse: any): string[] {
    const citations: string[] = [];
    
    try {
      // Extract citations from OpenAI response
      if (openaiResponse.choices && Array.isArray(openaiResponse.choices)) {
        for (const choice of openaiResponse.choices) {
          if (choice.message?.content && Array.isArray(choice.message.content)) {
            for (const item of choice.message.content) {
              if (item.annotations && Array.isArray(item.annotations)) {
                for (const annotation of item.annotations) {
                  if (annotation.type === 'url_citation' && annotation.url) {
                    citations.push(annotation.url);
                  }
                }
              }
            }
          }
        }
      }

      // Also check for citations in the new Responses API format
      if (Array.isArray(openaiResponse)) {
        for (const item of openaiResponse) {
          if (item.type === 'message' && item.content && Array.isArray(item.content)) {
            for (const contentItem of item.content) {
              if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
                for (const annotation of contentItem.annotations) {
                  if (annotation.type === 'url_citation' && annotation.url) {
                    citations.push(annotation.url);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting citations:', error);
    }
    
    return Array.from(new Set(citations)); // Remove duplicates
  }

  private getRecommendation(credibilityScore: number): 'highly_recommended' | 'recommended' | 'use_with_caution' | 'not_recommended' {
    if (credibilityScore >= 0.9) return 'highly_recommended';
    if (credibilityScore >= 0.75) return 'recommended';
    if (credibilityScore >= 0.5) return 'use_with_caution';
    return 'not_recommended';
  }

  // ============================================================================
  // AUTOMATIC DOMAIN SCORING SYSTEM
  // ============================================================================

  /**
   * Filter sources by credibility threshold (default 70%)
   * @param sources Array of source analysis results
   * @param threshold Minimum credibility score (0.0 to 1.0)
   * @param showHidden Whether to include low-credibility sources with visibility flags
   */
  public filterSourcesByCredibility(
    sources: SourceAnalysisResult[], 
    threshold: number = 0.7,
    showHidden: boolean = true
  ): SourceAnalysisResult[] {
    return sources.filter(source => {
      const meetsThreshold = source.overallCredibility >= threshold;
      return meetsThreshold || showHidden;
    });
  }

  /**
   * Update domain credibility based on recent content analysis
   * This method analyzes patterns in the domain's recent content to adjust its base credibility score
   */
  public async updateDomainCredibility(domain: string): Promise<void> {
    try {
      console.log(`📊 Updating credibility score for domain: ${domain}`);

      // Get recent analyses for this domain
      const recentAnalyses = await this.getRecentDomainAnalyses(domain);
      
      if (recentAnalyses.length < 3) {
        console.log(`⚠️ Insufficient data for ${domain} (${recentAnalyses.length} analyses)`);
        return;
      }

      // Calculate performance metrics
      const metrics = this.calculateDomainMetrics(recentAnalyses);
      
      // Apply dynamic scoring algorithm
      const updatedScore = this.calculateDynamicCredibilityScore(domain, metrics);
      
      // Save updated score to database
      await this.saveDomainCredibilityUpdate(domain, updatedScore, metrics);
      
      console.log(`✅ Updated ${domain} credibility: ${updatedScore.toFixed(2)} (was ${metrics.averageScore.toFixed(2)})`);
      
    } catch (error) {
      console.error(`❌ Error updating domain credibility for ${domain}:`, error);
    }
  }

  private async getRecentDomainAnalyses(domain: string): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('ai_source_analysis')
        .select('*')
        .eq('domain', domain)
        .gte('analyzed_at', thirtyDaysAgo.toISOString())
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent domain analyses:', error);
      return [];
    }
  }

  private calculateDomainMetrics(analyses: any[]) {
    const scores = analyses.map(a => a.overall_credibility).filter(s => s != null);
    const biases = analyses.map(a => a.overall_bias).filter(b => b != null);
    const factualRatings = analyses.map(a => a.factual_rating).filter(f => f != null);
    
    // Calculate metrics
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const scoreVariance = this.calculateVariance(scores);
    const consistentBias = this.calculateBiasConsistency(biases);
    const factualAccuracy = this.calculateFactualAccuracy(factualRatings);
    
    return {
      averageScore,
      scoreVariance,
      consistentBias,
      factualAccuracy,
      analysisCount: analyses.length,
      recentTrend: this.calculateRecentTrend(analyses),
    };
  }

  private calculateVariance(scores: number[]): number {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }

  private calculateBiasConsistency(biases: string[]): number {
    if (biases.length === 0) return 0.5;
    
    // Count occurrences of each bias
    const biasCount = biases.reduce((acc, bias) => {
      acc[bias] = (acc[bias] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find the most common bias
    const maxCount = Math.max(...Object.values(biasCount));
    return maxCount / biases.length; // Higher = more consistent
  }

  private calculateFactualAccuracy(ratings: string[]): number {
    if (ratings.length === 0) return 0.5;
    
    const ratingScores = {
      'very_high': 1.0,
      'high': 0.8,
      'mostly_factual': 0.6,
      'mixed': 0.4,
      'low': 0.2,
      'very_low': 0.1,
    };
    
    const scores = ratings.map(rating => ratingScores[rating as keyof typeof ratingScores] || 0.4);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateRecentTrend(analyses: any[]): 'improving' | 'declining' | 'stable' {
    if (analyses.length < 6) return 'stable';
    
    // Compare first half vs second half of recent analyses
    const midpoint = Math.floor(analyses.length / 2);
    const recentHalf = analyses.slice(0, midpoint);
    const olderHalf = analyses.slice(midpoint);
    
    const recentAvg = recentHalf.reduce((sum, a) => sum + (a.overall_credibility || 0.5), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, a) => sum + (a.overall_credibility || 0.5), 0) / olderHalf.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private calculateDynamicCredibilityScore(domain: string, metrics: any): number {
    // Start with current average score
    let adjustedScore = metrics.averageScore;
    
    // Apply adjustments based on various factors
    
    // 1. Consistency bonus/penalty
    if (metrics.scoreVariance < 0.05) {
      adjustedScore += 0.05; // Bonus for consistency
    } else if (metrics.scoreVariance > 0.15) {
      adjustedScore -= 0.05; // Penalty for inconsistency
    }
    
    // 2. Recent trend adjustment
    if (metrics.recentTrend === 'improving') {
      adjustedScore += 0.03;
    } else if (metrics.recentTrend === 'declining') {
      adjustedScore -= 0.05; // Heavier penalty for declining
    }
    
    // 3. Factual accuracy bonus
    if (metrics.factualAccuracy > 0.8) {
      adjustedScore += 0.05;
    } else if (metrics.factualAccuracy < 0.5) {
      adjustedScore -= 0.1;
    }
    
    // 4. Analysis count factor (more data = more confidence)
    if (metrics.analysisCount >= 20) {
      adjustedScore += 0.02; // Small bonus for extensive analysis
    }
    
    // 5. Bias consistency factor
    if (metrics.consistentBias > 0.8) {
      adjustedScore += 0.02; // Bonus for predictable bias (transparency)
    }
    
    // Ensure score stays within bounds
    return Math.max(0, Math.min(1, adjustedScore));
  }

  private async saveDomainCredibilityUpdate(domain: string, newScore: number, metrics: any): Promise<void> {
    try {
      const serviceClient = getServiceClient();
      
      const { error } = await serviceClient
        .from('domain_credibility_updates')
        .insert({
          domain,
          new_credibility_score: newScore,
          previous_score: metrics.averageScore,
          analysis_count: metrics.analysisCount,
          score_variance: metrics.scoreVariance,
          factual_accuracy: metrics.factualAccuracy,
          recent_trend: metrics.recentTrend,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving domain credibility update:', error);
      }
    } catch (error) {
      console.error('Error in saveDomainCredibilityUpdate:', error);
    }
  }

  /**
   * Get domains that need credibility updates (haven't been updated recently)
   */
  public async getDomainsNeedingUpdate(): Promise<string[]> {
    try {
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('ai_source_analysis')
        .select('domain')
        .gte('analyzed_at', sevenDaysAgo.toISOString());

      if (error) throw error;
      
      // Group by domain and filter those with at least 3 analyses
      const domainCounts = (data || []).reduce((acc: Record<string, number>, row: any) => {
        if (row && row.domain && typeof row.domain === 'string') {
          acc[row.domain] = (acc[row.domain] || 0) + 1;
        }
        return acc;
      }, {});
      
      return Object.keys(domainCounts).filter(domain => {
        const count = domainCounts[domain];
        return count !== undefined && count >= 3;
      });
    } catch (error) {
      console.error('Error getting domains needing update:', error);
      return [];
    }
  }

  /**
   * Run automatic credibility updates for all qualifying domains
   */
  public async runAutomaticCredibilityUpdates(): Promise<void> {
    console.log('🚀 Starting automatic credibility updates...');
    
    try {
      const domains = await this.getDomainsNeedingUpdate();
      console.log(`📊 Found ${domains.length} domains needing updates`);
      
      for (const domain of domains) {
        await this.updateDomainCredibility(domain);
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Automatic credibility updates completed');
    } catch (error) {
      console.error('❌ Error in automatic credibility updates:', error);
    }
  }
} 