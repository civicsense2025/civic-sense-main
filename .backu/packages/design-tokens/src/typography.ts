// CivicSense Typography System
// Civic education focused typography for clarity and accessibility

export const typography = {
  // Font families
  fontFamily: {
    civic: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    reading: ['Merriweather', 'Georgia', 'Times New Roman', 'serif'],
    mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
  },
  
  // Font sizes (based on 16px base)
  fontSize: {
    xs: 12,    // Caption text
    sm: 14,    // Small text
    base: 16,  // Body text
    lg: 18,    // Large body
    xl: 20,    // Subsection
    '2xl': 24, // Section header
    '3xl': 32, // Page title
    '4xl': 48, // Hero headline
    '5xl': 64, // Display
  },
  
  // Font weights
  fontWeight: {
    normal: 400,    // Regular
    medium: 500,    // Medium
    semibold: 600,  // Semibold
    bold: 700,      // Bold
  },
  
  // Line heights (optimized for readability)
  lineHeight: {
    tight: 1.1,     // Hero headlines
    snug: 1.2,      // Page titles
    normal: 1.3,    // Section headers
    relaxed: 1.4,   // Subsections & captions
    loose: 1.6,     // Body text (optimal for reading)
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0em',
    wide: '0.01em',
    wider: '0.025em',
  },
  
  // Size variants
  size: {
    xs: {
      fontSize: 12,
      lineHeight: 1.4,
    },
    sm: {
      fontSize: 14,
      lineHeight: 1.5,
    },
    base: {
      fontSize: 16,
      lineHeight: 1.6,
    },
    lg: {
      fontSize: 18,
      lineHeight: 1.6,
    },
    xl: {
      fontSize: 20,
      lineHeight: 1.4,
    },
    '2xl': {
      fontSize: 24,
      lineHeight: 1.3,
    },
    '3xl': {
      fontSize: 32,
      lineHeight: 1.2,
    },
    '4xl': {
      fontSize: 48,
      lineHeight: 1.1,
    },
  },
  
  // Civic-specific typography styles
  civic: {
    hero: {
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    title: {
      fontSize: 32,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    subtitle: {
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '0em',
    },
    body: {
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    caption: {
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.01em',
    },
    
    // Civic education specific styles
    quiz: {
      question: {
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.4,
      },
      option: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      explanation: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.6,
      },
    },
    
    actionSteps: {
      title: {
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.3,
      },
      step: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
    
    uncomfortableTruth: {
      title: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
      },
      content: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.6,
      },
    },
  },
  
  // Reading optimization
  reading: {
    maxWidth: '75ch', // Optimal line length for readability
    paragraphSpacing: '1.5em', // Space between paragraphs
  },
} as const;

// Typography utility types
export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LineHeight = keyof typeof typography.lineHeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;
export type SizeVariant = keyof typeof typography.size; 