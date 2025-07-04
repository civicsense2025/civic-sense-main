// Example Node.js API endpoint for fetching Open Graph data
// This can be deployed as a Vercel/Netlify function or Express.js endpoint

const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Cache to store OG data (in production, use Redis or database)
const ogCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extract Open Graph data from HTML
 */
function extractOpenGraphData(html, url) {
  const $ = cheerio.load(html);
  const ogData = {};

  // Extract OG meta tags
  $('meta[property^="og:"], meta[name^="og:"]').each((i, elem) => {
    const property = $(elem).attr('property') || $(elem).attr('name');
    const content = $(elem).attr('content');
    
    if (property && content) {
      const key = property.replace('og:', '');
      ogData[key] = content;
    }
  });

  // Fallback to Twitter meta tags if OG tags are missing
  if (!ogData.title) {
    ogData.title = $('meta[name="twitter:title"]').attr('content') || $('title').text();
  }
  
  if (!ogData.description) {
    ogData.description = $('meta[name="twitter:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content');
  }
  
  if (!ogData.image) {
    ogData.image = $('meta[name="twitter:image"]').attr('content');
  }

  // Ensure absolute URLs for images
  if (ogData.image && !ogData.image.startsWith('http')) {
    const baseUrl = new URL(url);
    ogData.image = new URL(ogData.image, baseUrl.origin).href;
  }

  return {
    title: ogData.title || '',
    description: ogData.description || '',
    image: ogData.image || '',
    url: ogData.url || url,
    type: ogData.type || 'website',
    siteName: ogData.site_name || '',
  };
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check cache first
    const cacheKey = url;
    const cached = ogCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Cache hit for:', url);
      return res.status(200).json(cached.data);
    }

    console.log('🔍 Fetching OG data for:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivicSense-OG-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const ogData = extractOpenGraphData(html, url);

    // Cache the result
    ogCache.set(cacheKey, {
      data: ogData,
      timestamp: Date.now()
    });

    console.log('✅ Successfully extracted OG data:', {
      title: ogData.title?.substring(0, 50) + '...',
      hasImage: !!ogData.image,
      hasDescription: !!ogData.description
    });

    return res.status(200).json(ogData);

  } catch (error) {
    console.error('❌ Error fetching OG data:', error);
    
    // Return fallback data
    const fallbackData = {
      title: '',
      description: '',
      image: '',
      url: req.body.url,
      type: 'website',
      siteName: '',
      error: error.message
    };

    return res.status(200).json(fallbackData);
  }
}

// For Express.js usage:
// app.post('/api/og-data', handler);

// Package.json dependencies needed:
// {
//   "dependencies": {
//     "cheerio": "^1.0.0-rc.12",
//     "node-fetch": "^2.6.7"
//   }
// } 