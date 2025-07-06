import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', ...fontFamily.sans],
        mono: ['Monaco', 'Menlo', 'Courier New', 'monospace'],
        'space-mono': ['var(--font-space-mono)', 'Monaco', 'Menlo', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          secondary: "hsl(var(--foreground-secondary))",
          tertiary: "hsl(var(--foreground-tertiary))",
          muted: "hsl(var(--foreground-muted))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Multiplayer theme colors
        multiplayer: {
          bg: "hsl(var(--multiplayer-bg))",
          card: {
            DEFAULT: "hsl(var(--multiplayer-card))",
            hover: "hsl(var(--multiplayer-card-hover))",
          },
          border: "hsl(var(--multiplayer-border))",
          text: {
            DEFAULT: "hsl(var(--multiplayer-text))",
            muted: "hsl(var(--multiplayer-text-muted))",
          },
          accent: {
            DEFAULT: "hsl(var(--multiplayer-accent))",
            light: "hsl(var(--multiplayer-accent-light))",
          },
          success: {
            DEFAULT: "hsl(var(--multiplayer-success))",
            light: "hsl(var(--multiplayer-success-light))",
          },
          warning: {
            DEFAULT: "hsl(var(--multiplayer-warning))",
            light: "hsl(var(--multiplayer-warning-light))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%": {
            opacity: "0.6",
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)",
          },
          "70%": {
            opacity: "0",
            boxShadow: "0 0 0 10px hsl(var(--primary) / 0)",
          },
          "100%": {
            opacity: "0",
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0)",
          },
        },
        "breathe-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4), 0 4px 16px hsl(var(--foreground) / 0.1)",
          },
          "50%": {
            boxShadow: "0 0 0 6px hsl(var(--primary) / 0.3), 0 6px 20px hsl(var(--primary) / 0.2)",
          },
        },
        "gentle-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--success) / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--success) / 0.5)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "gentle-scale": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
        "slide-in-from-bottom": {
          "from": { opacity: "0", transform: "translateY(16px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-top": {
          "from": { opacity: "0", transform: "translateY(-16px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "from": { opacity: "0", transform: "translateX(-16px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "from": { opacity: "0", transform: "translateX(16px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "zoom-in": {
          "from": { opacity: "0", transform: "scale(0.95)" },
          "to": { opacity: "1", transform: "scale(1)" },
        },
        "word-highlight-pulse": {
          "0%": { boxShadow: "0 2px 4px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 4px 8px hsl(var(--primary) / 0.5)" },
          "100%": { boxShadow: "0 2px 4px hsl(var(--primary) / 0.3)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "breathe-glow": "breathe-glow 3s ease-in-out infinite",
        "gentle-glow": "gentle-glow 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "gentle-scale": "gentle-scale 0.5s ease-in-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.4s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "zoom-in": "zoom-in 0.3s ease-out",
        "word-highlight-pulse": "word-highlight-pulse 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)',
        'success-glow': '0 0 20px hsl(var(--success) / 0.3)',
        'accent-glow': '0 0 20px hsl(var(--accent) / 0.3)',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;