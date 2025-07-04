// @ts-nocheck
// Supabase Edge Function - Deno runtime types not available in this environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  url?: string
  site_name?: string
  type?: string
}

// Extract Open Graph tags from HTML
function extractOpenGraphData(html: string, originalUrl: string): OpenGraphData {
  const ogData: OpenGraphData = {}
  
  // Basic regex patterns to extract OG meta tags
  const ogPatterns = {
    title: /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
    description: /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i,
    image: /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i,
    url: /<meta\s+property=["']og:url["']\s+content=["']([^"']*)["']/i,
    site_name: /<meta\s+property=["']og:site_name["']\s+content=["']([^"']*)["']/i,
    type: /<meta\s+property=["']og:type["']\s+content=["']([^"']*)["']/i,
  }

  // Also try alternative patterns (name attribute instead of property)
  const namePatterns = {
    title: /<meta\s+name=["']og:title["']\s+content=["']([^"']*)["']/i,
    description: /<meta\s+name=["']og:description["']\s+content=["']([^"']*)["']/i,
    image: /<meta\s+name=["']og:image["']\s+content=["']([^"']*)["']/i,
  }

  // Extract data using patterns
  for (const [key, pattern] of Object.entries(ogPatterns)) {
    const match = html.match(pattern)
    if (match && match[1]) {
      ogData[key as keyof OpenGraphData] = match[1].trim()
    }
  }

  // Try name patterns if property patterns didn't work
  for (const [key, pattern] of Object.entries(namePatterns)) {
    if (!ogData[key as keyof OpenGraphData]) {
      const match = html.match(pattern)
      if (match && match[1]) {
        ogData[key as keyof OpenGraphData] = match[1].trim()
      }
    }
  }

  // Fallback to regular title tag if no og:title
  if (!ogData.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      ogData.title = titleMatch[1].trim()
    }
  }

  // Fallback to meta description if no og:description
  if (!ogData.description) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    if (descMatch && descMatch[1]) {
      ogData.description = descMatch[1].trim()
    }
  }

  // Ensure URL is absolute
  if (ogData.image && !ogData.image.startsWith('http')) {
    const baseUrl = new URL(originalUrl)
    ogData.image = new URL(ogData.image, baseUrl.origin).toString()
  }

  ogData.url = ogData.url || originalUrl

  return ogData
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Fetching OG data for: ${url}`)

    // Check cache first
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Check if we have cached OG data
    const { data: cached } = await supabase
      .from('og_data_cache')
      .select('*')
      .eq('url', url)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days cache
      .single()

    if (cached) {
      console.log('📦 Using cached OG data')
      return new Response(
        JSON.stringify({
          success: true,
          title: cached.title,
          description: cached.description,
          image: cached.image,
          cached: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch fresh OG data
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivicSense/1.0; +https://civicsense.com)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // Extract OG data using regex
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i)?.[1] ||
                   html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null
    
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i)?.[1] ||
                         html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || null
    
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)/i)?.[1] || null

    // Clean and validate the extracted data
    const title = ogTitle ? ogTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : null
    const description = ogDescription ? ogDescription.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : null
    let image = ogImage

    // Resolve relative image URLs
    if (image && !image.startsWith('http')) {
      try {
        const baseUrl = new URL(url)
        image = new URL(image, baseUrl.origin).href
      } catch (error) {
        console.warn('Failed to resolve relative image URL:', error)
        image = null
      }
    }

    // Cache the result
    try {
      await supabase.from('og_data_cache').insert({
        url,
        domain: new URL(url).hostname,
        title,
        description,
        image,
        created_at: new Date().toISOString(),
      })
    } catch (cacheError) {
      console.warn('Failed to cache OG data:', cacheError)
    }

    console.log(`✅ OG data extracted successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        title,
        description,
        image,
        cached: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching OG data:', error)

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Open Graph data',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 