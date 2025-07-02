// UI Strings System
export * from './strings'
export * from './hooks/useUIStrings'

// Components
export { UIStringsDemo } from './components/UIStringsDemo'

// Types (add as needed)
export type { Language } from './types'

// Re-export commonly used UI string utilities for convenience
export { uiStrings } from './strings'
export { 
  ui, 
  useUIString, 
  useUIStrings, 
  useUISection,
  useQuizStrings,
  useNavigationStrings,
  useCommonStrings,
  UIText,
  replaceParams,
  useUIStringWithParams
} from './hooks/useUIStrings'
