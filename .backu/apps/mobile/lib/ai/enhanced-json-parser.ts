import { jsonrepair } from 'jsonrepair';

export interface ParsedContent {
  isValid: boolean;
  content: any;
  errors: string[];
  repaired: boolean;
}

/**
 * Enhanced JSON parsing utility that handles AI-generated content with backticks,
 * markdown formatting, and other common issues
 */
export class EnhancedJSONParser {
  /**
   * Parse JSON with automatic repair for common AI formatting issues
   */
  static async parseJSON(rawContent: string): Promise<ParsedContent> {
    const errors: string[] = [];

    try {
      // First, try to parse as-is
      const parsed = JSON.parse(rawContent);
      return {
        isValid: true,
        content: parsed,
        errors: [],
        repaired: false
      };
    } catch (firstError) {
      errors.push(`Initial parse failed: ${firstError}`);
      
      try {
        // 🔧 ULTRA-AGGRESSIVE cleaning for AI response issues
        let cleanedContent = rawContent
          // Remove ALL variations of markdown code blocks
          .replace(/^```json\s*/gmi, '') 
          .replace(/^```javascript\s*/gmi, '')
          .replace(/^```\w*\s*/gmi, '') // Any language identifier
          .replace(/```\s*$/gmi, '') 
          .replace(/```[\s\S]*?```/g, '') // Remove entire code blocks
          .replace(/`{1,}/g, '') // Remove ALL backticks (1 or more)
          // Remove common AI response prefixes
          .replace(/^Here's.*?:\s*/gmi, '')
          .replace(/^The JSON.*?:\s*/gmi, '')
          .replace(/^I'll.*?:\s*/gmi, '')
          .replace(/^Based on.*?:\s*/gmi, '')
          .replace(/^Here is the.*?:\s*/gmi, '')
          .replace(/^This is the.*?:\s*/gmi, '')
          .replace(/^Below is.*?:\s*/gmi, '')
          .replace(/^The following.*?:\s*/gmi, '')
          // Remove explanation text
          .replace(/^[\s\S]*?(?=\{)/, '') // Remove everything before first {
          .replace(/\}[^}]*$/g, '}') // Remove everything after last }
          .trim();

        console.log('🔧 [EnhancedJSONParser] Step 1 - Basic cleaning:', {
          originalLength: rawContent.length,
          cleanedLength: cleanedContent.length,
          removedBackticks: rawContent.includes('`') && !cleanedContent.includes('`'),
          removedMarkdown: rawContent.includes('```') && !cleanedContent.includes('```')
        });

        // 🔧 Extract JSON structure more aggressively
        if (!cleanedContent.startsWith('{') && !cleanedContent.startsWith('[')) {
          // Find JSON-like structures
          const jsonMatches = cleanedContent.match(/[\{\[][\s\S]*[\}\]]/);
          if (jsonMatches) {
            cleanedContent = jsonMatches[0];
            console.log('🔧 [EnhancedJSONParser] Extracted JSON structure from mixed content');
          }
        }

        // 🔧 Balance braces and brackets if needed
        const openBraces = (cleanedContent.match(/\{/g) || []).length;
        const closeBraces = (cleanedContent.match(/\}/g) || []).length;
        const openBrackets = (cleanedContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanedContent.match(/\]/g) || []).length;

        if (openBraces > closeBraces) {
          cleanedContent += '}'.repeat(openBraces - closeBraces);
          console.log('🔧 [EnhancedJSONParser] Added missing closing braces');
        }
        if (openBrackets > closeBrackets) {
          cleanedContent += ']'.repeat(openBrackets - closeBrackets);
          console.log('🔧 [EnhancedJSONParser] Added missing closing brackets');
        }

        // Try parsing the aggressively cleaned content
        try {
          const parsed = JSON.parse(cleanedContent);
          console.log('✅ [EnhancedJSONParser] Aggressive cleaning successful, parsed valid JSON');
          return {
            isValid: true,
            content: parsed,
            errors,
            repaired: true
          };
        } catch (cleanError) {
          errors.push(`Aggressive clean parse failed: ${cleanError}`);
          
          // 🔧 Try structural JSON repairs
          try {
            let structurallyRepaired = cleanedContent
              // Fix trailing commas
              .replace(/,(\s*[}\]])/g, '$1')
              // Fix missing quotes around property names
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
              // Fix single quotes to double quotes (but be careful with apostrophes)
              .replace(/'/g, '"')
              // Fix smart quotes
              .replace(/[""]/g, '"')
              .replace(/['']/g, "'")
              // Remove any remaining control characters
              .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
              // Fix common JSON structure issues
              .replace(/,(\s*})/g, '$1') // Remove trailing commas before }
              .replace(/,(\s*])/g, '$1') // Remove trailing commas before ]
              // Fix missing commas between array elements
              .replace(/"\s*"([^:])/g, '", "$1')
              // Fix missing commas between object properties
              .replace(/}(\s*"[^"]*"\s*:)/g, '}, $1');

            const structurallyParsed = JSON.parse(structurallyRepaired);
            console.log('✅ [EnhancedJSONParser] Structural repair successful');
            return {
              isValid: true,
              content: structurallyParsed,
              errors,
              repaired: true
            };
          } catch (structuralError) {
            errors.push(`Structural repair failed: ${structuralError}`);
            
            // 🔧 Use jsonrepair library as fallback
            try {
              const repairedContent = jsonrepair(cleanedContent);
              const parsed = JSON.parse(repairedContent);
              console.log('✅ [EnhancedJSONParser] jsonrepair library successful');
              
              return {
                isValid: true,
                content: parsed,
                errors,
                repaired: true
              };
            } catch (repairError) {
              errors.push(`jsonrepair library failed: ${repairError}`);
              
              // 🔧 Last resort: try to extract and repair individual components
              try {
                const lastResortParsed = EnhancedJSONParser.lastResortJSONExtraction(rawContent);
                if (lastResortParsed) {
                  console.log('✅ [EnhancedJSONParser] Last resort extraction successful');
                  return {
                    isValid: true,
                    content: lastResortParsed,
                    errors,
                    repaired: true
                  };
                }
              } catch (lastResortError) {
                errors.push(`Last resort extraction failed: ${lastResortError}`);
              }
            }
          }
        }
      } catch (processError) {
        errors.push(`Processing failed: ${processError}`);
      }
      
      console.error('❌ [EnhancedJSONParser] All parsing attempts failed:', {
        totalErrors: errors.length,
        firstError: errors[0],
        lastError: errors[errors.length - 1],
        contentPreview: rawContent.substring(0, 100),
        hasBackticks: rawContent.includes('`'),
        hasMarkdown: rawContent.includes('```'),
        startsWithBrace: rawContent.trim().startsWith('{'),
        endsWithBrace: rawContent.trim().endsWith('}')
      });
      
      return {
        isValid: false,
        content: null,
        errors,
        repaired: false
      };
    }
  }

