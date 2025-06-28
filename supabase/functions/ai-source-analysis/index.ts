// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple URL hashing function for cache keys
function hashUrl(url: string): string {
  return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, url, mediaOrg, biasIndicators } = await req.json()

    if (!prompt || !url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and url' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🤖 Analyzing source: ${url}`)

    // Create Supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for database writes
    )

    const urlHash = hashUrl(url)
    const domain = new URL(url).hostname.replace('www.', '')

    // Check if we already have analysis for this URL
    const { data: existingAnalysis } = await supabase
      .from('ai_source_analysis')
      .select('*')
      .eq('url_hash', urlHash)
      .eq('original_url', url)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingAnalysis) {
      console.log('📦 Returning cached analysis for:', url)
      return new Response(
        JSON.stringify({
          success: true,
          summary: existingAnalysis.analysis_summary,
          keyFindings: existingAnalysis.key_findings,
          recommendedReading: existingAnalysis.overall_credibility > 0.7,
          contextualWarnings: existingAnalysis.red_flags,
          overallCredibility: existingAnalysis.overall_credibility,
          overallBias: existingAnalysis.overall_bias,
          factualRating: existingAnalysis.factual_rating,
          analysisConfidence: existingAnalysis.analysis_confidence,
          cached: true,
          metadata: {
            url,
            analyzedAt: existingAnalysis.created_at,
            mediaOrgFound: !!mediaOrg,
            biasIndicatorsFound: biasIndicators?.length || 0,
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use OpenAI to analyze the source
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert media literacy educator helping citizens evaluate news sources for the CivicSense platform.
            
            Analyze the provided source and respond with a JSON object containing:
            {
              "overallCredibility": number (0.0-1.0, where 1.0 is most credible),
              "overallBias": "left" | "lean_left" | "center" | "lean_right" | "right" | "mixed",
              "factualRating": "very_high" | "high" | "mostly_factual" | "mixed" | "low" | "very_low",
              "summary": "Brief assessment of source credibility and bias",
              "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
              "strengths": ["Strength 1", "Strength 2"],
              "weaknesses": ["Weakness 1", "Weakness 2"],
              "redFlags": ["Red flag 1", "Red flag 2"],
              "recommendations": ["Recommendation 1", "Recommendation 2"],
              "transparencyScore": number (0.0-1.0),
              "analysisConfidence": number (0.0-1.0)
            }
            
            Focus on civic education - help citizens understand how to evaluate sources for democratic participation.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const aiResponse = openAIData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response from AI
    let analysisResult
    try {
      analysisResult = JSON.parse(aiResponse)
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', aiResponse)
      // Fallback to basic analysis
      analysisResult = {
        overallCredibility: 0.5,
        overallBias: 'mixed',
        factualRating: 'mixed',
        summary: "AI analysis temporarily unavailable. Manual review recommended.",
        keyFindings: ["Source requires manual evaluation"],
        strengths: ["Requires further analysis"],
        weaknesses: ["Unable to auto-analyze"],
        redFlags: [],
        recommendations: ["Verify information with multiple sources"],
        transparencyScore: 0.5,
        analysisConfidence: 0.3
      }
    }

    // Store the analysis result in the database
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Cache for 7 days

      await supabase.from('ai_source_analysis').upsert({
        url_hash: urlHash,
        original_url: url,
        domain,
        overall_credibility: analysisResult.overallCredibility,
        overall_bias: analysisResult.overallBias,
        factual_rating: analysisResult.factualRating,
        analysis_summary: analysisResult.summary,
        key_findings: analysisResult.keyFindings || [],
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        red_flags: analysisResult.redFlags || [],
        recommendations: analysisResult.recommendations || [],
        transparency_score: analysisResult.transparencyScore || null,
        analysis_confidence: analysisResult.analysisConfidence,
        expires_at: expiresAt.toISOString(),
      })
      
      console.log('✅ Cached analysis result for:', url)
    } catch (dbError) {
      console.warn('Failed to cache analysis result:', dbError)
      // Don't fail the whole request if caching fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult,
        metadata: {
          url,
          analyzedAt: new Date().toISOString(),
          mediaOrgFound: !!mediaOrg,
          biasIndicatorsFound: biasIndicators?.length || 0,
          cached: false,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in AI source analysis:', error)

    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze source',
        details: error.message,
        fallback: {
          overallCredibility: 0.5,
          overallBias: 'mixed',
          factualRating: 'mixed',
          summary: "Analysis temporarily unavailable. Please evaluate source manually.",
          keyFindings: ["Manual source evaluation recommended"],
          strengths: [],
          weaknesses: ["Analysis unavailable"],
          redFlags: [],
          recommendations: ["Cross-reference with multiple sources", "Verify facts independently"],
          transparencyScore: 0.5,
          analysisConfidence: 0.3
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
