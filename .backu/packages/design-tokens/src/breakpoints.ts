// CivicSense Responsive Breakpoints
// Mobile-first approach for democratic accessibility

export const breakpoints = {
  // Base breakpoint values (px)
  values: {
    xs: 0,      // Mobile (all devices)
    sm: 640,    // Large phones
    md: 768,    // Tablets
    lg: 1024,   // Small laptops
    xl: 1280,   // Large screens
    '2xl': 1536, // Very large screens
  },
  
  // Media query helpers
  up: {
    sm: `(min-width: 640px)`,
    md: `(min-width: 768px)`,
    lg: `(min-width: 1024px)`,
    xl: `(min-width: 1280px)`,
    '2xl': `(min-width: 1536px)`,
  },
  
  down: {
    xs: `(max-width: 639px)`,
    sm: `(max-width: 767px)`,
    md: `(max-width: 1023px)`,
    lg: `(max-width: 1279px)`,
    xl: `(max-width: 1535px)`,
  },
  
  only: {
    xs: `(max-width: 639px)`,
    sm: `(min-width: 640px) and (max-width: 767px)`,
    md: `(min-width: 768px) and (max-width: 1023px)`,
    lg: `(min-width: 1024px) and (max-width: 1279px)`,
    xl: `(min-width: 1280px) and (max-width: 1535px)`,
    '2xl': `(min-width: 1536px)`,
  },
  
  // Container max widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Civic-specific responsive patterns
  civic: {
    // Quiz layout breakpoints
    quiz: {
      singleColumn: `(max-width: 767px)`,   // Mobile: stack questions
      twoColumn: `(min-width: 768px)`,      // Tablet+: side-by-side
      largeScreen: `(min-width: 1280px)`,   // Desktop: expanded layout
    },
    
    // Navigation breakpoints
    navigation: {
      mobileMenu: `(max-width: 1023px)`,    // Show mobile menu
      desktopMenu: `(min-width: 1024px)`,   // Show desktop menu
    },
    
    // Content layout
    content: {
      narrow: `(max-width: 767px)`,         // Single column
      wide: `(min-width: 768px)`,           // Multi-column possible
      reading: `(max-width: 768px)`,        // Optimal reading width
    },
  },
} as const;

// Breakpoint utility types
export type BreakpointValue = keyof typeof breakpoints.values;
export type MediaQuery = string;
export type ContainerSize = keyof typeof breakpoints.container; 