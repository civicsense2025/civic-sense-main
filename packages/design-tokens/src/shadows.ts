// CivicSense Shadow System
// Subtle, purposeful shadows for depth and hierarchy

export const shadows = {
  // Base shadows
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Component-specific shadows
  component: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  
  // Civic-specific shadows
  civic: {
    // Quiz component shadows
    quiz: {
      question: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      option: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      optionHover: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      optionSelected: 'inset 0 2px 4px 0 rgba(224, 166, 62, 0.1)', // Primary color inset
    },
    
    // Action components
    action: {
      card: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      primaryButton: '0 2px 4px -1px rgba(224, 166, 62, 0.3), 0 1px 2px -1px rgba(224, 166, 62, 0.2)',
      urgentButton: '0 2px 4px -1px rgba(220, 38, 38, 0.3), 0 1px 2px -1px rgba(220, 38, 38, 0.2)',
    },
    
    // Content elevation
    content: {
      uncomfortableTruth: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
      powerDynamics: '0 4px 6px -1px rgba(124, 58, 237, 0.1), 0 2px 4px -1px rgba(124, 58, 237, 0.06)',
      evidence: '0 2px 4px -1px rgba(59, 130, 246, 0.1), 0 1px 2px -1px rgba(59, 130, 246, 0.06)',
    },
  },
  
  // Focus shadows (accessibility)
  focus: {
    default: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    primary: '0 0 0 3px rgba(224, 166, 62, 0.1)',
    error: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    success: '0 0 0 3px rgba(5, 150, 105, 0.1)',
  },
} as const;

// Shadow utility types
export type ShadowToken = keyof typeof shadows;
export type ComponentShadow = keyof typeof shadows.component;
export type CivicShadow = keyof typeof shadows.civic;
export type FocusShadow = keyof typeof shadows.focus; 