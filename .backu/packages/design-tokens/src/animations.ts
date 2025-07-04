// CivicSense Animation System
// Purposeful motion that respects accessibility preferences

export const animations = {
  // Duration tokens
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Civic-specific easing (more human, democratic feel)
    civic: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Subtle bounce for engagement
    action: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Confident action feeling
    reveal: 'cubic-bezier(0.19, 1, 0.22, 1)',    // Truth revelation feeling
  },
  
  // Common animation patterns
  patterns: {
    fadeIn: {
      keyframes: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    
    fadeOut: {
      keyframes: {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
    },
    
    slideUp: {
      keyframes: {
        from: { transform: 'translateY(20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      duration: '300ms',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    
    slideDown: {
      keyframes: {
        from: { transform: 'translateY(-20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      duration: '300ms',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    
    scaleIn: {
      keyframes: {
        from: { transform: 'scale(0.95)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
      },
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Civic-specific animations
  civic: {
    // Quiz interactions
    quiz: {
      questionReveal: {
        duration: '400ms',
        easing: 'cubic-bezier(0.19, 1, 0.22, 1)', // Truth revelation
      },
      optionHover: {
        duration: '150ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      answerFeedback: {
        duration: '300ms',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Civic bounce
      },
      progressUpdate: {
        duration: '500ms',
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Confident progress
      },
    },
    
    // Action step animations
    actionSteps: {
      appear: {
        duration: '300ms',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        delay: '100ms', // Staggered appearance
      },
      emphasis: {
        duration: '200ms',
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
    
    // Uncomfortable truth reveal
    truthReveal: {
      duration: '600ms',
      easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '50%': { opacity: 0.7, transform: 'translateY(5px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
    },
    
    // Power dynamics visualization
    powerFlow: {
      duration: '800ms',
      easing: 'linear',
      iterationCount: 'infinite',
    },
  },
  
  // Interaction feedback
  interactions: {
    button: {
      hover: {
        duration: '150ms',
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      press: {
        duration: '100ms',
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
    
    card: {
      hover: {
        duration: '200ms',
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      press: {
        duration: '150ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    
    focus: {
      duration: '200ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Loading states
  loading: {
    spinner: {
      duration: '1000ms',
      easing: 'linear',
      iterationCount: 'infinite',
    },
    
    skeleton: {
      duration: '1500ms',
      easing: 'ease-in-out',
      iterationCount: 'infinite',
      direction: 'alternate',
    },
    
    pulse: {
      duration: '2000ms',
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      iterationCount: 'infinite',
    },
  },
  
  // Accessibility considerations
  accessibility: {
    // Reduced motion variants
    reducedMotion: {
      duration: '0.01ms',
      easing: 'linear',
    },
    
    // Essential animations (allowed even with reduced motion)
    essential: {
      focus: {
        duration: '100ms',
        easing: 'linear',
      },
      stateChange: {
        duration: '100ms',
        easing: 'linear',
      },
    },
  },
} as const;

// Animation utility types
export type AnimationDuration = keyof typeof animations.duration;
export type AnimationEasing = keyof typeof animations.easing;
export type AnimationPattern = keyof typeof animations.patterns;
export type CivicAnimation = keyof typeof animations.civic;
export type InteractionAnimation = keyof typeof animations.interactions; 