/**
 * Enhanced Localization Hook
 * 
 * Combines UI strings with date/number formatting for comprehensive localization
 * Provides a single interface for all localization needs in CivicSense mobile app
 */

import useUIStringsHook from './useUIStrings'
import type { UIStrings } from '../ui-strings'
import CivicLocaleFormatter, { LOCALE_FORMATTING } from '../localization/date-number-formatter'

export interface LocalizedFormatting {
  // UI Strings (existing functionality)
  uiStrings: UIStrings
  currentLocale: string
  isLoading: boolean
  setUILanguage: (language: string) => Promise<void>
  
  // Date formatting
  formatDate: (date: Date, format?: 'short' | 'medium' | 'long') => string
  formatRelativeDate: (date: Date) => string
  formatTime: (date: Date) => string
  
  // Number formatting
  formatNumber: (num: number) => string
  formatCurrency: (amount: number, currencyCode?: string) => string
  formatPercentage: (num: number) => string
  
  // Civic-specific formatting
  formatVotingNumbers: (votes: number) => string
  formatDistrict: (districtNumber: number) => string
  formatTerm: (years: number) => string
  
  // Locale utilities
  isRTL: boolean
  timeZoneDefault: string
  timeFormat: '12h' | '24h'
  currencySymbol: string
  
  // Enhanced UI string functions with formatting
  formatNewsDate: (dateString: string) => string
  formatQuizProgress: (current: number, total: number) => string
  formatPlayerCount: (count: number) => string
  formatScore: (score: number, maxScore?: number) => string
}

export function useLocalizedFormatting(): LocalizedFormatting {
  const { currentLanguage, uiStrings, setUILanguage, isLoading } = useUIStringsHook()
  const formatter = new CivicLocaleFormatter(currentLanguage)
  const localeRules = LOCALE_FORMATTING[currentLanguage] || LOCALE_FORMATTING['en']
  
  return {
    // Pass through existing UI strings functionality
    uiStrings,
    currentLocale: currentLanguage,
    isLoading,
    setUILanguage,
    
    // Date formatting methods
    formatDate: (date: Date, format: 'short' | 'medium' | 'long' = 'medium') => 
      formatter.formatDate(date, format),
    
    formatRelativeDate: (date: Date) => formatter.formatRelativeDate(date),
    
    formatTime: (date: Date) => formatter.formatTime(date),
    
    // Number formatting methods
    formatNumber: (num: number) => formatter.formatNumber(num),
    
    formatCurrency: (amount: number, currencyCode?: string) => 
      formatter.formatCurrency(amount, currencyCode),
    
    formatPercentage: (num: number) => formatter.formatPercentage(num),
    
    // Civic-specific formatting methods
    formatVotingNumbers: (votes: number) => formatter.formatVotingNumbers(votes),
    
    formatDistrict: (districtNumber: number) => formatter.formatDistrict(districtNumber),
    
    formatTerm: (years: number) => formatter.formatTerm(years),
    
    // Locale utilities
    isRTL: CivicLocaleFormatter.isRTL(currentLanguage),
    timeZoneDefault: localeRules.timeZone.default,
    timeFormat: localeRules.timeZone.format,
    currencySymbol: localeRules.numberFormat.currency.symbol,
    
    // Enhanced UI string functions with formatting
    formatNewsDate: (dateString: string) => {
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString
        
        const now = new Date()
        const diffInMs = now.getTime() - date.getTime()
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        
        if (diffInMinutes < 60) {
          return `${diffInMinutes}m ${uiStrings.news.ago || 'ago'}`
        }
        if (diffInHours < 24) {
          return `${diffInHours}h ${uiStrings.news.ago || 'ago'}`
        }
        
        const relativeDate = formatter.formatRelativeDate(date)
        return relativeDate
      } catch {
        return dateString
      }
    },
    
    formatQuizProgress: (current: number, total: number) => {
      const currentFormatted = formatter.formatNumber(current)
      const totalFormatted = formatter.formatNumber(total)
      
      // Use localized question string if available
      const questionText = uiStrings.multiplayer?.question || uiStrings.quiz?.question || 'Question'
      
      return `${questionText} ${currentFormatted}/${totalFormatted}`
    },
    
    formatPlayerCount: (count: number) => {
      const countFormatted = formatter.formatNumber(count)
      const playersText = count === 1 
        ? 'player'
        : (uiStrings.multiplayer?.players || 'players')
      
      return `${countFormatted} ${playersText}`
    },
    
    formatScore: (score: number, maxScore?: number) => {
      const scoreFormatted = formatter.formatNumber(score)
      
      if (maxScore !== undefined) {
        const maxScoreFormatted = formatter.formatNumber(maxScore)
        return `${scoreFormatted}/${maxScoreFormatted}`
      }
      
      // Check if score should be treated as percentage
      if (score <= 100 && score >= 0 && Number.isInteger(score)) {
        return formatter.formatPercentage(score)
      }
      
      return scoreFormatted
    }
  }
}

// Re-export the existing useUIStrings hook for convenience
export { default as useUIStrings } from './useUIStrings'

// Convenience hook for components that only need formatting
export function useFormatter() {
  const { currentLanguage } = useUIStringsHook()
  return new CivicLocaleFormatter(currentLanguage)
}

export default useLocalizedFormatting 