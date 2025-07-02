/**
 * HTML Utilities for Content Processing
 * 
 * Utility functions for processing HTML content in React Native
 * where full HTML rendering libraries aren't available or needed.
 */

// ============================================================================
// HTML TAG REMOVAL AND BASIC PARSING
// ============================================================================

/**
 * Strips HTML tags from a string and decodes common HTML entities
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    // Clean up multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses HTML content into structured blurbs for "Why This Matters" sections
 */
export function parseWhyThisMatters(htmlContent: string): Array<{
  title: string;
  content: string;
  emoji: string;
}> {
  if (!htmlContent) return [];

  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const parsed: Array<{ title: string; content: string; emoji: string; }> = [];

  // Enhanced debug logging
  console.log('🔍 parseWhyThisMatters input length:', htmlContent.length);
  console.log('🔍 parseWhyThisMatters input preview:', htmlContent.substring(0, 200));

  // Helper function to capitalize first actual word
  const capitalizeFirstWord = (text: string): string => {
    return text.replace(/^([^a-zA-Z]*)(.)/, (match, punctuation, firstLetter) => {
      return punctuation + firstLetter.toUpperCase();
    });
  };

  // First, strip HTML tags
  const cleanContent = stripHtml(htmlContent);
  console.log('🔍 Clean content length:', cleanContent.length);
  console.log('🔍 Clean content preview:', cleanContent.substring(0, 200));

  // Try to parse different formats
  
  // Format 1: HTML list items (most common)
  if (htmlContent.includes('<li>') || htmlContent.includes('<ul>') || htmlContent.includes('<ol>')) {
    console.log('📝 Parsing HTML list format');
    const listItems = htmlContent.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    console.log('📝 Found', listItems.length, 'list items');
    
    listItems.forEach((item, index) => {
      if (index < numberEmojis.length) {
        const content = stripHtml(item);
        console.log(`📝 Processing list item ${index + 1}:`, content.substring(0, 100));
        
        const colonIndex = content.indexOf(':');
        
        if (colonIndex > 0) {
          const title = content.substring(0, colonIndex).trim();
          const description = content.substring(colonIndex + 1).trim();
          
          parsed.push({
            title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
            content: capitalizeFirstWord(description),
            emoji: numberEmojis[index] || '📝'
          });
        } else {
          // No colon, treat first few words as title
          const words = content.split(' ');
          const title = words.slice(0, 3).join(' ');
          const description = words.slice(3).join(' ') || title;
          
          parsed.push({
            title: capitalizeFirstWord(title),
            content: capitalizeFirstWord(description),
            emoji: numberEmojis[index] || '📝'
          });
        }
      }
    });
  }
  
  // Format 2: Paragraph with bullet points or numbering
  else if (cleanContent.includes('•') || cleanContent.includes('◦') || cleanContent.includes('▪') || cleanContent.includes('→') || cleanContent.includes('-')) {
    console.log('📝 Parsing bullet point format');
    const sections = cleanContent.split(/[•◦▪→-]/).filter(s => s.trim());
    console.log('📝 Found', sections.length, 'bullet sections');
    
    sections.forEach((section, index) => {
      if (index < numberEmojis.length && section.trim()) {
        const trimmed = section.trim();
        console.log(`📝 Processing bullet ${index + 1}:`, trimmed.substring(0, 100));
        
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex > 0) {
          const title = trimmed.substring(0, colonIndex).trim();
          const content = trimmed.substring(colonIndex + 1).trim();

          parsed.push({
            title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
            content: capitalizeFirstWord(content),
            emoji: numberEmojis[index] || '📝'
          });
        } else {
          const words = trimmed.split(' ');
          const title = words.slice(0, 4).join(' ');
          const content = words.slice(4).join(' ') || title;

          parsed.push({
            title: capitalizeFirstWord(title),
            content: capitalizeFirstWord(content),
            emoji: numberEmojis[index] || '📝'
          });
        }
      }
    });
  }
  
  // Format 3: Numbered points (1., 2., etc.)
  else if (cleanContent.match(/\d+\.\s/)) {
    console.log('📝 Parsing numbered format');
    const sections = cleanContent.split(/\d+\.\s/).filter(s => s.trim());
    console.log('📝 Found', sections.length, 'numbered sections');
    
    sections.forEach((section, index) => {
      if (index < numberEmojis.length && section.trim()) {
        const trimmed = section.trim();
        console.log(`📝 Processing number ${index + 1}:`, trimmed.substring(0, 100));
        
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex > 0) {
          const title = trimmed.substring(0, colonIndex).trim();
          const content = trimmed.substring(colonIndex + 1).trim();

          parsed.push({
            title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
            content: capitalizeFirstWord(content),
            emoji: numberEmojis[index] || '📝'
          });
        } else {
          const words = trimmed.split(' ');
          const title = words.slice(0, 4).join(' ');
          const content = words.slice(4).join(' ') || title;

          parsed.push({
            title: capitalizeFirstWord(title),
            content: capitalizeFirstWord(content),
            emoji: numberEmojis[index] || '📝'
          });
        }
      }
    });
  }
  
  // Format 4: Header tags with content
  else if (htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi)) {
    console.log('📝 Parsing header tag format');
    const headerMatches = htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    console.log('📝 Found', headerMatches.length, 'headers');
    
    // Extract headers and following content
    const headerRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>(.*?)(?=<h[1-6]|$)/gis;
    let match;
    let index = 0;
    
         while ((match = headerRegex.exec(htmlContent)) !== null && index < numberEmojis.length) {
       const title = stripHtml(match[1] || '').trim();
       const content = stripHtml(match[2] || '').trim();
       
       console.log(`📝 Processing header ${index + 1}:`, title);
      
      if (title && content) {
        parsed.push({
          title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
          content: capitalizeFirstWord(content),
          emoji: numberEmojis[index] || '📝'
        });
        index++;
      }
    }
  }
  
  // Format 5: Paragraph breaks with strong/bold headings
  else if (htmlContent.includes('<strong>') || htmlContent.includes('<b>') || htmlContent.includes('**')) {
    console.log('📝 Parsing bold headings format');
    // Split on paragraph breaks and look for bold headings
    const paragraphs = htmlContent.split(/(<p[^>]*>|<\/p>|<br\s*\/?>|\n\s*\n)/gi)
      .filter(p => p.trim() && !p.match(/^<[^>]*>$/));
    
    console.log('📝 Found', paragraphs.length, 'paragraphs with potential bold headings');
    
    paragraphs.forEach((para, index) => {
      if (index < numberEmojis.length && para.trim()) {
        const cleanPara = stripHtml(para).trim();
        if (cleanPara.length > 0) {
          console.log(`📝 Processing paragraph ${index + 1}:`, cleanPara.substring(0, 100));
          
          // Try to find bold text at start
          const boldMatch = para.match(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/i) || 
                           para.match(/\*\*(.*?)\*\*/);
          
                     if (boldMatch) {
             const title = stripHtml(boldMatch[1] || '').trim();
            const remainingContent = para.replace(boldMatch[0], '').trim();
            const content = stripHtml(remainingContent).trim();
            
            parsed.push({
              title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
              content: capitalizeFirstWord(content || title),
              emoji: numberEmojis[index] || '📝'
            });
          } else {
            // No bold, treat as simple paragraph
            const sentences = cleanPara.split(/[.!?]+/);
            const title = sentences[0]?.trim() || 'Key Point';
            const content = sentences.slice(1).join('.').trim() || cleanPara;

            parsed.push({
              title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
              content: capitalizeFirstWord(content),
              emoji: numberEmojis[index] || '📝'
            });
          }
        }
      }
    });
  }
  
  // Format 6: Multiple paragraphs (fallback)
  else {
    console.log('📝 Parsing paragraph fallback format');
    const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim());
    console.log('📝 Found', paragraphs.length, 'paragraphs in fallback');
    
    paragraphs.forEach((paragraph, index) => {
      if (index < numberEmojis.length && paragraph.trim()) {
        const trimmed = paragraph.trim();
        console.log(`📝 Processing fallback paragraph ${index + 1}:`, trimmed.substring(0, 100));
        
        const sentences = trimmed.split(/[.!?]+/);
        const title = sentences[0]?.trim() || 'Key Point';
        const content = sentences.slice(1).join('.').trim() || trimmed;

        parsed.push({
          title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
          content: capitalizeFirstWord(content),
          emoji: numberEmojis[index] || '📝'
        });
      }
    });
  }

  // If no structured content found, create a single blurb with full content
  if (parsed.length === 0 && cleanContent.trim()) {
    console.log('📝 No structured content found, creating single blurb');
    
    // Try to split into sentences and create multiple blurbs
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length > 1) {
      sentences.forEach((sentence, index) => {
        if (index < numberEmojis.length) {
          const trimmed = sentence.trim();
          if (trimmed.length > 0) {
            const words = trimmed.split(' ');
            const title = words.slice(0, 4).join(' ');
            const content = words.length > 4 ? trimmed : `${trimmed}.`;
            
            parsed.push({
              title: capitalizeFirstWord(title),
              content: capitalizeFirstWord(content),
              emoji: numberEmojis[index] || '📝'
            });
          }
        }
      });
    } else {
      // Single large block - break it into smaller chunks
      const words = cleanContent.split(' ');
      const chunkSize = Math.ceil(words.length / Math.min(3, Math.max(1, Math.floor(words.length / 30))));
      
      for (let i = 0; i < words.length && parsed.length < numberEmojis.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 0) {
          const chunkWords = chunk.trim().split(' ');
          const title = chunkWords.slice(0, 4).join(' ');
          const content = chunk.trim();
          
          parsed.push({
            title: capitalizeFirstWord(title),
            content: capitalizeFirstWord(content),
            emoji: numberEmojis[parsed.length] || '📝'
          });
        }
      }
    }
  }

  console.log('✅ parseWhyThisMatters result:', parsed.length, 'blurbs created');
  return parsed;
}