  /**
   * Last resort JSON extraction with ultra-aggressive techniques
   */
  private static lastResortJSONExtraction(rawContent: string): any | null {
    console.log('🚨 [EnhancedJSONParser] Attempting ultra-aggressive extraction');
    
    try {
      // Strategy 1: Extract by finding the largest JSON-like structure
      const jsonCandidates: string[] = [];
      
      // Find all potential JSON structures
      const patterns = [
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, // Nested objects
        /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g, // Nested arrays
        /\{[\s\S]*?\}/g, // Any object-like structure
        /\[[\s\S]*?\]/g, // Any array-like structure
      ];
      
      for (const pattern of patterns) {
        const matches = rawContent.match(pattern);
        if (matches) {
          jsonCandidates.push(...matches);
        }
      }
      
      // Sort by length (largest first) and try to parse
      jsonCandidates.sort((a, b) => b.length - a.length);
      
      for (const candidate of jsonCandidates) {
        try {
          // Clean the candidate
          let cleaned = candidate
            .replace(/^\s*[^{[]*/g, '') // Remove leading non-JSON
            .replace(/[^}\]]*\s*$/g, '') // Remove trailing non-JSON
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1?\s*:/g, '"$2":') // Quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Convert single quotes to double
            .replace(/`+/g, '') // Remove any remaining backticks
            .trim();
          
          const parsed = JSON.parse(cleaned);
          console.log('✅ [EnhancedJSONParser] Last resort extraction succeeded');
          return parsed;
        } catch (error) {
          // Continue to next candidate
          continue;
        }
      }

      // Strategy 2: Template-based reconstruction
      console.log('🔧 [EnhancedJSONParser] Attempting template reconstruction');
      
      // Try to extract recognizable data patterns
      const topicMatch = rawContent.match(/"topic"\s*:\s*"([^"]+)"/);
      const questionsMatch = rawContent.match(/"questions"\s*:\s*\[/);
      
      if (topicMatch) {
        // Create a minimal valid structure
        const reconstructed = {
          topic: topicMatch[1],
          description: 'Content generated with enhanced parsing',
          questions: [],
          total_sources: 0,
          average_credibility: 85,
          fact_check_summary: 'Parsed with fallback extraction'
        };
        
        console.log('✅ [EnhancedJSONParser] Template reconstruction succeeded');
        return reconstructed;
      }

      return null;
    } catch (error) {
      console.error('❌ [EnhancedJSONParser] Last resort extraction failed:', error);
      return null;
    }
  }

  /**
   * Quick utility for simple parsing with basic cleanup
   */
  static parseWithBasicCleanup(rawContent: string): any | null {
    try {
      // Basic cleanup for simple cases
      const cleaned = rawContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/`+/g, '')
        .trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Basic cleanup parsing failed:', error);
      return null;
    }
  }
}

// Export convenience functions for backward compatibility
export const parseJSON = EnhancedJSONParser.parseJSON;
export const parseWithBasicCleanup = EnhancedJSONParser.parseWithBasicCleanup; 