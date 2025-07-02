// Language types for UI strings
export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi'

// UI component types
export interface UIComponentProps {
  className?: string
  children?: React.ReactNode
}