/**
 * Extracts plain text description from potentially HTML content
 */
export function extractDescription(content: string | null | undefined): string {
  if (!content) return '';
  return stripHtml(content);
}

/**
 * Processes "sources" content that might contain HTML metadata
 */
export function parseSourceContent(sourceContent: string): {
  name: string;
  url: string | null;
  domain: string | null;
  cleanContent: string;
} {
  try {
    // Try to extract URL first
    const urlMatch = sourceContent.match(/https?:\/\/([^\/\s<>"']+)/i);
    const domain = urlMatch?.[1]?.toLowerCase().replace(/^www\./, '') || null;
    
    // Try to extract og_site_name from metadata
    const ogSiteNameMatch = sourceContent.match(/og_site_name['":\s]*([^'"<>\s]+)/i);
    const siteName = ogSiteNameMatch?.[1] || null;
    
    // Try to extract title or organization name
    const titleMatch = sourceContent.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                       sourceContent.match(/title['":\s]*([^'"<>\n]+)/i);
    const title = titleMatch?.[1]?.trim() || null;
    
    // Clean up domain for display
    const domainName = domain ? 
      domain.split('.').slice(-2).join('.') // Get main domain (e.g., "example.com" from "subdomain.example.com")
      : null;
    
    // Determine the best organization name
    const orgName = siteName || title || (domainName && domainName.charAt(0).toUpperCase() + domainName.slice(1)) || 'Unknown Source';
    
    return {
      name: orgName,
      domain: domainName,
      url: urlMatch?.[0] || null,
      cleanContent: stripHtml(sourceContent),
    };
  } catch (error) {
    return {
      name: 'Unknown Source',
      domain: null,
      url: null,
      cleanContent: stripHtml(sourceContent),
    };
  }
} 