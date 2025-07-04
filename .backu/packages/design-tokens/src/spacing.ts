// CivicSense Spacing System
// 8-point grid system for consistent rhythm and layout

export const spacing = {
  // Base spacing scale (8px grid)
  xs: 4,    // 0.5 units
  sm: 8,    // 1 unit
  md: 16,   // 2 units
  lg: 24,   // 3 units
  xl: 32,   // 4 units
  '2xl': 48,  // 6 units
  '3xl': 64,  // 8 units
  '4xl': 96,  // 12 units
  '5xl': 128, // 16 units
  '6xl': 192, // 24 units
  
  // Semantic spacing
  component: {
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    margin: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    },
    gap: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
  },
  
  // Layout spacing
  layout: {
    container: {
      xs: 16,    // Mobile padding
      sm: 24,    // Tablet padding
      md: 32,    // Desktop padding
      lg: 48,    // Large desktop padding
    },
    section: {
      xs: 32,    // Mobile section spacing
      sm: 48,    // Tablet section spacing
      md: 64,    // Desktop section spacing
      lg: 96,    // Large section spacing
    },
  },
  
  // Civic education specific spacing
  civic: {
    quiz: {
      questionSpacing: 24,
      optionSpacing: 12,
      progressSpacing: 16,
    },
    card: {
      padding: 24,
      margin: 16,
      headerSpacing: 16,
    },
    actionSteps: {
      stepSpacing: 16,
      iconSpacing: 12,
      containerPadding: 20,
    },
  },
} as const;

// Spacing utility types
export type SpacingToken = keyof typeof spacing;
export type ComponentSpacing = keyof typeof spacing.component;
export type LayoutSpacing = keyof typeof spacing.layout;
export type CivicSpacing = keyof typeof spacing.civic; 