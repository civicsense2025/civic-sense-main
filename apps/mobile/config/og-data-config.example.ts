// Open Graph Data Service Configuration
// Copy this to og-data-config.ts and add your actual API keys

export const OG_DATA_CONFIG = {
  // Your backend API endpoint (recommended)
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api.vercel.app',
  
  // Third-party service API keys (fallback options)
  LINKPREVIEW_KEY: process.env.EXPO_PUBLIC_LINKPREVIEW_KEY || '',
  
  // Service URLs
  SERVICES: {
    linkPreview: 'https://api.linkpreview.net/',
    scrapingDog: 'https://api.scrapingdog.com/article/', 
    htmlMeta: 'https://htmlmeta.com/api/',
    urlPreview: 'https://api.urlpreview.net/',
  },
  
  // Cache settings
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Request timeout
  TIMEOUT: 10000, // 10 seconds
  
  // User agent for requests
  USER_AGENT: 'Mozilla/5.0 (compatible; CivicSense-OG-Bot/1.0)',
};

// Alternative service implementations
export const OG_SERVICES = {
  
  // LinkPreview.net (Free tier: 1000 requests/month)
  linkPreview: async (url: string) => {
    const response = await fetch(`${OG_DATA_CONFIG.SERVICES.linkPreview}?key=${OG_DATA_CONFIG.LINKPREVIEW_KEY}&q=${encodeURIComponent(url)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        description: data.description,
        image: data.image,
        url: data.url,
      };
    }
    throw new Error(`LinkPreview failed: ${response.status}`);
  },
  
  // ScrapingDog (Paid service)
  scrapingDog: async (url: string, apiKey: string) => {
    const response = await fetch(`${OG_DATA_CONFIG.SERVICES.scrapingDog}?url=${encodeURIComponent(url)}&api_key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.og_title || data.title,
        description: data.og_description || data.description,
        image: data.og_image,
        url: data.og_url || url,
      };
    }
    throw new Error(`ScrapingDog failed: ${response.status}`);
  },
  
  // Custom proxy service (if you want to avoid third-party services)
  customProxy: async (url: string) => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const data = await response.json();
      const html = data.contents;
      
      // Basic HTML parsing (limited compared to server-side cheerio)
      const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) || 
                        html.match(/<title>([^<]*)<\/title>/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
      
      return {
        title: titleMatch ? titleMatch[1] : '',
        description: descMatch ? descMatch[1] : '',
        image: imageMatch ? imageMatch[1] : '',
        url: url,
      };
    }
    throw new Error(`Proxy service failed: ${response.status}`);
  },
}; 