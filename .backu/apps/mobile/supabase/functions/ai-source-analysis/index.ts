// @ts-nocheck
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { createHash } from 'https://deno.land/std@0.208.0/crypto/mod.ts'

// Domain knowledge for known sources
const knownSources = {
  'nytimes.com': { baseCredibility: 0.85, knownBias: 'lean_left' },
  'washingtonpost.com': { baseCredibility: 0.85, knownBias: 'lean_left' },
  'reuters.com': { baseCredibility: 0.92, knownBias: 'center' },
  'apnews.com': { baseCredibility: 0.92, knownBias: 'center' },
  'wsj.com': { baseCredibility: 0.85, knownBias: 'lean_right' },
  'foxnews.com': { baseCredibility: 0.65, knownBias: 'right' },
  'cnn.com': { baseCredibility: 0.70, knownBias: 'left' },
  'npr.org': { baseCredibility: 0.88, knownBias: 'lean_left' },
  'bbc.com': { baseCredibility: 0.90, knownBias: 'center' },
  'nbcnews.com': { baseCredibility: 0.75, knownBias: 'lean_left' },
  'abcnews.go.com': { baseCredibility: 0.78, knownBias: 'lean_left' },
  'congress.gov': { baseCredibility: 0.98, knownBias: 'center' },
  'senate.gov': { baseCredibility: 0.98, knownBias: 'center' },
  'house.gov': { baseCredibility: 0.98, knownBias: 'center' },
  'supremecourt.gov': { baseCredibility: 0.98, knownBias: 'center' },
  'whitehouse.gov': { baseCredibility: 0.95, knownBias: 'center' }, // official but can vary by admin
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { url, ogData } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Extract domain
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace(/^www\./, '')

    // Create URL hash for caching
    const encoder = new TextEncoder()
    const urlBytes = encoder.encode(url)
    const hashBuffer = await crypto.subtle.digest('SHA-256', urlBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const urlHash = btoa(String.fromCharCode(...hashArray))

    // Check cache first
    const { data: cachedAnalysis } = await supabase
      .from('source_analysis_cache')
      .select('*')
      .eq('url_hash', urlHash)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (cachedAnalysis) {
      console.log('Returning cached analysis for:', domain)
      return new Response(
        JSON.stringify({
          credibility: cachedAnalysis.credibility_score,
          bias: cachedAnalysis.bias_rating,
          factualRating: cachedAnalysis.factual_rating,
          analysisData: cachedAnalysis.analysis_data,
          aiInsights: cachedAnalysis.ai_insights,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if it's a known source
    const knownSource = knownSources[domain]
    
    // Prepare context for OpenAI
    const analysisPrompt = `Analyze this news source for bias and credibility:

URL: ${url}
Domain: ${domain}
${ogData ? `Title: ${ogData.title || 'N/A'}
Description: ${ogData.description || 'N/A'}
Site Name: ${ogData.siteName || domain}` : ''}
${knownSource ? `\nKnown baseline: Credibility ${knownSource.baseCredibility}, Bias: ${knownSource.knownBias}` : ''}

Provide a JSON response with:
1. credibility_score: 0-1 where 1 is most credible. Consider:
   - Track record of accuracy
   - Editorial standards  
   - Transparency about sources
   - Corrections policy
   - Author expertise
   
2. bias_rating: one of "left", "lean_left", "center", "lean_right", "right", "mixed"
   
3. factual_rating: one of "very_high", "high", "mostly_factual", "mixed", "low", "very_low"

4. analysis_summary: 2-3 sentence summary

5. key_findings: Array of 3-5 specific observations

6. red_flags: Array of any concerning patterns (or empty array)

7. strengths: Array of positive credibility indicators

8. recommendation: "highly_recommended", "recommended", "use_with_caution", "not_recommended"

Be objective and specific. Base analysis on known information about the source.`

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert media analyst specializing in identifying bias and assessing credibility of news sources. Provide objective, fact-based analysis.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const aiResult = await openaiResponse.json()
    const analysis = JSON.parse(aiResult.choices[0].message.content)

    // Prepare data for database
    const sourceAnalysis = {
      url_hash: urlHash,
      original_url: url,
      domain: domain,
      credibility_score: analysis.credibility_score,
      bias_rating: analysis.bias_rating,
      factual_rating: analysis.factual_rating,
      analysis_data: {
        summary: analysis.analysis_summary,
        keyFindings: analysis.key_findings,
        redFlags: analysis.red_flags || [],
        strengths: analysis.strengths || [],
        recommendation: analysis.recommendation,
        analyzedAt: new Date().toISOString()
      },
      ai_insights: {
        model: 'gpt-4-turbo-preview',
        confidence: 0.85,
        methodology: 'AI-powered analysis with domain knowledge',
        lastUpdated: new Date().toISOString()
      },
      source_metadata: ogData || {},
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }

    // Store in cache
    const { error: insertError } = await supabase
      .from('source_analysis_cache')
      .insert(sourceAnalysis)

    if (insertError) {
      console.error('Error caching analysis:', insertError)
      // Continue anyway - analysis is still valid
    }

    // Return analysis
    return new Response(
      JSON.stringify({
        credibility: sourceAnalysis.credibility_score,
        bias: sourceAnalysis.bias_rating,
        factualRating: sourceAnalysis.factual_rating,
        analysisData: sourceAnalysis.analysis_data,
        aiInsights: sourceAnalysis.ai_insights,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Return intelligent defaults based on domain if analysis fails
    try {
      const urlObj = new URL(req.url)
      const domain = urlObj.hostname.replace(/^www\./, '')
      const knownSource = knownSources[domain]
      
      if (knownSource) {
        return new Response(
          JSON.stringify({
            credibility: knownSource.baseCredibility,
            bias: knownSource.knownBias,
            factualRating: knownSource.baseCredibility >= 0.8 ? 'high' : 'mostly_factual',
            analysisData: {
              summary: 'Analysis based on known source reputation.',
              keyFindings: ['Established news source', 'Known editorial standards'],
              recommendation: knownSource.baseCredibility >= 0.8 ? 'recommended' : 'use_with_caution'
            },
            fallback: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 